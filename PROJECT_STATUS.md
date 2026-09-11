# Teka Edu — Project Status

Live implementation status. Read after `CLAUDE.md`. Update at the end of every meaningful session. Everything here must match the actual repository.

## Last Updated

```text
Date:       2026-09-11
Branch:     chore/free-tier-readiness-review (PR into develop)
Commit:     develop at 7b87e85; main at 1b95480
Updated by: Claude Code (claude-opus-5)
```

## Current Phase

```text
Phase 0 — Foundation: COMPLETE (2026-09-11)
Status:    The foundation is in Git and on GitHub. CI is verified on both push and pull_request
           events (Linux x86_64), and develop/main are protected by rulesets. The first
           develop → main promotion (PR #5) is done; no .env* file on either branch.
           Infrastructure for the development phase is complete and verified on free tiers
           (Vercel Hobby, Supabase Free, $0/month, ADR-027). Staging is live.
           Next: Phase 1 functional development on local + staging. Production stays disabled.
Objective: Next.js + TypeScript app with lint/format/test tooling, Docker, Supabase local
           stack, CI/CD workflows and environment documentation (Plan §38 Phase 0, §46).
```

## Overall Progress

```text
[x] Phase 0 — Foundation              (complete: CI verified on GitHub, branch protection active)
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
- [x] PR-triggered CI validated: PR #1 (`chore/validate-ci` → `develop`), CI run 34612652962, all 4 quality checks passed, squash-merged as `defb272`
- [x] Branch protection: rulesets "Protect develop" (22930061) and "Protect main" (22930078) active; verified through the API and a rejected direct push (GH013)

### Infrastructure foundation

- [x] `lib/env/`: typed env validation (public/server split, `server-only`, environment guard, key-prefix checks, no values in errors) and `instrumentation.ts` startup validation (ADR-021)
- [x] `/api/health` (status, environment, version, commit)
- [x] `Dockerfile` and `Dockerfile.vercel` (multi-stage, pinned `node:22.22.2-alpine3.22`, non-root, standalone), `.dockerignore`, `.vercelignore`, `vercel.json` (Git auto-deploy off)
- [x] `supabase/` (`config.toml` from CLI 2.117.0, PostgreSQL 17; `migrations/`; dev-only `seed.sql`; pgTAP RLS guard test)
- [x] `.github/workflows/`: `ci.yml`, `deploy-staging.yml`, `deploy-production.yml`
- [x] Environment variables documented in `docs/ENVIRONMENT_VARIABLES.md` (the single source of truth). **No `.env*` file is tracked** (ADR-023): the four placeholder templates were removed on 2026-09-11, and `.gitignore` ignores `.env` and `.env.*` with no exceptions
- [x] Scripts: `validate-content.ts`, `check-client-bundle.ts`, `start-standalone.mjs`, `docker-smoke.sh`

## Infrastructure Status

Values: `NOT STARTED` · `IN PROGRESS` · `CONFIGURED` · `VERIFIED` · `BLOCKED`.

| Area                            | Status                                           | Evidence / remaining                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Git repository                  | **VERIFIED**                                     | Initialised 2026-09-11 with no force push (the remote was empty beforehand). `origin/main` = `1b95480`, a merge commit of `3df64bf` + `4abe26e`; `origin/develop` = `4abe26e`. Both branches have identical trees.                                                                                                                                                                                                                         |
| Docker                          | **VERIFIED**                                     | Both images build, report healthy, run as user `node`, and exit on SIGTERM with code 143, both locally (arm64) and on GitHub runners (x86_64).                                                                                                                                                                                                                                                                                             |
| GitHub Actions                  | **VERIFIED**                                     | Push-triggered CI: VERIFIED (runs 34610713969, 34610729923, 34611359891, 34612999684, 34617650743 on the promotion merge; deploy jobs skipped as designed). PR-triggered CI: VERIFIED (PR #1, run 34612652962, Linux x86_64). No GitHub environments exist yet.                                                                                                                                                                            |
| Branch protection               | **VERIFIED**                                     | GitHub Rulesets active for `develop` and `main` (re-verified after the promotion; `main` accepted PR #5 only with all 5 checks green, merge commit only): PR required, 0 approvals, conversations resolved, 4 quality checks required (+ `Promotion source` on `main`), force push and deletion blocked, no bypass actors. A direct push to `develop` was rejected (GH013). Details: `docs/DEPLOYMENT.md`, ADR-022.                        |
| Supabase local                  | **VERIFIED**                                     | `db start` / `db reset` / `test db` (PASS) / `stop` all work. Full `supabase start` confirmed `sb_publishable_…` / `sb_secret_…` local keys, and the env validation accepts them.                                                                                                                                                                                                                                                          |
| Supabase DEV (`teka-edu-dev`)   | **VERIFIED**                                     | Ref `quyhkkizsmosybavoewd`, Paris `eu-west-3`, Free plan, ACTIVE_HEALTHY. Working copy linked. `db push` up to date (no migrations), remote pgTAP RLS test PASS, 0 public tables without RLS, security advisors clean. Pooled `DATABASE_URL` connects. CI secrets are in GitHub `staging`; runtime values are in the owner's Keychain.                                                                                                     |
| Supabase PROD (`teka-edu-prod`) | **VERIFIED**                                     | Ref `eganrivpkjhozkkahyxy`, Paris `eu-west-3`, Free plan, ACTIVE_HEALTHY. Read-only checks only: migration list empty, 0 public tables without RLS, security advisors clean; pooled `DATABASE_URL` connects. Nothing pushed or seeded. CI secrets are in GitHub `production`; runtime values are in the owner's Keychain.                                                                                                                  |
| GitHub environments             | **CONFIGURED**                                   | `staging` (branch `develop`): Supabase + Vercel secrets (incl. the project-scoped `VERCEL_TOKEN`) and `STAGING_DOMAIN`. `production` (branch `main`, required reviewer): Supabase secrets, `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` / bypass secret, **no `VERCEL_TOKEN`**.                                                                                                                                                                   |
| Database migrations             | **CONFIGURED**                                   | Migration-only pipeline in CI/CD. No migrations exist yet (no schema needed in V1). DEV: `db push` verified (up to date). PROD: untouched (read-only `migration list`).                                                                                                                                                                                                                                                                    |
| Vercel staging                  | **VERIFIED**                                     | Project `teka-edu` (Hobby, `container` preset, `cdg1`, no Git link). First verified deployment: run 34635262697, `dpl_99QEWbwtBTV53u5HzdudDaKndjgy` (Preview, READY, commit `e2f8f69`), alias https://teka-edu-staging.vercel.app. `/api/health` reports `staging` and the DEV ref; region `cdg1` confirmed by `x-vercel-id`. Protection returns 302 without auth. Browser bundle and logs are secret-free. `STAGING_DEPLOY_ENABLED=true`. |
| Vercel production               | **CONFIGURED (not deployed; deferred, ADR-027)** | Production scope has the PROD Supabase URL and publishable key, `NEXT_PUBLIC_APP_ENV=production` and `PORT=3000`. `NEXT_PUBLIC_APP_URL` is intentionally unset. There is no production `VERCEL_TOKEN`, and `PRODUCTION_DEPLOY_ENABLED` is unset. The only production deployment is the failed first one (never served).                                                                                                                    |
| Environment variables           | **CONFIGURED**                                   | Validation and Markdown inventory complete. Environment-file cleanup is VERIFIED on both `develop` and `main`: no `.env*` file in either tree, and the public default branch shows none (ADR-023). No hosted values exist yet.                                                                                                                                                                                                             |
| develop → main promotion        | **VERIFIED**                                     | PR #5, merged 2026-09-11 as merge commit `1b95480`. `Promotion source` passed on a real event ("'develop' from ipanga/teka_edu may be promoted to main", run 34617296272), and all 4 quality checks passed. The merge-triggered `Deploy production` run 34617650743 skipped its deploy job. There are no GitHub deployments or environments.                                                                                               |
| Repository security             | **VERIFIED**                                     | No real secret in the full Git history (gitleaks, all refs + pattern scan). Secret scanning and push protection enabled (no alerts). Fork PR workflows need owner approval for all external contributors. `Promotion source` checks the repository identity.                                                                                                                                                                               |
| Free-tier compliance            | **VERIFIED**                                     | Vercel Hobby with no payment method on file (no billing possible); Supabase DEV and PROD on Free; no add-ons. Platform cost **$0/month**. Limits and classification: `docs/FREE_TIER.md`.                                                                                                                                                                                                                                                  |
| Deployment documentation        | **CONFIGURED**                                   | Written. Must be re-checked against the first real staging and production deployments.                                                                                                                                                                                                                                                                                                                                                     |

## In Progress

```text
Task:           Free-tier readiness review (this PR)
Status:         Open as a PR into develop; merging triggers the next automatic staging deploy
Relevant files: docs/FREE_TIER.md (new), lib/env/schema.ts (strict project-ref guard),
                DECISIONS.md (ADR-027, ADR-015 amended), CLAUDE.md, docs/*
```

## Next Tasks

### P0 — Next

1. **Begin functional development** (Phase 1) on the verified local + staging infrastructure:
   - calendar and school-year domain models, the DRC holiday data file, the instruction-day generator and its tests (Plan §39 Tasks 5–6; needs PD-002 / PD-003)
   - curriculum and lesson schemas (Task 7)

### Deferred — production (not in the current phase, ADR-027)

- Vercel plan and production domain decisions, the production `VERCEL_TOKEN`, `NEXT_PUBLIC_APP_URL`, and a supervised first production deployment.
- Before any real PROD data: implement the zero-cost backup design (`docs/FREE_TIER.md`), custom auth SMTP, and a privacy/legal review.

### P1 — Soon

1. Official Cycle 1 curriculum source, then the competency catalogue (PD-004), needed for Task 7 content.
2. Monitor the container registry image count (50 per repository on Hobby, ISSUE-011).
3. Optional hardening: disable the unused legacy `anon` / `service_role` keys on both Supabase projects.

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

### ISSUE-006 — Every request reaches the Vercel container

Severity: Low (performance, cost) · Status: Open
Description: With the container preset, Vercel's CDN caches only responses that send `s-maxage` / `CDN-Cache-Control`. Next.js static assets send neither by default.
Recommended action: add CDN cache headers for `/_next/static/*` and media before real traffic.

### ISSUE-007 — Vercel function limits constrain media

Severity: Medium (for Phase 6 content) · Status: Open
Description: Requests and responses through the container are limited to 4.5 MB.
Recommended action: keep media files small, or serve large media from Supabase Storage or a CDN (PD-008).

### ISSUE-009 — Supabase Free plan: no backups

Severity: Medium (High once real data exists) · Status: Open
Description: Both projects are on the Free plan. That means no downloadable backups or point-in-time recovery, and a project pauses after about a week of inactivity.
Recommended action: before real child data reaches `teka-edu-prod`, implement the zero-cost encrypted `supabase db dump` design in `docs/FREE_TIER.md` (ADR-027: no upgrade in this phase). Pausing is tracked in ISSUE-012.

### ISSUE-010 — `DIRECT_DATABASE_URL` is IPv6-only

Severity: Low · Status: Accepted
Description: Supabase's direct host (`db.<ref>.supabase.co`) has only IPv6 addresses. It was refused from this network (IPv4) and will be unreachable from Vercel. Nothing uses it yet, and CI/CLI connect through the pooler.
Recommended action: for IPv4 tooling use the session pooler (pooler host, port 5432). Buy the IPv4 add-on only if a real need appears.

### ISSUE-011 — Container registry: 50 images per repository on Hobby

Severity: Medium (Monitor) · Status: Open
Description: Every staging deployment pushes one image (about 73 MB) to the registry repository `dockerfile`. Hobby allows 50 images per repository, and no automatic cleanup is documented. There were 4 images on 2026-09-11.
Recommended action: when about 40 are reached, prune old images that no retained deployment or alias uses (`vercel vcr image ls/rm`). This is a deletion, so it needs owner approval. Optionally skip staging deploys for documentation-only merges.

### ISSUE-012 — Supabase Free projects pause after about 7 days of low activity

Severity: Low (Monitor) · Status: Open
Description: DEV is touched by each staging deploy (migration steps). PROD is empty and will pause, which is harmless now. Restore from the dashboard at no cost (window 90 days to 1 year).
Recommended action: restore DEV if a staging deploy fails on a paused project. Restore PROD only when production is prepared.

### ISSUE-013 — Supabase built-in auth email: 2 emails per hour, only to team addresses

Severity: Blocker before public production (once auth is used) · Status: Open
Recommended action: configure a custom SMTP sender (free tiers exist) before real sign-ups.

### ISSUE-014 — Legacy Supabase keys (`anon`, `service_role`) still active

Severity: Low · Status: Open (recommendation only)
Description: Nothing uses them. Supabase deprecates them by the end of 2026, and turning them off (Settings → API Keys) is reversible.
Recommended action: with owner approval, turn them off in DEV first, confirm staging stays healthy, then do the same in PROD.

## Resolved Issues

- **ISSUE-005 (commit SHA forwarding)**, resolved 2026-09-11: `--build-env` does not reach container builds (Vercel passes no build arguments). The commit is now passed at runtime with `vercel deploy --env`, and `/api/health` reports the exact SHA (ADR-025).
- **First staging attempts (2026-09-11), all fixed, no production impact:**
  - Run 34628609695: Vercel's "first deployment is production" rule plus a missing container preset. The build was refused by the env guard and never served. Fixed in PR #9.
  - Run 34630689646: the target check using `vercel inspect` failed with a project-scoped token ("User not found"). Fixed in PR #10 (REST API).
  - Run 34631971649: the smoke test caught `environment: local` because Vercel passes no build arguments. Fixed in PR #11 (runtime configuration, ADR-025).
- **ISSUE-008 (Promotion source checked the branch name only)**, resolved 2026-09-11: `scripts/check-promotion-source.mjs` also requires the head repository ID to equal this repository's, so fork `develop` / `hotfix/*` branches are refused. Covered by 17 unit tests. Live check on a real `pull_request` event: draft PR #4 (`fix/*` → `main`) was refused by `Promotion source` (run 34615884503) and closed unmerged. The same-repo `develop` → `main` pass path was verified live on PR #5 (run 34617296272).
- **ISSUE-001 (not a Git repository)**, resolved 2026-09-11: Git initialised, and `main` and `develop` pushed to `ipanga/teka_edu` at `3df64bf`.
- **PD-001 (Vercel mechanism)**, resolved 2026-09-11: Vercel runs `Dockerfile.vercel` containers (ADR-013).
- **PD-009 (test runner)**, resolved 2026-09-11: Vitest (ADR-020).

## Blockers

### BLOCKER-001 — External accounts and credentials

Description: Applies to **production only**, which is deferred (ADR-027). There is **no blocker for development**. Production will later need a production `VERCEL_TOKEN`, a domain, a Vercel plan decision, backups, custom SMTP and a privacy review.
Required action: none in the current phase.

Phase 1 calendar and curriculum data also need PD-002, PD-003 and PD-004. That does not block the remaining Phase 0 work.

## Tests / Quality Status

Local runs on 2026-09-11 (macOS arm64, Node 22.22.2, Docker 29.7.2), repeated before the initial commit. The same checks also passed on GitHub runners (last line).

```text
Lint:                  PASS
Format:                PASS
TypeScript:            PASS
Unit tests:            PASS (44 tests, Vitest; includes promotion-source, runtime-config and strict-guard tests)
Content validation:    PASS (0 content files: none exist yet)
Playwright:            PASS (2 smoke tests against the standalone build)
Next.js build:         PASS
Client-bundle check:   PASS (sentinel secrets absent; a planted leak is detected)
Docker build:          PASS (Dockerfile and Dockerfile.vercel, with health and graceful-stop smoke)
Supabase DB tests:     PASS (pgTAP: RLS guard; a table without RLS correctly fails)
Workflow lint:         PASS (actionlint 1.7.12)
Secret scan:           PASS (gitleaks v8.30.1 on full Git history, all refs; pattern scan)
Promotion source live: REFUSED as expected (draft PR #4, fix/* → main, run 34615884503)
                       PASS for develop → main (PR #5, run 34617296272)
Tracked .env* files:   NONE (git ls-files)
GitHub Actions CI:     PASS on push (runs 34610713969, 34610729923, 34611359891, 34612999684)
                       and on pull_request (PR #1, run 34612652962); ubuntu-24.04 x86_64
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
Staging:    LIVE https://teka-edu-staging.vercel.app (Vercel Preview, container, cdg1, Supabase DEV); auto-deploys from develop
Production: DEFERRED (ADR-027). Supabase PROD empty; Vercel Production scope prepared; switch off, no token
CI:         Verified on GitHub for push and pull_request events; required by the develop/main rulesets;
            first production promotion PR #5 green
CD:         STAGING_DEPLOY_ENABLED=true (verified run 34635262697); PRODUCTION_DEPLOY_ENABLED unset
Remote:     github.com/ipanga/teka_edu (public). main (default) = 1b95480 (merge of develop 4abe26e);
            develop = 4abe26e. Same tree; develop lacks only the merge commit, which is expected (ADR-022)
```

## Deviations From the Infrastructure Spec (documented)

1. **`NEXT_PUBLIC_ENABLE_CLOUD_SYNC=false`** in the documented staging and production values, where the spec's examples say `true`. No sync feature exists yet (spec §55), and `true` makes the Supabase browser variables mandatory.
2. **CI on push:** `ci.yml` does not trigger on push by itself. The deploy workflows call it for the pushed commit, which gives the same coverage without running CI twice (spec §27 asks to avoid repeated work).
3. **No `vercel pull` / `vercel build` / `--prebuilt`:** container deployments use a remote `vercel deploy` (spec §32 anticipated this; ADR-013). All configuration, including `NEXT_PUBLIC_*`, is read at **runtime**, because Vercel's container builder passes no build arguments (ADR-025).
4. **`SUPABASE_DB_URL` not used.** Migrations use `supabase link` with `SUPABASE_DB_PASSWORD`.
5. **Additional variables:**
   - `PORT=3000` (Vercel, required)
   - `VERCEL_AUTOMATION_BYPASS_SECRET` (smoke tests)
   - `STAGING_DEPLOY_ENABLED` / `PRODUCTION_DEPLOY_ENABLED` (deploy gates)
   - `VERCEL_STAGING_TARGET` / `STAGING_DOMAIN` (optional)
   - `NEXT_PUBLIC_GIT_SHA` (runtime deployment metadata). The version comes from `package.json`; `NEXT_PUBLIC_APP_VERSION` was removed.
6. **No `lib/supabase/database.types.ts` yet.** There is no schema; `npm run db:types` was tested and works.
7. **No `.env*` templates** (spec §15–19 asked for four committed templates). The owner's stricter policy on 2026-09-11 removed them, and the values are documented in `docs/ENVIRONMENT_VARIABLES.md` instead (ADR-023).
8. **Local Supabase `edge_runtime` and `analytics` disabled** in `config.toml` to keep the stack light (ADR-014).

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
- **PD-010: Vercel plan**: **resolved for the current phase: Hobby, $0** (ADR-027). Revisit only at launch.
  - Staging is Preview plus an alias, and rollback goes only to the previous deployment.
  - Hobby is **non-commercial use only**, and its production domain cannot be protected.
  - Decide before any public production launch: Pro costs $20 per member per month.
- **PD-011: Regions**
  - Supabase: **resolved**, Paris `eu-west-3` for DEV and PROD (ADR-024).
  - Vercel function region: **resolved**, Paris `cdg1`, verified live (ADR-026).
- **PD-012: Domains**
  - Staging: `teka-edu-staging.vercel.app` (resolved).
  - Production domain: still open. It is required for `NEXT_PUBLIC_APP_URL` before any production deployment.
- **PD-013: Production approval**: **resolved.** The `production` environment requires the owner's approval (self-approval allowed).

## Last Session Summary

```text
Completed:  Free-tier readiness review (no cost incurred, production untouched).
            - Verified current official limits of Vercel Hobby and Supabase Free, classified in
              docs/FREE_TIER.md. Architecture verdict: suitable, unchanged.
            - Cost: $0. Vercel Hobby has no payment method on file; Supabase DEV and PROD on Free.
            - Security: gitleaks (full history) clean; no Keychain secret in history; staging
              browser code free of secrets, tokens, DB URLs and project refs; environments
              correctly scoped.
            - Found and fixed a gap: the env guard accepted an unrelated third Supabase project.
              It now requires the environment's own ref.
            - Production config audited read-only. CI/CD paths audited: production has four
              independent blocks (switch, branch rule, approval, no token).
            - Designed a zero-cost encrypted db-dump backup (not implemented); recommendations
              for legacy keys, DIRECT_DATABASE_URL (not needed; session pooler), registry
              pruning, pausing.
Changed:    docs/FREE_TIER.md (new), lib/env/schema.ts + tests, DECISIONS.md (ADR-027,
            ADR-015 amended), CLAUDE.md, PROJECT_STATUS.md, docs/*.
Tests:      See the Tests / Quality Status section; CI on the PR.
Remaining:  None for development. Production is deferred.
Recommended next task: begin functional development of Teka Edu (Phase 1) using the verified
            local + staging infrastructure.
```
