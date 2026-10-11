import {
  readFileSync,
  existsSync,
  statSync,
  lstatSync,
  realpathSync,
  openSync,
  closeSync,
  readSync,
  constants,
  fstatSync,
} from "node:fs";
import { createHash } from "node:crypto";
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
export const IDENTITY_SQL = `select jsonb_build_object('database',current_database(),'login',current_user,'version',current_setting('server_version_num')::integer,'tls',coalesce((select ssl from pg_stat_ssl where pid=pg_backend_pid()),false),'superuser',(select rolsuper from pg_roles where rolname=current_user),'create_role',(select rolcreaterole from pg_roles where rolname=current_user),'replication',(select rolreplication from pg_roles where rolname=current_user),'bypass_rls',(select rolbypassrls from pg_roles where rolname=current_user),'create_database',has_database_privilege(current_user,current_database(),'CREATE'),'create_public',has_schema_privilege(current_user,'public','CREATE'));`;

/** Catalog-only checks against the PROD login. Never connects to DEV. */
export async function assertProductionTargetState(session: Session, empty: boolean) {
  const safe = await session.json<boolean>(`select (
    not has_database_privilege(current_user,'congofoot_teka_edu_dev','CONNECT')
    and exists(select 1 from pg_roles where rolname='congofoot_user_teka_edu_dev')
    and not has_database_privilege('congofoot_user_teka_edu_dev',current_database(),'CONNECT')
    and not exists(select 1 from pg_namespace where nspname not in ('public','extensions','private','teka_migrations','information_schema') and nspname !~ '^pg_')
    ${empty ? "and not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private','extensions','teka_migrations')) and not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private','extensions','teka_migrations')) and not exists(select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname in ('public','private','extensions','teka_migrations')) and not exists(select 1 from pg_extension where extname <> 'plpgsql') and not exists(select 1 from pg_operator x join pg_namespace n on n.oid=x.oprnamespace where n.nspname in ('public','private','extensions','teka_migrations')) and not exists(select 1 from pg_collation x join pg_namespace n on n.oid=x.collnamespace where n.nspname in ('public','private','extensions','teka_migrations')) and not exists(select 1 from pg_opclass x join pg_namespace n on n.oid=x.opcnamespace where n.nspname in ('public','private','extensions','teka_migrations')) and not exists(select 1 from pg_opfamily x join pg_namespace n on n.oid=x.opfnamespace where n.nspname in ('public','private','extensions','teka_migrations')) and not exists(select 1 from pg_conversion x join pg_namespace n on n.oid=x.connamespace where n.nspname in ('public','private','extensions','teka_migrations')) and not exists(select 1 from pg_foreign_data_wrapper) and not exists(select 1 from pg_foreign_server) and not exists(select 1 from pg_largeobject_metadata) and not exists(select 1 from pg_publication)" : ""}
  );`);
  if (safe !== true)
    throw new Error(
      "Production target isolation or reviewed object baseline failed; no automatic reconciliation is permitted",
    );
}

