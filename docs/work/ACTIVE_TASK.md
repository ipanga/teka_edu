# Active Task

## Task

September Visual Experience Review — GPT Astra

**Current phase:** September reconfirmation material is complete and ready for an independent AI-assisted reviewer; 27 approvals remain lapsed pending that decision.

## Supervisor handoff — 2026-09-26

- **Task status:** READY_FOR_INDEPENDENT_RECONFIRMATION. The completed audit remains closed. The reviewer dossier is complete; no approval was restored and no pedagogical decision has been inferred.
- **Supervisor:** Astra; **worker:** Claude Code CLI 2.1.282, installed at `/Users/Apple/.local/bin/claude`; ready to launch with Max authentication.
- **Current branch:** `codex/september-astra-visual-review`; **current durable checkpoint:** `b0c4ab3` (`Record September correction checkpoint`), with the reconfirmation dossier ready for its local checkpoint commit.
- **Base commit / refreshed develop:** `a0b743b`; **refreshed main:** `28dcb0a`. Fetch completed on 2026-09-25. The implementation checkpoint is thirty-three local commits ahead of the feature remote; no PR was created because the owner selected local-only work.
- **Completed:** existing audit inventory, initial phone/TV review, all 1,002 noninitial viewport reviews, UI fixes, 1,606-state scroll capture. Preserve existing evidence; do not restart.
- **Completed audit:** all 165 scroll sheets and all 266 initial sheets (431 sheets / 1,208 initial panels), plus 56 whole-product captures across phone, tablet, desktop and TV. The product audit covers home, all class entry states, calendar, preparation and alternatives, parent guidance folded/open, child view, pause, early stop, completion and observation. It found zero horizontal overflow and zero broken images.
- **Authentication verified:** normal macOS credential-store access with `env -u ANTHROPIC_API_KEY claude auth status` confirms `claude.ai`, subscription `max`. The earlier sandbox-only check could not see this login. Always exclude the API-key override for worker invocations.
- **Owner decision required:** send the five-file review set named below to an independent ChatGPT reviewer and return its explicit `accepted`, `accepted-with-modifications`, or `rejected` decision with rationale. Until then, all 27 lessons stay at `review`.
- **Tests completed:** format, lint, typecheck, 414/414 unit tests, 31-file content validation, deterministic reports and pgTAP mirror, approval dry-run with 0 further lapses, Webpack production build with the three documented fake server sentinels, 28-file client-bundle scan and the full local browser suite (41 passed, 9 production-only skipped). Sixteen fresh targeted captures cover the corrected states at phone, tablet, desktop and TV; Astra inspected all four contact sheets. No database migration was made; Docker was not relevant to this renderer/content/media-only batch.
- **CI state:** no CI for the unpublished local commits. Latest fetched staging deployment succeeded at `a0b743b`; production deployment succeeded at `28dcb0a`. Historical validation table below must not be read as fresh CI for this branch.
- **Staging state:** existing deployment unchanged; this review is local only under the owner's earlier explicit instruction.
- **Production state:** existing public service at `28dcb0a`, unchanged. No release authorization.
- **Exact next task:** give the independent reviewer the reviewer brief, both generated before/after packages, structured manifest and two-asset media sheet. Record the returned decision verbatim; only an explicit acceptance permits the existing approval command on the named lapsed lessons.
- **Exact resume point:** the review material is ready and locally verified: 27/27 lesson records, 2/2 media records, 149 approved, 27 review, 0 additional stale approvals, 49 prior media hashes unchanged and all unaffected approval records unchanged. Do not alter or regenerate content while awaiting the decision. No push, PR, deployment or approval stamping has occurred.

| ID         | Task                                              | Worker              | State                          | Review           | CI         | Staging  |
| ---------- | ------------------------------------------------- | ------------------- | ------------------------------ | ---------------- | ---------- | -------- |
| VIS-QA-01  | Review September screenshots and product journey  | Claude Code / Astra | Complete (487 sheets/captures) | Astra pass       | Local only | Withheld |
| VIS-FIX-01 | Child count reset returns to the instruction      | Claude Code         | Implemented and verified       | Astra pass       | Local only | Withheld |
| VIS-FIX-02 | Safe renderer and parent-flow corrections         | Astra               | Implemented and verified       | Astra pass       | Local only | Withheld |
| VIS-PED    | Bounded pedagogical/media correctness corrections | Astra / Claude Code | Reconfirmation dossier ready   | Decision pending | Local pass | Withheld |

