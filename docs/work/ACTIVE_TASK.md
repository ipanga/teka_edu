# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Session duration policy (30–45 min) and the resumable-work protocol.

## Objective

The daily session range is 30–45 minutes everywhere the product states a requirement, with no
contradiction between documentation, validator, tests and UI; and the repository carries a
durable checkpoint mechanism so that a long task survives a context reset, a crash or a closed
terminal.

## Status

`in_progress`

## Branch

`chore/resumable-workflow-and-session-duration`

## Base Branch

`develop`

## Started

2026-09-12

## Last Checkpoint

2026-09-12 — duration corrections and the session-policy check are in the working tree; `docs/RESUMABLE_WORKFLOW.md` written. Not committed yet.

## Scope

- Make 30–45 minutes the stated product requirement wherever a requirement is stated.
- Enforce the range on a programme's declared `sessionMinutes`, not only on generated days.
- Add `docs/work/ACTIVE_TASK.md` (this file), `docs/RESUMABLE_WORKFLOW.md`, and an archive for
  finished tasks.
- Add a short permanent instruction to `CLAUDE.md` pointing at the protocol.
- Archive Phase 3A as the first baseline.
- Validate the checkpoint file itself, so the protocol is enforced rather than hoped for.

## Out of Scope

- **October content.** Not started, not planned here.
- Regenerating September. The 35-minute days stay exactly as they are.
- Any curriculum change, new lesson, or content edit made only because the range widened.
- Production, `main`, paid services.

## Product Decisions

- **Daily session: 30 to 45 minutes**, about 35 where the pedagogy allows. The range exists for
  flexibility: a light revision day may be 30–35, a richer story or consolidation day may
  approach 45. The system must not force every day to the same length.
- September's existing 35-minute days are valid and unchanged.
- Long tasks must be resumable from the repository alone, never from chat memory.

## Completed

- [x] Read `CLAUDE.md`, `PROJECT_STATUS.md`, git state; confirmed `develop` at `e6fcc3a`, clean tree
- [x] Audited every duration reference in tracked files
- [x] Established that the validator, content `sessionMinutes` and September tests already use 30–45
- [x] Corrected the three stale 40-minute claims (ADR-037 citation, `CONTENT_AUTHORING.md`, `DRC_CURRICULUM_COMPARISON.md`)
- [x] Marked the Phase 2.5 40-minute recommendation superseded, keeping the historical finding
- [x] Amended ADR-039: explicit 30–45 statement, flexibility rationale, the exceptional opt-out
- [x] Added `SESSION_MINUTES_POLICY` + `durationPolicy`, checked in `checkProgramme`; typecheck and content validation pass

## In Progress

- [ ] `CLAUDE.md` instruction and documentation index rows
- [ ] Phase 3A archive entry
- [ ] Structure test for this checkpoint file

## Remaining

1. Add the `CLAUDE.md` instruction and the documentation-index rows for the two new documents.
2. Archive Phase 3A to `docs/work/archive/2026-09-phase-3a.md`.
3. Add `tests/unit/active-task.test.ts` validating this file's structure and vocabulary.
4. Add ADR-041 for the resumable-work protocol.
5. Run the full check suite; commit, push, open the PR, wait for CI, squash-merge.
6. Mark this task `completed`, archive it, reset the file for the next task.

## Validation State

| Check              | Result  | At       |
| ------------------ | ------- | -------- |
| format             | NOT RUN | —        |
| lint               | NOT RUN | —        |
| typecheck          | PASS    | working tree |
| unit tests         | NOT RUN | —        |
| content validation | PASS    | working tree |
| database tests     | NOT RUN | —        |
| build              | NOT RUN | —        |
| E2E                | NOT RUN | —        |
| Docker             | NOT RUN | —        |
| secret scans       | NOT RUN | —        |
| staging            | N/A     | no application change expected |

## Database State

- Local: 8 migrations applied (`supabase db reset` last run in Phase 3A).
- DEV: 8 migrations applied, local and remote lists identical as of 2026-09-12.
- PROD: untouched, and must stay so.
- No migration is expected in this task.

## Deployment State

- Staging: enabled; last deployment `0ea23a2`, success.
- Production: disabled. No production token, no `PRODUCTION_DEPLOY_ENABLED`.

## Git State

- Branch: `chore/resumable-workflow-and-session-duration`, created from `develop` at `e6fcc3a`.
- Last checkpoint commit: none yet (about to make the first).
- Pushed: no.
- PR: none yet.
- Uncommitted work: duration corrections, the session-policy check, `docs/RESUMABLE_WORKFLOW.md`, this file.

## Blockers

None.

## User Decisions Needed

None for this task.

## Exact Resume Point

Begin at Remaining step 1: add the `CLAUDE.md` instruction and the documentation-index rows.
The duration work is done and verified in the working tree — do not redo it. If the working tree
is empty, the interruption lost it: redo Completed items 4 to 8, which are small and precisely
described above.

## Resume Verification

Before continuing, check:

1. `git branch --show-current` is `chore/resumable-workflow-and-session-duration`;
2. `git log -n 5 --oneline` against "Git State" above;
3. `git status --short` for uncommitted work, and read it before discarding anything;
4. that `docs/RESUMABLE_WORKFLOW.md` and `docs/work/archive/` exist or not, to locate the first incomplete step;
5. `npx supabase migration list --linked` only if a migration turns out to be needed;
6. `gh pr list --head chore/resumable-workflow-and-session-duration` in case a PR was opened before the interruption.
