# Alwaysdata staging CD

DEV migration and managed verification are complete. Application activation is pending owner
configuration and authorization. Production, Vercel and hosted Supabase remain intact.

## Reviewed DEV acceptance

The approved runner at `2315600fc0db4bfe67769afb2eb4727983c91bb6` committed all 46 reviewed
migrations to `congofoot_teka_edu_dev`, login `congofoot_user_teka_edu_dev`, PostgreSQL 16.15.
All nine immediately preceding safeguards passed. See [apply evidence](migration/alwaysdata/dev-apply.json),
[history](migration/alwaysdata/dev-history.json), [drift check](migration/alwaysdata/dev-drift-preflight.json)
and [managed verification](migration/alwaysdata/managed-dev-verification.json).
The result is 46 applied / zero pending, 36 canonical tables / 6,170 exact selected rows,
complete schema comparison, integrity/access/RLS/ACL/isolation PASS and zero-row canonical
re-sync. Managed pgTAP is unavailable; the original 77 equivalent assertions passed, as
they did in CI alongside the four portable pgTAP suites. No reset or rollback was needed.

## Pipeline and activation boundary

`.github/workflows/deploy-alwaysdata-staging.yml` runs only on `develop`, after reusable CI,
and only when repository variable `ALWAYSDATA_STAGING_DEPLOY_ENABLED=true`. Leave it unset
until a separate application activation decision. Feature branches and PRs cannot deploy.
No merge or activation has been performed by this implementation.

CI builds on Ubuntu with Node 22, packages the Next standalone server, `.next/static` and
`public`, and boots that exact archive to verify strict staging health and media. This makes
the artifact reviewable before remote operations. The protected deployment job downloads
artifacts from its own run, verifies exact site identity, uploads administrative tools outside
the web root, lists/preflights the reviewed DEV history, performs guarded zero-pending apply,
and verifies managed DEV before application upload or activation. The original protected
empty-DEV dump is rechecked by the reviewed runner; it is never shipped as an app artifact.

CD accepts the frozen 46-file chain with all 46 already applied. A new pending migration,
changed history/source/tooling/baseline, missing backup, wrong target/TLS or failed verification
stops CD for separate review. No reset is attempted. Application failure does not undo SQL.

## Owner GitHub configuration

Configure names through GitHub settings; never paste values into chat or commit them.

| Location                        | Name                                 | Purpose / value                                                                                                         |
| ------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Environment `staging`, secret   | `ALWAYSDATA_SSH_PRIVATE_KEY`         | Dedicated deploy key authorized for account `congofoot`; do not copy the Mac's existing private key into the repository |
| Environment `staging`, secret   | `ALWAYSDATA_SSH_KNOWN_HOSTS`         | Independently verified pinned SSH host key; runtime key scanning is forbidden                                           |
| Environment `staging`, secret   | `ALWAYSDATA_API_TOKEN`               | Read site 1083502 and restart that staging Node site; use the narrowest provider permissions available                  |
| Environment `staging`, secret   | `ALWAYSDATA_DEV_PGPASSWORD`          | DEV login only, administrative verification job; never application runtime                                              |
| Environment `staging`, variable | `ALWAYSDATA_SSH_HOST`                | `ssh-congofoot.alwaysdata.net`                                                                                          |
| Environment `staging`, variable | `ALWAYSDATA_SSH_PORT`                | `22`                                                                                                                    |
| Environment `staging`, variable | `ALWAYSDATA_SSH_USER`                | `congofoot`                                                                                                             |
| Environment `staging`, variable | `ALWAYSDATA_DEV_MIGRATIONS_APPROVED` | `true`, operator attestation for the reviewed frozen chain and protected rollback record                                |
| Repository variable             | `ALWAYSDATA_STAGING_DEPLOY_ENABLED`  | Activation switch; keep unset/false until separately authorized                                                         |

The audited GitHub staging Environment currently lacks these Alwaysdata entries. Existing
Vercel/Supabase secrets and `STAGING_DOMAIN` are retained. They are not passed to this new
job or runtime. The DEV host, database/login, site ID, web root and hostname are hardcoded
allowlists; no redundant owner variables are needed. Keep existing Environment protections
and configure any desired reviewer gate before enabling this workflow.

## Owner staging site configuration

