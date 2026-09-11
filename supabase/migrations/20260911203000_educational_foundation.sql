-- Educational foundation: education structure, curriculum versions and school calendar.
--
-- These are REFERENCE tables. The canonical data is authored in Git under content/ and
-- validated by `npm run content:validate`; the rows are written by generated, idempotent
-- migrations (`npm run db:reference`, ADR-028). The database copy exists so that future
-- user data (children, progress, daily plans) can reference levels, school years and
-- curriculum domains with foreign keys, and so the rules below are enforced a second time.
--
-- Access (least privilege, docs/EDUCATIONAL_MODEL.md): RLS on, no policies, and no
-- privileges for the browser roles `anon` / `authenticated`. Only server-side roles
-- (`service_role`, `postgres`) can read. Grant a narrow SELECT policy when a real
-- consumer needs it. supabase/tests/database/ enforces this.
--
-- Dates are PostgreSQL `date` values (civil dates, no time zone): see docs/SCHOOL_CALENDAR.md.

-- Exclusion constraints below combine `=` on text with `&&` on date ranges.
create extension if not exists btree_gist with schema extensions;

-- Trigger functions live in a schema that the Data API does not expose.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ============================================================================================
-- Education structure: stage → level
-- ============================================================================================

create table public.education_stages (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position smallint not null check (position > 0),
  name text not null check (btrim(name) <> ''),
  constraint education_stages_position_key unique (position) deferrable initially immediate
);
comment on table public.education_stages is
  'Education stages (maternelle; later primaire, secondaire). Reference data generated from content/education/levels.json.';
comment on column public.education_stages.name is
  'Canonical French name. Other languages come from UI message catalogues keyed by id.';

create table public.school_levels (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  stage_id text not null references public.education_stages (id),
  position smallint not null check (position > 0),
  name text not null check (btrim(name) <> ''),
  constraint school_levels_stage_position_key unique (stage_id, position)
    deferrable initially immediate,
  -- Target of composite foreign keys that must stay inside one stage.
  constraint school_levels_id_stage_key unique (id, stage_id)
);
comment on table public.school_levels is
  'Class levels (maternelle-1 = 1ère maternelle…). Application logic uses id, never the French name.';

-- ============================================================================================
-- Curriculum: version → domains, levels, school-year assignment
-- ============================================================================================

create table public.curricula (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  stage_id text not null references public.education_stages (id),
  name text not null check (btrim(name) <> ''),
  version text not null check (btrim(version) <> ''),
  status text not null check (status in ('draft', 'active', 'retired')),
  reference_title text not null check (btrim(reference_title) <> ''),
  reference_publisher text not null check (btrim(reference_publisher) <> ''),
  reference_citation text not null check (btrim(reference_citation) <> ''),
  reference_url text check (reference_url ~ '^https://'),
  reference_verification text not null
    check (reference_verification in ('verified', 'needs-verification')),
  adaptation_note text,
  constraint curricula_stage_version_key unique (stage_id, version),
  constraint curricula_id_stage_key unique (id, stage_id)
);
comment on table public.curricula is
  'Curriculum versions. A new programme is a new row; school years keep the version assigned to them.';

create table public.curriculum_levels (
  curriculum_id text not null,
  level_id text not null,
  stage_id text not null,
  reference_section text check (btrim(reference_section) <> ''),
  primary key (curriculum_id, level_id),
  -- Both keys carry stage_id: a curriculum can only cover levels of its own stage.
  foreign key (curriculum_id, stage_id) references public.curricula (id, stage_id),
  foreign key (level_id, stage_id) references public.school_levels (id, stage_id)
);
comment on table public.curriculum_levels is
  'Levels covered by a curriculum version, with the matching section of the reference programme (PS, MS, GS).';

