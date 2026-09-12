-- Phase 3A: the parent-led after-school session (ADR-039) and the annual scope and
-- sequence (ADR-040).
--
-- Additive only. Three things arrive:
--   1. activities gain a role, so retrieval and consolidation are data, not a naming convention;
--   2. the stories and rhymes Teka Edu supplies, so a lesson never depends on the family owning
--      a book (docs/CONTENT_AUTHORING.md);
--   3. the annual plan: which objective the year introduces when, and how often it comes back.
--
-- Every table mirrors content/ and is written only by generated migrations (ADR-028). RLS is on
-- with no policy and no grant: server-side code reads them with the service role.

-- ---- activities: what the activity is for -----------------------------------------------

alter table public.activities add column role text not null default 'teach';
alter table public.activities
  add constraint activities_role_check check (role in ('teach', 'retrieval', 'consolidation'));
alter table public.activities alter column role drop default;
comment on column public.activities.role is
  'teach | retrieval | consolidation — a reinforcement programme revisits on purpose (ADR-039).';

-- ---- texts supplied with the lesson ------------------------------------------------------

create table public.teaching_texts (
  id text primary key,
  kind text not null check (kind in ('story', 'rhyme')),
  title text not null,
  minutes smallint not null check (minutes between 1 and 10),
  origin text not null check (origin in ('official', 'teka-edu-adaptation', 'teka-edu-created')),
  provenance text not null
);
comment on table public.teaching_texts is
  'Stories and rhymes Teka Edu supplies so that no lesson depends on an outside book. Mirrors content/texts/.';
comment on column public.teaching_texts.provenance is
  'Where the text comes from and on what terms. Teka Edu texts are original; anything else needs verified rights.';

create table public.teaching_text_lines (
  text_id text not null references public.teaching_texts (id) on delete cascade,
  position smallint not null check (position > 0),
  line text not null,
  primary key (text_id, position)
);

-- ---- the annual scope and sequence --------------------------------------------------------

create table public.annual_plans (
  id text primary key,
  curriculum_id text not null references public.curricula (id),
  level_id text not null references public.school_levels (id),
  school_year_id text not null references public.school_years (id),
  instructional_days smallint not null check (instructional_days > 0),
  unique (curriculum_id, level_id, school_year_id)
);
comment on table public.annual_plans is
  'Pacing, never content: which objectives the year introduces, reinforces and consolidates (ADR-040).';

create table public.annual_plan_phases (
  plan_id text not null references public.annual_plans (id) on delete cascade,
  code text not null,
  name text not null,
  from_day smallint not null check (from_day > 0),
  to_day smallint not null check (to_day > 0),
  focus text not null,
  primary key (plan_id, code),
  constraint annual_plan_phases_order check (to_day >= from_day)
);

create table public.annual_plan_entries (
  plan_id text not null references public.annual_plans (id) on delete cascade,
  curriculum_id text not null,
  objective_code text not null,
  domain_code text not null,
  phase text not null,
  introduce_from_day smallint not null check (introduce_from_day > 0),
  introduce_by_day smallint not null check (introduce_by_day > 0),
  reinforce_until_day smallint not null check (reinforce_until_day > 0),
  consolidate_by_day smallint not null check (consolidate_by_day > 0),
  planned_revisits smallint not null check (planned_revisits between 1 and 60),
  cadence text not null check (cadence in ('daily', 'frequent', 'periodic')),
  needs_dedicated_lesson boolean not null,
  embeddable boolean not null,
  home_feasibility text not null check (home_feasibility in ('full', 'partial', 'school-only')),
  primary key (plan_id, objective_code),
  -- The objective must exist in the same curriculum as the plan.
  constraint annual_plan_entries_objective_fkey
    foreign key (curriculum_id, objective_code)
    references public.learning_objectives (curriculum_id, code),
  constraint annual_plan_entries_domain_fkey
    foreign key (curriculum_id, domain_code) references public.curriculum_domains (curriculum_id, code),
  constraint annual_plan_entries_phase_fkey
    foreign key (plan_id, phase) references public.annual_plan_phases (plan_id, code),
  -- Introduce, then reinforce, then consolidate: the windows may touch but never invert.
  constraint annual_plan_entries_window check (
    introduce_from_day <= introduce_by_day
    and introduce_by_day <= reinforce_until_day
    and reinforce_until_day <= consolidate_by_day
  )
);
comment on column public.annual_plan_entries.home_feasibility is
  'How much of the objective an after-school session at home can carry. Some official objectives assume a class or a pool.';

-- ---- RLS: server-only, like every other reference table ------------------------------------

alter table public.teaching_texts enable row level security;
alter table public.teaching_text_lines enable row level security;
alter table public.annual_plans enable row level security;
alter table public.annual_plan_phases enable row level security;
alter table public.annual_plan_entries enable row level security;

-- No browser role may touch them, like every other reference table.
revoke all on table
  public.teaching_texts,
  public.teaching_text_lines,
  public.annual_plans,
  public.annual_plan_phases,
  public.annual_plan_entries
  from anon, authenticated;
