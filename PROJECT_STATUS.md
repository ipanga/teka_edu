# Teka Edu — Project Status

Live implementation status. Read after `CLAUDE.md`. Update at the end of every meaningful session. Everything here must match the actual repository.

## Last Updated

```text
Date:       2026-09-12
Branch:     develop
Commit:     develop at 35d4fd0; main at 1b95480
Updated by: Claude Code (claude-opus-5)
```

## Current Phase

```text
Phase 2.5 — Pedagogical review and content quality gate: IN PROGRESS (2026-09-12)
Status:    School-year model, DRC holiday rules, calendar exceptions, instructional-day
           generator, education structure (stage → level), curriculum versions and the six
           Cycle 1 domains exist as validated content, tested domain logic and a database
           mirror (10 reference tables, RLS server-only). Sources verified: MINEDU-NC
           calendar 2026-2027, Ordonnance n° 23/042, arrêté du 16 avril 2026.
           Phase 2 adds the official objectives (398, imported verbatim with provenance),
           the lesson/activity model, a pilot week for 3ème maternelle and a deterministic
           daily-programme generator with its API and report.
           Phase 2.5 pre-reviewed the pilot (0 blockers, 3 major defects found and fixed),
           read the DRC PNEM 2021 in full and compared it with the French programme, added
           the content quality gate (AI content can never approve itself) and planned the
           Phase 3 renderer families.
           Remaining before the child experience: HUMAN pedagogical review of the pilot
           (ISSUE-017), then the owner's curriculum-strategy decision (PD-017).
           Production stays disabled (ADR-027).
Objective: Plan §38 Phase 1 complete (curriculum engine); Phase 2 of the owner's plan
           (objectives, competencies, lessons, activities, daily programme).
```

## Overall Progress

