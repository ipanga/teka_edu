# Educational model

How Teka Edu represents **what** children learn: the education hierarchy, curriculum versions and domains, and how that reference data reaches the application and the database. Decisions: ADR-003, ADR-005, ADR-019, ADR-028, ADR-030. The calendar (**when**) is in [`SCHOOL_CALENDAR.md`](SCHOOL_CALENDAR.md).

## Three separate concerns

| Concern              | Answers                        | Where                                                                         |
| -------------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| Calendar             | When does learning happen?     | `domain/calendar/`, `content/calendars/` (school years, holidays, exceptions) |
| Curriculum           | What should the child learn?   | `domain/curriculum/`, `content/education/`, `content/curriculum/`             |
| Instruction planning | What is taught on a given day? | Next phase (see "Daily plan extension point" below)                           |

No table or file mixes dates, curriculum and progress.

## Education hierarchy: stage → level

```text
education stage   maternelle                                    (later: primaire, secondaire)
  school level    maternelle-1 | maternelle-2 | maternelle-3    (later: primaire-1 … primaire-6, …)
```

- **Identifiers are stable, never displayed and never translated.** Application logic uses `maternelle-1`, never the French name.
  - Identifiers are lower-case ASCII slugs; curriculum domain codes are upper-case codes.
  - A slug may be French-derived (`maternelle`, `nouvel-an`). It is still an opaque key.
- **Display names:** `name` / `title` hold the canonical French text: `1ère maternelle`, `2ème maternelle`, `3ème maternelle`.
- **Scope:** two levels (stage, level) are enough. A separate "grade" concept would duplicate "level". "Cycle" belongs to a curriculum, not to the school system.
- **Future stages:** adding primary or secondary education is data: one stage row and its levels. No business logic assumes exactly three levels.

## Curriculum versions

A **curriculum** row is one version of a programme:

- `id`, stage and version label
- status: `draft` / `active` / `retired`
- the reference programme: title, publisher, legal citation, URL and verification status
- a Teka Edu adaptation note
- the school years it applies to, the levels it covers (each with its matching section of the reference programme), and its domains

- **Current version:** `maternelle-cycle1-cd-2026`, "Teka Edu Maternelle — Cycle 1 adapté pour la RDC", version 2026, active, applied to 2026–2027.
  - **Reference programme:** the French _Programme d’enseignement de l’école maternelle (cycle 1)_, fixed by the **arrêté du 16 avril 2026** (NOR MENE2608627A, BO n° 19 du 7 mai 2026). It applies from the 2026–2027 school year and repeals the 2015 programme as revised in 2021.
  - **Domains 1 and 4** point to annexes 1 and 2 of the **arrêté du 22 octobre 2024** (NOR MENE2415135A, BO n° 41 du 31 octobre 2024).
  - **Reuse terms:** official texts on education.gouv.fr are under Licence Ouverte (etalab-2.0) and regulatory texts are freely reusable. Titles are quoted with their citation.
- **Level mapping** (a Teka Edu decision, Plan §3): 1ère → PS, 2ème → MS, 3ème → GS. The 2026 programme states objectives by age band (before 4, from 4, from 5), so objective mapping in the next phase goes through these sections and age bands.
- **Which curriculum applies?** Exactly one curriculum per stage and school year. `curriculumFor(curricula, schoolYearId, stageId)` answers it, and the table `school_year_curricula` enforces it with its primary key.
- **A new programme is a new curriculum row** with its own domains. Past school years keep the version they used. Nothing is rewritten, and no destructive migration is needed.

## Curriculum domains

Six learning domains, in the official order and wording, checked character by character against the 2026 annex (typographic apostrophes ’, NFC):

| Position | Code         | Title                                                            |
| -------- | ------------ | ---------------------------------------------------------------- |
| 1        | `LANG`       | Le développement et la structuration du langage oral et écrit    |
| 2        | `PHYS`       | Agir, s’exprimer, comprendre à travers les activités physiques   |
| 3        | `ART`        | Agir, s’exprimer, comprendre à travers les activités artistiques |
| 4        | `MATH`       | L’acquisition des premiers outils mathématiques                  |
| 5        | `TIME-SPACE` | Se repérer dans le temps et l’espace                             |
| 6        | `WORLD`      | Découvrir le monde du vivant, de la matière et des objets        |

- **Codes** are Teka Edu identifiers, chosen to fit the competency-ID style of Plan §8.3 (`LANG-ORAL-01`, `MATH-NUM-01`). Future objectives and competencies reference `(curriculum_id, code)`.
- **`kind`** is `learning-domain` or `transversal`. A cross-cutting component is added as a `transversal` row, with no schema change. Examples:
  - the French EVAR programme (arrêté du 3 février 2025, BO n° 6 du 6 février 2025), which the 2026 annex attaches to the six domains
  - a future DRC-specific requirement

  EVAR is **not** configured yet: including it, and adapting it to the DRC context, is an owner decision (PD-014).

- **`is_active`** retires a domain without deleting it.
- **UI components never embed the domains.** They read them through `getReferenceData()`.

## Reference data: Git is canonical, the database is a generated mirror (ADR-028)

