# Teka Edu — Decision Log

Short architecture/product decision records (ADRs). They cover decisions future sessions should not reopen without a new reason.

- Add an ADR only for a decision with lasting architectural or product impact.
- Never delete an ADR. To reverse one, add a new ADR and mark the old one `Superseded by ADR-XXX`.
- Status values: `Proposed`, `Accepted`, `Superseded`, `Deprecated`.
- "Plan §N" refers to `TEKA_EDU_PROJECT_PLAN.md`. Details stay there and are not copied here.

| ADR | Title                                                                                   | Status                 |
| --- | --------------------------------------------------------------------------------------- | ---------------------- |
| 001 | French is the default product language                                                  | Accepted               |
| 002 | No runtime LLM dependency in V1                                                         | Accepted               |
| 003 | French Cycle 1 curriculum is the academic reference                                     | Accepted               |
| 004 | Data-driven instructional calendar and lesson numbering                                 | Accepted               |
| 005 | Educational content is versioned, validated data                                        | Accepted               |
| 006 | Local-first V1 with storage behind repository interfaces                                | Accepted               |
| 007 | Single Next.js / TypeScript PWA                                                         | Accepted               |
| 008 | Git branching: feature/* → develop → main                                               | Accepted               |
| 009 | Vercel hosting with a portable standard Dockerfile                                      | Superseded by 012, 013 |
| 010 | Positive, observation-based assessment                                                  | Accepted               |
| 011 | Four-file project documentation system                                                  | Accepted               |
| 012 | Docker/OCI is the deployment format                                                     | Accepted               |
| 013 | Vercel is the initial application host (container via `Dockerfile.vercel`)              | Accepted               |
| 014 | Supabase is the managed PostgreSQL/backend platform                                     | Accepted               |
| 015 | DEV and PROD use separate Supabase projects                                             | Accepted               |
| 016 | GitHub Actions is the authoritative CI/CD orchestrator                                  | Accepted               |
| 017 | Database changes are migration-only                                                     | Accepted               |
| 018 | Application runtime remains stateless                                                   | Accepted               |
| 019 | Canonical curriculum stays in Git; Supabase holds user data                             | Accepted               |
| 020 | Phase 0 toolchain baseline                                                              | Accepted               |
| 021 | Centralised, validated environment configuration                                        | Accepted               |
| 022 | Branch protection with GitHub Rulesets; merge strategy                                  | Accepted               |
| 023 | No `.env*` files in the repository                                                      | Accepted               |
| 024 | Supabase projects in Paris (eu-west-3); credentials in Keychain and GitHub environments | Accepted               |
| 025 | Runtime configuration for container deployments                                         | Accepted               |
| 026 | Vercel project configuration: Hobby, Preview as staging, no Git connection              | Accepted               |
| 027 | Free tiers only during the development phase ($0/month)                                 | Accepted               |
| 028 | Reference data: canonical in Git, mirrored into PostgreSQL by generated migrations      | Accepted               |
| 029 | School calendar model: civil dates, data-driven holidays and exceptions                 | Accepted               |
| 030 | Education hierarchy and lightweight curriculum versioning                               | Accepted               |
| 031 | Official objectives imported verbatim, with provenance and age bands                    | Accepted               |
| 032 | One lesson/activity model, with typed payloads and a kind registry                      | Accepted               |
| 033 | Deterministic daily programme: authored rhythm and tracks, keyed by instructional day   | Accepted               |
| 034 | Home sessions adapt classroom rules; the DRC preschool programme diverges               | Accepted               |
| 035 | Content quality gate: AI-assisted lessons never approve themselves                      | Accepted               |
| 036 | Renderer families: ten interactions for fifteen activity kinds                          | Accepted               |
| 037 | Curriculum strategy in the DRC: keep French Cycle 1 now, prepare curriculum profiles    | Proposed               |

---

## ADR-001 — French is the default product language

**Status:** Accepted · **Date:** 2026-09-11 · **Confirmed:** 2026-09-12 (PD-018, ADR-037) · **Source:** Plan §2.1, §7, §25

**Context:** Teka Edu targets preschool children in a French-speaking context (DRC). Some of them come from English-speaking homes. The DRC's own programme expects the local or national language in the first two years of maternelle, so French-first is a deliberate choice rather than an inherited default; the owner confirmed it on 2026-09-12 (ADR-037).

**Decision:** All child-facing UI, instructions, curriculum labels and lessons are in French by default. English is an optional scaffold enabled per child (`englishScaffoldingEnabled`, `frenchSupportLevel`), shown as short vocabulary aids and parent notes, never full sentence-by-sentence translation. i18n supports `fr` (default) and optional `en` from the start.

**Consequences:** Every child-facing feature must work with English turned off. The curriculum is not machine-translated and English is not a second, equal curriculum. English scaffolding should reduce as French improves.

---

## ADR-002 — No runtime LLM dependency in V1

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Plan §2.2, §19, §35

**Context:** The app must work offline, on low connectivity and without per-use cost. Children's content must be reviewed before any child sees it.

**Decision:** V1 includes no OpenAI, Anthropic, Gemini or other LLM SDK, API key or runtime AI endpoint. LLMs may be used outside the app to help draft content, but that content goes through schema validation and human review before commit. A future optional boundary (`lib/ai/provider.ts`, `AI_ENABLED=false`) is allowed, but no AI features are built in V1.

**Consequences:** All educational content ships as static, reviewed data. Adding an AI dependency needs an explicit user request and a new ADR.

---

## ADR-003 — French Cycle 1 curriculum is the academic reference

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Plan §3, §8.3, §31–33

**Context:** Lessons need a recognised, coherent progression. DRC families using French-medium schooling benefit from alignment with the French école maternelle.

**Decision:** The primary reference is the official French École Maternelle / Cycle 1 curriculum applicable in 2026–2027. Class mapping: 1ère → PS, 2ème → MS, 3ème → GS. Competencies get stable internal IDs (for example `LANG-ORAL-01`), and every lesson references at least one. Ages are guidance, not admission rules.

**Consequences:**

- Competency data must be taken from the official text and cite its source. Nothing may be invented.
- **Open item:** the exact official text (Bulletin officiel reference and applicability date) has not yet been obtained or checked against the domain list in Plan §3.1. It is tracked in `PROJECT_STATUS.md`.

**Amended 2026-09-11 (Phase 1):** the open item is resolved.

- **Programme:** the programme in force for 2026–2027 is the **arrêté du 16 avril 2026** (NOR MENE2608627A, BO n° 19 du 7 mai 2026). It applies from the 2026–2027 school year and repeals the 2015/2021 programme. Its language and mathematics domains point to the arrêté du 22 octobre 2024 (BO n° 41).
- **Domains:** the six domains of Plan §3.1 match the official titles and order exactly.
- **Age bands:** the programme states objectives by age band rather than by PS/MS/GS. The PS/MS/GS mapping stays a Teka Edu decision.
- **Details:** `docs/EDUCATIONAL_MODEL.md`. Competency-level text is still to be taken from the annexes (PD-004).

---

## ADR-004 — Data-driven instructional calendar and lesson numbering

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Plan §4

**Context:** DRC public holidays and school closures change over time. Lessons must not fall on non-school days. Numbering must stay stable when days are excluded.

**Decision:**

- Instructional days are weekdays minus configured public holidays, closures and optional vacations.
- Holidays and closures are data in `content/calendars/cd/<school-year>.json`, each with date, name, type, exclusion flag, notes and source.
- Lesson numbering is a gap-free instructional sequence (2026-09-01 = day 1). It is not derived from calendar dates.
- School years are configuration (`SchoolYear`). No logic may hard-code 2026.

**Consequences:** The calendar engine is pure domain logic with required tests (Plan §41). Changing a holiday is a data change. That can shift which date each lesson number falls on, so content keyed by instructional day stays valid.

**Amended 2026-09-11 (ADR-029):** the fixed-date national holidays moved to `content/calendars/cd/national.json`. `content/calendars/cd/<school-year>.json` holds the school year, its periods and its dated exceptions (vacations, closures, one-off or observed holidays, exceptional instructional days).

---

## ADR-005 — Educational content is versioned, validated data

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Plan §2.2, §5, §8, §9, §28, §35

**Context:** A year of lessons for three classes must stay coherent, reviewable and traceable to the curriculum. It must not be written as 150+ unrelated pages.

**Decision:**

- Content lives in `content/` as JSON/YAML (and Markdown where appropriate), separate from UI code. It is organised as school year → class → period → week → day → activities.
- Zod schemas define every content type. Validation scripts run in CI and reject malformed content (the checks are listed in Plan §8.2).
- Activities use a fixed set of typed activity kinds rendered by a reusable engine. Lessons do not get custom code.
- A two-week pilot per class is validated before the rest of the year is scaled up.

**Consequences:** Content changes go through Git review and CI. A CMS is deferred (Plan §36). Media is referenced through a registry and never through hard-coded paths in components.

---

## ADR-006 — Local-first V1 with storage behind repository interfaces

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Plan §16 (Storage), §18, §26–27

**Context:** The app handles child data, must work offline, and should avoid backend cost and complexity at first. Cloud sync may come later.

**Decision:**

- V1 has no mandatory external database. Curriculum is static repository content, and child profiles and progress live in IndexedDB on the device.
- Persistence is reached only through repository interfaces (`ProgressRepository`, `LessonRepository`, `CalendarRepository`) so Supabase/PostgreSQL can be added later.
- Child profiles hold only: local ID, nickname, class, optional primary language, and French support level.

**Consequences:** Domain logic never calls IndexedDB or `fetch` directly. Progress stays on one device until sync exists, so there is no cross-device progress in V1.

**Amended 2026-09-11 (ADR-014, ADR-019):** Supabase infrastructure (projects, migrations, CI) now exists. V1 features still do not depend on it. Local-first storage stays the behaviour until cloud sync is deliberately implemented.

---

## ADR-007 — Single Next.js / TypeScript PWA

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Plan §16, §17, §43

**Context:** The target devices are laptops, tablets and TV projection. It must be installable and work offline, and a small team maintains it.

**Decision:** Build one Next.js (current stable) + React + TypeScript app with Tailwind CSS, Zod, ESLint and Prettier, delivered as a PWA. Tests use Vitest/Jest, React Testing Library and Playwright. There is no monorepo and no native app in V1.

**Consequences:**

- The test runner and PWA/service-worker tooling are chosen in Phase 0 and Phase 5, each recorded as a follow-up ADR. The test runner is now Vitest (ADR-020); PWA tooling is still open.
- Speech goes through a vendor-neutral `SpeechProvider`, with the browser Speech Synthesis API first (Plan §14).

---

## ADR-008 — Git branching: feature/* → develop → main

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Plan §21, §22

**Decision:** All work happens on `feature/*` branches, which are squash-merged into `develop` (integration and staging). `develop` is promoted to `main` (production). `main` is protected and requires CI. Nobody develops directly on `main`.

**Consequences:** CI runs on PRs to and pushes on `develop` and `main`. Deploys are staging from `develop` and production from `main`. Branch protection must be configured on GitHub. It was configured on 2026-09-11 (ADR-022).

---

## ADR-009 — Vercel hosting with a portable standard Dockerfile

**Status:** Superseded by ADR-012 and ADR-013 (2026-09-11) · **Date:** 2026-09-11 · **Source:** Plan §20, §22–24

> **Resolution:** the open question below was answered by research on 2026-09-11. Vercel **does** run user-supplied containers from a root-level `Dockerfile.vercel` (GA since 2026-06-30). See ADR-013.

**Context:** Vercel is the target host, but the product must be able to move to another OCI-compatible host.

**Decision:**

- Staging and production run on Vercel and are deployed from GitHub Actions.
- A production-grade multi-stage Dockerfile (standalone output, non-root user, healthcheck, no secrets) is maintained and built in CI as a first-class artifact.
- Deployment config stays out of application code.
- Local development never depends on Vercel.

**Open question:** Plan §17/§22 mention a `Dockerfile.vercel` and deploying a "staging container" to Vercel. As far as currently known, Vercel builds Next.js from source or prebuilt output and does not run a user-supplied Docker image. This must be checked against Vercel's current capabilities before Phase 8, and the mechanism settled in a follow-up ADR. Tracked in `PROJECT_STATUS.md`.

---

## ADR-010 — Positive, observation-based assessment

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Plan §12, §13

**Decision:**

- Progress uses a qualitative scale: Non observé / En cours de découverte / En cours d'acquisition / Acquis / À renforcer. There are no numeric grades, red failure screens, rankings or leaderboards.
- A deterministic spaced-review scheduler, with no AI, adds review activities. The curriculum still controls the order of new learning.

**Consequences:** Progress data is tracked per competency, together with attempts, last practice date, parent observation and next review date. The UI never shows the child a failure state.

---

## ADR-011 — Four-file project documentation system

**Status:** Accepted · **Date:** 2026-09-11

**Context:** Work spans many coding sessions, possibly by different agents. Context must be recoverable quickly without re-reading everything or duplicating the spec.

**Decision:** Each document has a separate job:

- `CLAUDE.md` holds stable context and rules.
- `PROJECT_STATUS.md` holds the live implementation status.
- `DECISIONS.md` holds the ADRs.
- `TEKA_EDU_PROJECT_PLAN.md` holds the full specification.
- `README.md` holds developer setup.

When documents disagree about intended behavior, the order is plan → decisions → CLAUDE.md. For what is implemented, the order is code → Git history → status.

**Consequences:** Documentation is updated in the same commit as the code it describes. `PROJECT_STATUS.md` is consolidated from time to time so it does not grow without bound.

**Extended 2026-09-11:** infrastructure details live in `docs/ENVIRONMENT_SETUP.md`, `docs/ENVIRONMENT_VARIABLES.md` (the single variable inventory) and `docs/DEPLOYMENT.md`. Sessions that touch infrastructure read them and keep them current.

---

## ADR-012 — Docker/OCI is the deployment format

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Infrastructure spec §5, §20, §33

**Context:** The app must stay portable. It should be runnable production-like on a laptop, and movable to any OCI host.

**Decision:**

- The application ships as an OCI image built from a multi-stage `Dockerfile` (`deps → builder → runner`).
- The image uses the Next.js standalone output, a pinned `node:<version>-alpine` base, `npm ci`, the non-root `node` user, `NODE_ENV=production`, and a `HEALTHCHECK` on `/api/health`.
- It contains no secrets.
- ~~`NEXT_PUBLIC_*` values are build arguments.~~ **Amended by ADR-025:** all configuration, including `NEXT_PUBLIC_*`, is read at runtime. Secrets are runtime-only.
- CI builds and smoke-tests the image on every PR, including a check that it exits gracefully on SIGTERM.

**Consequences:** Since ADR-025 the image is environment-neutral: the same image serves any environment, configured with runtime variables. `Dockerfile.vercel` (ADR-013) must stay in sync with `Dockerfile`.

---

## ADR-013 — Vercel is the initial application host (container via `Dockerfile.vercel`)

**Status:** Accepted · **Date:** 2026-09-11 · **Supersedes:** ADR-009

**Context:** The spec targets Vercel. Research on 2026-09-11 against the Vercel docs and the vercel/vercel source found:

- Vercel detects a root `Dockerfile.vercel`, builds it remotely (linux/amd64), stores it in the Vercel Container Registry (VCR), and runs it as a Vercel Function.
- Routing targets `$PORT`, which defaults to 80.
- The prebuilt deploy path does not pass build variables to `docker build`.

**Decision:**

- Staging and production run the app as a container via `Dockerfile.vercel`.
- Deploys use **remote builds** (`vercel deploy`, plus `--prod` for production), not `vercel build --prebuilt`, (the documented container path; the assumption that this passes `NEXT_PUBLIC_*` values as build arguments proved false, see ADR-025) so that `NEXT_PUBLIC_*` values reach the image as build arguments.
- The container runs as non-root on port 3000, and the Vercel project sets `PORT=3000` in every environment.
- VCR is used implicitly. No second registry (GHCR) is added unless a concrete need appears; that would be a new ADR.
- Vercel-specific configuration is confined to `Dockerfile.vercel`, `vercel.json` and the deploy workflows. Application code has no Vercel dependency.

**Consequences:**

- Vercel function limits apply to the app (4.5 MB bodies, plan-dependent maximum duration).
- Every request reaches the container unless responses opt into CDN caching (a later optimisation).
- Staging uses Preview deployments, or a `staging` Custom Environment on the Pro plan.
- ~~Forwarding `--build-env` values into container build arguments is inferred from source.~~ That was disproven on 2026-09-11: no build arguments are passed, and the commit is passed at runtime with `--env` (ADR-025). The smoke test still tolerates a missing commit SHA.

**Amended 2026-09-11 (first staging deployment):**

- The project must use Vercel's `container` framework preset (`vercel.json` `"framework": "container"`). A project created without framework detection builds with the generic `npm run build` instead of `Dockerfile.vercel`.
- Vercel makes the **first deployment of a new project a production deployment**, even without `--prod`. The staging workflow refuses to deploy into a project with no deployment, passes an explicit `--target`, and verifies the target through the REST API.
- Vercel's container builder passes **no build arguments** (ADR-025).
- A project-scoped Vercel token cannot use `vercel inspect` / `vercel alias` ("User not found"), so the workflows call the REST API for those.

---

## ADR-014 — Supabase is the managed PostgreSQL/backend platform

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Infrastructure spec §1, §8, §13–14, §55

**Decision:**

- Persistent cloud state, when needed, uses Supabase: PostgreSQL, then Auth and Storage when those features are enabled.
- Edge Functions are used only with a clear architectural reason. Next.js server code is preferred, and the local `edge_runtime` is disabled.
- Browser code uses the **publishable** key (`sb_publishable_…`), and security relies on **RLS**, never on client-side filtering.
- The **secret** key (`sb_secret_…`) is used only in server code when genuinely required. No new code relies on the legacy `anon` / `service_role` keys.
- The Supabase CLI is a pinned devDependency, so local and CI use the same version.

**Consequences:**

- Every table in `public` must have RLS enabled. A pgTAP test enforces this in CI.
- Setting up Supabase does not make V1 features depend on it (ADR-006 amendment).
- `@supabase/supabase-js` is not installed until the first feature needs it.

---

## ADR-015 — DEV and PROD use separate Supabase projects

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Infrastructure spec §2, §9, §53–54

**Decision:**

- Local uses the CLI stack. Staging uses `teka-edu-dev`. Production uses `teka-edu-prod`.
- The URL, keys, database URLs, project ref and database password are never shared between them.
- The app enforces this with an environment guard (`lib/env/schema.ts`):
  - `local` accepts only local Supabase and database hosts.
  - Hosted environments refuse local hosts and require https.
  - Once the project refs are recorded in `lib/env/supabase-projects.ts`, a deployment pointing at the other environment's project is refused.

**Consequences:** Connecting staging or local to PROD is a high-severity configuration defect. The guard turns the most likely mistakes into build or startup failures.

**Amended 2026-09-11 (free-tier review):** the guard is now an **allowlist**. Once an environment's project ref is known, its Supabase URL and database URLs must contain exactly that ref. A third, unrelated project is refused, not only the other environment's project.

---

## ADR-016 — GitHub Actions is the authoritative CI/CD orchestrator

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Infrastructure spec §4, §27–31, §58–60

**Decision:**

- `ci.yml` validates every PR into `develop` / `main`.
- `deploy-staging.yml` (push to `develop`) and `deploy-production.yml` (push to `main`) call CI for the same commit (reusable workflow), then migrate, deploy and smoke-test.
- Vercel's Git auto-deploy is disabled (`vercel.json` → `git.deploymentEnabled: false`), so there is exactly one deployer.
- Deployment credentials are **GitHub Environment secrets** (`staging` / `production`, same names, environment-specific values, restricted to their branch). They are never Vercel or app variables.
- Deploy jobs are gated by the repository variables `STAGING_DEPLOY_ENABLED` / `PRODUCTION_DEPLOY_ENABLED` until the services are configured.
- Deployments are serialised per environment and never cancelled mid-run.
- PRs into `main` must come from `develop` or `hotfix/*` in this same repository (branch name and head repository identity; see ADR-022).

**Consequences:** A failed check, migration or build stops the pipeline before anything is deployed, and a failed smoke test marks the deployment unhealthy. Manual production approval can be switched on through GitHub environment protection without changing the workflows.

---

## ADR-017 — Database changes are migration-only

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Infrastructure spec §11–12, §36–38, §57

**Decision:**

- Every schema change is a file in `supabase/migrations/`. It is tested locally (`db reset`, `test db`) and in CI on a fresh database, applied by CI/CD to DEV (on `develop`), then applied unchanged to PROD (on `main`).
- The deploy order is: CI, then **migrations**, then application, then smoke tests.
- Risky changes follow **expand, then contract**. Destructive migrations are labelled and never coupled to the release that stops using the old structure.
- There are no dashboard schema edits on hosted projects and no remote pushes from developer machines.
- `seed.sql` is local-only. Database rollback means a forward fix, or backups used by deliberate human decision; destructive rollback SQL is never automatic.

**Consequences:** Each application release must work with both the previous and the new schema. Migrations already applied to a hosted project are immutable.

---

## ADR-018 — Application runtime remains stateless

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Infrastructure spec §1, §6

**Decision:** Containers keep no state between requests or instances and never write persistent data to their filesystem. Persistent data lives in Supabase (or another external service) or in the child's browser (IndexedDB). Containers start from environment variables alone and shut down gracefully on SIGTERM.

**Consequences:** Instances can be scaled, replaced or rolled back at any time. File uploads, when they arrive, go to Supabase Storage.

---

## ADR-019 — Canonical curriculum stays in Git; Supabase holds user data

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Infrastructure spec §56; complements ADR-005

**Decision:** Curriculum, lessons and other canonical educational content remain validated, version-controlled files shipped with the application release. Supabase holds only dynamic, user-specific data (profiles, children, progress, settings) once cloud persistence is introduced. Production curriculum never comes from database seeds.

**Consequences:**

- Curriculum changes stay reviewable, validated by CI, easy to roll back and deterministic per release.
- A future admin or CMS tool (Plan §36) needs a new ADR if it moves canonical content into the database.

**Amended 2026-09-11 (ADR-028):** the database also holds a **generated, read-only mirror** of the reference data. That covers levels, curricula and domains, school years, periods, holidays and calendar exceptions, so future user data can reference them with foreign keys. The canonical copy stays in Git, and the mirror is written by generated migrations, never by seeds.

---

## ADR-020 — Phase 0 toolchain baseline

**Status:** Accepted · **Date:** 2026-09-11

**Context:** The toolchain was checked against the npm registry on 2026-09-11. create-next-app 16.3.4 pins TypeScript ^5, ESLint ^9 and React 19.2.x, even though TypeScript 7 (the native compiler) and ESLint 10 are published.

**Decision:**

- **Packages and versions:**
  - Package manager: **npm** (lockfile `package-lock.json`, `packageManager` field). It ships with Node, keeps Docker and CI simple, and is what the spec's examples use.
  - Node **22** LTS (`.nvmrc`).
  - Next.js 16.3.4, React 19.2.8, and **TypeScript 5.9**, not 7, until Next.js and typescript-eslint officially support it.
  - **ESLint 9** with `eslint-config-next`. ESLint 9 is end-of-life upstream; upgrade when `eslint-config-next` supports ESLint 10.
  - Tailwind CSS 4, Zod 4.
  - **Vitest 5** + React Testing Library + jsdom for unit and component tests. **Playwright** for E2E and smoke tests, Chromium only for now.
  - **tsx** to run TypeScript scripts.
  - Supabase CLI as a devDependency.
- **Package settings:**
  - Dependencies are pinned to exact versions.
  - The package is ESM (`"type": "module"`).
  - `npm run start` runs the standalone server exactly like the containers.

**Consequences:** Upgrades are deliberate, with a changelog check and green CI. The deprecated-ESLint warning during install is a known, accepted item (see `PROJECT_STATUS.md`).

---

## ADR-021 — Centralised, validated environment configuration

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Infrastructure spec §20, §52–54

**Decision:**

- All configuration is read through `lib/env/`:
  - `schema.ts` holds pure Zod schemas and the cross-variable and environment-isolation rules.
  - `public.ts` holds the browser-safe `NEXT_PUBLIC_*` values. ~~They are listed literally so Next.js can inline them.~~ Amended by ADR-025: it is a server-only `getPublicEnv()` that reads them at runtime.
  - `server.ts` holds the secrets, guarded by `import "server-only"`, so a Client Component import fails the build. They are validated on first use and at server start (`instrumentation.ts`).
- Empty values count as unset.
- Errors name the variable and never its value.
- Supabase keys are checked by prefix: a secret key placed in a `NEXT_PUBLIC_` variable is refused.
- `AI_ENABLED` must be `false` in V1.
- `docs/ENVIRONMENT_VARIABLES.md` is the single inventory.

**Consequences:**

- Application code does not read `process.env` directly, except in Next.js/tooling configuration.
- Adding a variable means updating the schema, the inventory (`docs/ENVIRONMENT_VARIABLES.md`) and, if public, both Dockerfiles' `ARG` lists. No `.env*` template exists (ADR-023).
- CI builds with fake sentinel secrets and fails if any appears in browser bundles.

---

## ADR-022 — Branch protection with GitHub Rulesets; merge strategy

**Status:** Accepted · **Date:** 2026-09-11 · **Refines:** ADR-008, ADR-016

**Context:**

- The pull-request CI was validated on PR #1.
- The repository has a single maintainer, so required approvals would make merging impossible, since authors cannot approve their own PRs.
- Squash-merging `develop` into `main`, or requiring `main` PRs to be up to date, would make every later promotion diverge or need `main` merged back into the protected `develop`.

**Decision:**

- **Mechanism:** repository **Rulesets**, not classic branch protection: "Protect develop" (id 22930061) and "Protect main" (id 22930078), both active.
- **No bypass actors.** The owner cannot push directly either.
- **Both branches:**
  - A PR is required, with 0 approvals and conversations resolved.
  - Force pushes and deletion are blocked.
  - The four CI quality jobs are required checks, pinned to the GitHub Actions app (integration 15368).
- **`main` also requires `Promotion source`**, so only `develop` or `hotfix/<name>` **from this repository** can be merged into it. It checks the head repository ID from the `pull_request` payload as well as the branch name, so fork branches are refused (hardened 2026-09-11).
- **Deployment jobs are never required checks** while deployments are disabled.
- **`develop`:**
  - The branch must be up to date before merging.
  - Merge methods: squash (normal PRs) and merge commit (a `main → develop` back-merge after a hotfix).
- **`main`:**
  - It does not need to be up to date.
  - Merge commits only, which preserves the shared `develop`/`main` history.
- Required approvals can be raised when collaborators join.

**Consequences:**

- Every change, including documentation, goes through a PR and green CI.
- Renaming a CI job requires updating both rulesets in the same PR.
- In an emergency, an admin can edit or disable a ruleset. That is a recorded, deliberate act, never a silent bypass.

---

## ADR-023 — No `.env*` files in the repository

**Status:** Accepted · **Date:** 2026-09-11 · **Amends:** ADR-021 · **Supersedes:** the template requirement in Plan §46.5 (original infrastructure spec §15)

**Context:** The repository is public. The committed `.env.example`, `.env.local.example`, `.env.development.example` and `.env.production.example` contained only placeholders: gitleaks and a pattern scan of the full history found no real value. Even so, `.env`-named files in a public repository invite copy-paste mistakes, and a template filled in by accident would be one `git add` away from publishing a secret.

**Decision:**

- No file whose name starts with `.env` is ever tracked by Git, templates included. This is intentionally stricter than the common `.env.example` practice.
- `.gitignore` ignores `.env` and `.env.*` with no exceptions.
- The four templates were removed in a normal commit. History was not rewritten, because they never contained a secret.
- Variables, with safe placeholder examples, are documented only in Markdown: `docs/ENVIRONMENT_VARIABLES.md` is the single source of truth.
- Real values live only in:
  - a developer's local, ignored `.env.local`, created by hand
  - GitHub Environment secrets and variables
  - Vercel project environment variables
  - Supabase

**Consequences:**

- There is no `cp .env.example` step: developers create `.env.local` themselves, and only when they need to override the working defaults.
- Tooling must not generate tracked `.env*` files. Build contexts (`.dockerignore`, `.vercelignore`) already exclude them.
- The public history still contains the removed placeholder templates. That is harmless and accepted.

---

## ADR-024 — Supabase projects in Paris (eu-west-3); credentials in Keychain and GitHub environments

**Status:** Accepted · **Date:** 2026-09-11 · **Implements:** ADR-014, ADR-015 · **Resolves:** PD-011 (Supabase part)

**Context:** Users are in the DRC, with some in Europe. Supabase has no African region, and Central African traffic generally reaches Europe first. The organization **TEKA** is on the Free plan with room for exactly two free projects. Credentials must never touch the repository (ADR-023), and GitHub secrets cannot be read back.

**Decision:**

- **Projects:** `teka-edu-dev` (`quyhkkizsmosybavoewd`, used by staging) and `teka-edu-prod` (`eganrivpkjhozkkahyxy`, used by production). Both are in **Paris `eu-west-3`**, and the Vercel function region should match (`cdg1`). They are separate projects with independently generated 40-character database passwords.
- **Credential custody:**
  - The CI credentials (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`) are GitHub **Environment** secrets, DEV values in `staging` and PROD values in `production` only.
  - The runtime values (URL, publishable key, secret key, `DATABASE_URL`, `DIRECT_DATABASE_URL`) and the passwords are kept in the owner's macOS Keychain, to be copied into Vercel in the next task. They are not GitHub secrets, because no workflow reads them.
- **Connections:**
  - `DATABASE_URL` is the Supabase transaction pooler (port 6543).
  - `DIRECT_DATABASE_URL` is the direct host, which is IPv6-only, so IPv4 tooling uses the session pooler.
- **Local development** keeps using the local stack (ADR-015). The working copy is linked to DEV; PROD is never linked locally.

**Consequences:**

- Free-plan limits apply to both projects: pausing after about a week of inactivity, no backups and no point-in-time recovery. PROD must be upgraded, or regularly exported, before real child data is stored.
- Changing region later means creating new projects and migrating.
- The legacy `anon` / `service_role` keys still exist but are unused. Disabling them is an optional hardening step.

---

## ADR-025 — Runtime configuration for container deployments

**Status:** Accepted · **Date:** 2026-09-11 · **Amends:** ADR-012, ADR-013, ADR-021

**Context:**

- The first real `Dockerfile.vercel` build (run 34630689646) showed `buildah` warning "missing `NEXT_PUBLIC_APP_ENV` build argument" for every `ARG`. That included values passed with `vercel deploy --build-env`.
- **Vercel's container builder passes no build arguments.** Project variables reach the container only at runtime.
- Next.js' build-time inlining of `NEXT_PUBLIC_*` therefore froze the defaults into the image. The staging deployment reported `environment: local`, which the deploy smoke test caught.

**Decision:**

- **Runtime reading:**
  - All configuration, public and secret, is read by the **server at runtime** from the container environment.
  - `lib/env/public.ts` is a server-only `getPublicEnv()` over `parsePublicEnv(process.env)`.
  - No code reads a `NEXT_PUBLIC_` variable as a literal `process.env` member; a unit test enforces this.
- **Rendering:** pages are rendered per request (`force-dynamic` in the root layout), so they reflect the running environment.
- **Validation:** configuration is checked at container start (`instrumentation.ts`) and confirmed by the deploy smoke tests. It is no longer checked at build time.
- **Browser access:** browser code never reads configuration itself. A future Client Component receives exactly the browser-safe values a Server Component passes to it.
- **Version and commit:**
  - The app version comes from `package.json`; `NEXT_PUBLIC_APP_VERSION` is removed.
  - The deployed commit is passed as a runtime variable (`vercel deploy --env NEXT_PUBLIC_GIT_SHA=…`).
- **Naming:** the `NEXT_PUBLIC_` prefix is kept, as the marker for browser-safe values.

**Consequences:**

- The image is environment-neutral: one build can serve staging, production or any OCI host.
- A misconfigured container fails at start, not at build. The staging smoke test covers this, and a local test proved a staging container with the PROD ref returns HTTP 500 and `EnvValidationError`.
- There is no static prerendering. That is acceptable for this app, and static assets are still built.

---

## ADR-026 — Vercel project configuration: Hobby, Preview as staging, no Git connection

**Status:** Accepted · **Date:** 2026-09-11 · **Implements:** ADR-013, ADR-016 · **Partly resolves:** PD-010

**Context:** Team TEKA is on the Vercel **Hobby** plan. It is free, hard limits pause usage rather than billing it, and it is restricted to **non-commercial, personal use**. Custom Environments (a named `staging` target) need Pro.

**Decision:**

- **Project:** `teka-edu` (`prj_cJcoXbMF0fi3Uf4SejFnRH6uCmph`), created without a Git connection. Git auto-deploys are also disabled in `vercel.json`, so the GitHub Actions workflows are the only deployment path.
- **Build and region:** `container` preset, function region `cdg1` (next to Supabase `eu-west-3`).
- **Staging:**
  - Staging is **Preview**. Only `develop` is ever deployed there, so the Preview scope carries the DEV values only.
  - Each staging deployment gets the alias `teka-edu-staging.vercel.app`, set through the REST API.
- **Production:** the Production scope carries the PROD values only.
- **Protection:** Vercel Authentication covers every deployment except custom domains. CI smoke tests use a Protection Bypass for Automation secret.
- **CI tokens:** owner-created in the dashboard, one per GitHub environment, scoped to the project. The CLI's own login cannot create tokens.

**Consequences:**

- A public production launch needs a plan decision: Hobby terms, plus the fact that the production domain cannot be protected on Hobby.
- Moving to Pro would allow a named `staging` Custom Environment (`VERCEL_STAGING_TARGET=staging`) and rollback to any earlier production deployment.
- The project's first (failed) production deployment is kept deliberately (ADR-013 amendment).

---

## ADR-027 — Free tiers only during the development phase ($0/month)

**Status:** Accepted · **Date:** 2026-09-11 · **Owner decision** · **Resolves:** PD-010 for the current phase

**Context:** Staging is verified and the next phase is application development. The owner requires zero platform cost until production readiness is explicitly approved.

**Decision:**

- **Plans:**
  - Vercel stays on **Hobby**.
  - Supabase `teka-edu-dev` and `teka-edu-prod` stay on **Free**.
- **Nothing paid:**
  - No upgrade, add-on (including the Supabase IPv4 add-on), billing information or paid feature is enabled.
  - The default answer to any paid proposal in this phase is **no**.
  - Where a requirement cannot be met for free, it is documented and classified in `docs/FREE_TIER.md` (OK / Monitor / Blocker before public production), and a free workaround is preferred.
- **Production stays disabled.** No production deployment, token, domain or DNS change is made in this phase.
- **No real personal data of children or parents in the cloud.** DEV uses synthetic data, and PROD stays essentially empty.
- **Local Supabase is preferred** for routine development, so cloud DEV resources are not consumed unnecessarily.

**Consequences:**

- The verified architecture (GitHub Actions → Vercel container → Next.js; Supabase via the pooler) is kept, because it fits the free tiers.
- Known limits to design around:
  - 50 container images per registry repository (needs periodic, owner-approved pruning)
  - the 4.5 MB response limit
  - Supabase pausing after about 7 days of low activity
  - no Supabase backups (a zero-cost `supabase db dump` design exists and must be implemented before real PROD data)
  - built-in auth email limits
  - Hobby's non-commercial terms
- The last three are **blockers before public production**, not before development.

---

## ADR-028 — Reference data: canonical in Git, mirrored into PostgreSQL by generated migrations

**Status:** Accepted · **Date:** 2026-09-11 · **Refines:** ADR-005, ADR-017, ADR-019

**Context:**

- Phase 1 introduces reference data: education levels, curriculum versions and domains, school years, periods, DRC public holidays and calendar exceptions.
- The app must work offline from bundled content (ADR-006, ADR-019).
- Future user data in Supabase (children, progress, daily plans) will need foreign keys to these entities, and the owner asked for strong database constraints and RLS.
- Keeping two hand-maintained copies would drift.
- `seed.sql` never reaches hosted projects, but the reference data is needed in every environment.

**Decision:**

- **Canonical copy:** `content/` JSON, validated by Zod schemas and domain rules (`npm run content:validate`) and imported statically by `lib/content/reference-data.ts`. The application reads only this copy.
- **Database mirror:** PostgreSQL holds the same rows in ten reference tables with their own constraints, written by **generated, idempotent migrations**:
  - `npm run db:reference -- --new-migration <name>` emits upserts for every row and deletes rows no longer in `content/`, children first.
  - A delete that would orphan user data fails on its foreign key instead of cascading.
  - Applied migrations are never edited; a content change means a new generated migration.
- **Drift guard:**
  - `npm run db:reference` also generates the pgTAP test `reference_data.test.sql`. It asserts that the migrated database equals `content/`, then re-applies the sync to prove idempotency.
  - A unit test fails if that generated test is stale.
- **Access:** RLS on, no policy, and no `anon` / `authenticated` privilege (server-only). The access-registry test forces a decision for every new public table.
- **Seeds:** `seed.sql` stays local-only and free of reference and child data.

**Consequences:**

- Reference data reaches DEV (and PROD, when production is enabled) through the normal migration pipeline. It is canonical data, not demo data.
- One source of truth, and CI proves the two copies are identical.
- An admin tool that edits the calendar in the database would move the source of truth for those rows, and needs a new ADR.

---

## ADR-029 — School calendar model: civil dates, data-driven holidays and exceptions

**Status:** Accepted · **Date:** 2026-09-11 · **Refines:** ADR-004

**Context:**

- The DRC has two time zones (UTC+1, UTC+2).
- DRC holiday observance changes in practice: Ord. 23/042 art. 2 moves a Sunday holiday to the preceding day, but recent communiqués moved days to Mondays, and it is unclear whether they cover schools.
- The ministry publishes an annual calendar with periods and vacations (MINEDU-NC, 26 June 2026, for 2026–2027).

**Decision:**

- **Civil dates:** calendar concepts use `YYYY-MM-DD` dates (PostgreSQL `date`), never timestamps.
  - Arithmetic uses integer day numbers, with no `Date`.
  - The only time-zone step turns an instant into a date, using the device's zone (server default `Africa/Kinshasa`).
- **Holidays:** fixed-date national holidays are data (`national.json`) with provenance and optional validity windows. **No substitution rule is coded**: substitute days are explicit `observed-holiday` exceptions citing their source.
- **School years:** each has its dates, instructional weekdays (Mon–Fri), periods and exceptions. The exception kinds are one-off holiday, observed holiday, vacation, closure and exceptional instructional day. An instructional-day exception overrides weekends and holidays, but may not contradict another exception.
- **Provenance:** every fact carries `authority` (`law` / `ministry` / `teka-edu`), `verification` and `source`.
- **Generator:**
  - Pure and deterministic: every date of the year, the gap-free instructional-day number, and every reason with a documented primary-reason precedence.
  - Its output is not persisted.
- **Saturdays:** the 2026–2027 maternelle calendar counts four Saturdays as working days for results and report cards. Teka Edu does not treat them as instructional days, because children's activities run Monday to Friday.

**Consequences:**

- Future years, ministry adjustments and substitute days are data changes: a content change plus a generated migration.
- The generator gives 189 instructional days for 2026–2027 against the ministry's 192, which include the four Saturdays. The period 5 difference is documented in `docs/SCHOOL_CALENDAR.md`.

---

## ADR-030 — Education hierarchy and lightweight curriculum versioning

**Status:** Accepted · **Date:** 2026-09-11 · **Refines:** ADR-001, ADR-003

**Decision:**

- **Hierarchy:** **stage → level** (`maternelle` → `maternelle-1..3`). Primary and secondary are added as data; there is no separate grade concept.
- **Identifiers:**
  - Stable slugs or codes that application logic uses and never displays.
  - French names and titles are the canonical display text.
  - Other languages come from UI message catalogues keyed by identifier, so translation needs no migration.
- **Curriculum versioning:**
  - A curriculum row is one version: stage, version label, status, reference citation, adaptation note.
  - It has its own domains (`learning-domain` or `transversal`) and the levels it covers, each with its reference section.
  - Each school year is assigned exactly one curriculum per stage.
  - A new programme is a new row; past years are never rewritten.
- **Domains:** the six Cycle 1 domains use the codes `LANG`, `PHYS`, `ART`, `MATH`, `TIME-SPACE`, `WORLD`.
- **Deferred:**
  - No `DailyPlan`, objective or lesson tables yet: those are the next phase, keyed by instructional-day number (ADR-004).
  - English scaffolding is a future optional `scaffolding.en` block on content entities, never a parallel curriculum.

**Consequences:** changes to the curriculum or the school system are additive data changes. The model is documented in `docs/EDUCATIONAL_MODEL.md`.

---

## ADR-031 — Official objectives imported verbatim, with provenance and age bands

**Status:** Accepted · **Date:** 2026-09-12 · **Implements:** ADR-003 · **Refines:** ADR-030

**Context:** Phase 2 needed the actual learning objectives. The programme in force is three
documents (arrêté du 16 avril 2026 for four domains; arrêté du 22 octobre 2024 for language and
mathematics). Their objectives are stated **by age band**, with "exemples de réussite" that the
tables do not align row-by-row with individual objectives. Teka Edu must never present its own
wording as official.

**Decision:**

- **Verbatim import.** Objectives and success examples are copied from the official PDFs, never
  reworded, summarised or normalised — not even their apostrophes, which the ministry's own
  files use inconsistently.
- **Structure:** domain → part → competency → objective, with success examples attached to a
  **competency and an age band** (not to an objective), because that is the only link the
  official tables make.
- **Age bands, not classes:** an objective is stored once with every band it belongs to. Levels
  are mapped to bands as a Teka Edu decision, and a level's programme includes earlier bands,
  because the programme expects earlier learning to be reinvested.
- **Provenance on every row:** `origin` (`official` / `teka-edu-adaptation` / `teka-edu-created`),
  a source document with its citation, URL and the SHA-256 of the imported PDF, and a page
  number. The database refuses official wording without a source.
- **Stable positional codes** (`PHYS-S01-C01-O03`) that do not depend on the French wording.
- **Verified import:** the importer (`tools/curriculum-import/`, kept in the repository for
  audit) cross-checks every extracted line against a second, independent PDF extraction and
  matches bullet counts exactly. 398 objectives and 529 success examples were imported this way.

**Consequences:** the application can always say what is official and what is ours. A new
programme is a new curriculum version, not an edit. Re-verification is possible because the
exact source files are identified by hash.

---

## ADR-032 — One lesson/activity model, with typed payloads and a kind registry

**Status:** Accepted · **Date:** 2026-09-12 · **Refines:** ADR-005

**Context:** Lessons contain activities of many kinds (conversation, counting, movement, song…),
and more kinds will come. A table per kind, or a JSON blob per lesson, would both be wrong.

**Decision:**

- **One `lessons` table and one `activities` table.** The kind is a value (`activity_types`
  registry generated from the code), never a table. Relationships that PostgreSQL can model —
  levels, objectives, materials, vocabulary, scaffolds — are their own tables with foreign keys.
- **`payload` is jsonb**, only for the kind-specific presentation data a future renderer needs.
  Each kind has a Zod payload schema, so an activity whose payload does not match its kind is
  rejected by content validation.
- **Traceability is mandatory:** every activity serves at least one official objective, and a
  lesson separates what it **teaches** from what it **reinvests**.
- **Instructions are split** into `childInstruction` (French, spoken to the child) and
  `adultGuidance` (spoken to the parent). English exists only as an optional `scaffold`, never as
  a second curriculum (ADR-001).
- **Lessons are always `teka-edu-created`.** A check constraint makes it impossible to store a
  lesson as official text.

**Consequences:** adding an activity kind is a data + renderer change with no migration. Progress
tracking can later reference an activity, a lesson or an objective directly.

---

## ADR-033 — Deterministic daily programme: authored rhythm and tracks, keyed by instructional day

**Status:** Accepted · **Date:** 2026-09-12 · **Implements:** ADR-004

**Context:** The product needs to answer "what should this child do today?" without an adaptive
algorithm, and without content becoming invalid when the calendar changes.

**Decision:**

- **Keyed by instructional-day number**, not by date. The calendar maps numbers to dates, so a
  holiday shifts dates and never the order of learning.
- **The programme definition is authored content**: a repeating `rhythm` of days made of slots,
  and one ordered `track` of lessons per domain. A reviewer can read the whole shape; nothing is
  generated by a scoring function.
- **The generator is pure**: rhythm day = `((n − 1) mod R) + 1`; each slot takes the next lesson
  of its track; an exhausted track yields an empty slot and a `partial`/`no-content` status
  rather than a repeat; a non-instructional date yields no programme at all.
- **Plans are not stored.** They are derived, like school days.
- **Balance rules are validated** for every generated day: session length, screen time at most
  half a session, a daily physical activity, no repeat on consecutive days, and every domain
  within one cycle. Rules are labelled OFFICIAL or TEKA EDU in `docs/DAILY_PROGRAMME.md`.
- **Progression is authored and checked**: an objective is discovered once per track, and a
  practice/consolidation/review lesson must build on something taught earlier.

**Consequences:** the same request always returns the same plan, which makes review, caching and
offline packaging straightforward. A spaced-repetition scheduler stays a later, separate concern.

---

## ADR-034 — Home sessions adapt classroom rules; the DRC preschool programme diverges

**Status:** Accepted · **Date:** 2026-09-12

**Context:** The official rules Teka Edu follows were written for a classroom, and a second
official programme exists for the DRC:

- The French programme prescribes **daily physical education of 30–45 effective minutes** and
  ministry booklets describe taught sessions of **20–30 minutes in a group of 4–6 children**.
  Teka Edu is one parent and one child at home.
- The **DRC PNEM (SERNAFOR, 2021)** sets a weekly grid of 30-minute slots, 08h30–12h00, with free
  activity closing each day and **physical activity about twice a week**.
- No official source gives an attention span for five-year-olds, and no French official source
  gives a numerical screen-time limit for ages 3–6 (the guidance is "exceptionnel, contenus
  éducatifs, toujours accompagné par un adulte").

**Decision:**

- Teka Edu keeps the **French Cycle 1 programme as its academic reference** (ADR-003) and uses
  the **DRC school calendar** (ADR-029). Where the two prescribe different rhythms, the French
  programme wins for now: movement is scheduled **every day**.
- Classroom durations are **not transposed as if they were evidence** for a home session. The
  30–45 minute home session for 3ème maternelle is a Teka Edu decision (Plan §6), recorded as
  such.
- Screen time is limited to **at most half a session**, as a checkable form of "exceptionnel and
  adult-accompanied". It is not presented as an official limit.
- Every scheduling rule is labelled OFFICIAL / OFFICIAL GUIDANCE / TEKA EDU in
  `docs/DAILY_PROGRAMME.md`.

**Consequences:** the divergence with the DRC programme is explicit and revisable (PD-016). If
Teka Edu later aligns with the PNEM grid, it is a change of programme definition — data, not
code.

---

## ADR-035 — Content quality gate: AI-assisted lessons never approve themselves

**Status:** Accepted · **Date:** 2026-09-12 · **Refines:** ADR-005, ADR-032

**Context:** Teka Edu's lessons are drafted with the help of a language model. Schema validation
proves a lesson is well-formed and traceable to an official objective; it cannot tell whether the
lesson suits a five-year-old. Fluent, well-structured content that nobody qualified has read is
exactly the failure mode a children's product cannot afford, and "we will review it later" is not
a control.

**Decision:**

- **Lifecycle:** `draft` → `review` → `approved` → `retired`. AI-assisted content stops at
  `review`; only a person moves it to `approved`.
- **An approval is attributable:** it records the reviewer's name, their role, the date, and a
  digest of the exact text reviewed. The database enforces that all four exist together, and only
  for an approved lesson.
- **An approval is bound to the text.** `reviewedDigest` covers the child instruction, the adult
  guidance, the objectives, durations, materials, vocabulary, scaffolds and payloads. Any edit
  changes the digest, content validation fails, and the lesson returns to `review`.
- **Only approved content may be taught.** `isTeachable` is the single place that decides, so the
  rule cannot drift as features are added.
- **Official curriculum is not subject to this gate**: quoted objectives are verified by their
  import and provenance (ADR-031), not by pedagogical review.
- **No identity system.** The reviewer is a name and a role in the content. Accounts and roles
  belong with the parent area, later.
- **Tests check structure, never judgement.** They assert that an approval is complete,
  attributable and current; they never attempt to score whether a lesson is pedagogically good.

**Consequences:** the pilot week stays `review` until a teacher reads it, and the repository can
state that plainly. Approving content becomes a deliberate, reviewable commit: fixes, then the
review block, generated together.

---

## ADR-036 — Renderer families: ten interactions for fifteen activity kinds

**Status:** Accepted · **Date:** 2026-09-12 · **Prepares:** Phase 3 · **Refines:** ADR-032

**Context:** Fifteen activity kinds exist. Building fifteen unrelated screens would multiply work
and give children fifteen different interaction grammars to learn.

**Decision:**

- Each activity kind is mapped to one of **ten renderer families**, recorded in
  `domain/lessons/renderers.ts` with its interaction, what the screen shows, the media it will
  need, how completion is evidenced, and whether it can work offline.
- The map is **planning data, not an implementation**. A test keeps it complete, so a new
  activity kind cannot be added without deciding how it would be shown.
- Three families (`oral-exchange`, `move`, `hands-on`) need no media and cover most of the pilot:
  Phase 3 can prove the daily flow before any media exists.
- `move` renders nothing: the screen must be able to disappear during an activity.
- Completion is mostly **confirmed by the adult**, not measured by the app, which matches the
  observation-based assessment of ADR-010.

**Consequences:** Phase 3 has a build order and a media dependency list before it starts. Details
in `docs/PHASE3_RENDERER_PLAN.md`.

---

## ADR-037 — Curriculum authority: French Cycle 1 is the programme, the PNEM is the compatibility layer

**Status:** Accepted · **Date:** 2026-09-12 · **Decided by:** the owner (resolves PD-017 and PD-018) · **Refines:** ADR-001, ADR-003

**Context:** Phase 2.5 read the DRC's own preschool curriculum in full — the _Programme National
de l'Enseignement Maternel_ (PNEM), SERNAFOR/DIPROMAD, August 2021 — and compared it with the
French Cycle 1 programme across sixteen aspects (`docs/DRC_CURRICULUM_COMPARISON.md`). Four
strategies were put to the owner. The child Teka Edu is built for attends a school in the DRC,
possibly following the Congolese programme, but should receive an academic progression calibrated
against the French system.

Three facts shaped the decision:

1. **The two programmes agree more than they differ** on what a five-year-old should learn. The
   pilot week, written against the French programme, lands inside the PNEM's own themes and
   third-year mathematics.
2. **The PNEM's text may not be copied.** edu-nc.gouv.cd prohibits reproduction without
   authorisation, and no open licence applies (ISSUE-020).
3. **Real differences exist**: language of instruction in the first two years, the frequency of
   physical activity, and whole activity families the PNEM timetables (vie pratique,
   comportement, promotion de la santé, and 2h30 a week of activités libres).

**Decision:**

- **The French Cycle 1 programme is Teka Edu's academic curriculum** — objectives, progression,
  competencies and expected outcomes all come from it (ADR-003, ADR-031). There is one
  curriculum, not two.
- **The PNEM is a compatibility, context and enrichment reference**, not a second programme. It
  is used to check that a child stays compatible with the Congolese school they attend, to find
  local terminology and practices, and to spot gaps worth covering as enrichment.
- **French remains the language of instruction** (ADR-001), including for a child whose school,
  home or previous schooling is not French-speaking. English stays an optional scaffold that
  supports comprehension, never replaces French, and reduces as French improves. There is no
  English curriculum.
- **The DRC school calendar continues to govern _when_ teaching happens** (ADR-029). Academic
  reference France, calendar and context DRC.
- **Where the two differ, the stronger expectation wins when it serves the child**: the French
  progression for language, literacy and mathematics as the academic standard; **daily** physical
  activity kept, even though the PNEM schedules it about twice a week; PNEM _vie pratique_ and
  free play supported as enrichment and optional extension, mapped onto existing Teka Edu
  domains rather than becoming new competing domains.
- **No second curriculum profile is built.** Strategy D's full PNEM profile is not implemented
  unless a concrete requirement later needs it; the lightweight compatibility mapping described
  in `docs/DRC_CURRICULUM_COMPARISON.md` is the designed mechanism, and it is additive when
  built.
- **Strategies B and C are rejected** (they require storing PNEM text) unless MINEDU-NC grants
  written permission.

**Consequences:** The academic bar is the French one, so Teka Edu is measured against a
progression it can quote and verify. The compatibility layer, once built, lets Teka Edu answer a
Congolese parent's question — _does this follow what my child's school teaches?_ — by reference,
without copying a text it is not licensed to copy. The PNEM never adds a second set of daily
work: it must not increase the child's workload (ADR-034 keeps the day at about 40 minutes).
Content authors take their objectives from the French programme and their examples, materials and
context from the DRC.

---

## ADR-038 — Mastery and enrichment, never premature acceleration

**Status:** Accepted · **Date:** 2026-09-12 · **Decided by:** the owner · **Refines:** ADR-037

**Context:** Deciding that the French programme is the academic reference raises the question of
how far beyond it Teka Edu should go. "Calibrated against the French system" could be read as an
invitation to teach earlier and faster, which is exactly the failure mode of ambitious preschool
material: CP content pushed into 3ème maternelle because it looks advanced.

**Decision:** The standard is **meet or exceed the learning expectations of the French curriculum
through mastery and enrichment, while remaining practically compatible with schooling in the
DRC** — not acceleration. In practice:

- satisfy the French expectations first, then consolidate them by repetition and revisiting;
- enrich with broader vocabulary, reasoning, autonomy, physical and artistic activity;
- **do not** teach primary-school content early to appear advanced, and do not raise the daily
  workload to fit more in (ADR-034);
- enrichment stays age-appropriate, and a child who has not consolidated a concept gets it again
  rather than the next one.

This is not a promise that any individual child will outperform a pupil in a French school, and
documentation must not say so.

**Consequences:** "Is this beyond the programme?" is no longer the test for new content;
"does a five-year-old actually master this, and is it developmentally right?" is. It gives
reviewers and authors a rule for rejecting content that is impressive but premature.

---

## ADR-039 — Teka Edu is a parent-led after-school reinforcement platform

**Status:** Accepted · **Date:** 2026-09-12 · **Decided by:** the owner · **Refines:** ADR-001, ADR-003, ADR-033, ADR-034

**Context:** Until now the product was described by what it contains — a curriculum, lessons, a
daily programme — rather than by the moment it is used in. That left real questions open: how
long is a session, who runs it, does it replace school, and may it claim to know what the
teacher taught that day.

**Decision:** Teka Edu is a **digital répétiteur guided by the parent**. A child attends school
during the day; afterwards, a parent opens Teka Edu and runs a structured session with them.

- **Duration: 30 to 45 minutes per instructional day**, about 35 where the pedagogy allows. The
  session is one block that **may be split in two**, because a five-year-old coming home from
  school does not always have 40 minutes of attention left. The daily plan therefore carries a
  **pause point**, computed from the session's own shape.
- **The parent is the adult who teaches.** Guidance is written for someone who is not a trained
  teacher: numbered, concrete, jargon-free, and short enough to read while the child waits.
- **Teka Edu does not replace school and never claims to know what the class did today.** It
  offers "la leçon du jour" — the day's reinforcement, aligned with the curriculum progression
  for that level and school date — not "what your teacher taught today".
- **The session is largely off-screen.** The screen carries the words the parent says and the
  material the child looks at, then gets out of the way for movement, manipulation and talk.
- **Each day brings something back**: a short retrieval at the start, and a consolidation on the
  last instructional day of each week. Revisiting is scheduled, not accidental.
- **Progress is remembered in the browser only** (`not_started` / `in_progress` / `completed`),
  per day. It is a convenience for the parent, never a record about a child, and the canonical
  programme does not depend on it (ADR-006).

**Consequences:** Every content and interface decision now has a test it must pass: _can a parent
who is not a teacher run this in about 35 minutes after school?_ Lesson text is written for that
adult, the interface is a stepper rather than a dashboard, and curriculum apparatus — objective
codes, competencies, success examples — stays out of the session screen and lives in the review
packages and the API. The 30-45 minute range is enforced by the programme validator, so content
cannot quietly grow past it.

---

## ADR-040 — A year's scope and sequence, before a month of lessons

**Status:** Accepted · **Date:** 2026-09-12 · **Extends:** ADR-033 · **Refines:** ADR-031

**Context:** Phase 2 authored a five-day pilot and Phase 3A had to author a month. Written month
by month, a programme drifts: the easy objectives get taught three times, the awkward ones never,
and nobody notices until June. The official programme states 398 objectives for cycle 1, of which
162 carry the `from-5` band that 3ème maternelle is meant to teach.

**Decision:** Author the **annual scope and sequence first**, as canonical content
(`content/programmes/<curriculum>/<level>-annual-plan.json`), and only then the month.

- The year's teaching set is the objectives of the level's **own age band**. Earlier-band
  objectives are reinvested by lessons as supporting objectives; they are not scheduled, because
  this level is not introducing them.
- Each entry says **when it must be introduced** (a window in instructional days), **how long it
  is reinforced**, **when it should be consolidated**, **how often it comes back**, and whether
  it needs a lesson of its own or can be embedded in another domain's.
- Each entry also records **`homeFeasibility`**: `full`, `partial` or `school-only`. Some official
  objectives assume a class, a stage or a swimming pool. Teka Edu reinforces what a home can
  carry and says so, rather than pretending a parent can do all of it.
- The plan is **pacing, never content**: it holds no lesson text.
- Keyed to **instructional-day numbers**, not dates (ADR-004), so a school closure moves the
  calendar without rewriting the progression.
- The first month is allocated **by hand**, because the rentrée has to teach what an after-school
  session can build on; the rest of the year is spread deterministically and refined as each
  month is authored. `tools/annual-plan/build.ts` regenerates it, and is kept for audit.

**Consequences:** Coverage becomes provable rather than hoped for: at any day, the plan says what
should have been taught, and a test compares that with the lessons that exist
(`npm run coverage:report`). It also makes the gaps visible early — 16 objectives that a home
session cannot fully carry were surfaced by writing the plan, not by discovering them in June.
