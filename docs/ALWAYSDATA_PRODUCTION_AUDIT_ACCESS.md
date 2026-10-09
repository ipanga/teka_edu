# P1-A — existing Alwaysdata PROD read-only audit login

**Current correction, 2026-10-09:** the owner accepted the successful identity-only
result (exact PROD/audit role, server/client16.15, verify-full TLS1.3, read-only
settings, no elevated attributes, one SELECT/no retry). It remains accepted evidence;
do not repeat it without demonstrated need and separate authorization.
The owner independently returned **CHANGES REQUIRED** for catalog digest
`e5f576c1c6f4e88a0bea8a6fb58db7f3648c416a75e333affbe632efe4ff1943` at PR118
head `4d705f9864198eda12641ea3585a5af27c3482d5`: definition deparsing can invoke
type-output routines indirectly. That catalog digest is **SUPERSEDED / NOT APPROVED
FOR EXECUTION**. The revised [restricted inventory review](migration/alwaysdata/p1a/REVIEW.md)
removes definition/type renderers, expression/routine hashes and raw expression values.
It requires a fresh independent exact-SQL review before any new execution-window request.
No catalog connection, credential change or provider action is authorized.
The design/observation snapshot below predates the accepted identity result; its unproved
identity/TLS rows do not revoke the later owner-accepted evidence.

**Design only, 2026-10-09. Production readiness remains BLOCKED.** No PROD connection,
account/grant/secret creation, provider setting change, backup, service action or deployment
is authorized by this plan. The SELECT files were prepared and statically reviewed, not executed
or independently approved. Offline pglast6.16 (PostgreSQL16 grammar) parses both files as
one SELECT each; AST checks reject writes, SELECT INTO, row locking and unreviewed functions.
This does not prove live catalog permissions/function signatures or client TLS. The existing migration runner still rejects production.

## Evidence and target boundary

