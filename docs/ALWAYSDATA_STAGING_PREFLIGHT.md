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
