# Active Task

## Task

PostgreSQL 16 portability and controlled Alwaysdata DEV tooling.

## Objective

Replay all 46 unchanged historical migrations; implement guarded provider-neutral tooling and equivalent integrity/access tests; validate DEV only.

## Status

`awaiting_ci`

## Branch

`feature/alwaysdata-postgres-portability`

## Base Branch

`origin/main` at `ac003f8580ca81dcfb426a70c45c02102b8e0551`.

## Started

2026-10-05, Africa/Lubumbashi.

## Last Checkpoint

Implemented guarded runner and PostgreSQL16 replay CI. Local format/lint/types/unit/content pass; CI clean replay and managed DEV gates pending. New hostname edge TLS passes, HTTP 502.

## Scope

PostgreSQL 16 CI replay, adapters, runner, managed DEV verification and staging deployment prerequisites.

## Out of Scope

PROD writes/deployments, application deployment, provider retirement, runtime database access, content/media changes.

## Product Decisions

Canonical staging is https://staging-tekaedu.tootiye.com. Old dotted hostname is obsolete; historical evidence is retained.

## Completed

Branch from accepted main; preserved prior audit; 46 source hashes frozen; four exact adapters; target/TLS/history/lock guards; canonical/schema/ACL/integrity verification; portable pgTAP and regression CI.

## In Progress

First feature commit and draft PR for clean PostgreSQL16 replay; no hosted mutation.

## Remaining

Obtain CI candidate schema, review/commit it and rerun exact-checkout CI; prepare DEV preflight and rollback evidence; controlled apply only after owner-approved coverage and every gate passes.

## Validation State

| Check              | Verdict                                                |
| ------------------ | ------------------------------------------------------ |
| format             | PASS at first feature checkpoint                       |
| lint               | PASS at first feature checkpoint                       |
| typecheck          | PASS at first feature checkpoint                       |
| unit tests         | PASS at first feature checkpoint                       |
| content validation | PASS at first feature checkpoint                       |
| database tests     | NOT RUN                                                |
| build              | FAIL local sandbox worker-port restriction; CI pending |
| E2E                | NOT RUN                                                |
| Docker             | NOT RUN                                                |
| secret scans       | NOT RUN                                                |

## Database State

Prior audit: targets empty; DEV and PROD isolated. No mutation in this phase yet.

## Deployment State

No application deployment. New staging HTTPS valid at edge, HTTP 502; origin configuration verification pending.

## Git State

Feature checkpoint prepared; first push/PR pending. Prior audit evidence retained.

## Blockers

None established for independent tooling implementation. DEV apply remains gated on replay and rollback coverage.

## User Decisions Needed

No production action authorized. Rollback coverage must be concretely reviewable before DEV apply.

## Exact Resume Point

Push first checkpoint and open draft PR into develop. Inspect portability artifact/logs; repair failures, review candidate baseline, rerun CI. DEV must remain untouched until gates pass.

## Resume Verification

Read docs/ALWAYSDATA_MIGRATION.md and docs/migration/alwaysdata/migration-audit.json. Inspect `git status` and remote CI before rerunning any mutation.