## VIS-PED design checkpoint — 2026-09-26

- **Classification complete:** the broad renderer defect is that explicit `off-screen` mode is not
  authoritative in the quantity, sorting/matching and multi-image observation families. Those renderers
  invent counters, graded choices and completion praise for activities whose approved pedagogy happens with
  real objects, movement or conversation. Fix the shared renderer and retain only useful static reference
  material. Renderer-only changes do not alter approval digests.
- **Claude Max/Opus:** completed a read-only correction map from the bounded source set. It confirmed the
  affected families, two equivalent occurrences and the approval mechanism. Astra rejected its proposed
  thirteen new counting mini-game contracts and checked sorting game because they would add screen pedagogy
  to activities already marked off-screen and would create unnecessary content lapses.
- **Content/data corrections:** remove the stray triangle from `m1-math-16-a1` and the equivalent
  `m1-math-19-a1`, whose approved guidance teaches only rounds and squares; replace generic movement display
  steps across all 22 1ère physical lessons with steps derived from each existing instruction/guidance; and
  supply a bounded six-word bank for `m3-lang-12-a2`.
- **Media corrections:** add one simple no-numeral representation of « la monnaie » to `m3-lang-13-a2`, and
  one composed square-wall/triangle-roof house model to `m3-math-18-a2`. Existing frozen asset bytes remain
  unchanged. The two additions require new fingerprints, visual checks and mixed content/media
  reconfirmation, not the old visual-only shortcut.
- **Expected approval scope before dry-run:** 27 lessons — all 22 1ère physical lessons,
  `m1-math-16`, `m1-math-19`, `m3-lang-12`, `m3-lang-13` and `m3-math-18`. Confirm this with the lapse dry-run
  after implementation; do not copy these counts into approval records.
- **Direct equivalents:** the renderer correction also covers all other off-screen counters and the
  previously recorded fixed-choice conversions (`m3-world-02-a1`, `m3-world-06-a2`) without changing their
  canonical content. The 3ème movement steps were audited and already match their instructions; no change.
- **Exact next task:** delegate the bounded renderer/test edit to Claude Code, review it independently, then
  implement and validate the content/media corrections as separate checkpoints.

## VIS-PED implementation checkpoint — 2026-09-26

- **Renderer/system:** explicit `off-screen` mode now wins in quantity, group/match and observation families.
  These screens retain static references where useful but no longer invent counters, graded choices, drop
  zones or completion praise. Hands-on thumbnails are labelled as examples rather than complete setups. The
  sorting schema now permits an optional spoken item bank.
- **Canonical content:** the stray triangle was removed from `m1-math-16-a1` and `m1-math-19-a1`; all 22
  1ère movement payloads now state the movement already required by their approved instruction and guidance;
  and `m3-lang-12-a2` now supplies six words, two for each existing category.
- **Media:** added and froze `objet-monnaie` and `forme-maison-composee`. The market vocabulary order and media
  order match exactly. The drawing model contains the approved square wall, triangle roof and optional disk
  sun. All 49 pre-existing frozen media hashes remain unchanged.
- **Approval integrity:** the lapse dry-run named exactly the expected 27 lessons. The actual lapse changed
  only those lessons to `review`; a second dry-run reports 0 stale approvals. No digest was copied, forged or
  restamped and no lesson was re-approved.
- **Reconfirmation artifacts:** generated the minimum mixed packages
  `docs/review/2026-2027-maternelle-1-semaines-1-5-reconfirmation.md` (24 changes) and
  `docs/review/2026-2027-maternelle-3-semaines-3-4-reconfirmation.md` (3 changes), plus the refreshed review
  packages and the two-asset contact sheet.
- **Claude Code:** Opus first produced the bounded correction map. Astra accepted its scope analysis and
  rejected proposed on-screen mini-games. A second Opus worker edited only the renderer and targeted tests;
  it did not return a final transcript before termination, so Astra reviewed every diff and adjusted the
  off-screen quantity rendering to avoid presenting generic payload metadata as the approved setup.
- **Validation:** Prettier, ESLint, typecheck, 414 unit tests, content validation, calendar/programme/coverage/
  media/plan reports, visual audit (176 lessons, 302 activities, 51 assets), pgTAP reference generation,
  approval dry-run, Webpack production build, 28-file three-sentinel client scan and 41 local E2E tests pass
  (9 production-only tests skipped). Sixteen targeted screenshots cover movement, spoken sorting, market
  money and the house model at 390×844, 768×1024, 1440×900 and 1920×1080; no clipping, overlap, broken image
  or unreachable control was found. Evidence is ignored locally under
  `private/astra-visual-evidence/september-correction-qa/`.
