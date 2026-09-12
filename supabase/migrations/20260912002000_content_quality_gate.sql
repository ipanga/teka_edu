-- Phase 2.5: the content quality gate and material accessibility/safety notes (ADR-035).
--
-- Additive only: no column is dropped, no row is rewritten. The Phase 2 content keeps its
-- identifiers, its provenance and its `review` status.

-- ---- Materials: what to use instead, and what an adult must watch for ----------------------

alter table public.materials add column alternatives text check (btrim(alternatives) <> '');
alter table public.materials add column safety_note text check (btrim(safety_note) <> '');
comment on column public.materials.alternatives is
  'What to use instead when a home does not have it: activities must never depend on one object.';
comment on column public.materials.safety_note is
  'What the adult must watch for with a preschool child (small objects, stable furniture, space).';

-- ---- Lessons: the quality gate ---------------------------------------------------------------

-- A lesson is written by Teka Edu, often with a language model. It may only become `approved`
-- when a person who teaches this age has read it. `reviewed_digest` binds that approval to the
-- exact text: editing an approved lesson changes the digest and the content validation refuses
-- it until it goes back to `review`.
alter table public.lessons add column reviewer text check (btrim(reviewer) <> '');
alter table public.lessons add column reviewer_role text check (btrim(reviewer_role) <> '');
alter table public.lessons add column reviewed_on date;
alter table public.lessons add column reviewed_digest text check (reviewed_digest ~ '^[0-9a-f]{16}$');
alter table public.lessons add column review_notes text;

-- 'published' was never used by any row; the lifecycle is now draft → review → approved → retired.
alter table public.lessons drop constraint lessons_status_check;
alter table public.lessons add constraint lessons_status_check
  check (status in ('draft', 'review', 'approved', 'retired'));

-- Approval must be attributable and bound to reviewed text; anything else carries no review.
alter table public.lessons add constraint lessons_review_complete check (
  (status = 'approved') = (reviewer is not null)
  and (reviewer is null) = (reviewer_role is null)
  and (reviewer is null) = (reviewed_on is null)
  and (reviewer is null) = (reviewed_digest is null)
);

comment on column public.lessons.status is
  'draft → review → approved → retired. AI-assisted content stops at review until a person approves it.';
comment on column public.lessons.reviewed_digest is
  'Digest of the exact lesson text that was approved (domain/lessons/review.ts).';

create index lessons_status_idx on public.lessons (status);

-- ---- Attribution: the Licence Ouverte asks for the source AND its date of last update -------

alter table public.curriculum_sources add column published_on date;
comment on column public.curriculum_sources.published_on is
  'Publication date of the official document, cited with the source wherever its text is shown.';
