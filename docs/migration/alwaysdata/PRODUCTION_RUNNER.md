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
- `--source-recovery-record`: `status: "PASS"`, the confirmed Supabase project/host/
  database/login, `server_major: 17`, `tls_verify_full: true`, `backup_scope_verified: true`,
  four zero counts (`auth_users`, `auth_identities`, `storage_buckets`, `storage_objects`),
  `canonical: { tables: 36, rows: 6170, exact: true }`, `original_restore_verified: true`,
  `restored_archive_sha256` equal to `archive_sha256`, and `source_frozen: true`.
  `archive_path` and `independent_path` must refer to SHA-matched copies on different
  filesystems; `independent_sha256` must equal `archive_sha256`. The owner must
  independently confirm distinct physical media with `independent_physical_media_verified: true`
  and `independent_volume: "VALERY"`; different filesystem IDs alone do not prove this.

Archives must be private regular files outside the repository/web root. SHA-256 is
checked with bounded-memory reads. Symlink leaves and changed file identity are
rejected. Keep records and archives under owner-controlled encrypted local storage;
keep the independent copy on APFS-encrypted VALERY. No additional `age` layer or new
recovery keys are required. Source scope, freeze and an **actual original-backup PG17
restore** are required; the existing synthetic recovery drill does not meet those gates.

If inspection reveals real non-canonical data, Auth/Storage usage, extra migrations,
objects or denied visibility, stop and reconcile scope. The canonical-only rebuild
must not silently overwrite or discard live source data. It does not make a PostgreSQL
17 dump directly restorable into PostgreSQL 16.

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

1. Approve and run the prepared limited source inspection; resolve any differences.
2. Confirm actual dump scope and capacity; authorize one standard PG17 custom dump.
3. Verify its independent VALERY copy and restore the original archive in the existing
   isolated PG17 recovery design; review PG16 canonical rebuild portability.
4. Resolve the exact PROD deployment-role/object/isolation baseline and snapshot gate.
5. Review/merge production preparation only when separately authorized; obtain exact
   release CI evidence, then authorize PROD preflight/apply/managed verification.
6. Separately authorize protected manual application activation and browser transfer.
   Retain Vercel/Supabase through health/smoke/rollback acceptance and later retirement approval.