- **Environment:** local only. No push, PR, CI, staging, production, production data or October work.
- **Next:** obtain a genuinely independent reconfirmation decision on the two packages. If accepted, record
  that review and restore only the 27 lapsed lessons through the repository command with fresh digests.

## Independent reconfirmation material checkpoint — 2026-09-26

- **Ready files:** `docs/review/2026-2027-september-corrections-reconfirmation-brief.md`, the two generated
  class/week packages, `docs/review/2026-2027-september-corrections-reconfirmation-manifest.json`, and
  `docs/review/media/septembre-corrections-media.png`.
- **Lesson coverage:** the manifest contains one complete record for each of the 27 lapsed lessons: class,
  instructional day/week, activity, exact field, before/after value, audience classification, pedagogical
  reason, learning objectives, unchanged progression/duration/safety confirmations, media references,
  previous digest impact and a pending three-way reviewer decision.
- **System separation:** the brief identifies the mode-authoritative renderer change separately. It is outside
  lesson digests and changes no canonical instruction, guidance, objective, progression, duration or safety
  text. It still asks the independent reviewer to confirm that the presentation preserves off-screen meaning.
- **Media coverage:** the sheet renders `objet-monnaie` and canonical `forme-maison-composee` at 72, 128 and
  256 px. The brief records purpose, lesson/activity, French accessibility description, September-style check
  and absence of misleading numerical, currency-specific or extra pedagogical detail. The owner request's
  `forme-maison-compose` spelling is explicitly mapped to the registered `forme-maison-composee` ID.
- **Integrity check:** 27 unique records; 149 lessons approved and 27 at review; every affected `review` is
  null; 0 additional stale approvals; all unaffected approval records match `aa111b5`; both new media hashes
  match the registry; all 49 prior media hashes are unchanged. No fresh digest exists or was computed.
- **Decision state:** pending independent AI-assisted review. Technical validation remains evidence only and
  is explicitly not treated as pedagogical acceptance. No review-history entry or approval restoration made.
- **Exact resume point:** record the independent verdict and rationale. On `accepted`, follow the existing
  review-history and approval mechanism for only the named lessons, then verify fresh digests and unchanged
  unaffected approvals. On `accepted-with-modifications` or `rejected`, keep the relevant lessons at review.

## VIS-QA-01 checkpoint — 2026-09-25 (Claude Code worker)

