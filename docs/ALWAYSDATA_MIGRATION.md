# Controlled migration to alwaysdata

Audit date: 2026-10-05, Africa/Lubumbashi. The observations below are the original read-only audit.

Current phase: [PostgreSQL 16 portability tooling](POSTGRES_PORTABILITY.md). Canonical staging is now
**https://staging-tekaedu.tootiye.com**; the old dotted hostname is obsolete. New edge TLS was
verified successfully, with HTTP 502 from the still-unvalidated origin. Historical TLS/DNS
observations below describe the original audit, not the current active hostname. No application
deployment has occurred.

The owner supplied the SSH alias, PostgreSQL 16 target, corrected database names, two Node
site screenshots, and Cloudflare DNS configuration. These are configuration evidence.
The attached migration brief defines the intended staged transition; its architectural
claims were checked against source and live read-only observations below.

Production cutover, provider retirement, production database writes, user-data migration,
and changes to educational content remain outside this step. No hosting configuration,
DNS record, database schema or data was changed during this audit. Nothing was committed,
pushed, merged or deployed. Existing Vercel/Supabase workflows and credentials remain intact.

## 1. Current provider dependency audit

Verified release candidate: `ac003f8580ca81dcfb426a70c45c02102b8e0551`. GitHub's read-only
`commits/main` API returned this exact SHA. Local `origin/main` agrees. The current checkout
is `codex/navigation-production-checkpoint` at `fdccc3b`; its application, content, media,
dependencies, migrations and workflow files are identical to this candidate. Differences
are documentation and UX evidence. Build the frozen candidate, rather than labelling the
checkpoint branch as the candidate.

| Component                                         | Current dependency                           | Runtime requirement on alwaysdata            | Transition                                          |
| ------------------------------------------------- | -------------------------------------------- | -------------------------------------------- | --------------------------------------------------- |
| Next.js 16.3.4 / React 19.2.8                     | Node, standalone output                      | Node >=22.12; Linux build artifact           | Retain                                              |
| Canonical education content                       | Repository `content/`, bundled imports       | Included in traced server/build              | Retain; compare before/after                        |
| SVG/WebP media                                    | Repository `public/media/`                   | Copy `public` into standalone payload        | Retain exact bytes                                  |
| Calendar/programme routes                         | Repository content and domain logic          | Node server; no remote database calls        | Retain                                              |
| Progress and resume                               | Browser `localStorage`                       | Browser storage on each origin               | Retain; origin changes do not transfer progress     |
| Cloud sync                                        | Disabled by default                          | Keep `NEXT_PUBLIC_ENABLE_CLOUD_SYNC=false`   | No new sync work                                    |
| Supabase Data API/Auth/Storage/Realtime/Functions | No application client or service calls found | None for current runtime                     | Retire hosted dependency only after DB verification |
| Supabase reference mirror                         | 46 migrations, 36 tables                     | PostgreSQL plus adapted bootstrap/access SQL | Replace deployment tool                             |
| Supabase CLI/local stack/pgTAP                    | Development and CI                           | Transitional CI dependency only              | Retain until equivalent PostgreSQL checks pass      |
| Vercel container platform/Fluid Compute           | Current application deployment provider      | None in application runtime                  | Replace deployment pipeline                         |
| Vercel registry/CLI/protection headers            | Deployment, registry retention, smoke access | None for alwaysdata                          | Keep for temporary rollback                         |
| GitHub/Actions/protected PR workflow              | Source, CI/CD, approval                      | Still required                               | Retain                                              |
| Cloudflare                                        | Owner's DNS/CDN                              | DNS, edge TLS, cache configuration           | Retain                                              |

Application routes inspected: `/api/health`, `/api/calendar/[date]`,
`/api/programme/[schoolYear]/[level]/[day]`.
No Auth, upload, runtime SQL, filesystem persistence, Vercel Blob/KV or Edge Function route
was found. `instrumentation.ts` validates environment variables at server startup.

## 2. Supabase runtime dependency result

There is no Supabase SDK in application dependencies and no application Supabase REST,
Auth, Storage, Realtime or Edge Function call. Local Supabase config enables several services,
but configuration does not prove application consumption. The cloud-sync flag is a future
capability boundary, not implemented sync.

Supabase still appears in environment validation, health metadata, reference SQL generation,
CI, migration tooling and docs. A concrete probe of `parseServerEnv` rejects an alwaysdata
`DATABASE_URL` for staging because the existing guard allowlists the Supabase DEV project.
Therefore **leave `DATABASE_URL`, `DIRECT_DATABASE_URL`, `SUPABASE_SECRET_KEY` and both
Supabase browser variables unset in the frozen application's alwaysdata site environment**.
The app works without them. Migration tools receive separate PostgreSQL credentials; never
bypass the application guard or add pretend Supabase URLs to make it start.

