# September visual upgrade — progress log

Running log, newest entry last. Each entry says what was completed, what remains, what changed
on disk, and whether the checks passed. The exact resume point is in
[`work/ACTIVE_TASK.md`](work/ACTIVE_TASK.md); the counts are in
[`september-illustration-audit.md`](september-illustration-audit.md) (generated).

## Child-facing wording changes

Every change to an approved child-facing sentence is listed here and in the state file
(`decisions.progress.wordingChanges`). None so far.

## Log

### 2026-09-22 — B0 tracking system (in progress)

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
