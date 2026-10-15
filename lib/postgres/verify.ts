import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { getReferenceData } from "@/lib/content/reference-data";
import { referenceTables, referenceSyncSql } from "@/lib/supabase/reference-sql";
import audit from "@/docs/migration/alwaysdata/migration-audit.json";
import canonicalHash from "@/docs/migration/alwaysdata/canonical-sha256.json";
import { ROOT, executableSql, sha256 } from "./migrations";
import { Session, PostgresJsonResultError } from "./session";
import { AccessValidationError, validateAccessResult } from "./access-result";
import { PRODUCTION_AUDIT_ROLE, auditRoleGuardSql } from "./audit-policy";

export function canonicalTables() {
  const tables = referenceTables(getReferenceData());
  if (sha256(JSON.stringify(tables)) !== canonicalHash.sha256)
    throw new Error("Canonical values changed; explicit reconciliation required");
  const counts = tables.map((table) => ({ table: table.table, rows: table.rows.length }));
  if (!isDeepStrictEqual(counts, audit.canonical.counts))
    throw new Error("Canonical inventory changed; explicit reconciliation required");
  return tables;
}
const normalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(normalize)
    : value !== null && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, item]) => [key, normalize(item)]),
        )
      : value;
const identifier = (value: string) => '"' + value.replaceAll('"', '""') + '"';

export async function verifyCanonical(session: Session) {
  const counts = [];
  for (const table of canonicalTables()) {
    const actual = await session.json<unknown[]>(
      `select coalesce(jsonb_agg(to_jsonb(t)), '[]') from (select ${table.columns.map((column) => identifier(column.name)).join(",")} from public.${identifier(table.table)} order by ${table.key.map(identifier).join(",")}) t;`,
      "CANONICAL",
    );
    // Key ordering from referenceTables is JS string ordering, not PostgreSQL collation.
    const rows = (values: unknown[]) => values.map((row) => JSON.stringify(normalize(row))).sort();
    if (!isDeepStrictEqual(rows(actual), rows([...table.rows])))
      throw new Error(`Canonical row/value mismatch: ${table.table}`);
    counts.push({ table: table.table, rows: actual.length });
  }
  return {
    tables: counts.length,
    rows: counts.reduce((sum, table) => sum + table.rows, 0),
    counts,
  };
}

export type Inventory = {
  tables: {
    name: string;
    rls: boolean;
    force_rls: boolean;
    columns: unknown[];
    constraints: { name: string; type: string }[];
    indexes: { name: string }[];
    triggers: { name: string }[];
    policies: unknown[];
  }[];
  functions: unknown[];
  schemas: string[];
  extensions: { name: string; version: string; schema: string }[];
};
export async function inventory(session: Session) {
  return session.json<Inventory>(
    readFileSync(path.join(ROOT, "scripts/postgres/inventory.sql"), "utf8"),
    "SCHEMA",
  );
}