```text
[x] Phase 0 — Foundation              (complete: CI verified on GitHub, branch protection active)
[x] Phase 1 — Curriculum Engine       (calendar, objectives, lesson/activity model, daily programme)
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

### Phase 1 — Educational foundation (PR `feat/educational-foundation`)

- [x] Calendar domain (`domain/calendar/`): civil dates without `Date`, holiday expansion, instructional-day generator, school-year lookup, validation (ADR-029)
- [x] Curriculum domain (`domain/curriculum/`): stages, levels, curriculum versions, domains, lookup and validation (ADR-030)
- [x] Reference content (`content/`): levels, curriculum `maternelle-cycle1-cd-2026`, DRC holidays (`national.json`), school year 2026–2027 (official dates, periods, vacations)
- [x] `lib/content/`: Zod schemas and the validated, bundled reference data; `npm run content:validate` checks registration, schemas and rules
- [x] Database: migration `20260911203000_educational_foundation` (10 tables, constraints, deferred triggers, RLS server-only) and generated data migration `20260911204157_reference_data_2026_2027` (ADR-028)
- [x] pgTAP: access registry guard, generated reference-data equality and idempotency test, 30 integrity tests
- [x] `npm run calendar:report`, `npm run db:reference`, `GET /api/calendar/<date>` (checked by the deploy smoke tests)
- [x] Docs: `docs/SCHOOL_CALENDAR.md`, `docs/EDUCATIONAL_MODEL.md`, ADR-028 to ADR-030, ADR-003/004/019 amended

### Phase 2 — Curriculum objectives, lessons and daily programme (PR `feat/curriculum-lessons-daily-programme`)

- [x] Official objectives imported verbatim from the three programme annexes: **398 objectives, 529 success examples**, 38 competencies, 19 parts, with source, page and SHA-256 provenance (ADR-031)
- [x] Import tool kept for audit (`tools/curriculum-import/`), with a cross-check against an independent PDF extraction (0 unmatched lines) and exact bullet counts
- [x] Age-band model (`before-4` / `from-4` / `from-5`) and the level → band mapping; a level's objectives include earlier bands (reinvestment)
- [x] Lesson and activity model with typed payloads, materials, French instructions, adult guidance and optional English scaffolds (ADR-032)
- [x] Pilot week for 3ème maternelle: 20 lessons, 40 activities, 5 complete days (40–41 min each)
- [x] Deterministic daily-programme generator keyed by instructional day, with balance and progression rules (ADR-033, ADR-034)
- [x] `GET /api/programme/<year>/<level>/<day>` and `npm run programme:report`
- [x] Database: 18 new tables (28 total), generated reference data, 119 pgTAP assertions
- [x] Docs: `docs/CURRICULUM.md`, `docs/DAILY_PROGRAMME.md`, `docs/CONTENT_AUTHORING.md`, ADR-031 to ADR-034

### Phase 2.5 — Pedagogical review, DRC comparison and quality gate (PR #17, merged)

- [x] Read the **DRC PNEM 2021** (140 pages) in full and compared it with the French Cycle 1 programme: `docs/DRC_CURRICULUM_COMPARISON.md`
- [x] Curriculum strategy recommended (keep French Cycle 1 now, prepare curriculum profiles) — **ADR-037 is `Proposed` and needs the owner (PD-017)**
- [x] Pre-review of 20 lessons and 40 activities against a 13-criterion rubric: 0 blockers, 3 major, 7 minor, 4 suggestions (`docs/PEDAGOGICAL_REVIEW.md`)
- [x] The 3 major defects, all from Phase 2, fixed: success examples presented at competency level, screen dependence corrected (daily screen time 0–6 min instead of 5–13), an objective actually exercised
- [x] Content quality gate (ADR-035): `draft → review → approved → retired`, an approval names a reviewer and is bound to a digest of the exact text; enforced in content validation and by database constraints
- [x] Materials carry `alternatives` and `safetyNote`; a lesson never depends on one particular object
- [x] Human review package generated from canonical content: `docs/review/2026-2027-maternelle-3-semaine-1.md`, kept current by a test
- [x] Phase 3 renderer families planned: 15 activity kinds → 10 families (ADR-036, `docs/PHASE3_RENDERER_PLAN.md`)
- [x] The official daily read-aloud rule re-verified in the source; the pilot's gap is documented rather than implied away
- [x] Reuse of both programmes examined from the documents themselves: attribution wording, the Licence Ouverte's date-of-update requirement (now `curriculum_sources.published_on`), exclusion of emblems, and three questions left for a lawyer (`docs/CURRICULUM.md`, ISSUE-021)
- [ ] **HUMAN pedagogical review of the pilot week — not done (ISSUE-017)**

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
| Database migrations             | **VERIFIED**                                     | Six migrations (Phase 1 schema + data, Phase 2 schema + data, Phase 2.5 quality gate + data). Local: `db reset` + 128 pgTAP assertions pass. DEV: all six migrations applied and local/remote lists match; row counts checked read-only (20 lessons, all `review`, 0 approved; 398 objectives; 529 success examples). Security and performance advisors: no issues. PROD: untouched.                                                       |
| Vercel staging                  | **VERIFIED**                                     | Project `teka-edu` (Hobby, `container` preset, `cdg1`, no Git link). First verified deployment: run 34635262697, `dpl_99QEWbwtBTV53u5HzdudDaKndjgy` (Preview, READY, commit `e2f8f69`), alias https://teka-edu-staging.vercel.app. `/api/health` reports `staging` and the DEV ref; region `cdg1` confirmed by `x-vercel-id`. Protection returns 302 without auth. Browser bundle and logs are secret-free. `STAGING_DEPLOY_ENABLED=true`. |
| Vercel production               | **CONFIGURED (not deployed; deferred, ADR-027)** | Production scope has the PROD Supabase URL and publishable key, `NEXT_PUBLIC_APP_ENV=production` and `PORT=3000`. `NEXT_PUBLIC_APP_URL` is intentionally unset. There is no production `VERCEL_TOKEN`, and `PRODUCTION_DEPLOY_ENABLED` is unset. The only production deployment is the failed first one (never served).                                                                                                                    |
| Environment variables           | **CONFIGURED**                                   | Validation and Markdown inventory complete. Environment-file cleanup is VERIFIED on both `develop` and `main`: no `.env*` file in either tree, and the public default branch shows none (ADR-023). No hosted values exist yet.                                                                                                                                                                                                             |
| develop → main promotion        | **VERIFIED**                                     | PR #5, merged 2026-09-11 as merge commit `1b95480`. `Promotion source` passed on a real event ("'develop' from ipanga/teka_edu may be promoted to main", run 34617296272), and all 4 quality checks passed. The merge-triggered `Deploy production` run 34617650743 skipped its deploy job. There are no GitHub deployments or environments.                                                                                               |
| Repository security             | **VERIFIED**                                     | No real secret in the full Git history (gitleaks, all refs + pattern scan). Secret scanning and push protection enabled (no alerts). Fork PR workflows need owner approval for all external contributors. `Promotion source` checks the repository identity.                                                                                                                                                                               |
| Free-tier compliance            | **VERIFIED**                                     | Vercel Hobby with no payment method on file (no billing possible); Supabase DEV and PROD on Free; no add-ons. Platform cost **$0/month**. Limits and classification: `docs/FREE_TIER.md`.                                                                                                                                                                                                                                                  |
| Deployment documentation        | **CONFIGURED**                                   | Written. Must be re-checked against the first real staging and production deployments.                                                                                                                                                                                                                                                                                                                                                     |

## In Progress

```text
Task:           None. Phase 2.5 is merged (PR #17) and deployed to staging.
Status:         Waiting on people, not on code: the human pedagogical review (ISSUE-017) and
                the owner's curriculum-strategy decision (PD-017, ADR-037 is Proposed).
                Phase 3 has not started.
Relevant files: domain/lessons/review.ts, domain/lessons/renderers.ts, lib/content/review-package.ts,
                scripts/review-package.ts, content/materials.json, content/lessons/**,
                supabase/migrations/2026091200*, docs/PEDAGOGICAL_REVIEW.md,
                docs/DRC_CURRICULUM_COMPARISON.md, docs/CONTENT_QUALITY_GATE.md,
                docs/PHASE3_RENDERER_PLAN.md, docs/review/
```

## Next Tasks

### P0 — Next

1. **Human pedagogical review of the pilot week** (ISSUE-017). The review document is ready at `docs/review/2026-2027-maternelle-3-semaine-1.md`; a person who teaches 3ème maternelle fills in the checklists, we apply their corrections, and only then does any lesson become `approved`.
2. **Owner decision on the curriculum strategy** (PD-017, ADR-037) and on the language of instruction (PD-018).
3. **Phase 3 (child experience)**: the ten renderer families of `docs/PHASE3_RENDERER_PLAN.md`, a French child UI for today's programme, media architecture (PD-008) and TV presentation mode.

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

### ISSUE-002 — Official curriculum source: competency text not yet extracted

Severity: Medium for Phases 6 and 7 · Status: Partly resolved (2026-09-11)
Description: The programme in force is identified and cited: arrêté du 16 avril 2026 (BO n° 19 du 7 mai 2026), with the arrêté du 22 octobre 2024 (BO n° 41) for language and mathematics. The six domain titles and order are verified. The competency catalogue (objectives per age band) has not been extracted yet.
Recommended action: PD-004, next phase. Do not create competency IDs until each is cited from the annexes.

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

### ISSUE-015 — DRC holiday substitution practice is uncertain

Severity: Low (calendar accuracy) · Status: Open
Description: Ord. 23/042 art. 2 moves a Sunday holiday to the preceding day, but Ministry of Labour communiqués in 2025–2026 gave Mondays off (also for Saturday holidays), and they do not clearly cover schools. For 2026–2027: 16 Jan 2027 (Sat), 17 Jan 2027 (Sun) and 1 May 2027 (Sat). Nothing is announced and no observed day is configured.
Recommended action: watch communiqués in early January and late April 2027. If schools are concerned, add an `observed-holiday` exception with its source and generate a data migration (docs/SCHOOL_CALENDAR.md).

### ISSUE-016 — Period 5 day count differs from the official calendar

Severity: Low · Status: Open
Description: The MINEDU-NC calendar gives 32 working days for maternelle period 5 (5 Apr – 21 May 2027). Monday–Friday minus the 6 April and 17 May holidays gives 33. The other period differences are explained by the four working Saturdays. The difference may anticipate a substitute day for 1 May.
Recommended action: none until an announcement. Recorded in docs/SCHOOL_CALENDAR.md and asserted in tests/unit/school-days.test.ts.

### ISSUE-017 — The pilot week has not had a human pedagogical review

Severity: High before any child uses it · Status: **Open** (unchanged by the Phase 2.5 pre-review)
Description: The 20 pilot lessons were pre-reviewed by Claude in Phase 2.5 (rubric, severities, three defects fixed), but **no teacher or early-childhood specialist has read them**. All 20 remain `status: review`; the quality gate makes it impossible for them to become `approved` without a named reviewer (ADR-035).
Recommended action: hand `docs/review/2026-2027-maternelle-3-semaine-1.md` to a person who teaches 3ème maternelle. Their answers to the five questions at the end of `docs/PEDAGOGICAL_REVIEW.md` decide whether content scaling can start.

### ISSUE-019 — The daily comprehension read-aloud is not yet daily

Severity: Medium (content calibration) · Status: Open
Description: The 2024 language annex asks for a taught read-aloud with comprehension work at least once a day, plus a separate daily reading without questions. The pilot has the pleasure reading every day but the comprehension read-aloud only once in five days.
Recommended action: when content scales, alternate the daily read-aloud (questions on some days) or lengthen the language block on days without a story lesson. Documented in `docs/DAILY_PROGRAMME.md` and `docs/PEDAGOGICAL_REVIEW.md`.

### ISSUE-020 — DRC official curriculum text may not be reproduced

Severity: Medium (legal) · Status: Open
Description: edu-nc.gouv.cd reserves all site content to the ministry: consultation, download and printing for personal and educational use with attribution, but reproduction or copying without authorisation is prohibited. There is no open licence, unlike the French texts. Teka Edu therefore **references** the PNEM and does not store its wording.
Recommended action: keep referencing only. If PNEM objectives are ever to be stored (Strategy B or C, ADR-037), request written authorisation from MINEDU-NC first. A human/legal opinion is needed before any such use.

### ISSUE-021 — Reuse of the French programme needs a legal opinion

Severity: Medium (legal) · Status: Open
Description: The three official annexes carry no rights notice. The exclusion of official texts from copyright is French **case law**, not a statutory exception, and education.gouv.fr states its reuse terms twice and contradictorily (an etalab-2.0 footer against restrictive _mentions légales_). Teka Edu takes the narrower reading and complies with the Licence Ouverte 2.0 in full — source, date of last update, no suggestion of endorsement, no emblem or logo — which is stricter than the doctrine would require. That is a defensible position, not a verified one.
Recommended action: put the three questions at the end of `docs/CURRICULUM.md` to a lawyer before any public launch. Nothing blocks development meanwhile: the position already taken is the conservative one.

### ISSUE-018 — Teka Edu diverges from the DRC preschool programme (PNEM 2021)

Severity: Medium (product alignment) · Status: Open
Description: The DRC has a national preschool programme (PNEM, SERNAFOR, août 2021) with a weekly grid of 30-minute slots, 08h30–12h00, daily free activity, and physical activity about twice a week. Teka Edu follows the French Cycle 1 programme (ADR-003) and schedules movement daily (ADR-034).
Recommended action: owner decision (PD-016) on whether to align the rhythm with the PNEM, and whether to map Teka Edu domains onto its activity categories.

## Resolved Issues

- **PD-004 (competency catalogue)**, resolved 2026-09-12: the objectives of the three official annexes are imported verbatim with provenance (398 objectives, 529 success examples). Reuse terms re-examined in Phase 2.5; the conditions and the remaining legal questions are in `docs/CURRICULUM.md` (ISSUE-021).
- **PD-002 (school-year end date and vacations)**, resolved 2026-09-11: official MINEDU-NC calendar of 26 June 2026 (maternelle: 1 Sep 2026 – 2 Jul 2027, six periods, four vacation periods), encoded in `content/calendars/cd/2026-2027.json`.
- **PD-003 (DRC public holidays)**, resolved 2026-09-11: Ordonnance n° 23/042 du 30 mars 2023 (ten holidays, including 6 April added in 2023). Weekend substitution is handled as data (observed-holiday exceptions), not code; the open practice question is ISSUE-015.
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

PD-002 and PD-003 are resolved. PD-004 (competency text) is needed for the next part of Phase 1.

## Tests / Quality Status

Local runs on 2026-09-11 (macOS arm64, Node 22.22.2, Docker 29.7.2), repeated before the initial commit. The same checks also passed on GitHub runners (last line).

```text
Lint:                  PASS
Format:                PASS
TypeScript:            PASS
Unit tests:            PASS (156 tests, Vitest: calendar, curriculum objectives, lessons/activities,
                       daily programme, programme API, quality gate, renderer families, review
                       package freshness, SQL generator drift, architecture, env guard)
Content validation:    PASS (18 JSON files: registered, schema-valid, consistent; includes the
                       progression and daily-balance rules)
Playwright:            PASS (4 smoke tests incl. /api/calendar and /api/programme)
Next.js build:         PASS
Client-bundle check:   PASS (sentinel secrets absent; a planted leak is detected)
Docker build:          PASS (Dockerfile and Dockerfile.vercel, with health and graceful-stop smoke)
Supabase DB tests:     PASS (128 pgTAP assertions in 4 files: RLS + access registry (28 tables),
                       reference data = content/ and idempotent sync, integrity rules, quality gate)
Workflow lint:         PASS (actionlint 1.7.12)
Secret scan:           PASS (gitleaks v8.30.1 on full Git history, all refs; pattern scan)
Promotion source live: REFUSED as expected (draft PR #4, fix/* → main, run 34615884503)
                       PASS for develop → main (PR #5, run 34617296272)
Tracked .env* files:   NONE (git ls-files)
GitHub Actions CI:     PASS on push (runs 34610713969, 34610729923, 34611359891, 34612999684)
                       and on pull_request (PR #1, run 34612652962); ubuntu-24.04 x86_64
```

## Content Status

| Class           | Curriculum mapping     | Week 1                                                                        | Week 2      | Full year   |
| --------------- | ---------------------- | ----------------------------------------------------------------------------- | ----------- | ----------- |
| 1ère maternelle | DONE (band `before-4`) | Not started                                                                   | Not started | Not started |
| 2ème maternelle | DONE (band `from-4`)   | Not started                                                                   | Not started | Not started |
| 3ème maternelle | DONE (band `from-5`)   | Written + pre-reviewed, **awaiting human review** (20 lessons, 40 activities) | Not started | Not started |

DRC 2026–2027 calendar data: DONE (official MINEDU-NC calendar and Ordonnance n° 23/042; 189 instructional days).
Curriculum: version `maternelle-cycle1-cd-2026`, six verified domains, **398 official objectives and 529 success examples** imported with provenance.

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
6. **No `lib/supabase/database.types.ts` yet.** The reference schema exists, but no application code queries the database (the app reads the bundled `content/`). Generate the types when the first database query is written.
7. **No `.env*` templates** (spec §15–19 asked for four committed templates). The owner's stricter policy on 2026-09-11 removed them, and the values are documented in `docs/ENVIRONMENT_VARIABLES.md` instead (ADR-023).
8. **Local Supabase `edge_runtime` and `analytics` disabled** in `config.toml` to keep the stack light (ADR-014).

## Important Pending Decisions

- **PD-015: Pilot content scope** (before Phase 3 content)
  - The pilot covers 3ème maternelle, one five-day cycle. Decide the order of what comes next: the rest of the year for 3ème maternelle, or the first week of the other two levels.
- **PD-016: Alignment with the DRC PNEM 2021** (ISSUE-018)
  - Whether the daily rhythm should follow the DRC grid (30-minute slots, physical activity twice a week, daily free activity) rather than the French daily-PE rule.
- **PD-017: Curriculum strategy for the DRC** (ADR-037, `docs/DRC_CURRICULUM_COMPARISON.md`)
  - Keep French Cycle 1 as the reference (A, current), or move to DRC-primary (B), DRC core + French enrichment (C), or curriculum profiles (D, recommended target).
  - B and C require written permission from MINEDU-NC to store PNEM text (ISSUE-020).
- **PD-018: Language of instruction in the early years**
  - The PNEM expects the local or national language in niveaux 1–2; Teka Edu is French-first (ADR-001) for a child moving from English to French. Confirm the choice explicitly.
- **PD-014: EVAR (éducation à la vie affective et relationnelle)** (before content authoring)
  - The 2026 annex attaches the French EVAR programme (arrêté du 3 février 2025) to the six domains. The model supports it as a `transversal` component, but whether and how Teka Edu includes it in the DRC context is an owner decision. Not configured.
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
Completed:  Phase 2.5 — pedagogical pre-review, DRC comparison, content quality gate.
            - Read the DRC PNEM 2021 (SERNAFOR/DIPROMAD, 140 pages) in full and compared it
              with the French Cycle 1 programme across 16 aspects. The pilot week lands inside
              DRC expectations on themes and mathematics; it lacks the PNEM's activités libres,
              vie pratique and promotion de la santé. Recommended: keep French Cycle 1 now,
              prepare curriculum profiles (ADR-037, Proposed — owner decision PD-017).
            - PNEM text may not be reproduced (no open licence): Teka Edu references it only
              (ISSUE-020). On the French side, reuse conditions and attribution wording are now
              written down, the source publication date is stored so attribution is generated
              from data, and three questions are left for a lawyer (ISSUE-021).
            - Pre-reviewed 20 lessons / 40 activities: 0 blockers, 3 major, 7 minor,
              4 suggestions. The 3 major defects were Phase 2's own and are fixed.
            - Content quality gate: draft → review → approved → retired, approval bound to a
              digest of the reviewed text, enforced in validation and in the database.
            - Materials now carry alternatives and safety notes.
            - Generated the teacher's review document; a test keeps it current.
            - Planned Phase 3: 15 activity kinds → 10 renderer families.
Changed:    domain/lessons/{review,renderers,types}.ts, domain/programme/validation.ts,
            lib/content/{review-package,review-packages,lesson-schemas}.ts, app/api/programme,
            scripts/review-package.ts, content/materials.json, content/lessons/**,
            supabase/migrations + tests, tests/unit, docs (PEDAGOGICAL_REVIEW,
            DRC_CURRICULUM_COMPARISON, CONTENT_QUALITY_GATE, PHASE3_RENDERER_PLAN, CURRICULUM,
            DAILY_PROGRAMME, CONTENT_AUTHORING), DECISIONS (ADR-035..037), CLAUDE.md.
Tests:      See the Tests / Quality Status section.
Remaining:  ISSUE-017 (human review, blocking Phase 3 content), ISSUE-019 (daily comprehension
            read-aloud), ISSUE-020 (DRC text reuse), ISSUE-021 (French text reuse: legal
            opinion), PD-017/PD-018 (strategy, language),
            PD-014 (EVAR), PD-015, ISSUE-015/016 (calendar).
Recommended next task: hand the review document to a teacher; then Phase 3 (child experience)
            once the strategy decision is made.
```