Only site **1083502** is eligible. Configure its sole address as
`staging-tekaedu.tootiye.com`, type Node.js, Node version 22, working directory
`/home/congofoot/www/tekaedu-staging`, command:

```text
/usr/alwaysdata/nodejs/22/bin/node current/runtime.mjs
```

The previous `npm run start` command is not accepted by the CD site guard. Coordinate the
site save with the separately authorized first activation: `current` does not exist yet.
No site setting has been saved by this implementation. The runtime derives configuration
from the release's metadata and binds `HOSTNAME` to provider `IP`, and provider `PORT`.
It requires Node 22 and `NODE_ENV=production` and rejects SQL/Supabase environment variables.
The API authenticates with the token and account `congofoot`; it verifies the exact site
before issuing only `POST /v1/site/1083502/restart/`. It never patches or restarts other sites.

| Runtime variable                         | Release-derived value                 |
| ---------------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_APP_ENV`                    | `staging`                             |
| `NEXT_PUBLIC_APP_URL`                    | `https://staging-tekaedu.tootiye.com` |
| `NEXT_PUBLIC_DEFAULT_LOCALE`             | `fr`                                  |
| `NEXT_PUBLIC_DEFAULT_COUNTRY`            | `CD`                                  |
| `NEXT_PUBLIC_ENABLE_ENGLISH_SCAFFOLDING` | `true`                                |
| `NEXT_PUBLIC_ENABLE_CLOUD_SYNC`          | `false`                               |
| `AI_ENABLED`                             | `false`                               |
| `NEXT_PUBLIC_GIT_SHA`                    | Exact 40-character release SHA        |

No PostgreSQL, Supabase or Vercel credentials enter the runtime. Browser-local progress and
canonical content/media are unchanged. `/api/health` already supports provider-neutral
operation; acceptance now requires status `ok`, environment `staging`, exact SHA and null
Supabase reference. Cloudflare must serve this uncached endpoint and preserve origin identity.

## Release integrity and rollback

Releases are installed at `/home/congofoot/www/tekaedu-staging/releases/<full-sha>`.
`current` and `previous` are atomic relative symlinks. No release is overwritten or pruned.
The archive checksum and complete manifest inventory are verified before activation;
traversal, special files, symlinks, environment files and unmanifested/tampered content are
rejected. Administrative tools and credentials stay under a private account directory,
outside releases; the application payload contains only traced runtime files and its launcher.

After activation CD restarts the exact site, verifies strict health and runs the existing full
Playwright suite against the actual hostname: home/classes, September/October, month/list
navigation, preparation, child mode, pause/resume, completion and media across eight supported
phone/tablet/laptop/MacBook viewports. TV is unsupported. No Vercel bypass header is used.

With healthy distinct releases A and B, the job records A, activates and smokes B, switches
`current` to A, restarts and verifies A's exact health SHA, then restores B and verifies B.
The resulting `application-rollback.json` must say PASS. A first release has no A; a same-SHA
rerun also cannot prove rollback. Those runs deliberately end with `NOT PROVED`, retain the
installed release and report incomplete acceptance. Two distinct reviewed `develop` commits
are therefore needed before calling staging accepted. Do not invent release SHAs or relabel
identical artifacts as different commits. A failed smoke/health job leaves evidence and stops;
it does not perform an automatic database reset or claim successful application rollback.

Manual application rollback, if separately needed, uses the installed `remote.py switch
--sha <previous-full-sha>` from the private administrative directory, then the site-specific
restart and strict health checks. Validate metadata/inventory and site identity first. Do not
use a database reset for application rollback. Do not roll back to the retained Vercel provider
or change DNS automatically.

## Current state and exact resume

DEV is accepted. Staging application remains undeployed; latest public check is TLS valid,
HTTP 502. Actual staging browser smoke and application rollback are NOT RUN. Local pointer
tests are not evidence of a live restart/rollback. GitHub credential/site configuration and
first application activation are the remaining boundary. PROD operations/deployments: zero;
Vercel/Supabase retirement: no.

Review PR #100 and its current exact-head CI, provision the listed owner settings, configure
the staging site at the activation boundary, and authorize application activation through
the normal reviewed `develop` integration path. First validate release A, then a distinct
reviewed release B and record A→B→A→B health proof. Retain both existing providers. Stop
before any PROD migration/deployment, DNS cutover or provider retirement.
