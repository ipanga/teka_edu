# Active Task

## Current reconciliation checkpoint — 2026-10-07

This checkpoint supersedes the earlier configuration blockers and CI counts below.
PR #100 is being reconciled with develop `ccb0e2f92032e90554d844c8add6bec24c24f8f4`
using a normal merge. The five independently integrated preflight files are preserved exactly.
Owner-provided non-secret evidence proves token-linked profile Sites permission for congofoot;
no restart POST was issued. See [current CD checkpoint](../ALWAYSDATA_STAGING_CD.md).
Successful read-only run 37665326854 proves the configured GitHub credentials, site, SSH,
Node22 and DEV baseline. No new provider or database check is needed for reconciliation.
Full reconciled-head CI and final diff review precede any ready-for-review recommendation.
Keep PR #100 draft and all switches disabled. No merge of PR #100, upload, restart, activation,
DEV/PROD operation or retirement. First-release rollback is NOT PROVED BY DESIGN; distinct
reviewed A → B → A → B is a later acceptance requirement, separate from health/smoke.

## Task

Approved Alwaysdata DEV migration and gated staging CD.

## Objective

Complete DEV acceptance and reviewable Linux standalone CD, then live staging smoke and
application rollback after owner configuration/activation. Keep all PROD/providers intact.

## Status

`awaiting_user`

## Branch

`feature/alwaysdata-postgres-portability`

## Base Branch

`origin/main` at `ac003f8580ca81dcfb426a70c45c02102b8e0551`.

## Started

2026-10-05, Africa/Lubumbashi.

## Last Checkpoint

Explicit human rollback approval recorded; nine fresh safeguards passed; reviewed2315600
runner committed46 DEV migrations and verified every managed guarantee. Final codee3cb6d1
passes all applicable GitHub CI, including Linux artifact startup and both Docker images.
Independent Linux archive checksum PASS. Owner is configuring GitHub; latest names-only
read has no Alwaysdata entries. No staging app activation or PROD operation.

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
Local functional archive/pointer guards pass. Local packaged staging startup/media and96 supported-device browser tests PASS,9 production-only
skips. This is a workstation artifact, not a Linux deployable or live staging acceptance.
All applicable Linux CI checks PASS at e3cb6d1; the following checkpoint changes only docs/evidence.

## Remaining

Owner GitHub credentials/site setup and separately authorized first
activation through reviewed develop integration. Two distinct reviewed releases required for
live rollback proof. Do not repeat empty-state apply:46 reviewed DEV migrations exist now.

## Validation State

| Check              | Verdict                                                       |
| ------------------ | ------------------------------------------------------------- |
| format             | PASS local current implementation                             |
| lint               | PASS local current implementation                             |
| typecheck          | PASS local current implementation                             |
| unit tests         | PASS546 local current implementation                          |
| content validation | PASS31 files via Node tsx loader                              |
| database tests     | PASS e3cb6d1 PG16/Supabase CI; managed DEV PASS               |
| build              | PASS e3cb6d1 Linux build/package/startup/media CI             |
| E2E                | PASS e3cb6d1 browser CI +96 local staging tests; live NOT RUN |
| Docker             | PASS e3cb6d1 portable/Vercel Docker CI                        |
| secret scans       | PASS e3cb6d1 client/full-artifact sentinel CI                 |

## Database State

Accepted DEV PostgreSQL16.15:46 history rows/zero pending/36tables/6,170 exact canonical rows.
All managed verification PASS. Snapshot remains protected; post-commit reset needs separate
approval. No PROD connection/operation this phase.

## Deployment State

Staging undeployed; latest edge TLS valid/HTTP502. Live smoke/rollback NOT RUN.

## Git State

PR #100 into develop remains draft; implementation a7b9004 and syntax correction3563e33 pushed; final credential/evidence checkpoint
follows in branch log. No merge.

## Blockers

GitHub staging Environment lacks Alwaysdata credentials at latest names-only read; owner
is configuring them. Earlier Actions outage prevented runner acquisition; final-code CI has since passed. Staging site command must be
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
