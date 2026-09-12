# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.

  When a task starts: fill this in before the first substantial edit, and create the branch.
  When a task ends: mark it `completed`, copy it to docs/work/archive/<YYYY-MM>-<task>.md,
  then reset this file to the shape below.
-->

## Task

None in progress.

## Objective

The last task — the session duration policy and the resumable-work protocol — is complete and
merged. No new task has been started.

## Status

`planned`

## Branch

`develop` — no feature branch open.

## Base Branch

`develop`

## Started

—

## Last Checkpoint

2026-09-12 — reset after PR #22 merged as `d2fb411`.

## Scope

To be filled in when the next task begins.

## Out of Scope

- **October content authoring.** Not started, and should wait until September has been reviewed
  by a person who teaches this age (ISSUE-017).
- Approving any lesson. All 88 stay in `review` until a named human reviewer approves them.
- Production, `main`, paid services.

## Product Decisions

- Teka Edu is a parent-led after-school reinforcement platform; a session is **30–45 minutes**,
  about 35 (ADR-039).
- French Cycle 1 is the curriculum; the DRC PNEM is a compatibility and enrichment reference
  (ADR-037).
- Long tasks are resumable from the repository, never from chat memory (ADR-041).

## Completed

- [x] Phase 3A — September programme and the parent session (archived)
- [x] Session duration policy and the resumable-work protocol (archived)

## In Progress

- [ ] Nothing.

## Remaining

1. Awaiting the owner's choice of next task.

## Validation State

Results below are from the last completed task, at `d2e5105` / CI `36564cd`. They describe
`develop` at `d2fb411` and remain current until something changes.

| Check              | Result | At                                           |
| ------------------ | ------ | -------------------------------------------- |
| format             | PASS   | `d2e5105`                                    |
| lint               | PASS   | `d2e5105` — 0 warnings                       |
| typecheck          | PASS   | `d2e5105`                                    |
| unit tests         | PASS   | `d2e5105` — 196 tests                        |
| content validation | PASS   | `d2e5105` — 20 files                         |
| database tests     | PASS   | `d2e5105` — 138 pgTAP assertions             |
| build              | PASS   | `d2e5105`                                    |
| E2E                | PASS   | `d2e5105` — 12 tests                         |
| Docker             | PASS   | CI at `36564cd` — both images                |
| secret scans       | PASS   | `d2e5105` — no leaks, 0 tracked `.env*`      |
| staging            | PASS   | `0ea23a2` — last application change deployed |

## Database State

- Local: 8 migrations applied; `db reset` + pgTAP pass.
- DEV: 8 migrations applied; local and remote lists identical as of 2026-09-12.
- PROD: untouched.

## Deployment State

- Staging: enabled. Last application deployment `0ea23a2`; the commits since are documentation
  and tests only.
- Production: disabled. No production token, no `PRODUCTION_DEPLOY_ENABLED`, `main` at `1b95480`.

## Git State

- `develop` at `d2fb411`. No feature branch, no open PR, no uncommitted work.

## Blockers

None.

## User Decisions Needed

- Which task comes next. The recommendation is to review the real September parent experience —
  a teacher reading the weekly packages, and one real 30-to-45-minute session with a child —
  before October is authored.

## Exact Resume Point

No task is in progress. When the next one starts: fill this file in, create the feature branch
from `develop`, commit an initial checkpoint, and open a Draft PR before the long work begins.

## Resume Verification

Before starting anything, check:

1. `git branch --show-current` is `develop` and `git status --short` is empty;
2. `git log -n 5 --oneline` starts at `d2fb411`;
3. `gh pr list --state open` is empty, so no earlier task is still waiting on CI;
4. `npx supabase migration list --linked` if the new task touches the database;
5. `gh run list --branch develop --limit 3` if it depends on a deployment.
