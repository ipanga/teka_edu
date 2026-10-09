# Alwaysdata production P0 inventory — 2026-10-09

**Authorized read-only work complete within available access; P0 remains INCOMPLETE and
production migration remains BLOCKED / NOT STARTED. P1 is proposed, not executed.**

This supplement preserves the [authoritative audit at the reviewed PR #116 head](https://github.com/ipanga/teka_edu/blob/16ce45ee19e97c7b957200b60a184da67fcf5fe6/docs/ALWAYSDATA_PRODUCTION_READINESS.md)
and its historical evidence. PR #116 is neither modified nor merged. New sanitized findings
are in [the P0 evidence summary](migration/alwaysdata/production-p0-20261009.json).
Dates use Africa/Lubumbashi; evidence timestamps use UTC. No restricted dashboard was accessed
again through another browser, automation method, cookies or credential extraction.

## 1. Verified/unverified checklist

A percentage would imply that missing critical gates are interchangeable with completed reads.
The following checklist makes the remaining access and approval boundaries explicit.

| Requirement                                                       | Status                              | Evidence / remaining boundary                                                        |
| ----------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| PR #116 exact head, develop/main and CI                           | VERIFIED                            | Unchanged reviewed head; four branch-required checks and additional PG16 check green |
| Deployment switches / overrides / active deploy jobs              | VERIFIED                            | Three repository values false; no Environment overrides or active deployments        |
| Staging C health/current/previous/manifests                       | VERIFIED                            | HTTP200 at C; current C / previous A; A/B/C manifests intact                         |
| Existing Vercel production health/deployed SHA                    | VERIFIED                            | Public health and authenticated deployment metadata agree                            |
| Alwaysdata PROD root and account filesystem identity              | VERIFIED                            | Pinned SSH, congofoot, exact empty root, mode0770                                    |
| PROD site account/ID/address/Node.js type                         | PRIOR VERIFIED                      | 2026-10-08 admin Sites-list evidence retained; no fresh configuration GET            |
| Exact live PROD Node/workdir/command/environment/restart scope    | NEEDS OWNER EVIDENCE                | Restricted browser; no approved local PROD API mechanism                             |
| Target PROD SQL identity/state/TLS/ACL/isolation                  | NEEDS SEPARATE ACCESS AUTHORIZATION | No approved least-privilege read-only connection; no connection attempted            |
| Source PG17.6 / 46 history versions and names                     | VERIFIED                            | Explicit Supabase PROD SELECTs; DEV link unchanged                                   |
| Source stored statement representation hashes                     | VERIFIED                            | All46 match independently reconstructed repository representations                   |
| Original source SQL file bytes from stored history                | NOT PROVED                          | Original statement delimiters/boundary whitespace are not retained                   |
| Local frozen source/portable execution hashes                     | VERIFIED LOCALLY                    | 46 audited files; four reviewed adapters; not a PROD execution claim                 |
| Source36 tables /6170 canonical values / schema / ACL             | VERIFIED                            | Exact reference comparison; no catalog/ACL drift since prior audit                   |
| Source Auth / Storage aggregate usage                             | VERIFIED                            | Users, identities, buckets, objects all zero; no private records exported            |
| Provider backup availability/permissions metadata                 | PARTLY VERIFIED                     | Supabase metadata and Alwaysdata file metadata only                                  |
| Backup contents, independent package, restore, RPO/RTO            | NOT PROVED                          | Dumps/downloads/restores not authorized; no recovery point assumed                   |
| Cloudflare public TLS/response observations                       | VERIFIED                            | Normal chain/hostname validation; target502 response not cached in this observation  |
| Actual DNS origins/TTL/SSL mode/cache/WAF/redirect/fallback rules | NEEDS OWNER EVIDENCE                | No approved Cloudflare dashboard/API read access                                     |
| Actual account CPU/RAM/disk/process quotas/plan                   | NEEDS OWNER EVIDENCE                | Session rlimits are observed; plan entitlements are not inferred                     |
| Local-progress schema and origin continuity risk                  | VERIFIED / DECISION PENDING         | Export/import absent; family usage unknown                                           |
| Production credential/CD/recovery architecture                    | PROPOSAL ONLY                       | No provisioning, configuration, implementation or activation                         |

## 2. PR #116 and protected branches

PR [#116](https://github.com/ipanga/teka_edu/pull/116) remains OPEN, unmerged, without auto-merge,
targeting develop at exact reviewed head `16ce45ee19e97c7b957200b60a184da67fcf5fe6`.
Develop is `813c56197f0d0fb353b39238b65c27dd08e6e5bc`; main is
`1578847d02d025286af92af48c691bbfafd84c10`. No branch promotion occurred.
CI [37846020545](https://github.com/ipanga/teka_edu/actions/runs/37846020545) has all five
applicable jobs PASS. Promotion source is expected SKIPPED for this develop-targeted PR.
Four jobs are currently required by the develop branch rules; PostgreSQL16 portability is an
additional passing check. These facts must be revalidated before any future integration.

`ALWAYSDATA_STAGING_DEPLOY_ENABLED`, `STAGING_DEPLOY_ENABLED` and
`PRODUCTION_DEPLOY_ENABLED` are all **false**. There are no overriding Environment values,
and no queued/running/waiting/pending/requested deployment workflow jobs were found.
Staging Environment remains develop-only; production remains main-only with one required
reviewer and `prevent_self_review=false`. No policy, variable or secret changed.

## 3. Current staging and production health

| Target                   | Current evidence                                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Alwaysdata staging       | HTTPS200, status ok, environment staging, exact C `813c56197f0d0fb353b39238b65c27dd08e6e5bc`; health no-store, Cloudflare DYNAMIC               |
| Staging pointers         | current=C; previous=A `8b4667d529f906906b3d40f6cabbcde234f4cb33`; distinct B `553e3e9cbaa4ba2d9b131c00441e5ca17cd2764a` retained                |
| Release integrity        | A/B/C each1426 manifest-verified files; no unexpected or incoming release directories                                                           |
| Existing Vercel PROD     | HTTPS200, status ok, environment production, SHA `81b759ffe7ffb8d6bc44a6b3774dd81e4a4c7d05`, Supabase PROD ref `eganrivpkjhozkkahyxy`, no-store |
| Vercel identity          | Deployment `dpl_HkEkuSvjzXs5wkh6aW7GtHnxyZkL`, production READY; project `prj_cJcoXbMF0fi3Uf4SejFnRH6uCmph`, container, cdg1, Git link null     |
| Proposed Alwaysdata PROD | Edge and direct-origin HTTPS502 with valid TLS; no approved application release installed                                                       |

Accepted staging run [37835289864](https://github.com/ipanga/teka_edu/actions/runs/37835289864)
and the actual A → C → A → C rollback proof are preserved. This P0 audit did not repeat a
restart/rollback sequence or device smoke suite. Staging acceptance is unchanged.
A Python Vercel metadata GET returned403; the existing approved CLI and normal curl metadata
GETs succeeded. No browser workaround or token copy/export was used; public health independently
proved the running SHA. A healthy HTTP read is not a new full regression test.

## 4. Alwaysdata site1083500 configuration evidence

| Field                                  | Evidence / status                                                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account / site / hostname / type       | Prior Sites-list observation: congofoot /1083500 /tekaedu.tootiye.com /Node.js; retained dated evidence, not a fresh detailed GET                             |
| Expected working directory             | `/home/congofoot/www/tekaedu-prod`; filesystem exists, exact resolved directory; live site workdir NOT VERIFIED                                               |
| Root state                             | congofoot owner,0770, readable/writable/searchable; zero entries; no current/previous or credential-like files                                                |
| Exact Node setting / command           | NOT VERIFIED; staging Node22/path success is not proof of PROD configuration                                                                                  |
| Site and inherited environment names   | NOT VERIFIED; root emptiness does not prove absence of configured/inherited credentials                                                                       |
| Forbidden assignments                  | NOT VERIFIED for runtime; owner must attest absence of DB/PG/Supabase/Vercel administrative assignments without disclosing values                             |
| Site-specific restart permission/scope | NOT PROVED; no API token or restart POST used for this production site                                                                                        |
| TLS                                    | Normal certificate-chain and hostname validation PASS at edge and direct `185.31.40.13`; origin cert valid Oct4 2026–Jan2 2027; edge cert Oct5 2026–Jan3 2027 |
| Isolation                              | PROD/staging have separate paths but the same Unix owner congofoot; this is not an OS security boundary                                                       |

The provider documents the site-specific restart endpoint. Node.js site identity must be
confirmed before relying on this scope: Apache-backed sites can restart other Apache sites
in the account. Configuration form changes can themselves restart a program, so owner inspection
must not save or click restart. [Alwaysdata restart documentation](https://help.alwaysdata.com/en/docs/web-hosting/sites/restart-a-site/)

## 5. Alwaysdata PROD database identity/state

Expected host `postgresql-congofoot.alwaysdata.net`, database `congofoot_teka_edu_prod` and
login `congofoot_user_teka_edu_prod` remain **expected identities only**. No documented,
already approved least-privilege PROD read-only mechanism was found. Relevant local environment
names are absent and the GitHub production Environment has no dedicated Alwaysdata PROD
credentials. Existing Supabase/Vercel production credentials do not grant target access.
The earlier chat password is not authorization for a least-privilege audit connection.

**No target connection was attempted.** Version, current database/login, verify-full TLS,
ownership, schemas/tables/extensions/rows/history/roles, unexpected objects/data and reciprocal
DEV/PROD access denial are all NOT VERIFIED. Accepted staging evidence previously proved DEV
CONNECT denial to PROD; this task did not re-execute that check, and it does not prove the
production login cannot reach DEV. A PROD-named backup file cannot establish these facts.

Owner must identify an existing protected read-only mechanism and explicitly authorize its
scope, or separately authorize a narrowly scoped audit role/access preparation under P1-A.
Do not send a password/token/key in chat. A dedicated audit login would prove its own login
identity and inspect the expected deployment role in catalogs; it must not be mislabeled as a
connection authenticated as `congofoot_user_teka_edu_prod`.
RLS-filtered zero counts must never be accepted as proof that a database is empty. Approved
read visibility must be established separately; do not disable RLS or grant blanket bypass to
make an inventory pass.

## 6. Source PROD history and canonical verification

Explicit native Supabase CLI reads targeted PROD `eganrivpkjhozkkahyxy`; the primary local
DEV link `quyhkkizsmosybavoewd` remained unchanged. Source is PostgreSQL17.6. There are46
expected versions/names, zero pending/extra versions,36 canonical public tables and6170
exact canonical row values. Auth users/identities and Storage buckets/objects remain zero.
No DML fixtures, user exports or history repair were run.

| Comparison                           | Result / precise meaning                                                                                                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version/name registry                | 46/46 exact; necessary but insufficient by itself                                                                                                                                                                 |
| Stored statement digests             | Fresh MD5 and SHA256 of LF-joined stored statements recorded; digests alone are not source-file checksums                                                                                                         |
| Independent statement reconstruction | Diagnostic lexer preserves comments, literals, quoted identifiers and dollar bodies; removes only top-level semicolon terminators and trims boundary whitespace; count + SHA256 match46/46 stored representations |
| Exact original source bytes          | 0/46 whole-file hashes equal the stored join; original boundary whitespace/terminators are lost; exact original file bytes NOT PROVED from history                                                                |
| Frozen repository source             | 46 SHA256 values match the reviewed migration audit; `loadMigrations()` passes without SQL execution                                                                                                              |
| Portable execution                   | 46 execution hashes recorded;4 files use reviewed adapter `postgres16-public-revocations-v1`; digest binds current reviewed runner/assertions/baseline; not executed against PROD                                 |

The previously unresolved digest comparison is now explained and verified at the **statement
representation** level. There is no mismatch in that comparison, and no new SQL drift evidence.
It cannot prove the identity of the original historical input file or eliminate the possibility
of an earlier manual history alteration. The private diagnostic lexer is retained with its SHA256;
it is never migration execution tooling and is not integrated as an application/code change.

Canonical comparisons use only the frozen reference columns and row multisets, retaining counts
and hashes rather than response rows. Source schema catalog and ACL are byte-for-byte equal as
structured JSON to the prior audit:36 RLS-enabled tables,2 private functions,41 ACL objects,
594 grants. Table/function baseline comparison from the prior audit remains valid with no drift.
Provider roles and PG17 MAINTAIN privileges still require reviewed mapping to portable PG16;
matching source ACL does not establish target ACL. No hosted idempotency/fixture writes were used.

## 7. Backup/recovery inventory

| Item                                  | Verified metadata / limitation                                                                                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase PROD                         | Backups list null; physical_backup_data empty; PITR=false; WAL-G=true; eu-west-3                                                                                       |
| Source recovery point                 | No accessible listed recovery point or owner-managed offsite package verified; WAL-G=true does not prove restorability                                                 |
| Source plan/retention/access controls | Current plan, retention entitlement, backup ownership/restore permissions, offsite encryption/retention/cost remain owner evidence                                     |
| Alwaysdata location                   | `/home/congofoot/admin/backup/<date>/postgresql/congofoot_teka_edu_prod.sql.zst`; latest alias available; bounded metadata inspection only                             |
| Target-named files                    | Oct6–9 four dated files,727/729/729/727 bytes; latest dated mtime Oct8 23:31:52 UTC; thirty date-shaped backup directories observed across the account                 |
| Permissions                           | Files root-owned0666; /home/congofoot root-owned01770; admin0755; PostgreSQL directory0770. Backup/latest symlinks lstat0777 are not effective directory access rights |
| Contents/hash/restore                 | File contents not opened/downloaded/hashed; schema/data/login coverage unknown; no independent protected target recovery package or tested restore                     |
| Retention/plan                        | Actual account plan and promised retention unverified; observed directories are not a retention guarantee                                                              |

Provider capability references: Alwaysdata documents daily file/database/email backups,
plan-dependent3/7/20/30-day retention, separate-datacenter storage and backup space excluded
from disk quota. This does not validate these four files or establish congofoot's entitlement.
[Alwaysdata backups](https://help.alwaysdata.com/en/docs/web-hosting/backups/)

Supabase documents physical backups on newer PostgreSQL builds, accessible daily backups on
paid plans, offsite logical exports for free projects, omitted custom-role passwords and omitted
Storage object bytes. Live plan/access is unverified. [Supabase backups](https://supabase.com/docs/guides/platform/backups)
PITR is a separately billed add-on; published7-day pricing is approximately$100/month plus
other plan/compute costs and is not covered by the spend cap. No upgrade/add-on is proposed as
an automatic action. [PITR pricing](https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery)

**All source/target restoration, measured RPO and measured RTO remain NOT PROVED.**
No dump, download, storage provisioning, backup creation, restoration or production recovery was run.

## 8. Cloudflare inventory

Public answers show proxied edge IPs for the production hostname and provider address
`185.31.40.13` for congofoot.alwaysdata.net. They do not prove the configured CNAME/content,
origin pool, proxy setting or TTL. The user's earlier screenshot is historical supplied context,
not a fresh zone inventory. Edge and direct-origin normal TLS validation pass. The observed502
health response has private/no-store/no-cache headers; no usable application health exists at
the proposed PROD origin. Staging health is no-store/DYNAMIC, which is not evidence of PROD
cache rules. Certificate renewal automation and future application cache behavior are unverified.

No approved Cloudflare read-only dashboard/API mechanism is available. DNS records/origins,
proxy/TTL, SSL mode, edge/origin renewal settings, cache/WAF/redirect/health bypass rules,
origin fallback association and the complete list of unrelated tootiye.com sites remain unknown.
No inferred record is proposed for execution. Full(strict) requires a valid matching origin
certificate; today's certificate alone does not prove that mode is configured.
[Cloudflare Full(strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)

## 9. Actual hosting capacity and limitations

SSH session limits are CPU/address-space unlimited at the Unix rlimit layer, NPROC8192 and
NOFILE65536. Shared filesystem available space was608828391424 bytes. **These are not
account CPU/RAM/disk entitlements, available production headroom or web-worker limits.**
No load test or scan of unrelated application data was performed.

Actual congofoot plan, used/allowed disk including release retention/build scratch, RAM/CPU
limits and usage, OOM behavior, concurrent process/request limits, application sleep/start policy,
bandwidth/connection quotas and billing are NOT VERIFIED. Staging, PROD and unrelated sites
share account resources; standalone releases should be built in GitHub, not on the hosting account.
Capacity acceptance must reserve room for current+previous+one incoming release and safe logs.
Provider Advanced>Resources configuration is documented for **Private Cloud only**; for a Public
Cloud plan obtain the subscription/usage limits or a non-secret provider support confirmation.
[Alwaysdata resource limits](https://help.alwaysdata.com/en/docs/technical-specifications/system-resources-alerts-and-limitations/)

## 10. Browser-progress continuity recommendation

Current code stores `teka-edu.session.v2.<encoded-school-year>.<encoded-level>.<day>.<field>`
for progress, position, observation and updatedAt. Running older Vercel PROD may lack updatedAt;
the importer must support that explicit legacy version without inventing timestamps. Progress
has3 allowed states; position must be a safe nonnegative index inside the session activity count.
Day-only legacy keys cannot safely identify year/class and remain untouched. There is no existing
export/import or cloud sync. Zero Auth users does **not** mean zero families with local progress.

**Recommendation / separate product decision:** make local continuity a cutover gate. Provide
an explicitly user-triggered, versioned JSON export at the old origin and import at the new one,
unless the owner knowingly accepts loss of visibility of saved progress. Keep the old origin
available throughout transition; do not auto-redirect it before export is usable. Storage is scoped
to origin and does not transfer automatically. [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

Proposed contract: an allowlist of v2 session fields and valid curriculum identities; versioned
envelope; strict types, size/count/text bounds, unique keys, safe integer/day/activity checks,
rejection of unknown keys/prototype keys; preview records/conflicts; per-session explicit
keep/replace decisions; a downloadable local backup before import; cancellation/no writes until
confirmation; recovery after quota/partial-write failure. Treat observations as plain text, never
HTML. No server upload, analytics payload, URL embedding or observation logging. Do not export
all localStorage or automatically overwrite existing values. Tests would cover older PROD export,
malformed/oversized/hostile JSON, conflicts, cancel, repeated import, blocked/quota storage and
restore of the pre-import local backup across supported phone/tablet/laptop-MacBook sizes.
This is a proposal only; no family browser storage was inspected and no feature was implemented.

## 11. Bounded P1-A/B/C/D proposal

Every row requires a separate scoped owner approval. Completion does not authorize production
migration, application deployment, restart, DNS changes, retirement or paid services.

| Task                                   | Prerequisites / expected changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Risks / test plan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Recovery / exact authorization needed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1-A: credentials and access**       | Owner site/plan evidence; approved non-public credential destination; independent reviewer. Prepare dedicated PROD audit/migration roles, deployment SSH key/identity and API profile/token; production Environment secret names and role contract reviewed before creation. Audit role: target CONNECT, necessary schema USAGE/SELECT/catalog/history visibility; no DML/DDL/CREATE/role admin/DEV CONNECT. Migration role only later when reviewed SQL requires it; no runtime DB credential. No SUPERUSER/CREATEROLE/CREATEDB/replication/BYPASSRLS. If RLS hides rows, STOP and review a separately authorized administrative read mechanism; do not add policies or bypass privileges implicitly. API profile congofoot Sites only where supported; no billing/databases/global-server rights. Dedicated SSH key with bounded command/root allowlist; no staging secret copying. | Provider API permission is account/service level, not proved per-site; SSH user does not create filesystem isolation. Validate verify-full host CA, audit login identity and expected target deployment role, exact site1083500 GET, pinned SSH, harmless allowed/rejected guard inputs and catalog reciprocal CONNECT grants. No live restart or write needed for verification; live negative connection probes require explicit scope. No credential printed.                                                                                                                                                                                                                           | Revoke newly introduced credentials/grants only under the approved change plan, preserve existing provider/rollback identities. Owner separately authorizes exact new role/grants/key/profile/Environment secret placement and **GET/SELECT-only** verification. If existing approved access suffices, no provisioning. No new recurring charge accepted; actual plan restrictions/support quote needed before proceeding.                                                                                                                                                                                                                                                            |
| **P1-B: backup and isolated restore**  | P1-A snapshot-reader permissions and exact source/target inventories; owner selects storage, encryption recipient, retained scope, isolated local targets and resource budget. Prepare protected source snapshot plus separately approved pre-change target snapshot. No overwrite of live source/target. Snapshot metadata includes target IDs, capture time, source SHA/history/source+adapter hashes, schema/ACL/canonical baseline and fresh zero Auth/Storage counts. If private records appear, STOP for expanded scope.                                                                                                                                                                                                                                                                                                                                                        | Dumps may contain confidential SQL/role metadata; never public Git/artifacts/logs. Use owner-controlled directories0700/files0600, authenticated encryption, SHA256 manifest before/after transfer and encryption, independent offsite encrypted copy and separately protected decryption key. Restore to network-isolated PG17/Supabase-compatible disposable target with reviewed extension/provider-role prerequisites; separately reconstruct PG16 from46 frozen migrations/adapters and canonical registry. Compare36/6170 exact, constraints/indexes/functions/RLS, history representation, and version-appropriate ACL mappings; isolated integrity/access/idempotency tests only. | Proposed retention7 daily+4 weekly plus pre-cutover milestone30 days; owner accepts/changes before any deletion policy. Proposed steady-state RPO≤24h with a fresh reviewed pre-cutover snapshot; RTO≤60min as a rehearsal target, not a promise. Measure capture lag and full retrieval/decrypt/restore/verify elapsed time for both paths; record failed steps. On corrupt hash/decrypt/restore/mismatch STOP, quarantine artifact, retain prior validated copy/providers; no live reset. Owner explicitly authorizes snapshot reads/creation, encrypted destination/copies, isolated containers/volumes/restores/tests, cleanup scope and budget. No paid PITR/storage by default. |
| **P1-C: site/database configuration**  | Complete exact site/DB/capacity/TLS/isolation inventory and P1-B recovery evidence; independently reviewed target contract. Prepare allowlists account congofoot/site1083500/host tekaedu.tootiye.com/root /home/congofoot/www/tekaedu-prod and exact PROD DB/login; separate permissions from DEV. Proposed site-specific Node22 and reviewed future production runtime command; only public app identity/URL/PORT/IP needed at runtime; admin credentials outside webroot.                                                                                                                                                                                                                                                                                                                                                                                                          | Existing runtime/CD hardcodes staging; production implementation belongs to P2. A form save can restart an incomplete site; no command/type/language/Environment save without explicit impact/start authorization. Verify empty-or-populated state without overwriting it, owner approved changes only, no inherited DB/Supabase/Vercel credentials, TLS renewal and health no-cache, capacity for retained releases and shared-site headroom. Avoid account-wide language/resource changes affecting other sites.                                                                                                                                                                        | Prepare exact prior setting/ACL diffs and reversal plan; credential revocation separate from DB data recovery. Same-account isolation remains a documented residual risk; true separate-account isolation would require new target identities/cost approval. Owner approves each site/role/permission/configuration change and whether a save may start/restart; defer restart-triggering changes until a separately approved deployable release exists. No application migration/upload/start under this P1 proposal.                                                                                                                                                                |
| **P1-D: progress continuity decision** | Owner decides whether export/import is mandatory before origin cutover and approves supported legacy schema, privacy behavior, conflict policy and transition interval. Inventory existing code and usage evidence only; user feedback/communication requires separate explicit authorization.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Local progress/family count is unknowable from Auth0; switching origin hides saved records. Evaluate contract in section10 and browser/device validation/partial-import recovery. No cloud sync/Auth/Storage migration implied.                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Default recommendation: retain old origin, require preview/local backup/no overwrite/local-only observations. Owner approves the product contract now; any implementation/PR integration is a separate P2 scope. Declining continuity requires explicit documented risk acceptance; no redirect/cutover action follows this decision automatically.                                                                                                                                                                                                                                                                                                                                   |

PostgreSQL does not guarantee17 dump output will restore into16. The PG17 recovery rehearsal
and the separately reviewed PG16 reconstruction are independent gates; a portability CI pass
does not substitute for either snapshot restoration. [PostgreSQL pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html)

Minimum **later P2** production CD: a separate main-only workflow and protected production
Environment; independent `ALWAYSDATA_PRODUCTION_DEPLOY_ENABLED=false` proposal, preserving
all existing switches; exact target/ref/path/site/database allowlists; Linux-built immutable
standalone SHA releases; artifact/media/hash verification; atomic pointers; site1083500-only
single restart POST; normal TLS/hostname checking; bounded retries for idempotent GET only;
strict production exact-SHA health and supported-device smoke. API token inherits profile
permissions, so enforce exact site scope in reviewed workflow as well as reducing provider rights.
Extra SSH users alone permit movement throughout account directories; restricted deployment
commands and documented residual exposure are required. [Alwaysdata tokens](https://help.alwaysdata.com/en/docs/admin-billing/profile/tokens/),
[Alwaysdata SSH users](https://help.alwaysdata.com/en/docs/web-hosting/remote-access/ssh/create-a-ssh-user/)

Application pointer rollback and database recovery are separate operations with separate evidence
and approval. First PROD activation cannot prove rollback to a distinct previous Alwaysdata PROD
release; healthy deployment and rollback-NOT-PROVED are separate statuses. Retain Vercel/Supabase
and later prove an authorized distinct-release sequence; no automatic database reset or retirement.

## 12. Risks and blockers

Critical: target SQL identity/state/privileges unknown; no validated source/target recovery package,
isolated restore or RPO/RTO. High: unknown site runtime/environment/capacity; shared-account
credential blast radius; Cloudflare configuration/fallback unverified; local-progress continuity
undecided; production CD/runtime not implemented. Medium: deployed Vercel SHA predates main,
exact historical SQL file provenance cannot be recovered from statements, provider-specific ACL
mapping and independent-review/self-review policy need explicit decisions. Target502 is expected
for the empty application root and is not a reason to start an unapproved application.

## 13. Exact non-secret evidence required from the owner

Inspect only; do not save settings, restart, restore or expose credential values.

| Owner screen / evidence                                                                    | Exact fields to return                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alwaysdata account congofoot > Web > Sites >1083500 > Configuration                        | Account/site ID; complete address list; type; Node version/override; workdir; startup command; environment **names only**; attestation no forbidden DB/PG/Supabase/Vercel values/assignments                      |
| Alwaysdata Environment / inherited site settings                                           | Node selection and site inheritance; variable names only; whether any administrative DB/Supabase/Vercel assignments are inherited; no full environment screenshot with values                                     |
| Site1083500 > SSL / Advanced / WAF / Cache                                                 | Certificate hostname/issuer/expiry/renewal state, HTTPS/TLS settings, site options/restart control scope, relevant cache/WAF/health rules; inspection only                                                        |
| Alwaysdata Permissions + Profile tokens                                                    | Non-secret dedicated profile label, account/service Sites permission, token-to-profile association label and scope; token value omitted; no restart permission test                                               |
| Subscriptions / account Disk / Server Status; Advanced>Resources if Private Cloud          | Actual plan/type/cost; quota+usage CPU/RAM/disk/processes/connections/bandwidth; enforced limits/OOM policy/headroom; public-plan limits/provider confirmation if no Resources menu                               |
| Databases > PostgreSQL > PROD database and user permissions                                | Expected host/DB/login association, configured version/owner, per-database permissions including DEV separation; mechanism/location label for any already approved read-only access, never passwords              |
| Alwaysdata Advanced > Backup recovery                                                      | Retention entitlement, listed PROD DB backup dates/type/status, restore permission/profile, separate-storage/coverage statements; no click Restore/download; filename is not contents proof                       |
| Supabase PROD > Database > Backups; organization Billing/Subscription                      | Plan label, accessible recovery-point metadata, daily/PITR entitlement/retention, restore permission/ownership, offsite encrypted snapshot **metadata only** if one exists, cost restrictions; no backup contents |
| Cloudflare tootiye.com > DNS > Records                                                     | Rows relevant to tekaedu and staging hostnames: exact name/type/content/proxy/TTL; inventory of other tootiye.com site hostnames protected from change; omit unrelated private records                            |
| Cloudflare SSL/TLS Overview + Edge Certificates + Origin Server                            | Exact SSL mode; edge/origin cert hostnames/issuer/expiry/renewal/coverage; no private key                                                                                                                         |
| Cloudflare Caching > Cache Rules/Page Rules; Security > WAF; Rules > Redirect/Origin Rules | Matching predicates/priorities/actions for production hostname and /api/health, cache bypass, redirects, WAF exceptions affecting checks, origin routing/fallback; include explicit “none” only after inspection  |
| Cloudflare Traffic/Load Balancing or existing fallback record                              | Configured pools/origin hostname/health policy if any; tested alternative custom-domain association; public Vercel URL alone is not proof of custom-domain fallback                                               |
| Product decision                                                                           | Keep old origin; approve local export/import contract and transition interval or explicitly accept progress-visibility risk; actual family usage unknown                                                          |

## 14. Separate credentials/permissions approval

Authorize only a protected source/location **identifier**, exact target and read-only operation
scope for existing credentials. If absent, P1-A needs distinct authorization for audit-role grants,
new dedicated PROD SSH/API identities and production Environment secret placement. Proposed
production-only names for later review are `ALWAYSDATA_PROD_SSH_PRIVATE_KEY`,
`ALWAYSDATA_PROD_SSH_KNOWN_HOSTS`, `ALWAYSDATA_PROD_API_TOKEN` and
`ALWAYSDATA_PROD_PGPASSWORD`; audit credentials, if distinct, need a separately named scope.
No such name/value is created by this document. Existing Supabase/Vercel secrets are retained. No GitHub
secret retrieval, staging-secret reuse, browser-token extraction, original chat-password use,
new credential creation or target SQL connection is implied by this P0 task. Snapshot-reader
permissions and encrypted backup creation/restoration belong to separately approved P1-B.
API permission evidence must identify actual profile/account/service scope rather than assume
the staging token or prior full-profile attestation grants the new production operation.

## 15. Mutation and exposure accounting

Hosting/database/DNS mutations: **0**. Production connections to Alwaysdata SQL: **0**.
Migration/DML/DDL/fixture/dump/backup/restore/deployment/restart/pointer/DNS/cache/variable/
secret/policy/provider-retirement changes: **0**. P1 implementation: **0**.
Supabase native SELECT transport can use HTTP POST; no claim of zero HTTP POST overall.
No private user records or backup contents were downloaded/exported; no credential values
were printed/copied to evidence/committed. Existing approved CLI auth was used in memory.
Local sanitized evidence/documents and a separate docs branch/PR are the authorized writes;
GitHub publication is reported separately from zero hosting/DB/DNS mutations. CI uses isolated
test services, never hosted production. The primary checkout's existing preflight edit is preserved.

## 16. Documentation/PR state

New branch `codex/production-p0-inventory` is based on current develop C; it does not contain
the unmerged PR #116 documentation commits. This P0 supplement and sanitized summary are
separate, with current PROJECT_STATUS/ACTIVE_TASK checkpoint updates only. No application,
workflow, migration, content, media, provider or credential file changes. Historical PR #116
head/review evidence remains intact; no auto-merge or deployment dispatch.
Exact checkpoint SHA, separate docs PR/CI result and final remote guard rechecks are retained
in the private durable resume rather than self-referencing a commit that contains this document.

## 17. Exact next authorized action

Owner supplies the non-secret screen evidence in section13 and reviews this P0/P1 proposal.
Continue read-only reconciliation of that evidence only. If no approved target read-only mechanism
exists, **separately authorize narrowly scoped P1-A access preparation** before any target
connection. Each P1-B/C/D action then requires its own bounded approval and prerequisites.
Do not enable switches, merge PR #116/new checkpoint, implement P1/P2, migrate/deploy/restart,
change DNS or retire providers on the strength of this report. **STOP.**

## 18. Durable resume

Read [ACTIVE_TASK](work/ACTIVE_TASK.md), this supplement and the pinned original PR #116 audit.
Private evidence/resume: `private/astra-visual-evidence/production-p0-20261009/` in the primary
checkout, SHA256-indexed with sanitized scripts/hash comparisons and separate source/guard/
health/provider metadata. Previous audit evidence and accepted staging rollback evidence remain
unchanged. The old develop ACTIVE_TASK is retained byte-for-byte privately and at the base SHA.
On resume verify index hashes, git status/branch/log, exact PR116 head/new docs PR CI,
main/develop, all false switches/no overrides/no active deployment, staging C/current C/previous A,
actual Vercel PROD health SHA and fresh non-secret owner evidence. Historical facts retain dates;
unverified fields in this document must not be silently promoted to PASS. Production remains BLOCKED.
