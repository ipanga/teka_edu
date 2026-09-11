-- Phase 2: official curriculum objectives, and the lessons and activities that put them into
-- practice (ADR-031, ADR-032).
--
-- Two kinds of data live here and must never be confused:
--   * OFFICIAL, quoted verbatim from the programme: sources, age bands, parts, competencies,
--     learning objectives and success examples. `origin = 'official'` and a source is required.
--   * AUTHORED BY TEKA EDU: materials, lessons and activities (`origin = 'teka-edu-created'`).
--
-- As in Phase 1, the canonical copy is the Git content; these rows are written by generated,
-- idempotent migrations (`npm run db:reference`, ADR-028). Daily plans are NOT stored: they are
-- generated from the calendar and the programme definition (docs/DAILY_PROGRAMME.md).
--
-- Access: RLS on, no policies, no privileges for the browser roles (server-only), like Phase 1.

-- ============================================================================================
-- Official sources and age bands of a curriculum version
-- ============================================================================================

create table public.curriculum_sources (
  curriculum_id text not null references public.curricula (id),
  code text not null check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (btrim(title) <> ''),
  citation text not null check (btrim(citation) <> ''),
  url text check (url ~ '^https://'),
  -- SHA-256 of the imported PDF, so the import can be re-verified (tools/curriculum-import).
  sha256 text check (sha256 ~ '^[0-9a-f]{64}$'),
  verification text not null check (verification in ('verified', 'needs-verification')),
  primary key (curriculum_id, code)
);
comment on table public.curriculum_sources is
  'Official documents a curriculum version quotes (arrêté, annexe, Bulletin officiel).';

create table public.curriculum_source_domains (
  curriculum_id text not null,
  source_code text not null,
  domain_code text not null,
  primary key (curriculum_id, source_code, domain_code),
  foreign key (curriculum_id, source_code) references public.curriculum_sources (curriculum_id, code),
  foreign key (curriculum_id, domain_code) references public.curriculum_domains (curriculum_id, code)
);
comment on table public.curriculum_source_domains is 'Which domains each official document covers.';

create table public.curriculum_age_bands (
  curriculum_id text not null references public.curricula (id),
  code text not null check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position smallint not null check (position > 0),
  -- Official wording, e.g. "À partir de 5 ans ou dès que les apprentissages précédents…".
  label text not null check (btrim(label) <> ''),
  primary key (curriculum_id, code),
  constraint curriculum_age_bands_position_key unique (curriculum_id, position)
    deferrable initially immediate
);
comment on table public.curriculum_age_bands is
  'Age bands the programme states its objectives by. Levels are mapped to them by Teka Edu.';

-- A level follows one age band of its curriculum (a Teka Edu mapping, not official).
alter table public.curriculum_levels add column age_band_code text;
alter table public.curriculum_levels
  add constraint curriculum_levels_age_band_fkey
  foreign key (curriculum_id, age_band_code) references public.curriculum_age_bands (curriculum_id, code);

-- ============================================================================================
-- Official structure: part → competency → objective (+ success examples)
-- ============================================================================================

create table public.curriculum_subdomains (
  curriculum_id text not null,
  code text not null check (code ~ '^[A-Z][A-Z0-9]*(-[A-Z0-9]+)*$'),
  domain_code text not null,
  position smallint not null check (position > 0),
  title text not null check (btrim(title) <> ''),
  primary key (curriculum_id, code),
  foreign key (curriculum_id, domain_code) references public.curriculum_domains (curriculum_id, code),
  constraint curriculum_subdomains_position_key unique (curriculum_id, domain_code, position)
    deferrable initially immediate
);
comment on table public.curriculum_subdomains is
  'Parts of a domain, e.g. "Se déplacer", "Découvrir les nombres". Official wording.';

create table public.curriculum_competencies (
  curriculum_id text not null,
  code text not null check (code ~ '^[A-Z][A-Z0-9]*(-[A-Z0-9]+)*$'),
  subdomain_code text not null,
  position smallint not null check (position > 0),
  title text not null check (btrim(title) <> ''),
  primary key (curriculum_id, code),
  foreign key (curriculum_id, subdomain_code) references public.curriculum_subdomains (curriculum_id, code),
  constraint curriculum_competencies_position_key unique (curriculum_id, subdomain_code, position)
    deferrable initially immediate
);
comment on table public.curriculum_competencies is
  'Competencies: the official unit carrying the objectives and success examples of each age band.';