- **State:** evidence prepared; visual review IN_PROGRESS. Astra accepted all 165 scroll sheets and sheets 001–020 for all four other viewports as reviewed; the durable review manifest is `docs/review/media/astra-supervisor-remaining-review.json`.
- **Generated (supervisor ran the generator, because the worker session could not execute `node`):**
  - 165 scroll sheets and 266 other-viewport sheets; all 431 files exist.
  - 1,208 initial panels.
  - The six previously reviewed scroll frames are preserved as reviewed; every other frame is unreviewed.
  - Supervisor accepted `scroll/scroll-001.png` through `scroll/scroll-165.png`, all 38 large-phone sheets and
    all 76 sheets for tablet portrait, tablet landscape and desktop. That is 431 sheets / 1,208 initial panels;
    the generated child evidence set is complete. Scroll 007–016 had a bounded Claude Max/Opus first pass; Astra independently
    checked its only claimed defect and representative clean states. The claim was a stationary-pointer hover
    artifact in the scroll capture, so no implementation change was justified.
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
- **Accepted/rejected findings in the latest batch:**
  - Accepted as `HIGH_VALUE_IMPROVEMENT`: placed group-and-match tokens are too small to remain readily
    identifiable on a 320 px child screen. Defer implementation until systemic design findings are complete.
  - Confirmed but not new: `m1-math-16-a1` offers a triangle with only round/square groups. The existing
    interaction review already records this as an open pedagogical correctness finding. Do not alter approved
    content or digests during visual work.
  - Newly recorded content/display defect: 1ère movement activities repeat generic running steps even when
    the instruction asks for throwing or walking. Any correction requires a bounded audit and pedagogical
    reconfirmation because the approved payload would change.
  - Confirmed renderer/data-label defect: `m1-world-20-a1` renders bare nouns as « Montre : main » and
    « C’est celui-ci : main. ». Solve generic French display labels in the systemic design pass without
    altering approved lesson instructions.
  - Confirmed renderer defects: `m3-lang-02-a2` renders sentence stems as empty picture cards and generic
    `ChooseOne` feedback tells an object-vocabulary learner to inspect the shape. Preserve the approved
    vocabulary and correct both systemically after the evidence pass.
  - Newly recorded systemic pedagogical-integrity defect: the generic counting renderer erases required
    arrangements and comparisons in `m3-math-02-a2`, `m3-math-05-a1`, `m3-math-06-a2` and
    `m3-math-07-a2`. Do not change approved data or success behavior until a bounded decision is recorded.
  - Confirmed sorting-feedback defect: `m3-math-03-a2` uses fixed shape labels, accepts mismatches and praises
    completion. Decide whether the intended model is open unlabelled sorting or checked labelled groups.
  - Confirmed renderer/semantics defects: `m3-math-08-a1` omits the comparison model;
    `m3-math-08-a2` converts room observation into a graded fixed choice; `m3-math-10-a1` counts 1–20
    instead of 10–20. Its phone layout also separates early taps from visible progress by two screens.
  - The later count activities extend the same generic-renderer defect: hidden complements, two real
    collections, model piles and number strips are replaced by one undifferentiated dot grid.
  - New word-card defect: `m3-lang-13-a2` teaches five market words but links only four images, so
    « la monnaie » appears as an empty picture card. The rain/counting-rhyme pairing and the single
    displayed new rhyme match their approved guides and are recorded as `NO_CHANGE`.
  - New drawing-model defect: `m3-math-18-a2` asks for a square-and-triangle house but shows four
    isolated shapes with no house composition. Animal comparison and real-object face matching also
    become graded fixed choices, extending the existing renderer-semantics defect.
  - `histoire-malo` and text-only later story pages are `NO_CHANGE`: the approved one-picture asset
    intentionally shows the ending, and the illustration guide specifies one picture per story.
  - Final scroll finding: `m3-math-19-a1` is approved for 1–30 but stops and praises at 20. Later
    reconstruction and number-strip tasks also collapse into the known generic dot grid. The single
    printed favourite-rhyme fallback matches explicit approved parent guidance and is `NO_CHANGE`.
  - Initial sheets 021–025 add a genuine off-screen handoff defect: real-world `look-and-name`
    activities with no media show only a small focus line and omit the existing « Posez l’écran » cue.
    Hands-on thumbnails that omit the requested quantity or container are a high-value systemic improvement,
    not a content rewrite. All one hundred panels fit without clipping or unreachable controls.
  - Initial sheets 026–030 add one content/payload completeness defect: `m3-lang-12-a2` asks to sort
    words but supplies no word list, examples, media or pairs. The existing media-free handoff and triangle-
    without-a-group defects recur. Automatic approval review rejected the bounded Claude invocation before
    transmission despite the attached standing authorization; Astra completed all one hundred panels locally.
  - Initial sheets 031–035 add no new defect class. The existing media-free off-screen handoff, generic
    counter, real-world-observation-as-fixed-choice and incomplete hands-on reference findings recur. All one
    hundred panels remain free of new clipping, overlap, broken media or unreachable return controls.
  - Initial sheets 036–038 add no new defect class. The already-classified empty sentence-stem cards,
    generic counter semantics, open-sorting feedback and incomplete physical-setup thumbnails recur. All
    fifty-eight panels fit, and the large-phone initial set is now complete.
  - Initial sheets 039–043 add no new defect class. Finger-to-dot substitution, line-arrangement loss,
    hands-on thumbnail ambiguity and an open animal prompt converted to a fixed choice recur. All sixty
    panels remain free of new clipping, overlap, broken media or unreachable return controls.
  - Initial sheets 044–048 add no new defect class. Two-set and circle arrangement loss, the missing
    comparison model, fixed-choice conversion and an incomplete box/setup thumbnail recur. All sixty panels
    remain free of new clipping, overlap or broken media; landscape word-card continuation is scroll-covered.
  - Initial sheets 049–053 were reviewed by Claude Max/Opus and independently checked by Astra. Generic
    counter semantics and an incomplete twelve-object thumbnail recur. Claude's proposed new landscape
    reachability defect was rejected because the control is below the initial viewport but reachable in the
    completed full-scroll evidence. All sixty panels add no new defect class.
  - Initial sheets 054–058 were reviewed by Claude Max/Opus and independently checked by Astra. Claude's
    proposed new findings were rejected or deduplicated: the rain/counting-rhyme pairing is explicitly
    approved, missing sort words and market media are already classified, punctuation wraps are polish, the
    articulated figure still satisfies the arms-bent instruction, and landscape controls are scroll-reachable.
    Counter, movement, handoff and setup-thumbnail findings recur; no new defect class was added.
  - Initial sheets 059–064 were reviewed by Claude Max/Opus and independently checked by Astra. Generic
    counter, fixed-choice and movement findings recur. Claude's punctuation-wrap suggestion remains optional
    polish; claims of missing media, models and setup thumbnails were rejected where the approved activity is
    intentionally oral, off-screen, open drawing or text-only. The six-word rhyme screen is an approved
    off-screen word bank whose spoken comparison order is supplied by the adult guide, so no pair-grouping
    defect was created. All seventy-two panels add no new defect class.
  - Initial sheets 065–070 were reviewed by Claude Max/Opus and independently checked by Astra. Generic
    counter, fixed-choice, movement and incomplete-reference findings recur. The visible guillemet line breaks
    are genuine typography polish already seen in earlier batches; all affected content and controls remain
    scroll-reachable, so no new defect class was added. Off-screen, story, drawing and oral screens otherwise
    match their approved activity modes. All seventy-two panels were reviewed.
  - Initial sheets 071–076 were reviewed by Claude Max/Opus and independently checked by Astra. Generic
    counter, movement and incomplete-reference findings recur. The proposed sound-game omission was rejected
    because the screen already has the off-screen banner; the body-observation screen extends the existing
    missing-handoff class; and the printed favourite rhyme is an explicitly approved fallback. All sixty-six
    panels were reviewed and add no new defect class.
