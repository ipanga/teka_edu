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

Phase 3B is complete and merged. No new task has been started.

## Status

`planned`

## Branch

`develop` — no feature branch open.

## Base Branch

`develop`

## Started

—

## Last Checkpoint

2026-09-12 — reset after PR #24 merged as `0d12f20` and verified on staging.

## Scope

To be filled in when the next task begins.

## Out of Scope

- **October content authoring**, and 1ère/2ème maternelle content, until September has been
  reviewed by a person who teaches this age (ISSUE-017).
- Approving any lesson. All 88 stay in `review`; usability testing is not pedagogical approval.
- Production, `main`, paid services.

## Product Decisions

- Parent-led after-school digital répétiteur; 30–45 minutes a day (ADR-039).
- French Cycle 1 is the curriculum; the PNEM is a compatibility reference (ADR-037).
- The year's pacing is authored before a month's lessons (ADR-040).
- Media is SVG in the repository, named by stable id, costing nothing (ADR-042).
- Long tasks are resumable from the repository (ADR-041).

## Completed

- [x] Phase 3A — September programme and the parent session (archived)
- [x] Session duration policy and the resumable-work protocol (archived)
- [x] Phase 3B — September experience, visuals and interaction (archived)

## In Progress

- [ ] Nothing.

## Remaining

1. Awaiting the owner's choice of next task.

## Validation State

From Phase 3B, at `0d12f20` on `develop`. Current until something changes.

| Check              | Result | At                                      |
| ------------------ | ------ | --------------------------------------- |
| format             | PASS   | `0d12f20`                               |
| lint               | PASS   | `0d12f20` — 0 warnings                  |
| typecheck          | PASS   | `0d12f20`                               |
| unit tests         | PASS   | `0d12f20` — 206 tests                   |
| content validation | PASS   | `0d12f20` — 21 files                    |
| database tests     | PASS   | `0d12f20` — 144 pgTAP assertions        |
| build              | PASS   | `0d12f20`                               |
| E2E                | PASS   | `0d12f20` — 17 tests, local and staging |
| Docker             | PASS   | CI at `0d12f20` — both images           |
| secret scans       | PASS   | `0d12f20` — no leaks, 0 tracked `.env*` |
| staging            | PASS   | `0d12f20` deployed and verified         |

## Database State

- Local: 10 migrations; `db reset` + pgTAP pass.
- DEV: 10 migrations, local and remote identical; 36 tables, 22 media assets, 0 approved lessons;
  advisors clean.
- PROD: untouched.

## Deployment State

- Staging: enabled; last deployment `0d12f20`, verified.
- Production: disabled. No production token, no `PRODUCTION_DEPLOY_ENABLED`; `main` at `1b95480`.

## Git State

- `develop` at `0d12f20` plus this closing change. No feature branch, no open PR once merged.

## Blockers

None.

## User Decisions Needed

- Which task comes next. The recommendation is to run one real September session with a child,
  using `/seance/<n>/observation` to record it, before deciding between more media, October
  authoring, or acting on teacher review.

## Exact Resume Point

No task is in progress. When the next one starts: fill this file in, create the feature branch
from `develop`, commit an initial checkpoint, and open a Draft PR before the long work begins.

## Resume Verification

1. `git branch --show-current` is `develop` and `git status --short` is empty;
2. `git log -n 5 --oneline` starts at the Phase 3B merge or later;
3. `gh pr list --state open` is empty;
4. `npx supabase migration list --linked` if the new task touches the database;
5. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