create table public.curriculum_domains (
  curriculum_id text not null references public.curricula (id),
  code text not null check (code ~ '^[A-Z][A-Z0-9]*(-[A-Z0-9]+)*$'),
  kind text not null check (kind in ('learning-domain', 'transversal')),
  position smallint not null check (position > 0),
  title text not null check (btrim(title) <> ''),
  is_active boolean not null default true,
  primary key (curriculum_id, code),
  constraint curriculum_domains_position_key unique (curriculum_id, position)
    deferrable initially immediate
);
comment on table public.curriculum_domains is
  'Learning domains (and transversal components such as EVAR) of a curriculum version. Future objectives reference (curriculum_id, code).';

-- ============================================================================================
-- School calendar: school year → periods, exceptions; national public holidays
-- ============================================================================================

create table public.school_years (
  id text primary key check (
    id ~ '^[0-9]{4}-[0-9]{4}$'
    and split_part(id, '-', 2)::integer = split_part(id, '-', 1)::integer + 1
  ),
  label text not null check (btrim(label) <> ''),
  starts_on date not null,
  ends_on date not null,
  instructional_weekdays smallint[] not null default '{1,2,3,4,5}' check (
    cardinality(instructional_weekdays) > 0
    and instructional_weekdays <@ '{1,2,3,4,5,6,7}'::smallint[]
  ),
  authority text not null check (authority in ('law', 'ministry', 'teka-edu')),
  verification text not null check (verification in ('verified', 'needs-verification')),
  source text check (btrim(source) <> ''),
  notes text,
  check (ends_on > starts_on),
  check (ends_on < starts_on + interval '1 year'),
  check (extract(year from starts_on) = split_part(id, '-', 1)::integer),
  check (authority = 'teka-edu' or source is not null),
  -- A date belongs to at most one school year.
  constraint school_years_no_overlap exclude using gist (
    daterange(starts_on, ends_on, '[]') with &&
  )
);
comment on table public.school_years is
  'Configured school years. The active year is derived from dates (no stored flag).';
comment on column public.school_years.instructional_weekdays is
  'ISO weekdays (Monday = 1) that are normally instructional.';

create table public.school_periods (
  school_year_id text not null references public.school_years (id),
  position smallint not null check (position > 0),
  term smallint not null check (term > 0),
  starts_on date not null,
  ends_on date not null,
  primary key (school_year_id, position),
  check (ends_on >= starts_on),
  constraint school_periods_no_overlap exclude using gist (
    school_year_id with =,
    daterange(starts_on, ends_on, '[]') with &&
  )
);
comment on table public.school_periods is
  'Teaching periods of the official school calendar, grouped into terms (trimestres).';

create table public.public_holidays (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  month smallint not null check (month between 1 and 12),
  day smallint not null check (day >= 1),
  valid_from date,
  valid_until date,
  authority text not null check (authority in ('law', 'ministry', 'teka-edu')),
  verification text not null check (verification in ('verified', 'needs-verification')),
  source text check (btrim(source) <> ''),
  notes text,
  check (
    day <= case when month = 2 then 29 when month in (4, 6, 9, 11) then 30 else 31 end
  ),
  check (valid_until >= valid_from),
  check (authority = 'teka-edu' or source is not null)
);
comment on table public.public_holidays is
  'National fixed-date public holidays (DRC: Ordonnance n° 23/042). No substitution rule is coded: substitute days are calendar_exceptions.';

create table public.calendar_exceptions (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  school_year_id text not null references public.school_years (id),
  kind text not null check (
    kind in (
      'public-holiday', 'observed-holiday', 'school-vacation', 'school-closure',
      'instructional-day'
    )
  ),
  starts_on date not null,
  ends_on date not null,
  name text not null check (btrim(name) <> ''),
  public_holiday_id text references public.public_holidays (id),
  authority text not null check (authority in ('law', 'ministry', 'teka-edu')),
  verification text not null check (verification in ('verified', 'needs-verification')),
  source text check (btrim(source) <> ''),
  notes text,
  check (ends_on >= starts_on),
  -- Exactly the observed (substitute) days reference the holiday they stand for.
  check ((kind = 'observed-holiday') = (public_holiday_id is not null)),
  check (authority = 'teka-edu' or source is not null),
  -- An exceptional instructional day never overlaps a non-instructional exception.
  constraint calendar_exceptions_no_contradiction exclude using gist (
    school_year_id with =,
    daterange(starts_on, ends_on, '[]') with &&,
    (kind = 'instructional-day') with <>
  )
);
comment on table public.calendar_exceptions is
  'Dated, per-school-year adjustments: one-off or observed holidays, vacations, closures, exceptional instructional days.';

