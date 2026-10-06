# Verification-only staging preflight

The manual `.github/workflows/verify-alwaysdata-staging.yml` consumes only the four Alwaysdata
secrets in Environment `staging`. A separate job first requires the repository deployment
switch to be unset/false; the secret-bearing step checks it again. Existing deployment
workflows and reviewed PostgreSQL tooling are unchanged.

The preflight permits only account/site API GETs, pinned-key SSH directory/runtime reads and
DEV SELECTs in a repeatable-read read-only transaction. The connection additionally sets
`default_transaction_read_only=on` and TLS `verify-full`. No remote credential file, directory,
application upload, release pointer, site setting, restart, database DML/DDL or DNS change is
performed. Ephemeral key/pin files exist only on the runner with mode 0600 under a private
temporary directory and are removed. No artifact upload step exists. API redirects and raw
provider/SSH diagnostics are suppressed to prevent credential disclosure.

The isolated five-file integration uses existing application reference-data helpers and
self-contained SELECT SQL. It does not import the unmerged PostgreSQL runner or baseline
files from PR #100. Frozen SHA-256 bindings from the reviewed
`2315600fc0db4bfe67769afb2eb4727983c91bb6` baseline cover the complete schema, all 46
history entries (including source/execution hashes and adapter version), and the historical
SQL source inventory. Canonical values retain their reviewed full-data hash. This preserves
the verification contract without integrating migration tooling/evidence or other PR #100
files. The five-file adaptation receives its own isolated PR review and CI.

The live site must match account `congofoot`, site 1083502, Node.js 22, sole address
`staging-tekaedu.tootiye.com`, staging root and reviewed `current/runtime.mjs` command.
The owner's direct API query confirmed that Alwaysdata serializes the configured root address
as `staging-tekaedu.tootiye.com/`. Validation removes exactly one terminal slash before exact
comparison with `staging-tekaedu.tootiye.com`. Both forms identify the same intended root.
Other hosts, subpaths, duplicate/additional addresses, empty/malformed values, schemes and
ports remain rejected. No scheme-qualified serialization has been evidenced, so none is
accepted. The startup command remains an exact comparison and the provider site is unchanged.
Mismatches stop without correction and identify fields without printing possibly sensitive
values. The staging root must still be empty; a new release requires separate review.
DEV must match all 46 historical checksums and the frozen schema and 36-table/6,170-row
canonical values. Behavioral integrity fixtures and idempotency re-sync are excluded because
they execute DML even when rolled back.

## Restart permission limit

The documented site/account/token GET fields do not establish effective restart permission.
Tokens inherit their linked profile's permissions, but successful GET authentication is not
restart authorization evidence. The preflight reports `NOT PROVED` and exits 2 after successful
connection checks, retaining sanitized stdout/job-summary evidence. An owner must provide
reviewable read-only evidence of the linked profile's site-management permission. No restart
POST or token listing is used; token listings can themselves expose credentials.

## Registration and integration boundary

The repository default branch is `main`; Environment `staging` permits only `develop`.
GitHub requires `workflow_dispatch` workflows to exist on the default branch. This authorized
workflow must therefore be registered on `main` through protected PRs and dispatched only on
`develop`. The owner authorized integrating exactly the five preflight files independently
of PR #100, which remains open/draft. The Environment policy stays unchanged. Ordinary PR CI
uses fixtures and must not be represented as live credential evidence.

The existing `STAGING_DEPLOY_ENABLED` and `PRODUCTION_DEPLOY_ENABLED` repository switches
were observed enabled. Both are held `false` for this preflight-only integration so protected
merges cannot trigger Vercel/Supabase mutation jobs. The Alwaysdata switch remains unset.
No deployment workflow is modified and no provider is retired. Do not restore or enable any
deployment switch without separate owner authorization. Inspect the `main..develop` tree
diff before promotion; only the five authorized files may cross this integration boundary.

## Activation and first-release boundary

Preflight completion never enables deployment or merges PR #100. Recheck the reviewed SHA,
current-head CI, switch and owner authorization before any subsequent activation. An initial
release can have successful health/device smoke while application rollback is `NOT PROVED`:
there is no distinct prior release. The existing CD exits nonzero for incomplete rollback
acceptance; report this separately from application health. A later distinct reviewed release
must prove A → B → A → B. DEV reset, PROD operations and provider retirement remain excluded.

References: [manual workflow requirements](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow),
[Alwaysdata token permissions](https://help.alwaysdata.com/en/docs/admin-billing/profile/tokens/),
[API fields](https://api.alwaysdata.com/doc/).

## Normalized live preflight checkpoint — 2026-10-06

The owner's API evidence showed the root address serialized with one terminal slash. The
scoped correction accepts that representation through explicit normalization and keeps exact
site identity, sole root and command validation. Regressions reject unrelated hosts, suffixes,
paths, schemes, ports, duplicate/additional and malformed/empty addresses and changed commands.
Node 22 formatting/lint/typecheck, eight targeted tests and all 528 unit tests passed.

Protected [PR #103](https://github.com/ipanga/teka_edu/pull/103) merged into develop at
`19fba2a0cdbf70bc46987cceab054828856985e2`; protected
[promotion PR #104](https://github.com/ipanga/teka_edu/pull/104) merged into main at
`7819e2f86c0bb4573dbebd4fa8c4b53f35b9c2d8`. Both had green required CI. The exact
promotion tree diff contained only the three preflight script/test/documentation files.
Main and develop trees match. Environment staging remains develop-only and all deployment
switches remain off (Alwaysdata unset; staging/production provider switches false).

Manual [run 37530362603](https://github.com/ipanga/teka_edu/actions/runs/37530362603) executed
on corrected develop at the exact SHA above. The disabled-switch guard passed. Execution
advanced past API authentication, account congofoot, all normalized site 1083502 fields and
forbidden-environment validation, establishing PASS for those checks. It then stopped with:

```text
Pinned-key SSH/read-only remote check failed; diagnostics suppressed
```

The shared SSH wrapper suppresses diagnostics for both the initial root/runtime read and
subsequent DEV query. This message alone cannot distinguish SSH key/pin/authentication or
root/runtime failure from a later DEV access/query failure. No independent SSH private-key,
known-hosts, root/runtime or DEV credential/database PASS is established by this run. The
DEV version/identity/TLS/history/checksum/canonical/schema/access assertions therefore remain
NOT PROVED through GitHub credentials. Restart permission also remains NOT PROVED; no POST
was issued. Exit 1 is the remote-check failure, not the expected restart-limit exit 2.

Site writes, uploads, starts/restarts, DML/DDL, PROD connections and DNS changes: zero.
No actual secret values or credential-bearing artifacts were exposed. The staging provider
mutation job was SKIPPED. PR #100 remains open/draft and unchanged at
`8105565a29571f86d4782787f071cf09114e6f00`, still CONFLICTING/DIRTY; no reconciliation
was attempted. First activation is not ready. The next separate step is verification-only
diagnostics that distinguish the SSH/root phase from the DEV query phase, preserving all
mutation boundaries. First-release application rollback remains NOT PROVED until a distinct
second release supports A → B → A → B.
