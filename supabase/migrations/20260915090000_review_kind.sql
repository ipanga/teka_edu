-- ADR-047: a pedagogical review records which kind of review it was.
--
-- Additive only. No lesson is `approved` today, so no row is affected: this exists so that the
-- first approval cannot be ambiguous rather than to correct existing ones.
--
-- `approved` says the content passed Teka Edu's pedagogical gate. During development that gate
-- is an AI-assisted review of a generated package against the official programme. A review by a
-- person who teaches this age is a different and stronger claim. Storing them in the same column
-- with only a free-text role to tell them apart would let a report, or one day an interface,
-- present the first as the second.

alter table public.lessons add column review_kind text
  check (review_kind in ('ai-assisted', 'human-teacher'));
alter table public.lessons add column review_outcome text
  check (review_outcome in ('accepted', 'accepted-with-modifications'));

comment on column public.lessons.review_kind is
  'ai-assisted | human-teacher. Which gate the approval came through; never inferred (ADR-047).';
comment on column public.lessons.review_outcome is
  'accepted | accepted-with-modifications. needs-revision never accompanies an approval: such content stays at status review.';

-- An approval carries a kind and an outcome, exactly as it carries a reviewer and a digest.
alter table public.lessons drop constraint lessons_review_complete;
alter table public.lessons add constraint lessons_review_complete check (
  (status = 'approved') = (reviewer is not null)
  and (reviewer is null) = (reviewer_role is null)
  and (reviewer is null) = (reviewed_on is null)
  and (reviewer is null) = (reviewed_digest is null)
  and (reviewer is null) = (review_kind is null)
  and (reviewer is null) = (review_outcome is null)
);

comment on column public.lessons.status is
  'draft → review → approved → retired. AI-assisted content stops at review until it passes the pedagogical gate; review_kind says which gate (ADR-047).';
