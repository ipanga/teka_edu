# Mandatory parent/child P1 UX gate

Date: 2026-10-03. Scope: five demonstrated P1 defects only.

## Frozen precondition

October branch/local/remote were clean and identical at
`2170413173b4a7aa2e6e8b2245af0fcf4c52b0bc`. Corrected implementation:
`461e946e3ef4d7a63909bd1e720d5876dd568bf4`. The owner supplied the fresh independent
`accepted` verdict. No pedagogical self-approval or canonical review change occurs here.
Accepted implementation and checkpoint have identical canonical content/media trees; the
checkpoint adds reconfirmation evidence. Day 30 remains intentionally deferred.

UX branch: `codex/parent-child-ux-p1`, from fetched authoritative develop
`6b8ba9e87802d96c2f193fe73d3c9897e084ba9c`, independent of October authoring.

## Defects and resulting behavior

1. Consecutive stories previously reused a React page index (Kumu 4/4 → Pluie 4/4).
   A session-owned activity store now keys renderer fields by activity ID. New stories start
   at page one; previous/re-entry restores only that activity's state. Equal and unequal page
   counts, forward/back and re-entry are covered.
2. Day-only local-storage keys previously shared completion/bookmarks between classes.
   Version 2 keys include school year, level, day and field (progress/position/observation).
   Invalid/out-of-range bookmarks are ignored. Ambiguous legacy keys are retained, ignored
   and never assigned to a guessed class. Storage failure never interrupts a lesson.
3. The latest September session was advertised as today's lesson in October.
   `isCurrentSession` is true only for an authored session on the actual Lubumbashi date.
   Fallback UI says “Séances disponibles” and displays its actual date. Unit tests cover
   authored today, missing teaching-day content, weekend, before first and after latest.
4. Renderer unmounts during child handoff/pause discarded page/game state.
   Session ownership preserves page, game target, retry/success feedback, selected matching
   item and placement, counting and word-game mode across handoff and in-session pause.
   A full reload restores the activity bookmark; detailed game/page state is in-memory.
   Audio transport remains local because an unmounted player cannot keep playing.
5. Advancing on a phone retained a scroll position below the new heading.
   Activity changes focus the instruction heading and immediately scroll it into view.
   No animated scroll is used, including reduced motion; same-activity interactions do not
   invoke the navigation scroll. All eight viewport checks assert heading focus and visible
   instruction, plus absence of horizontal overflow.

## Validation before PR

Format, lint, typecheck: PASS. Unit: 467/467 in 36 files. Targeted P1 storage/date/component
tests are included. Content: 31 valid JSON files. Approval-lapse dry run: zero lapses.
Production webpack build: PASS. Client-bundle sentinel scan: 28 files, all three server-only
sentinels absent. Webpack avoids the local sandbox's Turbopack port restriction; CI runs the
standard build. Browser tests needed approved localhost access after sandbox EPERM.

Full local Playwright: 79 passed, zero failed, nine production-public tests skipped because
the target is localhost. Existing media-order/layout tests remain intact. The former blanket
“today” assertions now verify the exact offered session date and whether it really is today.

| Device           | Viewport | P1 journey |
| ---------------- | -------- | ---------- |
| Phone            | 320×740  | PASS       |
| Phone            | 360×800  | PASS       |
| Phone            | 390×844  | PASS       |
| Phone            | 430×932  | PASS       |
| Tablet portrait  | 768×1024 | PASS       |
| Tablet landscape | 1024×768 | PASS       |
| Laptop           | 1280×900 | PASS       |
| MacBook          | 1440×900 | PASS       |

Fresh-parent manual checkpoint (390×844, local production build): home → 3ème → offered
September 30 catch-up lesson → preparation → start → child → parent → next → pause → same
activity resume → finish → calendar. 3ème day 22 showed completed; switching through home to
1ère calendar showed the same day without completion. Offered date was truthful on Saturday
October 3. Separate calendar navigation to 3ème day 3 confirmed Kumu page 2 in child mode,
return to parent, Kumu page 4, then Pluie page 1 with focused visible heading. The automated
eight-size journeys additionally cover game retry/success, reload/bookmark resume, previous
story navigation and complete return to class. No real child data was entered.

