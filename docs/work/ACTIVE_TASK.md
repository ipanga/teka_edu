# Active Task

## Task

September Visual Experience Review — GPT Astra

## Supervisor handoff — 2026-09-25

- **Task status:** IN_PROGRESS. September is neither implementation-complete nor ready for independent reconfirmation.
- **Supervisor:** Astra; **worker:** Claude Code CLI 2.1.282, installed at `/Users/Apple/.local/bin/claude`; ready to launch with Max authentication.
- **Current branch:** `codex/september-astra-visual-review`; **current local commit:** `cf924e5` (VIS-QA-01 evidence tooling plus the accepted VIS-FIX-01 count-reset fix).
- **Base commit / refreshed develop:** `a0b743b`; **refreshed main:** `28dcb0a`. Fetch completed on 2026-09-25. Six local commits ahead of the feature remote; no open PRs returned by GitHub.
- **Completed:** existing audit inventory, initial phone/TV review, all 1,002 noninitial viewport reviews, UI fixes, 1,606-state scroll capture. Preserve existing evidence; do not restart.
- **In progress / pending:** manual review of 1,042 scroll images (scroll sheets 001–006 inspected), four other viewport sets (sheets 001–002 inspected), parent layouts, illustration refinements and eventual independent review packages.
- **Authentication verified:** normal macOS credential-store access with `env -u ANTHROPIC_API_KEY claude auth status` confirms `claude.ai`, subscription `max`. The earlier sandbox-only check could not see this login. Always exclude the API-key override for worker invocations.
- **Owner decision required:** explicit disclosure authorization for the next Claude Max visual-audit batch. Automatic approval review blocked the CLI launch before execution because it would transmit ten local review-sheet PNGs to Anthropic. No evidence was transmitted. The smallest proposed payload is `scroll-007.png` through `scroll-016.png`, their state labels and the bounded audit prompt; no project source or broader documentation.
- **Tests completed:** VIS-FIX-01 passes a fresh Webpack production build, project typecheck, full unit suite (399/399), changed-file lint/format and its focused browser test on the current development runtime. The browser test independently fails against the old `4a062ee` production build because the instruction remains offscreen, then passes against the fix. The previous 40-test browser suite, container and bundle checks remain stale for this runtime change; the standard Turbopack build has a local EPERM.
- **CI state:** no CI for the six unpublished local commits. Latest fetched staging deployment succeeded at `a0b743b`; production deployment succeeded at `28dcb0a`. Historical validation table below must not be read as fresh CI for this branch.
- **Staging state:** existing deployment unchanged; this review is local only under the owner's earlier explicit instruction.
- **Production state:** existing public service at `28dcb0a`, unchanged. No release authorization.
- **Exact next command:** after the owner explicitly authorizes the stated evidence disclosure, delegate the bounded `scroll-007.png` through `scroll-016.png` audit to Claude Code Max with `env -u ANTHROPIC_API_KEY claude --model opus ...`; provide only those ten PNGs, their state labels and the audit prompt. Codex then independently checks each reported defect and representative clean sheet before accepting the batch.
- **Exact resume point:** awaiting the narrow Claude evidence-disclosure decision above. If authorized, launch the bounded batch. If declined, continue VIS-QA-01 locally at `private/astra-visual-evidence/remaining-review/scroll/scroll-007.png` and initial sheet 003 for each other viewport. No push, PR, deployment or approval stamping.

| ID         | Task                                               | Worker                                 | State                          | Review                      | CI         | Staging  |
| ---------- | -------------------------------------------------- | -------------------------------------- | ------------------------------ | --------------------------- | ---------- | -------- |
| VIS-QA-01  | Organize remaining existing screenshots for review | Claude Code                            | Evidence prepared (431 sheets) | Pending Astra visual review | Local only | Withheld |
| VIS-FIX-01 | Child count reset returns to the instruction       | Claude Code                            | Implemented and verified       | Astra pass                  | Local only | Withheld |
| VIS-ART    | Remaining justified asset refinements              | Claude / specialized visual generation | Pending audit completion       | Independent review required | Not run    | Withheld |

## VIS-QA-01 checkpoint — 2026-09-25 (Claude Code worker)

- **State:** evidence prepared; visual review IN_PROGRESS. Astra reviewed scroll sheets 001–006 and sheets 001–002 for all four other viewports; the durable review manifest is `docs/review/media/astra-supervisor-remaining-review.json`.
- **Generated (supervisor ran the generator, because the worker session could not execute `node`):**
  - 165 scroll sheets and 266 other-viewport sheets; all 431 files exist.
  - 1,208 initial panels.
  - The six previously reviewed scroll frames are preserved as reviewed; every other frame is unreviewed.
  - Supervisor visually reviewed `scroll/scroll-001.png` through `scroll/scroll-006.png` and the first two
    large-phone, tablet-portrait, tablet-landscape and desktop sheets. That is 14 sheets / 40 initial panels,
    not acceptance of the set.
