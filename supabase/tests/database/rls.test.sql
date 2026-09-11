-- Access guards for everything in the `public` schema (exposed through the Supabase Data API).
-- Run with `npm run db:test` (supabase test db, pgTAP).
--
-- 1. Every public table has Row Level Security enabled.
-- 2. Every public table appears in the access registry below, with a reviewed decision. A new
--    table fails this test until its access is decided here (docs/EDUCATIONAL_MODEL.md).
-- 3. Tables marked `server-only` have no RLS policy and no privilege for the browser roles
--    `anon` / `authenticated`, and an `anon` read is refused.
begin;
select plan(5);

create temporary table access_registry (table_name text primary key, access text not null)
on commit drop;
insert into access_registry (table_name, access) values
  -- Reference data (canonical copy in content/, ADR-028): server-side reads only, for now.
  ('education_stages', 'server-only'),
  ('school_levels', 'server-only'),
  ('curricula', 'server-only'),
  ('curriculum_levels', 'server-only'),
  ('curriculum_domains', 'server-only'),
  ('school_years', 'server-only'),
  ('school_periods', 'server-only'),
  ('public_holidays', 'server-only'),
  ('calendar_exceptions', 'server-only'),
  ('school_year_curricula', 'server-only'),
  -- Official curriculum content (Phase 2): quoted from the programme, server-side reads only.
  ('curriculum_sources', 'server-only'),
  ('curriculum_source_domains', 'server-only'),
  ('curriculum_age_bands', 'server-only'),
  ('curriculum_subdomains', 'server-only'),
  ('curriculum_competencies', 'server-only'),
  ('learning_objectives', 'server-only'),
  ('learning_objective_age_bands', 'server-only'),
  ('success_examples', 'server-only'),
  -- Lessons and activities authored by Teka Edu, and what they need.
  ('materials', 'server-only'),
  ('activity_types', 'server-only'),
  ('lessons', 'server-only'),
  ('lesson_levels', 'server-only'),
  ('lesson_objectives', 'server-only'),
  ('activities', 'server-only'),
  ('activity_objectives', 'server-only'),
  ('activity_materials', 'server-only'),
  ('activity_vocabulary', 'server-only'),
  ('activity_scaffolds', 'server-only');

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

select set_eq(
  $$
    select c.relname::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  $$,
  $$ select table_name from access_registry $$,
  'every public table has a reviewed access decision (and every registered table exists)'
);

select is(
  (
    select coalesce(array_agg(p.tablename::text || '.' || p.policyname::text), '{}')
    from pg_policies p
    join access_registry r on r.table_name = p.tablename
    where p.schemaname = 'public' and r.access = 'server-only'
  ),
  '{}'::text[],
  'server-only tables have no RLS policy'
);

select is(
  (
    select coalesce(array_agg(r.table_name || ' (' || role || ')' order by r.table_name), '{}')
    from access_registry r
    cross join unnest(array['anon', 'authenticated']) as role
    where r.access = 'server-only'
      and has_table_privilege(
        role, 'public.' || r.table_name,
        'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
      )
  ),
  '{}'::text[],
  'browser roles have no privilege on server-only tables'
);

set local role anon;
select throws_ok(
  'select 1 from public.school_years',
  '42501',
  null,
  'an anonymous (browser) client cannot read reference tables'
);
reset role;

select * from finish();
rollback;