- **Next review entry:** none. Generated child evidence and the parent/whole-product journey are complete.

## VIS-FIX-02 — whole-product and systemic visual corrections (2026-09-26, Astra supervisor)

- **Evidence:** `scripts/astra-product-ux-audit.mjs` captured 14 product states at 390×844, 768×1024,
  1440×900 and 1920×1080: 56 full-page captures, zero horizontal overflow and zero broken images.
  Captures are local and ignored under `private/astra-product-ux-audit/`; the reusable deterministic script
  is tracked. The first standalone attempt mixed stale static chunks and was discarded. The accepted capture
  set came from the correctly styled local runtime on port 3002.
- **Claude review:** an isolated package contained only four labelled product contact sheets and the bounded
  audit prompt. Claude Max/Opus identified hidden safety notes, misleading zero-progress stop copy and an
  inconsistent completion priority; Astra independently accepted those three. Astra rejected a contrast claim
  after calculating approximately 4.72:1, retained the intentionally transparent Markdown observation preview,
  and classified calendar density, in-session next-session navigation and home-card polish as optional.
- **Parent-flow corrections:** safety notes are visible in the short preparation list; an early stop before the
  first activity no longer says « 0 activité de faite »; normal completion makes the observation/report step the
  primary action and the calendar secondary.
- **Renderer corrections:** generic choice copy is grammatical for shapes and vocabulary; retry copy no longer
  assumes a shape; media-free real-world observation gets the existing « Posez l’écran » handoff; text-only
  vocabulary no longer looks like missing media; long child counts keep progress/reset visible; and placed sort
  tokens remain identifiable on phone and TV.
- **Independent visual checks:** phone/TV text-only cards, handoff, sticky count and placed-token states were
  captured and inspected. The post-fix 56-state product capture repeated with zero overflow/broken images.
- **Illustration reconciliation:** `docs/ILLUSTRATION_STYLE_GUIDE.md` remains the governing system. The older
  23 KEEP / 10 REFINE / 16 REDRAW list was a baseline recommendation that the subsequent final QA superseded.
  `docs/work/SEPTEMBER_VISUAL_QA.md` records 35 accepted, 11 refined and 3 redrawn assets, 0 remaining changes,
  176/176 approvals and a frozen registry. No asset byte, registry entry or approval was changed here.
- **Audio reconciliation:** zero recordings remains intentional. The human-recording-only architecture is ready;
  no synthetic voice, paid service or placeholder recording was introduced.
- **Deferred by pedagogy/approval gate:** counting structures and ranges, fixed-choice conversion, matching and
  drawing models, sorting semantics/items, movement steps, triangle grouping and the missing « la monnaie »
  representation. These are genuine findings, but an automatic visual patch would change approved teaching
  intent or frozen media.

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

- Run and record the final local validation set for VIS-FIX-02.
- Obtain the owner's pedagogical direction before changing the remaining approved activity semantics or adding
  the missing market representation; any accepted content/media correction must lapse and reconfirm the exact
  affected approvals.
