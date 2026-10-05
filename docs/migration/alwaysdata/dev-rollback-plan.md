# Empty DEV rollback coverage for first controlled migration

Prepared 2026-10-05 for `congofoot_teka_edu_dev`, login
`congofoot_user_teka_edu_dev`, PostgreSQL16.15. PROD is excluded.

Read-only identity verification passed with `verify-full` and the system CA bundle;
actual connection TLS is enabled, public tables = 0, PROD CONNECT is denied.
The latest provider PostgreSQL backup directory contains no dump for this new database.

A separate custom-format snapshot was created through pg_dump in a protected administrative
folder, outside Git and every website directory:

```text
/home/congofoot/admin/tmp/teka-postgres-portability-bf83c3e/dev-before-migration.dump
size: 1130 bytes; mode: 0600
SHA-256: 07bd94f2de13750d13e0c6a859c9eaa57306bf183bb450f468d12232f5ebb14d
source server: 16.15; dump client: 18.4; archive format: 1.16
```

`pg_restore --list` succeeds and shows only the existing public schema, owned by the
Alwaysdata account. Full SQL extraction to `/dev/null` also succeeds. These checks verify
archive readability; they do not constitute a restore rehearsal. The archive needs a compatible
pg_restore client. No restore has been attempted against the live DEV database.

Coverage consists of the following:

1. The runner rechecks exact target identity, empty application schema, current checksums and
   history after obtaining a transaction advisory lock. It refuses unexpectedly populated DEV.
2. The current 46-migration chain, extension/bootstrap objects and history share one transaction.
   Canonical values, structural baseline, ACL/RLS and integrity assertions must pass before
   commit. A SQL/assertion error terminates the connection or explicitly rolls back. CI tests
   verify that failed transactional DDL leaves neither schema nor table behind.
3. If a later post-commit problem requires returning DEV to empty, stop use of DEV first and
   obtain separate approval for a reset. Confirm migration history/tooling identity, exactly
   the reviewed 36 application tables, their ownership and absence of subsequent non-reference
   data. Acquire the runner lock in a transaction, drop those owned application tables and the
   migration-owned private/history/extension schemas, preserving the original account-owned
   public schema and its ACL. Compare the result to the recorded empty preflight and dump
   manifest before committing the reset. Abort on any unrecognized object/data/ownership.
4. Do not run that reset automatically. The currently empty DEV has no application traffic;
   if that changes, stop and replace this plan with a tested backup/restore process. A future
   PROD migration always requires a separate tested restore rehearsal and authorization.

Operator approval of this coverage is required by the owner's migration request. Approval is
conditional on every clean PostgreSQL16 replay, integrity, access, canonical and target gate
passing. It authorizes the DEV migration only; it authorizes no application deployment, PROD
work, provider retirement or automatic post-commit reset.