export async function verifyAccess(session: Session, managed: boolean, production = false) {
  // Consultation applies only to this source-hash-checked registry, never every public object.
  const approvedTables = production
    ? canonicalTables()
        .map((table) => "'" + table.table.replaceAll("'", "''") + "'")
        .join(",")
    : "";
  const auditTableException = production
    ? ` and not exists (select 1 from pg_roles ar where ar.rolname='${PRODUCTION_AUDIT_ROLE}'
        and ar.oid=a.grantee and c.relowner=(select oid from pg_roles where rolname=current_user)
        and c.relkind='r' and c.relname in (${approvedTables})
        and a.privilege_type='SELECT' and not a.is_grantable)`
    : "";
  const auditTableGuard = production
    ? ` and ${auditRoleGuardSql()}
      and not exists (select 1 from pg_roles ar cross join pg_class c join pg_namespace n on n.oid=c.relnamespace
        where ar.rolname='${PRODUCTION_AUDIT_ROLE}' and n.nspname='public' and c.relkind in ('r','p')
        and (has_table_privilege(ar.oid,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,SELECT WITH GRANT OPTION')
          or has_any_column_privilege(ar.oid,c.oid,'INSERT,UPDATE,REFERENCES,SELECT WITH GRANT OPTION')))
      and not exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
        join pg_attribute col on col.attrelid=c.oid and col.attnum>0 and not col.attisdropped
        cross join lateral aclexplode(col.attacl) ca
        where n.nspname='public' and c.relkind in ('r','p') and ca.grantee<>c.relowner
        and ca.grantee<>(select oid from pg_roles where rolname=current_user)
        and not exists (select 1 from pg_roles mr where mr.rolname='congofoot' and mr.oid=ca.grantee))`
    : "";
  const auditFunctionGuard = production
    ? ` and not exists (select 1 from pg_roles ar cross join pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where ar.rolname='${PRODUCTION_AUDIT_ROLE}' and n.nspname in ('public','private') and has_function_privilege(ar.oid,p.oid,'EXECUTE'))`
    : "";
  const historyGuard = production
    ? ` and not exists (select 1 from pg_class hc join pg_namespace hn on hn.oid=hc.relnamespace
        cross join lateral aclexplode(coalesce(hc.relacl,acldefault('r',hc.relowner))) ha
        where hn.nspname='teka_migrations' and hc.relname='history' and ha.grantee<>hc.relowner
        and ha.grantee<>(select oid from pg_roles where rolname=current_user)
        and not exists (select 1 from pg_roles mr where mr.rolname='congofoot' and mr.oid=ha.grantee))
      and not exists (select 1 from pg_class hc join pg_namespace hn on hn.oid=hc.relnamespace
        join pg_attribute col on col.attrelid=hc.oid and col.attnum>0 and not col.attisdropped
        cross join lateral aclexplode(col.attacl) ha
        where hn.nspname='teka_migrations' and hc.relname='history' and ha.grantee<>hc.relowner
        and ha.grantee<>(select oid from pg_roles where rolname=current_user)
        and not exists (select 1 from pg_roles mr where mr.rolname='congofoot' and mr.oid=ha.grantee))`
    : "";
  let value: unknown;
  try {
    value = await session.json<unknown>(`select jsonb_build_object(
    'rls', not exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p') and not c.relrowsecurity),
    'policies', not exists (select 1 from pg_policies where schemaname='public'),
    'table_privileges', not exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a where n.nspname='public' and c.relkind in ('r','p') and a.grantee <> c.relowner and a.grantee <> (select oid from pg_roles where rolname=current_user)${managed ? " and not exists (select 1 from pg_roles r where r.rolname='congofoot' and r.oid=a.grantee)" : ""}${auditTableException})${auditTableGuard},
    'function_privileges', not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where n.nspname='private' and (p.prosecdef or a.grantee <> p.proowner and a.grantee <> (select oid from pg_roles where rolname=current_user)${managed ? " and not exists (select 1 from pg_roles r where r.rolname='congofoot' and r.oid=a.grantee)" : ""}))${auditFunctionGuard},
    'schema_privileges', not exists (select 1 from pg_namespace n cross join lateral aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a where n.nspname in ('private','teka_migrations') and a.grantee <> n.nspowner and a.grantee <> (select oid from pg_roles where rolname=current_user)${managed ? " and not exists (select 1 from pg_roles r where r.rolname='congofoot' and r.oid=a.grantee)" : ""})${historyGuard},
    'public_schema_create', not exists (select 1 from pg_namespace n cross join lateral aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a where n.nspname='public' and a.grantee=0 and a.privilege_type='CREATE'),
    'cross_environment_isolation', ${managed ? `not has_database_privilege(current_user,'${production ? "congofoot_teka_edu_dev" : "congofoot_teka_edu_prod"}','CONNECT')` : "true"},
    'btree_gist', exists (select 1 from pg_extension where extname='btree_gist')
  );`);
  } catch (error: unknown) {
    if (error instanceof PostgresJsonResultError)
      throw new AccessValidationError("ACCESS_RESULT_PARSE");
    throw error; // SQLSTATE/client diagnostics retain their original classification.
  }
  const result = validateAccessResult(value);
  let sql: string;
  try {
    sql = readFileSync(path.join(ROOT, "scripts/postgres/access-inventory.sql"), "utf8");
  } catch {
    throw new AccessValidationError("ACCESS_INVENTORY_READ");
  }
  const privileges = await session.json<unknown[]>(sql, "ACCESS");
  return { ...result, privileges };
}