create table public.learning_objectives (
  curriculum_id text not null,
  code text not null check (code ~ '^[A-Z][A-Z0-9-]*-S[0-9]{2}-C[0-9]{2}-O[0-9]{2}$'),
  competency_code text not null,
  position smallint not null check (position > 0),
  -- Verbatim official wording: never rewritten, not even to normalise its apostrophes.
  statement text not null check (btrim(statement) <> ''),
  -- Row group of the official table, when it has one.
  group_title text check (btrim(group_title) <> ''),
  origin text not null check (origin in ('official', 'teka-edu-adaptation', 'teka-edu-created')),
  source_code text,
  source_page smallint check (source_page > 0),
  primary key (curriculum_id, code),
  foreign key (curriculum_id, competency_code) references public.curriculum_competencies (curriculum_id, code),
  foreign key (curriculum_id, source_code) references public.curriculum_sources (curriculum_id, code),
  -- Official wording must say which document it comes from.
  check (origin <> 'official' or source_code is not null),
  constraint learning_objectives_position_key unique (curriculum_id, competency_code, position)
    deferrable initially immediate
);
comment on table public.learning_objectives is
  'Objectifs d’apprentissage, quoted from the programme. Lessons and future progress reference them.';

create table public.learning_objective_age_bands (
  curriculum_id text not null,
  objective_code text not null,
  age_band_code text not null,
  primary key (curriculum_id, objective_code, age_band_code),
  foreign key (curriculum_id, objective_code) references public.learning_objectives (curriculum_id, code),
  foreign key (curriculum_id, age_band_code) references public.curriculum_age_bands (curriculum_id, code)
);
comment on table public.learning_objective_age_bands is
  'An objective may belong to several age bands: the programme repeats it as learning continues.';

create table public.success_examples (
  curriculum_id text not null,
  competency_code text not null,
  age_band_code text not null,
  position smallint not null check (position > 0),
  statement text not null check (btrim(statement) <> ''),
  group_title text check (btrim(group_title) <> ''),
  source_code text,
  source_page smallint check (source_page > 0),
  primary key (curriculum_id, competency_code, age_band_code, position),
  foreign key (curriculum_id, competency_code) references public.curriculum_competencies (curriculum_id, code),
  foreign key (curriculum_id, age_band_code) references public.curriculum_age_bands (curriculum_id, code),
  foreign key (curriculum_id, source_code) references public.curriculum_sources (curriculum_id, code)
);
comment on table public.success_examples is
  'Exemples de réussite: observable evidence of progress. Official tables give them per competency and age band, not per objective.';

-- ============================================================================================
-- Teka Edu content: materials, lessons, activities
-- ============================================================================================

create table public.materials (
  code text primary key check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  category text not null
    check (category in ('none', 'screen', 'paper', 'writing', 'household', 'toy', 'outdoor'))
);
comment on table public.materials is 'What an activity needs at home. Everyday objects only.';

