# P1-A catalog correction — publication checkpoint

## Current 2026-10-10 correction

This checkpoint publishes the exact independently reviewed correction. It is
preparation only: no database connection, SQL execution, permission repair,
backup, migration, deployment, restart or PR merge is authorized. PR #118 remains
draft and production migration remains **BLOCKED / NOT STARTED**.

- Current catalog SHA-256:
  `8b9d67cafaa3dc8268720f4dab72d999ce0fba20d6d5fc09fc7fb0d51f670649`.
- Previous `288442fc6bd44520e4cb0b16f6d73e64c01ad4e3e91592915958bdadb47d2bbf`:
  **SUPERSEDED FOR EXECUTION**. The earlier `e5f576c1…1943` revision and all
  consumed authorizations remain historical evidence, never reusable authority.
- Identity SHA-256 remains
  `4201f3612525a634db1b5c39a28dfc6d0c44a10f087f90dfab97e91c15e62e63`.
  The accepted identity result is retained; do not repeat that query without
  demonstrated need and separate authorization.
- Catalog guard AST SHA-256 remains
  `6450675a0db805f0b63ba2140efb12b91bfc35960e22ad492a586a1de04d38e9`.

Exactly one SQL line replaces direct `pg_catalog.pg_user_mapping` counting with
`user_mapping_metadata_status = NOT_VERIFIED`. PostgreSQL 16 restricts ordinary
access to that catalog. The documented `pg_user_mappings` view was considered
without `umoptions` but not admitted: it would add a privileged system-view trust
dependency. Neither relation nor mapping options are read by this revision.
[Catalog restriction](https://www.postgresql.org/docs/16/catalog-pg-user-mapping.html),
[system view](https://www.postgresql.org/docs/16/view-pg-user-mappings.html).

The complete direct-relation review found this upstream restriction among the
original 26 scanned system relations. The corrected query retains 25: 23 base
catalogs and the previously reviewed `pg_roles` / `pg_stat_ssl` views. Actual
provider ACLs, EXECUTE permissions and customized view definitions remain
unverified. User-mapping presence/count/absence is **NOT VERIFIED**, never zero or
proof of absence. Other metadata, identity/session/TLS guards, built-in-only
restrictions and fail-closed behavior remain unchanged. No deparsers, expression
trees, routine bodies, application relations or user-defined output functions
are introduced. The historical permission error's precise cause is still unknown.

The private supervisor, sanitizer, contract, synthetic fixtures and runtime
evidence stay outside Git. The reviewed sanitizer accepts PostgreSQL JSONB OIDs
only as canonical unsigned decimal strings; actual int2 vectors remain numeric.
Its output remains fixed sanitized statuses/counts, with no raw catalog JSON,
object names, ACLs, OIDs, credentials or arbitrary diagnostic text published.
This wire-format correction is separate from the historical permission error.

The repository validator is the reviewed version with only its original
repository-root path binding retained. It rejects both mapping relations,
`umoptions`, legacy count keys and missing/numeric/null/deceptive coverage status.
Offline validation passes PostgreSQL 16 parsing, exact guards, SELECT-only AST and
138 unsafe regressions. Private validation additionally passes 18 result-section
bindings, 40 timing groups, 95 sanitizer groups and six synthetic descriptor
groups. These tests do not execute SQL or prove hosted permissions/runtime.

Independent SQL/sanitizer **PASS WITH EXPLICIT LIMITATIONS** and complete private
supervisor **PASS** are recorded by digest in
[sanitized review references](REVIEW_EVIDENCE.json). Publishing advances the PR
head: the previous private runner's old-head binding must not be reused. A new
protected private checkpoint must bind the actual published head and pass fresh
independent review. Normal required PR CI must pass for that head separately.

After publication, read PR #118 for the exact head/checks and use the owner's
protected private resume checkpoint for final supervisor/manifest bindings.
Only after exact published bytes, private review continuity, full CI and guards
pass is the package ready for **separate execution authorization**. No UTC window
is requested or consumed by publication.

Future proposed attempt: exact audit login `congofoot_readonly_user_teka_edu_prod`
at `postgresql-congofoot.alwaysdata.net:5432`, database
`congofoot_teka_edu_prod`, client/libpq 16.15 and TLS `verify-full` with the approved
CA/service fingerprints. Password entry is owner-only private native Terminal
`psql -W`, no password file. Total limit 60 seconds requires fresh explicit owner
approval; connection 10 seconds, statement 15 seconds, lock 2 seconds, one client,
zero retries. Main deadline includes password entry and sanitization; a separate
two-second reap allowance and normal OS scheduling assumptions remain explicit.
Before any connection, recheck fingerprints/permissions/target, exact PR/head,
all three false switches, no Environment overrides or conflicting jobs, and
create a fresh single-use authorization/guard record only after owner approval.

This restricted inventory cannot establish semantic schema equivalence, exact
data/history contents, complete visibility/isolation, deployment-role login or
recovery readiness. Incomplete visibility stays NOT VERIFIED. No broader grants
or privileged-user fallback are proposed. Staging and production share the
`congofoot` Unix account; distinct SSH credentials do not provide full isolation.

## Historical 2026-10-09 restricted revision — superseded for execution

This is a SQL correction and review packet, not execution approval. PR118 stays
draft/unmerged. No PROD/DEV connection, SQL execution, grants, backups, migrations,
provider setting changes or deployments are authorized. All deployment switches stayfalse.

## Exact artifacts and review boundary

- Revised `catalog.sql` SHA256:
  `288442fc6bd44520e4cb0b16f6d73e64c01ad4e3e91592915958bdadb47d2bbf`.
- Previous catalog SHA256
  `e5f576c1c6f4e88a0bea8a6fb58db7f3648c416a75e333affbe632efe4ff1943`:
  **SUPERSEDED / NOT APPROVED FOR EXECUTION**. Preserve previous Git/private evidence.
- Unchanged `identity.sql` SHA256:
  `4201f3612525a634db1b5c39a28dfc6d0c44a10f087f90dfab97e91c15e62e63`.
- Unchanged catalog guard AST SHA256:
  `6450675a0db805f0b63ba2140efb12b91bfc35960e22ad492a586a1de04d38e9`.

The owner independently rejected the prior catalog at
`4d705f9864198eda12641ea3585a5af27c3482d5`. The successful identity-only result
remains accepted: exact PROD/audit login, server/client16.15, verify-full TLS1.3,
read-only settings, no elevated attributes, one SELECT/no retry. It need not be
repeated; a new execution window will concern the revised catalog only.

## Removal of indirect definition rendering

`pg_get_expr`, `pg_get_constraintdef`, `pg_get_indexdef`, `pg_get_triggerdef` and
`pg_get_ruledef` are absent. PostgreSQL16's expression deparser dispatches constants
through `get_const_expr()` to `OidOutputFunctionCall()`; qualifying that renderer
with `pg_catalog` does not exclude a user-defined type-output routine.
[PostgreSQL16 ruleutils.c](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/utils/adt/ruleutils.c).

`pg_get_function_identity_arguments` is removed too. Its source requests argument
formatting without defaults, but this stage has no independent approval of that
formatting chain. Direct type OIDs, argument modes/counts and return/variadic OIDs
replace the rendered signature. No `format_type`, `pg_get_functiondef`, view/partition
renderer, object-description renderer or generic `to_json*`/`row_to_json` call is added.
[Direct PostgreSQL16 routine fields](https://www.postgresql.org/docs/16/catalog-pg-proc.html).

All MD5 definition/expression/routine-body hashes are removed. Stored expression
trees are tested only with `IS NOT NULL`; they are neither deparsed, serialized nor
hashed. Routine source, library paths, trigger arguments, raw configuration values
and whole catalog rows are excluded. CTE projections enumerate required columns.

## Metadata coverage retained

| Area                   | Restricted evidence                                                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roles/memberships      | Fixed role attributes, effective MEMBER/USAGE/SET/admin and elevated reachable-role flags                                                                                              |
| Databases/isolation    | Account-scoped database identity/owners/ACLs, effective CONNECT/CREATE/TEMP for audit/PROD/DEV roles; other-database CONNECT counts without foreign database names                     |
| Schemas/relations      | OIDs/names/kinds/ownership/ACLs, privileges, RLS/force/active flags, partitions/persistence/access method; row estimates explicitly inexact                                            |
| Columns/defaults/types | Attribute/type/collation OIDs and flags, ACLs, default OID/presence; type ownership/base/element/relation OIDs and I/O routine OIDs without calling them                               |
| Constraints            | OIDs, kinds, validation/deferral/inheritance flags, column arrays, FK relation/action/operator OIDs, supporting indexes, check-expression presence                                     |
| Indexes                | OIDs, validity/readiness/live/unique/primary/exclusion/replica flags, column/collation/operator-class/options arrays, expression/predicate presence                                    |
| Triggers/rules         | OIDs, enabled/event/type/deferral flags, routine/constraint/parent references, argument counts, transition/expression-tree presence                                                    |
| Routines/extensions    | OIDs/names/kinds/language/owners/ACLs, security-definer/volatility, EXECUTE/grant options, type-OID signatures, defaults/body/configuration presence; extension identity/version/owner |
| Policies/default ACLs  | OIDs, command/permissive/role metadata, USING/CHECK presence only; explicit default ACLs and owners                                                                                    |
| Other inventory        | Ownership dependencies, migration relation candidates, inheritance, foreign-server/user-mapping/publication/large-object/event-trigger counts                                          |

## Remaining dispatch and trust assumptions

`pg_get_userbyid` performs the reviewed owner/role-name lookup, not definition or
type rendering. `has_*_privilege`/`pg_has_role` inspect ACLs/membership;
`row_security_active` checks whether RLS applies without evaluating application
policy expressions. Fixed session/connection functions and COUNT/JSON aggregation
are retained for identity and serialization.

JSON aggregation still serializes values using type-specific PostgreSQL routines.
Inputs here are only explicitly projected built-in catalog primitives/arrays,
literal text, booleans/counts and JSONB; no application datum or whole record is
provided. Type-I/O references from `pg_type` are cast from `regproc` to numeric
`oid` using PostgreSQL16's binary cast, never invoked or rendered as definitions.
The reviewer must check the complete remaining function, cast, operator and value
type path; syntactic SELECT alone is not approval.
[JSONB implementation](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/utils/adt/jsonb.c),
[binary OID casts](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/include/catalog/pg_cast.dat).

The threat boundary trusts the managed PostgreSQL16 implementation and its standard
system catalog definitions. The unchanged guard necessarily reads the reviewed
system metadata views `pg_roles`/`pg_stat_ssl`; this exception does not permit any
application view, foreign table or application data relation. No referenced application
routine, policy expression, constraint expression, index expression or trigger executes.

## Claims this inventory cannot establish

- No definition fingerprints or semantic equality of defaults, constraints,
  indexes, triggers, rules, policies or routine bodies/signatures.
- No schema equivalence, migration checksum equivalence or portability proof;
  OIDs are cluster-local identifiers and presence flags are not definitions.
- No exact data presence, emptiness or migration-history contents. RLS, missing
  visibility, zero estimates or denied access must never imply an empty target.
- No actual deployment-role authentication or DEV connection. ACL predicates
  distinguish allowed/denied CONNECT metadata from provider/HBA restrictions.
- Existing permission projection gaps remain: effective ordinary column SELECT,
  foreign-server USAGE and implicit future defaults are not fully established.
- Metadata names/ACLs/OIDs can be sensitive. Future raw output must remain private
  in memory and pass an independently reviewed sanitizer before reporting. The
  previous local supervisor pins the old digest and is not valid for this revision.

## Offline validation and next gate

Run the existing offline pglast6.16 environment, using PostgreSQL16 grammar:

```text
python -B docs/migration/alwaysdata/p1a/validate_offline.py
```

Both files are one SELECT and retain exact fixed/session guards.128 regressions
reject writes, locking, identity/TLS downgrades, removed diagnostics, indirect
renderers, raw expression/configuration/body values, unsafe casts and wildcard
catalog rows. Raw-tree presence tests remain permitted. The validator never opens
a connection, starts PostgreSQL or executes SQL; grammar success does not verify
hosted columns, privileges, execution performance or semantic safety by itself.

A fresh independent reviewer must return a verdict on the exact revised SQL digest
and current PR head, including the remaining dispatch paths and these limitations.
The authoring session does not self-approve. Only after a fresh PASS should an exact
bounded native Terminal/sanitization procedure be reviewed for the new digest and
a NEW explicit UTC authorization window requested. No window is requested now.
Production migration remains blocked by the remaining recovery/readiness gates.