Health must report `supabaseProjectRef: null` when those unused variables are absent. This
is honest application liveness metadata and is not proof of PostgreSQL connectivity. Verify
the database separately, and compare health's full commit string strictly, including refusing
null. Existing smoke's optional/non-null SHA assertion alone is insufficient for cutover.

## 3. Vercel dependency result

| Location / value                                                                                                       | Use                                               | Classification                                                         |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| `.github/workflows/deploy-staging.yml`                                                                                 | Supabase DEV → Vercel build/deploy/alias/smoke    | Replace after alwaysdata staging passes; retain current path meanwhile |
| `.github/workflows/deploy-production.yml`                                                                              | Supabase PROD → Vercel production deploy/smoke    | Retain until separate production authorization                         |
| `.github/workflows/ci.yml` Docker job                                                                                  | Portable and Vercel images; required check name   | Retain during transition; change checks/rulesets together later        |
| `Dockerfile.vercel`, `vercel.json`, `.vercelignore`                                                                    | Container deployment, region, upload exclusions   | Temporary rollback only                                                |
| `scripts/prune-registry.ts`, `lib/deploy/registry-retention.ts`, associated unit tests                                 | Registry inventory/deletion policy                | Temporary rollback tooling; do not prune under this task               |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_VCR_TOKEN`                                               | Deployment/API/registry secrets                   | Retain securely until provider retirement                              |
| `VERCEL_AUTOMATION_BYPASS_SECRET`                                                                                      | `playwright.config.ts` optional protection header | Retain for Vercel tests; omit in alwaysdata tests                      |
| `VERCEL_CLI_VERSION`, `VERCEL_TELEMETRY_DISABLED`, `VERCEL_STAGING_TARGET`, `STAGING_DOMAIN`, `REGISTRY_PRUNE_ENABLED` | Workflow configuration                            | Replace or remove when associated workflow retires                     |
| `*.vercel.app` URLs and generated-URL guard in `production-public.spec.ts`                                             | Current aliases/test assumptions/docs             | Use explicit alwaysdata test URLs; archive rollback references later   |
| `Dockerfile` and docker smoke                                                                                          | Provider-neutral optional local/CI packaging      | Can retain; never require Docker on alwaysdata                         |

Vercel-only functions, platform SDKs, custom runtime headers or routing were not found in
application routes. Protection headers belong to Playwright's external test configuration.
Search remaining historical docs before retirement; they contain rollback URLs intentionally.

Read-only live health of `https://teka-edu.vercel.app/api/health`: HTTP 200, production,
commit `81b759ffe7ffb8d6bc44a6b3774dd81e4a4c7d05`, PROD ref `eganrivpkjhozkkahyxy`.
The intended `ac003f8` release is still not live there. The recorded failed deployment reason
is registry image-count capacity; this audit did not rerun or modify that deployment.

## 4. PostgreSQL portability result

The findings below are the preserved initial read-only audit. They are superseded for DEV by
[managed acceptance](migration/alwaysdata/PORTABILITY_REPORT.md):46 applied / zero pending,
36 tables /6,170 canonical rows, all checks PASS. See [staging CD](ALWAYSDATA_STAGING_CD.md)
for the application activation boundary. No new PROD operation was performed.

**Raw historical SQL is not immediately portable. PostgreSQL 16 replay is not yet validated.**
There are 46 ordered migration files, totalling 42,000,673 bytes. Forty-two have no detected
Supabase-specific executable references. Four assume objects supplied by Supabase:

| Migration                                              | Supabase assumption                                                                                 | Required adapter behavior                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `20260911203000_educational_foundation.sql`            | `extensions` schema; `btree_gist`; private-schema/table revocations against `anon`, `authenticated` | Prepare extension/schema; preserve PUBLIC revocation; replace absent-role revocations deliberately |
| `20260911222600_curriculum_objectives_and_lessons.sql` | Table revocations from those roles                                                                  | Same access adapter                                                                                |
| `20260912120000_september_programme.sql`               | Table revocations from those roles                                                                  | Same access adapter                                                                                |
| `20260912200000_media_assets.sql`                      | Table revocations from those roles                                                                  | Same access adapter                                                                                |

No executable dependency on `auth.*`, `storage.*`, `realtime.*`, `auth.uid()` or `auth.jwt()`
was found. Preserve SQL dates, range exclusion constraints, triggers, foreign keys, unique
constraints, indexes and RLS. Existing tables deliberately have RLS with no browser policies.
Do not remove RLS because a provider changes.

Live read-only observations:

- Both databases run PostgreSQL **16.15**, with TLS active for inspected sessions.
- Both have zero application tables in `public`/`private`; only `plpgsql` is installed.
- DEV has CREATE on the database and public schema; its login is neither superuser nor
  CREATEROLE/CREATEDB. The database owner is the shared account role `congofoot`.