create table public.activity_types (
  code text primary key check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
comment on table public.activity_types is
  'Activity kinds a renderer can display. Generated from the code registry (domain/lessons/types.ts).';

create table public.lessons (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  curriculum_id text not null references public.curricula (id),
  domain_code text not null,
  title text not null check (btrim(title) <> ''),
  summary text not null check (btrim(summary) <> ''),
  stage text not null check (stage in ('discovery', 'practice', 'consolidation', 'review')),
  difficulty smallint not null check (difficulty between 1 and 3),
  theme_id text check (theme_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  parent_guidance text not null check (btrim(parent_guidance) <> ''),
  -- Lessons are always written by Teka Edu; official text is never a lesson.
  origin text not null default 'teka-edu-created' check (origin = 'teka-edu-created'),
  status text not null check (status in ('draft', 'review', 'published')),
  foreign key (curriculum_id, domain_code) references public.curriculum_domains (curriculum_id, code),
  -- Target of composite foreign keys that must stay inside one curriculum.
  constraint lessons_id_curriculum_key unique (id, curriculum_id)
);
comment on table public.lessons is 'Teka Edu lessons: a coherent unit of learning for a level.';

create table public.lesson_levels (
  lesson_id text not null references public.lessons (id),
  level_id text not null references public.school_levels (id),
  primary key (lesson_id, level_id)
);
comment on table public.lesson_levels is 'Levels a lesson is written for.';

create table public.lesson_objectives (
  lesson_id text not null,
  curriculum_id text not null,
  objective_code text not null,
  -- taught: what the lesson teaches; supporting: earlier learning it reinvests.
  role text not null check (role in ('taught', 'supporting')),
  primary key (lesson_id, objective_code),
  foreign key (lesson_id, curriculum_id) references public.lessons (id, curriculum_id),
  foreign key (curriculum_id, objective_code) references public.learning_objectives (curriculum_id, code)
);
comment on table public.lesson_objectives is
  'Traceability: every lesson says which official objectives it develops, and which it reinvests.';

create table public.activities (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  lesson_id text not null,
  curriculum_id text not null,
  position smallint not null check (position > 0),
  type text not null references public.activity_types (code),
  title text not null check (btrim(title) <> ''),
  -- Addressed to the child, in French: the instruction itself, never a translation.
  child_instruction text not null check (btrim(child_instruction) <> ''),
  -- Addressed to the adult guiding the session.
  adult_guidance text not null check (btrim(adult_guidance) <> ''),
  minutes smallint not null check (minutes between 2 and 20),
  mode text not null check (mode in ('off-screen', 'on-screen', 'mixed')),
  -- Kind-specific data for a future renderer; its shape is checked per type by the content schemas.
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  foreign key (lesson_id, curriculum_id) references public.lessons (id, curriculum_id),
  constraint activities_position_key unique (lesson_id, position) deferrable initially immediate,
  constraint activities_id_curriculum_key unique (id, curriculum_id)
);
comment on table public.activities is
  'Ordered activities of a lesson. One table for every kind: the kind is a value, never a table.';

create table public.activity_objectives (
  activity_id text not null,
  curriculum_id text not null,
  objective_code text not null,
  primary key (activity_id, objective_code),
  foreign key (activity_id, curriculum_id) references public.activities (id, curriculum_id),
  foreign key (curriculum_id, objective_code) references public.learning_objectives (curriculum_id, code)
);
comment on table public.activity_objectives is
  'Which objective each activity works on: "what skill is this activity developing?".';

create table public.activity_materials (
  activity_id text not null references public.activities (id),
  material_code text not null references public.materials (code),
  primary key (activity_id, material_code)
);

create table public.activity_vocabulary (
  activity_id text not null references public.activities (id),
  position smallint not null check (position > 0),
  -- The French word is the content; the English one is optional scaffolding (ADR-001).
  french text not null check (btrim(french) <> ''),
  english text check (btrim(english) <> ''),
  primary key (activity_id, position)
);

create table public.activity_scaffolds (
  activity_id text not null references public.activities (id),
  -- Language of the help. French is never a scaffold: it is the instruction.
  language text not null check (language <> 'fr' and language ~ '^[a-z]{2}$'),
  child_instruction text not null check (btrim(child_instruction) <> ''),
  primary key (activity_id, language)
);
comment on table public.activity_scaffolds is
  'Optional help for a child who does not yet understand French. Never a second curriculum.';

create index curriculum_subdomains_domain_idx
  on public.curriculum_subdomains (curriculum_id, domain_code);
create index curriculum_competencies_subdomain_idx
  on public.curriculum_competencies (curriculum_id, subdomain_code);
create index learning_objectives_competency_idx
  on public.learning_objectives (curriculum_id, competency_code);
create index learning_objectives_source_idx
  on public.learning_objectives (curriculum_id, source_code) where source_code is not null;
create index learning_objective_age_bands_band_idx
  on public.learning_objective_age_bands (curriculum_id, age_band_code);
create index success_examples_band_idx on public.success_examples (curriculum_id, age_band_code);
create index success_examples_source_idx
  on public.success_examples (curriculum_id, source_code) where source_code is not null;
create index curriculum_source_domains_domain_idx
  on public.curriculum_source_domains (curriculum_id, domain_code);
create index curriculum_levels_age_band_idx
  on public.curriculum_levels (curriculum_id, age_band_code) where age_band_code is not null;
create index lessons_curriculum_domain_idx on public.lessons (curriculum_id, domain_code);
create index lesson_levels_level_idx on public.lesson_levels (level_id);
create index lesson_objectives_objective_idx
  on public.lesson_objectives (curriculum_id, objective_code);
create index activities_lesson_idx on public.activities (lesson_id, position);
create index activities_type_idx on public.activities (type);
create index activity_objectives_objective_idx
  on public.activity_objectives (curriculum_id, objective_code);
create index activity_materials_material_idx on public.activity_materials (material_code);

-- ============================================================================================
-- Access: server-only, like every other reference table.
-- ============================================================================================

alter table public.curriculum_sources enable row level security;
alter table public.curriculum_source_domains enable row level security;
alter table public.curriculum_age_bands enable row level security;
alter table public.curriculum_subdomains enable row level security;
alter table public.curriculum_competencies enable row level security;
alter table public.learning_objectives enable row level security;
alter table public.learning_objective_age_bands enable row level security;
alter table public.success_examples enable row level security;
alter table public.materials enable row level security;
alter table public.activity_types enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_levels enable row level security;
alter table public.lesson_objectives enable row level security;
alter table public.activities enable row level security;
alter table public.activity_objectives enable row level security;
alter table public.activity_materials enable row level security;
alter table public.activity_vocabulary enable row level security;
alter table public.activity_scaffolds enable row level security;

revoke all on table
  public.curriculum_sources,
  public.curriculum_source_domains,
  public.curriculum_age_bands,
  public.curriculum_subdomains,
  public.curriculum_competencies,
  public.learning_objectives,
  public.learning_objective_age_bands,
  public.success_examples,
  public.materials,
  public.activity_types,
  public.lessons,
  public.lesson_levels,
  public.lesson_objectives,
  public.activities,
  public.activity_objectives,
  public.activity_materials,
  public.activity_vocabulary,
  public.activity_scaffolds
from anon, authenticated;
