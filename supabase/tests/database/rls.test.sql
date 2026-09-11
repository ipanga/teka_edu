-- Guard: every table in the `public` schema (exposed through the Supabase Data API) must have
-- Row Level Security enabled. Holds trivially while the schema is empty and protects every
-- future migration. Run with `npm run db:test` (supabase test db, pgTAP).
begin;
select plan(1);

select is(
  (
    select coalesce(array_agg(c.relname::text order by c.relname), '{}')
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  ),
  '{}'::text[],
  'RLS is enabled on every table in the public schema'
);

select * from finish();
rollback;
