-- Integrity rules of the curriculum objectives, lessons and activities (Phase 2).
-- Every change is rolled back. Run with `npm run db:test`.
begin;
set constraints all immediate;
select plan(37);

-- ---- Imported official data ------------------------------------------------------------------

select is(
  (select count(*)::int from public.learning_objectives where curriculum_id = 'maternelle-cycle1-cd-2026'),
  398,
  'the 398 official learning objectives are loaded'
);
select is(
  (select count(*)::int from public.success_examples where curriculum_id = 'maternelle-cycle1-cd-2026'),
  529,
  'the 529 official success examples are loaded'
);
select is(
  (select count(*)::int from public.learning_objectives where origin <> 'official'),
  0,
  'every imported objective is marked as official wording'
);
select is(
  (
    select count(*)::int from public.learning_objectives o
    where not exists (
      select 1 from public.learning_objective_age_bands b
      where b.curriculum_id = o.curriculum_id and b.objective_code = o.code
    )
  ),
  0,
  'every objective belongs to at least one age band'
);
select results_eq(
  $$
    select l.level_id, l.reference_section, l.age_band_code
    from public.curriculum_levels l
    where l.curriculum_id = 'maternelle-cycle1-cd-2026'
    order by l.level_id
  $$,
  $$ values ('maternelle-1', 'PS', 'before-4'), ('maternelle-2', 'MS', 'from-4'), ('maternelle-3', 'GS', 'from-5') $$,
  'each preschool level is mapped to a reference section and an age band'
);
select results_eq(
  $$
    select count(distinct s.domain_code)::int
    from public.curriculum_subdomains s
    where s.curriculum_id = 'maternelle-cycle1-cd-2026'
  $$,
  $$ values (6) $$,
  'the objectives cover all six learning domains'
);

-- ---- Teka Edu content -------------------------------------------------------------------------

select is(
  (select count(*)::int from public.lessons), 88, 'the 88 September lessons are loaded'
);
select is(
  (select count(*)::int from public.lessons where origin <> 'teka-edu-created'),
  0,
  'every lesson is marked as authored by Teka Edu, never as official text'
);
select is(
  (
    select count(*)::int from public.activities a
    where not exists (select 1 from public.activity_objectives o where o.activity_id = a.id)
  ),
  0,
  'every activity serves at least one learning objective'
);
select is(
  (
    select count(*)::int from public.lessons l
    where not exists (
      select 1 from public.lesson_objectives o where o.lesson_id = l.id and o.role = 'taught'
    )
  ),
  0,
  'every lesson teaches at least one objective'
);
select is(
  (
    select count(*)::int from public.lessons l
    where not exists (select 1 from public.activities a where a.lesson_id = l.id)
  ),
  0,
  'every lesson has at least one activity'
);
select is(
  (select count(*)::int from public.activity_scaffolds where language = 'fr'),
  0,
  'French is never stored as a scaffold: it is the instruction'
);

-- ---- Official data: constraints ---------------------------------------------------------------

select throws_ok(
  $$ insert into public.learning_objectives (curriculum_id, code, competency_code, position, statement, origin)
     values ('maternelle-cycle1-cd-2026', 'LANG-S01-C01-O99', 'LANG-S01-C01', 99, 'x', 'official') $$,
  '23514', null, 'official wording must cite its source'
);
select lives_ok(
  $$ insert into public.learning_objectives (curriculum_id, code, competency_code, position, statement, origin)
     values ('maternelle-cycle1-cd-2026', 'LANG-S01-C01-O98', 'LANG-S01-C01', 98, 'x', 'teka-edu-adaptation') $$,
  'a Teka Edu adaptation may be stored without a source, and is marked as such'
);
select throws_ok(
  $$ insert into public.learning_objectives (curriculum_id, code, competency_code, position, statement, origin, source_code)
     values ('maternelle-cycle1-cd-2026', 'objectif-1', 'LANG-S01-C01', 97, 'x', 'official', 'programme-2026') $$,
  '23514', null, 'objective codes follow the DOMAIN-Snn-Cnn-Onn form'
);
select throws_ok(
  $$ insert into public.learning_objectives (curriculum_id, code, competency_code, position, statement, origin, source_code)
     values ('maternelle-cycle1-cd-2026', 'LANG-S01-C99-O01', 'LANG-S01-C99', 1, 'x', 'official', 'programme-2026') $$,
  '23503', null, 'an objective belongs to a known competency'
);
select throws_ok(
  $$ insert into public.learning_objective_age_bands (curriculum_id, objective_code, age_band_code)
     values ('maternelle-cycle1-cd-2026', 'LANG-S01-C01-O02', 'from-9') $$,
  '23503', null, 'an age band must be one of the curriculum’s bands'
);
select throws_ok(
  $$ insert into public.success_examples (curriculum_id, competency_code, age_band_code, position, statement)
     values ('maternelle-cycle1-cd-2026', 'LANG-S01-C01', 'from-9', 1, 'x') $$,
  '23503', null, 'a success example must use a known age band'
);
select throws_ok(
  $$ delete from public.learning_objectives
     where curriculum_id = 'maternelle-cycle1-cd-2026' and code = 'LANG-S01-C04-O11' $$,
  '23503', null, 'an objective used by a lesson cannot be deleted'
);

