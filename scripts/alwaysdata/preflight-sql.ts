import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { getReferenceData } from "../../lib/content/reference-data";
import { referenceTables } from "../../lib/supabase/reference-sql";

// Frozen reviewed baseline 2315600fc0db4bfe67769afb2eb4727983c91bb6.
// Hashes bind the complete schema and all 46 history entries without integrating
// the unmerged migration runner, baseline/evidence files or deployment tooling.
const normalize = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(normalize)
    : v !== null && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([k, x]) => [k, normalize(x)]),
        )
      : v;
export const checksum = (v: unknown) =>
  createHash("sha256")
    .update(JSON.stringify(normalize(v)))
    .digest("hex");
const rawHash = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");
const SOURCE_CHAIN_SHA256 = "048ce8e561ded989f5141a63ff2286bcef45e2b077b5dfc3353de03def4d232c";
const HISTORY_SHA256 = "9f499b5813573264b7d3174c1d6f60b2e7d86e2e4eec626fad3bfc537ba0c459";
const SCHEMA_SHA256 = "42d34accb1f31a3cd2741adaa8aa3fbfcba51513dac453f250e43ffaa604e397";
const CANONICAL_SHA256 = "5771b03bf6b4db7db6408b445de897fed3bbe5dc282d7871f8e5a00fca9805cb";
const IDENTITY_SQL =
  "select jsonb_build_object('database',current_database(),'login',current_user,'version',current_setting('server_version_num')::integer,'tls',coalesce((select ssl from pg_stat_ssl where pid=pg_backend_pid()),false),'superuser',(select rolsuper from pg_roles where rolname=current_user),'create_database',has_database_privilege(current_user,current_database(),'CREATE'),'create_public',has_schema_privilege(current_user,'public','CREATE'));";
const INVENTORY_SQL =
  "select jsonb_build_object(\n  'tables', coalesce((select jsonb_agg(jsonb_build_object(\n    'name',c.relname,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,\n    'columns',(select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'nullable',not a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid),'identity',a.attidentity,'generated',a.attgenerated) order by a.attnum) from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),\n    'constraints',coalesce((select jsonb_agg(jsonb_build_object('name',x.conname,'type',x.contype,'definition',pg_get_constraintdef(x.oid),'deferred',x.condeferred,'deferrable',x.condeferrable,'validated',x.convalidated) order by x.conname) from pg_constraint x where x.conrelid=c.oid),'[]'),\n    'indexes',coalesce((select jsonb_agg(jsonb_build_object('name',i.relname,'definition',pg_get_indexdef(i.oid),'valid',x.indisvalid,'ready',x.indisready) order by i.relname) from pg_index x join pg_class i on i.oid=x.indexrelid where x.indrelid=c.oid),'[]'),\n    'triggers',coalesce((select jsonb_agg(jsonb_build_object('name',t.tgname,'definition',pg_get_triggerdef(t.oid),'enabled',t.tgenabled) order by t.tgname) from pg_trigger t where t.tgrelid=c.oid and not t.tgisinternal),'[]'),\n    'policies',coalesce((select jsonb_agg(jsonb_build_object('name',p.polname,'command',p.polcmd,'permissive',p.polpermissive,'using',pg_get_expr(p.polqual,p.polrelid),'check',pg_get_expr(p.polwithcheck,p.polrelid)) order by p.polname) from pg_policy p where p.polrelid=c.oid),'[]')\n  ) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p')),'[]'),\n  'functions',coalesce((select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'arguments',pg_get_function_identity_arguments(p.oid),'returns',pg_get_function_result(p.oid),'language',l.lanname,'security_definer',p.prosecdef,'configuration',p.proconfig,'body',p.prosrc) order by p.proname) from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_language l on l.oid=p.prolang where n.nspname='private'),'[]'),\n  'schemas', (select jsonb_agg(nspname order by nspname) from pg_namespace where nspname in ('public','private','extensions','teka_migrations')),\n  'extensions', (select jsonb_agg(jsonb_build_object('name',e.extname,'version',e.extversion,'schema',n.nspname) order by e.extname) from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname in ('plpgsql','btree_gist'))\n);\n";