- `extensions`, `private`, `anon` and `authenticated` are absent in DEV.
- `btree_gist` 1.7 is available and trusted, but not installed. Test installation through the
  migration bootstrap in a disposable database before relying on managed-account privileges.
- pgTAP is absent from `pg_available_extensions`. Request support installation or implement
  equivalent tests; do not silently skip the integrity/access suites.
- DEV cannot CONNECT to PROD; PROD cannot CONNECT to DEV. These are separate logins and
  separate databases, but the hosting account itself is shared and can administer both.
- Managed default ACLs include the account owner and the environment's login; functions have
  default PUBLIC execute. Review function revocations and any future panel permission save:
  [alwaysdata warns that panel/API permission saves can reset SQL-managed grants](https://help.alwaysdata.com/en/docs/web-hosting/databases/postgresql/).

This evidence establishes concrete prerequisites, not a successful migration replay.
No DDL or rolled-back migration writes were executed on either hosted database.
Local SQL replay was unavailable: the Docker daemon is not running, its installed app cannot
be launched successfully, and no local PostgreSQL server/client installation was found.
Use a clean PostgreSQL 16 CI service for reproducible replay, then test managed DEV privileges.
PostgreSQL 17 is offered by [alwaysdata](https://help.alwaysdata.com/en/docs/web-hosting/databases/postgresql/),
but do not upgrade this shared account and its other databases merely to match local Supabase.
The owner's supplied target remains 16 until an isolated alternative is agreed.

Repository canonical state: **36 tables / 6,170 rows**. The per-table count inventory and
unchanged migration checksums are in [migration-audit.json](migration/alwaysdata/migration-audit.json).
Fresh Supabase DEV and PROD GET comparisons both matched **all 36 tables / 6,170 rows,
including all selected column values**. Results are recorded in that evidence file. Requests select only
the canonical tables/columns from `referenceTables`; no Auth/user/child/progress data is read.

## 5. Proposed alwaysdata architecture

| Setting                          | Staging                                    | Production (design only)                        |
| -------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| Site ID, from owner screenshots  | `1083502`                                  | `1083500`                                       |
| Site type/version                | Node.js / 22                               | Node.js / 22                                    |
| Public hostname                  | `staging-tekaedu.tootiye.com`              | `tekaedu.tootiye.com`                           |
| Deployment root                  | `/home/congofoot/www/tekaedu-staging`      | `/home/congofoot/www/tekaedu-prod`              |
| PostgreSQL host/port             | `postgresql-congofoot.alwaysdata.net:5432` | Same server, separate database/login            |
| Database                         | `congofoot_teka_edu_dev`                   | `congofoot_teka_edu_prod`                       |
| Database login                   | `congofoot_user_teka_edu_dev`              | `congofoot_user_teka_edu_prod`                  |
| Site's assigned port, screenshot | `8102`                                     | `8101`                                          |
| Assigned IP, screenshot          | `fd00::2:112f` (use `$IP`)                 | Same shown address (use `$IP`)                  |
| GitHub Environment               | `staging`                                  | `production`, retain required-reviewer approval |

Both roots are empty. SSH alias `sportrdc-alwaysdata` works as `congofoot`; rsync and psql
are available. psql's client version is 18.4; this does not imply that the server is 18.
The managed Node 22 executable returned **22.23.2**. Initial SSH PATH selected an existing
user nvm Node 20; use explicit site Node 22 and a known Node 22 executable for SSH tools.
Do not override shared account defaults indiscriminately.

## 6. Recommended plan/resources

Start sizing from **2 GB RAM / 2 CPUs** for two Node sites plus existing account workloads,
and measure staging RSS, latency, restarts and disk use under representative load. This is
a sizing recommendation, not a verified account capacity or a promise of throughput.
The [Plus Medium plan](https://www.alwaysdata.com/en/offers/plus/) currently advertises 2 GB RAM,
2 CPUs, 100 GB disk and 20 days of backups at EUR 20/month excluding VAT with annual billing
(EUR 22/month monthly billing per [price table](https://help.alwaysdata.com/en/docs/admin-billing/billing/public-cloud-prices/)).
Confirm the current subscription and headroom before changing it; other account workloads
must be included. No plan purchase/change was made. Current local build sizes are approximately
66 MB standalone, 1 MB static and 11 MB public, and are illustrative, not a Linux release measurement.
Budget disk for several retained releases, logs and explicit dumps. Build in GitHub, not on the host.

## 7. Node deployment design

Build on Ubuntu with Node 22 and `npm ci` from the full frozen SHA. Package:

```text
release/
  server.js, package.json, traced node_modules and .next/server  (standalone contents)
  .next/static/                                               (copied separately)
  public/                                                    (copied separately)
  release.json                                               (SHA/build/artifact digest)
```

Never deploy the Mac's `.next` output to Linux. The installed Next.js output/self-hosting
guides confirm standalone `server.js`, separate public/static copying and `HOSTNAME`/`PORT`.
The server runtime receives configuration after build; do not inline secrets in artifacts.

Deployment roots contain `releases/<full-sha>/`, `current` and `previous` pointers plus a
protected directory for deployment tools. Upload to an incomplete temporary directory, verify
artifact digest and media manifest, then rename to the final release directory. Refuse to
overwrite an existing SHA with different bytes. Under a deployment lock, record the previous
release, atomically rename a new symlink to `current`, then restart the correct site using the
[alwaysdata API](https://help.alwaysdata.com/en/docs/development/api/). Keep a rollback command
that selects a verified existing release. Do not garbage-collect live or rollback targets.
The payload is immutable; Next.js cache paths may need write access and are disposable,
never the canonical source or user progress. Application logs use managed site logs.

Required **staging** site configuration, once a tested release is present:

```text
Working directory: /home/congofoot/www/tekaedu-staging
Command: HOSTNAME="$IP" node current/server.js
Node.js version: 22
```

Alwaysdata supplies `PORT` and `IP`; do not replace them with a generic 3000/0.0.0.0 pair.
The screenshot's current `npm run start -- --hostname "$IP" --port "$PORT"` does not match
the standalone layout: the repo's npm start wrapper expects a source tree's `.next/standalone`
and does not consume these CLI listener flags. Keep production settings unchanged for now.

## 8. Database migration design

Implement a provider-neutral psql-based runner in a subsequent reviewed change. Use libpq
environment variables or a protected password file; keep passwords out of arguments, logs,
artifact files and chat. Never import Supabase's Auth/Storage/Realtime internal schemas.

1. Preserve the 46 source migration filenames and bytes. Generate an audited PostgreSQL
   execution copy with a versioned adapter; never rewrite applied historical migrations.
2. Bootstrap only needed extension support. Avoid creating cluster-global `anon` or
   `authenticated` roles on a shared managed server. Replace the four exact role-revocation
   blocks with provider-neutral PUBLIC revocations while retaining every existing PUBLIC
   private-schema/function revocation. Reject unexpected source shapes; no broad regex removal.
   Preserve denial of browser access and test actual environment grants independently.
3. Put history in a separate `teka_migrations` schema so the 36-public-table registry remains
   valid. Store version, filename, source SHA-256, execution SHA-256, adapter version, applied
   time, release SHA and target. Leave Supabase's own migration history intact.
4. Require `--target local|staging|production`, exact host/database/login allowlists, and a
   server-side identity check. A shared hostname alone is not environment isolation.
5. `list` is read-only. Reject unknown applied versions, changed applied checksums and a new
   migration ordered before the latest applied version. Pending listing is not a SQL proof.
6. `preflight` replays on a disposable PostgreSQL 16 database, runs integrity/reference tests,
   then checks target identity, extension availability, permissions and checksums read-only.
   Document that target-specific privilege success still requires the first controlled DEV run.
7. `apply` uses an advisory lock, `ON_ERROR_STOP`, schema/search-path control and transactions
   where safe. Insert history in the same transaction as its migration. Recheck history after
   acquiring the lock. Handle nontransactional operations explicitly; never infer safety by
   wrapping arbitrary future SQL. Stop immediately on failure.
8. Regenerate canonical verification using the existing `getReferenceData`/`referenceTables`
   generator. Replay historical schema/data first, then compare all values with content and
   verify deterministic re-sync is idempotent. Do not seed local demo/user data into PROD.
9. Preserve both integrity suites and the access registry in addition to reference equality.
   Run pgTAP in portable CI; obtain managed pgTAP support or implement equivalent assertions
   for constraints, triggers, indexes, RLS, policies and access privileges on managed DEV.

Do not change the frozen app's environment guard to make migration credentials valid.
Future runtime SQL access requires a separately reviewed provider-neutral guard and a
narrower read-only runtime login. The current app does not need a database credential.

## 9. CI/CD replacement design

Keep feature → PR → develop → staging validation → develop-to-main PR → production.
Keep all currently required CI job names/checks during transition. Add a PostgreSQL 16
portability check; replace Supabase/Docker-specific required checks only after equivalent
checks are green and the rulesets are updated together.

First implement an **opt-in, staging-only** workflow. Its deployment gate must default off;
no production counterpart is activated by this task. It must serialise staging deployments
and use the `staging` Environment. Keep the existing provider pipeline operational until
replacement staging is independently accepted; define a single provider selector when
switching automatic develop deployment so two pipelines do not accidentally migrate twice.

For normal pushes, reuse CI for that exact `github.sha`, build the standalone artifact from
the same SHA, perform DEV preflight/apply/verification, transfer/activate/restart, then run
strict health and Playwright smoke. Failures block subsequent steps. Upload test artifacts
without credentials. Never build deployable code from `main` while CI actually checked develop.

For the bootstrap frozen candidate `ac003f8`, make the app SHA, deployment-tooling SHA and
artifact digest explicit. A manual bootstrap builder must checkout and run full checks on
the exact candidate before creating the artifact. Reusable CI's current checkout defaults
to the caller's SHA; it must be adapted to accept the guarded bootstrap SHA, or the bootstrap
must run the same required checks on that checkout explicitly. Never simply pass a different
SHA only to the packaging step and reuse unrelated green CI.

Future main flow (separate authorization): exact-commit CI → guarded PROD preflight → approved
PROD apply/verify → same standalone artifact's deploy/restart → strict health → production-safe
smoke. Retain the production Environment reviewer gate. Database backup/restore verification
is a prerequisite; application rollback does not undo applied database schema.

## 10. Environment-variable mapping

All `.env*` files remain untracked, including templates. The values below are non-secret
settings or sources; actual secrets belong in GitHub Environments/protected provider settings.

| Existing / new variable                                                    | Needed after migration           | Staging source                                                 | Production source                                    | Classification                                         |
| -------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_APP_NAME`                                                     | Yes                              | Site: `Teka Edu`                                               | Same                                                 | Public                                                 |
| `NEXT_PUBLIC_DEFAULT_LOCALE`                                               | Yes                              | Site: `fr`                                                     | Same                                                 | Public                                                 |
| `NEXT_PUBLIC_DEFAULT_COUNTRY`                                              | Yes                              | Site: `CD`                                                     | Same                                                 | Public                                                 |
| `NEXT_PUBLIC_APP_ENV`                                                      | Yes                              | Site: `staging`                                                | Site: `production`                                   | Public                                                 |
| `NEXT_PUBLIC_APP_URL`                                                      | Yes                              | Site: `https://staging-tekaedu.tootiye.com`                    | Site: `https://tekaedu.tootiye.com` after validation | Public                                                 |
| `NEXT_PUBLIC_GIT_SHA`                                                      | Yes                              | Release-bound full SHA                                         | Release-bound full SHA                               | Public                                                 |
| `NEXT_PUBLIC_ENABLE_ENGLISH_SCAFFOLDING`                                   | Yes                              | Site: `true`, preserve behavior                                | Same                                                 | Public                                                 |
| `NEXT_PUBLIC_ENABLE_CLOUD_SYNC`                                            | Yes                              | Site: `false`                                                  | Same                                                 | Public                                                 |
| `AI_ENABLED`                                                               | Yes                              | Site: `false`                                                  | Same                                                 | Non-secret                                             |
| `NODE_ENV`, `NEXT_TELEMETRY_DISABLED`                                      | Yes                              | Site: `production`, `1`                                        | Same                                                 | Non-secret                                             |
| `PORT`, `IP`, `HOSTNAME`                                                   | Yes                              | Provider assigns PORT/IP; command maps IP to HOSTNAME          | Same per site                                        | Platform                                               |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`         | No current app requirement       | Unset on alwaysdata                                            | Unset on alwaysdata                                  | Former public configuration                            |
| `SUPABASE_SECRET_KEY`                                                      | No current app requirement       | Unset on alwaysdata                                            | Unset on alwaysdata                                  | Secret, retain old provider securely                   |
| `DATABASE_URL`, `DIRECT_DATABASE_URL`                                      | No current app requirement       | Unset in frozen app runtime                                    | Unset in frozen app runtime                          | Secret if used; existing Supabase guard rejects target |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`     | Transitional workflows only      | Retain existing secrets                                        | Retain existing secrets                              | Token/password secret; project ID public               |
| `VERCEL_*` deployment/protection values                                    | Transitional workflows only      | Retain old-provider settings                                   | Same                                                 | Tokens/bypass secret; IDs/version non-secret           |
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGSSLMODE`                    | New migration tooling            | DEV identity; TLS certificate validation configured and tested | PROD identity; separately scoped                     | Non-secret connection identity                         |
| `PGPASSWORD` or `PGPASSFILE`                                               | New migration tooling only       | GitHub staging secret / protected file                         | GitHub production secret / protected file            | Secret                                                 |
| `ALWAYSDATA_SSH_PRIVATE_KEY`                                               | New deployment                   | GitHub staging secret, dedicated deploy key preferred          | Separate production environment secret               | Secret                                                 |
| `ALWAYSDATA_SSH_HOST`, `ALWAYSDATA_SSH_USER`, `ALWAYSDATA_SSH_KNOWN_HOSTS` | New deployment                   | Verified SSH endpoint/user/pinned host key                     | Independently verified values                        | Non-secret; integrity-critical                         |
| `ALWAYSDATA_API_TOKEN`                                                     | New restart step                 | Account-scoped/restricted token in staging secret              | Separately scoped production secret                  | Secret                                                 |
| `ALWAYSDATA_ACCOUNT`                                                       | New restart step                 | `congofoot`                                                    | `congofoot`                                          | Non-secret                                             |
| `ALWAYSDATA_SITE_ID`, `ALWAYSDATA_DEPLOY_ROOT`                             | New deployment                   | `1083502`, staging root                                        | `1083500`, production root                           | Non-secret, allowlist                                  |
| `ALWAYSDATA_STAGING_DEPLOY_ENABLED`                                        | New opt-in gate, proposed name   | Repository variable; off until validation/setup                | Not applicable                                       | Non-secret                                             |
| `PLAYWRIGHT_BASE_URL`, `EXPECTED_APP_ENV`, `EXPECTED_GIT_SHA`              | Smoke                            | Exact staging URL/environment/SHA                              | Exact validated production values                    | Non-secret                                             |
| `EXPECTED_SUPABASE_PROJECT_REF`, `EXPECTED_PRODUCTION_SUPABASE_REF`        | Old-provider smoke only          | Do not pass to alwaysdata suite                                | Same                                                 | Public metadata                                        |
| `PRODUCTION_PUBLIC_URL`                                                    | Later anonymous production check | Unset                                                          | Validated final hostname                             | Public                                                 |

Bind runtime SHA to the selected release, not a stale site field: a small launcher can read
the release manifest and export it before executing server.js. For bootstrap, configure the
frozen SHA explicitly and verify it after each restart. Any rollback must restore the old
SHA metadata with the old payload. No new environment names in this table are implemented yet.

## 11. Staging design and acceptance

Use site 1083502, DEV database/login and the frozen candidate. Fix edge/origin HTTPS first,
then prepare/test reviewed tooling, preflight DEV, import through the runner, verify DB,
deploy the Linux artifact and restart. No browser test result from Vercel counts as acceptance
of the alwaysdata deployment.

Required staging checks: strict `/api/health` environment/full SHA/null Supabase ref; home;
class navigation; September and October; all-lessons view; representative lesson; parent and
child modes; pause/reload/resume; browser storage; all accepted SVG/WebP file hashes/media loads;
phone, tablet and laptop/MacBook; no horizontal overflow, broken images or console errors.
Run against the production build. TV/Smart TV remains unsupported. Begin with disposable,
origin-specific browser state; no new account/child records or cloud writes.

## 12. Production design

Keep production inactive until staging is accepted. The owner has already configured the
proposed final hostname in Cloudflare/alwaysdata; this audit observed HTTP 502 there and did
not change it. This is a proposed new hostname, not the current healthy Vercel canonical URL.

Before serving the production application, add an **owner-confirmed temporary validation
hostname** to site 1083500. No spare alwaysdata.net hostname is assumed available, and the
account's existing hostname may serve another site. Obtain a dedicated supported alias or an
unused first-level owner subdomain with valid TLS. Never route staging through the PROD login.

Prepare/verify PROD DB only after reviewed tooling and backup rehearsal. Deploy and validate
the exact approved release on the temporary hostname before changing the canonical/public
entry point. Do not activate production simply because its Node site already exists.

## 13. DNS/SSL design and current observations

Owner's screenshot: both CNAME records target `congofoot.alwaysdata.net`, proxied, TTL Auto.
Fresh public DNS checks on 2026-10-05 returned Cloudflare addresses `104.21.81.126` and
`172.67.160.228`: Google resolver answered both hosts, Cloudflare resolver answered staging.
One Cloudflare-resolver production query timed out; this is not evidence of NXDOMAIN.
These observations establish public resolution at sampled resolvers, not universal cache
expiry or read-back confirmation of the hidden origin CNAME. Proxied DNS exposes Cloudflare
addresses; the expected hidden target is supported by the owner's screenshot.

Fresh HTTPS: staging fails TLS handshake (curl exit 35); production negotiates TLS then
returns 502. Empty release directories and the current startup command are consistent with
an unavailable origin application, but no site-log root-cause claim is made here.

`staging.tekaedu.tootiye.com` is deeper than `*.tootiye.com`. In a full zone setup,
[Cloudflare Universal SSL covers the apex and first-level subdomains only](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/limitations/).
Keep the chosen hostname by issuing an Advanced/custom certificate that includes it, or
enable appropriate Total TLS coverage. The alternative is an owner-approved first-level
staging hostname; no DNS/name change is made by this audit. Waiting for DNS caches alone
does not add missing certificate coverage. Confirm the actual active certificate/zone setup
in Cloudflare; the screenshot warning plus handshake failure supports, but does not by itself
prove, this diagnosis.

Use [Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)
with a valid matching origin certificate. Verify Alwaysdata's origin certificate independently
using the provider's actual web IP with the correct SNI/Host; do not infer it from edge success.
[Alwaysdata automatically provisions certificates for configured addresses pointing at it](https://help.alwaysdata.com/en/docs/web-hosting/sites/ssl-tls/lets-encrypt/);
confirm issuance and renewal through the proxy. Do not repeatedly remove/add hostnames.
Do not change the zone's shared TLS mode without checking its other existing sites.

Keep `/api/*` and HTML/RSC traffic out of any Cache Everything rule. Preserve origin's
`Cache-Control: no-store` for health and programme responses. Hashed `.next/static` assets
can be cached long-term; media paths must preserve exact accepted bytes. Stable media names
need a deliberate version/cache policy; purge after an authorized changed release when needed.
Check CDN response headers and bytes as part of acceptance, not just direct-origin health.

## 14. Backup/rollback design

[Alwaysdata makes daily file/database/email backups](https://help.alwaysdata.com/en/docs/web-hosting/backups/)
under `/home/congofoot/admin/backup`, with retention depending on plan. Read-only inspection
found dated directories through 2026-10-05 and a `latest` link, plus older database `.sql.zst`
files. This does not prove that these newly created databases already have usable backups,
nor that a restore has been tested. Verify their exact dump files and restore one into a
separate disposable database before cutover.

Create an explicit PostgreSQL custom-format dump before PROD migrations/cutover using a
compatible pg_dump client, protected credential storage, `--no-owner --no-acl`, and restrictive
file permissions. Store its manifest/hash and an off-host recovery copy. Keep dumps outside
the repository/public release payload. Verify a `pg_restore --list`, then actually restore
into a separate DB with provider extensions prepared and rerun integrity/reference checks.
Never test restore into a live database. Platform `.sql.zst` backups use a separate plain-SQL
restore procedure after decompression; custom dumps use pg_restore. Keep those procedures distinct.

Application rollback: atomically select the prior validated release, update release-derived
SHA, restart its site, rerun health and safe smoke; purge CDN cache only when necessary.
Database rollback: an application pointer change does not undo SQL. Prefer a forward fix;
restore only with a verified safe recovery plan and an explicit decision about writes since
the backup. Schema changes should stay compatible with the retained application release.
Retain the healthy Vercel application and hosted Supabase throughout this transition.

## 15. Repository changes required and operational sequence

No deployment or application implementation is added in this audit because staging TLS and
SQL replay/managed verification are unresolved. This report, checksum/count evidence and
documentation links are the current changes. The subsequent staging implementation needs:

- A PostgreSQL runner, four narrowly reviewed access/extension adapters and history guards.
- PostgreSQL 16 replay tests plus equivalent managed integrity/access checks.
- A read-only canonical comparison script and schema/constraint/index/access inventory.
- Linux standalone packaging, artifact/media manifests, guarded transfer/atomic activation,
  site-specific restart, release-derived runtime metadata and rollback tooling.
- Strict deployment health checking and an opt-in staging workflow with same-SHA CI.
- Updated environment inventory, deployment/setup instructions and durable acceptance evidence.

Operational order:

1. Confirm paid-account Node-site capability, current resources and backup retention/headroom.
2. Confirm staging Node site 1083502 settings; correct command when payload is ready.
3. Validate DEV extension/bootstrap privileges in controlled preflight; migrate DEV via runner.
4. Verify separate PROD identity/settings read-only; defer its migration.
5. Prepare release directories/pointers/locks and protected tools outside public assets.
6. Configure GitHub staging/production secret scopes without enabling PROD.
7. Review/test checksum/history/isolation/transaction guards and PostgreSQL 16 adapters.
8. Build/test exact frozen candidate in Linux CI and deploy staging artifact.
9. Complete all staging database, UX, device, browser-state and media/hash acceptance.
10. Prepare PROD DB after separate authorization and a backup/restore rehearsal.
11. Deploy approved artifact to a confirmed temporary production validation hostname.
12. Validate PROD data/health/device/anonymous access on that hostname before public switch.
13. Snapshot DNS/current canonical mappings; obtain separate cutover authorization and switch
    the canonical entry point only once both edge/origin TLS and rollback are verified.
14. Verify final-domain HTTPS, certificate coverage, redirects and correct environment/SHA.
15. Monitor health, errors, restarts, resource use and CDN cache behavior during an agreed window.
16. Rehearse/document app rollback and a separately approved DB recovery procedure.
17. Retire Vercel only after stability and explicit owner authorization, preserving recovery evidence.
18. Retire hosted Supabase only after equivalent data/tests/backups and explicit authorization.

## 16. Migration risks

Confirmed gates: staging edge TLS failure; raw SQL assumes missing schemas/roles; pgTAP
unavailable; full PostgreSQL 16 replay untested; site command needs standalone alignment;
runtime database env guard is Supabase-specific; API restart credential/secure CI setup
not verified. Production origin currently returns 502, while old Vercel remains healthy.

Other material risks: building the wrong SHA/platform; stale runtime SHA on rollback;
environment credential crossover; extension/schema ownership on a managed server; privilege
reset through provider panel/API; assuming database backup existence from directory names;
cache serving old HTML/media; origin change losing access to browser-local progress;
two CI/CD providers firing concurrently; shared account resource exhaustion; treating
application liveness as proof of migrated database correctness.

## 17. What can be removed after cutover

After separate retirement authorization and successful recovery validation: Vercel deploy
workflows/config/image-specific tooling/secrets/aliases/registry maintenance, hosted Supabase
API/auth/storage/realtime runtime variables and hosted deploy/link secrets, and unused health
project metadata/tests. Remove Supabase CI/local tooling only once portable database tooling
and tests replace its guarantees. Keep historical SQL/checksums and migration provenance.

## 18. What should temporarily remain

Healthy Vercel deployment, registry images required for recovery, hosted Supabase DEV/PROD,
their existing migration history, old-provider secrets in secure stores, branch/environment
protections and the current CI. Retain GitHub, Cloudflare, canonical content/media and browser
progress architecture permanently. No November/2ème/PWA/audio/new auth/cloud sync work is included.

## 19. Owner decisions/settings still needed

Known: SSH alias works; site IDs/roots/logins/databases are identified; Node 22 exists; both
databases are isolated at CONNECT privilege level; Cloudflare proxy DNS resolves publicly.

Still needed, through secure dashboards/settings rather than secret values in chat:

- The earlier dotted-host certificate request is obsolete. Active staging is now
  `staging-tekaedu.tootiye.com`, with edge TLS verified. Validate origin behavior after the
  separately authorized staging deployment; the current response is HTTP 502.
- Alwaysdata staging command/environment alignment with the standalone layout above.
  Keep PROD unchanged. Staging must explicitly say `staging`, its URL and the frozen full SHA;
  Supabase/database runtime variables stay unset, cloud sync and AI false.
- A least-privilege alwaysdata API token for staging restart, configured in the GitHub
  `staging` Environment as `ALWAYSDATA_API_TOKEN`; the numeric site ID is already known.
- A dedicated CI deployment key/verified host key in the GitHub staging Environment.
  The Mac SSH alias/key is not automatically available to GitHub Actions. Do not copy the
  Mac private key into a report or ask for it in chat.
- Migration credential in the GitHub staging Environment/protected password file, scoped
  to the verified DEV identity; separately provision PROD later. No passwords are recorded here.
- Decide managed pgTAP support versus equivalent managed tests; establish reproducible
  clean PostgreSQL 16 replay. `btree_gist` bootstrap is required and must be tested.
- Confirm current account resource/retention settings, new-database backup files and restore test.
- Later, confirm a temporary production validation hostname and separately authorize PROD work.

## 20. Exact recommended next action

The old hostname certificate issue is superseded by the owner-authorized hostname change. First
complete PostgreSQL 16 portability and managed DEV validation using the linked runbook;
prepare reviewed PostgreSQL 16 portability tooling/tests and opt-in staging packaging/CI with
secure dashboard-provisioned credentials. Once those gates pass, recommend a separately
authorized phase to build a Linux artifact and deploy the verified frozen
`ac003f8580ca81dcfb426a70c45c02102b8e0551` **to staging only**, recording fresh acceptance.
Do not start that application deployment automatically in the portability phase.
No production cutover or provider removal is authorized by successful staging alone.

## 21. Resume information and validation record

- Workspace: `/Users/Apple/Documents/AppDev/Flutter/teka_edu`.
- Branch at audit: `codex/navigation-production-checkpoint`; no new commit/push.
- Read this report, [ACTIVE_TASK.md](work/ACTIVE_TASK.md), and
  [migration-audit.json](migration/alwaysdata/migration-audit.json) before resuming.
- Candidate: `ac003f8580ca81dcfb426a70c45c02102b8e0551`; GitHub main reverified read-only.
- SSH: `sportrdc-alwaysdata`; managed Node executable `/usr/alwaysdata/nodejs/22/bin/node`
  returned v22.23.2. Confirm current PATH separately after account changes.
- Database names/site IDs/roots are in section 5. Credentials are omitted deliberately.
- Hosted queries were read-only transactions/catalogue reads plus Supabase canonical GETs.
- Targeted existing tests: `env`, `runtime-config`, `reference-sql`, `health`: **31 passed**.
- PostgreSQL replay, managed integrity tests, Linux artifact build and alwaysdata staging
  E2E/device/media acceptance: **not run**. Do not describe migration as complete.
- No hosting/DNS/database/application change occurred. Previous failed production-release
  checkpoint remains historical; current owner scope is this controlled migration audit.