create index calendar_exceptions_school_year_idx
  on public.calendar_exceptions (school_year_id, starts_on);
create index calendar_exceptions_public_holiday_idx
  on public.calendar_exceptions (public_holiday_id) where public_holiday_id is not null;

create table public.school_year_curricula (
  school_year_id text not null references public.school_years (id),
  stage_id text not null,
  curriculum_id text not null,
  -- One curriculum per stage and school year: "which curriculum applies?" has one answer.
  primary key (school_year_id, stage_id),
  foreign key (curriculum_id, stage_id) references public.curricula (id, stage_id)
);
comment on table public.school_year_curricula is
  'The curriculum version that applies to each stage in each school year.';

create index school_levels_stage_idx on public.school_levels (stage_id);
create index curricula_stage_idx on public.curricula (stage_id);
create index curriculum_levels_curriculum_stage_idx
  on public.curriculum_levels (curriculum_id, stage_id);
create index curriculum_levels_level_idx on public.curriculum_levels (level_id, stage_id);
create index school_year_curricula_curriculum_idx
  on public.school_year_curricula (curriculum_id, stage_id);

-- ============================================================================================
-- Dates of periods and exceptions must lie inside their school year. Checked at commit
-- (deferred), so one transaction can move a school year and its entries together.
-- ============================================================================================

create function private.check_dated_row_within_school_year()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  year_start date;
  year_end date;
begin
  select starts_on, ends_on into year_start, year_end
  from public.school_years
  where id = new.school_year_id;
  if new.starts_on < year_start or new.ends_on > year_end then
    raise exception '% (%, % – %) must lie within school year % (% – %)',
      tg_table_name, new.school_year_id, new.starts_on, new.ends_on,
      new.school_year_id, year_start, year_end
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create function private.check_school_year_contains_dated_rows()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.school_periods p
    where p.school_year_id = new.id and (p.starts_on < new.starts_on or p.ends_on > new.ends_on)
  ) or exists (
    select 1 from public.calendar_exceptions e
    where e.school_year_id = new.id and (e.starts_on < new.starts_on or e.ends_on > new.ends_on)
  ) then
    raise exception 'school year % (% – %) would leave periods or exceptions outside its dates',
      new.id, new.starts_on, new.ends_on
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

revoke all on function private.check_dated_row_within_school_year() from public;
revoke all on function private.check_school_year_contains_dated_rows() from public;

create constraint trigger school_periods_within_school_year
  after insert or update on public.school_periods
  deferrable initially deferred
  for each row execute function private.check_dated_row_within_school_year();

create constraint trigger calendar_exceptions_within_school_year
  after insert or update on public.calendar_exceptions
  deferrable initially deferred
  for each row execute function private.check_dated_row_within_school_year();

create constraint trigger school_years_contain_dated_rows
  after update of starts_on, ends_on on public.school_years
  deferrable initially deferred
  for each row execute function private.check_school_year_contains_dated_rows();

-- ============================================================================================
-- Access: RLS on, no policies, no browser-role privileges (least privilege).
-- ============================================================================================

alter table public.education_stages enable row level security;
alter table public.school_levels enable row level security;
alter table public.curricula enable row level security;
alter table public.curriculum_levels enable row level security;
alter table public.curriculum_domains enable row level security;
alter table public.school_years enable row level security;
alter table public.school_periods enable row level security;
alter table public.public_holidays enable row level security;
alter table public.calendar_exceptions enable row level security;
alter table public.school_year_curricula enable row level security;

revoke all on table
  public.education_stages,
  public.school_levels,
  public.curricula,
  public.curriculum_levels,
  public.curriculum_domains,
  public.school_years,
  public.school_periods,
  public.public_holidays,
  public.calendar_exceptions,
  public.school_year_curricula
from anon, authenticated;