/** Review live row types/routines through catalogs before any managed data/deparser read. */
export async function assertProductionApplicationShape(session: Session) {
  const oids: Record<string, number> = {
    text: 25,
    smallint: 21,
    boolean: 16,
    date: 1082,
    "smallint[]": 1005,
    jsonb: 3802,
  };
  const baseline = JSON.parse(
    readFileSync(path.join(ROOT, "docs/migration/alwaysdata/expected-schema.json"), "utf8"),
  ) as {
    functions: { name: string; body: string }[];
    tables: { name: string; columns: { name: string; nullable: boolean }[] }[];
  };
  const expected = canonicalTables()
    .flatMap((t) => {
      const table = baseline.tables.find((candidate) => candidate.name === t.table);
      if (!table || table.columns.length !== t.columns.length)
        throw new Error("Reviewed canonical table baseline is incomplete");
      return table.columns.map((column, i) => {
        const c = t.columns.find((candidate) => candidate.name === column.name);
        if (!c || typeof column.nullable !== "boolean" || !oids[c.type])
          throw new Error("Reviewed canonical column baseline is incomplete");
        return `(${literal(t.table)},${i + 1},${literal(c.name)},${oids[c.type]},${!column.nullable})`;
      });
    })
    .join(",");
  const functions = baseline.functions
    .map((f) => `(${literal(f.name)},${literal(sha256(f.body))})`)
    .join(",");
  const safe =
    await session.json<boolean>(`with expected(table_name,position,column_name,type_oid,not_null) as (values ${expected}),
    actual as (select c.relname,a.attnum::integer,a.attname,a.atttypid::integer,a.attnotnull
      from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace join pg_catalog.pg_attribute a on a.attrelid=c.oid
      where n.nspname='public' and c.relkind='r' and a.attnum>0 and not a.attisdropped),
    functions(name,sha) as (values ${functions})
    select (
      not exists(select 1 from pg_catalog.pg_namespace where nspname not in ('public','extensions','private','teka_migrations','information_schema') and nspname !~ '^pg_')
      and
      not exists((select * from actual except all select * from expected) union all (select * from expected except all select * from actual))
      and not exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and c.relkind not in ('i') and (c.relkind<>'r' or c.relam<>2 or c.relpersistence<>'p' or c.relispartition or not c.relrowsecurity or c.relforcerowsecurity))
      and not exists(select 1 from pg_catalog.pg_attribute a join pg_catalog.pg_class c on c.oid=a.attrelid join pg_catalog.pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and c.relkind='r' and a.attnum>0 and (a.attisdropped or a.attgenerated<>'' or a.attidentity<>''))
      and not exists(select 1 from pg_catalog.pg_rewrite r join pg_catalog.pg_class c on c.oid=r.ev_class join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public')
      and not exists(select 1 from pg_catalog.pg_policy p join pg_catalog.pg_class c on c.oid=p.polrelid join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public')
      and not exists(select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public')
      and (select count(*) from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='private')=2
      and not exists(select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
        where n.nspname='private' and (p.prokind<>'f' or p.pronargs<>0 or p.prorettype<>2279 or p.prosecdef or not exists
          (select 1 from functions f where f.name=p.proname and f.sha=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex'))))
      and not exists(select 1 from pg_catalog.pg_extension where extname not in ('plpgsql','btree_gist'))
      and not exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
        where n.nspname in ('private','extensions') or (n.nspname='teka_migrations' and c.relname <> 'history' and not
          (c.relkind='i' and c.relam=403 and c.relname in ('history_pkey','history_filename_key') and exists
            (select 1 from pg_catalog.pg_index i join pg_catalog.pg_class h on h.oid=i.indrelid join pg_catalog.pg_namespace hn on hn.oid=h.relnamespace
             where i.indexrelid=c.oid and hn.nspname='teka_migrations' and h.relname='history' and i.indisunique and i.indisvalid and i.indisready
               and i.indnatts=1 and i.indnkeyatts=1 and i.indexprs is null and i.indpred is null
               and i.indkey[0]=(case c.relname when 'history_pkey' then 1 else 2 end)))))
      and not exists(select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
        where n.nspname='private' and (p.proconfig is distinct from array['search_path=""']::text[] or p.prolang<>(select oid from pg_catalog.pg_language where lanname='plpgsql')))
      and not exists(select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
        where n.nspname='extensions' and not exists(select 1 from pg_catalog.pg_depend d join pg_catalog.pg_extension e on e.oid=d.refobjid where d.classid='pg_catalog.pg_proc'::regclass and d.objid=p.oid and d.refclassid='pg_catalog.pg_extension'::regclass and d.deptype='e' and e.extname='btree_gist'))
    );`);
  if (safe !== true)
    throw new Error(
      "Production application catalog shape/routine baseline drift; data and definitions were not read",
    );
}

