# Active Task

## Task

September Visual Experience Review — GPT Astra

## Objective

Independently audit all September child-facing activities in 1ère and 3ème maternelle;
improve justified visual defects, validate on staging, and return independent review material.
Preserve approved pedagogy and media approval integrity. Production is out of scope.

## Status

`in_progress`

## Branch

`codex/september-astra-visual-review`

## Base Branch

Started on clean `develop` at `a0b743b997f1effc5f83981e0f32f19514c10251`.
Remote develop verified at the same SHA on 2026-09-24; remote main `28dcb0a732436908e2442525fd3fdb8201e5ae9b`.

## Started

2026-09-24

## Last Checkpoint

2026-09-24 — Local-only continuation. Independent inventory and all 49 asset judgments saved;
302 initial activities captured at six viewports before and after (1,812 per version, no missing
files). Targeted responsive UI implementation passes 397 unit, 31 existing E2E + 7 new layout
checks, standard build/typecheck, 152 pgTAP/RLS, both Docker builds/smokes and sentinel bundle scan.
A final phone-padding correction was made after these checks: affected results below are STALE.
No registered media/content changed. Hand candidate saved outside registry; foot/head drafts
being generated. Complete interaction audit is running with resumable per-day markers.

## Scope

176 September lessons, 302 activities, 49 registered images; all responsive parent/child states.
Complete audit before broad illustration edits. Counts freshly validated. Asset decisions: KEEP 23, REFINE 10, REDRAW 16, REMOVE 0,
REPLACE-WITH-REAL-OBJECT 0. These are audit recommendations, not replacement acceptances.

## Out of Scope

Pedagogical text, objectives, dates, duration, progression, October, 2ème maternelle,
production release, approval stamping, synthetic audio, paid services.

## Product Decisions

User authorizes independent visual review, never self-approval. Latest steering: keep the
review local; do not publish more artifacts, create a PR or deploy staging.
Keep existing illustration freeze/history intact as baseline evidence.

## Completed

- Read task attachment, stable project rules, release record and resumable protocol.
- Verified clean baseline and remote branches; created dedicated branch.
- Content validation PASS at baseline; 176 current approvals, 302 activities, 49 images.
- Audited all 49 images; wrote `docs/review/media/SEPTEMBER_ASTRA_VISUAL_AUDIT.md`,
  `astra-asset-decisions.json`, six readable sheets and canonical inventory.
- Wrote `docs/VISUAL_DESIGN_SYSTEM.md`; isolated movement and generic renderer correctness
  issues without modifying approved content. Implementation batches remain planned.

## In Progress

`node scripts/astra-interactions.mjs` — local server 3000, phone/TV, writes per-day markers
under `private/astra-visual-evidence/interactions`. It covers initial screens, word-game entry,
retry/reveal/success/next target, every narrative page, count increments/reset and sort placements.
It does not establish human inspection of every screenshot or all possible interaction sequences.

Evidence: `private/astra-visual-evidence/{baseline,after}/report.json`, 1812 PNGs in each.
Selected comparisons: `docs/review/media/astra-comparison/`. Full captures are ignored local files;
never store these in disposable `test-results`, which Playwright clears.

## Remaining

- Complete 49 asset and 302 activity audit; inspect actual rendered states at six sizes.
- Visual specification and batch plan written; keep batch states honest as work proceeds.
- Implement, inspect before/after, honestly lapse only affected approvals and prepare packages.
- Revalidate final padding, finish artwork and independent review handoff. PR/staging withheld by owner.
- UI findings, accepted assets and detailed batch states will link to the new audit.

## Validation State

| Check                                                                          | Result | At                                                                                        |
| ------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------- |
| format                                                                         | STALE  | passed before latest scripts and padding                                                  |
| lint                                                                           | STALE  | passed before latest scripts and padding                                                  |
| typecheck                                                                      | STALE  | passed before final padding                                                               |
| unit tests                                                                     | STALE  | 397/397 before final padding                                                              |
| content validation/media fingerprints/lesson digests/review history/curriculum | PASS   | ef12344; content unchanged; dry-run lapses 0                                              |
| database tests/pgTAP/RLS                                                       | PASS   | 152 assertions, local migration 42, UI-only changes                                       |
| build                                                                          | STALE  | standard Turbopack passed from fresh cache, plus fake-sentinel build; final padding newer |
| E2E/responsive/reduced-motion                                                  | STALE  | 31 existing + 7 new passed before final padding; 1812 initial captures per version        |
| Docker portable/Vercel/smoke                                                   | STALE  | both built and smoke-tested, exit 143; final padding newer                                |
| client-bundle secret scan                                                      | STALE  | 14 files, all 3 CI sentinels absent; final padding newer                                  |
| repository history secret scan                                                 | PASS   | 190 commits, no leaks                                                                     |
| source artifact secret scan                                                    | PASS   | tracked + untracked nonignored files, no leaks before newest docs                         |
| whole directory secret scan                                                    | FAIL   | 9 flags, all ignored .next generated preview/encryption metadata; no source finding       |
| tracked .env files                                                             | PASS   | zero tracked                                                                              |

Approvals before/still valid 176/176; intentional/unexpected lapses 0/0; digest mismatches 0.
No digest was written. No registered illustration was changed. Draft candidates are not accepted.

## Database State

Local Supabase stack started; pgTAP/RLS passed (152). No reset or migration authored.
Hosted DEV/PROD untouched; release baseline migration 42.

## Deployment State

DEV and staging unchanged by this task. Production release record: `28dcb0a`,
https://teka-edu.vercel.app. Live health independently verified: production `28dcb0a`, status ok.
Never change PRODUCTION_DEPLOY_ENABLED or dispatch production.

## Git State

Local feature branch; audit checkpoint `ef12344` was pushed before the owner selected local-only.
Draft PR creation was rejected by automatic approval review; no PR exists. Do not push further.

## Blockers

Staging and PR withheld by latest user instruction: keep review local.
Full manual interaction-state audit and 26 asset refinements/redraws remain unfinished.

## User Decisions Needed

Owner answered “Keep the review local.” No further push, PR or staging deployment.

## Exact Resume Point

1. Inspect `/tmp/teka-astra-interactions.log`; resume `node scripts/astra-interactions.mjs` if
   incomplete. Inspect representative resulting screens and record precise coverage/limits.
2. Save foot/head imagegen results in `docs/review/media/astra-drafts/`; inspect anatomy/style.
3. Build with CI sentinel values from `.github/workflows/ci.yml`; restart local server after
   a rebuild, then run E2E. Do not rebuild under an actively capturing server.
4. Recapture after padding via `ASTRA_BASE_URL=http://127.0.0.1:3000
ASTRA_OUT=private/astra-visual-evidence/after-final node scripts/astra-render-audit.mjs`.
5. Regenerate comparisons (`node scripts/astra-comparison.mjs`, currently reads `after`),
   update audit, tests, checkpoint, and commit locally. No push or PR.
6. Continue planned illustration batches only after the complete audit; use existing lapse and
   reconfirmation workflow on real integrated media changes. Never self-approve.

The unchanged baseline has a local build in `/tmp/teka-astra-baseline-src`, serving port 3001.
Temporary files are convenience only; baseline can be reconstructed from Git `a0b743b`.

## Resume Verification

```sh
git status --short --branch
git log -5 --oneline
cat docs/work/ACTIVE_TASK.md
npm run content:validate
npm run media:report
```
