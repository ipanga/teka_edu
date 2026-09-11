# Teka Edu — Project Status

Live implementation status. Read after `CLAUDE.md`. Update at the end of every meaningful session. Everything here must match the actual repository.

## Last Updated

```text
Date:       2026-09-11
Branch:     chore/validate-ci (PR into develop)
Commit:     develop at 0800b48; main at 3df64bf (production baseline)
Updated by: Claude Code (claude-opus-5)
```

## Current Phase

```text
Phase 0 — Foundation
Status:    In progress. The foundation is in Git and on GitHub (main + develop). All CI jobs
           passed on GitHub runners through the push-triggered workflows. Remaining: a PR-based
           CI run, branch protection, and the external service setup.
Objective: Next.js + TypeScript app with lint/format/test tooling, Docker, Supabase local
           stack, CI/CD workflows and environment documentation (Plan §38 Phase 0, §46).
```

## Overall Progress

```text
[ ] Phase 0 — Foundation              (in progress: PR-based CI validation and branch protection pending)
[ ] Phase 1 — Curriculum Engine
[ ] Phase 2 — Child Experience
[ ] Phase 3 — Activity Engine
[ ] Phase 4 — Progress Tracking
[ ] Phase 5 — PWA / Offline
[ ] Phase 6 — Content Pilot
[ ] Phase 7 — Full 2026–2027 Curriculum
[ ] Phase 8 — Staging / Production    (workflows written; external services not configured)
```

## Completed

### Documentation

- [x] `TEKA_EDU_PROJECT_PLAN.md` (spec verbatim, plus §46 infrastructure addendum)
- [x] `CLAUDE.md`, `PROJECT_STATUS.md`, `DECISIONS.md` (ADR-001 to ADR-021), `README.md`
- [x] `docs/ENVIRONMENT_SETUP.md`, `docs/ENVIRONMENT_VARIABLES.md`, `docs/DEPLOYMENT.md`

### Foundation

- [x] Repository inspected (Plan §39 Task 1)
- [x] Next.js 16.3.4 + React 19.2.8 + TypeScript 5.9.3 (App Router, standalone output, ESM package), with a placeholder French home page
- [x] Tailwind CSS 4, ESLint 9 (`eslint-config-next`), Prettier, Zod 4
- [x] Vitest 5 + React Testing Library + jsdom (18 unit tests), Playwright 1.63 (2 smoke tests)
- [x] Toolchain decisions recorded (ADR-020): npm, Node 22 (`.nvmrc`), exact version pins
- [x] Git repository initialised on `main`; `origin` = `https://github.com/ipanga/teka_edu.git`
- [x] Initial commit `3df64bf` ("chore: initialize Teka Edu project foundation", 56 files; gitleaks: no leaks)
- [x] `main` pushed (default branch) and `develop` created from `main` and pushed; both track `origin`
- [ ] Branch protection / rulesets for `main` and `develop` (not yet configured; PR-triggered CI validation in progress)

### Infrastructure foundation

- [x] `lib/env/`: typed env validation (public/server split, `server-only`, environment guard, key-prefix checks, no values in errors) and `instrumentation.ts` startup validation (ADR-021)
- [x] `/api/health` (status, environment, version, commit)
- [x] `Dockerfile` and `Dockerfile.vercel` (multi-stage, pinned `node:22.22.2-alpine3.22`, non-root, standalone), `.dockerignore`, `.vercelignore`, `vercel.json` (Git auto-deploy off)
- [x] `supabase/` (`config.toml` from CLI 2.117.0, PostgreSQL 17; `migrations/`; dev-only `seed.sql`; pgTAP RLS guard test)
- [x] `.github/workflows/`: `ci.yml`, `deploy-staging.yml`, `deploy-production.yml`
- [x] Env templates (`.env.example`, `.env.local.example`, `.env.development.example`, `.env.production.example`) and `.gitignore` (real `.env*` ignored, templates kept)
- [x] Scripts: `validate-content.ts`, `check-client-bundle.ts`, `start-standalone.mjs`, `docker-smoke.sh`

## Infrastructure Status

Values: `NOT STARTED` · `IN PROGRESS` · `CONFIGURED` · `VERIFIED` · `BLOCKED`.

