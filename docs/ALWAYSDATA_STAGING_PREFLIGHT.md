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

## Live preflight checkpoint — 2026-10-06

Protected integration completed through [PR #101](https://github.com/ipanga/teka_edu/pull/101)
and [promotion PR #102](https://github.com/ipanga/teka_edu/pull/102), with all required CI green.
Exactly the five authorized files were integrated. Develop is
`9137e5c2a0593fb800f9c32525803a0bb48edf0f`; main registration is
`df2c417858d6807f3975f9740e0fb7214ba7fd4c`. The Environment still permits only develop.
Existing staging and production mutation jobs were explicitly SKIPPED in runs
37519840802 and 37520463093. Their repository deployment switches remain false;
Alwaysdata activation remains unset. Services/providers were not retired.

Manual [run 37520558325](https://github.com/ipanga/teka_edu/actions/runs/37520558325)
was dispatched against develop at the exact SHA above. Its disabled-switch guard passed.
The secret-bearing step authenticated its API account/site GETs and stopped with:

```text
Site 1083502 fields differ from expected values: addresses, command
```

Account congofoot and site ID/type/Node 22/working-directory checks matched. Full SITE CONFIG
is FAIL because addresses and command differ. Expected sole address is
`staging-tekaedu.tootiye.com`; expected command is
`/usr/alwaysdata/nodejs/22/bin/node current/runtime.mjs`. Actual field values were suppressed
rather than risk exposing credentials embedded in a malformed command. The site environment
check, SSH authentication/pins/root and DEV password/SELECT checks were NOT REACHED. Their
status is NOT VERIFIED, not PASS. Restart permission remains NOT PROVED. This is a genuine
site-configuration failure, not the expected exit-2 limitation after passing connections.

No corrections or rerun were attempted. Site writes/restarts, remote uploads, DEV DML/DDL,
PROD connections, DNS writes and provider retirements: zero. No credential-bearing artifact
or actual secret value was printed. PR #100 remains open/draft at
`8105565a29571f86d4782787f071cf09114e6f00` and was not merged or updated.

Owner action: resolve the address/start-command discrepancies while respecting the no-start
boundary, then resume verification-only dispatch on develop with all deployment switches
still off. Do not authorize PR #100 merge or application activation on this incomplete
credential/site/DEV evidence. Recheck branch SHAs/settings before any later authorized action.
