# Exact source inspection for owner review

This package is prepared offline. No production connection, SQL execution, credential
read, provider request, backup, restore or local database server was performed.
Preparation approval does **not** authorize execution.

The requested next approval is one direct read-only inspection of Supabase PROD
project `eganrivpkjhozkkahyxy`, host `db.eganrivpkjhozkkahyxy.supabase.co`, port `5432`,
database `postgres`, login `postgres`, using the native Terminal password prompt and
the exact SQL below. It includes use of the login's existing broad capabilities for
this read-only inspection. The SQL observes `superuser`, `bypassrls`, `createdb`,
`createrole`, `replication`, inherited privileges, database/schema CREATE capability,
and predefined roles for all-data/server-file/server-program/monitor access;
it grants nothing and does not change roles, permissions or RLS policies.

## Bound query and scope

Source query: `scripts/postgres/source-inspection.sql`.

SHA-256: `29830f443a6d19b24db228864319fbb43b678c3ff5b0e6c2cec53f97224859cc`.

The local reference checkout is clean at PR118 head
`895ed054cff4fa4e97ebdbfa7b29db1c3ed5ded6`. `docs/migration/alwaysdata/source-inspection-expected.json` records all input
checksums, projections, row counts and expected content/history digests.

The query uses one repeatable-read read-only transaction, followed by `ROLLBACK`.
It takes ACCESS SHARE locks on the 36 application relations, one migration-history
relation and four Auth/Storage relations before its first SELECT/snapshot. LOCK
performs built-in metadata/locking work; it reads no application values and executes
no view or application routine. These locks prevent approved tables from being
replaced or having their columns/storage changed during inspection. They can briefly delay DDL; ordinary
concurrent application writes continue and are excluded by the fixed data snapshot.
Compatible policy/index/security changes and new schema objects are not frozen by
ACCESS SHARE. No application routine is executed, and the complete-visibility/RLS
gate prevents filtering policy evaluation. This is an inspection snapshot, not a
provider-wide schema/security freeze.

Before any application/provider rows are read, direct catalogs must establish all
41 exact names as permanent ordinary `heap` tables, complete SELECT/schema/RLS
visibility, no inheritance or SELECT rewrite rules, safe built-in live column types
and output functions, the complete 213-column application shape, three known
migration-history fields, all 36 application RLS flags, and no application policy.
Provider stored/generated/identity fields are never projected or evaluated by the
count queries. Unexpected application relation/routine scope, foreign servers or
large objects stops the run. `row_security=off` raises an error if RLS would filter
rows; it does not grant a bypass.

Before that gate and all row reads, the query reports every non-system schema's
relation counts by kind/persistence, catalog row estimates (including unknown-estimate
counts), ordinary heap physical bytes, other storage-relation counts, routine/type
counts and a relation-catalog hash. These are direct catalog aggregates, not data
scans. Catalog row estimates can be stale and never prove emptiness. System schemas
excluded are `pg_catalog`, `information_schema`, `pg_toast` and the reserved
`pg_toast_*`/`pg_temp`/`pg_temp_*` namespaces. No definition deparser is used.

The only evidenced schema names are application `public`, `private` and
supporting/provider `extensions`, `supabase_migrations`,
`auth`, `storage`. `supabase-prod-inventory.json` establishes the first three;
`source-history-digests.json` and `supabase-prod-history-usage.json` establish the
history and Auth/Storage observations. Their hashes are bound in the manifest.
This is an **incomplete** evidenced allowlist, not a complete provider inventory.
No conventional Supabase schema names have been added from memory. Any other
non-system namespace is printed as `OWNER_CLASSIFICATION_REQUIRED`; the query
continues the existing exact checks on the 41 approved heaps. Unknown schemas'
rows are never read, and no routine is called. The owner can classify their catalog
aggregates from this single inspection result without a second connection.
Even a completed inspection retains both `backup_scope: "NOT VERIFIED"` and
`rebuild_scope: "NOT VERIFIED"` and requires
owner namespace classification; it never establishes that all other real data can
be omitted from a backup or rebuild. No schema classification automatically adds
row scans, authorizes a dump/rebuild/cutover, or schedules another connection.

