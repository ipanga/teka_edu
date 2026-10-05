# PostgreSQL 16 portability runbook

This phase keeps the application's runtime independent of SQL/Supabase. Production commands
are blocked. Canonical Alwaysdata staging is **https://staging-tekaedu.tootiye.com**; the older
dotted hostname is obsolete. A verified edge TLS connection currently returns HTTP 502 because
the origin application is not yet validated/deployed. Application deployment is a later phase.

## Source and execution copies

`lib/postgres/migrations.ts` accepts exactly the 46 files/checksums in the original
[audit](migration/alwaysdata/migration-audit.json). Source bytes never change. The four entries
in `lib/postgres/adapter-rules.json` match entire known revocation blocks exactly once:

- Foundation: private-schema `PUBLIC, anon, authenticated` becomes `PUBLIC`; its reference
  table block becomes `PUBLIC`.
- Curriculum/objectives/lessons, September programme and media assets: the exact table blocks
  revoked from absent Supabase roles become table revocations from `PUBLIC`.

Private function revocations, RLS, constraints, triggers, indexes and foreign keys are preserved.
No global `anon`/`authenticated` role is created. The runner bootstraps `extensions`, `private`
and `teka_migrations`, revokes PUBLIC schema access there and installs trusted `btree_gist`
in `extensions` before the original first migration. A SQL error stops immediately. Unexpected
adapter shapes, source mutations and unreviewed extra migrations fail closed.

The current frozen chain is transactional. Explicit transaction/psql controls and known
nontransactional statements are rejected. Supporting future SQL requires reviewing the frozen
registry and runner version, not disabling this check.

## CLI and target identity

```sh
npm run db:migrate -- list --target staging
npm run db:migrate -- preflight --target staging
npm run db:migrate -- verify --target staging --output /protected/managed-dev-verification.json
```

Configure credentials outside Git and the application. Staging requires exact values:

```text
PGHOST=postgresql-congofoot.alwaysdata.net
PGPORT=5432
PGDATABASE=congofoot_teka_edu_dev
PGUSER=congofoot_user_teka_edu_dev
PGSSLMODE=verify-full
PGSSLROOTCERT=/path/to/trusted/provider-ca-bundle
```

Use `PGPASSFILE` with mode 0600, or inject `PGPASSWORD` from a secure environment. Never put
the password in arguments, reports, fixtures or artifacts. `verify-full` checks the certificate
chain and hostname; the runner also queries `pg_stat_ssl` and refuses staging without actual
TLS. The trusted CA bundle path must exist and be verified for the client being used. No
automatic downgrade to `require`, `prefer` or plaintext is permitted.

Local replay accepts only loopback, database `teka_portability` and a non-superuser
`teka_migrator`. Its service port is explicit. Production, other databases/logins, an unexpected
server identity and PostgreSQL majors other than 16 are rejected. Connection overrides such as
`PGHOSTADDR`, `PGSERVICE` and `PGOPTIONS` are not inherited. The runner owns one psql session,
so transaction/advisory locks survive between queries.

`list` and target `preflight` execute read-only transactions and create no database objects.
Preflight reports install availability/trust/CREATE privileges separately from actual install
permission, which only controlled apply proves. A target preflight does not replace clean CI
replay; staging apply independently requires replay evidence.

## History, locking and apply

`teka_migrations.history` stores version, filename, source/execution SHA-256, adapter version,
applied time, full release SHA and explicit target. History is outside the 36-table public
registry. Unknown/duplicate versions, checksum changes, missing earlier migrations and invalid
target/SHA metadata fail closed. Supabase's migration history is untouched.

Apply acquires transaction advisory lock `721304884926`, then checks server identity and reads
history again. All current pending migrations and their history rows share one transaction.
Canonical values, source-derived schema checks, ACL/RLS checks and the original integrity
assertions must pass before COMMIT. Their exercise writes use savepoints and are rolled back.
An error rolls back extension/schema/table/data/history creation together. A second apply
executes no historical migrations.

First staging apply additionally requires a reviewed PostgreSQL16 schema baseline, successful
CI evidence matching the exact checkout SHA, tooling digest and migration execution copies, and an operator-approved pre-mutation
rollback record for the still-empty DEV database:

```sh
npm run db:migrate -- apply --target staging \
  --release-sha <full-reviewed-sha> \
  --replay-evidence /protected/postgres16-replay.json \
  --rollback-record /protected/dev-rollback-record.json \
  --rollback-approved
```