Read both authoritative reports at their unchanged PR heads:
[PR116 readiness](https://github.com/ipanga/teka_edu/blob/16ce45ee19e97c7b957200b60a184da67fcf5fe6/docs/ALWAYSDATA_PRODUCTION_READINESS.md)
and [PR117 P0 inventory](https://github.com/ipanga/teka_edu/blob/50b22f0c40281960f6af71274bf9d4c1197b9787/docs/ALWAYSDATA_PRODUCTION_P0.md).
Neither report/checkpoint is overwritten here. The later P0 statement-representation evidence
supersedes the earlier report's unresolved history-digest observation, not original-byte provenance.

New owner inspection is reconciled in the [P0 owner-evidence supplement](ALWAYSDATA_PRODUCTION_OWNER_EVIDENCE.md).
Site1083500/Node22/command/workdir/empty site Environment, Public Cloud20GB/EUR132 ex-tax yearly,
renewal2027-03-03, Cloudflare records/Full(strict), Supabase Free/no scheduled backup shown and
Alwaysdata restore-point dates are **OWNER UI VERIFIED**, not live API/SQL observations.
Global/inherited environment, capacity, recoverable contents and live SQL state remain NOT PROVED.
The PROD hostname already points to Alwaysdata; no future DNS record change is assumed.

| Target                    | Evidence status                                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Provider account          | `congofoot` — OWNER UI VERIFIED provider association; no live API/SQL observation here                                                                                               |
| PostgreSQL host           | `postgresql-congofoot.alwaysdata.net` — OWNER UI VERIFIED; direct5432 is documented provider mechanism                                                                               |
| Database                  | `congofoot_teka_edu_prod` — OWNER UI VERIFIED configuration; authenticated SQL identity/state NOT PROVED                                                                             |
| Existing privileged login | `congofoot_user_teka_edu_prod` — OWNER UI VERIFIED association/all-rights label; actual grants/attributes/isolation NOT PROVED                                                       |
| Existing audit login      | `congofoot_readonly_user_teka_edu_prod` — account creation OWNER CONFIRMED; PROD-only association/read-only preset OWNER UI VERIFIED; authentication and effective rights NOT PROVED |
| Server version            | Major16 OWNER UI VERIFIED; exact target SQL patch version unknown (DEV16.15 is not proof)                                                                                            |
| Staging acceptance        | Historical accepted C `813c56197f0d0fb353b39238b65c27dd08e6e5bc`; not re-probed here                                                                                                 |

GitHub read at 2026-10-09T18:00:35Z: develop remains exact C; main is
`1578847d02d025286af92af48c691bbfafd84c10`. PR116 OPEN, non-draft, exact
`16ce45ee19e97c7b957200b60a184da67fcf5fe6`; PR117 OPEN/DRAFT, exact
`50b22f0c40281960f6af71274bf9d4c1197b9787`. Both target develop, unmerged, auto-merge off;
all five applicable CI jobs PASS, Promotion source expected SKIPPED:
[116 CI](https://github.com/ipanga/teka_edu/actions/runs/37846020545),
[117 CI](https://github.com/ipanga/teka_edu/actions/runs/37961705701).
`ALWAYSDATA_STAGING_DEPLOY_ENABLED=false`, `STAGING_DEPLOY_ENABLED=false`,
`PRODUCTION_DEPLOY_ENABLED=false`; no matching staging/production Environment overrides
and no active runs of the three deployment workflows. No GitHub setting was written.

## Provider-supported mechanism and least-privilege decision

Adopt the owner's existing dedicated audit login **`congofoot_readonly_user_teka_edu_prod`**.
The owner confirms account creation and dashboard association only with `congofoot_teka_edu_prod`,
using the provider read-only preset. These are OWNER CONFIRMED / OWNER UI VERIFIED, not SQL
authentication or effective-privilege proof. No new account is proposed. The fixed allowlist is
host `postgresql-congofoot.alwaysdata.net`, port `5432`, database `congofoot_teka_edu_prod`,
login `congofoot_readonly_user_teka_edu_prod`; both SQL guards use this exact literal.
There is no dynamic login selector or privileged-login fallback. Do not reuse
`congofoot_user_teka_edu_prod`, account-wide `congofoot`, DEV credentials, GitHub staging secrets
or earlier chat passwords. The owner created the account; Codex created or modified no provider resource.
See [the new audit-user attestation](migration/alwaysdata/production-audit-user-evidence-20261009.json);
the earlier owner-evidence JSON remains an immutable dated observation.

Alwaysdata offers per-database read-only user permissions. Its documented preset grants CONNECT,
schema USAGE, SELECT on tables/sequences and EXECUTE on functions, including default privileges
for future objects. It also warns that saving database-user permissions in its UI/API resets
custom SQL privileges. Thus **the preset is a candidate, not proof of the exact minimal contract**.
PROD-only selection/read-only preset are now owner-confirmed; stricter custom-rights feasibility
and persistence remain NOT PROVED. Do not save the form now.
Shared PostgreSQL catalogs can expose other tenants' database/role names; queries here restrict
named database output to congofoot and roles to the three target identities/reachable memberships.
Other database CONNECT rights are counted without naming other tenants. A nonzero count needs
provider authentication/allowlist evidence; ACLs alone cannot then prove target-only connectivity.
[Alwaysdata PostgreSQL permissions and connection documentation](https://help.alwaysdata.com/en/docs/web-hosting/databases/postgresql/).

### Exact proposed effective permissions

| Capability              | Minimum proposed contract                                                                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication          | LOGIN only; NO SUPERUSER, CREATEDB, CREATEROLE, REPLICATION or BYPASSRLS; no privileged memberships/SET ROLE/admin options                                                                               |
| Database                | CONNECT to `congofoot_teka_edu_prod`; no CREATE or TEMPORARY; no CONNECT to DEV or other account databases                                                                                               |
| Schema                  | Ordinary catalog reads need no new app-schema grant. USAGE only on an existing, explicitly approved data/history schema when needed; no CREATE                                                           |
| Table data              | No table grants for an empty-target catalog audit. Otherwise SELECT without grant option on **named reviewed ordinary heap tables only**, after separate data-scope/RLS approval                         |
| History                 | USAGE on `teka_migrations` and SELECT on `teka_migrations.history` only if present, layout/visibility verified and separately approved; never create history objects                                     |
| Sequences               | None required; no USAGE/UPDATE (which could advance/change state); no blanket sequence SELECT                                                                                                            |
| Routines/foreign access | No additional application-function/procedure EXECUTE; no foreign-server USAGE, user mappings or application views/function execution. Read only reviewed built-in catalog functions                      |
| Ownership/defaults      | Own no database/schema/table/function/other application object; no grant options; no future-object default grants. No `pg_read_all_data`, `pg_write_all_data`, `pg_monitor` or file/server/program roles |
| Writes                  | No effective table or column INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER; no schema/database/TEMP create or owner/membership-derived DDL capabilities                                               |

No GRANT/REVOKE or account-creation script is supplied for the existing user. The contract is
a comparison gate. Any discovered excess requires a separately reviewed owner-approved permission
diff; do not save the provider form, alter grants or broaden permissions to make the audit pass.

The provider preset cannot establish absence of inherited/PUBLIC/owner rights. PostgreSQL privileges are
additive: no per-user DENY overrides PUBLIC CONNECT, TEMP or routine EXECUTE. NOINHERIT also
does not prevent SET ROLE. Do not revoke PUBLIC privileges account-wide or change DEV ACLs to
make this pass: that affects other users and needs a separate reviewed impact/owner/provider
decision. Missing catalogs/insufficient visibility are NOT VERIFIED, never silently skipped.
[PostgreSQL16 privileges](https://www.postgresql.org/docs/16/ddl-priv.html),
[role privilege checks](https://www.postgresql.org/docs/16/functions-info.html).

A blanket function EXECUTE grant can expose mutating SECURITY DEFINER routines despite
SELECT-only table grants. Built-in/extension routines can also have effects (including large
object creation); a generic PostgreSQL login is not proved incapable of every possible write
merely because its database-user form says read-only. The reviewed execution contract uses
only the supplied catalog SELECTs and a read-only session; it never calls arbitrary routines.
`default_transaction_read_only=on` is defense in depth, **not an irrevocable privilege boundary**.
If the owner requires a credential intrinsically unable to perform any DDL/effect, provider
confirmation of enforceable separation is a gate; do not assert the preset meets that standard.

## Existing full-rights PROD login recommendation

Reserve `congofoot_user_teka_edu_prod` for separately reviewed administrative migration operations,
after authenticated identity, effective grants/ownership/role attributes and DEV isolation are
proved and the exact necessary permissions are reviewed. Do not use this credential for normal
read-only inventory or the bundled-content application runtime. No privilege reduction is applied.
Provider UI all rights is not proof of SUPERUSER/CREATEDB/CREATEROLE/BYPASSRLS or table ownership;
full SELECT privileges alone do not bypass RLS. An administrative read-only transaction does not
make this credential intrinsically least privilege. No fallback to this login is authorized.

## RLS and truthful data inventory

The frozen canonical baseline has36 RLS-enabled tables and zero policies. A non-owner audit
login without BYPASSRLS can therefore see zero rows even when tables contain data. Catalog
object existence, RLS flags and ACLs remain inspectable; table counts do not become trustworthy
through SELECT grants alone. Set `row_security=off` through **client connection options** to
fail closed when RLS would apply; this setting does not bypass RLS. Do not disable RLS, add a
read policy, transfer ownership, grant BYPASSRLS or join an owner role to make counts pass.
[PostgreSQL16 row security](https://www.postgresql.org/docs/16/ddl-rowsecurity.html).

- If all approved application schemas have no application relations/history tables and the
  complete visible catalog has no unexplained objects, report **no application tables/history
  exist at this snapshot**. Built-in/provider objects are classified explicitly, not called empty.
- If any table/history/data-bearing relation exists, report its existence and visibility.
  RLS-active/permission-denied counts are **NOT VERIFIED / RLS BLOCKED**. Estimates such as
  `reltuples` are not exact counts. Do not execute views, foreign tables, policies or unknown functions.
- If whole-row visibility is already proved without bypass and the exact table is approved,
  prepare scoped aggregate-only reads. Unexpected target objects/data stop migration-readiness
  acceptance and require a new scope decision. Do not automatically export rows or dump contents.
- Where RLS prevents complete inventory, separately authorize an owner-controlled SELECT-only
  session using an already entitled role, or separately design/review temporary visibility.
  Neither is part of this minimal audit-login approval. Owner-role results must name their actual
  identity and cannot be mislabeled audit-role results. FORCE RLS can constrain owners too.

## P1-A status and digest retirement

| Check                                          | Current status                                 |
| ---------------------------------------------- | ---------------------------------------------- |
| Audit account creation                         | OWNER CONFIRMED: completed by owner, not Codex |
| PROD-only database association                 | OWNER UI VERIFIED                              |
| Provider read-only preset                      | OWNER UI VERIFIED                              |
| Authenticated SQL login / server patch version | NOT PROVED                                     |
| Effective privileges / strict contract         | NOT PROVED                                     |
| Client TLS verify-full / actual session TLS    | NOT PROVED                                     |
| DEV/other database isolation                   | NOT PROVED                                     |
| Target schema/data/history state               | NOT PROVED                                     |
| Approved secure credential source / execution  | NOT APPROVED / NOT RUN                         |
| P1-A SQL gate / production readiness           | NOT PASSED / BLOCKED                           |

Current SQL proposals (not executable approvals):

```text
identity.sql SHA256: 4201f3612525a634db1b5c39a28dfc6d0c44a10f087f90dfab97e91c15e62e63
catalog.sql SHA256:  288442fc6bd44520e4cb0b16f6d73e64c01ad4e3e91592915958bdadb47d2bbf
```

The proposed name `congofoot_user_teka_edu_prod_audit` and its old digests are **SUPERSEDED;
NOT VALID FOR EXECUTION**. They remain in dated archives and the earlier evidence JSON only:

```text
superseded identity.sql: 5d8b3c25cca02b98030c10d0822347110703ff305d88edb0aaafab871ed67926
superseded catalog.sql:  caed00e50f13468941fc9b8672ca82be546a374e8f43b6584df26db68afbe9dd
superseded catalog.sql:  e5f576c1c6f4e88a0bea8a6fb58db7f3648c416a75e333affbe632efe4ff1943
```

Neither old nor current hashes grant execution permission. Offline
[validator/regression fixtures](migration/alwaysdata/p1a/validate_offline.py) use PostgreSQL16
grammar and enforce fixed identities, unchanged session guards, catalog-only relations and
an explicit safe built-in allowlist. No database driver, credentials or network operation is used.
Both queries and all127 unsafe/guard/diagnostic/indirect-rendering regressions pass offline validation. Run
`python3 -B docs/migration/alwaysdata/p1a/validate_offline.py` using the reviewed pglast6.16
environment. Local validation requires that already available environment; do not install project
dependencies or infer hosted permission/TLS proof from syntax/AST success.

## SELECT-only verification sequence (not run)

Separate connection authorization must name the exact host/port/DB/audit login, protected
credential-source **identifier**, client/TLS settings, approved SQL file digests and time window.
No secrets in chat. SQL itself cannot prove the provider account association or CA/hostname checks.

1. Reconfirm the owner-attested fixed audit user/target association and provider mechanism without saving.
   Recheck all false GitHub switches; no conflicting deployment job. Validate protected connection
   config against the exact allowlist **before opening a socket**; enforce verify-full,
   trusted CA and hostname verification; reject pooler5433, DEV/fallback
   DB, account-wide/deployment login, sslmode downgrade, ambient overrides or missing trusted CA.
2. Only after explicit approval, open the first bounded connection to direct5432 and execute
   [identity.sql](migration/alwaysdata/p1a/identity.sql) alone. Require exactly one result and
   `server_side_identity_guard=true`; record actual16.x patch version and compare provider evidence.
   Wrong version/name/role/port/settings, timeout or missing TLS stops before catalog/data reads.
   This identity phase has since succeeded and been owner-accepted; do not rerun it
   for the present correction or future catalog-only authorization.
3. Record client libpq `sslmode=verify-full`, explicit trusted `sslrootcert` and normal
   hostname verification already enforced before step2 opens a connection. Capture the non-secret
   config fingerprint, client version and successful verified connection evidence. `pg_stat_ssl` confirms encryption/cipher, **not verify-full**.
   Never use `require`, `verify-ca`, `-k`, certificate bypass or a hostname-less hostaddr override.
   [libpq TLS verification](https://www.postgresql.org/docs/16/libpq-ssl.html).
4. Execute [catalog.sql](migration/alwaysdata/p1a/catalog.sql) separately after the identity/TLS
   gate. Its single SELECT inventories roles, effective membership/SET ROLE, congofoot database
   ACLs, schemas, relations/columns/types/constraints/indexes/triggers/rules, RLS/policies,
   extension/function owners/permissions (including extension routines in pg_catalog), default
   ACLs, audit ownership, history candidates, foreign/event/large-object presence and inheritance.
   Sequence SELECT and grant options, table/column SELECT grant options, schema USAGE grant
   options, function EXECUTE grant options and reachable-role REPLICATION are now explicit.
   Defaults/checks/index expressions/trigger WHEN/rules/policies retain expression-presence
   flags only; function signatures use type OIDs and modes. Raw bodies/node trees/configuration
   values, deparsed definitions and all definition/body hashes are excluded. No definition
   equality, cross-database OID equivalence, schema equivalence or portability is established.
5. Compare effective rights against the strict contract, not just the dashboard read-only label.
   Retain actual audit/deployment/DEV CONNECT checks; PUBLIC and membership rights are additive.
   Database CREATE/TEMP, schema CREATE, table/column writes, sequence USAGE/UPDATE, ownership,
   grant options or elevated/reachable role rights must be absent. Provider preset sequence SELECT,
   broad application/extension EXECUTE or future default grants exceed this metadata-only target;
   record exact discrepancies and STOP for owner review. Reviewed built-in catalog EXECUTE is
   necessary and excluded from the prohibition on additional application-function EXECUTE.
   Do not automatically revoke or alter anything. Inspect the full visible object inventory
   against an owner-approved empty-target/provider
   baseline. Target baseline has not yet been observed. Nonempty/unexplained objects, unsafe
   privileges, unknown memberships, active RLS or incomplete visibility STOP acceptance.
   Catalog counts give existence; the plan deliberately has no automatic data scan.
6. Only after a distinct existing-data/layout/visibility approval, use the examples below for
   the approved ordinary standalone heap/history table. No dynamic SQL or `\gexec`. No pgTAP,
   fixtures, idempotent re-sync, INSERT-and-rollback probes, migration runner, EXPLAIN ANALYZE,
   nextval, application routines, foreign/view scans or advisory locks. Any exact36/6170 value
   comparison belongs to a separately approved frozen36-table/column aggregate/hash specification.

Conditional examples; **do not concatenate with the metadata script or run against missing,
RLS-active, partitioned/inherited, foreign, view or unknown-layout relations**:

```sql
SELECT pg_catalog.count(*) AS exact_rows
FROM ONLY public.education_stages;

SELECT version, filename, source_sha256, execution_sha256,
       adapter_version, target, release_sha
FROM ONLY teka_migrations.history
ORDER BY version;
```

The history example projects only reviewed non-secret metadata. Layout/ordinary-table status,
no RLS filtering, USAGE+SELECT and its scope must be proved first. Compare all returned entries
to the frozen46 source/portable checksums and adapter registry at accepted C; never use count46
alone or repair mismatches. If history is absent, report absence; do not issue this query.
Other migration tools/schemas flagged by the catalog need separate reviewed metadata projections.
Before migration an empty target can legitimately have0 history/46 pending; 46 applied/6170 rows
are staging/source evidence, **not a production pre-migration requirement**. Exact data scans
must use one approved snapshot or record drift limitations; no concurrent-mutation assumptions.

### Which identity proves which fact

| Fact                                                                   | Audit login / remaining boundary                                                                                                                                                                                                    |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database/version/authenticated audit identity/TLS cipher               | Observed after separately approved audit connection; client verify-full evidence separate                                                                                                                                           |
| Deployment role exists, attributes, owners, database/schema/table ACLs | Catalog observations only; missing role is failure, not an implicit alternate login                                                                                                                                                 |
| Audit→DEV, deployment→DEV, DEV→PROD effective CONNECT                  | Catalog `has_database_privilege` includes PUBLIC/membership. Require intended DEV and PROD records/roles present and all three cross-target checks false                                                                            |
| Provider/HBA enforcement of connection denial                          | Owner/provider configuration evidence; any other-database CONNECT count must be resolved before target-only access is accepted; catalog false is ACL evidence, not a negative live login probe. No DEV connection in this procedure |
| Deployment password authenticates / session TLS / actual current_user  | **Requires separately approved connection as deployment login**; never SET ROLE from audit to fake authentication                                                                                                                   |
| Schemas/relations/history absence                                      | Catalog snapshot with completeness/provider baseline established                                                                                                                                                                    |
| Exact data/history values under active RLS                             | Cannot be proved by this restricted login; separate trusted visibility approval required                                                                                                                                            |
| Backup/restore, source recovery, idempotency, cutover/CD               | Outside P1-A; remains BLOCKED / NOT PROVED where recorded in P0                                                                                                                                                                     |

## Concise owner procedure and authorization boundaries

**Now: preparation only.** Account creation is already OWNER CONFIRMED and the dashboard
association/read-only preset are OWNER UI VERIFIED. No account setup is requested. Reconfirm
non-secret role/target/preset evidence without saving only if it changes. Effective rights and
provider-specific constraints remain a later SQL/provider review gate; no DEV connection.

**Later authorization A — protected local storage only.** Prefer the simplest existing local
libpq mechanism: owner-controlled service/password files outside the repository and all web roots,
proposed directory `/Users/Apple/.config/teka-edu-prod-audit` (not created). Directory0700;
`pg_service.conf` and `pgpass`0600; private regular files owned by the Mac user, no symlinks.
The password file must contain just the exact host:5432:DB:audit-login entry, no wildcard:

```text
postgresql-congofoot.alwaysdata.net:5432:congofoot_teka_edu_prod:congofoot_readonly_user_teka_edu_prod:<OWNER_ENTERS_PASSWORD_SECURELY>
```

This is a documentation template, not a created credential file. Escape literal `:` and `\`
in the password according to libpq rules; never paste the password in chat, shell arguments/history,
logs, code, reports or the repository. Store through approved owner secure tooling after separate
storage authorization; Codex neither retrieves nor copies it here. No GitHub secret creation/export,
staging credential reuse, `.env` commit or shared congofoot host storage. An existing approved
macOS Keychain mechanism may be used only if it can supply libpq without exposing the value;
do not add a new credential-retrieval workflow just for this audit.
[libpq password-file format and permissions](https://www.postgresql.org/docs/16/libpq-pgpass.html).

Exact **non-secret credential-source identifier template** for later approval:

```text
credential_source_id=local-libpq:teka-prod-p1a-audit:v1
service_file=/Users/Apple/.config/teka-edu-prod-audit/pg_service.conf
service_name=teka-prod-audit
password_file=/Users/Apple/.config/teka-edu-prod-audit/pgpass
trusted_ca_path=<OWNER_APPROVED_ABSOLUTE_CA_BUNDLE_PATH>
trusted_ca_sha256=<REVIEWED_CA_BUNDLE_SHA256>
owner_uid=<APPROVED_MAC_UID>; directory_mode=0700; credential_file_modes=0600
```

All identifiers must resolve to actual approved protected files before execution; no password
value belongs in the identifier. No credential source or CA has been approved or read in this task. The existing user needs
no new provider setup; unknown effective rights are assessed without automatic changes.

**Later authorization B — bounded SELECT-only execution.** Separate approval names that
credential source, trusted CA/fingerprint, fixed host5432/DB/audit login, both current query hashes
and a time window. For the simple psql procedure below, authorize at most two short connections:
identity.sql first, then catalog.sql only after manual review of the identity/client TLS result.
Each single SELECT runs in an implicit read-only transaction because the connection starts with
`default_transaction_read_only=on`; both query guards require `transaction_read_only=on`.
No additional BEGIN/SET/SET ROLE statement or data query is bundled. The second connection
uses the same reviewed immutable service/CA/files; catalog.sql repeats all SQL session/identity
guards. It is a separate catalog snapshot, not proof of one cross-query snapshot. Reapprove file,
login, settings or digest changes; no automatic reconnection/retry.

Non-secret **service configuration template**, for later owner setup only, no password field:

```ini
[teka-prod-audit]
host=postgresql-congofoot.alwaysdata.net
port=5432
dbname=congofoot_teka_edu_prod
user=congofoot_readonly_user_teka_edu_prod
sslmode=verify-full
sslrootcert=/OWNER_APPROVED_TRUSTED_CA_PATH
connect_timeout=10
gssencmode=disable
application_name=teka-prod-p1a-audit
options=-c default_transaction_read_only=on -c row_security=off -c search_path=pg_catalog -c statement_timeout=15000 -c lock_timeout=2000
```

Only paths/service name may enter command arguments/environment: PGSERVICEFILE/PGPASSFILE,
`PSQL_HISTORY=/dev/null`. No PGPASSWORD or password-bearing URL. Use libpq with a cleared,
explicit allowlist of non-secret environment settings; no ambient PGHOST/PGUSER/PGOPTIONS,
PGSERVICE overrides, PSQLRC, pager, shell tracing or raw stderr capture. Proposed invocation
after approval: `psql -X --no-password --pset=pager=off -v ON_ERROR_STOP=1 -d 'service=teka-prod-audit' -f <identity.sql>`.
Do not run the catalog file until exactly one identity row, guard=true and successful client
verify-full/CA/hostname evidence have been reviewed. After that gate, the second invocation differs
only by `<catalog.sql>` and repeats the same cleared environment/TLS/file validation. Bound the
client lifetime to30s per connection in addition to connect_timeout10s/statement15s/lock2s;
kill only that local audit client on timeout and report NOT VERIFIED. Record UTC observation time,
non-secret config/query fingerprints and sanitized failure class; no raw stderr/credential logs.
The service/password files must be private, regular, owned by the intended Mac user; fail on
symlinks, permissive modes or missing trusted CA. Sanitize errors (transport/TLS/auth/permission/
RLS/timeout) without response bodies/credential values. Reapprove any changed login or query digest.
[libpq service parameter precedence](https://www.postgresql.org/docs/16/libpq-pgservice.html).

**Validate without writes:** inspect role flags, ownership, membership, PUBLIC/default/column
ACLs and effective privileges from the supplied SELECTs. Verify false DEV CONNECT without
attempting a DEV login. Do not test write denial with actual DML/DDL, even inside rollback.
If anything exceeds the contract, stop; correction is a new approved permission diff. A narrowly
bounded connection/query timeout stops with NOT VERIFIED; no unattended retry or provider change.

**Later authorization C — revoke temporary access.** Owner approves removal of target grants
and any temporary future grants/membership/provider association, then disabling/deleting only
the dedicated audit login if unused. Remove protected local credentials under separate owner
authorization. Account expiry alone does not terminate existing sessions; schedule closure and
confirm no audit session remains, without automatic terminate/revoke commands. Preserve shared
owner/deployment/DEV roles, ownership and grants. No DROP OWNED/CASCADE or global PUBLIC revoke.
Revocation is separate from database recovery. An existing non-temporary login is not deleted.

## Acceptance, effort, cost and residual risk

Immediate design evidence: unchanged PR116/117 and green exact-head CI, false switches/no
overrides/no active deploys, provider documentation, checked SELECT-only artifacts and preserved
history. **No live target API/SQL fact is verified by this design.** The owner-confirmed configuration is now recorded separately as OWNER UI VERIFIED. The owner-created audit login and PROD-only/read-only UI settings are known; authenticated/effective
rights, custom-permission support, secure storage, SQL execution and data visibility remain gated above.

P1-A metadata acceptance requires: independently confirmed account/host/DB/login association;
approved least-privilege mechanism; server16.x and exact audit identity; client verify-full plus
actual TLS; complete classified catalog; deployment role/grants observed; audit→DEV and both
DEV/PROD deployment-role CONNECT directions denied; other database CONNECT counts zero or
independently proved provider restrictions preventing those connections with no dangerous memberships/ownership/
PUBLIC/default rights. A provider restriction claim needs owner/provider evidence. Remaining
deployment-role authentication or RLS/full-data gaps must be listed, not treated as PASS.
Close only the database P0 facts actually proved; production readiness as a whole stays BLOCKED.

Expected scope: owner inspection15–30min; privilege/provider review30–60min if existing access
fits; bounded approved metadata verification/report30–60min; provider clarification may add
elapsed time. Estimates, not service commitments. At most two short direct connections after explicit approval; no infrastructure,
paid add-on or dedicated server proposed. Expected incremental spend **$0 if the current plan
permits the needed user/scope**; Public Cloud20GB/EUR132 ex-tax yearly is OWNER UI VERIFIED,
while actual usage/headroom and custom-permission support remain unverified. Stop for cost approval
if provider says otherwise. Existing-data/RLS remediation is outside this estimate/approval.

Staging and production share the **congofoot Unix account**: different SSH keys/users and paths
do not establish OS isolation. Keep audit credentials on the owner's protected Mac, not either
web root/server account. SQL role isolation limits DB capability, not a compromised shared Unix
owner/provider administrator. Catalog reads take brief locks/resources; use bounds and stop on
unexpected size/timeout. Provider permission saves can reset custom ACLs; freeze and recheck
approved rights immediately before any later connection. This task performs no provider action.

## Review and exact resume point

PR118 remains OPEN/DRAFT on `codex/production-p1a-access-plan`, based on accepted develop C.
The reviewed prior head is `422231be24fe22aa7105bceddadcd2ea866e192f`. This focused update changes
only P1-A documentation, fixed-role SELECT proposals and offline validation; no merge or live action.
PR116/117 heads/reports, previous indexed evidence, application/workflows/migration chain/baselines
and all deployment guards remain preserved. The previous owner-evidence JSON is dated history;
new audit-user facts/digest succession have a separate JSON attestation. No self-approval.

Next: independently review the revised exact catalog SQL in draft PR118. The accepted identity
gate is retained. Only after a fresh independent PASS may a NEW UTC window for one bounded
catalog-only connection be requested; previous identity windows and local old-digest supervisors
are invalid for this revision. No execution authority is granted by review, CI or a digest.
The existing full-rights
login is excluded. P1-A has NOT PASSED; production remains BLOCKED. No provider permission repair,
credential access/write, SQL connection, backup/restore, hosting/restart/deploy, switch, DNS or
retirement is authorized in this task. Resume from the [checkpoint](work/PRODUCTION_P1A_ACCESS_PLAN.md)
and primary `private/astra-visual-evidence/production-p1a-existing-audit-20261009/resume.json`.
Reconfirm GitHub heads/CI/false switches, query digests and historical evidence indexes first. **STOP.**
