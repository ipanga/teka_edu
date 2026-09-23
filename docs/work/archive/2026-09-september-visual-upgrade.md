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

`completed`

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

2026-09-23 — **All batches done (B0–B4, QA).** Two draft PRs: #79 (UX, motion, audio plumbing;
no content change) and #80 (41 pictures, 80 lapses recorded, two visual reconfirmation packages,
data migration). Awaiting the owner's visual reconfirmation review.

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

- [x] B0 — tracking system, audit generator, plan (`6d04196`).
- [x] B1 — UX frame, motion, audio plumbing, ADR-048 (`9b8d6ff`, PR #79).
- [x] B2 — the 1ère set, 16 pictures; lapses recorded; 1ère reviews transcribed (PR #80).
- [x] B3 — the 3ème set, 14 pictures (`8f7d0ff`).
- [x] B4 — 11 objects; `review:visual` packages; sheet; migration
      `20260922220249_september_visual_upgrade`; 152 pgTAP PASS.
- [x] QA — build, 66 screenshots, E2E 30, media report 0 gaps.

## In Progress

None.

## Remaining

- [ ] Owner: merge #79; submit the two reconfirmation packages; record `full-review accepted`
      per week; `scripts/approve-week.ts` × 10; regenerate packages and a data migration; merge
      #80 (before or after — the runtime does not gate on status).
- [ ] Owner: decide who records the audio (OI-002).

## Validation State

| Check              | Result | At                                |
| ------------------ | ------ | --------------------------------- |
| format             | PASS   | working tree, B4 + QA             |
| lint               | PASS   | working tree, B4 + QA             |
| typecheck          | PASS   | working tree, B4 + QA             |
| unit tests         | PASS   | working tree, B4 + QA — 374       |
| content validation | PASS   | working tree, B4 + QA — 31 files  |
| database tests     | PASS   | local `db reset` — 152 assertions |
| build              | PASS   | working tree, B4                  |
| E2E                | PASS   | working tree, B4 — 30 (9 skipped) |
| Docker             | N/A    | no Dockerfile change              |
| secret scans       | N/A    | no secret touched; gitleaks in CI |

## Database State

- Local: 42 migrations, `db reset` + 152 pgTAP assertions PASS.
- DEV / PROD: 41 applied. Migration `20260922220249_september_visual_upgrade.sql` (registry
  hashes and alts, lesson statuses and review blocks, review history) is applied to DEV by the
  staging deploy when #80 merges; PROD at the next promotion.

## Deployment State

- Production: LIVE, `a729722`, untouched. Staging: `develop`, untouched.

## Git State

- `feat/september-visual-ux` (PR #79, draft): `6d04196`, `9b8d6ff`.
- `feat/september-illustrations` (PR #80, draft, base #79): B2, `8f7d0ff`, B4 committed next.

## Blockers

None.

## User Decisions Needed

- OI-001: submit the visual reconfirmation packages and decide the merge order.
- OI-002: who records the pronunciation audio.

## Exact Resume Point

Nothing is in progress. If the reviewer returns `accepted-with-modifications` naming a picture:
redraw it in `tools/media/build.ts`, `npx tsx tools/media/build.ts`, `npm run review:visual`,
`npm run review:package`, `npm run db:reference -- --new-migration <name>`, `npm run visual:audit`,
commit on `feat/september-illustrations`. If `accepted`: follow OI-001 in
`docs/september-illustration-open-items.md`.

## Resume Verification

1. `git branch --show-current` — `feat/september-visual-ux` or `feat/september-illustrations`;
2. `git status --short` — read uncommitted work before discarding it;
3. `git log -n 5 --oneline`;
4. `npm run visual:audit` — the audit must regenerate without a diff, or the state file is stale;
5. `docs/september-illustration-progress.md` — the last entry names the batch in progress.
