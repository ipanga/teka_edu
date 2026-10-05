import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { Session, literal } from "./session";
import { assertIdentity, type Connection, type Identity } from "./target";
import {
  ROOT,
  pendingMigrations,
  sha256,
  toolingDigest,
  type History,
  type Migration,
} from "./migrations";
import {
  canonicalTables,
  verifyCanonical,
  verifyAccess,
  inventory,
  verifySourceInventory,
  behavioralTests,
  syncIdempotency,
} from "./verify";

export const LOCK_KEY = "721304884926";
const UNEXPECTED_OBJECTS_SQL = `select (
  (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private')) +
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private')) +
  (select count(*) from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname in ('public','private') and t.typtype in ('e','d'))
)::integer;`;
export const metadata = (migrations: Migration[]) =>
  migrations.map((m) => ({
    version: m.version,
    filename: m.filename,
    source_sha256: m.source_sha256,
    execution_sha256: m.execution_sha256,
    adapter_version: m.adapter_version,
    adapted: m.adapted,
  }));
export const IDENTITY_SQL = `select jsonb_build_object('database',current_database(),'login',current_user,'version',current_setting('server_version_num')::integer,'tls',coalesce((select ssl from pg_stat_ssl where pid=pg_backend_pid()),false),'superuser',(select rolsuper from pg_roles where rolname=current_user),'create_database',has_database_privilege(current_user,current_database(),'CREATE'),'create_public',has_schema_privilege(current_user,'public','CREATE'));`;

export async function initialize(session: Session, connection: Connection) {
  await session.query(
    "set statement_timeout='120s'; set lock_timeout='5s'; set search_path=pg_catalog,public,extensions;",
  );
  const identity = await session.json<Identity>(IDENTITY_SQL);
  assertIdentity(connection, identity);
  return identity;
}
export async function history(session: Session): Promise<History[]> {
  const exists = await session.json<boolean>(
    "select to_regclass('teka_migrations.history') is not null;",
  );
  if (!exists) return [];
  return session.json<History[]>(
    "select coalesce(jsonb_agg(to_jsonb(t) order by t.version),'[]') from (select version,filename,source_sha256,execution_sha256,adapter_version,target,release_sha from teka_migrations.history order by version) t;",
  );
}
export async function list(session: Session, migrations: Migration[], connection: Connection) {
  await session.query("begin read only;");
  try {
    const identity = await session.json<Identity>(IDENTITY_SQL);
    assertIdentity(connection, identity);
    const applied = await history(session);
    const pending = pendingMigrations(migrations, applied, connection.target);
    return {
      identity,
      applied: applied.length,
      pending: pending.length,
      migrations: metadata(migrations).map((entry) => ({
        ...entry,
        status: pending.some((migration) => migration.version === entry.version)
          ? "pending"
          : "applied",
      })),
    };
  } finally {
    await session.query("rollback;");
  }
}
export async function preflight(session: Session, migrations: Migration[], connection: Connection) {
  const state = await list(session, migrations, connection);
  await session.query("begin read only;");
  try {
    const capabilities = await session.json<{
      available: boolean;
      trusted: boolean;
      tables: number;
      private_objects: number;
      extensions: unknown[];
    }>(
      `select jsonb_build_object('available',exists(select 1 from pg_available_extensions where name='btree_gist'),'trusted',exists(select 1 from pg_available_extension_versions where name='btree_gist' and trusted),'tables',(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p')),'private_objects',(select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private'),'extensions',(select jsonb_agg(jsonb_build_object('name',extname,'version',extversion)) from pg_extension));`,
    );
    if (
      !capabilities.available ||
      !capabilities.trusted ||
      !state.identity.create_database ||
      !state.identity.create_public
    )
      throw new Error(
        "Required extension/schema capabilities missing; actual install permission still requires controlled apply",
      );
    if (state.applied === 0 && (capabilities.tables !== 0 || capabilities.private_objects !== 0))
      throw new Error("Target is unexpectedly non-empty without migration history");
    if (state.applied === 0 && (await session.json<number>(UNEXPECTED_OBJECTS_SQL)) !== 0)
      throw new Error("Unexpected application schema objects without migration history");
    return { ...state, capabilities, install_permission: "not proved by read-only preflight" };
  } finally {
    await session.query("rollback;");
  }
}

