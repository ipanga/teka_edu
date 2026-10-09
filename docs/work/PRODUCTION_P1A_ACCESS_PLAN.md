# P1-A design checkpoint

This additive checkpoint preserves PR116/117's overlapping ACTIVE_TASK/PROJECT_STATUS reports.

## Task

Align P1-A with the owner-created PROD read-only audit login; update PR118 without SQL/provider action.

## Objective

Pin the actual audit login, retire previous query hashes and prepare protected SELECT-only execution; preserve116/117 and draft118 without merge.

## Status

`awaiting_review`

## Branch

`codex/production-p1a-access-plan`

## Base Branch

develop `813c56197f0d0fb353b39238b65c27dd08e6e5bc`.

## Started

2026-10-09 Africa/Lubumbashi.

## Last Checkpoint

Owner created congofoot_readonly_user_teka_edu_prod; PROD-only/read-only preset OWNER UI VERIFIED.
SQL proposals now use the fixed actual role with new hashes; old hashes superseded. P1-A NOT PASSED, PROD BLOCKED.
See [plan](../ALWAYSDATA_PRODUCTION_AUDIT_ACCESS.md) and new existing-audit resume for exact digests.

## Scope

Owner UI statements and pinned reports; GitHub guard/PR/CI reads; official provider docs;
focused P1-A plan/SQL/checkpoint/P0 supplement, new audit-user attestation and offline validator; update draft118 only.

## Out of Scope

PROD/DEV SQL connections, credentials/secrets/grants/DDL/DML/provider settings, backup/restore,
services/deploy/DNS/pointers/retirement, PR116/117 edits/merge, application changes.

## Product Decisions

Use existing owner-created fixed audit login; protected storage/execution/revocation need
separate authorization. No SSH/API access bundled. Provider read-only preset is not strict proof.

## Completed

Read pinned116/117 reports; exact heads and five applicable CI jobs PASS; three false switches,
no overrides/active deploys. Owner site/subscription/DB association/DNS/SSL/backup UI facts classified OWNER UI VERIFIED.
Live SQL/API permissions/contents/isolation/recovery/capacity remain NOT PROVED. Full-rights
login reserved for separately reviewed administration; RLS/TLS/least-privilege boundaries preserved.
Actual audit role is fixed in both queries; sequence/grant-option/reachable-replication checks explicit.
Account/preset attestation recorded separately from unproved SQL identity/effective rights/TLS/isolation/schema/data.

## In Progress

Owner-independent review. Focused PR/exact-head CI outcomes are tracked in the new durable resume.

## Remaining

Approved protected credential source/CA, independent query/privilege review and separate bounded connection
authorization; no new audit account needed. Live metadata/data/role authentication gaps remain unverified.

## Validation State

Scoped Markdown format: PASS. PostgreSQL16 parser and SELECT-only AST review: PASS;
All56 offline safety/identity/session/required-diagnostic regression fixtures refused; exact results in validation.json. See private validation.json for exact SQL SHA256/parser version.
SQL execution: NOT RUN. Local runtime/build/DB execution: NOT RUN; focused docs PR exact-head CI tracked in new resume.
Existing PR116/117 five applicable checks PASS at their unchanged exact heads.

## Database State

No Alwaysdata PROD or DEV connection. No Codex database/credential/permission modification; account creation was an owner action, not this task.

## Deployment State

All three switches false; no active deployment/overrides. Staging acceptance C is historical
accepted evidence, not re-probed. No service/site/provider action.

## Git State

Focused docs/query/offline-validator update on existing develop-based draft PR118; publication authorized.
Exact commit/PR/CI and clean/uncommitted state in new durable resume; no merge.
Primary pre-existing preflight edit, PR116/117 heads and reports preserved.

## Blockers

Actual audit login/account creation and preset known by owner attestation; no approved secure execution source.
Effective privileges/isolation/RLS/target state and client TLS NOT PROVED; SQL gate NOT PASSED. Production readiness remains BLOCKED.

## User Decisions Needed

Review actual-login proposal/current hashes; authorize protected local credential storage only if needed,
then fixed-identity two-connection SELECT-only execution separately. No secrets in chat.

## Exact Resume Point

STOP at owner review after focused docs PR/CI; no merge or SQL connection. Read primary private/astra-visual-evidence/production-p1a-existing-audit-20261009/resume.json
and the additive plan; verify digests before any future action.

## Resume Verification

Check local branch/base/new files and preserved primary edit; pinned116/117 heads/CI,
all false switches/no overrides/no active deploys. Verify unchanged prior design/owner-evidence
archives and new existing-audit evidence index; old SQL hashes are superseded, not execution approval. UI confirmation never becomes live SQL/API proof.
Do not infer live SQL identity, original history byte provenance, or RLS-visible emptiness.