```text
content/*.json ──(Zod + rules, npm run content:validate)──▶ lib/content/reference-data.ts ──▶ app bundle (offline)
      │
      └──(npm run db:reference -- --new-migration <name>)──▶ supabase/migrations/<ts>_<name>.sql ──▶ local / DEV / (later) PROD
                                                                   ▲
            supabase/tests/database/reference_data.test.sql ───────┘  (pgTAP: database = content/, sync is idempotent)
```

- **The application reads the JSON** it ships with. It works offline, needs no database, and is identical in every environment.
- **The database holds the same rows** so that future user data (child profiles, progress, daily plans) can reference levels, school years and domains with foreign keys. The database enforces every rule a second time.
- **The rows are written by generated, idempotent migrations**, not by `seed.sql`:
  - reference data must exist in every environment, including production
  - `seed.sql` stays local-only and holds **no** child or demo data
- **Drift is impossible to merge:**
  - `tests/unit/reference-sql.test.ts` fails if the generated pgTAP test does not match `content/`
  - that pgTAP test fails if the migrations do not produce exactly `content/`
  - it also re-applies the sync inside a rolled-back transaction, to prove idempotency and that no rows are duplicated

### Tables

| Table                   | Key                            | Main constraints                                                                                                                                                                                                           |
| ----------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `education_stages`      | `id`                           | slug format; unique `position`                                                                                                                                                                                             |
| `school_levels`         | `id`                           | FK stage; unique (`stage_id`, `position`)                                                                                                                                                                                  |
| `curricula`             | `id`                           | FK stage; unique (`stage_id`, `version`); status and verification enums; https reference URL                                                                                                                               |
| `curriculum_levels`     | (`curriculum_id`, `level_id`)  | Composite FKs through `stage_id`: a curriculum only covers levels of its own stage                                                                                                                                         |
| `curriculum_domains`    | (`curriculum_id`, `code`)      | code format; unique (`curriculum_id`, `position`); `kind` enum                                                                                                                                                             |
| `school_years`          | `id`                           | `YYYY-YYYY` with consecutive years; starts in the first year; ends after it starts and within one year; weekdays 1–7; source required unless `teka-edu`; **no overlap** (exclusion constraint)                             |
| `school_periods`        | (`school_year_id`, `position`) | no overlap within a year; inside the school year (deferred trigger)                                                                                                                                                        |
| `public_holidays`       | `id`                           | real month/day (29 Feb allowed); validity window ordered; source required unless `teka-edu`                                                                                                                                |
| `calendar_exceptions`   | `id`                           | FK school year; kind enum; only and exactly `observed-holiday` references a holiday; inside the school year (deferred trigger); an `instructional-day` never overlaps a non-instructional exception (exclusion constraint) |
| `school_year_curricula` | (`school_year_id`, `stage_id`) | FK (`curriculum_id`, `stage_id`) → curricula: one curriculum per stage and year, of the right stage                                                                                                                        |

- **Dates** are `date`.
- **Indexes** exist on every foreign key and on exception dates.
- **Triggers:**
  - The trigger functions live in the non-exposed `private` schema with an empty `search_path`.
  - A school year cannot shrink and leave its periods or exceptions outside it.
  - It cannot be deleted while referenced.

### Access (RLS)

Every reference table has **RLS enabled, no policy, and no privilege for `anon` or `authenticated`**. Browsers cannot read or write these tables through the Data API. Only server-side roles can: `service_role` and `postgres`, both server-only.

The application does not need database access: it reads the bundled JSON. If a browser feature ever needs the rows, add a narrow `select` policy and grant in a reviewed migration, never a broad grant.

`supabase/tests/database/rls.test.sql` enforces this:

- RLS is on for every public table
- every public table is listed in its **access registry** with a decision, so a new table fails CI until someone decides its access
- `server-only` tables have no policy and no browser-role privilege
- an anonymous read is refused

## Daily plan extension point (next phase)

The next phase is curriculum objectives, the lesson and activity model, and the daily learning programme. It attaches to this foundation as follows:

```text
SchoolYear → SchoolDay (generated: date, instructionalDay n, period)
Curriculum → CurriculumDomain → LearningObjective (next) → Lesson / Activity (next)
DailyPlan (next) = (curriculum, level, instructionalDay n) → LearningSession[] → objectives / activities
```

- **A daily plan is keyed by instructional-day number, not by date** (ADR-004). A calendar change moves lessons to other dates without invalidating content.
- **The date comes from the generator:** `SchoolDay.instructionalDay` ↔ date.
- **No `DailyPlan` table exists yet.** It would be premature before lessons exist.
- **Lesson content stays in `content/`** (ADR-005, ADR-019).
- **Periods:** `SchoolPeriod` gives the unit for "period objectives" (Plan §5).

## English scaffolding extension point (not implemented)

French remains the only instructional language (ADR-001). English is never a second curriculum.

- **Reference labels** (levels, domains, holidays): English labels for parents, if ever needed, come from UI message catalogues keyed by the stable identifiers (`levels.maternelle-1`). No database column or migration is needed.
- **Learning content** (next phases): each lesson or activity may carry an optional `scaffolding.en` block with short instructions, hints, vocabulary equivalents and parent guidance, next to its French content. It is shown only when a child has `englishScaffoldingEnabled` (Plan §7).
- **No duplicated curriculum:** there are no parallel English files or tables.

## No runtime AI

Nothing here calls an LLM (ADR-002). Educational material drafted outside the app is imported as ordinary content and goes through schema validation and human review.