- **Generator:** `scripts/astra-remaining-sheets.mjs` (Prettier and ESLint pass). It reads existing captures only
  and never opens the app. It exits non-zero on a missing frame/PNG, a duplicate frame, or a
  previously reviewed frame that is absent from the capture. Existing sheets are skipped, so it can resume.
  Output goes to ignored `private/astra-visual-evidence/remaining-review/`:
  - `scroll-manifest.json`: every scroll frame, grouped by state (activity, state, source state
    screenshot, clientHeight/scrollHeight, frame position k/n, scrollTop). `reviewed: true` only for
    the six frames in `astra-interaction-scroll-evidence.json`; every other frame is `false`.
  - `scroll/scroll-NNN.png`: one row per state, 320 px native frames, labelled as separate
    overlapping scroll positions of one screen. Only states with an unreviewed frame are included,
    and frames already reviewed are outlined.
  - `initial-manifest.json` + `{large-phone,tablet-portrait,tablet-landscape,desktop}/…-NNN.png`:
    unscaled source-size panels. The sizes are read from the PNG headers. All panels are unreviewed, and each
    carries `possiblyStale` reasons.
- **Counts:**
  - 1,042 phone scroll frames in 497 states; 0 TV scroll frames.
  - 1,208 initial panels (302 each for large-phone, tablet-portrait, tablet-landscape and desktop).
  - Sheets: 38 large-phone (8 per sheet), plus 76 each for the other three (4 per sheet), and 165 scroll sheets.
- **Source staleness:** `after-fourwords` was last written 2026-09-25 05:55, from an uncommitted
  tree after `0e9e4e5`. Its exact revision was not recorded. It predates runtime commits `30769a0`, `7e74ecb` and `4a062ee`:
  - the story counter is now kept on a single line, at all sizes;
  - at ≥1280 px (desktop only among the four sets), the word grid is count-aware and five choices sit in one row.
  - The scroll frames come from the build recorded in the scroll evidence (the `4a062ee` runtime).
    After VIS-FIX-01, the phone `reset` states of counting activities are stale: they show the old
    bottom-of-screen position (for example, `phone-m3-math-10-a1-reset-scroll-702.png`). No other captured state is affected.
- **Parent-mode evidence gaps (no coverage invented):**
  - No parent-view screenshot exists in any capture set.
  - `astra-render-audit.mjs` recorded only the parent DOM, and only for each activity's initial state: horizontal overflow and image widths/broken flags, at six viewports.
  - The E2E suite checks parent overflow only at 390×844 and 1280×900, for day 6 of 3ème.
  - Not captured at all:
    - parent guide screens;
    - the « Pour vous » folded zone, open or closed;
    - the calendar and home at the six sizes;
    - the pause point and session end;
    - parent layouts after returning from child view.
- **Next review entry:** continue at
  `private/astra-visual-evidence/remaining-review/scroll/scroll-007.png`, then sheet 003 for each
  other viewport. Record each judgement in `astra-supervisor-remaining-review.json`. Never edit
  `reviewed` in the generated manifests by hand.

## VIS-FIX-01 — child count reset scroll (2026-09-25, Claude Code worker)

- **Defect:** on a phone, pressing « Recommencer » in a long count (for example, `m3-math-10-a1`, 20 objects)
  left the child dialog at `scrollTop` 702 of 702. The instruction and the start of the grid were
  off screen, and focus stayed on the button that had just been removed.
- **Fix:**
  - `ActivityRenderer.tsx` gains `ChildSurfaceContext`, a callback that is null outside the child view.
  - `CountTogether` resets the count exactly as before, then calls the callback.
  - In `SessionRunner.tsx`, `ChildScreen` provides the callback through explicit refs: it sets the dialog
    scroller to `scrollTop = 0` (an instant jump, so reduced motion is respected) and focuses the instruction
    (`tabIndex={-1}`, `preventScroll`).
  - The parent guide has no provider, so its page and focus behave as before.
  - Counting semantics, wording, tiles and other activity types are unchanged.
