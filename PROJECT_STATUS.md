# Teka Edu — Project Status

Live implementation status. Read after `CLAUDE.md`. Update at the end of every meaningful session. Everything here must match the actual repository.

## Last Updated

```text
Date:       2026-09-26
Branch:     codex/september-astra-visual-review (local only), main at 28dcb0a
Commit:     local checkpoint pending; latest durable checkpoint a8a9d49
Updated by: Codex / independent Claude Max review
```

## Independent September visual/UX review — 2026-09-26

Owner-requested local review on `codex/september-astra-visual-review`, based on `a0b743b`.
The audit is complete: all 165 scroll sheets and 266 initial sheets (431 sheets / 1,208 panels)
were inspected, followed by 56 whole-product captures covering fourteen journey states on phone,
tablet, desktop and TV. The product capture found zero horizontal overflow and zero broken images.
[Audit](docs/review/media/SEPTEMBER_ASTRA_VISUAL_AUDIT.md),
[durable manifest](docs/review/media/astra-supervisor-remaining-review.json), and
[checkpoint](docs/work/ACTIVE_TASK.md).

Safe local corrections expose material safety notes, correct zero-progress stop copy, prioritize the
observation report on completion, improve generic French choice copy, remove false empty-image stages,
add missing off-screen handoffs, keep long-count feedback visible and enlarge placed sort tokens. No
approved lesson payload, media byte, registry entry or approval digest changed. The final illustration QA
already supersedes the original 23 KEEP / 10 REFINE / 16 REDRAW recommendation: 35 accepted, 11 refined,
3 redrawn, 0 outstanding, 176/176 approvals. Audio remains intentionally at zero recordings.

The owner authorized the bounded correction batch. Explicit off-screen mode now prevents generic counters,
graded choices and sorting praise from replacing the approved real-world tasks. The two round/square sorts,
all 22 1ère movement payloads, the missing spoken sorting words, « la monnaie » card and composed house model
are corrected. Claude Max / Opus first returned `accepted-with-modifications`: `m1-phys-22-a1` needed clearer
French and the house model needed a geometrically square wall. Both findings were independently verified and
corrected. Its final isolated review explicitly accepted all 27 lessons, the renderer-only change and both
assets with no further modification. Seven full-review entries were recorded and the repository mechanism
restored exactly 27 approvals with fresh digests. September is now 176 approved / 0 review; none of the fresh
digests reuse a prior value and all 149 unaffected approval records remain byte-for-byte unchanged.

Local validation passes with format, lint, typecheck, 414 unit tests, content validation, a Webpack production
build, a 28-file client-bundle scan, 41 E2E tests (9 production-only skipped), and 152 pgTAP assertions after a
disposable database reset. Eight final phone/tablet/desktop/TV captures verify the corrected rule wording and
square house. The generated migration mirrors the accepted canonical state. The owner selected local only:
no push, PR, merge, staging, production, production-data operation or October work occurred.
Older phase summaries below are historical and may predate the September production release.

## Current Phase

