# CLAUDE.md — Teka Edu session context

Read this file first in every session. It holds **stable context and working rules only**.

| File                            | Answers                                                                    |
| ------------------------------- | -------------------------------------------------------------------------- |
| `CLAUDE.md`                     | What to remember while working (this file)                                 |
| `PROJECT_STATUS.md`             | Where implementation stands, what is next                                  |
| `DECISIONS.md`                  | Why important choices were made (ADRs)                                     |
| `TEKA_EDU_PROJECT_PLAN.md`      | What Teka Edu should become (full spec, cited as "Plan §N")                |
| `README.md`                     | How a developer sets up, runs and tests the project                        |
| `docs/ENVIRONMENT_VARIABLES.md` | Every environment variable: the single authoritative inventory             |
| `docs/ENVIRONMENT_SETUP.md`     | Step-by-step configuration of local, Supabase, Vercel and GitHub           |
| `docs/DEPLOYMENT.md`            | Branch lifecycles, CI/CD pipelines, migrations, rollback, failures         |
| `docs/FREE_TIER.md`             | Free-tier limits (classified), cost, safety rules, zero-cost backup design |
| `docs/SCHOOL_CALENDAR.md`       | Calendar model, DRC holidays and sources, generator rules, 2026–2027 facts |
| `docs/EDUCATIONAL_MODEL.md`     | Education hierarchy, curriculum versions/domains, reference-data mirror    |
| `docs/CURRICULUM.md`            | Official objectives: sources, hierarchy, age bands, provenance, import     |
| `docs/DAILY_PROGRAMME.md`       | Daily programme generator, scheduling rules and where each one comes from  |
| `docs/CONTENT_AUTHORING.md`     | How to write lessons and activities, and the rules CI enforces             |

Do not copy content between these files. Link to it instead.

---

## Project identity