/** Derive named structural expectations independently from the unchanged SQL sources. */
export function verifySourceInventory(actual: Inventory, sources: string[]) {
  const source = executableSql(sources.join("\n"));
  const names = (expression: RegExp) =>
    [...source.matchAll(expression)].map((match) => match[1]).sort();
  const tableNames = names(/create\s+table\s+public\.([a-z_0-9]+)/gi);
  if (!isDeepStrictEqual(actual.tables.map((table) => table.name).sort(), tableNames))
    throw new Error("Schema table registry differs from source DDL");
  for (const name of names(/create\s+(?:unique\s+)?index\s+([a-z_0-9]+)/gi)) {
    if (!actual.tables.some((table) => table.indexes.some((index) => index.name === name)))
      throw new Error(`Source index missing: ${name}`);
  }
  for (const name of names(/create\s+(?:constraint\s+)?trigger\s+([a-z_0-9]+)/gi)) {
    if (!actual.tables.some((table) => table.triggers.some((trigger) => trigger.name === name)))
      throw new Error(`Source trigger missing: ${name}`);
  }
  if (
    actual.tables.some((table) => !table.rls || table.policies.length !== 0) ||
    actual.functions.length !== 2
  )
    throw new Error("Source RLS/function inventory differs");
  const baseline = path.join(ROOT, "docs/migration/alwaysdata/expected-schema.json");
  if (
    existsSync(baseline) &&
    !isDeepStrictEqual(JSON.parse(readFileSync(baseline, "utf8")), actual)
  )
    throw new Error("Schema differs from the source-derived PostgreSQL16 baseline");
}

/** Reuse the two original integrity suites verbatim except qualifying assertion calls. */
export function managedAssertionCopy(sql: string) {
  const executable = executableSql(sql);
  const calls = [
    ...executable.matchAll(/\b(plan|is|ok|results_eq|bag_eq|throws_ok|lives_ok|finish)\s*\(/gi),
  ];
  let copy = sql;
  for (const match of calls.reverse())
    copy = copy.slice(0, match.index) + "pg_temp." + copy.slice(match.index);
  return copy;
}
export async function behavioralTests(session: Session, inTransaction = false) {
  await session.query(readFileSync(path.join(ROOT, "scripts/postgres/assertions.sql"), "utf8"));
  const results = [];
  for (const filename of ["educational_foundation.test.sql", "curriculum_lessons.test.sql"]) {
    let sql = managedAssertionCopy(
      readFileSync(path.join(ROOT, "supabase/tests/database", filename), "utf8"),
    );
    if (inTransaction) {
      if (!sql.includes("begin;") || !sql.endsWith("rollback;\n"))
        throw new Error("Unexpected integrity suite transaction shape");
      sql = sql
        .replace("begin;", "savepoint teka_integrity;")
        .replace(
          /rollback;\n$/,
          "rollback to savepoint teka_integrity; release savepoint teka_integrity;\n",
        );
    }
    const output = await session.query(sql, "INTEGRITY");
    if (!output.includes("assertions passed:"))
      throw new Error(`Incomplete managed assertion suite: ${filename}`);
    results.push({ filename, assertions: Number(output.match(/assertions passed: (\d+)/)?.[1]) });
  }
  return results;
}
export async function syncIdempotency(session: Session) {
  // Read-before/write/compare takes place in one rollback-only transaction.
  await session.query("begin; set constraints all immediate;");
  try {
    await verifyCanonical(session);
    if ((await session.query("show track_counts;")) !== "on")
      throw new Error("Idempotency verification requires PostgreSQL track_counts");
    const counters =
      "select coalesce(jsonb_object_agg(relname,n_tup_ins+n_tup_upd+n_tup_del),'{}') from pg_stat_xact_user_tables where schemaname='public';";
    const before = await session.json<Record<string, number>>(counters, "IDEMPOTENCY");
    await session.query(referenceSyncSql(getReferenceData()), "IDEMPOTENCY");
    await verifyCanonical(session);
    const after = await session.json<Record<string, number>>(counters, "IDEMPOTENCY");
    const mutations = Object.entries(after)
      .map(([table, count]) => ({ table, changes: count - (before[table] ?? 0) }))
      .filter(({ changes }) => changes !== 0);
    const changes = mutations.reduce((sum, table) => sum + table.changes, 0);
    if (mutations.length !== 0)
      throw new Error(`Canonical re-sync unexpectedly mutated rows: ${JSON.stringify(mutations)}`);
    return { changed_rows: changes };
  } finally {
    await session.query("rollback;");
  }
}
