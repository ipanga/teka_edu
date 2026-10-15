# Minimal PROD state inspection — prepared, not authorized

The failed initialization and reconciliation leave the committed PROD state **UNKNOWN**. Network instability is plausible, not established. Their consumed authorizations and original evidence remain unchanged. This package does not retry either operation and does not authorize a connection.

After a separate owner authorization, use one native PostgreSQL **16.15** `psql` process, one explicit repeatable-read **READ ONLY** transaction and zero retries. This first inspection only establishes the exact connection identity, migration-history existence/count and aggregate object counts. It does not compare canonical content, execute migrations or run behavioral/idempotency tests.

## Before opening native Terminal

Display this exact identification in chat, and ask the owner to confirm readiness for this specific operation. Never ask for the password in chat:

> **ENVIRONMENT: ALWAYSDATA PRODUCTION (PROD)**  
> Database: `congofoot_teka_edu_prod`  
> PostgreSQL user: `congofoot_user_teka_edu_prod`  
> Host: `postgresql-congofoot.alwaysdata.net`  
> Operation: one minimal read-only committed-state inspection after failed initialization  
> Password required: Alwaysdata PostgreSQL PROD password

Only after fresh authorization and readiness may native Terminal open. The owner alone enters the password into `psql -W`. Do not view/capture Terminal, use Keychain/clipboard, record keystrokes, redirect raw stderr into an artifact, or store a password. Native libpq connection errors may contain arbitrary text even with SQLSTATE verbosity; leave those private in Terminal. Only fixed phase/failure markers, aggregate output, an allowlisted diagnostic classification/SQLSTATE and client exit code/signal may enter a report. Do not copy arbitrary Terminal text into chat.

## Preconditions and fixed command

Recheck the reviewed source-code identity and this script's digest, the CA and client fingerprints, all disabled deployment switches, no Environment overrides, and absence of conflicting migrations/content changes. Preserve historical evidence and backups. Check default `.pgpass`, `.postgresql/postgresql.crt` and `.postgresql/postgresql.key` paths are absent by metadata only; stop if any exists or is a symlink. Never read them. The clean environment below discards ambient connection/service/credential overrides; `/dev/null` is an empty non-credential passfile and `-W` forces private entry.

- Client: `/opt/homebrew/Cellar/libpq@16/16.15_1/bin/psql`
- Client SHA-256: `80e90b524970537d9ff825c62ff03f1198d4c123c0e010ca20d886d8b1e42920`
- CA: `/opt/homebrew/etc/ca-certificates/cert.pem`
- CA SHA-256: `2907fa07d144ade2c5afb3abaad65610ff9e88e31bb576bcb0b09ebff3b8295a`
- Script: `scripts/postgres/production-state.psql`; its new digest must be bound to the fresh approval/review evidence.

The following is inert documentation. Do not paste/run it during preparation. Run from the exact independently reviewed checkout after the preconditions and fresh owner approval pass:

```sh
printf '%s\n' \
  'ENVIRONMENT: ALWAYSDATA PRODUCTION (PROD)' \
  'Database: congofoot_teka_edu_prod' \
  'PostgreSQL user: congofoot_user_teka_edu_prod' \
  'Host: postgresql-congofoot.alwaysdata.net' \
  'Operation: one minimal read-only committed-state inspection after failed initialization' \
  'Password required: Alwaysdata PostgreSQL PROD password'
/usr/bin/env -i \
  HOME=/Users/Apple PATH=/usr/bin:/bin LC_ALL=C TZ=UTC \
  PGHOST=postgresql-congofoot.alwaysdata.net PGPORT=5432 \
  PGDATABASE=congofoot_teka_edu_prod PGUSER=congofoot_user_teka_edu_prod \
  PGSSLMODE=verify-full PGSSLROOTCERT=/opt/homebrew/etc/ca-certificates/cert.pem \
  PGSSLMINPROTOCOLVERSION=TLSv1.2 PGGSSENCMODE=disable \
  PGCONNECT_TIMEOUT=10 PGPASSFILE=/dev/null PGCLIENTENCODING=UTF8 \
  PGOPTIONS='-c default_transaction_read_only=on -c row_security=off -c search_path=pg_catalog -c statement_timeout=15s -c lock_timeout=2s -c idle_in_transaction_session_timeout=30s' \
  /opt/homebrew/Cellar/libpq@16/16.15_1/bin/psql \
  -X -W -qAt -v ON_ERROR_STOP=1 -v VERBOSITY=sqlstate -v SHOW_CONTEXT=never \
  -f scripts/postgres/production-state.psql
teka_state_client_exit=$?
printf 'TEKA_CLIENT_EXIT_CODE=%s\n' "$teka_state_client_exit"
```