export async function initialize(session: Session, connection: Connection) {
  await session.query(
    "set statement_timeout='120s'; set lock_timeout='5s'; set search_path=pg_catalog,public,extensions;",
  );
  const identity = await session.json<Identity>(IDENTITY_SQL);
  assertIdentity(connection, identity);
  return identity;
}
/** Gate and lock the history relation before reading rows or invoking type output. */
export async function assertProductionHistoryShape(session: Session) {
  const exists = await session.json<boolean>(
    "select exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='teka_migrations' and c.relname='history');",
  );
  if (!exists) return;
  // LOCK performs no query evaluation. Unsupported relation kinds fail before row access.
  await session.query("lock table only teka_migrations.history in access share mode;");
  const safe = await session.json<boolean>(`select (
    c.relkind='r' and c.relam=2 and c.relpersistence='p' and not c.relispartition and c.reloftype=0
    and not c.relrowsecurity and not c.relforcerowsecurity
    and pg_catalog.has_table_privilege(c.oid,'SELECT')
    and not exists(select 1 from pg_catalog.pg_inherits where inhparent=c.oid or inhrelid=c.oid)
    and not exists(select 1 from pg_catalog.pg_rewrite where ev_class=c.oid)
    and (select count(*) from pg_catalog.pg_attribute where attrelid=c.oid and attnum>0)=8
    and (select count(*) from pg_catalog.pg_attribute where attrelid=c.oid and attnum>0 and not attisdropped and attnotnull and attgenerated='' and attidentity='' and
      ((attname in ('version','filename','source_sha256','execution_sha256','adapter_version','release_sha','target') and atttypid=25) or (attname='applied_at' and atttypid=1184)))=8
  ) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where n.nspname='teka_migrations' and c.relname='history';`);
  if (safe !== true) throw new Error("Unreviewed production history relation; no rows were read");
}