const ACCESS_SQL =
  "select jsonb_build_object(\n    'rls', not exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p') and not c.relrowsecurity),\n    'policies', not exists (select 1 from pg_policies where schemaname='public'),\n    'table_privileges', not exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a where n.nspname='public' and c.relkind in ('r','p') and a.grantee not in (c.relowner,(select oid from pg_roles where rolname=current_user), (select oid from pg_roles where rolname='congofoot'))),\n    'function_privileges', not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where n.nspname='private' and (p.prosecdef or a.grantee not in (p.proowner,(select oid from pg_roles where rolname=current_user), (select oid from pg_roles where rolname='congofoot')))),\n    'schema_privileges', not exists (select 1 from pg_namespace n cross join lateral aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a where n.nspname in ('private','teka_migrations') and a.grantee not in (n.nspowner,(select oid from pg_roles where rolname=current_user), (select oid from pg_roles where rolname='congofoot'))),\n    'public_schema_create', not exists (select 1 from pg_namespace n cross join lateral aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a where n.nspname='public' and a.grantee=0 and a.privilege_type='CREATE'),\n    'cross_environment_isolation', not has_database_privilege(current_user,'congofoot_teka_edu_prod','CONNECT'),\n    'btree_gist', exists (select 1 from pg_extension where extname='btree_gist')\n  );";
const ACCESS_INVENTORY_SQL =
  "with objects as (\n  select 'schema' kind,n.nspname name,n.nspowner owner,n.nspacl acl,'n'::\"char\" aclkind\n  from pg_namespace n where n.nspname in ('public','private','extensions','teka_migrations')\n  union all\n  select 'table',n.nspname || '.' || c.relname,c.relowner,c.relacl,'r'::\"char\"\n  from pg_class c join pg_namespace n on n.oid=c.relnamespace\n  where n.nspname in ('public','teka_migrations') and c.relkind in ('r','p')\n  union all\n  select 'function',n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',p.proowner,p.proacl,'f'::\"char\"\n  from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private'\n)\nselect coalesce(jsonb_agg(jsonb_build_object(\n  'kind',o.kind,'name',o.name,'owner',pg_get_userbyid(o.owner),\n  'grants',(select coalesce(jsonb_agg(jsonb_build_object(\n    'grantee',case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,\n    'grantor',pg_get_userbyid(a.grantor),'privilege',a.privilege_type,'grantable',a.is_grantable\n  ) order by a.grantee,a.privilege_type),'[]') from aclexplode(coalesce(o.acl,acldefault(o.aclkind,o.owner))) a)\n) order by o.kind,o.name),'[]') from objects o;\n";

/** Pure SELECT payload; uses only content/reference helpers already on develop/main. */
export async function readOnlyPayload() {
  const sources = readdirSync("supabase/migrations")
    .filter((n) => n.endsWith(".sql"))
    .sort()
    .map((n) => [n, rawHash(readFileSync("supabase/migrations/" + n))]);
  if (sources.length !== 46 || checksum(sources) !== SOURCE_CHAIN_SHA256)
    throw new Error("Historical 46-file source chain differs from reviewed baseline");
  const tables = referenceTables(getReferenceData());
  if (
    rawHash(JSON.stringify(tables)) !== CANONICAL_SHA256 ||
    tables.length !== 36 ||
    tables.reduce((n, t) => n + t.rows.length, 0) !== 6170
  )
    throw new Error("Canonical reference content differs from reviewed baseline");
  const literal = (s: string) => "'" + s.replaceAll("'", "''") + "'";
  const identifier = (s: string) => '"' + s.replaceAll('"', '""') + '"';
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
      "set local search_path=pg_catalog,public,extensions; set local standard_conforming_strings=on; set local statement_timeout='120s';",
      "select jsonb_build_object('read_only',current_setting('transaction_read_only'),'isolation',current_setting('transaction_isolation'),'prod_connect',has_database_privilege(current_user,'congofoot_teka_edu_prod','CONNECT'));",
      IDENTITY_SQL,
      "select coalesce(jsonb_agg(to_jsonb(t) order by t.version),'[]') from (select version,filename,source_sha256,execution_sha256,adapter_version,target,release_sha from teka_migrations.history order by version) t;",
      INVENTORY_SQL,
      ACCESS_SQL,
      ACCESS_INVENTORY_SQL,
      ...queries,
      "rollback;",
    ].join("\n"),
    expected: {
      migrations_sha256: HISTORY_SHA256,
      schema_sha256: SCHEMA_SHA256,
      counts: tables.map((t) => ({ table: t.table, rows: t.rows.length })),
    },
  };
}
if (process.argv[1]?.endsWith("preflight-sql.ts"))
  console.log(JSON.stringify(await readOnlyPayload()));
