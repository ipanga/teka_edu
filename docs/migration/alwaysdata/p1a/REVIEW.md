# P1-A restricted catalog revision — fresh review required

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

Both files are one SELECT and retain exact fixed/session guards.127 regressions
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
