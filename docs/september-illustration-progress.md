# September visual upgrade — progress log

Running log, newest entry last. Each entry says what was completed, what remains, what changed
on disk, and whether the checks passed. The exact resume point is in
[`work/ACTIVE_TASK.md`](work/ACTIVE_TASK.md); the counts are in
[`september-illustration-audit.md`](september-illustration-audit.md) (generated).

## Child-facing wording changes

Every change to an approved child-facing sentence is listed here and in the state file
(`decisions.progress.wordingChanges`). None so far.

## Log

### 2026-09-22 — B0 tracking system (done, `6d04196`)

**Completed**

- Previous task archived (`docs/work/archive/2026-09-beta-0-1-release.md`); new checkpoint.
- `docs/september-illustration-state.json`: verdict, priority and reason for all 49 assets;
  UX, motion and audio rules per renderer family; the six batches.
- `lib/content/visual-audit.ts` + `scripts/visual-audit.ts` (`npm run visual:audit`): the audit
  is generated from the content and the state file — 176 lessons, 302 activities, every one on
  its instructional day with its route.
- `tests/unit/visual-audit.test.ts`: freshness of the audit and of the derived state, full
  coverage, no verdict on an unknown asset, audio required nowhere.
- This plan, this log, the open items.

**Audit result** — 49 assets: keep 8 (the shapes), refine 18 (objects, the plant, the jointed
figure), redraw 23 (body parts, animals, stories, rhymes). 41 pictures to change. 48 activities
where a human recording is recommended, 29 where narration is optional, 0 where audio is
required. Motion is planned on the families that render 176 activities.

**Remains** — B1 to QA, as in the plan.

### 2026-09-22 — B1 UX frame, motion and audio plumbing (done)

**Completed** — no content change; every approval intact.

- **The stage.** Every picture sits on a tinted rounded panel (`.teka-stage`, token `--stage`):
  one large stage for a story picture or the thing to look at, one small stage per word card,
  counter or choice. Cards no longer read as empty.
- **Word cards**: stage, word in a larger weight, « Écouter : le mot » beside it when a recording
  exists (none does). The naming game is unchanged.
- **Rhymes**: larger lines with wide leading, arriving in sequence once; **stories**: three lines
  a page, the page rises once on turn; « Écouter la comptine » / « Écouter l'histoire » when a
  recording exists.
- **Off-screen frame**: soft filled panel instead of the dashed outline; the label says « Regardez
  l'image ensemble » only when there is a picture, and « Posez l'écran » otherwise — the dashed
  frame around movement steps used to say "look at the image" with no image.
- **The child's screen**: pictures and tiles grow one step (`ChildViewContext`), the counting row
  and count are centred, the choice tiles are taller.
- **Motion**: staggered entrances on cards, lines, steps, counters and choices (`teka-stagger`,
  a delayed `teka-rise`, capped at 600 ms) and the page turn. Still four keyframes; all off under
  `prefers-reduced-motion` (E2E proves it).
- **Audio plumbing**: `pronunciationFor(word, assets)` matches a `pronunciation` asset by its
  transcript, so a recorded word lights up on every card that teaches it with no change to the
  approved content; the session view resolves it per taught word.
- **Docs**: ADR-048 (a redraw lapses approvals and is reconfirmed), the recording brief for both
  classes in `AUDIO_GUIDELINES.md`, the screen patterns in `PARENT_SESSION.md`, the style
  pointer in `MEDIA_ARCHITECTURE.md`.
- **Tests**: 9 renderer tests (stage, no control without a recording, no autoplay, child-view
  sizes, rhyme lines, page turn, off-screen label), 3 pronunciation-lookup tests.

**Visual QA** — 66 screenshots (11 activities × 3 widths × parent and child views) in the
session scratchpad, not committed. Findings: the frame is right at 390, 820 and 1280 px; the
remaining weakness is the drawings themselves, which is B2–B4 — the Kumu and cailloux pictures
use only half their canvas, the hands and body parts read as icons.

**Checks** — format, lint, typecheck, unit (374), content validation, build, E2E (30 passed,
9 skipped: the production-public suite) all PASS on the working tree before commit.

**Remains** — B2 (1ère set), B3 (3ème set), B4 (objects, contact sheet, reconfirmation, lapses,
migration), QA of the redraws.