- **Tests:**
  - Unit test: `counting again` in `tests/unit/activity-renderer.test.tsx`. It failed before the fix
    (the contract was missing) and passes after; the file is 15/15.
  - Browser regression: `counting again on a phone…` in `tests/e2e/september-visual-layout.spec.ts`.
    It covers a 320×740 phone, 12 counted, Recommencer pressed from the lower screen, the zero state, the
    instruction and Objet 1 in view, the instruction focused and the button gone. It also checks that the
    parent page's `scrollY` is unchanged.
  - The worker could not run the browser test because its non-interactive permission surface denied
    browser launch. The supervisor ran it: it fails on the old build at the instruction-in-viewport
    assertion and passes on the current development runtime, including the parent scroll invariant.
- **Supervisor review:** accepted. The callback is limited to the child surface, uses explicit refs,
  restores focus to the instruction after the reset button unmounts, and does not alter approved text
  or counting semantics. The post-reset 320×740 screenshot was visually inspected.
- **Fresh validation:** Webpack production build PASS, typecheck PASS, full unit suite 399/399,
  changed-file lint/format PASS, focused E2E old-build FAIL/current-runtime PASS.
- **Approvals:** no content, media or approval changes. Content digests are unaffected.

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
inspection, lower scroll content and replacement integration are unfinished. Initial TV manual
inspection is now complete (302 screens); all 501 additional phone and 501 TV interaction viewports reviewed.

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

UI follow-up implemented: five-choice TV grid uses one row on wide child screens; feedback grows to 30px. Nine layout E2E tests pass against the local Webpack dev preview on port 3002; 397 unit tests and changed-file lint pass. Five-word and eight-shape retry/reveal/success captures keep parent-return bottom at 1056px in a 1080px viewport. Manually inspected both reveal captures. Evidence: `private/astra-visual-evidence/five-choice-fix/`.

Standard Turbopack build remains blocked by process port-binding EPERM. The Webpack production build now PASSES: moved the existing health helper out of the route module into `lib/health.ts`, preserving behavior and tests. Fresh typecheck, three health tests and changed-file ESLint pass. Log: `/tmp/teka-astra-health-webpack.log`. Standalone build started locally on port 3003. Container/bundle verification remains stale for these changes; the fresh production browser suite below supersedes the earlier development-only results.

Full-scroll interaction capture is now complete on the local production build: 88 session files, 1,606 states, 497 states requiring scroll (all phone), 1,042 extra overlapping scroll images; zero horizontal overflow, broken images, missing files or unreachable return controls. See `docs/review/media/astra-interaction-scroll-evidence.json`. Only six sample scroll images manually inspected: complete scroll visual review remains pending. Resetting a long count kept the phone at the bottom, leaving the instruction offscreen; fixed locally by VIS-FIX-01 (browser check pending).

Fresh verification: Webpack production build, typecheck, full format/lint, 397 unit tests, 40 production-build E2E (9 production-only skipped), content validation (31 JSON) and approval dry-run (0 lapses) pass. Standard Turbopack build remains affected by local EPERM; container and sentinel-bundle checks remain stale. Approval service briefly failed due to usage limits; normal approved retries succeeded after its stated reset time. No ongoing approval-service blocker.

Exact next work: inspect remaining full-scroll images (manifest above records the six already inspected), review the four other viewport sets and parent layouts, then address documented visual defects and continue artwork batches. Do not rerun completed capture just to resume. Existing capture sets predate any later layout fixes and must be labeled accordingly. Standalone preview is on port 3003 while alive; rebuild with `npm run build -- --webpack`, then `PORT=3003 HOSTNAME=127.0.0.1 npm run start` if needed. Commit locally only; no push/PR/staging/production.

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
   Story page counter now uses a nonshrinking single line; validated in rendered phone screenshot.
   Scroll audit: 302 activities at phone + TV, 91 phone screens require scroll, all return controls
   reachable at the bottom; no TV initial screen needs scroll. TV review sheets are generated
   in `private/astra-visual-evidence/manual-sheets/tv-*.png`; all 44 sheets / 302 initial TV
   screens now manually inspected. See `astra-manual-tv-review.json`. Interaction sheets
   generated: 189 sheets / 1,002 noninitial states. Phone sheets 001–063 (501 states)
   manually inspected; TV sheets 001–126 (501 states) inspected; all 1,002 captured noninitial viewports inspected.
   Manifest: `astra-manual-interaction-review.json`. Captures are viewports, often auto-scrolled;
   full-scroll interaction coverage and tablet/desktop manual inspection remain incomplete.
   Local checkpoint before this fix: `30769a0`.
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

Local follow-up browser suite: 40 E2E passed, 9 production-only tests skipped, against the Webpack development preview (`/tmp/teka-astra-five-choice-all-e2e.log`). This does not replace production-build/container validation.