```text
1ère maternelle — annual progression and September: IN PROGRESS
Status:    Two classes now have a year plan and a written September. 3ème maternelle: 162
           from-5 objectives over 189 days, 88 lessons, 170 activities. 1ère maternelle: 116
           before-4 objectives over the same 189 days, 88 lessons, 132 activities, 30-31
           minutes a day, no screen time.
           The band mapping was re-derived rather than trusted: 1ère → before-4 is confirmed
           by the curriculum file and by arithmetic, since the same rule yields the 162 the
           3ème plan was already built on. before-4 is the earliest band, so 1ère has nothing
           earlier to reinvest from and its 116 objectives buy repetition rather than
           breadth — 904 planned passages, 4.8 a day.
           The annual-plan builder is now one engine parameterised by level. Refactoring it
           caught a defect: the Week 1 pacing correction had been made by editing generated
           JSON, so the generator would have reverted it.
           The home screen turned 1ère's card on by itself — availability is counted from
           content. 2ème maternelle has no lessons and says so.
           No lesson is approved. Five 1ère review packages await the ADR-047 gate; 3ème
           Week 1 awaits re-review. Production stays disabled (ADR-027).
Objective: A verified year for the youngest class, then one month, then the review gate.
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
- [x] Curriculum strategy analysed and put to the owner; **decided 2026-09-12** — French Cycle 1 is the curriculum, the PNEM is a compatibility/enrichment reference (ADR-037 `Accepted`, PD-017 and PD-018 resolved)
- [x] Pre-review of 20 lessons and 40 activities against a 13-criterion rubric: 0 blockers, 3 major, 7 minor, 4 suggestions (`docs/PEDAGOGICAL_REVIEW.md`)
- [x] The 3 major defects, all from Phase 2, fixed: success examples presented at competency level, screen dependence corrected (daily screen time 0–6 min instead of 5–13), an objective actually exercised
- [x] Content quality gate (ADR-035): `draft → review → approved → retired`, an approval names a reviewer and is bound to a digest of the exact text; enforced in content validation and by database constraints
- [x] Materials carry `alternatives` and `safetyNote`; a lesson never depends on one particular object
- [x] Human review package generated from canonical content: `docs/review/2026-2027-maternelle-3-semaine-1.md`, kept current by a test
- [x] Phase 3 renderer families planned: 15 activity kinds → 10 families (ADR-036, `docs/PHASE3_RENDERER_PLAN.md`)
- [x] The official daily read-aloud rule re-verified in the source; the pilot's gap is documented rather than implied away
- [x] Reuse of both programmes examined from the documents themselves: attribution wording, the Licence Ouverte's date-of-update requirement (now `curriculum_sources.published_on`), exclusion of emblems, and three questions left for a lawyer (`docs/CURRICULUM.md`, ISSUE-021)
- [ ] **Human-teacher review — not done, and no longer blocking (ISSUE-017, ADR-047)**. Week 1 had an AI-assisted review on 2026-09-14 (ChatGPT, `accepted-with-modifications`, 13 corrections applied). The active gate is that review; a teacher's is optional future assurance.

## Infrastructure Status

Values: `NOT STARTED` · `IN PROGRESS` · `CONFIGURED` · `VERIFIED` · `BLOCKED`.

| Area                            | Status                                          | Evidence / remaining                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Git repository                  | **VERIFIED**                                    | Initialised 2026-09-11 with no force push (the remote was empty beforehand). `origin/main` = `1b95480`, a merge commit of `3df64bf` + `4abe26e`; `origin/develop` = `4abe26e`. Both branches have identical trees.                                                                                                                                                                                                                         |
| Docker                          | **VERIFIED**                                    | Both images build, report healthy, run as user `node`, and exit on SIGTERM with code 143, both locally (arm64) and on GitHub runners (x86_64).                                                                                                                                                                                                                                                                                             |
| GitHub Actions                  | **VERIFIED**                                    | Push-triggered CI: VERIFIED (runs 34610713969, 34610729923, 34611359891, 34612999684, 34617650743 on the promotion merge; deploy jobs skipped as designed). PR-triggered CI: VERIFIED (PR #1, run 34612652962, Linux x86_64). No GitHub environments exist yet.                                                                                                                                                                            |
| Branch protection               | **VERIFIED**                                    | GitHub Rulesets active for `develop` and `main` (re-verified after the promotion; `main` accepted PR #5 only with all 5 checks green, merge commit only): PR required, 0 approvals, conversations resolved, 4 quality checks required (+ `Promotion source` on `main`), force push and deletion blocked, no bypass actors. A direct push to `develop` was rejected (GH013). Details: `docs/DEPLOYMENT.md`, ADR-022.                        |
| Supabase local                  | **VERIFIED**                                    | `db start` / `db reset` / `test db` (PASS) / `stop` all work. Full `supabase start` confirmed `sb_publishable_…` / `sb_secret_…` local keys, and the env validation accepts them.                                                                                                                                                                                                                                                          |
| Supabase DEV (`teka-edu-dev`)   | **VERIFIED**                                    | Ref `quyhkkizsmosybavoewd`, Paris `eu-west-3`, Free plan, ACTIVE_HEALTHY. Working copy linked. `db push` up to date (no migrations), remote pgTAP RLS test PASS, 0 public tables without RLS, security advisors clean. Pooled `DATABASE_URL` connects. CI secrets are in GitHub `staging`; runtime values are in the owner's Keychain.                                                                                                     |
| Supabase PROD (`teka-edu-prod`) | **VERIFIED**                                    | Ref `eganrivpkjhozkkahyxy`, Paris `eu-west-3`, Free plan, ACTIVE_HEALTHY. Read-only checks only: migration list empty, 0 public tables without RLS, security advisors clean; pooled `DATABASE_URL` connects. Nothing pushed or seeded. CI secrets are in GitHub `production`; runtime values are in the owner's Keychain.                                                                                                                  |
| GitHub environments             | **CONFIGURED**                                  | `staging` (branch `develop`): Supabase + Vercel secrets (incl. the project-scoped `VERCEL_TOKEN`) and `STAGING_DOMAIN`. `production` (branch `main`, required reviewer): Supabase secrets, `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` / bypass secret, **no `VERCEL_TOKEN`**.                                                                                                                                                                   |
| Database migrations             | **VERIFIED**                                    | Six migrations (Phase 1 schema + data, Phase 2 schema + data, Phase 2.5 quality gate + data). Local: `db reset` + 128 pgTAP assertions pass. DEV: all six migrations applied and local/remote lists match; row counts checked read-only (20 lessons, all `review`, 0 approved; 398 objectives; 529 success examples). Security and performance advisors: no issues. PROD: untouched.                                                       |
| Vercel staging                  | **VERIFIED**                                    | Project `teka-edu` (Hobby, `container` preset, `cdg1`, no Git link). First verified deployment: run 34635262697, `dpl_99QEWbwtBTV53u5HzdudDaKndjgy` (Preview, READY, commit `e2f8f69`), alias https://teka-edu-staging.vercel.app. `/api/health` reports `staging` and the DEV ref; region `cdg1` confirmed by `x-vercel-id`. Protection returns 302 without auth. Browser bundle and logs are secret-free. `STAGING_DEPLOY_ENABLED=true`. |
| Vercel production               | **LIVE (September visual upgrade, 2026-09-24)** | Public at https://teka-edu.vercel.app, deployment `dpl_22DjVFzGbinNs4xkCrEzgMM5Svh7`, commit `28dcb0a`, Supabase PROD (42 migrations). Run 35983628116. Anonymous public suite 9/9; 49/49 pictures served with their frozen hashes. Staging, team alias and generated URLs protected (302). Record: `docs/releases/SEPTEMBER_VISUAL_UPGRADE_RELEASE.md`.                                                                                   |
| Environment variables           | **CONFIGURED**                                  | Validation and Markdown inventory complete. Environment-file cleanup is VERIFIED on both `develop` and `main`: no `.env*` file in either tree, and the public default branch shows none (ADR-023). No hosted values exist yet.                                                                                                                                                                                                             |
| develop → main promotion        | **VERIFIED**                                    | PR #5, merged 2026-09-11 as merge commit `1b95480`. `Promotion source` passed on a real event ("'develop' from ipanga/teka_edu may be promoted to main", run 34617296272), and all 4 quality checks passed. The merge-triggered `Deploy production` run 34617650743 skipped its deploy job. There are no GitHub deployments or environments.                                                                                               |
| Repository security             | **VERIFIED**                                    | No real secret in the full Git history (gitleaks, all refs + pattern scan). Secret scanning and push protection enabled (no alerts). Fork PR workflows need owner approval for all external contributors. `Promotion source` checks the repository identity.                                                                                                                                                                               |
| Free-tier compliance            | **VERIFIED**                                    | Vercel Hobby with no payment method on file (no billing possible); Supabase DEV and PROD on Free; no add-ons. Platform cost **$0/month**. Limits and classification: `docs/FREE_TIER.md`.                                                                                                                                                                                                                                                  |
| Deployment documentation        | **CONFIGURED**                                  | Written. Must be re-checked against the first real staging and production deployments.                                                                                                                                                                                                                                                                                                                                                     |

## In Progress

```text
Task:           Recording the owner's curriculum decision (ADR-037, ADR-038). Documentation
                and decision records only: no schema change, no content rewrite.