The transaction returns identity/TLS/session observations, 36 full canonical row
multiset SHA-256 results, all 46 migration versions/names and a hash covering each
complete stored statement array, four Auth/Storage aggregate counts, extension and
routine/dependency catalog fingerprints, and application/database physical sizes.
It returns no raw application/Auth/Storage rows, routine bodies, statement bodies,
tokens or ACL contents. Only `pg_roles` and the current session's `pg_stat_ssl`
built-in views are used; application views/routines, definition deparsers and
`pg_user_mapping` are never called.

The dated baseline is accepted only if the live snapshot matches it exactly:
36 tables, 213 columns, 6,170 canonical rows, 46 histories, two known application
trigger routines, and zero users/identities/buckets/objects. Any mismatch, timeout,
permission error or NULL validation fails with a built-in SQL error; `ON_ERROR_STOP`
exits the single invocation. There are zero automatic retries. No grant/bypass,
baseline refresh, dump, backup or production change follows a failure.

The content hash representation is PG17 `jsonb` text of arrays in the explicit
frozen column order, UTF-8 SHA-256 per row, C-order sorting of the lowercase hex row
digests, then SHA-256 of their concatenation. Sorting retains duplicate multiplicity.
Dates are ISO and session timezone is UTC. Migration hashes retain statement-array
boundaries; joined-statement hashes additionally match the prior frozen source
observations. Local source file byte hashes are separate from stored history
representation hashes.

Dependency/OID/node fingerprints and extension versions are observations for review,
not a portable schema-equivalence proof or a restore-readiness result. Other provider
schemas and provider metadata tables are excluded from row reads.

The size observation is printed before the approved heap/content gates, so a later
failure still leaves database bytes and backup planning estimates for review.
For database physical size `D`, the explicit conservative initial heuristic is
one backup archive `A = 2 × D + 1 GiB` and working capacity
`W = 3 × A + 2 × D + 8 GiB`. This reserves room for an archive, a separate copy,
a temporary extra copy, restore workspace and fixed headroom. These are planning
estimates, **not guaranteed archive sizes or upper bounds**: logical encoding,
compression, concurrent growth and the eventual backup/restore method change real
requirements. GiB means 1,073,741,824 bytes. No backup is made or space provisioned
by this inspection; final capacity requires owner review of the actual method.

## Exact proposed owner command — do not run before execution approval

Use native Terminal. Enter the password yourself at `Password:`; do not send it to
Codex, put it in a shell command, save it, or pipe it to psql. `-W` supplies the
ordinary psql password prompt. `-X` ignores startup files; the cleared environment
and explicit `passfile=/dev/null` prevent ambient password/service overrides.
The two client-certificate/key placeholder paths must remain absent; this command
uses password authentication and the existing CA bundle only.

```sh
(
set -eu
test ! -e /private/tmp/teka-source-inspection-no-client-cert
test ! -L /private/tmp/teka-source-inspection-no-client-cert
test ! -e /private/tmp/teka-source-inspection-no-client-key
test ! -L /private/tmp/teka-source-inspection-no-client-key
teka_sql_digest="$(/usr/bin/shasum -a 256 /Users/Apple/Documents/AppDev/Flutter/teka_edu/private/worktrees/alwaysdata-production-preparation/scripts/postgres/source-inspection.sql)"
test "${teka_sql_digest%% *}" = 29830f443a6d19b24db228864319fbb43b678c3ff5b0e6c2cec53f97224859cc
teka_ca_digest="$(/usr/bin/shasum -a 256 /opt/homebrew/etc/ca-certificates/cert.pem)"
test "${teka_ca_digest%% *}" = 2907fa07d144ade2c5afb3abaad65610ff9e88e31bb576bcb0b09ebff3b8295a
teka_client_digest="$(/usr/bin/shasum -a 256 /opt/homebrew/Cellar/libpq@17/17.11_1/bin/psql)"
test "${teka_client_digest%% *}" = 5c8893d01dc158eb701eab2a9089f334be12275d84de554cb243c9f3924abf8f
exec /usr/bin/env -i PATH=/usr/bin:/bin LC_ALL=C TZ=UTC \
  /opt/homebrew/Cellar/libpq@17/17.11_1/bin/psql -X -W -A -t -P pager=off -v ON_ERROR_STOP=1 \
  "host=db.eganrivpkjhozkkahyxy.supabase.co port=5432 dbname=postgres user=postgres sslmode=verify-full ssl_min_protocol_version=TLSv1.2 sslrootcert=/opt/homebrew/etc/ca-certificates/cert.pem gssencmode=disable connect_timeout=10 passfile=/dev/null sslcert=/private/tmp/teka-source-inspection-no-client-cert sslkey=/private/tmp/teka-source-inspection-no-client-key application_name=teka-simplified-source-inspection options='-c default_transaction_read_only=on -c row_security=off -c search_path=pg_catalog -c statement_timeout=15000 -c lock_timeout=2000'" \
  -f /Users/Apple/Documents/AppDev/Flutter/teka_edu/private/worktrees/alwaysdata-production-preparation/scripts/postgres/source-inspection.sql
)
```