- **Project:** Teka Edu
- **Repository:** `ipanga/teka_edu` (https://github.com/ipanga/teka_edu)
- **Product language:** French
- **Initial educational scope:** 1ère maternelle, 2ème maternelle, 3ème maternelle
- **Future scope:** primary school, secondary school

Teka Edu is a French-first educational web app (installable PWA). It gives young children structured daily lessons (oral language, early literacy, early maths, movement, arts, time and space, discovery of the world). A parent guides each session at home, on a laptop or a projected TV, online or offline.

Only preschool is in scope now, but the domain model must not block later levels: no business logic may assume that exactly three class levels exist.

## Core product principles (non-negotiable)

1. **French-first.** The child experience is in French. English is only an optional, per-child scaffold and never the default instructional language. (ADR-001)
2. **Curriculum reference.** The official French Cycle 1 (école maternelle) curriculum for 2026–2027 is the primary academic reference. (ADR-003)
3. **DRC context.** Use the DRC school calendar and public holidays. Prefer DRC-relevant or universal examples over France-specific ones.
4. **Instructional days only.** Lessons exist only on valid instructional days. (ADR-004)
5. **Age-appropriate pedagogy.** Use play, manipulation, oral interaction, movement, songs, repetition and short activities, not worksheets. Do not turn 3ème maternelle (GS) into CP.
6. **Parent–child interaction.** Each lesson mixes on-screen work, talking with a parent, real objects, movement and an offline activity. The app is not a babysitting screen.
7. **Offline-first PWA.** Once content is downloaded, daily lessons and core games work without Internet.
8. **No runtime LLM in V1.** No AI SDKs, API keys or AI endpoints. (ADR-002)
9. **Content separate from code.** Curriculum and lessons are versioned, validated data, not UI code. (ADR-005)
10. **Positive progress tracking.** Progress is based on observation. No grades, red failure screens, rankings or leaderboards. (ADR-010)
11. **Privacy-first.** Local-first storage and the minimum of child data. (ADR-006)

## Technical architecture

Keep this table in sync with the repository. Mark a row **Implemented** only when it exists in code or configuration.

| Area                   | Choice                                                                            | Status                                       |
| ---------------------- | --------------------------------------------------------------------------------- | -------------------------------------------- |
| App framework          | Next.js 16 (App Router, standalone output) + React 19 + TypeScript 5.9            | Implemented (placeholder French home page)   |
| Styling / UI           | Tailwind CSS 4; shadcn/ui where useful                                            | Tailwind implemented; shadcn/ui planned      |
| Animation              | Framer Motion, only where it helps learning or UX                                 | Planned                                      |
| Env configuration      | `lib/env/` (Zod, public/server split, environment guard; ADR-021)                 | Implemented                                  |
| Health endpoint        | `/api/health` (status, environment, version, commit)                              | Implemented                                  |
| Content validation     | `scripts/validate-content.ts`: registration, Zod schemas, cross-file rules        | Implemented (reference data)                 |
| Reference data         | `content/` JSON → `lib/content/reference-data.ts` (bundled, offline; ADR-028)     | Implemented                                  |
| Calendar engine        | `domain/calendar/` (civil dates, holidays, instructional-day generator; ADR-029)  | Implemented                                  |
| Curriculum model       | `domain/curriculum/` (stages, levels, versions, domains, objectives; ADR-030/031) | Implemented (398 official objectives)        |
| Lessons / activities   | `domain/lessons/` (lesson + typed activities, English scaffolds; ADR-032)         | Implemented (20 pilot lessons, 3ème mat.)    |
| Daily programme        | `domain/programme/` (authored rhythm + tracks, pure generator; ADR-033)           | Implemented (pilot week; report + API)       |
| Local persistence      | IndexedDB behind repository interfaces                                            | Planned                                      |
| Offline                | PWA: manifest + service worker (library not chosen yet)                           | Planned                                      |
| Speech                 | `SpeechProvider` interface; `BrowserSpeechProvider` (Web Speech API, `fr-FR`)     | Planned                                      |
| i18n                   | `fr` default, optional `en`                                                       | Planned                                      |
| Unit / component tests | Vitest 5 + React Testing Library + jsdom                                          | Implemented                                  |
| E2E / smoke tests      | Playwright (Chromium)                                                             | Implemented                                  |
| Lint / format          | ESLint 9 (`eslint-config-next`) + Prettier                                        | Implemented                                  |
| Container              | `Dockerfile` (portable) + `Dockerfile.vercel` (Vercel container)                  | Implemented (built and smoke-tested locally) |
| Database               | Supabase (PostgreSQL 17): 28 reference tables mirrored from `content/` (ADR-028)  | Implemented (local + DEV); PROD untouched    |
| CI/CD                  | GitHub Actions: `ci.yml`, `deploy-staging.yml`, `deploy-production.yml`           | Implemented; run status in PROJECT_STATUS.md |
| Hosting                | Vercel container deployment, portable to any OCI host                             | Staging live; production deferred (ADR-027)  |

- **Deprecated / replaced:** plain Vercel/Next.js builds, replaced by `Dockerfile.vercel` container deployment (ADR-013).
- Real statuses per service live in `PROJECT_STATUS.md` (Infrastructure Status). Open questions are under "Important Pending Decisions" there.

## Repository architecture

This is the target layout (Plan §17). **Exists now:** `app/` (layout, placeholder page, `api/health`, `api/calendar/[date]`), `content/` (education, curriculum, calendars), `domain/` (calendar, curriculum), `lib/env/`, `lib/content/`, `lib/supabase/` (reference SQL generator), `scripts/`, `tests/`, `public/`, `supabase/`, `.github/workflows/`, `docs/`. **Not yet created:** `components/`, `domain/lessons|progress|review`, and the other `lib/` adapters. Update this section when the layout changes.

```text
app/          Next.js routes: (child)/ child area, parent/ parent area, api/ (health)
components/   UI: child/, parent/, activities/ (activity renderers), ui/
content/      Educational data: education/, calendars/, curriculum/ (+ objectives/), lessons/, programmes/, materials.json
domain/       Business logic without framework or storage code: calendar/, curriculum/, lessons/, progress/, review/
lib/          Adapters and utilities: env/ (configuration), content/ loaders, storage/ (IndexedDB), speech/, pwa/, supabase/
public/media/ Static educational media, referenced through a media registry
scripts/      Content validation, client-bundle secret check, standalone start, Docker smoke test
supabase/     config.toml, migrations/, seed.sql (local only), tests/ (pgTAP)
tests/        unit/ (Vitest), e2e/ (Playwright smoke)
docs/         Environment, variables and deployment documentation
.github/      GitHub Actions workflows
```

Dependency direction: `app/`, `components/` → `domain/` ← `lib/`. `domain/` must not import React, Next.js or browser storage APIs.

## Infrastructure and environments (summary)

Details are in `docs/`. Decisions are ADR-012 to ADR-021.

- **Environments:** local (Next.js dev + Supabase CLI stack in Docker), staging (`develop` → Supabase `teka-edu-dev` + Vercel Preview/staging), production (`main` → Supabase `teka-edu-prod` + Vercel Production). DEV and PROD never share credentials or databases. `lib/env` enforces this.
- **Supabase projects (ADR-024):**
  - They exist in Paris `eu-west-3`, on the Free plan: `teka-edu-dev` = `quyhkkizsmosybavoewd` and `teka-edu-prod` = `eganrivpkjhozkkahyxy`.
  - This working copy is linked to DEV only.
  - CI credentials are in the GitHub `staging` / `production` environments. Runtime values are in the owner's Keychain until they go into Vercel.
- **Containers:** `Dockerfile` (portable OCI image) and `Dockerfile.vercel` (Vercel builds and runs it as a container). Keep them in sync. The image is environment-neutral: **all configuration, including `NEXT_PUBLIC_*`, is read at runtime** (ADR-025). Never read a `NEXT_PUBLIC_` variable as a literal `process.env` member (a unit test enforces it). On Vercel, `PORT=3000` is required.
- **Vercel (ADR-026):**
  - Project `teka-edu` in team TEKA, on the Hobby plan, with the `container` preset.
  - Function region `cdg1`, with no Git connection.
  - Staging is Preview plus the alias https://teka-edu-staging.vercel.app, deployed on every merge into `develop`.
  - Production is prepared but not deployed: there is no production token and no domain.
- **Free tiers only (ADR-027):**
  - Vercel Hobby and Supabase Free, $0/month.
  - Never upgrade, buy add-ons, enter billing details or enable paid features. The default answer to any paid option is **no**; document the limitation in `docs/FREE_TIER.md` and prefer a free workaround.
  - No real children's or parents' data in the cloud; DEV uses synthetic data.
  - Production stays disabled until explicitly approved.
- **State:** the runtime is stateless. Data lives in Supabase or in the browser (IndexedDB). Curriculum stays in Git.
- **Database:** migration-only (`supabase/migrations/`), expand/contract, RLS on every public table, every public table listed with an access decision in `supabase/tests/database/rls.test.sql` (pgTAP enforces both), and no hosted dashboard schema edits.
- **CI/CD invariant:** GitHub Actions is the only deployer.
  - Order: CI, then migrations, then deploy, then smoke tests. Any failure stops the pipeline.
  - Vercel Git auto-deploy is off.
  - Deploy credentials live only in GitHub Environment secrets.
- **Secrets:** never `NEXT_PUBLIC_`, never committed, never printed.
- **No `.env*` file is ever tracked by Git, not even templates (ADR-023).** Environment variables are documented in `docs/ENVIRONMENT_VARIABLES.md`. Real values live only in local ignored files (`.env.local`) or in secure stores (GitHub Environment secrets, Vercel, Supabase).
- **Production promotion:** only `develop` or `hotfix/<name>` from this repository (never a fork) may be merged into `main` (the `Promotion source` check).

## Commands

```text
npm run dev | build | start (standalone server)      npm run verify   (format, lint, types, unit, content, build)
npm run lint | format | format:check | typecheck      npm run test | test:e2e   (e2e needs a build)
npm run content:validate | check:client-bundle        npm run docker:build | docker:run | docker:smoke
npm run db:start | db:stop | db:status | db:reset | db:test | db:types   (Supabase CLI; needs Docker)
npm run db:reference [-- --new-migration <name>]   (regenerate the reference-data pgTAP test / data migration)
npm run calendar:report [-- <YYYY-YYYY> --days]    (generated school calendar summary)
npm run programme:report -- --level=maternelle-3 --day=1 [--to=5|--date=YYYY-MM-DD]  (daily plan)
```

## Development workflow

```text
feature/*  -> develop  -> main
(work)        (staging)   (production)
```

- `develop` and `main` are protected by GitHub Rulesets (ADR-022). Every change, docs included, goes through a PR with green required checks, and direct pushes are rejected, even for the owner.
- Feature, fix, chore and docs PRs are **squash**-merged into `develop`. `develop → main` uses a **merge commit**. If you rename a CI job, update the rulesets' required checks in the same PR.
- Before calling work complete, run every check that applies: lint, format check, typecheck, unit tests, content validation, build, and where relevant E2E/smoke tests and Docker build.
- Never suppress a failing check (skip, `@ts-ignore`, `eslint-disable`, lowering thresholds) just to get a green run.
- Commit or push only when the user explicitly asks. Never create or modify remote Supabase or Vercel resources, or deploy, unless explicitly asked.

## School calendar rules

- The 2026–2027 school year runs from **2026-09-01** (instructional day 1) to **2027-07-02** (official MINEDU-NC calendar). The generator gives **189** instructional days.
- Lessons exist only on **Monday to Friday**. The ministry's four working Saturdays (results and report cards) are not lesson days.
- Excluded days: weekends, DRC public holidays (Ordonnance n° 23/042), school vacations, closures, and configured observed (substitute) days. An `instructional-day` exception can override them.
- Lesson numbers follow the instructional sequence, not the calendar date. An excluded weekday does not use up a lesson number.
- All calendar data is configuration: `content/calendars/cd/national.json` (holidays) and `content/calendars/cd/<year>.json` (school year, periods, exceptions). Never hard-code holidays, years or observance rules (such as Sunday substitution) in code.
- Calendar dates are civil `YYYY-MM-DD` values; never use `Date` for calendar arithmetic (ADR-029).
- Details, sources and open uncertainties: `docs/SCHOOL_CALENDAR.md`.

## Curriculum rules

- **Primary reference:** the official French École Maternelle / Cycle 1 curriculum applicable in 2026–2027: the arrêté du 16 avril 2026 (BO n° 19 du 7 mai 2026), with the arrêté du 22 octobre 2024 (BO n° 41) for language and mathematics. Curriculum version `maternelle-cycle1-cd-2026` (`docs/EDUCATIONAL_MODEL.md`).
- **Class mapping:** 1ère maternelle → Petite Section (PS), 2ème → Moyenne Section (MS), 3ème → Grande Section (GS).
- The six learning domains (Plan §3.1, verified against the 2026 annex) have the codes `LANG`, `PHYS`, `ART`, `MATH`, `TIME-SPACE`, `WORLD`.
- **398 official objectives and 529 success examples are imported verbatim** with their source and page (ADR-031). Never reword them, never normalise their punctuation, and never mark Teka Edu wording as official. Codes: `DOMAIN-Snn-Cnn-Onn` (`docs/CURRICULUM.md`).
- Objectives are stated by **age band** (`before-4`, `from-4`, `from-5`); the level → band mapping is a Teka Edu decision. A lesson may use its band or an earlier one, never a later one.
- Reference data is canonical in `content/`; after changing it, generate a data migration (`npm run db:reference -- --new-migration <name>`, ADR-028).
- **Never invent curriculum references, competency wording or official sources.** If something is uncertain, mark it `needsVerification` (or leave a clear TODO) and list it in `PROJECT_STATUS.md`.

## Educational content rules

- Content lives in `content/` as structured data (JSON/YAML, Markdown where appropriate), never in components.
- Every lesson and every activity traces to at least one official objective code, and separates what it **teaches** from what it **reinvests** (`docs/CONTENT_AUTHORING.md`).
- Lessons and activities are always `teka-edu-created`; the database refuses to store one as official text.
- The daily programme is generated from an authored rhythm + tracks, keyed by **instructional-day number** (ADR-033). Scheduling rules are labelled OFFICIAL / OFFICIAL GUIDANCE / TEKA EDU in `docs/DAILY_PROGRAMME.md`.
- The authoring pipeline is strictly ordered:

  ```text
  curriculum → year progression → period objectives → weekly objectives
    → daily lessons → schema validation → pedagogical (human) review
  ```

- Never generate the whole school year in one pass. Pilot first: the first 2 weeks per class, reviewed, before scaling (Plan §28).
- LLM-drafted content must pass schema validation and human review before it is committed.
- Commit only media the project is licensed to use. The repository is **public**.

## Child UX rules

- The child-facing UI is in French by default.
- Large touch targets, very little text to read, strong visual support, and audio for instructions and words.
- No ads, no social features, no chat, no public profiles, no dark patterns, no infinite scroll, and no competitive leaderboards.
- Collect no child data beyond: local ID, nickname, class, optional primary language, and French support level.
- The parent area is separate from the child area.
- Keep TV/presentation mode working: fullscreen, large text and images, keyboard/mouse controls for the parent.

## Engineering rules

1. Read the existing code before changing it.
2. Prefer simple architecture over early abstraction.
3. Keep dependencies few. Use current stable versions and check them with the package registry at install time.
4. Do not use `any` unless there is a written justification. Do not suppress TypeScript errors.
5. Never commit secrets, and never create a tracked `.env*` file. Environment variables hold configuration only, never curriculum.
6. Never claim implementation status that is not true.
7. Add automated tests for domain logic, especially calendar, curriculum, content validation and review scheduling (required tests: Plan §41).
8. Keep educational content out of UI components.
9. Keep the app working offline.
10. Keep the app portable away from Vercel.
11. Do not add an LLM SDK or API unless the user explicitly asks.
12. Update the documentation after significant implementation changes.
13. Avoid very large files. Record non-obvious decisions in `DECISIONS.md`.
14. Flag uncertain pedagogical content for review instead of presenting it as final.

## Documentation protocol

At the start of every session:

1. Read `CLAUDE.md`, then `PROJECT_STATUS.md`, then `DECISIONS.md`.
2. Read only the sections of `TEKA_EDU_PROJECT_PLAN.md` that the task needs. Read the whole plan only when the task needs wide context. For infrastructure work (env vars, Docker, database, CI/CD, Supabase, Vercel, branch workflow), also read `docs/ENVIRONMENT_SETUP.md`, `docs/ENVIRONMENT_VARIABLES.md`, `docs/DEPLOYMENT.md` and `docs/FREE_TIER.md`.
3. Check the actual repository (`git status`, `git log`, the files) before coding, because the docs can be out of date.

Which source wins when documents disagree:

- **Intended behavior:** `TEKA_EDU_PROJECT_PLAN.md` → `DECISIONS.md` → `CLAUDE.md`
- **What is implemented:** repository code → Git history → `PROJECT_STATUS.md`

If a document conflicts with the code, find out which one is out of date and fix it. Never assume silently.

## Session completion protocol

After meaningful work:

1. Run the checks that apply.
2. Update `PROJECT_STATUS.md` (status, quality table, last session summary).
3. Add or amend an ADR in `DECISIONS.md` if an architectural or product decision was made.
4. Update `CLAUDE.md` only if stable context changed (architecture table, layout, rules).
5. Update `README.md` if setup, commands or usage changed.
6. If the work touched environment variables, Docker, database schema or migrations, CI, CD, Supabase or Vercel configuration, or the branch workflow, update the matching `docs/` file(s) **before** calling the task complete.
7. Report the Git status and any uncommitted work.

Documentation must match the repository. Never update docs just to mark work as done.
