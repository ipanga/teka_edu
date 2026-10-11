# Alwaysdata staging-reference production cutover

Owner decision, 2026-10-11: use the accepted Alwaysdata DEV/staging canonical content
as the source reference. Supabase PROD troubleshooting is paused. Its optional CA
correction and two failed attempts remain preserved, with causes UNKNOWN. Unverified
Supabase-only changes may be absent from the new PROD; the owner accepts that limitation.
This is an execution plan, not evidence that a backup, migration or activation occurred.

## Method and source of truth

Replay the exact existing 46 PostgreSQL 16 migrations as the PROD deployment login,
then require the existing complete 36-table / 6,170-row canonical SHA comparisons,
schema/constraints/access/integrity and rollback-only idempotency verification.
Compare source and target against the same frozen canonical and schema baseline;
counts alone are insufficient. The accepted staging release remains
`813c56197f0d0fb353b39238b65c27dd08e6e5bc`; do not reset or rebuild it.

The staging custom-format dump is for recovery. Do not restore it into PROD as the
initialization method: that would introduce avoidable DEV ownership, grants, migration
target labels and environment configuration. No new migrations or educational data edits
are part of this preparation. If staging differs from the canonical baseline, stop for
classification; do not quietly choose one version or omit data.

| Purpose | Host/port                                  | Database                  | Login                          |
| ------- | ------------------------------------------ | ------------------------- | ------------------------------ |
| Source  | `postgresql-congofoot.alwaysdata.net:5432` | `congofoot_teka_edu_dev`  | `congofoot_user_teka_edu_dev`  |
| Target  | `postgresql-congofoot.alwaysdata.net:5432` | `congofoot_teka_edu_prod` | `congofoot_user_teka_edu_prod` |

Use PG16.15 clients and `sslmode=verify-full` with the existing Alwaysdata trusted CA.
The Supabase-specific CA is unrelated and must not replace the Alwaysdata trust configuration.
Keep credentials separate. Private native Terminal prompting is the simplest local route;
never reuse passwords from chat, copy GitHub secrets, or place passwords in URLs/environment
variables/scripts. The P1-A read-only login is not the deployment or full-backup login.

## Before the production-write confirmation

1. Select the reviewed release/tooling SHA with normal green CI. The exact release
   must also be used in CI evidence and the target recovery record. PR #118 is independent
   documentation/audit SQL; PR #119 does not require it to merge or run.
2. Confirm no staging database/content changes during source comparison and capture.
   Ordinary code work can continue on feature branches/develop. Keep automatic deployment
   disabled while the release is being prepared; do not hold all development indefinitely.
3. Check exact source identity, PG16/TLS, 46 migration metadata/checksums/zero pending,
   complete canonical rows, schema and access against the existing accepted checks.
   Existing managed `verify` includes rollback-only test writes: disclose that scope if
   using it. It does not rebuild/reset staging. Do not label it SELECT-only.
4. Run the production runner's read-only `preflight` as the exact PROD deployment login.
   Require reciprocal DEV/PROD CONNECT denial and the strict empty application-object/
   zero-history baseline. Accepted P1-A inventory does not prove this login's capabilities.
   Classify the previously reported routines/default ACLs with existing evidence plus
   this necessary preflight. Do not drop, whitelist or change grants to make a check pass.
   An unexpected populated target requires protection and a new scope decision, not replay.
5. Capture a standard staging database backup and a necessary PROD pre-write recovery
   snapshot. Keep any target data/objects. A snapshot alone never authorizes overwriting them.
6. Check dump completion, scope, archive integrity and independent copy, then record actual
   findings using the existing JSON evidence contract in [PRODUCTION_RUNNER.md](PRODUCTION_RUNNER.md).
   Never fill PASS records from synthetic fixtures or infer checks from a filename.

No hosted operations were performed by this preparation. Password availability, live source
comparison, target preflight and backup/copy completion are operational prerequisites.

## Standard backup and integrity procedure

Use a new private `0700` directory outside the repository and web roots on FileVault storage,
and later a new private directory on encrypted `/Volumes/VALERY`. Set `umask 077`; use
nonexistent filenames and stop on conflicts. Preserve previous backups and evidence.
Use the native owner Terminal, a clean environment and explicit non-secret connection
parameters, with `pg_dump -W --format=custom --lock-wait-timeout=5s --file=<new-private-file>`.
Use the source row above, and separately the target row for its recovery copy. Set libpq
`connect_timeout=10`, `gssencmode=disable`, `sslmode=verify-full`, explicit trusted
`sslrootcert`, and `passfile=/dev/null`; require absent client certificate/key overrides.
Do not use `--enable-row-security`, table/schema exclusions, `--no-owner`, `--no-acl`,
`--clean`, parallel jobs, `pg_dumpall` or a cross-environment restore. Dump defaults retain
database object ownership/ACL metadata for recovery without copying role passwords.

