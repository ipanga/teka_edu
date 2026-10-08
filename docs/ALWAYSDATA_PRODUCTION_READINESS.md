# Alwaysdata production migration readiness

Read-only audit, 2026-10-08 UTC. **Production migration NOT STARTED; readiness BLOCKED.**
Alwaysdata staging is ACCEPTED. This report authorizes no infrastructure change, database
write, deployment, restart, pointer change, DNS change or provider retirement.

`VERIFIED` means observed in this audit; `ACCEPTED EVIDENCE` means a checksummed earlier
execution; `NOT VERIFIED` means a fact still requires evidence. Plans below are proposals.
The sanitized [evidence summary](migration/alwaysdata/production-readiness-20261008.json)
records provenance, exact identities and all 63 promotion-diff paths. Private evidence holds
the fuller read-only metadata; it contains no credential values or user records.

## 1. Staging acceptance baseline

Technical reference: release C **`813c56197f0d0fb353b39238b65c27dd08e6e5bc`**.
Fresh public health is HTTP 200, `status=ok`, `environment=staging`, exact C SHA and null
Supabase project ref. SSH confirms `current=C`, `previous=A`, intact A/B/C manifests,
1,426 payload files per release and no incoming directories. All 31 retained acceptance
evidence files pass SHA-256 verification; index hash is
`43dfeb769382dfda69bd8cd33c362d33ff727969995dd612d73116f393e71c68`.

