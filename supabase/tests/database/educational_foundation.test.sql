-- Integrity rules of the educational foundation (supabase/migrations/*_educational_foundation.sql).
-- Every change is rolled back. Run with `npm run db:test`.
begin;
-- Check deferred rules (dates inside the school year) at each statement, not at commit.
set constraints all immediate;
select plan(30);

-- ---- Canonical reference data -------------------------------------------------------------

select results_eq(
  $$
    select d.code, d.title
    from public.school_year_curricula a
    join public.curriculum_domains d on d.curriculum_id = a.curriculum_id
    where a.school_year_id = '2026-2027' and a.stage_id = 'maternelle'
      and d.kind = 'learning-domain' and d.is_active
    order by d.position
  $$,
  $$
    values
      ('LANG', 'Le développement et la structuration du langage oral et écrit'),
      ('PHYS', 'Agir, s’exprimer, comprendre à travers les activités physiques'),
      ('ART', 'Agir, s’exprimer, comprendre à travers les activités artistiques'),
      ('MATH', 'L’acquisition des premiers outils mathématiques'),
      ('TIME-SPACE', 'Se repérer dans le temps et l’espace'),
      ('WORLD', 'Découvrir le monde du vivant, de la matière et des objets')
  $$,
  'the curriculum of 2026-2027 has the six Cycle 1 learning domains, in the official order'
);

select results_eq(
  $$ select id, name from public.school_levels where stage_id = 'maternelle' order by position $$,
  $$ values ('maternelle-1', '1ère maternelle'), ('maternelle-2', '2ème maternelle'), ('maternelle-3', '3ème maternelle') $$,
  'the three preschool levels, in order'
);

select results_eq(
  $$ select starts_on, ends_on from public.school_years where id = '2026-2027' $$,
  $$ values ('2026-09-01'::date, '2027-07-02'::date) $$,
  'school year 2026-2027 runs from 2026-09-01 to 2027-07-02'
);

-- ---- School years ---------------------------------------------------------------------------

select throws_ok(
  $$ insert into public.school_years (id, label, starts_on, ends_on, authority, verification)
     values ('2030-2032', 'x', '2030-09-01', '2031-07-01', 'teka-edu', 'needs-verification') $$,
  '23514', null, 'a school year id must name two consecutive years'
);
select throws_ok(
  $$ insert into public.school_years (id, label, starts_on, ends_on, authority, verification)
     values ('2030-2031', 'x', '2030-09-01', '2030-08-01', 'teka-edu', 'needs-verification') $$,
  '23514', null, 'a school year must end after it starts'
);
select throws_ok(
  $$ insert into public.school_years (id, label, starts_on, ends_on, authority, verification)
     values ('2030-2031', 'x', '2030-09-01', '2031-09-01', 'teka-edu', 'needs-verification') $$,
  '23514', null, 'a school year lasts less than a year'
);
select throws_ok(
  $$ insert into public.school_years (id, label, starts_on, ends_on, authority, verification)
     values ('2030-2031', 'x', '2030-09-01', '2031-07-01', 'ministry', 'verified') $$,
  '23514', null, 'a school year decided by the ministry needs a source'
);
select throws_ok(
  $$ insert into public.school_years (id, label, starts_on, ends_on, instructional_weekdays, authority, verification)
     values ('2030-2031', 'x', '2030-09-01', '2031-07-01', '{1,8}', 'teka-edu', 'needs-verification') $$,
  '23514', null, 'instructional weekdays are ISO weekdays 1-7'
);
select throws_ok(
  $$ insert into public.school_years (id, label, starts_on, ends_on, authority, verification)
     values ('2027-2028', 'x', '2027-06-01', '2028-05-31', 'teka-edu', 'needs-verification') $$,
  '23P01', null, 'school years never overlap'
);
select lives_ok(
  $$ insert into public.school_years (id, label, starts_on, ends_on, authority, verification)
     values ('2027-2028', '2027–2028', '2027-09-01', '2028-07-02', 'teka-edu', 'needs-verification') $$,
  'a following school year is added as data'
);

-- ---- Periods and calendar exceptions --------------------------------------------------------

select throws_ok(
  $$ insert into public.school_periods (school_year_id, position, term, starts_on, ends_on)
     values ('2026-2027', 7, 3, '2027-06-01', '2027-06-10') $$,
  '23P01', null, 'periods of a school year never overlap'
);
select throws_ok(
  $$ insert into public.school_periods (school_year_id, position, term, starts_on, ends_on)
     values ('2027-2028', 1, 1, '2027-08-30', '2027-10-30') $$,
  '23514', null, 'a period lies within its school year'
);
select throws_ok(
  $$ insert into public.calendar_exceptions (id, school_year_id, kind, starts_on, ends_on, name, authority, verification)
     values ('t-outside', '2026-2027', 'school-closure', '2027-07-01', '2027-07-05', 'x', 'teka-edu', 'needs-verification') $$,
  '23514', null, 'an exception lies within its school year'
);
select throws_ok(
  $$ insert into public.calendar_exceptions (id, school_year_id, kind, starts_on, ends_on, name, authority, verification)
     values ('t-unknown-year', '2040-2041', 'school-closure', '2040-10-01', '2040-10-01', 'x', 'teka-edu', 'needs-verification') $$,
  '23503', null, 'an exception belongs to a configured school year'
);
select throws_ok(
  $$ insert into public.calendar_exceptions (id, school_year_id, kind, starts_on, ends_on, name, authority, verification)
     values ('t-observed', '2026-2027', 'observed-holiday', '2027-01-18', '2027-01-18', 'x', 'teka-edu', 'needs-verification') $$,
  '23514', null, 'an observed (substitute) holiday references the holiday it stands for'
);
select throws_ok(
  $$ insert into public.calendar_exceptions (id, school_year_id, kind, starts_on, ends_on, name, public_holiday_id, authority, verification)
     values ('t-closure-ref', '2026-2027', 'school-closure', '2027-01-18', '2027-01-18', 'x', 'heros-national-lumumba', 'teka-edu', 'needs-verification') $$,
  '23514', null, 'only observed holidays reference a public holiday'
);
select lives_ok(
  $$ insert into public.calendar_exceptions (id, school_year_id, kind, starts_on, ends_on, name, public_holiday_id, authority, verification)
     values ('t-observed-ok', '2026-2027', 'observed-holiday', '2027-01-18', '2027-01-18', 'x', 'heros-national-lumumba', 'teka-edu', 'needs-verification') $$,
  'an observed holiday can be configured without changing code'
);
select throws_ok(
  $$ insert into public.calendar_exceptions (id, school_year_id, kind, starts_on, ends_on, name, authority, verification)
     values ('t-override-vacation', '2026-2027', 'instructional-day', '2026-12-28', '2026-12-28', 'x', 'teka-edu', 'needs-verification') $$,
  '23P01', null, 'an exceptional instructional day cannot contradict a vacation'
);
select lives_ok(
  $$ insert into public.calendar_exceptions (id, school_year_id, kind, starts_on, ends_on, name, authority, verification)
     values ('t-override-saturday', '2026-2027', 'instructional-day', '2026-11-14', '2026-11-14', 'x', 'teka-edu', 'needs-verification') $$,
  'an exceptional instructional day may fall on a weekend'
);
select throws_ok(
  $$ update public.school_years set ends_on = '2026-12-31' where id = '2026-2027' $$,
  '23514', null, 'a school year cannot shrink and leave its periods or exceptions outside'
);
select throws_ok(
  $$ delete from public.school_years where id = '2026-2027' $$,
  '23503', null, 'a school year that has periods or exceptions cannot be deleted'
);

-- ---- Public holidays ------------------------------------------------------------------------

select throws_ok(
  $$ insert into public.public_holidays (id, name, month, day, authority, verification)
     values ('t-feb-30', 'x', 2, 30, 'teka-edu', 'needs-verification') $$,
  '23514', null, 'a holiday falls on a real month/day'
);
select lives_ok(
  $$ insert into public.public_holidays (id, name, month, day, authority, verification)
     values ('t-feb-29', 'x', 2, 29, 'teka-edu', 'needs-verification') $$,
  'a 29 February holiday is allowed (it occurs in leap years only)'
);
select throws_ok(
  $$ insert into public.public_holidays (id, name, month, day, authority, verification)
     values ('t-no-source', 'x', 3, 3, 'law', 'verified') $$,
  '23514', null, 'a legal holiday needs a source'
);

-- ---- Education structure and curricula ------------------------------------------------------

select throws_ok(
  $$ insert into public.school_levels (id, stage_id, position, name) values ('maternelle-1', 'maternelle', 9, 'x') $$,
  '23505', null, 'school level identifiers are unique'
);
select throws_ok(
  $$ insert into public.school_levels (id, stage_id, position, name) values ('maternelle-9', 'maternelle', 1, 'x') $$,
  '23505', null, 'level positions are unique within a stage'
);
select throws_ok(
  $$ insert into public.curriculum_domains (curriculum_id, code, kind, position, title)
     values ('maternelle-cycle1-cd-2026', 'LANG', 'learning-domain', 9, 'x') $$,
  '23505', null, 'domain codes are unique within a curriculum'
);
select lives_ok(
  $$ insert into public.curriculum_domains (curriculum_id, code, kind, position, title)
     values ('maternelle-cycle1-cd-2026', 'EVAR', 'transversal', 7, 'Éducation à la vie affective et relationnelle') $$,
  'a transversal component (e.g. EVAR) is added as data'
);

insert into public.education_stages (id, position, name) values ('primaire', 2, 'Enseignement primaire');
insert into public.school_levels (id, stage_id, position, name) values ('primaire-1', 'primaire', 1, '1ère primaire');
select throws_ok(
  $$ insert into public.curriculum_levels (curriculum_id, level_id, stage_id) values ('maternelle-cycle1-cd-2026', 'primaire-1', 'maternelle') $$,
  '23503', null, 'a curriculum only covers levels of its own stage'
);
insert into public.curricula (id, stage_id, name, version, status, reference_title, reference_publisher, reference_citation, reference_verification)
values ('maternelle-test-2027', 'maternelle', 'x', '2027', 'active', 'x', 'x', 'x', 'needs-verification');
select throws_ok(
  $$ insert into public.school_year_curricula (school_year_id, stage_id, curriculum_id) values ('2026-2027', 'maternelle', 'maternelle-test-2027') $$,
  '23505', null, 'one curriculum per stage and school year'
);

select * from finish();
rollback;