-- ---- Lessons and activities: constraints ------------------------------------------------------

select throws_ok(
  $$ insert into public.lessons (id, curriculum_id, domain_code, title, summary, stage, difficulty, parent_guidance, origin, status)
     values ('t-lesson', 'maternelle-cycle1-cd-2026', 'LANG', 'x', 'x', 'discovery', 1, 'x', 'official', 'review') $$,
  '23514', null, 'a lesson can never be marked as official text'
);
select throws_ok(
  $$ insert into public.lessons (id, curriculum_id, domain_code, title, summary, stage, difficulty, parent_guidance, status)
     values ('t-lesson', 'maternelle-cycle1-cd-2026', 'NOPE', 'x', 'x', 'discovery', 1, 'x', 'review') $$,
  '23503', null, 'a lesson belongs to a domain of its curriculum'
);
select throws_ok(
  $$ insert into public.activities (id, lesson_id, curriculum_id, position, type, title, child_instruction, adult_guidance, minutes, mode, role)
     values ('t-act', 'm3-lang-01', 'maternelle-cycle1-cd-2026', 9, 'quiz-surprise', 'x', 'x', 'x', 5, 'off-screen', 'teach') $$,
  '23503', null, 'an activity uses a known activity type'
);
select throws_ok(
  $$ insert into public.activities (id, lesson_id, curriculum_id, position, type, title, child_instruction, adult_guidance, minutes, mode, role)
     values ('t-act', 'm3-lang-01', 'maternelle-cycle1-cd-2026', 9, 'conversation', 'x', 'x', 'x', 45, 'off-screen', 'teach') $$,
  '23514', null, 'a preschool activity stays between 2 and 20 minutes'
);
select throws_ok(
  $$ insert into public.activities (id, lesson_id, curriculum_id, position, type, title, child_instruction, adult_guidance, minutes, mode, role)
     values ('t-act', 'm3-lang-01', 'maternelle-cycle1-cd-2026', 1, 'conversation', 'x', 'x', 'x', 5, 'off-screen', 'teach') $$,
  '23505', null, 'two activities of a lesson cannot share a position'
);
select throws_ok(
  $$ insert into public.activities (id, lesson_id, curriculum_id, position, type, title, child_instruction, adult_guidance, minutes, mode, role, payload)
     values ('t-act', 'm3-lang-01', 'maternelle-cycle1-cd-2026', 9, 'conversation', 'x', 'x', 'x', 5, 'off-screen', 'teach', '"texte"'::jsonb) $$,
  '23514', null, 'an activity payload is a JSON object'
);
select throws_ok(
  $$ insert into public.lesson_objectives (lesson_id, curriculum_id, objective_code, role)
     values ('m3-lang-01', 'maternelle-cycle1-cd-2026', 'LANG-S01-C04-O12', 'bonus') $$,
  '23514', null, 'a lesson objective is either taught or supporting'
);
select throws_ok(
  $$ insert into public.activity_materials (activity_id, material_code) values ('m3-lang-01-a1', 'tableau-blanc') $$,
  '23503', null, 'an activity only needs materials that exist'
);
select throws_ok(
  $$ insert into public.activity_scaffolds (activity_id, language, child_instruction)
     values ('m3-lang-01-a1', 'fr', 'x') $$,
  '23514', null, 'French cannot be added as a scaffold language'
);

-- ---- Content quality gate (Phase 2.5, ADR-035) ------------------------------------------------

select is(
  (select count(*)::int from public.lessons where status <> 'review'),
  0,
  'no pilot lesson claims approval: they all wait for a human reviewer'
);
select is(
  (select count(*)::int from public.lessons where reviewer is not null),
  0,
  'no lesson records a reviewer yet'
);
select throws_ok(
  $$ update public.lessons set status = 'approved' where id = 'm3-lang-01' $$,
  '23514', null, 'a lesson cannot become approved without a named reviewer'
);
select throws_ok(
  $$ update public.lessons set status = 'approved', reviewer = 'X' where id = 'm3-lang-01' $$,
  '23514', null, 'an approval needs the reviewer role, date and reviewed digest too'
);
select throws_ok(
  $$ update public.lessons set reviewer = 'X', reviewer_role = 'institutrice',
       reviewed_on = '2026-09-20', reviewed_digest = '0123456789abcdef' where id = 'm3-lang-01' $$,
  '23514', null, 'a review record cannot be attached to a lesson that is not approved'
);
select lives_ok(
  $$ update public.lessons set status = 'approved', reviewer = 'X', reviewer_role = 'institutrice',
       reviewed_on = '2026-09-20', reviewed_digest = '0123456789abcdef' where id = 'm3-lang-01' $$,
  'an approval with a named reviewer, a role, a date and a digest is accepted'
);
select throws_ok(
  $$ update public.lessons set status = 'publie' where id = 'm3-lang-02' $$,
  '23514', null, 'the lifecycle is draft, review, approved or retired'
);

-- ---- Materials: alternatives and safety -------------------------------------------------------

select is(
  (
    select count(*)::int from public.materials
    where alternatives is null and code <> 'aucun'
  ),
  0,
  'every material other than "aucun" says what to use instead'
);
select ok(
  (select safety_note is not null from public.materials where code = 'petits-objets'),
  'small objects to count carry a safety note for the adult'
);

select * from finish();
rollback;
