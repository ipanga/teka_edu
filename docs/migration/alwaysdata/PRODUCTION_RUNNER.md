# Production database runner preparation

Preparation only. No production connection, migration, backup, permission change or
application release is authorized by this branch. Keep the three existing repository
deployment switches false and PR #118 draft/unmerged. Preserve the accepted staging
release and Vercel/Supabase production.

The runner reuses the exact 46 frozen migrations, execution adapters, full 36-table /
6,170-row canonical comparison, source schema baseline, managed access/integrity
checks, transactional apply and rollback-only idempotency tests. It offers no reset,
overwrite, data delta importer, Auth/Storage migration or automatic retry.

## Fixed target and execution boundary

`--target production` permits only `postgresql-congofoot.alwaysdata.net:5432`,
`congofoot_teka_edu_prod`, and `congofoot_user_teka_edu_prod`, PostgreSQL 16 and TLS
`verify-full` with an explicit trusted CA. It cannot use the P1-A audit login or DEV
credentials. Every CLI command also requires `--production-approved` and a full
`--release-sha`. Approval flags prepare a future owner-authorized invocation; they
are not permission to run it now. Ambient approval cannot replace the CLI flag.

The connected role must be non-superuser, without CREATEROLE, REPLICATION or BYPASSRLS.
The fixed identity and actual TLS are checked after connection, and again under the
transaction lock before applying anything. Catalog privilege checks require both
PROD-to-DEV and DEV-to-PROD deployment-role CONNECT denial; no DEV connection is made.

A new target must have zero migration history and zero application objects in the
managed schemas, with only `plpgsql` installed. Unexpected schemas/relations/routines/
types/extensions/operators/collations/foreign servers/large objects/publications stop execution.
History must first pass a locked heap/built-in-column catalog shape check. An already
applied target is access-checked before use and receives no bootstrap/revoke repair. The P1-A limited inventory observed three routines
and one extension; those observations do **not** prove this stricter deployment-login
baseline. If those routines are in an application schema, the runner stops. Their
classification needs an owner decision before any proposed baseline adjustment;
this branch does not drop, grant, whitelist or alter them.

## Prerequisites before a separately authorized apply or verify

The CLI checks these local records **before starting psql**. Direct library apply/
verify also require them. Records are simple owner-reviewed JSON evidence, not signed
attestations or a new authorization service; truthful scope/restore approval remains
an owner/reviewer responsibility.

- `--replay-evidence`: normal PostgreSQL 16 CI PASS for the exact release SHA and
  current tooling digest, the exact 46 source/execution hashes, approved schema
  baseline, 36 tables / 6,170 rows and access/integrity/idempotency/pgTAP/negative checks,
  including `production_catalog_shapes: true` from the isolated CI fixture.
- `--rollback-record`: exact PROD database/login/release SHA, `pre_migration_tables: 0`,
  `pre_migration_history: 0`, `pre_migration_application_objects: 0`, `dump_verified: true`,
  `coverage: "atomic-apply-and-protected-empty-prod-dump"`, and `dump_path`/`dump_sha256`.
  Creating this protected target snapshot requires separate authorization.
- `--source-recovery-record`: use the owner-approved staging canonical reference
  route below. The earlier Supabase/PG17 original-backup route remains supported for
  historical compatibility, but is optional and no longer blocks this migration.

### Current source: accepted Alwaysdata staging reference

Use `source_kind: "alwaysdata-staging-canonical"`, `status: "PASS"`, the exact current
`release_sha`, host `postgresql-congofoot.alwaysdata.net`, numeric `port: 5432`,
`database: "congofoot_teka_edu_dev"`, `login: "congofoot_user_teka_edu_dev"`,
`server_major: 16`, `tls_verify_full: true`, `backup_scope_verified: true`,
`archive_format: "custom"`, `dump_client_major: 16`, `archive_verified: true`,
`canonical: { tables: 36, rows: 6170, exact: true }`, `pending: 0`, exact `migrations`
metadata matching the reviewed 46 source/execution hashes, and
`schema_baseline_comparison: true` with `schema_sha256` equal to the reviewed replay.
Set `supabase_unverified_changes_accepted: true` only with the owner's recorded
acceptance that unverified Supabase-only changes may be absent from this reference.

