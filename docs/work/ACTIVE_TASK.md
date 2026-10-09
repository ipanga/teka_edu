# Active Task

## Task

Complete authorized read-only P0 production inventory and prepare bounded P1-A/B/C/D proposal.

## Objective

Verify available facts, identify owner/access gaps, preserve PR116 and STOP before P1 or production changes.

## Status

`awaiting_review`

## Branch

`codex/production-p0-inventory`

## Base Branch

`origin/develop` at `813c56197f0d0fb353b39238b65c27dd08e6e5bc`.
Main `1578847d02d025286af92af48c691bbfafd84c10`; PR116 head `16ce45ee19e97c7b957200b60a184da67fcf5fe6` unchanged.

## Started

2026-10-09 (Africa/Lubumbashi)

## Last Checkpoint

Authorized read-only inventory complete within access. P0 INCOMPLETE / production BLOCKED.
See [P0 report](../ALWAYSDATA_PRODUCTION_P0.md) and its sanitized evidence summary.
Current C/previous A intact; Vercel PROD81b759f healthy; all three switches false.
46 source statement representations match; whole historical file-byte provenance NOT PROVED.
No target SQL connection, provider mutation or P1 implementation.

## Scope

GitHub guards/PR116, live health/pointers/manifests, source SELECT-only reference/catalog/history,
root/backup metadata/TLS/session limits, owner evidence checklist, focused documentation checkpoint.

## Out of Scope

Unapproved credentials, target SQL connection, database writes/fixtures/dumps/backups/restores,
provisioning, P1/P2 implementation, site save/start/restart/upload, deployment/pointers/DNS,
switch enablement, secret/policy changes, merges, retirement, content/media changes.

## Product Decisions

No new decision adopted. Recommend local JSON progress export/import as a cutover gate;
owner decision and later implementation authorization remain separate. P1-A/B/C/D are proposals.

## Completed

- PR116 exact reviewed head/CI and main/develop confirmed; guards disabled, no deploy conflicts.
- C health/current C/previous A, A/B/C manifests and existing production HTTP200/SHA confirmed.
- Supabase PROD17.6,46 versions/names,36/6170 exact, zero Auth/Storage aggregate counts.
- All46 stored statement count/SHA256 representations match reconstructed repository SQL;
  original historical file bytes not retained;46 frozen source/portable hashes validated locally.
- Source schema/ACL unchanged:36 RLS tables,2 private functions,41 ACL objects/594 grants.
- Empty PROD root0770/shared Unix owner, edge/origin TLS/502, backup metadata/session limits.
- Prior38-file audit and31-file accepted staging evidence indexes verified without alteration.
- Exact owner evidence/access boundaries, recovery/progress/CD risks and bounded P1 proposal.

## In Progress

Separate docs checkpoint/PR required CI and independent review. No provider operation running.

## Remaining

Owner non-secret site/Cloudflare/resource/backup entitlement evidence; separately scoped target
read-only access authorization. Review P1 proposal; do not implement it or merge/deploy automatically.

## Validation State

| Check              | State                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| format             | PASS scoped documentation files; final results retained in durable resume     |
| lint               | NOT RUN locally for docs-only changes; PR CI will check exact head            |
| typecheck          | NOT RUN locally for docs-only changes; PR CI will check exact head            |
| unit tests         | PASS existing active-task protocol tests; final results in durable resume     |
| content validation | NOT RUN locally; no content changes; PR CI will check exact head              |
| database tests     | NOT RUN against hosted PROD; SELECT-only inventory PASS; CI uses isolated DBs |
| build              | NOT RUN locally for docs-only changes; PR CI will check exact head            |
| E2E                | NOT RUN live device suite in P0; accepted staging proof retained              |
| Docker             | NOT RUN locally for docs-only changes; PR CI uses isolated containers         |
| secret scans       | PASS changed documentation and sanitized evidence; no credential values       |

## Database State

Source Supabase PROD SELECT-only, DEV link unchanged. Alwaysdata PROD not connected;
expected target identities/state/isolation/TLS remain unverified. No fixtures/DML/DDL/backup/restore.

## Deployment State

Staging C accepted/healthy/current; previous A. PROD still healthy Vercel81b759f.
Alwaysdata PROD root empty/no current, valid TLS/expected502. All three deployment switches false.

## Git State

Docs-only branch based on develop C; PR116 exact head/review history preserved. No merge.
Primary checkout's edited docs/ALWAYSDATA_STAGING_PREFLIGHT.md untouched.
Exact new docs commit/PR/CI metadata are recorded in private production-p0-20261009/resume.json.

## Blockers

P0 missing exact target site/SQL/capacity/Cloudflare/backup plan facts; no restore/RPO/RTO;
shared-account exposure, progress decision and future production runtime/CD implementation.
Restricted browser access is preserved; no alternate automation or credential extraction.

## User Decisions Needed

Supply report section13 non-secret owner evidence. Separately authorize scoped P1-A read-only
access preparation if needed; review P1-B/C/D each independently. No secret values in chat.

## Exact Resume Point

STOP after P0 report/docs checkpoint. Next authorized work is owner evidence reconciliation
read-only. Target connection/provisioning/P1/merge/migration/deployment/DNS require new scope.
Read private/astra-visual-evidence/production-p0-20261009/resume.json for exact commit/PR/CI/index.

## Resume Verification

Verify git status/log/branch and evidence index; PR116 exact head, new docs PR CI, main/develop;
three false switches/no overrides/no active deploy; staging C/current C/previous A and actual
Vercel PROD SHA. Preserve dated historical evidence and explicitly unverified fields before any next action.
