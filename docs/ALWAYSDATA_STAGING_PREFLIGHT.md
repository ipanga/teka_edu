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

The live site must match account `congofoot`, site 1083502, Node.js 22, sole address
`staging-tekaedu.tootiye.com`, staging root and reviewed `current/runtime.mjs` command.
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

## Current execution blocker

The repository default branch is `main`; Environment `staging` permits only `develop`.
GitHub requires `workflow_dispatch` workflows to exist on the default branch. This authorized
change exists only on PR #100's feature branch. Therefore it cannot safely run using the
actual Environment secrets under the current restrictions. No dispatch or policy change is
attempted, and PR #100 stays unmerged. Ordinary PR CI tests this implementation with fixtures;
that is not a live secret-backed preflight.

An owner decision is required: separately authorize review/integration of only the preflight
files through the repository's normal `develop`/`main` promotion path, with the activation
switch disabled, then dispatch the reviewed preflight on `develop`. That path preserves the
Environment policy and excludes the application migration/CD changes in PR #100. It is not
authorized by the feature-branch-only instruction. Alternatively retain the current stop and
provide independently obtained read-only evidence; that alternative does not prove the exact
GitHub-stored credentials were consumed by Actions.

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
