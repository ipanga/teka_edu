# P0 production readiness — owner UI evidence reconciliation

2026-10-09. **Production migration BLOCKED / NOT STARTED; P0 incomplete.** This additive
report updates the affected P0 findings without rewriting the dated evidence or changing the
open PR116/117 heads. It does not authorize PROD SQL access, roles/grants, backup/restore,
provider settings, service actions, deployment, DNS changes, promotion or retirement.

Sources: owner-supplied manual administration-interface inspection in this task; actual inspection
time was not supplied. [Structured owner evidence](migration/alwaysdata/production-owner-evidence-20261009.json)
records the non-secret values and request digest. It is an owner attestation, not an independent
API read, screenshot authentication or database observation. Earlier authoritative reports remain
pinned at [PR116](https://github.com/ipanga/teka_edu/blob/16ce45ee19e97c7b957200b60a184da67fcf5fe6/docs/ALWAYSDATA_PRODUCTION_READINESS.md)
and [PR117](https://github.com/ipanga/teka_edu/blob/50b22f0c40281960f6af71274bf9d4c1197b9787/docs/ALWAYSDATA_PRODUCTION_P0.md).
This supplement supersedes their UNKNOWN status only for explicitly owner-confirmed fields.
Later attestation: the owner created `congofoot_readonly_user_teka_edu_prod`, associated only with
`congofoot_teka_edu_prod` using the read-only preset. Creation is OWNER CONFIRMED; association
and preset are OWNER UI VERIFIED. [New audit-user evidence](migration/alwaysdata/production-audit-user-evidence-20261009.json)
records this separate provenance; the original owner-evidence JSON and old archives stay unchanged.

## Classification and updated P0 checklist

| Classification    | Meaning                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| OWNER UI VERIFIED | Owner confirms a field observed in its administration interface; no independent API/SQL verification implied           |
| LIVE API VERIFIED | Direct authenticated provider API observation, with target and observation time; none added for hosting providers here |
| LIVE SQL VERIFIED | Actual authenticated database query, with DB/login/transport/time; none added here                                     |
| NOT PROVED        | Required fact or capability remains unobserved; UI labels and earlier evidence are not substitutes                     |
| PROPOSAL ONLY     | Reviewed design/queries, pending independent review and separate execution authorization                               |

| P0 item                                                      | Current classification                                                 | What remains                                                                                                                |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| PROD site account/1083500/address/type/Node/command/workdir  | OWNER UI VERIFIED                                                      | Actual artifact/runtime execution, authenticated API observation and restart capability not proved                          |
| Site Environment field                                       | OWNER UI VERIFIED: empty                                               | Global/inherited assignments and actual process environment NOT PROVED                                                      |
| Hot restart / annotation                                     | OWNER UI VERIFIED: unsupported / Teka Edu - Production                 | No restart test or fallback service action authorized                                                                       |
| Alwaysdata product/plan/price/renewal                        | OWNER UI VERIFIED                                                      | Actual usage, enforced limits and capacity headroom NOT PROVED                                                              |
| PostgreSQL host/major16/DB/login association                 | OWNER UI VERIFIED: provider configuration                              | Authenticated identity, patch version, contents/schema/history/owners/extensions/functions/TLS/ACL/RLS/isolation NOT PROVED |
| Existing PROD login all-rights label                         | OWNER UI VERIFIED: provider-reported permissions                       | Effective privileges, membership, ownership, SUPERUSER/CREATEDB/CREATEROLE/BYPASSRLS and DEV access NOT PROVED              |
| Existing dedicated audit login                               | Creation OWNER CONFIRMED; PROD-only/read-only preset OWNER UI VERIFIED | Authentication/effective rights/TLS/DEV isolation/approved credential source NOT PROVED                                     |
| Cloudflare zone/plan/PROD+staging records/proxy/TTL/SSL mode | OWNER UI VERIFIED                                                      | Cache/WAF/redirect/origin/certificate-renewal/fallback checks NOT PROVED                                                    |
| Supabase Free/no scheduled backup shown                      | OWNER UI VERIFIED                                                      | Complete source recovery package, coverage and independent copy NOT PROVED                                                  |
| Alwaysdata dated restore points                              | OWNER UI VERIFIED: includes Oct4–9                                     | Database-specific contents, completeness, retention, independent copy and successful restoration NOT PROVED                 |
| Source/target recovery and measured RPO/RTO                  | NOT PROVED                                                             | Separate P1-B capture/isolated restore/rehearsal approval; no recovery guarantee                                            |
| P1-A permissions/SELECT procedure                            | PROPOSAL ONLY                                                          | Fixed login/query hashes revised; still PROPOSAL ONLY / NOT EXECUTED                                                        |

Accepted staging C `813c56197f0d0fb353b39238b65c27dd08e6e5bc` and A→C→A→C evidence remain
unchanged. Historical Supabase source SQL evidence (46 migrations,36 canonical tables/6170 exact
rows) remains dated source evidence in PR117, not a fresh check and not an Alwaysdata PROD state.
Nothing here converts provider configuration into LIVE SQL VERIFIED or closes global readiness.

## Exact newly supplied configuration

Alwaysdata **congofoot**, site **1083500**, `tekaedu.tootiye.com`, type `nodejs`, Node version22:

```text
command: /usr/alwaysdata/nodejs/22/bin/node current/runtime.mjs
working directory: /home/congofoot/www/tekaedu-prod
site Environment field: empty
hot restart: unsupported
annotation: Teka Edu - Production
```

All are OWNER UI VERIFIED. The empty field does not establish empty global/inherited environment.
The command text does not establish a `current` release, production-compatible runtime, successful
Node execution or app health. Last root/TLS/HTTP observations stay dated in PR117; none repeated.
Do not save or start/restart the site; later production runtime/CD is a separate P2/P3 review.

Hosting: Alwaysdata **Public Cloud**, plan label **20 GB**, **EUR132/year excluding tax**,
renewal **2027-03-03**, OWNER UI VERIFIED. This updates the previously unknown plan/billing
fields. It does not quantify disk used/free/account quota enforcement, CPU/RAM entitlement or
availability, concurrent processes/connections, OOM/resource policy or shared-site headroom.
Both staging and PROD share the **congofoot Unix account**; separate SSH credentials/roots
remain insufficient OS isolation. No paid add-on, dedicated infrastructure or billing change proposed.

PostgreSQL provider settings: `postgresql-congofoot.alwaysdata.net`, major16,
`congofoot_teka_edu_prod`, `congofoot_user_teka_edu_prod`, with owner-reported all rights.
Direct5432 is the documented provider connection mechanism, not a new owner-confirmed live SQL
port observation. SQL patch version, authenticated role and all live state remain NOT PROVED.
DEV16.15, source17.6, dump filenames and the UI association do not supply target SQL identity.

## PROD access recommendation and full-rights risk

Reserve the existing `congofoot_user_teka_edu_prod` for **separately reviewed administrative
migration operations**, after its actual attributes, ownership, grants and isolation are verified
and any necessary privilege reduction is independently approved. Do not use it for normal audit
inventory or place it in the application environment. Current bundled-content runtime needs no
administrative DB credential. The UI label indicates provider scope, not PostgreSQL superuser,
role-creation rights, ownership, RLS bypass or verified cross-database isolation.

All-rights database/schema/table/sequence/function permissions and defaults would carry broader
write/DDL/future-object exposure than an audit needs. A read-only session setting limits these
specific SELECTs but does not turn a privileged credential into least privilege. No privilege
change is performed. Full table privileges alone do not bypass RLS, so this login is not an
automatic workaround for zero-row visibility.

Use the existing **`congofoot_readonly_user_teka_edu_prod`** for the separately authorized
fixed-identity audit. The owner completed creation and reports PROD-only read-only configuration;
no new account/grant setup is proposed. Its effective rights must be compared to the strict
[P1-A contract](ALWAYSDATA_PRODUCTION_AUDIT_ACCESS.md); a preset does not prove conformance.
Target CONNECT only, no DEV/other-database CONNECT, CREATE/TEMP/schema CREATE, writes, ownership,
privileged membership, elevated attributes or grant options. Only explicitly needed safe catalog
introspection is in scope. No automatic permission correction or privileged-login fallback.

Alwaysdata supports per-database read-only users, but the preset adds sequence SELECT, function
EXECUTE and future defaults; saving UI/API permissions can reset custom SQL ACLs. Thus provider
support for the preset is documented, while strict custom rights/persistence and effective target
isolation in this account remain NOT PROVED. Report any actual preset/strict-contract discrepancy and stop for owner review; stop if it
requires changes to DEV/PUBLIC/unrelated roles or broader rights without a new impact approval.
[Alwaysdata PostgreSQL permissions](https://help.alwaysdata.com/en/docs/web-hosting/databases/postgresql/).

Preserve fail-closed RLS visibility: no BYPASSRLS, policy addition, ownership transfer or RLS
disable. The frozen36-table baseline enables RLS with zero policies; zero visible rows can hide
data. `row_security=off` raises an error when RLS would filter, not bypasses it. Metadata first;
exact existing-data/history reads need separate scope/visibility approval.
[PostgreSQL16 row security](https://www.postgresql.org/docs/16/ddl-rowsecurity.html).

## Recovery, routing and capacity checks still required

Supabase PROD **Free**, scheduled backups not included, no accessible scheduled backup shown:
OWNER UI VERIFIED. This removes the unknown plan field; it does not establish a recovery point.
Alwaysdata restore UI includes dated points **October4–9,2026**, OWNER UI VERIFIED; dates do not
identify verified recoverable PROD PostgreSQL contents, a complete retention horizon or exercised
restore permission. Keep full source recovery package, independent off-site copy, target DB backup
contents, successful isolated restore and measured RPO/RTO **NOT PROVED**. P1-B must separately
approve protected capture and isolated compatible PG17 source recovery / PG16 reconstruction.
No pg_dump, download, Restore click, backup creation or billing change here.
Supabase likewise documents owner-managed off-site exports for Free projects; documentation is
not proof of an existing package. [Supabase backups](https://supabase.com/docs/guides/platform/backups).

Cloudflare zone **tootiye.com**, **Free**, both hostnames below are proxied CNAMEs to
`congofoot.alwaysdata.net`, **TTL Auto**, encryption **Full (strict)**: OWNER UI VERIFIED.

- `staging-tekaedu.tootiye.com`
- `tekaedu.tootiye.com`

The intended PROD hostname **already points to Alwaysdata**; do not assume a future DNS record
change is necessary. Future application activation, origin/canonical/progress decisions and
traffic acceptance remain separate from DNS configuration. Inspect relevant cache/API-health
bypass, WAF, redirects, origin routing/overrides, edge+origin certificate coverage/renewal and
tested fallback/custom-domain association separately. Full (strict) UI state does not test all
origin/certificate behavior. Local browser progress remains origin-bound; continuity decision
and retained Vercel/Supabase recovery providers remain unchanged. No zone/settings mutation.

Hosting capacity: obtain current account disk quota/usage/headroom (including retained releases,
incoming/build files and other sites), enforced CPU/RAM/process/connection limits and usage,
concurrent-site headroom/OOM policy and any provider constraints on audit-user/custom ACLs.
Public Cloud/20GB/yearly price alone proves none of those current operational measurements.

## Review, validation and mutation accounting

Focused documentation-only branch `codex/production-p1a-access-plan`, based on accepted develop C.
This additive P0 supplement and owner-evidence JSON update readiness without overwriting the
unmerged reports in PR116/117. The existing P1-A design/checkpoint and fixed-login SELECT proposals are revised; old digests
are explicitly superseded. The new offline parser/fixture validator cannot connect to a database. No deployment scripts/workflows/migrations/application/content/media/baselines change. No self-approval, auto-merge or dispatch.
Exact new commit/PR/CI and final GitHub guards are in the separate durable resume; older evidence
indexes (including the nine-file P1-A design archive) remain unchanged.

Initial GitHub guard: PR116 head16ce45e and PR117 head50b22f0 remain OPEN/unmerged, both develop;
all five applicable checks PASS, Promotion source SKIPPED. develop remains accepted C; main 1578847. All three deployment switches **false**, no Environment overrides or nonterminal
deployment runs. Recheck before publication and at task completion; new PR CI is separate from
historical116/117 CI and cannot be inferred from it. Vercel Git deployment remains disabled in
unchanged repository configuration. No Vercel/Supabase API/SQL or Alwaysdata API/SSH/SQL call here.

Owner account creation is recorded independently; Codex hosting-provider/database/DNS mutations **0**; target SQL connections **0**; credentials/secrets/grants/
settings/backups/restores/restarts/deployments/pointer/switch/Environment-policy changes **0**.
Only authorized local documentation/evidence and focused GitHub branch/PR publication; no merge.
Existing CI may exercise isolated disposable test services, never the hosted PROD target. No secret
values retrieved, copied, exported or printed. Primary existing preflight edit is preserved.

## Exact next authorization and resume

The actual audit identity is now fixed. Next: independent review of PR118/current digests,
then approve secure owner-controlled local storage if needed. No credential source/CA has yet
been approved. Account creation is completed by the owner; the SQL gate is **NOT PASSED**.

Proposed subsequent authorization (fill identifiers/time only; no secret values):

> I authorize at most two bounded SELECT-only connections to
> postgresql-congofoot.alwaysdata.net:5432 / congofoot_teka_edu_prod, authenticated only as
> congofoot_readonly_user_teka_edu_prod, using approved credential source
> local-libpq:teka-prod-p1a-audit:v1 [actual protected file identifiers], trusted CA
> [absolute bundle path and reviewed SHA256], during [UTC time window]. Use verify-full and
> the reviewed read-only/row_security=off/search_path/timeout settings. Execute identity.sql
> first; only after manual identity/client TLS PASS, execute catalog.sql on the second bounded
> connection with the same settings and repeated guards. Use only the current query digests below.
> Stop for owner review on mismatch, excess effective permissions, missing visibility, RLS or
> timeout. No retries, alternate login, DEV connection, credential changes, GRANT/REVOKE,
> data/history scan, migration, export/backup/restore, service/deploy/DNS action is authorized.
> congofoot_user_teka_edu_prod remains excluded from normal audit execution.

Current proposed digests (not authorization):

```text
identity.sql SHA256: 4201f3612525a634db1b5c39a28dfc6d0c44a10f087f90dfab97e91c15e62e63
catalog.sql SHA256:  e5f576c1c6f4e88a0bea8a6fb58db7f3648c416a75e333affbe632efe4ff1943
```

Former identity digest `5d8b3c25cca02b98030c10d0822347110703ff305d88edb0aaafab871ed67926`
and catalog digest `caed00e50f13468941fc9b8672ca82be546a374e8f43b6584df26db68afbe9dd`
are **SUPERSEDED / NOT VALID FOR EXECUTION**, retained in dated evidence only. The old candidate
name is not an allowed fallback. Any credential-store creation/write needs separate prior approval;
do not send passwords or retrieve GitHub/staging secrets. Deployment-role authentication,
RLS-visible data/history, P1-B recovery, capacity/runtime, continuity and production activation
retain separate boundaries. This wording is a proposal; no SQL approval was received here.

Resume: [checkpoint](work/PRODUCTION_P1A_ACCESS_PLAN.md), [updated P1-A plan](ALWAYSDATA_PRODUCTION_AUDIT_ACCESS.md),
and primary `private/astra-visual-evidence/production-p1a-existing-audit-20261009/resume.json`.
Verify indexes, current branch/PR heads/CI, preserved116/117 and all false switches first.
**STOP before any PROD connection, user/grant/secret creation, backup/restore or deployment.**