Limits: connect **10 seconds**, each statement **15 seconds**, lock **2 seconds**, idle-in-transaction **30 seconds**. These are not an overall wall-clock deadline: password entry and a stalled client can exceed them. Keep the one process supervised; stop safely if unresponsive and never retry automatically. No migration timeout settings are reused. `-X` suppresses psql startup files. The host/port/CA/`verify-full` settings bind client TLS verification; SQL separately requires the observed backend SSL state, exact database/login/session and server version. A server-side SSL flag alone cannot prove client hostname/CA verification.

## Query behavior and limits

`TEKA_PHASE_CONNECTION_ESTABLISHED` means authenticated psql reached the script; the next marker acknowledges `BEGIN ... READ ONLY`. The identity/session/TLS guard must pass before object inspection. Missing permissions produce an error and **NOT VERIFIED**, never an inferred zero.

The history-existence lookup reads system catalogs only. If the relation is absent, no history reference is parsed/executed and its count is explicitly zero. If present, the script uses `LOCK TABLE ONLY ... ACCESS SHARE` (the existing reviewed read-only locking pattern), then checks ordinary persistent heap storage, exact built-in column types, no RLS/rewrite/inheritance and SELECT/USAGE access before `count(*)`. It also rejects custom index access methods/opclasses, predicates and expressions. The lock prevents a replacement between the safety check and count. No history row values, object names, ACLs, definitions, routine bodies, user mappings or application data are emitted.

`row_security=off` does not bypass PostgreSQL RLS: queries that would be filtered fail. The history guard additionally requires RLS absent. No application tables, foreign tables or application views are scanned, and no application routines or type-output functions are invoked. This rests on the existing trusted PostgreSQL system-catalog/built-in assumptions.

Guard rejection emits a fixed `TEKA_FAILURE_*` marker followed by a deliberate `SELECT 1 / 0` **inside that psql conditional branch only**, producing SQLSTATE `22012` and nonzero `ON_ERROR_STOP` termination. In this narrow script, `22012` following one of those markers means intentional guard rejection, not a diagnosed application error. Permission errors, timeouts and other failures retain their actual SQLSTATE when available. Do not assume any failed query completed.

Accept complete inspection only with **client exit 0**, the aggregate inventory record, `TEKA_PHASE_READ_ONLY_ROLLBACK_ACKNOWLEDGED` and final `TEKA_INSPECTION_COMPLETE`. Missing records/markers or a nonzero exit mean **NOT VERIFIED**. Output before a later failure is preliminary; it does not establish overall completion.

## Decision after the separately authorized inspection

| Observed aggregate state                                                                                                                                                                                      | Safe conclusion and next action                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No history relation/records; zero non-system relations, routines, types and other objects; only the baseline public schema and PL/pgSQL extension; no foreign wrappers/servers, large objects or publications | No observed committed application initialization in this snapshot. Preserve UNKNOWN historical cause; review diagnostic evidence before proposing another apply. This is not a blanket claim that every possible PostgreSQL object category or provider datum is absent. |
| 46 history records and 36 public application tables, expected schema/extension presence, no unexpected schema/extension count                                                                                 | Initialization is a **candidate**, not yet verified. Prepare a separately authorized focused read-only history-checksum/canonical/schema/RLS comparison. Do not rerun migrations.                                                                                        |
| Partial counts, inaccessible/unsafe history, unexpected objects, failed identity/session/TLS, or incomplete output                                                                                            | Stop; report only aggregate differences/NOT VERIFIED and propose a targeted decision. No reset, restore, repair or retry.                                                                                                                                                |

Counts cannot prove correct migration versions/checksums, zero pending migrations, 6,170 exact rows, constraints, RLS across the canonical tables, object ownership/access, extension compatibility or complete DEV/PROD isolation. Those follow only if the initial state supports the separately approved next check. No preparation or native connection execution is performed by the offline tests.

PostgreSQL 16 reference: [psql options, conditional processing and error handling](https://www.postgresql.org/docs/16/app-psql.html).
