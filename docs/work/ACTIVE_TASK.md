# Active Task

## Task

September Visual Experience Review — GPT Astra

## Objective

Independently audit all September child-facing activities in 1ère and 3ème maternelle;
improve justified visual defects, validate locally, and return independent review material.
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

TV four-word preview exposed 3+1 wrapping and a below-screen return control. A count-aware
TV word grid and regression test now pass all 39 local E2E tests; both container smokes pass.

2026-09-25 — Final responsive layout revalidated locally. 1,812 initial-state screenshots
per version and 1,606 final interaction-state screenshots retained; no missing files, broken
images or detected horizontal overflow. Final checks: 397 unit tests, 39 E2E passed (9 public
production tests intentionally skipped), standard build, 152 pgTAP/RLS assertions, both Docker
builds/smokes and bundle sentinel scan. Four body illustration candidates remain outside the
registry. All 302 initial phone viewports were manually inspected in 44 day sheets; full manual state
inspection, lower scroll content and replacement integration are unfinished.

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

Final capture runs are complete. Evidence lives in
`private/astra-visual-evidence/{baseline,after-fourwords,interactions-fourwords}`.
The interaction walker covers initial screens, word-game entry, retry/reveal/success/next target,
every narrative page, count increments/reset and sort placements. It does not establish manual
inspection of every screenshot or all possible interaction sequences.

Selected comparisons: `docs/review/media/astra-comparison/`. Full captures are ignored local
files; never store these in disposable `test-results`, which Playwright clears.

## Remaining

- Complete 49 asset and 302 activity audit; inspect actual rendered states at six sizes.
- Visual specification and batch plan written; keep batch states honest as work proceeds.
- Implement, inspect before/after, honestly lapse only affected approvals and prepare packages.
- Finish artwork and independent review handoff. PR/staging withheld by owner.
- UI findings, accepted assets and detailed batch states will link to the new audit.

## Validation State

| Check                                                                          | Result | At                                                                                  |
| ------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------- |
| format                                                                         | PASS   | format check passed; recheck after checkpoint edits                                 |
| lint                                                                           | PASS   | final runtime layout                                                                |
| typecheck                                                                      | PASS   | final runtime layout                                                                |
| unit tests                                                                     | PASS   | 397/397 final runtime layout                                                        |
| content validation/media fingerprints/lesson digests/review history/curriculum | PASS   | content unchanged; dry-run lapses 0                                                 |
| database tests/pgTAP/RLS                                                       | PASS   | 152 assertions, local migration 42                                                  |
| build                                                                          | PASS   | final standard Turbopack build with CI fake sentinels                               |
| E2E/responsive/reduced-motion                                                  | PASS   | 39 passed, 9 public-production tests skipped; 1812 initial captures per version     |
| Docker portable/Vercel/smoke                                                   | PASS   | both final builds and health/signal checks, exit 143                                |
| client-bundle secret scan                                                      | PASS   | 14 files, all 3 CI sentinels absent                                                 |
| repository history secret scans                                                | PASS   | 190 commits, no leaks                                                               |
| source artifact secret scan                                                    | PASS   | 393 source/artifact files, 63.91 MB, no findings; later edits are audit prose       |
| whole directory secret scan                                                    | FAIL   | 9 flags, all ignored .next generated preview/encryption metadata; no source finding |
| tracked .env files                                                             | PASS   | zero tracked                                                                        |

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

1. Continue manual inspection beyond the 302 initial phone viewports (complete): review lower
   scroll content, phone/TV interaction states and other viewports. See
   `docs/review/media/astra-manual-phone-review.json` and ignored `manual-sheets/`.
   Next visual fix: prevent story page counter wrapping beside long titles.
2. Compare the four body candidates at 72/128/256/480 px and in actual phone/TV activities.
   All are local drafts under `docs/review/media/astra-drafts`, outside the media registry.
3. Continue the 26-asset brief plan; no broad integration before audit is complete.
4. On real integration, use existing lapse/reconfirmation workflow and preserve historical
   approvals. Never self-approve or copy approval digests.
5. Update audit/checkpoint, rerun applicable checks and commit locally. No push or PR.

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
