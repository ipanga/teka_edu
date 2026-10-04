# Active Task

## Task

Live parent UX audit and flexible month/navigation implementation.

## Objective

Make Home -> Class -> Month -> Lessons -> Session discoverable without explanation.
Preserve October/September curriculum and P1 state behavior; stop at a pushed develop PR.

## Status

`awaiting_review`

## Branch

`codex/flexible-parent-navigation-ux`

## Base Branch

`origin/develop` at `ae07c243d4c1dd8ce710edf8d9c93e8582649448`.
Main remains `81b759ffe7ffb8d6bc44a6b3774dd81e4a4c7d05`.

## Started

2026-10-04

## Last Checkpoint

FINAL LOCAL 2026-10-04: implementation/fresh-parent journey complete. Format/lint/typecheck,
520/520 units, content, zero lapse, scoped 420-file freeze, all 15 package strings, Webpack
production build and three-sentinel client scan PASS. Full production-build Chromium:
96 passed, zero failed, nine production-only skipped, all eight supported sizes and P1.
Fresh-origin manual phone journey and 18 tracked before/after screenshots inspected.
PR #98 is open into develop; final-head CI must be verified before integration.
No canonical/reference/schema/workflow change, hosted write, merge or deployment.
Initial draft run 37213308072 quality/DB/Docker passed; build/E2E reproduced the old repeated-
viewport fresh-start assertion. Fixed to explicitly restart the saved activity-zero session;
full local rerun green. Assertions retained, no timeout increase.

## Scope

Home/class/month/list/session navigation, browser-local status/replay, outcome-specific labels,
eight supported sizes, tests, screenshots and durable architecture note.

## Out of Scope

Canonical wording/objectives/media/review/digests, migration/schema, hosted DEV/PROD writes,
merges, staging/production deployment, November, 2eme, unrelated P2/P3, TV/Smart TV.

## Product Decisions

See [architecture](../ux/PARENT_NAVIGATION_ARCHITECTURE.md).
Monthly list primary; calendar secondary shares derivation/status.
Only complete approved plans are discoverable. Resume > true today > latest unfinished past >
first future. Reopening complete requires explicit replay. Bookmarks remain class/year scoped.

## Completed

- PR #97 state inspected: OPEN, three checks passed, database infrastructure rate-limit failure.
- Created UX branch from fetched authoritative develop, retained verified #97 documentation.
- Live complete parent journey and screenshots/DOM at all eight requested sizes.
- Removed fixed September class link/calendar filter, added derived monthly browsing.
- Preparation/completion retain month context; resume/replay guarded; P1 ownership retained.
- 420 protected files byte-identical to integrated October, all 15 packages fresh.
- Archived complete production checkpoint without discarding its evidence.

## In Progress

None in implementation. Final feature-branch checkpoint and PR readiness/CI recording only.

## Remaining

Owner reviews PR #98, screenshot evidence and final-head required checks.
Resolve #97 documentation overlap, then separately authorize integration. No automatic merge.

## Validation State

| Check                | State                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- |
| format               | PASS final full repository check                                                        |
| lint                 | PASS                                                                                    |
| typecheck            | PASS including validated CalendarDate test fixtures                                     |
| unit tests           | PASS 520/520 in 39 files                                                                |
| content validation   | PASS 31 registered JSON files                                                           |
| database tests       | PASS draft CI 37213308072 at 8da382c, 154 pgTAP; N/A hosted operations                  |
| build                | PASS Webpack production, application unchanged since build                              |
| E2E                  | PASS 96 / zero fail / nine production-only skips, all eight supported sizes             |
| Docker               | PASS draft CI at 8da382c; no app/Docker configuration change since                      |
| secret scans         | PASS 28 client files, all three server-only CI sentinels absent                         |
| approval/integrity   | PASS zero lapse; 420 identical files; 88 October approved/fresh distinct, 176 September |
| packages/media       | PASS 15 exact packages; 59/59 required images, zero missing                             |
| GitHub final-head CI | NOT RUN final-head checks at this pre-push checkpoint; inspect PR #98                   |

The old final October audit passed before edits. Its authorized UI byte freeze is now STALE;
it is preserved, not weakened. The new content/reference freeze and full P1 behavioral suite
prove the appropriate scope. No public-prod smoke runs against un-deployed new UI.

## Database State

No DB impact. No migration or schema changes; no hosted connections/writes in this task.
Production promotion completed earlier through normal workflow; see archived checkpoint.
Both hosted environments are outside this implementation boundary.

## Deployment State

No deployment performed. Production remains the validated October main 81b759f.
Local production-build preview: http://127.0.0.1:3001 (not a deployment).

## Git State

Dedicated branch from develop. PR #97 remains open/unchanged at ceae6c1; its verified docs were
carried forward before new checkpoint edits. Archive retains full release evidence.
PR #98 open: https://github.com/ipanga/teka_edu/pull/98. Implementation 8da382c plus final
validation/checkpoint commit; verify actual HEAD. Owner must reconcile overlapping #97 docs.

## Blockers

None in implementation. PR #97 required DB check failed ECR storage-api:v1.72.1 rate exceeded
before assertions; not retried in this task, no workflow changes.

## User Decisions Needed

Review proposed UX and the focused PR after validation.
Resolve documentation-only PR #97 overlap deliberately; no automatic merge or deployment.

## Exact Resume Point

STOP for owner review of PR #98 and before/after screenshots. Verify its exact head and required
checks, reconcile #97 documentation overlap, and obtain separate merge authorization before
integration. Do not merge either PR or deploy staging/production in this task. No curriculum
expansion, hosted write or migration authorized.

## Resume Verification

Run git status --short --branch and git log -5; fetch refs and verify develop/main and PR #97.
Read architecture note and this checkpoint, then inspect actual running local sessions before
trusting test freshness. Never rerun changed UX tests against old production UI.
