# Session duration policy and the resumable-work protocol

Archived 2026-09-12. The first task run under the resumable-work protocol it introduced.

## Task

Session duration policy (30–45 min) and the resumable-work protocol.

## Objective

The daily session range is 30–45 minutes everywhere the product states a requirement, with no
contradiction between documentation, validator, tests and UI; and the repository carries a
durable checkpoint mechanism so that a long task survives a context reset, a crash or a closed
terminal.

## Status

`completed`

## Branch

`chore/resumable-workflow-and-session-duration`

## Base Branch

`develop`

## Started

2026-09-12

## Last Checkpoint

2026-09-12 — PR #22 merged into `develop` as `d2fb411`; all four required CI checks passed.

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
- [x] Added `SESSION_MINUTES_POLICY` + `durationPolicy`, checked in `checkProgramme`
- [x] `CLAUDE.md`: permanent resumable-work instruction, documentation-index rows, duration wording
- [x] Phase 3A archived to `docs/work/archive/2026-09-phase-3a.md`
- [x] ADR-041 (resumable work); `docs/RESUMABLE_WORKFLOW.md`
- [x] `tests/unit/active-task.test.ts` (10 tests) and four session-policy tests: **196 unit tests pass**
- [x] Checkpoint commit `5c75438` pushed; **Draft PR #22** opened

## In Progress

- [ ] Nothing. The task is finished.

## Remaining

1. Nothing remaining.

## Validation State

| Check              | Result | At                                      |
| ------------------ | ------ | --------------------------------------- |
| format             | PASS   | `d2e5105`                               |
| lint               | PASS   | `d2e5105` — 0 warnings                  |
| typecheck          | PASS   | `d2e5105`                               |
| unit tests         | PASS   | `d2e5105` — 196 tests                   |
| content validation | PASS   | `d2e5105` — 20 files                    |
| database tests     | PASS   | `d2e5105` — 138 pgTAP assertions        |
| build              | PASS   | `d2e5105`                               |
| E2E                | PASS   | `d2e5105` — 12 tests                    |
| Docker             | PASS   | CI at `36564cd` — both images           |
| secret scans       | PASS   | `d2e5105` — no leaks, 0 tracked `.env*` |
| staging            | N/A    | no application change expected          |

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
- Checkpoint commits: `5c75438`, `d2e5105`, `36564cd` — all pushed.
- PR #22 squash-merged into `develop` as `d2fb411`; branch deleted.
- No uncommitted work.

## Blockers

None.

## User Decisions Needed

None for this task.

## Exact Resume Point

Nothing. This task is complete and merged as `d2fb411`.

## Resume Verification

Before continuing, check:

1. `git branch --show-current` is `chore/resumable-workflow-and-session-duration`;
2. `git log -n 5 --oneline` against "Git State" above;
3. `git status --short` for uncommitted work, and read it before discarding anything;
4. that `docs/RESUMABLE_WORKFLOW.md` and `docs/work/archive/` exist or not, to locate the first incomplete step;
5. `npx supabase migration list --linked` only if a migration turns out to be needed;
6. `gh pr list --head chore/resumable-workflow-and-session-duration` in case a PR was opened before the interruption.
