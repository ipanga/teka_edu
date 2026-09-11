# Teka Edu — Decision Log

Short architecture/product decision records (ADRs). They cover decisions future sessions should not reopen without a new reason.

- Add an ADR only for a decision with lasting architectural or product impact.
- Never delete an ADR. To reverse one, add a new ADR and mark the old one `Superseded by ADR-XXX`.
- Status values: `Proposed`, `Accepted`, `Superseded`, `Deprecated`.
- "Plan §N" refers to `TEKA_EDU_PROJECT_PLAN.md`. Details stay there and are not copied here.

| ADR | Title                                                                      | Status                 |
| --- | -------------------------------------------------------------------------- | ---------------------- |
| 001 | French is the default product language                                     | Accepted               |
| 002 | No runtime LLM dependency in V1                                            | Accepted               |
| 003 | French Cycle 1 curriculum is the academic reference                        | Accepted               |
| 004 | Data-driven instructional calendar and lesson numbering                    | Accepted               |
| 005 | Educational content is versioned, validated data                           | Accepted               |
| 006 | Local-first V1 with storage behind repository interfaces                   | Accepted               |
| 007 | Single Next.js / TypeScript PWA                                            | Accepted               |
| 008 | Git branching: feature/* → develop → main                                  | Accepted               |
| 009 | Vercel hosting with a portable standard Dockerfile                         | Superseded by 012, 013 |
| 010 | Positive, observation-based assessment                                     | Accepted               |
| 011 | Four-file project documentation system                                     | Accepted               |
| 012 | Docker/OCI is the deployment format                                        | Accepted               |
| 013 | Vercel is the initial application host (container via `Dockerfile.vercel`) | Accepted               |
| 014 | Supabase is the managed PostgreSQL/backend platform                        | Accepted               |
| 015 | DEV and PROD use separate Supabase projects                                | Accepted               |
| 016 | GitHub Actions is the authoritative CI/CD orchestrator                     | Accepted               |
| 017 | Database changes are migration-only                                        | Accepted               |
| 018 | Application runtime remains stateless                                      | Accepted               |
| 019 | Canonical curriculum stays in Git; Supabase holds user data                | Accepted               |
| 020 | Phase 0 toolchain baseline                                                 | Accepted               |
| 021 | Centralised, validated environment configuration                           | Accepted               |
| 022 | Branch protection with GitHub Rulesets; merge strategy                     | Accepted               |
| 023 | No `.env*` files in the repository                                         | Accepted               |

---

## ADR-001 — French is the default product language

**Status:** Accepted · **Date:** 2026-09-11 · **Source:** Plan §2.1, §7, §25

**Context:** Teka Edu targets preschool children in a French-speaking context (DRC). Some of them come from English-speaking homes.

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
- `NEXT_PUBLIC_*` values are build arguments, because Next.js inlines them. Secrets are runtime-only.
- CI builds and smoke-tests the image on every PR, including a check that it exits gracefully on SIGTERM.

**Consequences:** One image is specific to one environment's public configuration. To move hosts, rebuild with that host's `NEXT_PUBLIC_*` values. `Dockerfile.vercel` (ADR-013) must stay in sync with `Dockerfile`.

---

## ADR-013 — Vercel is the initial application host (container via `Dockerfile.vercel`)

**Status:** Accepted · **Date:** 2026-09-11 · **Supersedes:** ADR-009

**Context:** The spec targets Vercel. Research on 2026-09-11 against the Vercel docs and the vercel/vercel source found:

- Vercel detects a root `Dockerfile.vercel`, builds it remotely (linux/amd64), stores it in the Vercel Container Registry (VCR), and runs it as a Vercel Function.
- Routing targets `$PORT`, which defaults to 80.
- The prebuilt deploy path does not pass build variables to `docker build`.

**Decision:**

- Staging and production run the app as a container via `Dockerfile.vercel`.
- Deploys use **remote builds** (`vercel deploy`, plus `--prod` for production), not `vercel build --prebuilt`, so that `NEXT_PUBLIC_*` values reach the image as build arguments.
- The container runs as non-root on port 3000, and the Vercel project sets `PORT=3000` in every environment.
- VCR is used implicitly. No second registry (GHCR) is added unless a concrete need appears; that would be a new ADR.
- Vercel-specific configuration is confined to `Dockerfile.vercel`, `vercel.json` and the deploy workflows. Application code has no Vercel dependency.

**Consequences:**

- Vercel function limits apply to the app (4.5 MB bodies, plan-dependent maximum duration).
- Every request reaches the container unless responses opt into CDN caching (a later optimisation).
- Staging uses Preview deployments, or a `staging` Custom Environment on the Pro plan.
- Forwarding `--build-env` values into container build arguments is inferred from source, not documented, so the smoke test tolerates a missing commit SHA.

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
  - `public.ts` holds the browser-safe `NEXT_PUBLIC_*` values, listed literally so Next.js can inline them, and validates them at import (build) time.
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
