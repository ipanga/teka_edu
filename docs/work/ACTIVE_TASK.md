# Active Task

## Task

Execute the mandatory parent/child P1 UX gate before October expansion.

## Objective

Fix only the five demonstrated P1 defects on a separate develop-based branch, validate, prepare a focused PR, integrate only if the no-DEV-mutation boundary can be respected, then reconcile October without rewriting accepted history.

## Status

`in_progress`

## Branch

`codex/parent-child-ux-p1`

## Base Branch

Fetched `origin/develop`: `6b8ba9e87802d96c2f193fe73d3c9897e084ba9c`.

## Started

2026-10-03

## Last Checkpoint

October branch and remote were clean and identical at `2170413173b4a7aa2e6e8b2245af0fcf4c52b0bc`. Accepted implementation: `461e946e3ef4d7a63909bd1e720d5876dd568bf4`. Owner relayed fresh independent `accepted` verdict; no approval record is changed. The UX branch is independent of October content.

## Scope

P1 story isolation, year/class/day bookmarks, truthful session dates, state-preserving handoff/pause, and instruction scroll/focus; regression tests, supported-device validation, fresh-parent walkthrough and durable evidence.

## Out of Scope

October days 30-44; canonical content/media/review packages/approvals; P2/P3 design; database migrations or DEV/PROD changes; production promotion/deployment.

## Product Decisions

Activity state is owned by the session and keyed by activity ID. Unattributable legacy day-only storage is retained but ignored. No backend dependency.

## Completed

Fetched authoritative refs; froze accepted October SHA/remote/clean-tree state; created requested UX branch from exact develop.

## In Progress

All five P1 fixes and regression coverage are implemented; focused PR preparation and CI remain.

## Remaining

Commit/push/PR/required CI; conditional develop integration, October reconciliation and post-integration integrity.

## Validation State

| Check                            | State                                                |
| -------------------------------- | ---------------------------------------------------- |
| format                           | PASS                                                 |
| lint                             | PASS                                                 |
| typecheck                        | PASS                                                 |
| unit tests                       | PASS: 467/467, 36 files                              |
| content validation               | PASS: 31 JSON files                                  |
| database tests                   | N/A locally; no DB changes; required CI pending      |
| build                            | PASS: production webpack build                       |
| E2E                              | PASS: 79 passed, 9 production-only skipped           |
| Docker                           | NOT RUN locally; required CI pending                 |
| secret scans                     | PASS: 28 client files; 3 server sentinels absent     |
| P1 focused unit tests            | PASS: included in full suite                         |
| supported devices / fresh-parent | PASS: all 8 exact sizes and manual 390px walkthrough |
| approval lapse                   | PASS: dry run, zero lapses                           |
| protected integrity              | PASS: 375 files byte-identical to UX base            |

## Database State

No migrations and no database operations. DEV/PROD must remain untouched.

## Deployment State

No production deployment. The develop push workflow has staging enabled and runs `supabase db push --yes`; this must be reconciled with the explicit no-DEV-mutation boundary before merge. No workflow/settings modification is authorized or performed.

## Git State

UX branch based on `6b8ba9e`; October branch remains `2170413`. Initial worktree clean. Implementation validated, uncommitted; required CI pending.

## Blockers

No implementation blocker. Enabled staging workflow includes a DEV migration step; latest successful run 37057383122 at the exact UX base reported DEV already up to date. No migration/reference-data delta exists. Required CI and merge eligibility must be checked before integration.

## User Decisions Needed

None for implementing, validating or opening the requested PR. If merge cannot respect the DEV boundary, stop at ready-to-merge and request a concrete workflow decision.

## Exact Resume Point

Commit the validated UX changes and open the focused develop PR. See PARENT_CHILD_UX_P1.md for validation and frozen-content evidence. Do not author October content.

## Resume Verification

Read CLAUDE.md and this checkpoint; verify branch, git status, fetched develop and frozen October refs. Recheck each validation after relevant edits.
