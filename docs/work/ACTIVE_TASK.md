# Active Task

## Task

PostgreSQL 16 portability and controlled Alwaysdata DEV tooling.

## Objective

Replay all 46 unchanged historical migrations; implement guarded provider-neutral tooling and equivalent integrity/access tests; validate DEV only.

## Status

`awaiting_user`

## Branch

`feature/alwaysdata-postgres-portability`

## Base Branch

`origin/main` at `ac003f8580ca81dcfb426a70c45c02102b8e0551`.

## Started

2026-10-05, Africa/Lubumbashi.

## Last Checkpoint

Portability and committed-baseline replay PASS at 35b7c3f. All541 local unit tests and quality checks PASS. Read-only managed DEV preflight and protected snapshot prepared; no DB mutation. Owner rollback approval pending.

## Scope

PostgreSQL 16 CI replay, adapters, runner, managed DEV verification and staging deployment prerequisites.

## Out of Scope

PROD writes/deployments, application deployment, provider retirement, runtime database access, content/media changes.

## Product Decisions

Canonical staging is https://staging-tekaedu.tootiye.com. Old dotted hostname is obsolete; historical evidence is retained.

## Completed

Branch from accepted main; preserved prior audit; 46 source hashes frozen; four exact adapters; target/TLS/history/lock guards; canonical/schema/ACL/integrity verification; portable pgTAP and regression CI.

## In Progress

Final documentation/evidence checkpoint. DEV mutation is held for explicit operator rollback approval.

## Remaining

Obtain CI candidate schema, review/commit it and rerun exact-checkout CI; prepare DEV preflight and rollback evidence; controlled apply only after owner-approved coverage and every gate passes.

## Validation State

| Check              | Verdict                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| format             | PASS at 35b7c3f plus final-doc local verification                       |
| lint               | PASS at 35b7c3f plus final-doc local verification                       |
| typecheck          | PASS at 35b7c3f plus final-doc local verification                       |
| unit tests         | PASS at 35b7c3f plus final-doc local verification                       |
| content validation | PASS at 35b7c3f plus final-doc local verification                       |
| database tests     | PASS PG16 baseline + Supabase at 35b7c3f                                |
| build              | PASS Linux CI at 35b7c3f; local Turbopack port restriction              |
| E2E                | PASS Linux CI at 35b7c3f                                                |
| Docker             | PASS CI at 35b7c3f                                                      |
| secret scans       | PASS CI client sentinel check at 35b7c3f; supplied-credential scan PASS |

## Database State

2026-10-05 read-only DEV identity: PostgreSQL 16.15, TLS verify-full PASS, zero public tables, PROD CONNECT denied, btree_gist available, pgTAP unavailable. Protected empty-DEV dump created/manifest extracted; latest provider backup lacks this DB. No DB mutation.

## Deployment State

No application deployment. New staging HTTPS valid at edge, HTTP 502; origin configuration verification pending.

## Git State

Pushed bf83c3e, a6d54f4, 41e4a9c and 35b7c3f; draft PR #100 into develop. Final evidence checkpoint follows these implementation commits; its SHA is in the branch log. No merge.

## Blockers

Owner-required rollback coverage approval is pending. Baseline replay/build+E2E/Supabase PASS at 35b7c3f; All applicable CI jobs PASS at that head; Promotion source correctly skipped for develop. No managed apply may proceed until approval and CI gates pass.

## User Decisions Needed

Pending async decision: approve documented protected empty-DEV rollback coverage and conditional DEV apply, or retain read-only DEV. See docs/migration/alwaysdata/dev-rollback-plan.md. The owner request requires “operator-approved rollback coverage PASS”.

## Exact Resume Point

Read PR #100/final-head CI and pending owner approval before any action. If approved and CI passes, transfer its exact replay JSON to the private admin root, rerun DEV preflight, invoke guarded apply with matching release SHA and rollback record/approval flag, then verify and record managed evidence. Otherwise retain empty DEV. No application deployment.

## Resume Verification

Read docs/ALWAYSDATA_MIGRATION.md and docs/migration/alwaysdata/migration-audit.json. Inspect `git status` and remote CI before rerunning any mutation.