Status:         Phase 2.5 is merged (PR #17) and deployed to staging. What remained at the time
                was the human pedagogical review (ISSUE-017); ADR-047 has since made an
                AI-assisted review the active gate. Phase 3 has not started.
Relevant files: domain/lessons/review.ts, domain/lessons/renderers.ts, lib/content/review-package.ts,
                scripts/review-package.ts, content/materials.json, content/lessons/**,
                supabase/migrations/2026091200*, docs/PEDAGOGICAL_REVIEW.md,
                docs/DRC_CURRICULUM_COMPARISON.md, docs/CONTENT_QUALITY_GATE.md,
                docs/PHASE3_RENDERER_PLAN.md, docs/review/
```

### Phase 3A — September programme and the parent session (PR #20, merged)

- [x] Product purpose recorded: Teka Edu is a **parent-led after-school reinforcement platform**, 30-45 min per instructional day (ADR-039, `docs/PARENT_SESSION.md`)
- [x] **Annual scope and sequence** for 3ème maternelle: 162 objectives over 189 instructional days, six phases, with `homeFeasibility` per objective (ADR-040, `docs/ANNUAL_PLAN.md`)
- [x] **All 22 September instructional days authored**: 88 lessons, 170 activities, every day exactly 35 min, 0 min of screen
- [x] Coverage proved: the 36 objectives the plan wants by day 22 are all taught, each appearing 6.2 times on average and never fewer than twice (`npm run coverage:report`)
- [x] Daily retrieval ritual and weekly consolidation are data (`role` on an activity), not a convention
- [x] **Self-contained content**: 14 Teka Edu-original stories and rhymes in `content/texts/`; no lesson asks the parent to find a book
- [x] Dynamic-date defect fixed: content writes `{{date}}`, the daily plan fills it in, a test forbids written-out dates
- [x] **Parent session UI**: `/` (today), `/seance/[day]`, `/calendrier`, with materials, guidance on demand, English hidden by default, a pause point and catch-up
- [x] Ten renderer families implemented (ADR-036); progress kept in the browser only
- [x] Five weekly review packages instead of one monthly file; all 88 lessons remain `review`

### Governance — session duration and resumable work (PR #22, merged)

- [x] The daily session is **30–45 minutes** (about 35) wherever a product requirement is stated; ADR-039 amended, the Phase 2.5 40-minute recommendation marked superseded rather than rewritten
- [x] The range is enforced on a programme's declared `sessionMinutes` as well as on each generated day; a departure must declare `durationPolicy: "exceptional"`
- [x] **Resumable-work protocol** (ADR-041): `docs/work/ACTIVE_TASK.md`, `docs/RESUMABLE_WORKFLOW.md`, `docs/work/archive/`, a `CLAUDE.md` instruction, and a test that enforces the checkpoint's structure
- [x] Phase 3A archived as the first baseline; September content unchanged

### Phase 3B — the September parent experience (PR #24, merged)

- [x] UX audit of the running app: seven concrete findings, starting with « Regarde les formes » showing no shapes
- [x] **PD-008 resolved** — media is SVG in the repository, named by stable id, no cloud storage, no paid service (ADR-042, `docs/MEDIA_ARCHITECTURE.md`)
- [x] 22 assets; **29 activities that need something on screen all have it**, 0 screens left blank (`npm run media:report`)
- [x] Interaction where it teaches: show the named shape, count by tapping, sort into groups — with gentle retry and no scoring
- [x] Off-screen activities say « Posez l’écran » instead of pretending to be on-screen ones
- [x] Stories paginated; the parent sees which of the day's four lessons they are in; "Terminé" for what the app cannot observe
- [x] **Real-session testing**: `/seance/<n>/observation`, browser-only, asks nothing about the child (`docs/REAL_SESSION_TESTING.md`)
- [x] Media mirrored to the database with RLS and an access decision per table
- [x] All 88 lessons remain `review`: usability testing is not pedagogical approval

### 1ère maternelle — annual progression and September (PR #35)

- [x] **Band verified, not assumed**: `maternelle-1` → PS → `before-4`, confirmed by the curriculum file and cross-checked by arithmetic (the same rule yields `from-5` = 162, the count the 3ème plan uses)
- [x] **Corpus audited**: 116 of 398 objectives apply to `before-4` — 106 exclusive, 10 shared with a later band. Provenance complete, no duplicates, nothing too advanced
- [x] **Annual plan**: 116 objectives over 189 days, 6 periods, the last introducing nothing
- [x] **One engine, parameterised by level** (`tools/annual-plan/levels/`); regenerating 3ème is identical apart from a defect it exposed and fixed
- [x] **`npm run plan:report`**: load per period, domain balance, revisits, home feasibility
- [x] **September authored**: 22 days, 88 lessons, 132 activities, 30-31 min, 0 screen minutes, 24 objectives all introduced by day 13
- [x] 6 new SVG assets (4 body parts, 2 story pictures); everything else reused. 44 total, $0
- [x] **Level isolation proved** in unit, E2E and pgTAP: each class serves only its own content, 2ème serves none
- [x] Five weekly review packages generated; **all 176 lessons remain `review`**

### Week 1 review corrections (PR #31)

- [x] **13 items from the owner's Week 1 review applied**, content and generator (`docs/PEDAGOGICAL_REVIEW.md`)
- [x] **Objective traceability corrected**: the daily read-aloud claimed « établir un lien entre la lecture effectuée et sa propre expérience » on all 22 days while saying it asks no questions — O15 moved to the two activities that genuinely do it, the ritual took `LANG-S02-C03-O04`
- [x] The annual plan's O15 pacing corrected: it had been fitted to a ritual that never worked it
- [x] The endurance objective removed from four activities where nobody runs without stopping; kept where a child actually runs
- [x] « Ma bande des jours » no longer requires reading seven written day names in week one
- [x] Market examples made explicitly the family's own rather than assuming a market day
- [x] An optional extension is now a typed field, so it cannot become an untracked expectation
- [x] **The review package quotes stories, rhymes and comprehension questions in full** — a reviewer was being asked to approve texts they were never shown
- [x] Official excerpts no longer cut at their first line (43 statements are multi-line)
- [x] Four new tests hold all of it; 214 unit tests pass
- [x] All 88 lessons remain `review`; **ISSUE-017 stays open**

### Phase 3D — a front door, three classes, motion and the question of a voice (PR #28)

- [x] **Home screen**: the app opens on 1ère, 2ème and 3ème maternelle, each with what it is for and how many sessions exist
- [x] **Level routing** (ADR-044): `/maternelle/<1|2|3>/…`; `session-view` takes a level, no component names a class, an unknown slug is a 404
- [x] **Honest availability**: a class with no lessons is not a link and shows no borrowed content; availability is counted from the content, so no flag can lie
- [x] **The child's screen is a modal `<dialog>`** — the parent's chrome is inert behind it, and a test requires the home link's click to fail
- [x] Bigger pictures that grow with the screen, larger tap targets, a roomier child surface; the two zones of ADR-043 kept
- [x] **Motion** (ADR-045): four CSS keyframes, nothing looping, nothing required, all off under `prefers-reduced-motion` — proved by an E2E run with motion disabled
- [x] **Audio** (ADR-046): registry, transcript, named-speaker provenance, a listen control that appears only when a recording exists — and **zero assets**, because browser speech synthesis is not a voice a child should copy (`docs/AUDIO_GUIDELINES.md`)
- [x] `npm run media:report` extended to illustrations, audio, motion and per-class availability
- [x] Cost **$0**: no paid TTS, no CDN, no cloud storage, no new service
- [x] All 88 lessons remain `review` — the owner's successful use of staging is usability, not pedagogical approval (ISSUE-017 stays open)

### Phase 3C — the session a parent and child can sit down and do (PR #26, merged)

- [x] Audit of the whole September journey: seven concrete problems, all fixed
- [x] **Bug**: on a non-school day the app offered the last day written (30 September) instead of the most recent session
- [x] **Two zones** (ADR-043): « La part de l'enfant » versus a quiet « Pour vous », plus « Montrer à l'enfant » filling the device with no parent chrome
- [x] Preparation reduced to a scannable list; replacements behind a disclosure
- [x] Pause, early stop framed as normal, and resume where the session stopped
- [x] 16 new illustrations — one per story and rhyme, a plant, a jointed figure; visual gaps 58 → 27, and all 27 are deliberate
- [x] Fourth interaction: « je montre le mot » on the vocabulary cards
- [x] `docs/REAL_SESSION_TESTING.md` rewritten as a procedure needing no technical knowledge

## Next Tasks

### P0 — Next

1. **1ère maternelle**: the full 2026–2027 annual progression first, then September daily lessons only. The routing, the renderers and the annual-plan machinery are level-agnostic, so it is content plus one annual plan — then the review gate.
2. **Re-review of September Week 1** (ADR-047). The corrections materially changed the pedagogy, so the regenerated package goes back for a second pass before Week 1 can be recorded as accepted. Weeks 2–5 have not been reviewed at all.
3. **October and beyond for 3ème maternelle**, once September has completed the gate and been tested by real families — authoring a second month before either would multiply any mistake by two.
4. **TV presentation mode** and the offline service worker (`docs/PHASE3_RENDERER_PLAN.md`).

### Deferred — production (not in the current phase, ADR-027)

- Vercel plan and production domain decisions, the production `VERCEL_TOKEN`, `NEXT_PUBLIC_APP_URL`, and a supervised first production deployment.
- Before any real PROD data: implement the zero-cost backup design (`docs/FREE_TIER.md`), custom auth SMTP, and a privacy/legal review.

### P1 — Soon

1. Official Cycle 1 curriculum source, then the competency catalogue (PD-004), needed for Task 7 content.
2. **Prune the container registry by hand before it reaches 45** (ISSUE-011). Last pruned
   2026-09-24 (44 → 35); **37 of 50** after the September release. CI still cannot read the count.
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

Severity: **High (act before ~50)** · Status: **Implemented / blocked on platform access** — fired 2026-09-19, pruned once by hand, prevention built and proven 2026-09-20, and the registry API turns out not to be reachable by a Vercel access token at all

Description: Every staging deployment pushes one image (about 73 MB) to the registry repository
`dockerfile`. Hobby allows 50 images per repository, and no automatic cleanup is documented. There
were 4 images on 2026-09-11.

**On 2026-09-19 the cap was reached.** The Week 4 staging deploy (run `35465869484`, commit
`dcfdb62`) failed while pushing its image:
`denied: repository has reached the maximum allowed number of images`. The registry held exactly 50. The prediction below was correct in every part except the threshold: the count went from 4 to
50 in eight days, so «about 40» was never observed — the monitoring was manual and nobody looked.

Resolution: the owner approved the deletion, and the **15 oldest images (7–8 days old, every one
from a superseded commit) were removed** with `vercel vcr image rm dockerfile <id> --project
teka-edu`. The image behind the live staging deployment and its alias was verified untouched first.
The registry went 50 → 35, the deploy was re-run and succeeded, and it now sits at 36.

**Why the intended pruning never happened (2026-09-20).** There was nothing to happen. "Prune
around 40" was a sentence in this file, not a mechanism: no step measured the count, no run could
fail because of it, and no one owned the check. One image goes in per merge into `develop`, and
September merged often enough to go from 4 images to 50 in eight days — so the registry passed 40
and reached 50 between two glances at a document nobody had reason to open. A threshold that is
only written down is not a threshold.

**Pruned by hand, 2026-09-24 (owner-authorised).** After the September visual upgrade the
registry held **44 of 50**. The repository's own policy (`planRegistryPrune`) chose the images
from the CLI's JSON listing, protecting production's image (`a7297228f173`, the only production
deployment ever made) and staging's (`da2d4fbd32c3`) as well as the 20 newest: **9 deleted**, all
from 14–15 September and superseded commits. **44 → 35**; both protected images verified present
afterwards, production and staging still serving. (A table count of 45 the day before had
counted the header line.)

**Pruned again by hand, 2026-09-20.** The registry reached **45 of 50**, the configured near-cap
line, and the guard that should have stopped the deploy could not fire because CI cannot read the
count. With the owner's approval the repository's own policy chose the images — the 10 oldest,
6–8 days old, with the live staging image and the 20 newest protected — and the Vercel CLI
deleted them. **45 → 35**, live image verified present afterwards, staging alias unchanged and
alive. This is the second manual prune; it is what the automation exists to replace.

**Preventive fix (2026-09-20).** The staging workflow now prunes **before** it pushes, in a step
that sits between the deployment-count guard and `vercel deploy`:

- `lib/deploy/registry-retention.ts` decides _which_ images may go. It is a pure function with 14
  unit tests (`tests/unit/registry-retention.test.ts`), because a deletion cannot be rehearsed
  against a real registry without deleting something.
- `scripts/prune-registry.ts` (`npm run registry:prune`, `--dry-run` to rehearse) supplies the
  registry contents and the commits that must survive. It calls the REST API directly
  (`/v1/vcr/repository/dockerfile/images`), **not** `vercel vcr`: the CLI resolves its scope
  through `/v2/user` and `/v1/teams`, which a project-scoped deploy token may not read, so it
  exits with `User not found` before reaching the registry. The first attempt used the CLI and
  failed in CI for exactly that reason (run `35500428674`) — the same constraint already recorded
  for `vercel inspect` and `vercel alias`. It works from a developer machine, where the CLI is
  authenticated as a user, which is why a local rehearsal did not catch it.
- Thresholds, in one place and used by both the deploy and the tests: prune above **40**, down to
  **35**, never touching the **20** newest. That leaves about 15 merges of headroom.
- Protected without exception: the commit being deployed, and the commit `/api/health` reports the
  staging alias is actually serving — the running application, rather than a deployment field that
  a project with no Git connection never fills in.
- It refuses rather than guesses, and **reports rather than blocks**. Below 40 it does not even
  look. Above 40, if the live commit cannot be read, or the registry cannot be listed, or nothing
  may safely go, it deletes nothing, prints a `::warning::` saying why, and lets the deploy
  continue. The first two attempts failed the whole staging job over the shape of an API call on
  a registry holding 37 of 50 — strictly worse than not having the step. A preventive measure
  must never be the reason a deploy that would otherwise succeed does not happen; if the registry
  really is full, the push itself fails with a clear message of its own.
- Rehearsed on 2026-09-20 against the real 37-image registry: the listing, the health probe, the
  selection and both refusal paths were exercised in `--dry-run`, and nothing was deleted.

**It cannot authenticate in CI, and that is the whole of what remains.** The registry endpoint
answers **404 `VCR Repository not found`** under the deploy token, for every way of addressing it
that was tried (`projectId` alone, and `teamId` + `projectId`). The identical request against the
identical project returns **200** with a user-scoped token, so the cause is the token's scope, not
the URL: `VERCEL_TOKEN` in the `staging` environment is project-scoped and registry management
sits outside it.

**A credential of its own (2026-09-20).** Rather than widen `VERCEL_TOKEN`, which every deploy
uses and which should stay as narrow as it is, the prune reads **`VERCEL_VCR_TOKEN`** when it
exists and falls back to the deploy token when it does not — so the step degrades to a warning
instead of breaking while the secret is still being created. The step logs which credential it
used.

**Two-stage failure policy (2026-09-20), and why these numbers.**

| Registry                    | A prune that cannot run                             |
| --------------------------- | --------------------------------------------------- |
| ≤ 44 of 50                  | `::warning::`, deploy continues                     |
| ≥ **45** of 50 (`dangerAt`) | `::error::`, deploy stops **before** the image push |

The two situations deserve opposite answers. With headroom, a prune that cannot run has cost
nothing and failing the deploy turns a transient read error into an outage — which is exactly what
happened twice on 2026-09-20 and is worse than having no prune at all. At 45 the same failure is
five merges from a blocked `develop`, and the failure it leads to is an image push rejected
_after_ the migration has been applied, with a message about a registry rather than about anything
the reader can act on. Stopping first, naming the credential, is the kinder failure. 45 leaves
five slots — roughly a day at the rate September merged — and sits five above the pruning
threshold, so the first deploy to cross 40 with a broken credential does not block anything.

**Proven on 2026-09-20 against the real 40-image registry, deleting nothing:** listing with a
dedicated token (**200**), the health probe, candidate selection (10 oldest chosen, 20 newest and
the live commit protected), the warning path below 45, and the hard-failure path at or above it.
19 unit tests cover the policy.

**The secret now exists, and it is not enough (2026-09-20).** `VERCEL_VCR_TOKEN` was created
scoped to the TEKA team and stored in the GitHub `staging` environment. The registry endpoint
still answers **404 `VCR Repository not found`**.

The deploy's own diagnostic narrows it down, and the answer is not the one that was expected:

| probe, with `VERCEL_VCR_TOKEN`             | result                                                         |
| ------------------------------------------ | -------------------------------------------------------------- |
| `GET /v9/projects/{teka-edu}?teamId=…`     | **200** — the token reaches the right team and project         |
| `GET /v2/user`                             | 404 — it is a team-scoped token, not a user token, as intended |
| `GET /v1/vcr/repository/dockerfile/images` | **404 `VCR Repository not found`**                             |

So the scope is correct. The same request from the Vercel CLI, authenticated as a _user session_,
returns **200** and lists all 43 images. Two different access tokens — one project-scoped, one
team-scoped — both get 404 where a user session gets 200.

**The reading: `/v1/vcr/*` appears not to be reachable by a Vercel access token at all.** It is
undocumented, the CLI reaches it through a user session, and "not found" rather than "forbidden"
is what an endpoint returns when it resolves scope differently for tokens. Creating a third token
would not change this, which is why none was created.

**Consequences, stated plainly.**

- The count **cannot be read in CI**, so the near-cap guard cannot fire either. The registry is
  back to filling unobserved, one image per merge into `develop`.
- It stands at **43 of 50** on 2026-09-20. That is about **seven merges** of headroom.
- `REGISTRY_PRUNE_ENABLED` is deliberately left unset. Arming it would change nothing, because
  the listing fails before any deletion is considered.

**Until the platform question is answered, pruning is manual.** The owner is authenticated in the
Vercel CLI and can prune in one command; the images to remove are the oldest that no retained
deployment or alias uses:

```sh
vercel vcr image ls dockerfile --project teka-edu --scope teka10     # count and ages
vercel vcr image rm dockerfile <image-id> --project teka-edu --scope teka10
```

**Worth asking Vercel:** whether `/v1/vcr/repository/*` can be used with an access token, and if
so under which scope. If the answer is yes, the automation needs no change beyond the credential:
everything else is built, tested and proven.

**This issue is not resolved.** It is `implemented / blocked on platform access`: no automatic
pruning cycle has ever run, and it will not be called resolved until one has.

Recommended action: prune by hand before the count reaches 50, and ask Vercel whether the
registry API can be used with an access token. A deletion still needs owner approval. Note the
real cost of hitting the cap: `develop` is blocked, because every subsequent merge re-triggers the
same failing deploy.

### ISSUE-012 — Supabase Free projects pause after about 7 days of low activity

Severity: Low (Monitor) · Status: Open · **Observed on `teka-edu-prod` 2026-09-18**

Description: DEV is touched by each staging deploy (migration steps). PROD is empty and will
pause, which is harmless now. Restore from the dashboard at no cost (window 90 days to 1 year).

**The owner received an inactivity warning for `teka-edu-prod` on 2026-09-18.** This is the
expected consequence of ADR-027: production is deliberately unused, so the project is
deliberately inactive. Nothing in the repository should prevent it. In particular this is **not**
solved by upgrading the plan, by enabling production deployment, by migrating or seeding PROD, or
by a synthetic keep-alive job — all of which would cost money, open production, or put activity
into a database that is supposed to be empty. **No keep-alive mechanism is created at this
stage.** The owner handles any dashboard activity separately, outside this repository.

**Before any production deployment**, the production-readiness checklist must verify that
`teka-edu-prod` is `ACTIVE_HEALTHY`. If it is paused it must be resumed through the Supabase
dashboard **before** migration or deployment: no production workflow may run against a paused
project, because a migration step would fail partway and leave the schema in an unknown state.
The production smoke test already asserts `EXPECTED_SUPABASE_PROJECT_REF`, so it will refuse a
deployment wired to the wrong project once production is enabled.

Recommended action: restore DEV if a staging deploy fails on a paused project. Restore PROD only
when production is prepared, as the first step of that preparation.

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

### ISSUE-017 — No human teacher has reviewed the content

Category: **future external pedagogical assurance** · Severity: Desirable before broad school adoption · Status: **Open, not blocking** (reclassified 2026-09-15, ADR-047)

**Originally** (2026-09-12): _"Human teacher review required before further curriculum expansion."_ The 20 pilot lessons were pre-reviewed by Claude in Phase 2.5 (rubric, severities, three defects fixed), but no teacher or early-childhood specialist had read them, and the quality gate made `approved` unreachable without one. That reasoning is preserved because it was right about the risk.

**What changed**: no preschool teacher is available to the project and none is in prospect. A gate that can never open is an outage, not a quality control — 88 lessons frozen and two class levels unable to start. ADR-047 keeps the gate and changes who closes it: an **AI-assisted pedagogical review** of the generated package against the official programme is now the active development gate.

**Current meaning**: human-teacher validation is unavailable; it remains a desirable future external quality-assurance step; **it does not block curriculum development**. It stays open as a non-blocking assurance item rather than being closed, because the thing it asks for has not happened.

Recommended action: none required to continue. When a teacher becomes available, hand them `docs/review/2026-2027-maternelle-3-semaine-1.md`; a `human-teacher` review is recorded as a strictly stronger claim than the AI-assisted one (`reviewKind`).

### ISSUE-026 — An approval did not cover the words of the story read to the child

Severity: Medium (integrity of the quality gate) · Status: **Resolved 2026-09-18**

Description: `lessonDigest` covered the words a child hears in the activity, the adult guidance,
the objectives, the durations, the materials and the **bytes of every picture** — but not the
lines of a story or rhyme the activity reads. The digest held the `textId` and the fingerprint of
the text's illustration, never the text. A story could therefore be rewritten under a standing
approval without the approval lapsing: the lesson was byte-identical and its digest still matched.
The same hole that was closed for pictures in PR #47, left open for the thing a read-aloud lesson
spends most of its minutes on.

Resolution: `MediaDigestSource` gained `textFingerprint(textId)`, a canonical string of the text's
kind, title and every line in order, built only from canonical content — no path, no mtime, no Git
state, no iteration order, so it is identical on every machine. `lessonDigest` folds it in and
**fails closed**: a lesson that reads a text nobody can resolve throws rather than falling back to
hashing the id.

Proved against the old implementation: rewriting a story left the old digest at
`f376980e96ef6e90` before and after, and moves the new one from `364846d9fa84c689` to
`42c0708ec69e1f2e`.

**31 of 104 approvals lapsed** — exactly the approved lessons that read a text. All 31 were
restored, and none was rubber-stamped: `scripts/restamp-digests.ts` finds the commit that wrote
each stored digest, compares every approval-relevant field, every picture's kind, description and
bytes, and every resolved story at that revision against the content now, and re-stamps only on
proven identity. 104 of 104 were proven identical; 0 were held back. Recorded as `consequence`
entries, not as new readings.

### ISSUE-019 — The daily comprehension read-aloud is not yet daily

Severity: Medium (content calibration) · Status: Open
Description: The 2024 language annex asks for a taught read-aloud with comprehension work at least once a day, plus a separate daily reading without questions. The pilot has the pleasure reading every day but the comprehension read-aloud only once in five days.
Recommended action: when content scales, alternate the daily read-aloud (questions on some days) or lengthen the language block on days without a story lesson. Documented in `docs/DAILY_PROGRAMME.md` and `docs/PEDAGOGICAL_REVIEW.md`. September did not close it: the pleasure reading is there all 22 days, the taught comprehension read-aloud on days 3, 9 and 15 only.

### ISSUE-020 — DRC official curriculum text may not be reproduced

Severity: Medium (legal) · Status: Open
Description: edu-nc.gouv.cd reserves all site content to the ministry: consultation, download and printing for personal and educational use with attribution, but reproduction or copying without authorisation is prohibited. There is no open licence, unlike the French texts. Teka Edu therefore **references** the PNEM and does not store its wording.
Recommended action: keep referencing only. If PNEM objectives are ever to be stored (Strategy B or C, ADR-037), request written authorisation from MINEDU-NC first. A human/legal opinion is needed before any such use.

### ISSUE-024 — the remaining visual gaps are deliberate

Severity: Low · Status: **Resolved by review**, 2026-09-13
Description: Phase 3B reported 58 activities that a picture would help. Each was classified in Phase 3C. 31 now have one — every story and rhyme carries its own illustration, plus a plant diagram and a jointed figure. The remaining **27 are better without**: 17 where the child handles real cailloux, papers or objects, 4 where the child looks at their own body or a real plant, and 6 where the child draws from a real model in front of them or from imagination (drawing Kumu _with_ a picture of Kumu would defeat the activity).
Recommended action: none. A real session may still show a specific gap; `npm run media:report` lists them.

### ISSUE-025 — No audio anywhere

Severity: Low (deliberate) · Status: Open
Description: 38 activities would benefit from a recording — pronunciation, stories, rhymes — and none has one. Nothing requires audio: the parent reads aloud, which is what an adult-guided session does anyway. No paid text-to-speech was introduced (ADR-027).
Recommended action: leave it until a real session shows it matters. If it does, prefer original recordings over a paid service.

### ISSUE-022 — The year's pacing after September is a first draft

Severity: Medium (content planning) · Status: Open
Description: The annual plan allocates September by hand and spreads the remaining 126 objectives deterministically across periods 2 to 5, interleaved by domain in official order. That is a defensible skeleton and it makes coverage provable, but it is not a pedagogical sequence the way September is: it does not yet consider which objectives depend on which.
Recommended action: refine each month's slice of the plan when that month is authored, in `tools/annual-plan/build.ts`, the way September was. The tests will then hold the content to the refined plan.

### ISSUE-023 — 16 objectives cannot be fully carried by a session at home

Severity: Medium (product honesty) · Status: Open, documented
Description: Of the 162 objectives 3ème maternelle should meet, 14 are marked `partial` and 2 `school-only` in the annual plan: swimming (`PHYS-S02-C01-O06`), meeting artists (`ART-S03-C02-O08`), singing in a group, collective artwork and staging, attacking and defending roles, describing what another pupil did, heritage musical works, and the spaces around the school.
Recommended action: no fix — this is a limit of an after-school product, and the plan records it rather than hiding it. Decide before any launch how it is communicated to parents, so Teka Edu never implies it delivers the whole official programme on its own.

### ISSUE-021 — Reuse of the French programme needs a legal opinion

Severity: Medium (legal) · Status: Open
Description: The three official annexes carry no rights notice. The exclusion of official texts from copyright is French **case law**, not a statutory exception, and education.gouv.fr states its reuse terms twice and contradictorily (an etalab-2.0 footer against restrictive _mentions légales_). Teka Edu takes the narrower reading and complies with the Licence Ouverte 2.0 in full — source, date of last update, no suggestion of endorsement, no emblem or logo — which is stricter than the doctrine would require. That is a defensible position, not a verified one.
Recommended action: put the three questions at the end of `docs/CURRICULUM.md` to a lawyer before any public launch. Nothing blocks development meanwhile: the position already taken is the conservative one.

### ISSUE-018 — PNEM enrichment content and the compatibility mapping are not written yet

Severity: Medium (product alignment) · Status: Open, narrowed by ADR-037
Description: The divergence from the PNEM is now a **deliberate, recorded decision**, not an accident: the French programme is the curriculum and movement stays daily. What remains is additive — the PNEM areas Teka Edu does not yet touch (_vie pratique_, _promotion de la santé_, _activités libres_, _comportement_) have no enrichment content, and the compatibility mapping that would answer "which PNEM expectation does this lesson also cover?" is designed but not built.
Recommended action: write the enrichment content when the year is authored (it belongs in existing domains, not in new ones), and build the mapping when a parent- or teacher-facing view actually displays it. The design is in `docs/DRC_CURRICULUM_COMPARISON.md`; it is additive and rewrites no lesson.

## Resolved Issues

- **PD-017 (curriculum strategy)**, resolved 2026-09-12 by the owner: the **French Cycle 1 programme is Teka Edu's curriculum**; the DRC PNEM 2021 is a **compatibility, context and enrichment reference**, not a second programme. No full PNEM curriculum profile is built; the lightweight compatibility mapping is designed in `docs/DRC_CURRICULUM_COMPARISON.md` and is additive when needed. Strategies B and C stay rejected while PNEM text may not be stored (ISSUE-020). Recorded as ADR-037 (`Accepted`), with ADR-038 setting the standard: mastery and enrichment, never premature acceleration.
- **PD-018 (language of instruction)**, resolved 2026-09-12 by the owner: **French-first**, deliberately, including for a child whose school, home or previous schooling is not French-speaking. English stays an optional scaffold that supports comprehension and reduces as French improves; there is no English curriculum. ADR-001 confirmed.
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

| Class           | Curriculum mapping     | Week 1                                                                                                                     | Week 2      | Full year   |
| --------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------- |
| 1ère maternelle | DONE (band `before-4`) | September **approved in full — 88/88**; visual reconfirmation `accepted` 2026-09-23 (35 approvals restored, fresh digests) | Not started | Not started |
| 2ème maternelle | DONE (band `from-4`)   | Not started                                                                                                                | Not started | Not started |
| 3ème maternelle | DONE (band `from-5`)   | September **approved in full — 88/88**; visual reconfirmation `accepted` 2026-09-23 (45 approvals restored, fresh digests) | Not started | Not started |

DRC 2026–2027 calendar data: DONE (official MINEDU-NC calendar and Ordonnance n° 23/042; 189 instructional days).
Curriculum: version `maternelle-cycle1-cd-2026`, six verified domains, **398 official objectives and 529 success examples** imported with provenance.

## Deployment Status

```text
Local:      Runs: npm run dev, npm run start (standalone), Docker image
Docker:     Verified locally (arm64) and in GitHub CI (x86_64), both Dockerfiles
Staging:    LIVE https://teka-edu-staging.vercel.app (Vercel Preview, container, cdg1, Supabase DEV); auto-deploys from develop
Production: LIVE https://teka-edu.vercel.app (September visual upgrade, 2026-09-24, 28dcb0a; container, cdg1, Supabase PROD).
            The team-scoped alias teka-edu-teka10.vercel.app and all generated URLs stay protected
CI:         Verified on GitHub for push and pull_request events; required by the develop/main rulesets;
            first production promotion PR #5 green
CD:         STAGING_DEPLOY_ENABLED=true; PRODUCTION_DEPLOY_ENABLED=true (set 2026-09-22 for the release)
Remote:     github.com/ipanga/teka_edu (public). main (default) = a729722 (merge of develop 35e7056,
            promotion PR #76); develop continues ahead of it, which is expected (ADR-022)
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
- **PD-016: Alignment with the DRC PNEM 2021** (ISSUE-018) — **partly resolved 2026-09-12 (ADR-037)**
  - Settled: the French daily-movement rule stays; the PNEM does not set the rhythm.
  - Still open: when free-play and vie-pratique enrichment content is written, and in what order relative to the rest of the year (PD-015).
- **PD-014: EVAR (éducation à la vie affective et relationnelle)** (before content authoring)
  - The 2026 annex attaches the French EVAR programme (arrêté du 3 février 2025) to the six domains. The model supports it as a `transversal` component, but whether and how Teka Edu includes it in the DRC context is an owner decision. Not configured.
- **PD-005: Mid-year start** (before Phase 2)
  - Proposal: calendar-aligned by default, with a per-child position the parent can reset.
- **PD-006: PWA tooling** (before Phase 5)
  - Choose a maintained service-worker approach compatible with Next.js 16 / Turbopack.
- **PD-007: Offline speech**: **resolved** (ADR-046). Browser speech synthesis is not the educational voice — the French differs by platform, several voices are not French-native, and most need a network. Prerecorded human French is the route; until it is recorded, the parent reads aloud (`docs/AUDIO_GUIDELINES.md`).
  - Still open, but smaller: who records the ~20 core words, and when the repository stops being the right home for the files (~25 MB).
- **PD-008: Media sourcing and licensing**: **resolved** (ADR-042). SVG drawn in this repository, named by stable id, no third-party asset licence to track.
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
Completed:  SEPTEMBER VISUAL UPGRADE PRODUCTION RELEASE: SUCCESS.
            Registry pruned 44 -> 35 (owner-authorised, repository policy, production and staging
            protected); Supabase CLI pinned to 2.117.0 in CI and both deploy workflows (#83).
            Promotion #84 -> main 28dcb0a; run 35983628116 approved by the owner; PROD 41 -> 42
            migrations; dpl_22DjVFzGbinNs4xkCrEzgMM5Svh7 production READY.
            Anonymous: public suite 9/9, 49/49 pictures with frozen hashes, 39 page views with
            0 broken images at phone/tablet/TV, m3-art-04-a1 shows the rain picture.
            PROD read-only: 176 approved (88 + 88), 176 distinct digests, all ai-assisted,
            36/36 tables with RLS, no user data. Staging and generated URLs protected.
            Registry 37 of 50.
Cost:       $0.
Next:       Refine the October annual progression for 3ème maternelle, then prepare October
            Weeks 1-2 as the first pedagogical-review batch. Not started.
```

September Astra local checkpoint (2026-09-25): all 302 initial TV child screens manually
inspected in addition to all 302 phone initial screens. The first 176 noninitial phone
interaction captures were inspected; 189 readable interaction sheets are available locally.
Full state/scroll QA and illustration integration remain in progress. No publication or deployment.

### 2026-09-25 — Astra local interaction review continued

All 501 captured noninitial phone states are now manually inspected; TV sheets 001–028 add
112 inspected states. The durable manifest is
`docs/review/media/astra-manual-interaction-review.json`. These are captured viewports, not
a full-scroll or physical-distance certification. Long phone count resets retained the bottom
scroll position (fixed locally later by VIS-FIX-01). TV feedback and placed sorting thumbnails remain small and faded.
Generic counting/sorting correctness findings remain isolated for independent review; no
approved content or media changed. Review remains local; no push, PR or deployment.

### 2026-09-25 — Local TV feedback layout follow-up

Manual interaction review now covers all 501 phone and 501 TV noninitial viewports (all 189 sheets). Five-choice TV games previously wrapped 4+1 and clipped return controls after feedback. Wide child choice grids now show five choices in one row; child feedback is 30px. Nine layout E2E tests pass on the local Webpack development preview, including retry/reveal/success navigation bounds; 397 unit tests and changed-file lint pass. Five-word and eight-shape reveal screenshots manually inspected.

Standard Turbopack build still fails with local process port-binding EPERM. Webpack production build now passes after extracting the existing health-route helper into `lib/health.ts` without changing endpoint behavior; fresh typecheck, health tests and changed-file lint pass. Standalone server started locally on port 3003. After the approval-service reset, normal approved retries succeeded: 40 production-build E2E pass (9 skipped). Full-scroll capture covers 1,606 states and 1,042 additional images with zero horizontal overflow, broken/missing images or unreachable returns. Six sample scroll images inspected; full manual scroll review remains pending. Container/bundle checks remain stale. No lesson/media registry/history changes, approval stamps, push, PR or deployment. Review remains incomplete; next: manual scroll and other viewport review. See `docs/work/ACTIVE_TASK.md`.

Local follow-up browser suite: 40 E2E passed, 9 production-only tests skipped, against the Webpack development preview (`/tmp/teka-astra-five-choice-all-e2e.log`). The later production-build E2E also passes; container validation remains stale.

### 2026-09-25 — VIS-QA-01 evidence and VIS-FIX-01 count reset (local)

**VIS-QA-01:**

- `scripts/astra-remaining-sheets.mjs` generated 165 full-scroll sheets and 266 large-phone, tablet and desktop sheets, covering all 1,208 initial panels. They are stored, Git-ignored, under `private/astra-visual-evidence/remaining-review/`.
- The six previously reviewed scroll frames are preserved; everything else is unreviewed.
- Astra's visual review is in progress: all 165 scroll sheets, all 38 large-phone initial sheets and initial
  all 76 tablet-portrait, tablet-landscape and desktop sheets have been accepted as reviewed
  (431 total sheets / 1,208 initial panels). Claude Max/Opus inspected
  scroll sheets 007–016 under the owner's narrow evidence authorization. Astra independently checked its
  only claimed defect and representative clean states; the moving grey outline was a stationary-pointer
  hover artifact in the capture, so no product correction was justified. Existing pedagogy findings and
  stale reset captures remain recorded. The later review confirmed the already-open triangle-without-matching-
  group issue, identified undersized placed sort tokens as a high-value UX candidate, and found that the
  1ère movement activities display unrelated generic running steps, and confirmed that generic media tags
  produce ungrammatical French labels such as « Montre : main ». The latest batch also found sentence stems
  rendered as empty picture cards, shape-specific retry copy in an object game, and a same-number lesson
  rendered as a fixed six-dot counter. The same generic counter also erases required line, two-set and circle structures, while fixed-label shape sorting accepts mismatches and praises completion. The latest review also found missing matching models, real-world observation converted into graded choice, and a 10–20 lesson rendered as a very tall 1–20 counter. The next batch also confirmed that later hidden-part, two-collection, model-pile and number-strip tasks collapse into the generic dot grid, and found « la monnaie » rendered as an empty word card because its fifth image is absent. The rain/counting-rhyme and recalled-then-new-rhyme screens match their approved guides. The following batch found a square-and-triangle house task rendered as four isolated shapes, and extended the fixed-choice conversion defect to animal comparison and real-object face matching. The sleeping Malo image and one-picture-per-story model match explicit approved illustration decisions. The final scroll batch found the approved 1–30 task capped and praised at 20, while later reconstruction and number-strip tasks further confirm the generic-counter defect. The printed favourite rhyme is an approved fallback and needs no change. All 165 scroll sheets are now reviewed. Initial sheets 021–025 additionally expose a missing off-screen handoff for media-free real-world observation and misleadingly incomplete reference thumbnails in two hands-on setups; these are classified for the systemic design pass. Initial sheets 026–030 add a content/payload completeness defect in `m3-lang-12-a2`, which asks to sort words but supplies none; existing handoff, grouping and renderer defects recur. Initial sheets 031–035 add no new defect class and confirm the existing off-screen handoff, generic counter, fixed-choice conversion and incomplete hands-on reference findings. Initial sheets 036–038 add no new class and confirm the empty sentence-stem, counter, sorting-feedback and physical-setup findings; all 38 large-phone initial sheets are now complete. Initial sheets 039–043 add no new class and confirm finger-to-dot substitution, line-arrangement loss, thumbnail ambiguity and fixed-choice conversion. Initial sheets 044–048 add no new class and confirm two-set/circle arrangement loss, the missing comparison model, fixed-choice conversion and setup-thumbnail incompleteness. Claude Max/Opus reviewed sheets 049–064; Astra independently rejected or deduplicated every proposed new issue, including the explicitly approved rain/rhyme pairing, scroll-reachable landscape controls, optional punctuation wraps and the approved off-screen six-word rhyme bank. Generic counter, fixed-choice and movement issues recur. Claims of missing media or models were rejected where the approved activity is intentionally oral, open drawing or text-only. Initial sheets 065–070 add no new class: generic counter, fixed-choice, movement and incomplete-reference findings recur, while guillemet line breaks remain optional typography polish and all controls are scroll-reachable. Initial sheets 071–076 also add no new class: the proposed sound-game omission was rejected because its off-screen banner is present, body observation extends the existing missing-handoff class, and the printed favourite rhyme is an explicitly approved fallback. All generated child evidence is now reviewed. No approved content or digest was changed. Next is the parent-layout and whole-product UX gap audit.

**VIS-FIX-01:**

- In the child view, « Recommencer » in a counting activity resets the count as before. It now also brings the dialog back to the instruction and focuses it, through a narrow `ChildSurfaceContext` callback. The parent guide is unchanged.
- Fresh checks: Webpack production build, typecheck, full unit suite 399/399, and changed-file lint
  and format pass. The focused phone E2E fails against the old build at the instruction visibility
  assertion and passes against the current development runtime, including unchanged parent scroll.
- Astra inspected the post-reset 320×740 screen and accepted the bounded implementation locally.
- The earlier full browser/container/bundle results remain stale for this runtime change.
- No content, media, approval, push, PR or deployment. See `docs/work/ACTIVE_TASK.md`.

### 2026-09-26 — September audit completion and VIS-FIX-02 (local)

- Completed review of all generated child evidence: 165 scroll sheets plus 266 initial sheets,
  representing 1,208 initial panels. No sheet remains unreviewed.
- Added a deterministic whole-product audit covering fourteen journey states at phone, tablet, desktop
  and TV sizes. Its 56 post-fix captures have zero horizontal overflow and zero broken images. Captures
  remain ignored and local; `scripts/astra-product-ux-audit.mjs` is the reusable tracked harness.
- Claude Max/Opus reviewed an isolated four-sheet package under the owner's standing authorization. Astra
  independently accepted three parent-flow findings and rejected or downgraded preference-only claims.
- Implemented safe, non-pedagogical fixes: visible preparation safety notes; accurate stop-before-first-
  activity copy; observation-first completion priority; grammatical generic choice/retry copy; intentional
  text-only vocabulary cards; an off-screen handoff for media-free observation; sticky long-count progress;
  and larger placed sorting tokens.
- Reconciled the illustration record with the final frozen QA: 35 accepted, 11 refined, 3 redrawn, 0
  outstanding, 176/176 approvals. No asset, lesson payload, digest, database, environment or deployment changed.
- Genuine renderer/content findings that alter teaching intent remain gated on owner direction and the
  existing approval-lapse/reconfirmation workflow. The review is local only; no push, PR or deployment.

### 2026-09-26 — Bounded September pedagogical/media correction batch (local)

- Made `off-screen` authoritative for quantity, matching/sorting and observation renderers. The application
  no longer substitutes a generic tappable counter, graded fixed choice or completion praise for an approved
  real-object, spoken or observational task. Static pictures are explicitly reference material.
- Corrected the two round/square sorts, all 22 1ère movement step payloads and the missing six-word language
  sort. Added and froze a simple no-numeral money asset and a composed square-wall/triangle-roof house model;
  all 49 earlier frozen asset bytes remain unchanged.
- Lapsed exactly the 27 changed lessons and generated the minimum mixed reconfirmation packages for 1ère
  weeks 1–5 and 3ème weeks 3–4. A second lapse dry-run reports zero stale approvals. No approval was restored
  and no digest was restamped.
- Local validation passes: format, lint, typecheck, 414 unit tests, 31-file content validation, deterministic
  reports and pgTAP mirror, 51-asset visual audit, Webpack production build, 28-file three-sentinel client scan,
  and 41 E2E tests (9 production-only skipped). Sixteen targeted captures at phone, tablet, desktop and TV
  sizes were inspected with no clipping, overlap, broken media or unreachable control.
- Claude Max/Opus supplied the bounded correction map and a renderer/test implementation. Astra independently
  rejected new on-screen mini-games, reviewed every worker diff and adjusted generic quantity references so
  they cannot contradict the approved instruction.
- Next gate: an independent AI-assisted reviewer must decide the two reconfirmation packages. Until acceptance
  is recorded, the 27 lessons remain at `review`. No push, PR, staging, production, production-data or October
  work occurred.

### 2026-09-26 — September independent reconfirmation dossier ready (local)

- Added a reviewer brief and machine-readable manifest covering exactly the 27 lapsed lessons. Every record
  contains the class, day/week, exact before/after field, audience, pedagogical reason, objectives, unchanged
  progression/duration/safety checks, media references, previous digest impact and pending reviewer verdict.
- The renderer-only presentation correction is separated from canonical pedagogical changes and carries no
  lesson-digest impact. The dossier explicitly states that technical validation does not grant approval.
- The two new assets have rendered evidence plus their pedagogical purpose, use, French accessibility text,
  style assessment and misleading-detail check. The other 49 frozen asset hashes remain unchanged.
- Dossier integrity check passes: 176 total, 149 approved, exactly 27 at `review`, zero additional stale
  approvals, all unaffected approval records unchanged from `aa111b5`, and no fresh digest computed or stored.
- State is unambiguous: ready for an independent ChatGPT decision. No accepted review entry, approval
  restoration, content change, push, PR, deployment, production-data operation or October work occurred.

### 2026-09-26 — September independent reconfirmation accepted (local)

- Under the owner's exact five-file authorization, Claude Max / Opus independently reviewed the bounded
  dossier. Pass 1 returned `accepted-with-modifications`; Astra verified and corrected the ambiguous rule
  wording and non-square house wall. The final isolated pass explicitly accepted all 27 lessons, the
  renderer-only presentation change and both new assets with no further modification.
- Recorded seven full-review AI-assisted acceptance entries for 1ère maternelle weeks 1–5 and 3ème
  maternelle weeks 3–4. The standard lapsed-only approval command restored exactly 27 lessons.
- September now has 176 approved lessons and 0 at `review`. Every restored digest is fresh and verified,
  no restored digest reuses its prior value, all 176 current digests are unique, and all 149 unaffected
  approval records are byte-for-byte unchanged.
- Generated `supabase/migrations/20260926173653_september_reconfirmation.sql`; a disposable local database
  reset and all 152 pgTAP assertions pass. The local Supabase stack was stopped afterward.
- Final local checks pass: format, lint, typecheck, 414 unit tests, content validation, deterministic reports,
  Webpack production build, 28-file client-bundle secret scan and 41 E2E tests (9 production-only skipped).
  Eight final captures verify the corrected rule wording and square house at phone, tablet, desktop and TV.
- The default Turbopack build retains the known local port-binding `EPERM`; the Webpack production build
  succeeds. No push, PR, merge, staging, production, production-data operation or October work occurred.