export function assertStagingGates(
  migrations: Migration[],
  replayPath: string | undefined,
  rollbackPath: string | undefined,
  approved: boolean,
) {
  if (!replayPath || !rollbackPath || !approved)
    throw new Error(
      "Staging apply requires CI replay evidence, a pre-mutation rollback record and explicit operator approval",
    );
  const replay = JSON.parse(readFileSync(replayPath, "utf8"));
  if (
    replay.status !== "PASS" ||
    replay.tooling_sha256 !== toolingDigest() ||
    replay.schema_baseline_comparison !== true ||
    replay.server.version < 160000 ||
    replay.server.version >= 170000 ||
    !isDeepStrictEqual(replay.migrations, metadata(migrations)) ||
    replay.canonical.tables !== 36 ||
    replay.canonical.rows !== 6170 ||
    replay.gates?.integrity !== true ||
    replay.gates?.access !== true ||
    replay.gates?.idempotency !== true ||
    replay.gates?.pgtap !== true ||
    replay.gates?.negative_tests !== true
  )
    throw new Error("CI clean replay evidence does not satisfy staging apply gates");
  const baseline = path.join(ROOT, "docs/migration/alwaysdata/expected-schema.json");
  if (
    !existsSync(baseline) ||
    replay.schema_sha256 !== sha256(JSON.stringify(JSON.parse(readFileSync(baseline, "utf8"))))
  )
    throw new Error("Reviewed schema baseline differs from replay evidence");
  const rollback = JSON.parse(readFileSync(rollbackPath, "utf8"));
  if (
    rollback.database !== "congofoot_teka_edu_dev" ||
    rollback.login !== "congofoot_user_teka_edu_dev" ||
    rollback.pre_migration_tables !== 0 ||
    !rollback.dump_path ||
    !/^[a-f0-9]{64}$/.test(rollback.dump_sha256) ||
    rollback.restore_verified !== true ||
    rollback.production_touched !== false
  )
    throw new Error("Empty-DEV backup/restore coverage is insufficient");
}

export async function apply(
  session: Session,
  connection: Connection,
  migrations: Migration[],
  releaseSha: string,
) {
  if (!/^[a-f0-9]{40}$/.test(releaseSha)) throw new Error("A full release SHA is required");
  canonicalTables();
  await session.query("begin;");
  try {
    await session.query(`select pg_advisory_xact_lock(${LOCK_KEY}::bigint);`);
    // Identity and history must be read again AFTER acquiring the transaction lock.
    const identity = await session.json<Identity>(IDENTITY_SQL);
    assertIdentity(connection, identity);
    const applied = await history(session);
    const pending = pendingMigrations(migrations, applied, connection.target);
    if (applied.length === 0) {
      const count = await session.json<number>(UNEXPECTED_OBJECTS_SQL);
      if (count !== 0)
        throw new Error("Target is unexpectedly non-empty without migration history");
    }
    await session.query(`create schema if not exists extensions; revoke all on schema extensions from public;
      create schema if not exists private; revoke all on schema private from public;
      create schema if not exists teka_migrations; revoke all on schema teka_migrations from public;
      create extension if not exists btree_gist with schema extensions;
      create table if not exists teka_migrations.history (
        version text primary key check(version ~ '^[0-9]{14}$'), filename text not null unique,
        source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
        execution_sha256 text not null check(execution_sha256 ~ '^[a-f0-9]{64}$'),
        adapter_version text not null, applied_at timestamptz not null default now(),
        release_sha text not null check(release_sha ~ '^[a-f0-9]{40}$'),target text not null check(target in ('local','staging'))
      ); revoke all on table teka_migrations.history from public;`);
    for (const migration of pending) {
      await session.query(
        migration.sql +
          `\ninsert into teka_migrations.history (version,filename,source_sha256,execution_sha256,adapter_version,release_sha,target) values (${[migration.version, migration.filename, migration.source_sha256, migration.execution_sha256, migration.adapter_version, releaseSha, connection.target].map(literal).join(",")});`,
      );
    }
    const canonical = await verifyCanonical(session);
    const schema = await inventory(session);
    verifySourceInventory(
      schema,
      migrations.map((migration) => migration.sql),
    );
    const access = await verifyAccess(session, connection.target === "staging");
    const integrity = await behavioralTests(session, true);
    pendingMigrations(migrations, await history(session), connection.target);
    await session.query("commit;");
    return { applied: pending.length, canonical, schema, access, integrity };
  } catch (error) {
    await session.query("rollback;").catch(() => {});
    throw error;
  }
}

export async function verify(session: Session, connection: Connection, migrations: Migration[]) {
  const state = await list(session, migrations, connection);
  if (state.pending !== 0)
    throw new Error("Verification requires a completely applied migration chain");
  const canonical = await verifyCanonical(session);
  const schema = await inventory(session);
  verifySourceInventory(
    schema,
    migrations.map((migration) => migration.sql),
  );
  const access = await verifyAccess(session, connection.target === "staging");
  const integrity = await behavioralTests(session);
  const idempotency = await syncIdempotency(session);
  return {
    identity: state.identity,
    history: state.applied,
    canonical,
    schema,
    access,
    integrity,
    idempotency,
  };
}