Review necessary source/target scope first. `pg_dump` stops rather than silently accepting
RLS-filtered data when full visibility is unavailable. Denied access or any warning requiring
scope classification stops acceptance. Keep private diagnostics out of Git/chat/artifacts.
No automatic retries. A failed or interrupted file is incomplete, never an accepted backup.

After successful dump exit, use the installed PG16.15 tools **without a database argument**:

```sh
/opt/homebrew/opt/libpq@16/bin/pg_restore --list "$TEKA_ARCHIVE" > "$TEKA_PRIVATE_TOC"
/opt/homebrew/opt/libpq@16/bin/pg_restore --file=/dev/null "$TEKA_ARCHIVE"
/usr/bin/shasum -a 256 "$TEKA_ARCHIVE"
```

The operator chooses new absolute paths for these non-secret variables. TOC metadata stays
private. Require both commands to succeed and inspect scope privately. Copy each required
recovery archive to a new file on VALERY; verify byte length and independently recomputed
SHA-256 after copying. Check private regular-file permissions and distinct physical storage.
Do not write anything to VALERY until the capture/copy operation is being performed.

Listing/full extraction checks archive readability, **not an actual restore**. The new receipt
records that distinction. Retain the accepted synthetic PG17 drill as historical tooling
evidence, not proof that this PG16 archive has been restored. An isolated restore of the actual
archive can provide stronger recovery evidence later; it is not silently claimed here.
These commands follow the standard [PG16 pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html)
and [pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html) behavior.

Storage observed 2026-10-11: Mac free ~14.57 GiB, FileVault enabled; VALERY free ~29.72 GiB,
APFS Encrypted on separate USB media. Do not infer actual backup size from row counts.
Before capture, measure source/target database sizes and choose a conservative archive
allowance (for example twice combined database size plus 1 GiB, a heuristic not a guarantee).
Keep at least 6 GiB Mac free throughout; reserve room for retained previous copies and
application builds. After capture, recalculate from actual archive sizes. If it does not fit,
stop for a small owner-approved capacity adjustment; never delete files or reduce retention
automatically. No plaintext extracted SQL file, custom encryption system or new infrastructure
is needed. After verified copying, the owner disconnects and stores VALERY away from the Mac.

## Two production boundaries

**Database write:** after the above evidence is real and current, present one concise
confirmation naming the exact release, PROD identity, backup/copy hashes, safe target state
and the 46 migrations. Include required bootstrap creation and subsequent managed verification
(rollback-only behavioral/idempotency test writes). Run only after that confirmation. An error
before commit uses transactional rollback; a post-commit issue requires a separate recovery
decision. Never reset or restore automatically. Repeat complete canonical/schema checks after
initialization; compare to the unchanged staging reference.

**Public activation:** use the separately approved exact application SHA promoted through
normal review/CI to `main`, site `1083500`, Node 22, `/home/congofoot/www/tekaedu-prod`,
`/usr/alwaysdata/nodejs/22/bin/node current/runtime.mjs`, and `https://tekaedu.tootiye.com`.
Freshly validate live site settings and production Environment protection/credential names
before activation; the current preparation does not claim those live checks have passed.
Only after explicit public-site approval arm the new manual-only Alwaysdata production
switch and dispatch the immutable-release workflow. Keep legacy Vercel and other switches
disabled. No runtime PostgreSQL dependency is added: lessons remain bundled content.

Use [production-application.md](production-application.md) for exact workflow inputs and
protected database receipt. No upload, pointer change or restart is performed in preparation.
After activation require exact `/api/health`, lesson content, calendar/navigation, responsive
phone/tablet/laptop-MacBook views, parent/child session/progress and application-error checks.
A healthy first PROD release may have application rollback **NOT PROVED**; do not manufacture
a distinct previous PROD release or perform an unapproved live rollback exercise.

## Browser progress, observation and development

The [local JSON transfer](../../LOCAL_PROGRESS_TRANSFER.md) preserves old-origin storage
and skips existing destination sessions. Use the old-origin console/bookmarklet exporter
without changing Vercel. Physical mobile browser restrictions still need the relevant device
check; where bookmarks cannot run, preserve the old origin and arrange an approved export
path rather than pretending progress moved. No cloud synchronization is introduced.

Propose seven days of post-activation observation. Retain Vercel/Supabase, all previous
evidence and recovery copies throughout; provider retirement is a later separate approval.
Only after staging/PROD acceptance and recovery-copy verification inventory Teka-specific
Docker cleanup candidates and sizes; separate deletion approval remains mandatory.

Production readiness must not gate unrelated development. Feature branches and `develop`
continue normal review/tests/CI. New migration/content changes during cutover require a
fresh comparison/release decision, not a staging reset or a return to Supabase troubleshooting.
