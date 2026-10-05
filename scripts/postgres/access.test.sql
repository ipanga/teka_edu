-- Portable pgTAP access guarantees; no Supabase roles. The isolated CI setup supplies
-- a real unprivileged teka_probe login; managed verification uses ACL checks instead.
begin;
select plan(7);
select is((select count(*)::integer from pg_tables where schemaname='public'),36,'the reviewed public registry has exactly 36 tables');
select ok(not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity),'all reference tables have RLS');
select is((select count(*)::integer from pg_policies where schemaname='public'),0,'no browser read policy is introduced');
select ok(not exists(select 1 from pg_tables where schemaname='public' and has_table_privilege('teka_probe',quote_ident(schemaname)||'.'||quote_ident(tablename),'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')),'a real unprivileged login has no application table access');
select ok(not has_schema_privilege('teka_probe','private','USAGE,CREATE'),'private schema is inaccessible to the probe');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and has_function_privilege('teka_probe',p.oid,'EXECUTE')),'project trigger functions deny unprivileged execute');
select ok(not has_schema_privilege('teka_probe','teka_migrations','USAGE,CREATE'),'history schema is inaccessible to the probe');
select * from finish();
rollback;
