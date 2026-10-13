# PostgreSQL 16 migration transport and bounded timing

The prior driver wrote a whole migration to psql stdin, but ordinary semicolons made psql send each SQL statement separately. The frozen chain contains 2,827 source statements plus 46 history INSERTs and approximately 40 MiB. This confirms an architectural source of round-trip overhead; it does not prove the exact historical network/server stall. The October 13 failed apply and successful empty-state reconciliation remain preserved.

## Per-migration request contract

Only MIGRATION-labelled batches use the renderer. The runner supplies the exact audited 14-digit version and appends the existing history INSERT. A SQL-aware lexical pass inserts a client backslash before structural semicolons and uses one final client \g, followed by the existing nonce-bound completion marker. PostgreSQL receives the original semicolons and executes the complete migration plus history in one simple Query request. BEGIN, COMMIT and ROLLBACK remain separate, with existing acknowledgements and UNKNOWN unacknowledged COMMIT policy. No transport fallback, reconnect or retry is introduced.

The lexical pass preserves ordinary/escape/Unicode strings, quoted identifiers, dollar bodies, nested comments and UTF8. Unterminated input, invalid Unicode/NUL, inputs above8MiB, unreviewed psql controls/interpolation, transaction controls and unsupported SET/RESET/COPY operations fail closed. All46files are pre-rendered before an apply client starts. Startup pins standard_conforming_strings=on and UTF8; target/TLS/role/initialization/access checks remain intact. Frozen SQL/source/execution/adapter hashes and canonical content are unchanged. The renderer is deliberately not a complete PostgreSQL grammar parser; syntax is also validated by authentic PG16 execution.

## Sanitized observations

At most46migration records contain version/ordinal, expected statement count, input byte count, monotonic rendering/submission times, local write completion, backpressure/drain observation, batch completion-marker time and total elapsed time. No SQL, row values, object inventory, credentials or raw error text enters these records. Local write/drain completion does not prove server receipt; missing timestamps stay null. Late SQLSTATE diagnostics can enrich a generic write failure without losing its phase or migration attribution. Errors retain structured sanitization.

Client diagnostics separately record configured deadline, observed deadline firing, TERM/KILL, exit and cleanup times. The reviewed execution limits remain unchanged: connection15s, per-server-statement120s, each lock acquisition5s, explicit client deadline1800s for future separately authorized PROD apply/verify. This is an event-loop watchdog, not a hard real-time bound on synchronous local work. Deadline escalation remains TERM then KILL after250ms if alive; cleanup stays bounded.

## Native equivalence and latency evidence

The benchmark accepts only the non-secret isolated loopback teka_portability/teka_migrator fixture. It uses the existing raw QUERY path as the previous stdin framing and the new MIGRATION path as the corrected framing. A bounded local PostgreSQL protocol proxy counts frontend Query frames and hashes payloads without logging SQL/results. It injects25ms forwarding delay per Query; this models request latency, not packet loss, throughput, TLS or hosted load.

Each method runs three repetitions at0ms and25ms delay. The sample includes104SQLstatements, routines/procedural bodies, quotes/comments/Unicode and a synthetic history record. Before/after fingerprints must match, both roll back, and the corrected server payload hash must equal the original SQL with exactly one Query frame. Additional native cases verify1MiB backpressure and deliberate large-input P0001 failure with no enduring table. No temporary tests touch PROD/DEV or provider settings.

Initial local PG16.15 measurements observed104requests versus1, about2944ms versus31ms median at25ms delay. These are candidate measurements, not a guarantee or an exact-release acceptance claim. The exact committed release runs the same benchmark in CI. Replay binds its digest, clean source SHA, tooling digest and all46timing/version acknowledgements; full canonical/schema/access/integrity/idempotency/negative-test equivalence remains mandatory. Required guards now reject replay evidence missing the migration/benchmark gates.

Fresh independent review and exact-release CI/replay/benchmark artifacts must pass before another separately authorized initialization. All deployment switches remain false; publication does not authorize a database session, merge or application deployment. Existing protected backups and the accepted untested-real-restore limitation remain unchanged.

[PostgreSQL16 psql request grouping](https://www.postgresql.org/docs/16/app-psql.html) and [per-statement timeout semantics](https://www.postgresql.org/docs/16/runtime-config-client.html).