## Integrity and boundaries

All 375 tracked files under `content`, `public/media`, `docs/review`, `supabase`, `lib/content`
are byte-identical to the exact UX base. Sorted path/NUL/SHA-256 binary-digest aggregate:
`93fd2e4ed06f0cef2fe1b67834d1e7c12a1413e2b720724a6fab22a64df0c5c8`.
Frozen October remote remains `2170413`. No accepted file changed; no new dependency.

Latest successful develop staging run `37057383122` used exact base `6b8ba9e` and reported
“Remote database is up to date” in both dry run and apply steps. This UX branch has no
migration/reference-data delta. Required CI/merge eligibility and the enabled staging
workflow's DEV no-op outcome must be verified at integration. No DEV/PROD mutation or
production deployment is authorized. No workflow or repository variable has been changed.

PR: [#94](https://github.com/ipanga/teka_edu/pull/94), open into develop. Implementation checkpoint:
`0a177296680d6e62c8dc856903f67fdf2adb7af5`. Local/remote clean after push. Required CI is in
progress; no merge yet. New develop SHA, October reconciliation and post-integration checks: pending.

## October reconciliation verification

PR #94 passed all four required checks at exact head `438e33a51ba22520864d2217740d8f8e527bc7bb`;
CI run `37097878407`. Develop squash commit: `603efdc14de535ea78f9dbe4488ff3e49ccc5186`.
Ruleset requires up-to-date head, four checks, zero approving reviews; GitHub reported CLEAN.
Non-destructive `--no-ff` October merge retains accepted checkpoint history. Shared runtime and
tests merged cleanly; PROJECT_STATUS and ACTIVE_TASK conflicted and were resolved semantically.

Combined branch verification: format/lint/typecheck; 482/482 unit tests in 37 files; 31 valid
content files; zero approval lapses; production webpack build; 28 client files free of three
server sentinels; full Playwright 79 passed, nine production-only skips, all eight P1 sizes.
Two September-era E2E assumptions were updated without dropping their guarantees: count exactly
22 actual September links rather than the global total; test deferred day 30 for 404 rather than
now-authored day 23. No calendar data or layout was changed to accommodate the tests.

Accepted evidence comparison: all 385 protected frozen files byte-identical to `2170413`;
aggregate `aea17a36e07241a7e6e61b1df7eb5779ef6f7770dd2adfb69072eab97c5195fe`.
This preserves all seven accepted pedagogical corrections and their source identifiers.
All 12 complete saved package strings exactly equal canonical regeneration; Week 6/7 hashes
remain `079119d010d22e35d0f2fc5279613ac98d6fde8642e869940ca6bf3e0a81a422` and
`7b786f7c74a14ed5465b865390bbfb556e276252dd69721b8673eb8aedcdfbaf`.
Three plant SVG hashes match the registry and accepted correction checkpoint. All 28 lessons
remain review/null. Programme report: days 23–29 complete at 35 minutes, day 30 no-content.
Coverage: 42/42 due objectives taught; required images: 43/43, no gaps. No rich generation.

Compared separately to production `ac3ebf9`, all 176 September lesson objects including
approval/digest/media associations, 51 original media rows, 98 media file bytes, calendars,
teaching texts and review-history bytes are unchanged. No independent reconfirmation is needed
because accepted pedagogical evidence did not change; this is integrity verification, not a
new pedagogical verdict or canonical approval.

Merged develop staging run `37098065260` has passed CI and migration steps and is deploying
preview; full no-op log and final smoke verification remain pending. Reconciliation commit/push
and final durable completion checkpoint remain pending.

## Deferred findings and stop boundary

Retain P2/P3 separately: compact mobile home; parent-guidance hierarchy; completion feedback;
general navigation labels; visual/card redesign; broader touch-target work. Child return on
a tall phone story may require scrolling. No TV/Smart TV support or tests.

Only after green PR integration and non-destructive October reconciliation may the frozen
Batch 1 content/media/packages and all seven corrections be reverified. Then prepare the
Weeks 3–5 prompt and stop. Do not begin Day 30 or new October authoring in this task.
