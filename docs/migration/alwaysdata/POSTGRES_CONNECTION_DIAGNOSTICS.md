# PostgreSQL connection diagnostics and password identification

This correction is prepared offline on `codex/postgres-connection-diagnostics`, based on PR #119 head `04db0a77a434d2b8b70b2a40cdcd3a5ee75d91ad`. It does not authorize database execution. The previous failed apply and failed reconciliation remain preserved; PROD's committed state and both historical failure causes remain **UNKNOWN**. Owner-reported Internet interruptions are plausible contributing circumstances, not confirmed causes.

## Password identification

Before opening a native Terminal for each sensitive PROD operation, Codex must display the exact environment, database, PostgreSQL user, host, operation and required password type, then obtain owner readiness. The only password input is the owner's private native `psql -W` prompt. Never inspect Keychain, clipboard, Terminal contents or keystrokes; never request a password in chat or store it.

`lib/postgres/password-prompt.ts` provides explicit Alwaysdata **PRODUCTION (PROD)** and **DEVELOPMENT (DEV)** headers tied to the exact allowlisted identities. Supabase uses a separate **SUPABASE PROD/DEV** header and requires explicitly owner-confirmed non-secret parameters; no DEV identity is inferred. The production migration CLI additionally requires `READY PROD` before starting psql and repeats the header immediately before the password prompt. The readiness question is explicitly not a password prompt. It reads only the readiness response and releases its input listener before psql starts. It does not intercept the subsequent password prompt.

Interactive Session construction now fails closed without a target/operation identification callback. Noninteractive staging CI keeps its existing credential mechanism; no CI password prompt or new credential source is introduced. Historical private launchers are evidence, not approved future entry points: they are not rewritten or rerun. Future separately authorized DEV or Supabase launchers must use the explicit header and confirmed identity policy too.

## What the diagnostics prove

The existing `Session` uses one psql child, without reconnect or retry. It requests `ON_ERROR_STOP=1` and `VERBOSITY=sqlstate`. A fresh random client-side `\echo` marker precedes SQL. Receiving it acknowledges an authenticated connection reaching client command input, but does not prove server/database identity or TLS verification. Absence means **connection completion NOT VERIFIED**, not proof that a connection never existed.

Each submitted SQL operation has a fixed allowlisted label, ordinal and separate nonce-bound completion marker. Diagnostics retain only connection acknowledgement, invocation count, fixed failure category/SQLSTATE, sent/acknowledged operation identifiers, transaction control counters and child exit code/signal. No SQL text, row values, object names, ACLs, paths, connection strings or raw server errors enter this record.

Recognized categories include authentication rejection, TLS/certificate, DNS, network transport, connection timeout and SQLSTATE error. Unrecognized failures remain UNKNOWN or a client-process/exit category; these are observations, not invented root causes. SQLSTATE class 28 is classified as authentication rejection, class 08 as transport, and other observed SQLSTATEs remain explicit SQLSTATE errors. Error text is bounded to 8 KiB in memory for classification and never logged. Query output is bounded to 32 MiB; invalid JSON is reported without its contents.

| Observed phase                           | Interpretation                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `BEFORE_CONNECTION_ACK`                  | Password entry, authentication, transport or marker delivery may be incomplete; use only an observed diagnostic category. |
| `BEFORE_BEGIN_ACK`                       | A BEGIN was submitted but its completion was not acknowledged.                                                            |
| `DURING_TRANSACTION`                     | BEGIN completion was acknowledged; a later operation failed.                                                              |
| `AROUND_COMMIT`                          | COMMIT was submitted without its completion marker. Commit outcome remains UNKNOWN; never assume rollback.                |
| `AFTER_COMMIT_ACK`                       | COMMIT completion was acknowledged; a later client/reporting failure does not undo that evidence.                         |
| `AROUND_ROLLBACK` / `AFTER_ROLLBACK_ACK` | Distinguish unacknowledged rollback submission from acknowledged completion.                                              |

Acknowledgements describe submitted batches, not arbitrary intermediate statements. Main apply's separately submitted BEGIN/COMMIT/ROLLBACK are observed individually. Existing integrity suites contain internal transaction/savepoint statements inside a batch: their batch completion is observed, not every internal control statement. The handler is not an SQL parser and does not claim otherwise.

On failure, the CLI retains the stage and sanitized diagnostics rather than replacing everything with a generic production error. Cleanup waits up to two seconds for normal exit, then bounded TERM/KILL waits of 250 ms each. Unobserved exit remains unconfirmed. A normal result is not published as PASS unless client exit 0 is observed with no recorded client failure. Production result files use exclusive creation and mode 0600; a result-write failure preserves the prior file and emits the same sanitized failure record to stderr. A post-COMMIT reporting failure therefore retains the COMMIT acknowledgement.

Production `apply` and `verify` now require an explicit `--execution-timeout-seconds` value (1–3600). The proposed initialization procedure uses 1800 seconds per client. This watchdog starts immediately after the single psql child is spawned and includes its private password entry, connection and SQL work. Expiry records `CLIENT_DEADLINE`, preserves the acknowledged transaction state, sends TERM, and sends KILL after 250 ms if needed. Existing bounded close waits remain; an unobserved exit is reported as unconfirmed. This is a Node event-loop watchdog, not a hard real-time guarantee or a deadline for synchronous local preflight/result-file I/O. Operator supervision remains required.

Connection 15s, statement 120s and lock 5s policies are unchanged. Noninteractive staging and local callers retain their existing behavior unless an explicit Session deadline is supplied. There is no automatic reconnect, migration replay, destructive reset or restore, including around COMMIT. The October 12 independent review applies to the earlier diagnostic version; the new watchdog requires fresh review and CI evidence bound to its exact revised release before production use.

Initial production `apply` also requires `--initialization-only`. After acquiring the transaction advisory lock and reading guarded history, the runner requires zero applied migrations and exactly 46 pending migrations, then checks the empty-object baseline before bootstrap. Partial or completed history is rejected instead of being resumed under an initialization authorization. Staging and CI replay retain their existing behavior.

## Next separate authorization

Use the prepared [minimal native read-only state inspection](PROD_STATE_INSPECTION.md), not the migration runner, to establish the initial committed state. No full canonical comparison or migration reapply is part of that inspection. If it finds 46 history records and 36 application tables, prepare a focused read-only exact comparison. If it finds no observed committed application initialization, review the old failure evidence before considering a new apply. Any partial, unexpected or inaccessible state requires a targeted owner decision.

Offline tests use mocked child processes and synthetic outputs only. Static/simulated tests of the native psql script do not establish live execution success. The implementation uses the documented PostgreSQL 16 [psql error/conditional handling](https://www.postgresql.org/docs/16/app-psql.html) and [read-only transaction behavior](https://www.postgresql.org/docs/16/sql-set-transaction.html).