| Area                            | Status          | Evidence / remaining                                                                                                                                                                                                                                                                                               |
| ------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Git repository                  | **VERIFIED**    | Initialised 2026-09-11. `origin/main` and `origin/develop` both at `3df64bf`. No force push; remote was empty beforehand.                                                                                                                                                                                          |
| Docker                          | **VERIFIED**    | Both images build, report healthy, run as user `node`, and exit on SIGTERM with code 143, both locally (arm64) and on GitHub runners (x86_64).                                                                                                                                                                     |
| GitHub Actions                  | **IN PROGRESS** | Git initialization: COMPLETE. Push-triggered CI: VERIFIED (runs 34610713969 on main, 34610729923 and 34611359891 on develop; deploy jobs skipped as designed). PR-triggered CI: VALIDATION IN PROGRESS (`chore/validate-ci` → `develop`). Branch protection: NOT YET CONFIGURED. No GitHub environments exist yet. |
| Supabase local                  | **VERIFIED**    | `db start` / `db reset` / `test db` (PASS) / `stop` all work. Full `supabase start` confirmed `sb_publishable_…` / `sb_secret_…` local keys, and the env validation accepts them.                                                                                                                                  |
| Supabase DEV (`teka-edu-dev`)   | **BLOCKED**     | Project not created. Owner must create it and provide values (see below).                                                                                                                                                                                                                                          |
| Supabase PROD (`teka-edu-prod`) | **BLOCKED**     | Project not created. Owner action.                                                                                                                                                                                                                                                                                 |
| Database migrations             | **CONFIGURED**  | Migration-only pipeline in CI/CD. No migrations exist yet (no schema needed in V1). Nothing applied to any hosted database.                                                                                                                                                                                        |
| Vercel staging                  | **BLOCKED**     | No Vercel project, token or IDs. Staging deploy job gated by `STAGING_DEPLOY_ENABLED` (unset).                                                                                                                                                                                                                     |
| Vercel production               | **BLOCKED**     | Same as staging. Gated by `PRODUCTION_DEPLOY_ENABLED` (unset).                                                                                                                                                                                                                                                     |
| Environment variables           | **CONFIGURED**  | Templates, validation and inventory complete. No hosted values exist yet.                                                                                                                                                                                                                                          |
| Deployment documentation        | **CONFIGURED**  | Written. Must be re-checked against the first real staging and production deployments.                                                                                                                                                                                                                             |

## In Progress

```text
Task:           Phase 0 completion
Status:         Git bootstrap done; CI green on GitHub via push-triggered runs
Relevant files: .github/workflows/*, docs/ENVIRONMENT_SETUP.md
Remaining:      PR-based CI validation, branch rules, GitHub environments, Supabase and Vercel
                setup, first staging deployment
```

## Next Tasks

### P0 — Next

1. **Validate CI through a pull request:**
   - create `chore/validate-ci` from `develop` and open the first PR into `develop`
   - confirm the PR-triggered `ci.yml` run
   - then configure branch rules for `main` / `develop` with the CI job names as required checks (`docs/ENVIRONMENT_SETUP.md` section 9)
2. **Owner: external setup** following `docs/ENVIRONMENT_SETUP.md` sections 2–12. The value checklist is at the end of that file.
3. **First staging deployment:** set `STAGING_DEPLOY_ENABLED=true`, then verify:
   - `PORT=3000` routing
   - that `--build-env NEXT_PUBLIC_GIT_SHA` reaches the image (ISSUE-005)
   - the Deployment Protection bypass
   - that the container build is detected
     Then update this file and `docs/DEPLOYMENT.md` with what was observed.

### P1 — Soon

1. Calendar and school-year domain models, the DRC holiday data file, the instruction-day generator and its tests (Plan §39 Tasks 5–6). Needs PD-002 and PD-003.
2. Obtain and cite the official Cycle 1 curriculum text, then build the competency ID catalogue (PD-004).
3. Curriculum and lesson Zod schemas, registered in `scripts/validate-content.ts` (Task 7).
4. Fill `lib/env/supabase-projects.ts` with the DEV and PROD refs once the projects exist.

### P2 — Later

1. Minimal French child UI (Task 8), sample content (Task 9), IndexedDB progress (Task 10), PWA (Task 11).
2. CDN caching for static assets on the Vercel container (ISSUE-006).
3. Docker build caching in CI (buildx + GitHub Actions cache) if CI time becomes a problem.

## Known Issues

### ISSUE-002 — Official curriculum source not yet obtained

Severity: High for Phases 1, 6 and 7 · Status: Open
Description: The domain list in Plan §3.1 has not been checked against the official Bulletin officiel text, and no competency catalogue exists.
Recommended action: PD-004. Do not create competency IDs until the source is cited.

### ISSUE-003 — The school year is already under way