`archive_verified` means a successful PG16 custom dump, successful `pg_restore --list`
and full archive extraction to `/dev/null`, followed by file integrity checks. It is
**not** an original-archive restoration test. The receipt truthfully records
`source_restore_verified: false`, plus the explicit staging source kind and verified
archive/reference/accepted-omission flags. Do not manufacture a restore result.

`archive_path` and `independent_path` must refer to SHA-matched copies on different
filesystems; `independent_sha256` must equal `archive_sha256`. Confirm distinct physical
media with `independent_physical_media_verified: true` and `independent_volume: "VALERY"`.
Different filesystem IDs alone do not prove separate physical media. `source_frozen: true`
means a short, confirmed hold on staging database/content changes across comparison,
backup and final PROD comparison; it does not stop feature branches or unrelated develop work.

Archives must be private regular files outside the repository/web root. SHA-256 is
checked with bounded-memory reads. Symlink leaves and changed file identity are
rejected. Use the FileVault-protected Mac and APFS-encrypted VALERY. No `age` layer,
new encryption keys, custom audit supervisor or Supabase connection is required.

The staging dump is a recovery copy, **not input to PROD initialization**. Replay the
migrations as the PROD login so DEV credentials, ownership, history target labels and
staging-specific settings are not copied. Stop on staging drift or any unexpected
PROD objects/data. The PROD target snapshot and exact target-state gates remain mandatory.
See [STAGING_REFERENCE_CUTOVER.md](STAGING_REFERENCE_CUTOVER.md) for the operational order.

### Preserved alternative recovery evidence

The original record without `source_kind` still requires the exact Supabase PROD
project/direct host/database/login, PG17, verified scope, zero Auth/Storage usage,
complete canonical comparison, original archive restored successfully, matching restore
archive digest, source freeze and independent protected copy. No such successful source
inspection or backup exists yet. The failed attempts and optional CA correction remain
historical evidence; their consumed authorizations cannot be reused.

## Future operator procedure — do not execute yet

After separate owner approval, use a private native Terminal with PostgreSQL 16
`psql` on PATH, exact allowlisted non-secret `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`,
`PGSSLMODE=verify-full` and `PGSSLROOTCERT`. Avoid ambient service/hostaddr/options
overrides. The runner constructs its own limited environment. Use `--password` for
private native `psql -W` prompting; it rejects `PGPASSWORD` and `PGPASSFILE` overrides.
No password belongs in arguments, chat, Git or Actions logs.

Run read-only `preflight` only after its own connection authorization. Then obtain
separate guarded apply approval with the actual evidence records. Apply holds the
existing advisory transaction lock, executes migrations and pre-commit checks, and
commits once. A pre-commit error rolls back. A post-commit problem never triggers a
reset; stop for a separate recovery decision.

`verify` is a managed **rollback-only behavioral/idempotency verification**, not the
P1-A SELECT-only audit. It uses temporary assertion routines and test writes inside
rolled-back transactions and needs explicit production verification authorization.
It produces an aggregate receipt with release SHA, exact identity, 46 applied / zero
pending, exact 36/6,170 canonical comparison, schema/access/integrity/idempotency gates
and recovery archive hashes. `--output` creates a new private file without overwrite.
Production CLI errors omit private server diagnostics and inventories.

The receipt format and manual application-only activation are documented in
[production-application.md](production-application.md). Migration and application
activation are separate approvals. The application workflow never receives a database
password and never migrates a database. It accepts a SHA-pinned protected verification
receipt created only after successful managed verification.

## Remaining sequence

1. Finish review/CI of the staging-reference update; keep all deploy switches disabled.
2. Prepare a short staging DB change hold, exact source comparison and standard PG16
   backup with a verified independent VALERY copy. Preserve any necessary target
   recovery copy after fresh PROD deployment-login preflight. No Supabase audit is required.
3. Resolve any actual target baseline/isolation failure before proposing writes.
4. Obtain one owner confirmation immediately before exact PROD apply and managed
   verification; use truthful current records and release-bound CI evidence.
5. Integrate/promote the exact application release only with merge approval; obtain
   separate public-site activation approval before enabling the manual PROD workflow.
6. Validate public health, lessons/calendar/navigation/media, responsive views and
   progress transfer. Keep rollback providers for a proposed seven-day observation,
   with retirement and Docker deletion requiring later separate approval.

Production readiness is not a prerequisite for ordinary feature/develop work. Existing
staging remains accepted and is neither rebuilt nor reset by this procedure.
