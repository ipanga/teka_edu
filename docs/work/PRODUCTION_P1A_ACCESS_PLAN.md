# P1-A design checkpoint

This additive checkpoint preserves PR116/117's overlapping ACTIVE_TASK/PROJECT_STATUS reports.

## Task

Reconcile owner-confirmed P0 infrastructure evidence and review/publish the P1-A design; no provider action.

## Objective

Update P0/P1-A evidence classifications, preserve116/117 and prepare a focused docs PR without a PROD connection.

## Status

`awaiting_review`

## Branch

`codex/production-p1a-access-plan`

## Base Branch

develop `813c56197f0d0fb353b39238b65c27dd08e6e5bc`.

## Started

2026-10-09 Africa/Lubumbashi.

## Last Checkpoint

Owner UI evidence incorporated; P0 incomplete / production BLOCKED. Two SQL proposals unchanged; no SQL executed.
See [plan](../ALWAYSDATA_PRODUCTION_AUDIT_ACCESS.md) and new private owner-evidence resume for exact digests.

## Scope

Owner UI statements and pinned reports; GitHub guard/PR/CI reads; official provider docs;
additive P0 owner-evidence report/JSON, updated P1-A plan/checkpoint, focused protected PR publication.

## Out of Scope

PROD/DEV SQL connections, credentials/secrets/grants/DDL/DML/provider settings, backup/restore,
services/deploy/DNS/pointers/retirement, PR116/117 edits/merge, application changes.

## Product Decisions

None adopted. Prefer existing appropriately scoped DB login; setup/execution/revocation need
separate authorization. No SSH/API access bundled. Provider read-only preset is not strict proof.

## Completed

Read pinned116/117 reports; exact heads and five applicable CI jobs PASS; three false switches,
no overrides/active deploys. Owner site/subscription/DB association/DNS/SSL/backup UI facts classified OWNER UI VERIFIED.
Live SQL/API permissions/contents/isolation/recovery/capacity remain NOT PROVED. Full-rights
login reserved for separately reviewed administration; RLS/TLS/least-privilege boundaries preserved.

## In Progress

Owner-independent review. Focused PR/exact-head CI outcomes are tracked in the new durable resume.

## Remaining

Existing audit-login/custom permission feasibility evidence, exact setup diff if needed, separate connection
authorization. Live metadata/data/role authentication gaps remain unverified.

## Validation State

Scoped Markdown format: PASS. PostgreSQL16 parser and SELECT-only AST review: PASS;
six unsafe AST fixtures refused. See private validation.json for exact SQL SHA256/parser version.
SQL execution: NOT RUN. Local runtime/build/DB execution: NOT RUN; focused docs PR exact-head CI tracked in new resume.
Existing PR116/117 five applicable checks PASS at their unchanged exact heads.

## Database State

No Alwaysdata PROD or DEV connection. No database/credential/permission modification.

## Deployment State

All three switches false; no active deployment/overrides. Staging acceptance C is historical
accepted evidence, not re-probed. No service/site/provider action.

## Git State

Six docs/proposal files on separate develop-based branch; focused docs PR publication authorized.
Exact commit/PR/CI and clean/uncommitted state in new durable resume; no merge.
Primary pre-existing preflight edit, PR116/117 heads and reports preserved.

## Blockers

Owner UI configuration now known. No approved audit mechanism identified; provider permission persistence,
effective isolation/RLS/target state unknown. Production readiness remains BLOCKED.

## User Decisions Needed

Review owner-evidence P0 matrix/P1-A recommendation; inspect audit access without saving; authorize setup only if needed,
then protected storage and specific SELECT-only execution separately. No secrets in chat.

## Exact Resume Point

STOP at owner review after focused docs PR/CI; no merge or SQL connection. Read primary private/astra-visual-evidence/production-owner-evidence-20261009/resume.json
and the additive plan; verify digests before any future action.

## Resume Verification

Check local branch/base/new files and preserved primary edit; pinned116/117 heads/CI,
all false switches/no overrides/no active deploys. Verify unchanged original nine-file P1-A
archive and fresh owner-evidence index. UI confirmation never becomes live SQL/API proof.
Do not infer live SQL identity, original history byte provenance, or RLS-visible emptiness.
