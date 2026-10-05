# Active Task

## Task

Approved Alwaysdata DEV migration and gated staging CD.

## Objective

Complete DEV acceptance and reviewable Linux standalone CD, then live staging smoke and
application rollback after owner configuration/activation. Keep all PROD/providers intact.

## Status

`in_progress`

## Branch

`feature/alwaysdata-postgres-portability`

## Base Branch

`origin/main` at `ac003f8580ca81dcfb426a70c45c02102b8e0551`.

## Started

2026-10-05, Africa/Lubumbashi.

## Last Checkpoint

Explicit human rollback approval recorded; nine fresh safeguards passed; reviewed2315600
runner committed46 DEV migrations and verified every managed guarantee. No reset or PROD
operation. New CD implementation is under validation; no staging app activation.

## Scope

DEV migration/managed acceptance and gated develop-only staging CD implementation.

## Out of Scope

PROD operations/deployments, DNS cutover, Auth/Storage, provider retirement, automatic reset,
destructive rollback and unrelated app/content changes. First app activation awaits owner setup.

## Product Decisions

Canonical staging is https://staging-tekaedu.tootiye.com. Cloud sync/AI remain disabled,
browser-local progress and content/media unchanged. TV unsupported.

## Completed

Explicit approval recorded; exact DEV/login16.15/TLS verify-full/denied PROD, protected
snapshot600/hash, empty schema/history, exact runner/baseline/green CI/frozen46 chain/no drift
all freshly passed. Guarded apply committed46; managed verify/list PASS with0pending,
36tables/6,170 exact rows, complete schema/extensions,77 integrity assertions,
access/RLS/ACL/isolation and0-row canonical re-sync. Managed pgTAP unavailable as expected;
reviewed equivalents PASS without CI deviations. No failure, reset or PROD operation.

## In Progress

Opt-in staging workflow, Linux Node22 artifact inventory/checksum/boot, SSH pinned host keys,
immutable releases and atomic current/previous, exact site1083502-only restart, strict
staging SHA/null-Supabase health, full supported-device smoke and A→B→A→B application proof.
Local functional archive/pointer guards pass. Linux validation follows via exact-head CI.

## Remaining

Finish exact-head CI; owner GitHub credentials/site setup and separately authorized first
activation through reviewed develop integration. Two distinct reviewed releases required for
live rollback proof. Do not repeat empty-state apply:46 reviewed DEV migrations exist now.

## Validation State

| Check              | Verdict                                                                      |
| ------------------ | ---------------------------------------------------------------------------- |
| format             | PASS local current implementation                                            |
| lint               | PASS local current implementation                                            |
| typecheck          | PASS local current implementation                                            |
| unit tests         | PASS546 local current implementation                                         |
| content validation | PASS31 files via Node tsx loader                                             |
| database tests     | PASS reviewed2315600 PG16/Supabase CI; managed DEV PASS                      |
| build              | PASS reviewed2315600 Linux CI; new artifact check NOT RUN yet                |
| E2E                | PASS reviewed2315600 Linux CI; actual Alwaysdata staging NOT RUN             |
| Docker             | PASS reviewed2315600 CI; current implementation NOT RUN yet                  |
| secret scans       | PASS reviewed2315600 CI client sentinels; new full-artifact scan NOT RUN yet |

## Database State

Accepted DEV PostgreSQL16.15:46 history rows/zero pending/36tables/6,170 exact canonical rows.
All managed verification PASS. Snapshot remains protected; post-commit reset needs separate
approval. No PROD connection/operation this phase.

## Deployment State

Staging undeployed; latest edge TLS valid/HTTP502. Live smoke/rollback NOT RUN.

## Git State

PR #100 into develop remains draft; implementation/evidence checkpoint pending. No merge.

## Blockers

GitHub staging Environment lacks Alwaysdata credentials. Staging site command must be
configured at activation. First release alone cannot prove rollback; second distinct release
required. See `docs/ALWAYSDATA_STAGING_CD.md` for exact owner setup.

## User Decisions Needed

Provision named GitHub secrets/variables privately and authorize the application activation
boundary. Keep repository opt-in false until ready. No PROD decision requested.

## Exact Resume Point

Inspect git status and exact-head PR100 CI; read the staging CD setup document. Do not repeat
empty-state migration. Configure GitHub/site prerequisites, review/integrate through develop
only after activation authorization; validate first release and distinct successor including
live rollback proof. Stop before any PROD operation or provider retirement.

## Resume Verification

Run `git status` and `git log`; confirm branch, PR100 current-head checks and managed evidence.
Read `docs/ALWAYSDATA_STAGING_CD.md` and `docs/migration/alwaysdata/PORTABILITY_REPORT.md`.