- Keep the completed audit local. PR, staging and production remain withheld by the owner.

UI follow-up implemented: five-choice TV grid uses one row on wide child screens; feedback grows to 30px. Nine layout E2E tests pass against the local Webpack dev preview on port 3002; 397 unit tests and changed-file lint pass. Five-word and eight-shape retry/reveal/success captures keep parent-return bottom at 1056px in a 1080px viewport. Manually inspected both reveal captures. Evidence: `private/astra-visual-evidence/five-choice-fix/`.

Standard Turbopack build remains blocked by process port-binding EPERM. The Webpack production build now PASSES: moved the existing health helper out of the route module into `lib/health.ts`, preserving behavior and tests. Fresh typecheck, three health tests and changed-file ESLint pass. Log: `/tmp/teka-astra-health-webpack.log`. Standalone build started locally on port 3003. Container/bundle verification remains stale for these changes; the fresh production browser suite below supersedes the earlier development-only results.

Full-scroll interaction capture is now complete on the local production build: 88 session files, 1,606 states, 497 states requiring scroll (all phone), 1,042 extra overlapping scroll images; zero horizontal overflow, broken images, missing files or unreachable return controls. See `docs/review/media/astra-interaction-scroll-evidence.json`. Only six sample scroll images manually inspected: complete scroll visual review remains pending. Resetting a long count kept the phone at the bottom, leaving the instruction offscreen; fixed locally by VIS-FIX-01 (browser check pending).

Fresh verification: Webpack production build, typecheck, full format/lint, 397 unit tests, 40 production-build E2E (9 production-only skipped), content validation (31 JSON) and approval dry-run (0 lapses) pass. Standard Turbopack build remains affected by local EPERM; container and sentinel-bundle checks remain stale. Approval service briefly failed due to usage limits; normal approved retries succeeded after its stated reset time. No ongoing approval-service blocker.

Exact next work: run final validation and checkpoint the records. Do not rerun the completed evidence review.
The post-fix product captures live locally under `private/astra-product-ux-audit/`. Commit locally only; no
push/PR/staging/production.

## Validation State

| Check                                                                          | Result | At                                                                                  |
| ------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------- |
| format                                                                         | PASS   | full repository after final checkpoint edits                                        |
| lint                                                                           | PASS   | full repository after VIS-FIX-02                                                    |
| typecheck                                                                      | PASS   | generated route types plus TypeScript                                               |
| unit tests                                                                     | PASS   | 401/401 after VIS-FIX-02                                                            |
| content validation/media fingerprints/lesson digests/review history/curriculum | PASS   | 31 JSON files; no content/media/approval diff                                       |
| database tests/pgTAP/RLS                                                       | PASS   | 152 assertions, local migration 42                                                  |
| build                                                                          | PASS   | final Webpack production build with three CI fake sentinels                         |
| E2E/responsive/reduced-motion                                                  | PASS   | 41 passed, 9 public-production tests skipped; 56 product captures, 0 overflow       |
| Docker portable/Vercel/smoke                                                   | STALE  | no container or deployment artifact changed; prior release check retained           |
| client-bundle secret scan                                                      | PASS   | 28 files, all 3 CI sentinels absent                                                 |
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
The remaining implementation work changes approved pedagogy or frozen media and needs the owner's bounded
direction plus the existing lapse/reconfirmation process. The visual/UX audit itself is complete.

## User Decisions Needed

Decide whether to authorize a bounded pedagogical correction and reconfirmation batch for the remaining
correctness findings listed in the supervisor handoff. Continue to keep the review local: no push, PR or staging.

## Exact Resume Point

1. The audit is complete: 165 scroll sheets, 266 initial sheets and 56 product captures are reviewed.
2. Preserve VIS-FIX-01 and VIS-FIX-02. All final local checks pass; do not repeat them unless code changes.
3. If the owner authorizes the pedagogical batch, define the intended behavior for each gated finding,
   implement only that scope, lapse only affected approvals and generate independent reconfirmation material.
4. Keep all work local. Never self-approve or copy approval digests; no push, PR, staging or production.

## Resume Verification

```sh
git status --short --branch
git log -5 --oneline
cat docs/work/ACTIVE_TASK.md
npm run content:validate
npm run media:report
```

Local follow-up browser suite: 40 E2E passed, 9 production-only tests skipped, against the Webpack development preview (`/tmp/teka-astra-five-choice-all-e2e.log`). This does not replace production-build/container validation.
