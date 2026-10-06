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

## Sanitized diagnostic phases

The summary now records each check separately and retains completed PASS statuses when a
later phase fails. Later phases remain NOT REACHED. Activation/API authentication, normalized
site configuration and forbidden site-environment validation remain first. Before every SSH
network call, the runner validates the private key noninteractively with `ssh-keygen -y`
(stdout discarded) and finds/syntax-checks only pinned entries for the exact SSH hostname.
All temporary key/pin files are 0600 under a private local runner directory and cleaned up
on success or failure. No replacement trust material or fingerprint is printed.

Pinned SSH then runs only `id -un`; authentication and exact login must pass before the fixed
root/runtime read. The root check reports only failed invariant names, such as ROOT_EMPTY
or NODE_VERSION. Only after root/runtime success does a separate minimal SELECT prove exact
DEV identity/version, TLS verify-full, transaction/default read-only and repeatable-read
isolation. Only after that succeeds does the unchanged full SELECT payload verify migration
history/checksums, schema/access and canonical values. Every query remains DEV-only with
PGOPTIONS default_transaction_read_only=on and an explicit read-only transaction.

The eleven summary entries are ACTIVATION_GUARD, API_AUTH, SITE_CONFIG, SITE_ENVIRONMENT,
SSH_PRIVATE_KEY_FORMAT, KNOWN_HOSTS_ENTRY, SSH_AUTH, SSH_ROOT_RUNTIME, DEV_DB_AUTH_TLS,
DEV_READONLY_VERIFY and RESTART_PERMISSION. Local key-format failure can include an unusable
passphrase-protected key; it does not claim password-free parse success. Host-pin entry PASS
means local matching/syntax; the subsequent SSH_AUTH must pass to prove live pinned trust
and authentication. SSH and libpq stderr are classified internally into fixed allowlisted
codes and never printed. Unknown errors remain explicit within the failing phase.
No generic combined SSH/DEV error remains. Restart permission stays independently NOT PROVED.

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

## Split diagnostic live checkpoint — 2026-10-06

[PR #105](https://github.com/ipanga/teka_edu/pull/105) integrated the four-file diagnostic split
into develop at `1b084e2550aeac61d0c912d95bfac31f2cf953f8`.
[Protected promotion PR #106](https://github.com/ipanga/teka_edu/pull/106) integrated the same
change into main at `16d4671e0427f60b3f804573cf99a282f8e43762`. Both required CI runs
passed. Node 22 local validation passed formatting/lint/typecheck, 24 preflight tests and all
544 unit tests. The promotion diff contained exactly the manual preflight guard-summary,
preflight script, tests and documentation. No PostgreSQL tooling or PR #100 implementation
was integrated; main and develop trees match.

Manual [run 37534667769](https://github.com/ipanga/teka_edu/actions/runs/37534667769) executed
on reviewed develop. Its credential-free job summary preserves all eleven separate statuses:

| Read-only check        | Status           |
| ---------------------- | ---------------- |
| ACTIVATION_GUARD       | PASS             |
| API_AUTH               | PASS             |
| SITE_CONFIG            | PASS             |
| SITE_ENVIRONMENT       | PASS             |
| SSH_PRIVATE_KEY_FORMAT | PASS             |
| KNOWN_HOSTS_ENTRY      | PASS             |
| SSH_AUTH               | PASS             |
| SSH_ROOT_RUNTIME       | FAIL — ROOT_READ |
| DEV_DB_AUTH_TLS        | NOT REACHED      |
| DEV_READONLY_VERIFY    | NOT REACHED      |
| RESTART_PERMISSION     | NOT PROVED       |

The GitHub key parsed noninteractively, the exact hostname pin entry/syntax validated, and
pinned SSH authenticated as congofoot. The fixed root/runtime read then returned ROOT_READ.
This isolates the failure to that phase but does not identify the underlying OS/runtime
exception. Do not assert a particular filesystem, Node or Python cause without new evidence.
DEV authentication, version/identity/TLS, history/checksums, schema/access and canonical
comparison were not attempted, so remain unverified through GitHub credentials.

Alwaysdata activation remains unset and both provider deployment switches remain false;
Environment staging remains develop-only. The staging provider mutation job was SKIPPED.
Site writes, uploads, release-directory/symlink changes, starts/restarts, database connections
and DML/DDL, PROD connections, DNS changes, secret changes and provider retirements: zero.
No key, derived public key, fingerprint, complete pin line, password or raw SSH/libpq error was
printed or uploaded. Ephemeral runner credential files were cleaned up. Restart permission
remains independent and no POST was issued. PR #100 remains open/draft and unmerged at
`8105565a29571f86d4782787f071cf09114e6f00`; no reconciliation was attempted.

Stop: first activation is not ready. A separate verification-only root/runtime diagnostic must
identify the failed operation before another full preflight can be useful. No automatic
correction or additional live probe was performed. First-release application rollback remains
NOT PROVED until distinct reviewed releases demonstrate A → B → A → B.
