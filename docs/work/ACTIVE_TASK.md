# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.

  This task also keeps four topic files and one machine-readable state file — see the
  "Tracking files" list under Scope. This checkpoint holds the resume point; the topic files hold
  the audit, the plan, the running log and the open items.
-->

## Task

September illustration, audio, animation and UX upgrade — 1ère and 3ème maternelle.

## Objective

Every September activity a child looks at is visually polished, joyful and pedagogically clear;
audio and motion are added only where they teach; the parent's screen is calmer and clearer; and
all of it is tracked so the work survives an interruption.

## Status

`in_progress`

## Branch

`feat/september-visual-ux` (batches B0–B1: tracking, UX, motion, audio plumbing — no content
change). The illustration batches (B2–B4) go on `feat/september-illustrations`, stacked on it,
because a redrawn picture lapses the approval of every lesson that shows it (see Product
Decisions).

## Base Branch

`develop` at `087fc06`

## Started

2026-09-22

## Last Checkpoint

2026-09-22 — B0 started: previous task archived to `docs/work/archive/2026-09-beta-0-1-release.md`;
tracking system being written (state file, audit generator, plan, progress, open items).

## Scope

- Audit every September activity of both classes (302 activities, 176 lessons, 49 assets).
- Define the illustration / audio / motion / child-facing pattern system.
- Redraw or refine the assets that are weak; keep the ones that are right.
- Add audio plumbing where a recording would teach (pronunciation of taught words, rhymes) —
  **no synthetic recordings** (ADR-046, `CLAUDE.md`).
- Add motion only where it guides or delights without looping (ADR-045).
- Refine spacing, hierarchy, cards, empty states, the child's full-screen view.
- Tracking files (all in `docs/`): `september-illustration-audit.md` (generated),
  `september-illustration-upgrade-plan.md`, `september-illustration-progress.md`,
  `september-illustration-open-items.md`, `september-illustration-state.json` (decisions +
  derived state). Regenerate the audit with `npm run visual:audit`.

## Out of Scope

- Rewriting approved pedagogy. A child-facing wording change is allowed only when a picture,
  a sound or a layout needs it, and every one is listed in the progress log.
- October, 2ème maternelle, the PWA service worker, TV mode.
- Any paid service, any AI SDK, any synthetic voice for a word the child must copy.
- Merging or deploying: the owner merges.

## Product Decisions

- **A redrawn picture lapses approvals, and that is honoured, not bypassed.** `lessonDigest`
  covers the kind, description and bytes of every picture (ISSUE-026). The lessons that show a
  redrawn asset go back to `review` in the same commit that redraws it; the runtime does not
  gate on status (`isTeachable` is unused), so the live product keeps serving them. A **visual
  reconfirmation package** (Markdown + before/after contact sheet per level) is generated for the
  owner's AI-assisted review; `scripts/approve-week.ts` restores the approvals once the history
  records `accepted`. Recorded as ADR-048.
- **Audio: the parent stays the voice.** The brief asks for audio; ADR-046 forbids a synthetic
  voice for anything the child copies. So this task ships the audio decision per activity, the
  plumbing for pronunciation and rhyme recordings (a listen control that appears only when a
  recording exists), and a recording brief — and zero audio files.
- **Two branches, two PRs.** UX, motion and audio plumbing change no content and can merge at
  once; the illustration branch waits for the visual reconfirmation.

## Completed

- [x] Previous task archived; branch created from `develop` at `087fc06`.

## In Progress

- [ ] B0 — tracking system: state file, audit generator, plan, progress, open items, docs table.

## Remaining

- [ ] B1 — UX frame: picture stage, word cards, rhyme/story layout, off-screen frame, child
      screen, motion (staggered entrances, page turn), pronunciation plumbing + tests.
- [ ] B2 — illustrations, 1ère set: body parts, hands, the five 1ère rhymes and two stories.
- [ ] B3 — illustrations, 3ème set: stories, rhymes, animals, plant.
- [ ] B4 — objects refined (shade + ground), contact sheet, visual reconfirmation package,
      lapses, data migration, review packages regenerated.
- [ ] QA — screenshots at phone/tablet/desktop, reduced motion, E2E, Docker not needed.
- [ ] Final report in `docs/september-illustration-progress.md`.

## Validation State

| Check              | Result  | At                        |
| ------------------ | ------- | ------------------------- |
| format             | NOT RUN |                           |
| lint               | NOT RUN |                           |
| typecheck          | NOT RUN |                           |
| unit tests         | PASS    | `087fc06` — baseline only |
| content validation | NOT RUN |                           |
| database tests     | N/A     | no schema change in B0–B1 |
| build              | NOT RUN |                           |
| E2E                | NOT RUN |                           |
| Docker             | N/A     | no Dockerfile change      |
| secret scans       | N/A     | no secret touched         |

## Database State

- Local / DEV / PROD: 41 migrations, unchanged. B4 will add one data migration (media registry
  hashes and lesson statuses).

## Deployment State

- Production: LIVE, `a729722`, untouched. Staging: `develop`, untouched.

## Git State

- `feat/september-visual-ux` created from `develop` at `087fc06`; nothing committed yet.

## Blockers

None.

## User Decisions Needed

None to start. Two will be needed later and are listed in
`docs/september-illustration-open-items.md`: who records the pronunciation audio, and when the
visual reconfirmation package is submitted.

## Exact Resume Point

Batch B0. Write `docs/september-illustration-state.json` and `scripts/visual-audit.ts`, run
`npm run visual:audit`, then write the plan, progress and open-items documents. Next action after
B0: commit `chore: september visual upgrade — tracking system and audit`, then start B1 in
`components/session/ActivityRenderer.tsx`.

## Resume Verification

1. `git branch --show-current` — `feat/september-visual-ux` or `feat/september-illustrations`;
2. `git status --short` — read uncommitted work before discarding it;
3. `git log -n 5 --oneline`;
4. `npm run visual:audit` — the audit must regenerate without a diff, or the state file is stale;
5. `docs/september-illustration-progress.md` — the last entry names the batch in progress.
