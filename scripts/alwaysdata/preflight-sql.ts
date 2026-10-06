import { readFileSync } from "node:fs";
import { canonicalTables, verifyAccess } from "../../lib/postgres/verify";
import { loadMigrations } from "../../lib/postgres/migrations";
import { IDENTITY_SQL, metadata } from "../../lib/postgres/runner";
import type { Session } from "../../lib/postgres/session";

/** Build only SELECTs against the unchanged reviewed reference values and schema. */
export async function readOnlyPayload() {
  const tables = canonicalTables();
  const literal = (s: string) => "'" + s.replaceAll("'", "''") + "'";
  const identifier = (s: string) => '"' + s.replaceAll('"', '""') + '"';
  const access: string[] = [];
  // Capture the reviewed SELECT-only access checks without opening a database session.
  await verifyAccess(
    {
      json: async (sql: string) => {
        access.push(sql);
        return {};
      },
    } as Session,
    true,
  );
  const queries = tables.map(
    (table) => `
    with actual as (select to_jsonb(t) row from (
      select ${table.columns.map((c) => identifier(c.name)).join(",")} from public.${identifier(table.table)}
    ) t), expected as (select value row from jsonb_array_elements(${literal(JSON.stringify(table.rows))}::jsonb))
    select jsonb_build_object('table',${literal(table.table)},'rows',(select count(*) from actual),
      'exact',not exists((select row from actual except all select row from expected)
        union all (select row from expected except all select row from actual)));`,
  );
  return {
    sql: [
      "begin isolation level repeatable read read only;",
      "set local search_path=pg_catalog,public,extensions; set local statement_timeout='120s';",
      "select jsonb_build_object('read_only',current_setting('transaction_read_only'),'isolation',current_setting('transaction_isolation'),'prod_connect',has_database_privilege(current_user,'congofoot_teka_edu_prod','CONNECT'));",
      IDENTITY_SQL,
      "select coalesce(jsonb_agg(to_jsonb(t) order by t.version),'[]') from (select version,filename,source_sha256,execution_sha256,adapter_version,target,release_sha from teka_migrations.history order by version) t;",
      readFileSync("scripts/postgres/inventory.sql", "utf8"),
      ...access,
      ...queries,
      "rollback;",
    ].join("\n"),
    expected: {
      migrations: metadata(loadMigrations()),
      schema: JSON.parse(readFileSync("docs/migration/alwaysdata/expected-schema.json", "utf8")),
      counts: tables.map((t) => ({ table: t.table, rows: t.rows.length })),
    },
  };
}
if (process.argv[1]?.endsWith("preflight-sql.ts"))
  console.log(JSON.stringify(await readOnlyPayload()));
