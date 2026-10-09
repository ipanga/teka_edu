# P1-A design checkpoint

## Current correction — 2026-10-09

Owner-independent verdict on PR118 head `4d705f9864198eda12641ea3585a5af27c3482d5`:
**CHANGES REQUIRED; previous catalog not approved for execution.** Definition deparsers
can invoke type-output routines. The revised restricted catalog query removes those
renderers and all definition hashes, keeps exact guard/privilege diagnostics and projects
OIDs/flags/presence only. See the [fresh review packet](../migration/alwaysdata/p1a/REVIEW.md).

New catalog SHA256: `288442fc6bd44520e4cb0b16f6d73e64c01ad4e3e91592915958bdadb47d2bbf`.
Previous catalog SHA256 `e5f576c1c6f4e88a0bea8a6fb58db7f3648c416a75e333affbe632efe4ff1943`
is **SUPERSEDED / NOT APPROVED FOR EXECUTION**. Identity SQL remains byte-identical;
its successful16.15/verify-full/read-only result is accepted by the owner. No identity rerun.

Offline PG16 syntax/SELECT/session-guard validation passes;128 safety regressions refused.
This correction performs zero SQL executions/connections or provider mutations. PR118
stays draft/unmerged; deployment switches remainfalse. Fresh independent exact-SQL review
is pending; obtain it before requesting a new catalog-only UTC execution window. Schema
equivalence, data presence, history contents and full strict privilege acceptance remain
unverified; production migration remains BLOCKED.

Resume: exact draft PR118 head/CI plus primary
`private/astra-visual-evidence/production-catalog-revision-20261009/resume.json`.
Previous preparation scripts pin the superseded digest and must remain unused.

## Historical checkpoint — preserved, superseded by the correction above

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