The subshell exits before psql if either absence check or any SQL/CA/client digest check fails.
Before the separately approved invocation, confirm the three deployment switches are
still false, the SQL is the reviewed committed file, no source migration/content
change is running, and the native Terminal is private (no recording/screen capture).
Do not publish raw client diagnostics; report only exit status and aggregate findings. The installed native
client reports `psql (PostgreSQL) 17.11`; its SHA-256 is
`5c8893d01dc158eb701eab2a9089f334be12275d84de554cb243c9f3924abf8f`.
The CA bundle SHA-256 is
`2907fa07d144ade2c5afb3abaad65610ff9e88e31bb576bcb0b09ebff3b8295a`.
The server is required to be PG17; the dated observed server was PG17.6, so client
17.11 must not be confused with an already verified live server version.

`connect_timeout=10` bounds each connection attempt as libpq implements it. SQL
statements have 15-second server timeouts and locks have 2-second timeouts. There
is **no whole-process wall-clock deadline**: password entry, address resolution,
multiple address attempts, output/network stalls and the complete series of SQL
statements are not covered by a global timer. There is no custom supervisor. If the
owner needs a whole-process limit, agree on a simple supplied native tool/command
before executing this command. Terminal cancellation ends an unneeded invocation;
any cancellation/error/partial output is a failed inspection and is not retried.

Only a zero psql exit status and the final JSON `inspection_complete: true` marker
after ROLLBACK establish completion. Earlier output is partial evidence. This
marker records a successful limited inspection only; its
`inspection_scope: "APPROVED_41_HEAP_RELATIONS_ONLY"`, `backup_scope: "NOT VERIFIED"`,
`rebuild_scope: "NOT VERIFIED"`,
`provider_allowlist_complete: false` and `owner_namespace_classification_required:
true` fields remain mandatory. This inspection does not prove backup availability,
portable schema equivalence, restorability, complete provider/application scope,
or permission to proceed with rebuilding, recovery or deployment.

## Offline verification already performed

The generator reproduces the exact SQL and manifest from checksum-bound local
reference files. Eleven focused Python checks cover complete projections, scope
guards, duplicate/missing/mutated/null content, migration statement boundaries,
safe statement classes, lock/snapshot ordering, aggregate-only provider reads,
all-namespace classification metadata, heuristic capacity formulas and fail-closed
timeouts/completion. A separate Node implementation independently
recomputed all 36 canonical hashes and source content binding. The installed PG17.11
ECPG preprocessor accepted all 64 SQL statements offline; its generated C output was
not compiled or run. No database server or SQL execution was invoked; name/type
resolution, actual server acceptance and live content remain
unverified until the separately approved owner invocation.

The command names the isolated preparation checkout. Verify the exact committed SQL
digest before owner approval. This document does not authorize a connection.
The package replaces legacy custom supervision/encryption/repeated-review steps
for this inspection; it does not create a new authorization or backup framework.