Severity: Medium (product timing) · Status: Open
Description: 2026-09-01 was instructional day 1. On 2026-09-11 it is day 9. The pilot covers days 1–5.
Recommended action: PD-005.

### ISSUE-004 — ESLint 9 is end-of-life upstream

Severity: Low · Status: Accepted for now
Description: `npm install` warns that ESLint 9.39.5 is no longer supported. create-next-app 16.3.4 still pins ESLint ^9.
Recommended action: move to ESLint 10 when `eslint-config-next` supports it (ADR-020).

### ISSUE-005 — Commit SHA forwarding on Vercel container builds is unverified

Severity: Low · Status: Open
Description: The workflows pass `--build-env NEXT_PUBLIC_GIT_SHA=…`. That these values reach a container build as `--build-arg` is inferred from the Vercel CLI source, not documented. The smoke test skips the commit check if `/api/health` reports `commit: null`.
Recommended action: confirm on the first staging deployment. If it does not work, pass the SHA another way.

### ISSUE-006 — Every request reaches the Vercel container

Severity: Low (performance, cost) · Status: Open
Description: With the container preset, Vercel's CDN caches only responses that send `s-maxage` / `CDN-Cache-Control`. Next.js static assets send neither by default.
Recommended action: add CDN cache headers for `/_next/static/*` and media before real traffic.

### ISSUE-007 — Vercel function limits constrain media

Severity: Medium (for Phase 6 content) · Status: Open
Description: Requests and responses through the container are limited to 4.5 MB.
Recommended action: keep media files small, or serve large media from Supabase Storage or a CDN (PD-008).

## Resolved Issues

- **ISSUE-001 (not a Git repository)**, resolved 2026-09-11: Git initialised, and `main` and `develop` pushed to `ipanga/teka_edu` at `3df64bf`.
- **PD-001 (Vercel mechanism)**, resolved 2026-09-11: Vercel runs `Dockerfile.vercel` containers (ADR-013).
- **PD-009 (test runner)**, resolved 2026-09-11: Vitest (ADR-020).

## Blockers

### BLOCKER-001 — External accounts and credentials

Description: Supabase DEV/PROD, the Vercel project, and the GitHub environments and secrets do not exist yet. Staging and production deployment cannot proceed without them.
Required action: owner follows `docs/ENVIRONMENT_SETUP.md` and provides the values listed in "Values still required from the owner".

Phase 1 calendar and curriculum data also need PD-002, PD-003 and PD-004. That does not block the remaining Phase 0 work.

## Tests / Quality Status

Local runs on 2026-09-11 (macOS arm64, Node 22.22.2, Docker 29.7.2), repeated before the initial commit. The same checks also passed on GitHub runners (last line).

```text
Lint:                  PASS
Format:                PASS
TypeScript:            PASS
Unit tests:            PASS (18 tests, Vitest)
Content validation:    PASS (0 content files: none exist yet)
Playwright:            PASS (2 smoke tests against the standalone build)
Next.js build:         PASS
Client-bundle check:   PASS (sentinel secrets absent; a planted leak is detected)
Docker build:          PASS (Dockerfile and Dockerfile.vercel, with health and graceful-stop smoke)
Supabase DB tests:     PASS (pgTAP: RLS guard; a table without RLS correctly fails)
Workflow lint:         PASS (actionlint 1.7.12)
GitHub Actions CI:     PASS on push-triggered runs 34610713969 (main) and 34610729923 (develop),
                       commit 3df64bf, ubuntu-24.04 x86_64; PR-triggered ci.yml NOT RUN yet
```

## Content Status

| Class           | Curriculum mapping | Week 1      | Week 2      | Full year   |
| --------------- | ------------------ | ----------- | ----------- | ----------- |
| 1ère maternelle | Not started        | Not started | Not started | Not started |
| 2ème maternelle | Not started        | Not started | Not started | Not started |
| 3ème maternelle | Not started        | Not started | Not started | Not started |

DRC 2026–2027 calendar data: Not started.

## Deployment Status

```text
Local:      Runs: npm run dev, npm run start (standalone), Docker image
Docker:     Verified locally (arm64) and in GitHub CI (x86_64), both Dockerfiles
Staging:    Not configured (no Supabase DEV / Vercel project); not deployed
Production: Not configured; not deployed
CI:         Passing on GitHub (push-triggered via deploy workflows); PR-triggered run pending
CD:         Deploy jobs skipped: STAGING_/PRODUCTION_DEPLOY_ENABLED unset; no GitHub environments
Remote:     github.com/ipanga/teka_edu (public). main (default) = 3df64bf; develop = main + documentation-only status commits
```