export async function history(session: Session, connection?: Connection): Promise<History[]> {
  if (connection?.target === "production") await assertProductionHistoryShape(session);
  const exists = await session.json<boolean>(
    "select to_jsonb(to_regclass('teka_migrations.history') is not null);",
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
    if (connection.target === "production") await assertProductionTargetState(session, false);
    const applied = await history(session, connection);
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
    if (connection.target === "production")
      await assertProductionTargetState(session, state.applied === 0);
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
  releaseSha?: string,
) {
  if (!replayPath || !rollbackPath || !approved)
    throw new Error(
      "Staging apply requires CI replay evidence, a pre-mutation rollback record and explicit operator approval",
    );
  assertReplayGates(migrations, replayPath, releaseSha);
  const rollback = JSON.parse(readFileSync(rollbackPath, "utf8"));
  if (
    rollback.database !== "congofoot_teka_edu_dev" ||
    rollback.login !== "congofoot_user_teka_edu_dev" ||
    rollback.pre_migration_tables !== 0 ||
    !rollback.dump_path ||
    !/^[a-f0-9]{64}$/.test(rollback.dump_sha256) ||
    rollback.dump_verified !== true ||
    rollback.coverage !== "atomic-apply-and-protected-empty-dev-dump" ||
    rollback.production_touched !== false
  )
    throw new Error("Empty-DEV backup/restore coverage is insufficient");
  if (
    !existsSync(rollback.dump_path) ||
    (statSync(rollback.dump_path).mode & 0o077) !== 0 ||
    sha256(readFileSync(rollback.dump_path)) !== rollback.dump_sha256
  )
    throw new Error(
      "Protected rollback dump is absent, readable by others or differs from its record",
    );
}

export function assertReplayGates(
  migrations: Migration[],
  replayPath: string,
  releaseSha?: string,
) {
  const replay = JSON.parse(readFileSync(replayPath, "utf8"));
  if (
    replay.status !== "PASS" ||
    replay.release_sha !== releaseSha ||
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
    throw new Error("CI clean replay evidence does not satisfy managed apply gates");
  const baseline = path.join(ROOT, "docs/migration/alwaysdata/expected-schema.json");
  if (
    !existsSync(baseline) ||
    replay.schema_sha256 !== sha256(JSON.stringify(JSON.parse(readFileSync(baseline, "utf8"))))
  )
    throw new Error("Reviewed schema baseline differs from replay evidence");
  return replay;
}

export type ProductionApproval = {
  approved: boolean;
  replayPath?: string;
  rollbackPath?: string;
  recoveryPath?: string;
};

function protectedArchive(filename: unknown, digest: unknown) {
  if (
    typeof filename !== "string" ||
    !path.isAbsolute(filename) ||
    typeof digest !== "string" ||
    !/^[a-f0-9]{64}$/.test(digest)
  )
    throw new Error("Protected archive path/digest is missing");
  const info = lstatSync(filename);
  const resolved = realpathSync(filename);
  if (
    !info.isFile() ||
    info.isSymbolicLink() ||
    (info.mode & 0o077) !== 0 ||
    resolved === ROOT ||
    resolved.startsWith(ROOT + path.sep) ||
    resolved.includes("/www/")
  )
    throw new Error("Archive must be a private regular file outside the repository/web root");
  const fd = openSync(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  let actual: string;
  try {
    const opened = fstatSync(fd);
    if (
      opened.ino !== info.ino ||
      opened.dev !== info.dev ||
      !opened.isFile() ||
      (opened.mode & 0o077) !== 0
    )
      throw new Error("Protected archive changed during verification");
    const hash = createHash("sha256");
    const buffer = Buffer.alloc(1024 * 1024);
    let bytes: number;
    while ((bytes = readSync(fd, buffer, 0, buffer.length, null)) > 0)
      hash.update(buffer.subarray(0, bytes));
    actual = hash.digest("hex");
  } finally {
    closeSync(fd);
  }
  if (actual !== digest) throw new Error("Protected archive differs from its reviewed checksum");
  return { path: resolved, device: statSync(filename).dev };
}

/** Local prerequisite checks only. They never connect, create evidence, or reset a target. */
export function assertProductionGates(
  migrations: Migration[],
  approval: ProductionApproval | undefined,
  releaseSha: string,
) {
  if (
    !approval?.approved ||
    !approval.replayPath ||
    !approval.rollbackPath ||
    !approval.recoveryPath ||
    !/^[a-f0-9]{40}$/.test(releaseSha)
  )
    throw new Error(
      "Production execution requires explicit approval, exact SHA, CI replay, target rollback and verified source recovery",
    );
  const replay = assertReplayGates(migrations, approval.replayPath, releaseSha);
  if (replay.gates?.production_catalog_shapes !== true)
    throw new Error("CI production catalog-shape regressions did not pass");
  const rollback = JSON.parse(readFileSync(approval.rollbackPath, "utf8"));
  if (
    rollback.database !== "congofoot_teka_edu_prod" ||
    rollback.login !== "congofoot_user_teka_edu_prod" ||
    rollback.pre_migration_tables !== 0 ||
    rollback.release_sha !== releaseSha ||
    rollback.pre_migration_history !== 0 ||
    rollback.pre_migration_application_objects !== 0 ||
    rollback.dump_verified !== true ||
    rollback.coverage !== "atomic-apply-and-protected-empty-prod-dump"
  )
    throw new Error("Reviewed empty-PROD rollback coverage is insufficient");
  protectedArchive(rollback.dump_path, rollback.dump_sha256);
  const recovery = JSON.parse(readFileSync(approval.recoveryPath, "utf8"));
  if (
    recovery.status !== "PASS" ||
    recovery.project !== "eganrivpkjhozkkahyxy" ||
    recovery.host !== "db.eganrivpkjhozkkahyxy.supabase.co" ||
    recovery.database !== "postgres" ||
    recovery.login !== "postgres" ||
    recovery.server_major !== 17 ||
    recovery.tls_verify_full !== true ||
    recovery.backup_scope_verified !== true ||
    recovery.auth_users !== 0 ||
    recovery.auth_identities !== 0 ||
    recovery.storage_buckets !== 0 ||
    recovery.storage_objects !== 0 ||
    recovery.canonical?.tables !== 36 ||
    recovery.canonical?.rows !== 6170 ||
    recovery.canonical?.exact !== true ||
    recovery.original_restore_verified !== true ||
    recovery.restored_archive_sha256 !== recovery.archive_sha256 ||
    recovery.independent_sha256 !== recovery.archive_sha256 ||
    recovery.source_frozen !== true ||
    recovery.independent_physical_media_verified !== true ||
    recovery.independent_volume !== "VALERY"
  )
    throw new Error(
      "Source recovery/scope evidence does not permit the canonical-only production rebuild",
    );
  const original = protectedArchive(recovery.archive_path, recovery.archive_sha256);
  const independent = protectedArchive(recovery.independent_path, recovery.independent_sha256);
  if (original.path === independent.path || original.device === independent.device)
    throw new Error(
      "Source recovery copies must be on different filesystems as well as owner-verified physical media",
    );
  return {
    source_sha256: recovery.archive_sha256 as string,
    independent_sha256: recovery.independent_sha256 as string,
    source_restore_verified: true,
    target_snapshot_sha256: rollback.dump_sha256 as string,
  };
}

export async function apply(
  session: Session,
  connection: Connection,
  migrations: Migration[],
  releaseSha: string,
  productionApproval?: ProductionApproval,
) {
  if (connection.target === "production")
    assertProductionGates(migrations, productionApproval, releaseSha);
  if (!/^[a-f0-9]{40}$/.test(releaseSha)) throw new Error("A full release SHA is required");
  canonicalTables();
  await session.query("begin;");
  try {
    await session.query(`select pg_advisory_xact_lock(${LOCK_KEY}::bigint);`);
    // Identity and history must be read again AFTER acquiring the transaction lock.
    const identity = await session.json<Identity>(IDENTITY_SQL);
    assertIdentity(connection, identity);
    if (connection.target === "production") await assertProductionTargetState(session, false);
    const applied = await history(session, connection);
    const pending = pendingMigrations(migrations, applied, connection.target);
    if (connection.target === "production")
      await assertProductionTargetState(session, applied.length === 0);
    if (applied.length === 0) {
      const count = await session.json<number>(UNEXPECTED_OBJECTS_SQL);
      if (count !== 0)
        throw new Error("Target is unexpectedly non-empty without migration history");
    }
    if (connection.target === "production" && applied.length > 0) {
      await assertProductionApplicationShape(session);
      await verifyAccess(session, true, true);
    }
    if (connection.target !== "production" || applied.length === 0)
      await session.query(`create schema if not exists extensions; revoke all on schema extensions from public;
      create schema if not exists private; revoke all on schema private from public;
      create schema if not exists teka_migrations; revoke all on schema teka_migrations from public;
      create extension if not exists btree_gist with schema extensions;
      create table if not exists teka_migrations.history (
        version text primary key check(version ~ '^[0-9]{14}$'), filename text not null unique,
        source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
        execution_sha256 text not null check(execution_sha256 ~ '^[a-f0-9]{64}$'),
        adapter_version text not null, applied_at timestamptz not null default now(),
        release_sha text not null check(release_sha ~ '^[a-f0-9]{40}$'),target text not null check(target in (${connection.target === "production" ? "'production'" : "'local','staging'"}))
      ); revoke all on table teka_migrations.history from public;`);
    for (const migration of pending) {
      await session.query(
        migration.sql +
          `\ninsert into teka_migrations.history (version,filename,source_sha256,execution_sha256,adapter_version,release_sha,target) values (${[migration.version, migration.filename, migration.source_sha256, migration.execution_sha256, migration.adapter_version, releaseSha, connection.target].map(literal).join(",")});`,
      );
    }
    if (connection.target === "production") await assertProductionApplicationShape(session);
    const canonical = await verifyCanonical(session);
    const schema = await inventory(session);
    verifySourceInventory(
      schema,
      migrations.map((migration) => migration.sql),
    );
    const access = await verifyAccess(
      session,
      connection.target !== "local",
      connection.target === "production",
    );
    const integrity = await behavioralTests(session, true);
    pendingMigrations(migrations, await history(session, connection), connection.target);
    await session.query("commit;");
    return { applied: pending.length, canonical, schema, access, integrity };
  } catch (error) {
    await session.query("rollback;").catch(() => {});
    throw error;
  }
}

export async function verify(
  session: Session,
  connection: Connection,
  migrations: Migration[],
  releaseSha?: string,
  productionApproval?: ProductionApproval,
) {
  const recovery =
    connection.target === "production"
      ? assertProductionGates(migrations, productionApproval, releaseSha ?? "")
      : undefined;
  const state = await list(session, migrations, connection);
  if (state.pending !== 0)
    throw new Error("Verification requires a completely applied migration chain");
  if (connection.target === "production") await assertProductionTargetState(session, false);
  if (connection.target === "production") await assertProductionApplicationShape(session);
  const canonical = await verifyCanonical(session);
  const schema = await inventory(session);
  verifySourceInventory(
    schema,
    migrations.map((migration) => migration.sql),
  );
  const access = await verifyAccess(
    session,
    connection.target !== "local",
    connection.target === "production",
  );
  const integrity = await behavioralTests(session);
  const idempotency = await syncIdempotency(session);
  return {
    identity: state.identity,
    history: state.applied,
    ...(connection.target === "production" ? { pending: state.pending, recovery } : {}),
    canonical,
    schema,
    access,
    integrity,
    idempotency,
  };
}
