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
This supplement supersedes their UNKNOWN status only for the explicitly owner-confirmed fields.

## Classification and updated P0 checklist

| Classification    | Meaning                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| OWNER UI VERIFIED | Owner confirms a field observed in its administration interface; no independent API/SQL verification implied           |
| LIVE API VERIFIED | Direct authenticated provider API observation, with target and observation time; none added for hosting providers here |
| LIVE SQL VERIFIED | Actual authenticated database query, with DB/login/transport/time; none added here                                     |
| NOT PROVED        | Required fact or capability remains unobserved; UI labels and earlier evidence are not substitutes                     |
| PROPOSAL ONLY     | Reviewed design/queries, pending independent review and separate execution authorization                               |

| P0 item                                                      | Current classification                                 | What remains                                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| PROD site account/1083500/address/type/Node/command/workdir  | OWNER UI VERIFIED                                      | Actual artifact/runtime execution, authenticated API observation and restart capability not proved                          |
| Site Environment field                                       | OWNER UI VERIFIED: empty                               | Global/inherited assignments and actual process environment NOT PROVED                                                      |
| Hot restart / annotation                                     | OWNER UI VERIFIED: unsupported / Teka Edu - Production | No restart test or fallback service action authorized                                                                       |
| Alwaysdata product/plan/price/renewal                        | OWNER UI VERIFIED                                      | Actual usage, enforced limits and capacity headroom NOT PROVED                                                              |
| PostgreSQL host/major16/DB/login association                 | OWNER UI VERIFIED: provider configuration              | Authenticated identity, patch version, contents/schema/history/owners/extensions/functions/TLS/ACL/RLS/isolation NOT PROVED |
| Existing PROD login all-rights label                         | OWNER UI VERIFIED: provider-reported permissions       | Effective privileges, membership, ownership, SUPERUSER/CREATEDB/CREATEROLE/BYPASSRLS and DEV access NOT PROVED              |
| Suitable PROD-only audit access                              | NOT PROVED                                             | Identify existing scoped login or separately approve exact provider-supported setup                                         |
| Cloudflare zone/plan/PROD+staging records/proxy/TTL/SSL mode | OWNER UI VERIFIED                                      | Cache/WAF/redirect/origin/certificate-renewal/fallback checks NOT PROVED                                                    |
| Supabase Free/no scheduled backup shown                      | OWNER UI VERIFIED                                      | Complete source recovery package, coverage and independent copy NOT PROVED                                                  |
| Alwaysdata dated restore points                              | OWNER UI VERIFIED: includes Oct4–9                     | Database-specific contents, completeness, retention, independent copy and successful restoration NOT PROVED                 |
| Source/target recovery and measured RPO/RTO                  | NOT PROVED                                             | Separate P1-B capture/isolated restore/rehearsal approval; no recovery guarantee                                            |
| P1-A permissions/SELECT procedure                            | PROPOSAL ONLY                                          | Query proposals unchanged; no live target SQL check authorized                                                              |

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

Minimum recommendation: use an already approved **PROD-only read-only audit login** if one
meets the [P1-A contract](ALWAYSDATA_PRODUCTION_AUDIT_ACCESS.md). Its existence remains unknown.
Otherwise separately approve the candidate `congofoot_user_teka_edu_prod_audit`, target CONNECT
only, no database/TEMP/schema CREATE, no ownership or privileged membership, no DML, no elevated
role attributes, and only the specific schema USAGE/table SELECT later proved necessary.
An empty-target metadata inventory needs no app-table grants.

Alwaysdata supports per-database read-only users, but the preset adds sequence SELECT, function
EXECUTE and future defaults; saving UI/API permissions can reset custom SQL ACLs. Thus provider
support for the preset is documented, while strict custom rights/persistence and effective target
isolation in this account remain NOT PROVED. Confirm feasibility before creation; stop if it
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
unmerged reports in PR116/117. The existing P1-A design/checkpoint is revised; its two SELECT
proposal files are published byte-identically to the prior design. No scripts/workflows/migrations/
application/content/media/baselines change. No self-approval, auto-merge or dispatch.
Exact new commit/PR/CI and final GitHub guards are in the separate durable resume; older evidence
indexes (including the nine-file P1-A design archive) remain unchanged.

Initial GitHub guard: PR116 head16ce45e and PR117 head50b22f0 remain OPEN/unmerged, both develop;
all five applicable checks PASS, Promotion source SKIPPED. develop remains accepted C; main 1578847. All three deployment switches **false**, no Environment overrides or nonterminal
deployment runs. Recheck before publication and at task completion; new PR CI is separate from
historical116/117 CI and cannot be inferred from it. Vercel Git deployment remains disabled in
unchanged repository configuration. No Vercel/Supabase API/SQL or Alwaysdata API/SSH/SQL call here.

Hosting-provider/database/DNS mutations **0**; target SQL connections **0**; credentials/secrets/grants/
settings/backups/restores/restarts/deployments/pointer/switch/Environment-policy changes **0**.
Only authorized local documentation/evidence and focused GitHub branch/PR publication; no merge.
Existing CI may exercise isolated disposable test services, never the hosted PROD target. No secret
values retrieved, copied, exported or printed. Primary existing preflight edit is preserved.

## Exact next authorization and resume

Next authorized task: reconcile **non-secret owner/provider evidence** identifying an existing
PROD-only audit login and confirming target-only provider permissions/custom ACL persistence.
If none exists, present its exact setup diff for separate authorization; do not create anything.

Only after a suitable mechanism exists, a separate owner approval for the next SQL check must
say (replace identifiers only; never send values):

> I authorize one bounded, SELECT-only PROD identity/catalog check on
> postgresql-congofoot.alwaysdata.net:5432 / congofoot_teka_edu_prod, authenticated as the
> independently approved audit login [exact name], using protected credential source [identifier]
> and trusted CA [protected path/identifier], with libpq verify-full and the reviewed P1-A session
> settings. Execute only identity.sql and, after its identity/TLS gate passes, catalog.sql at the
> exact reviewed digests below, during [approved time window]. Stop on mismatch, incomplete
> visibility, unsafe effective permissions, RLS or timeout. This grants no credential creation,
> grants/role changes, data/history scans, DEV connection, writes, backup, service or deployment
> action. The existing full-rights production login is excluded.

Current candidate SQL binds `congofoot_user_teka_edu_prod_audit` (not created). An existing
different audit name requires an explicit reviewed literal change and new digest, not substitution
to the privileged production login:

```text
identity.sql SHA256: 5d8b3c25cca02b98030c10d0822347110703ff305d88edb0aaafab871ed67926
catalog.sql SHA256:  caed00e50f13468941fc9b8672ca82be546a374e8f43b6584df26db68afbe9dd
```

Approval wording is a proposal, **not authorization received in this task**. Any new protected
credential-store write and audit-account setup need distinct prior approval. Do not send secrets
in chat or retrieve GitHub staging secrets. Deployment-role authentication, full RLS-visible data
comparison, P1-B recovery, P1-C runtime/capacity, continuity, production tooling/migration/activation
and provider retirement each retain their own boundary.

Resume: [checkpoint](work/PRODUCTION_P1A_ACCESS_PLAN.md), [updated P1-A plan](ALWAYSDATA_PRODUCTION_AUDIT_ACCESS.md),
and primary `private/astra-visual-evidence/production-owner-evidence-20261009/resume.json`.
Verify indexes, current branch/PR heads/CI, preserved116/117 and all false switches first.
**STOP before any PROD connection, user/grant/secret creation, backup/restore or deployment.**