## Deviations From the Infrastructure Spec (documented)

1. **`NEXT_PUBLIC_ENABLE_CLOUD_SYNC=false`** in the staging and production templates, where the spec's examples say `true`. No sync feature exists yet (spec §55), and `true` makes the Supabase browser variables mandatory.
2. **CI on push:** `ci.yml` does not trigger on push by itself. The deploy workflows call it for the pushed commit, which gives the same coverage without running CI twice (spec §27 asks to avoid repeated work).
3. **No `vercel pull` / `vercel build` / `--prebuilt`:** container deployments use a remote `vercel deploy` so that `NEXT_PUBLIC_*` build arguments reach the image (spec §32 anticipated this; ADR-013).
4. **`SUPABASE_DB_URL` not used.** Migrations use `supabase link` with `SUPABASE_DB_PASSWORD`.
5. **Additional variables:**
   - `PORT=3000` (Vercel, required)
   - `VERCEL_AUTOMATION_BYPASS_SECRET` (smoke tests)
   - `STAGING_DEPLOY_ENABLED` / `PRODUCTION_DEPLOY_ENABLED` (deploy gates)
   - `VERCEL_STAGING_TARGET` / `STAGING_DOMAIN` (optional)
   - `NEXT_PUBLIC_APP_VERSION` / `NEXT_PUBLIC_GIT_SHA` (build metadata)
6. **No `lib/supabase/database.types.ts` yet.** There is no schema; `npm run db:types` was tested and works.
7. **Local Supabase `edge_runtime` and `analytics` disabled** in `config.toml` to keep the stack light (ADR-014).

## Important Pending Decisions

- **PD-002: School-year end date and DRC vacation periods** (before Phase 1 data)
  - The plan gives only 2026-09-01.
- **PD-003: DRC public holidays** (before Phase 1 data)
  - Verify the Plan §4.3 list against the current legal text.
  - Settle the rule for holidays falling on a weekend.
- **PD-004: Official curriculum text** (before Phase 1 competency data)
  - Obtain the exact Bulletin officiel reference and applicability date, and check reuse terms (the repository is public).
- **PD-005: Mid-year start** (before Phase 2)
  - Proposal: calendar-aligned by default, with a per-child position the parent can reset.
- **PD-006: PWA tooling** (before Phase 5)
  - Choose a maintained service-worker approach compatible with Next.js 16 / Turbopack.
- **PD-007: Offline speech** (before Phases 2 and 5)
  - Some browser voices are network-backed (`localService === false`). Consider prerecorded core audio.
- **PD-008: Media sourcing and licensing** (before Phase 6)
  - Also consider the 4.5 MB response limit (ISSUE-007).
- **PD-010: Vercel plan**
  - Hobby: staging is Preview plus an alias, and rollback goes only to the previous deployment.
  - Pro: a `staging` Custom Environment, and rollback to any earlier production deployment.
- **PD-011: Regions**
  - Supabase region (the same for DEV and PROD), and the Vercel function region next to it, both close to DRC users.
- **PD-012: Domains**
  - Production domain and staging domain.
- **PD-013: Production approval**
  - Whether to require manual reviewers on the GitHub `production` environment from the start.

## Last Session Summary

```text
Completed:  Git bootstrap.
            - Verified the remote was empty (no commits, branches, variables, secrets or
              environments).
            - Reviewed and extended .gitignore; checked the env templates (placeholders only).
            - Ran a pattern scan and gitleaks v8.30.1 on the staged content: no leaks.
            - Re-ran local validation (all PASS).
            - git init -b main, origin set, initial commit 3df64bf; pushed main; created and
              pushed develop.
            - The pushes triggered the deploy workflows: all CI jobs passed on GitHub and the
              deploy jobs were skipped.
Changed:    .gitignore (IDE/OS/credential patterns, in the initial commit). Status docs commit on
            develop: PROJECT_STATUS.md, CLAUDE.md (CI/CD row), docs/ENVIRONMENT_SETUP.md §9.
Tests:      Local PASS; GitHub CI PASS (push-triggered). PR-triggered CI not yet run.
Remaining:  PR-based CI validation, branch rules, owner setup of Supabase/Vercel/GitHub
            environments, first staging deployment.
Recommended next task: create chore/validate-ci from develop, open the first PR into develop,
            and validate the PR-triggered CI pipeline before configuring Supabase or Vercel.
```