The approval flag is an operator attestation, not an automatic approval. The record names the
exact database/login, confirms zero pre-migration application tables, identifies a protected
dump and its SHA-256, records successful archive verification and confirms production untouched.
Check these claims against real evidence before approving. Inspect platform backup availability
and create a protected custom-format empty-DEV dump; verify its manifest and full SQL extraction.
Failed apply rolls back its single transaction. After a successful commit, returning to empty DEV
requires a separately approved reset/restore operation; a provider backup is not assumed. A tested
restore rehearsal remains mandatory before future PROD work. Dumps stay outside Git/public paths.

## Reproducible CI and equivalent managed checks

The added `PostgreSQL 16 portability and managed equivalents` job uses a clean PostgreSQL 16
service on every considered checkout. Docker is used on the GitHub runner; no local Docker or
Alwaysdata Docker is required. Its isolated loopback-only trust connection contains no password
fixture. CI creates the dedicated migrator/probe logins and installs pgTAP in that disposable
service only. All existing required CI checks remain present and retain their names.

`npm run db:portability` replays all 46 migrations and verifies 36 canonical tables/6,170 rows
with the existing `getReferenceData`/`referenceTables` definitions plus a frozen value digest.
It checks table/column/type/default/constraint/index/trigger/RLS/policy/function/schema/extension
inventory. First replay emits a source-derived candidate schema snapshot; commit that reviewed
snapshot, then rerun CI so future replay and managed DEV compare against the fixed baseline.
Do not call final portability complete before this baseline comparison is green.

CI runs the original educational-foundation, curriculum and reference-data pgTAP suites, plus
portable access assertions using a real unprivileged probe login. It does not create Supabase
roles to run the old provider-specific RLS file. The replacement tests preserve the 36-table
registry, RLS/no-policy, table denial and private schema/function denial guarantees.

Managed DEV needs no pgTAP extension. Its temporary `pg_temp` assertion functions exercise
the original 30 foundation and 47 curriculum assertions. Canonical selected values, zero-change
re-sync, schema inventory and effective schema/table/function ACLs are checked independently.
The shared account owner's legitimate grants are allowed, but PUBLIC or other role grants on
private tables/functions/schemas are rejected. The connected DEV login must be denied PROD
CONNECT. A controlled verify runs rollback-only assertion transactions; no test rows persist.

CI also verifies lock contention, a changed history row while waiting for the lock, transaction
rollback/ON_ERROR_STOP, denied real unprivileged reads and idempotent apply/sync. Failures never
produce a successful replay report. Evidence artifacts include the tested SHA, migration hashes,
server/extension versions, canonical counts, schema digest and separate integrity/access results.

**Alwaysdata warning:** saving permissions through its panel/API can reset SQL-managed grants.
Rerun access verification after every relevant permission change. Do not assume a prior ACL
report remains valid. App rollback never automatically rolls back committed database migrations.

## Staging deployment prerequisites

Site 1083502 / `/home/congofoot/www/tekaedu-staging` remains unchanged in this phase. The future
Linux artifact carries standalone `server.js`, traced modules, `.next/server`, `.next/static`,
`public`, full release SHA, artifact SHA-256 and an accepted-media manifest. Immutable release
directories and atomic current/previous pointers support application rollback. Use managed
Node 22 with `$IP`/`$PORT`; no macOS build is deployable to this host.

Document/configure the future staging Environment securely: SSH host/login/pinned host key,
dedicated deployment key, account `congofoot`, site ID 1083502/root, the corrected staging URL,
separate PG identity/TLS/password material and a restricted restart API token. The Mac SSH key
is not automatically available to CI. No staging deploy gate or production workflow is enabled.
Existing Vercel staging alias variables must continue to serve their Vercel workflow; do not
redirect that workflow to the Alwaysdata hostname while both providers remain operational.

The frozen application's runtime SQL/Supabase variables remain unused; no migration credential
is injected there. Keep cloud sync and AI false. Later staging health must strictly report the
full intended SHA, `staging`, and a null Supabase project ref. DB verification remains separate.

## Next phase

Only after all CI portability checks, approved rollback coverage and managed DEV verification
pass: build a Linux standalone artifact and deploy the frozen candidate to Alwaysdata staging.
That application deployment requires separate authorization. PROD migration/deployment,
public cutover and Vercel/Supabase retirement remain out of scope.