[Run 37835289864](https://github.com/ipanga/teka_edu/actions/runs/37835289864) is completed,
SUCCESS, attempt 1, dispatched against exact C on develop. Its accepted evidence records:
703 unit tests; 156 portable and 154 isolated Supabase pgTAP assertions; 96 initial browser
passes and 29 after restoration; all eight supported phone/tablet/laptop-MacBook sizes;
both Docker checks; exact archive SHA-256
`44524ca5d75750d14a026e61679d3d376b461f7ae8bfd859c82ceb8f1f1391a8`.
Nine existing production-only tests were skipped in the initial staging suite.

Managed DEV evidence: PostgreSQL 16.15, `verify-full`, exact DEV identity, PROD CONNECT
denied, 46 applied/zero pending, 36 tables/6,170 exact rows, schema/ACL/RLS/integrity PASS,
77 managed equivalent assertions and zero changed rows on canonical re-sync. These are
accepted run results, not new database execution in this audit. A → C → A → C was proved
by atomic pointer records, three single-attempt site-specific restarts and independent
running-SHA HTTP observations. Deployment GET attempt counts were not logged; do not
infer zero GET retries. Application rollback is distinct from database recovery.

Fresh GitHub guard: `ALWAYSDATA_STAGING_DEPLOY_ENABLED=false`,
`STAGING_DEPLOY_ENABLED=false`, `PRODUCTION_DEPLOY_ENABLED=false`; no Environment overrides;
staging permits develop only; no active deployment jobs. No staging restart occurred here.

## 2. Current production platform and deployed SHA

| Item                     | Read-only finding                                                  |
| ------------------------ | ------------------------------------------------------------------ |
| Public production origin | `https://teka-edu.vercel.app`, anonymous HTTP 200                  |
| Production health        | HTTP 200, no-store, production, exact SHA below, PROD Supabase ref |
| Deployed Git SHA         | **`81b759ffe7ffb8d6bc44a6b3774dd81e4a4c7d05`**                     |
| Vercel deployment        | `dpl_HkEkuSvjzXs5wkh6aW7GtHnxyZkL`, READY, production              |
| Generated deployment     | `https://teka-me63jfn92-teka10.vercel.app`                         |
| Project/team             | `teka-edu` / TEKA (`teka10`), container, region cdg1               |
| Current main             | `1578847d02d025286af92af48c691bbfafd84c10`                         |
| Current develop          | accepted C above                                                   |

Vercel authenticated deployment metadata and public health independently agree on deployed
SHA. **The running production application is older than main**: current parent navigation
was integrated in PR #98 and promoted in PR #99, but is not present in that running deployment.
September/October accepted content is already in the production release; content/media/SQL
migrations have no changes between the deployed SHA and the audited branch tips.

Production Environment: main-only branch policy, one required reviewer, self-review prevention
currently false. Owner approval and independent review must remain explicit; no protection
setting was changed. Existing `deploy-production.yml` still couples Supabase PROD migrations,
Vercel deployment and smoke behind `PRODUCTION_DEPLOY_ENABLED`. Its manual dispatch lacks an
explicit main-ref job condition; Environment policy currently supplies the branch boundary.
The proposed replacement must enforce both. Existing production secret names are present;
their values and ability to operate production were not exercised here.

## 3. Main versus develop and future promotion

Main is the merge base: main-only commits 0, develop-only commits 19. There are **63 changed
files, 31,647 insertions and 82 deletions**. Most added lines are historical JSON evidence.
The complete path classification is in the evidence summary.

| Classification                       | Files | Meaning                                                                                 |
| ------------------------------------ | ----: | --------------------------------------------------------------------------------------- |
| New educational content/media        |     0 | Accepted September/October bytes unchanged                                              |
| New application/parent UX            |     0 | Current navigation already in both branch tips                                          |
| Portability/staging CD/build tooling |    22 | PostgreSQL adapter/runner, artifact and staging-only deployment mechanisms, CI, scripts |
| API GET transport/diagnostics        |     5 | Bounded GET transport, exact site guard and diagnostic workflow                         |
| Documentation/historical evidence    |    26 | Includes frozen schema/canonical/history evidence; preserve these baselines             |
| Tests                                |    10 | Portability/API/installer tests and date/health smoke adaptation                        |
| Unrelated application changes        |     0 | None identified in this diff                                                            |

No `app/`, `components/`, `content/`, `public/`, `domain/` or `supabase/migrations/` changes
exist in main → develop. Existing hosted production/staging workflows are byte-identical
between those tips. `package.json` adds administrative scripts, not runtime dependencies.
Future promotion still requires review of CI/staging tooling and the expanded docs diff.
This audit's subsequent docs commit is outside the frozen 63-file comparison and must be
included in any later promotion review. No main promotion is authorized.

## 4. Actual Supabase PROD dependency inventory

Existing CLI login, explicit project ref, SELECT-only queries; the local DEV link remains
unchanged. PROD is **`eganrivpkjhozkkahyxy`**, `teka-edu-prod`, ACTIVE_HEALTHY, eu-west-3.
Provider metadata reports build `17.6.1.166`; SQL reports PostgreSQL **17.6**. Database size
was 24,054,931 bytes at the identity read.

| Category                     | Fresh result                                                                      | Migration implication                                                 |
| ---------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Migration history            | 46 expected versions/names, zero pending/unexpected                               | Freeze source files and preserve source history separately            |
| Canonical mirror             | 36 tables, 6,170 rows, every selected value exact                                 | Rebuild using reviewed deterministic migrations                       |
| Application schema           | All table metadata and two private functions exactly match reviewed PG16 baseline | Proven portability input, still verify target after approval          |
| RLS/policies                 | RLS on all 36; force RLS false; zero public policies                              | Preserve reviewed deny-by-default behavior                            |
| Public user-generated tables | None: entire public table registry equals canonical registry                      | Do not invent a user-data migration                                   |
| Auth users / identities      | **0 / 0** aggregate counts                                                        | No current identities to migrate; recheck before any cutover          |
| Storage buckets / objects    | **0 / 0** aggregate counts                                                        | No current Storage payload to move; recheck before cutover            |
| App SDK/runtime              | No Supabase SDK dependency or DB/Auth/Storage client calls in current app paths   | Application reads bundled reference JSON                              |
| Runtime configuration        | Vercel has public Supabase configuration names; health reports PROD ref           | Configuration presence is not evidence of a per-request DB dependency |
| Hosted backup metadata       | No backups listed; PITR disabled                                                  | No proved database recovery point                                     |

Source ACL inventory has 36 tables and two private functions. Table grants are to postgres
and service_role; private EXECUTE is postgres-only. Schema grants additionally involve PUBLIC,
anon, authenticated, dashboard_user and pg_database_owner. PG17 table ACLs include MAINTAIN.
Do not import these provider roles/grants blindly into PG16. The target's `teka_migrations`
schema replaces provider-managed `supabase_migrations`; this is an intentional history mapping,
not an unexplained application-schema difference. btree_gist 1.7 and plpgsql 1.0 match baseline.

Fresh isolated anonymous phone-context reads of home/class/session returned HTTP 200.
The observed 41 requests were to the production app origin; no Supabase requests or POSTs
were observed. This bounded observation is not a complete production device-smoke suite.

Migration versions/names are freshly verified. Stored statement digests were inventoried;
byte equality with repository SHA-256 is **NOT VERIFIED**. A larger statement read timed out;
its result is not represented as successful checksum validation. No pgTAP fixtures, canonical
re-sync or rolled-back write tests were run against PROD. Current plan/billing, Auth provider
configuration, usage time series, off-site logical backups and restoration remain NOT VERIFIED.

## 5. Alwaysdata production prerequisites

| Item                                        | State                                                                                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Account/site/address/type                   | VERIFIED admin Sites list: congofoot / **1083500** / `tekaedu.tootiye.com` / Node.js                                                     |
| Intended root                               | VERIFIED over pinned SSH: `/home/congofoot/www/tekaedu-prod` exists, directory, congofoot owner, mode 0770, read/write/search accessible |
| Releases/credentials                        | Root empty: no current/previous/release/environment/credential files                                                                     |
| Node version site setting                   | Owner previously reported 22; live site setting NOT VERIFIED in this audit                                                               |
| Site working-directory setting              | Intended root known; exact live site field NOT VERIFIED                                                                                  |
| Live startup command                        | NOT VERIFIED; do not start without an approved artifact/current pointer                                                                  |
| Site Environment                            | Assignments and forbidden DB/Supabase/Vercel values NOT VERIFIED                                                                         |
| TLS                                         | curl verifies both public edge and direct origin certificates for intended hostname                                                      |
| HTTP                                        | curl edge and direct origin `/api/health`: **502**; separate Python client got Cloudflare 403                                            |
| Resources                                   | Actual plan, CPU/RAM/disk quotas, headroom and concurrent-site capacity NOT VERIFIED                                                     |
| Database provisioning                       | Production-named provider dumps exist; current SQL identity/version/schema/state NOT VERIFIED                                            |
| Dedicated production API/SSH/DB credentials | Absent from GitHub production Environment name inventory                                                                                 |

Target database/login supplied by owner are `congofoot_teka_edu_prod` /
`congofoot_user_teka_edu_prod` on `postgresql-congofoot.alwaysdata.net`. These names are
allowlist inputs, not proof of live identity or empty state. No Alwaysdata PROD SQL connection
was attempted; staging credentials were not reused and no new PROD credential was introduced.
The live admin configuration read was not completed; no local approved Alwaysdata API token
exists, and the GitHub staging token was not retrieved or reused for production.

Separate staging/production roots prevent accidental path overlap but both use the congofoot
Unix account. This is **not an OS security boundary**. Future dedicated deployment credentials
need provider-supported restriction plus exact script path/site/database allowlists. Staging
DEV's denied PROD CONNECT is accepted evidence; the reverse direction and PROD privileges
must be verified independently.

## 6. PostgreSQL production migration and backup design

**Not implemented.** Current guarded runner accepts local/staging only and rejects production.
Preserve this protection until separately reviewed production tooling exists.

1. P0: establish exact target DB/login/server/TLS identity, object/data/ownership state, role
   capabilities and cross-environment isolation. Abort on any unexpected existing target data.
2. P1, separately approved: establish a read-only source backup identity and dedicated target
   migrator/verifier roles; no superuser, cluster administration, unrelated database privileges
   or app-runtime credentials. Grant extension/bootstrap rights only as reviewed/necessary.
3. Capture consistent source schema/reference/history/role-grant metadata and validated backup
   with source ref/version/time, file inventory, SHA-256, retention, encryption and protected
   permissions outside every web root/Git. Back up any existing target before target writes.
4. Restore the source recovery package on an **isolated non-production PG17 target**, and
   separately rehearse the reviewed PG16 reconstruction on an isolated PG16 target. Validate
   restore startup, schema/ACL/RLS/constraints, all 36 tables/6,170 values, history, provenance
   and exact counts. Record measured RPO/RTO and outcomes; archive readability alone is not proof.
5. P2: extend guards explicitly for the production allowlist with reviewed source/execution/
   tooling/baseline SHA-256, frozen 46-file chain, transaction lock, exact state and protected
   rollback evidence. Separate source Supabase history from target checksum-bearing history.
   Apply no provider Auth/Storage/role schemas; retain only the reviewed btree_gist/bootstrap
   and explicit portable grant mapping. CI must prove wrong-target/DEV/login/TLS/drift refusal,
   transaction rollback and independent production-role access behavior.
6. P3: independently authorize the exact migration after immediate fresh safeguards, then exact
   schema/reference/access/integrity verification and approved isolated idempotency rehearsal.
   A pre-commit error rolls back transactionally; post-commit failure stops for a separate
   recovery decision. Never auto-reset PROD or treat app rollback as DB restoration.

The inventory currently has only frozen reference data and zero Auth/Storage usage. If any
user-generated rows, identities or objects appear before cutover, STOP and replace the scope,
privacy review, backup coverage and transfer design. Browser-local observations are separate
from this database inventory. Database backups omit Storage file bytes; any future object use
requires independent object backup. [Supabase backup documentation](https://supabase.com/docs/guides/platform/backups).

A generic PG17/Supabase dump is not automatically loadable into PG16; downward major-version
restore is not guaranteed. Prefer the already reviewed portable reconstruction and use separate
source recovery backups. [PostgreSQL pg_dump documentation](https://www.postgresql.org/docs/17/app-pgdump.html).

Alwaysdata lists daily PROD `.sql.zst` files for October 6–8 and latest (727–729 bytes).
Contents, hashes and restoration were not checked; small size does not prove emptiness.
File mode is 0666, but account home is 01770 and backup/date/PostgreSQL parent modes are 0770;
backup/latest are provider symlinks. This is not evidence of unrestricted public access, nor
the protected independent rollback package required here. Provider retention depends on plan,
whose actual tier is unverified. [Alwaysdata backups](https://help.alwaysdata.com/en/docs/web-hosting/backups/).

Proposed tolerance requiring owner decision: **RPO 0 for frozen canonical/history content**;
no accepted loss of browser observations; measure source restoration RTO before assigning an
operational target. A provisional app/DNS recovery objective is 15 minutes, not a proved SLA.

## 7. Browser-local progress and origin migration

Current origin is `https://teka-edu.vercel.app`; planned origin is
`https://tekaedu.tootiye.com`. Progress, activity position and free-text observations use
`localStorage` keys `teka-edu.session.v2.<year>.<level>.<day>.<field>`. Current main/develop
also records updatedAt; the running older release does not. The namespace and existing
field meanings remain compatible. Legacy day-only keys are deliberately left untouched and
ignored because their class/year cannot safely be inferred. No IndexedDB adapter, export/
import feature, cloud sync or Auth flow exists in the audited app. Real parents' browser
storage was not inspected; aggregate cloud counts cannot tell how many families have local data.

An origin change makes old progress **appear missing** on the new site; it remains on the old
origin/browser until cleared. DNS redirects, deployment files and database copying do not
transfer it. The provider-owned vercel.app hostname cannot simply become an Alwaysdata origin.
[MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

Simplest safe continuity choice: retain the old public origin without automatic redirect,
and separately approve a small, explicit **local export/import** bridge before announcing the
new canonical origin. Export only the allowlisted session namespace to a versioned JSON file;
validate schema, size, class/year/day, progress values, bounded positions and observations;
show import preview and explicit conflict choices; preserve existing local data and provide
a local pre-import backup. Do not upload observations, put them in URLs/logs, or overwrite
unrelated keys. Test old-release files and current navigation on phone/tablet/laptop-MacBook,
invalid files, duplicate/conflicting imports, blocked storage and cross-origin persistence.
Parents must use the same browser/device or deliberately move their private export file.

This feature would require a separate product/implementation/release decision and an old-origin
delivery mechanism. Alternative: keep existing families on the retained old origin while new
families use the new one, explicitly explaining separate progress. An owner-approved fresh start
requires clear consent; cloud-sync/Auth is unnecessary for this current migration and not proposed.

## 8. Separate production CI/CD design

Proposed new workflow, **not created**: main-only push/manual dispatch, exact main ref at both
workflow/job/runtime guard, protected production Environment/reviewer, production concurrency
with no in-progress cancellation, explicit independent `ALWAYSDATA_PRODUCTION_DEPLOY_ENABLED`
default false and owner acknowledgement. Keep existing three switches false during preparation;
check repository and Environment override sources before every mutation. Existing Vercel path
remains disabled but available for separately authorized rollback. Production migration approval
and application deployment activation must be independent controls.

Use dedicated production SSH key/pinned known_hosts/API token/DB credentials in production,
never copy staging values. Exact site **1083500**, production root/database/login/hostname
allowlists; reject staging site 1083502 and DEV target. Confirm account, Node 22 executable,
site settings and environment before upload. Administrative credentials/tools remain outside
web roots; runtime remains bundled-content only, with production URL/environment/SHA and
no Supabase/PG/Vercel credentials. The staging package/runtime/site scripts hardcode staging;
copying them unchanged would give the wrong identity. Generalization needs explicit reviewed
production contracts, not weakened staging checks.

Full CI builds Linux Next standalone artifact; validate secret scan, exact SHA/environment,
complete manifest, static/media bytes, extraction safety and immutable SHA directory. Upload
to isolated incoming directory, verify on host, then atomically switch current/previous under
lock. Restart only site 1083500. Identity GET can use at most three bounded TLS-verified
attempts; restart POST is **single-attempt**, with ambiguous outcome investigated before any
further POST. Validate `/api/health`: no-store, production, exact running SHA, intended provider
configuration, then supported-device smoke/API/media checks. Preserve prior immutable releases.

First Alwaysdata production release has no distinct previous production release: local rollback
is **NOT PROVED**, separately from health. Retained Vercel recovery must be validated; later two
distinct production releases must demonstrate A → B → A → B before claiming Alwaysdata
production rollback fully proved. No DB rewind/reset is part of application rollback.

## 9. Reversible Cloudflare/DNS/TLS/cutover plan

Proposed canonical URL: `https://tekaedu.tootiye.com`, subject to the progress-continuity decision.
Public DNS now returns Cloudflare A/AAAA addresses; the proxy hides its configured origin target.
The earlier owner CNAME screenshot is historical, not a fresh zone-configuration verification.
Edge and direct Alwaysdata origin TLS validate normally; actual Cloudflare SSL mode, DNS record
content/TTL, cache/WAF/redirect rules and certificate renewal settings remain NOT VERIFIED.

1. P0: export/read exact relevant DNS, proxy, TTL, SSL, cache, WAF and redirect configuration;
   verify hostnames, certificates/renewal and source alias. Do not change unrelated tootiye.com sites.
2. P1/P2 proposals: ensure Full (strict), health/API/dynamic-page cache bypass and safe immutable
   asset caching. Prevent cached old health SHA or sessions across releases. No Flexible TLS or
   insecure certificate bypass. [Cloudflare Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/).
3. Before separately approved P3: validate origin through hostname-preserving resolution without
   public traffic changes, all production identities, device/content/media smoke, backup rehearsal
   and recovery plan. Capture previous DNS/proxy values and the tested Vercel project custom-domain
   association needed to serve this hostname on fallback; CNAME alone cannot create that association.
4. Public Vercel origin remains accessible for progress export and rollback. Use reversible temporary
   redirects only after continuity is accepted; avoid irreversible cached permanent redirects during
   initial observation. Existing source URL is provider-owned, so moving traffic involves links/user
   communication as well as DNS. Current custom hostname already reaches an unserved origin.
5. SEO: audit route-preserving links and introduce approved canonical URL/metadataBase/sitemap/robots
   decisions; current layout has title/description only, no canonical link, and no sitemap/robots
   route found. Do not declare the custom URL canonical before it is healthy and continuity is ready.
6. Proposed observation: external edge/direct health plus exact SHA every 60 seconds, browser journey
   checks, error/latency/5xx monitoring without observation text. STOP/call owner on any wrong SHA,
   TLS/identity/integrity failure, three consecutive failed health reads or sustained 5xx >1% over
   five minutes. These thresholds and a seven-day minimum observation period require owner approval.
7. Authorized incident recovery would first restore a validated app pointer when relevant. DNS
   rollback restores recorded values only with a prepared, tested alternative custom-domain origin;
   meanwhile use the retained public Vercel origin. DNS caches/proxy propagation prevent assuming an
   instant recovery. Neither app nor DNS rollback restores new-origin local progress to the old origin.

## 10. Documentation discrepancies and correction scope

| Document                       | Obsolete statement                                                  | Accurate checkpoint                                                                     |
| ------------------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| PROJECT_STATUS / staging CD    | Undeployed staging, missing credentials, HTTP 502, pending rollback | C accepted, healthy, rollback proved, switches false                                    |
| API diagnosis                  | A active; Release C proof not executed; acceptance blocked          | Historical failure/proposal retained; C acceptance supersedes status                    |
| Migration audit                | Initial empty staging root/TLS/502 and initial preparation          | Label 2026-10-05 observations historical; link this audit                               |
| Deployment/environment setup   | Application deployment later; PROD only failed first deployment     | Alwaysdata staging accepted; live Vercel PROD October SHA                               |
| README / CLAUDE infrastructure | September-only live status, PROD deferred, browser IndexedDB        | October live; parent navigation newer in branch tips; localStorage implemented          |
| ACTIVE_TASK                    | PR #98 awaiting review                                              | PR #98/#99 merged; preserve snapshot and current audit checkpoint                       |
| FREE_TIER                      | Historical PROD empty/planned backup wording                        | Current 36-table reference-only source; no verified restore; live plan still unverified |

Historical logs, initial failed runs and frozen portability evidence remain intact. Current
headers cross-link this report rather than altering old results. No new architecture ADR is
adopted here: production credentials/backup/CD/progress/cutover choices remain proposals.

Docs PR safety proved before publication: all three deployment switches false, no Environment
overrides/active deploy jobs; existing workflows deploy only protected branch pushes/manual
dispatch; Vercel project Git link null and `vercel.json` Git deployment disabled identically on
main/develop. Changes are docs only, to develop through a protected PR, with no merge or dispatch.

## 11. Risks ranked by severity

| Severity | Risk / required evidence                                                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Critical | No validated PROD source/target recovery package or isolated restore rehearsal; no proved RPO/RTO                                         |
| Critical | Target SQL state/identity/privileges and dedicated production credentials not verified; staging runner deliberately cannot operate PROD   |
| High     | Origin change hides existing progress/observations; no export/import and actual family usage unknown                                      |
| High     | No production Alwaysdata CD contract; staging runtime/site hardcodes staging; first production rollback unproved                          |
| High     | Exact production site environment/command/Node setting/resources not verified; both roots share an OS account                             |
| High     | Custom hostname currently HTTP 502; Cloudflare origin/rule settings and fallback custom-domain association unverified                     |
| Medium   | Running production SHA older than main's accepted navigation; distinguish promotion from deployment                                       |
| Medium   | PG17 provider ACL/history differ from PG16 target; explicit mapping and source-history checksum comparison outstanding                    |
| Medium   | Initial permanent redirects/canonical changes could strand progress and cache an unready origin                                           |
| Medium   | Self-review prevention false, actual paid/free plans/quotas/retention unverified; preserve owner/independent review and spending boundary |

## 12. Separate P0–P4 execution gates

| Gate | Scope and acceptance                                                                                                                       | Authorization boundary                                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| P0   | Finish read-only missing site/DB/resource/DNS/backup/source-history facts and review inventory                                             | This audit only; currently **INCOMPLETE**                                                                     |
| P1   | Dedicated credentials/least privilege, protected backup storage, isolated source restore + PG16 rehearsal, approved capacity/TLS settings  | Separate approval for every infrastructure/production DB operation; no deployment/cutover                     |
| P2   | Reviewed production CI/CD/guards/tests/rollback tooling, disabled workflow and reviewed progress-continuity implementation if chosen       | Separate implementation/integration authorization; no automatic live migration, upload, restart or DNS change |
| P3   | Fresh preflight; independently approved target migration, first app deployment, and then separately approved traffic/canonical/DNS cutover | Exact SHAs, artifacts, backup proof, site/DB targets and recovery thresholds; no combined blanket permission  |
| P4   | Observe approved interval, prove production rollback/recovery, preserve progress continuity, decide Vercel/Supabase retirement             | Separate retirement authorization; no automatic cleanup                                                       |

## 13. Unverified facts

- Alwaysdata PROD live Node setting/workdir/command/environment, API restart scope and account quotas.
- Target SQL version/database/login/TLS/owner/ACL/empty-or-populated state and reciprocal isolation.
- Source stored SQL byte comparison; source usage/billing time series and current provider plans.
- Owner-managed/off-site logical backups, target dump content/hash, source/target restoration and RPO/RTO.
- Exact Cloudflare origin records/rules/TTL/SSL mode/renewal, SEO/indexing policy and tested fallback association.
- Number of families using browser-local progress and their continuity preference; no private browser data read.
- Production Environment credential validity and future dedicated production credential restrictions.

## 14. Owner decisions required

Approve the completed P0 facts separately from P1 changes. Decide the production canonical origin
and local progress continuity before redirects; choose backup scope/retention/encryption/storage,
restore rehearsal targets, RPO/RTO and capacity budget. Approve dedicated least-privilege credentials,
independent review and production guard design under P1/P2. Later authorize exact migration,
application activation and DNS separately under P3; define observation/recovery thresholds and
retirement under P4. No new secret value should be sent in chat or placed in this public repository.

## 15. Mutation and secret accounting

**Zero hosting/database/DNS provider mutations in this audit.** No database writes/provisioning,
fixtures, reset, deployment, restart, pointer change, DNS/redirect/cache configuration change,
switch enablement, secret change or provider retirement. Supabase CLI SELECT queries may use
HTTP POST internally; that is a read-only query transport, not a zero-HTTP-POST claim.
Existing local provider authentication was used in memory through approved mechanisms; GitHub
secret values were neither retrieved nor exported. No credential values or sensitive user records
were printed, read into the report or committed. Browser checks use an isolated empty profile.
The only remote write allowed here is publication of the protected docs branch/PR; no merge.

## 16. Exact recommended next task

**Complete remaining P0 read-only Alwaysdata PROD and Cloudflare inventory, then present a bounded
P1 backup/least-privilege preparation proposal.** Use existing approved account access, record exact
site 1083500 fields and environment names/forbidden-assignment checks, actual quotas, target SQL
identity/state through an already approved PROD read-only mechanism, current relevant zone rules
and existing backup coverage. If such access does not exist, mark it unavailable and obtain a
separate narrowly scoped credential/infrastructure decision; do not repurpose staging credentials.
Keep every deployment switch false. Do not begin P1 implementation, migration, app deployment or
cutover during that inventory task.

## 17. Durable resume

Start with [ACTIVE_TASK](work/ACTIVE_TASK.md), this report and the evidence summary. Verify git
status/log, current main/develop, audit PR head and required checks. Re-read live C health/current/
previous/manifests, accepted run 37835289864 and all deployment guards before relying on this
snapshot. Verify actual Vercel health SHA rather than assuming main was deployed. Recheck all
source aggregate/canonical counts and target facts immediately before any future authorized step.

Private checksum-indexed audit evidence is retained under
`private/astra-visual-evidence/production-readiness-20261008/`; staging acceptance remains under
`private/astra-visual-evidence/alwaysdata-release-c-20261008/`. These directories are ignored by Git.
The original primary checkout's edited preflight document is preserved; it is outside this docs PR.
**STOP: production migration is not started and no activation/retirement is authorized.**
