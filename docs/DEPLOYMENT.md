# Deployment

This document covers how code moves from a feature branch to production, what each pipeline does, how to roll back, and what to do when something fails.

- Configuration of the services: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md).
- Variables: [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md).
- Decisions: ADR-012 to ADR-018, ADR-022 and ADR-025 to ADR-027 in [`DECISIONS.md`](../DECISIONS.md).
- Free-tier limits and cost: [FREE_TIER.md](FREE_TIER.md).

## Overview

```text
Feature
   │
   ▼
Pull Request ──► CI (ci.yml)
   │
   ▼
develop ──► deploy-staging.yml
   │          ├── CI (same commit)
   │          ├── Supabase DEV migrations   (supabase db push)
   │          ├── Vercel staging container  (Dockerfile.vercel)
   │          └── Smoke tests               (Playwright → /api/health, home page)
   ▼
Validation on staging
   │
   ▼
develop → main PR ──► CI (+ "Promotion source" check)
   │
   ▼
main ──► deploy-production.yml
           ├── Full CI (same commit)
           ├── Supabase PROD migrations
           ├── Vercel production container
           └── Production smoke test
```

| Environment | Branch    | Supabase                 | Vercel                                    | Workflow                |
| ----------- | --------- | ------------------------ | ----------------------------------------- | ----------------------- |
| Local       | any       | CLI local stack (Docker) | none (`npm run dev` / Docker)             | —                       |
| Staging     | `develop` | `teka-edu-dev`           | Preview (or `staging` Custom Environment) | `deploy-staging.yml`    |
| Production  | `main`    | `teka-edu-prod`          | Production                                | `deploy-production.yml` |

Persistent state never lives in the container. Postgres, and later Auth and Storage, live in Supabase. Child progress stays in the browser's IndexedDB until cloud sync is implemented (ADR-006, ADR-018).

## Branch lifecycles

### Branch protection (GitHub Rulesets, ADR-022)

`develop` and `main` are protected by the repository rulesets **Protect develop** and **Protect main**. Nobody can bypass them, including the owner:

| Rule                                     | `develop`                                                                                                                                                                     | `main`                                                                   |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Changes only through a pull request      | yes (0 approvals, conversations must be resolved)                                                                                                                             | yes (0 approvals, conversations must be resolved)                        |
| Required checks (GitHub Actions)         | `Format, lint, typecheck, unit tests, content`, `Build, client-bundle secret check, E2E smoke`, `Supabase migrations and database tests`, `Docker images (portable + Vercel)` | same 4 + `Promotion source`                                              |
| Branch must be up to date before merging | yes                                                                                                                                                                           | no, so `develop` → `main` promotions never need `main` merged back first |
| Allowed merge methods                    | squash (feature/fix/chore PRs), merge commit (back-merge of `main` after a hotfix)                                                                                            | merge commit only                                                        |
| Force push / deletion                    | blocked                                                                                                                                                                       | blocked                                                                  |

- Direct pushes are rejected with `GH013 … Changes must be made through a pull request`.
- The disabled deployment jobs are **not** required checks.
- In an emergency, an admin can temporarily edit or disable a ruleset under Settings → Rules. Record why in `PROJECT_STATUS.md`.

### Feature branch (`feature/*`, `fix/*`, `chore/*`, `docs/*`)

```bash
git checkout develop && git pull
git checkout -b feature/my-feature
npm run db:start        # only if you touch the database
npm run dev
# ... develop and test ...
npm run verify          # before every push
git push -u origin feature/my-feature   # then open a PR into develop
```

- Feature branches never deploy.
- CI runs on the PR, and a failed check blocks the merge.
- Merge into `develop` with **squash**. Afterwards, delete the branch on GitHub and locally. Git reports squashed branches as "not fully merged"; check `git diff <branch> develop` is empty before `git branch -D`.

### `develop` (integration and staging)

Every push or merge runs `deploy-staging.yml`:

1. **CI** runs for that exact commit (`ci.yml`, reused).
2. **Supabase DEV:** `supabase link`, then `supabase migration list` and `supabase db push --dry-run` (logged), then `supabase db push --yes`.
3. **Vercel:** `vercel deploy`. Vercel builds `Dockerfile.vercel` and serves the container. The URL is captured from the CLI output and optionally aliased to `STAGING_DOMAIN`.
4. **Smoke tests:** Playwright against that URL. They check `/api/health` returns `ok`, `environment=staging` and the deployed commit, and that the home page renders in French.

If a step fails, the job stops and the steps after it do not run. In particular, **the application is never deployed after a failed migration**.

### `main` (production)

- Only `develop` (or an emergency `hotfix/<name>` branch) **from this repository** may be merged into `main`. The CI `Promotion source` check (`scripts/check-promotion-source.mjs`) enforces this and is required by the `main` ruleset. It checks both the head branch name and the head repository ID from the `pull_request` event payload, so a fork's branch named `develop` or `hotfix/*` is refused.
- Promote with a PR `develop → main` and a **merge commit**, not a squash, so `main` and `develop` keep a shared history. Never delete `develop` after the merge.
- `deploy-production.yml` does the same as staging against `teka-edu-prod`, and deploys with `vercel deploy --prod`.
- Production runs are strictly serialised (`concurrency: deploy-production`, never cancelled mid-run).
- Manual approval can be added with **Required reviewers** on the GitHub `production` environment.

**Hotfix:** branch `hotfix/x` from `main`, then open a PR into `main` (merge commit). Afterwards, open a PR `main → develop` and merge it with a **merge commit**, so the branches do not diverge.

### Before the services are configured

The deploy jobs run only when the repository variables `STAGING_DEPLOY_ENABLED` / `PRODUCTION_DEPLOY_ENABLED` are `true`. Until then, pushes still run the full CI and the deploy job shows as _skipped_.

## CI pipeline (`ci.yml`)

These are separate jobs that run in parallel. Any failure blocks the merge and the deployment.

| Job                                          | Steps                                                                                                                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Promotion source                             | PRs into `main` must come from `develop` or `hotfix/<name>` **in this repository**, never from a fork (unit-tested in `tests/unit/promotion-source.test.ts`)                            |
| Format, lint, typecheck, unit tests, content | `npm ci` → `format:check` → `lint` → `typecheck` → `test` (Vitest) → `content:validate`                                                                                                 |
| Build, client-bundle secret check, E2E smoke | `next build` with fake sentinel values for server secrets → `check:client-bundle` (fails if a sentinel appears in browser JS) → Playwright smoke against the built standalone server    |
| Supabase migrations and database tests       | `supabase db start` (applies all migrations and the dev seed) → `supabase db reset` → `supabase test db` (pgTAP: RLS and access registry, reference data = `content/`, integrity rules) |
| Docker images                                | build `Dockerfile` → run it, wait for `/api/health`, stop it (must exit on SIGTERM, not be killed) → the same for `Dockerfile.vercel`                                                   |

CI never connects to a hosted Supabase project. On pushes to `develop` and `main`, CI runs inside the deploy workflows (as a reusable workflow) instead of a second time on its own.

## Database migration pipeline

```text
supabase migration new <description>   # creates supabase/migrations/<timestamp>_<description>.sql
      ↓ write the SQL (enable RLS on every new public table)
npm run db:reset                       # replays all migrations + seed locally
      ↓
npm run db:test                        # pgTAP tests (add tests for new tables/policies)
      ↓
npm run db:types                       # once the app uses the schema: regenerate lib/supabase/database.types.ts
      ↓
commit → PR → CI (fresh database: start → reset → test)
      ↓
merge to develop → db push → Supabase DEV → staging validation
      ↓
merge to main → the same migrations → Supabase PROD
```

Rules (ADR-017):

- **Migrations only.** Never change a hosted schema from the dashboard, and never run `supabase db push` against PROD from a developer machine.
- **Expand, then contract.** Add new structures first, release code that uses them, and remove the old ones in a later migration. Do not ship `DROP`/`RENAME` in the same release as the code change that stops using the old structure.
- **Label destructive migrations.** Anything that drops, renames or rewrites data needs a comment at the top of the file with `-- DESTRUCTIVE:`, the recovery plan, and a note in the PR description.
- **No seeding of hosted projects.** `supabase/seed.sql` is local-only, and `db push` runs without `--include-seed`.
- **Reference data travels as migrations.** Levels, curricula, school years, holidays and calendar exceptions are canonical in `content/`. They reach every database through **generated, idempotent data migrations** (`npm run db:reference -- --new-migration <name>`, ADR-028), never through seeds. The generated pgTAP test `reference_data.test.sql` fails CI if the migrations and `content/` differ.
- **Access decisions are tested.** Every new public table must be added, with its access decision, to the registry in `supabase/tests/database/rls.test.sql`, or the database job fails.
- **Commit applied migrations as they are.** Once a migration is on DEV or PROD, never edit or rename it. Fix forward with a new migration.

## Vercel container deployment

- The project root contains `Dockerfile.vercel`. Vercel detects it, builds the image **remotely** (linux/amd64), stores it in the **Vercel Container Registry**, and runs it as a Vercel Function (Fluid compute).
- No second registry is used (ADR-013). `Dockerfile` is the portable twin for other OCI hosts and for local production-like runs. **Keep the two files in sync.**
- The project uses Vercel's **`container` framework preset** (project setting and `vercel.json`). A project created with `vercel project add` had no preset, so Vercel ran the generic `npm run build` instead of building `Dockerfile.vercel` (first staging attempt, 2026-09-11).
- The workflows use plain `vercel deploy` (a remote build).
- **No build arguments reach the image.** The first real container build showed `buildah` warning "missing `NEXT_PUBLIC_…` build argument" for every `ARG`, including values passed with `--build-env`. Vercel provides project variables **only to the running container**.
- The app therefore reads **all** configuration at runtime (ADR-025). The image is identical for every environment, and `Dockerfile.vercel` declares no `ARG`.
- **Build metadata:** `vercel deploy --env NEXT_PUBLIC_GIT_SHA=$GITHUB_SHA` passes the commit as a runtime variable for that deployment. If `/api/health` reports `"commit": null`, the commit check is skipped rather than failed.
- **The registry is pruned before every push, not after a failure (ISSUE-011).** Vercel Hobby allows **50 images per repository** in the container registry and deletes none of them; one image (about 73 MB) goes in per merge into `develop`. When it fills, the _push_ is rejected with `denied: repository has reached the maximum allowed number of images` — which blocks `develop` entirely, because each following merge re-triggers the same failing deploy. That happened on 2026-09-19 and was recovered by deleting 15 images by hand.
  - The workflow step **Prune superseded container images** now runs `npm run registry:prune` just before `vercel deploy`.
  - `lib/deploy/registry-retention.ts` holds the policy — prune above **40**, down to **35**, never the **20** newest — and is unit tested, because the deletion itself cannot be rehearsed safely.
  - It uses the **REST API** (`/v1/vcr/repository/dockerfile/images`), not `vercel vcr`. Add it to the list above: the CLI resolves its scope through `/v2/user` and `/v1/teams`, which a project-scoped deploy token may not read, so `vercel vcr` answers `User not found` in CI while working fine on a developer machine.
  - Always protected: the commit being deployed, and the commit `/api/health` says the staging alias is serving. Below 40 images the step does nothing at all.
  - It never guesses and never blocks: if the live commit cannot be read, the registry cannot be listed, or nothing may safely go, it deletes nothing, warns with the reason, and the deploy continues. A preventive step must not be the reason a good deploy fails — and if the registry really is full, the push fails on its own with a clear message.
  - To see what it would do without touching anything: `npm run registry:prune -- --dry-run`, and `--prune-above=<n>` (dry runs only) to rehearse the whole path on a registry that is not yet full.
  - **Credential:** `VERCEL_VCR_TOKEN` (staging environment), falling back to `VERCEL_TOKEN`. The deploy token is project-scoped and the registry endpoint answers `404 VCR Repository not found` under it, so pruning needs access the deploy does not — and `VERCEL_TOKEN` should stay as narrow as it is. The step logs which credential it used.
  - **Two stages when a prune cannot run:** at **≤ 44** of 50 it warns and the deploy continues; at **≥ 45** (`dangerAt`) it fails the run _before_ the image push. With headroom, failing would turn a transient read error into an outage; near the cap, the alternative is a rejected push after the migration has already applied. 45 leaves five slots and sits five above the pruning threshold, so crossing 40 with a broken credential blocks nothing.
  - **Blocked on platform access as of 2026-09-20.** Everything above is built, tested and proven against the real registry. `VERCEL_VCR_TOKEN` now exists, scoped to the TEKA team, and the registry endpoint still answers `404 VCR Repository not found` — while the deploy's diagnostic shows the same token reading the project itself with `200`. The Vercel CLI, authenticated as a _user session_, gets `200` on the identical request. `/v1/vcr/*` appears not to be reachable by an access token at all, so a third token would not help.
  - **So pruning is manual for now**, and the count cannot be read in CI, which means the near-cap guard cannot fire either. `REGISTRY_PRUNE_ENABLED` is left unset because arming it would change nothing. Prune with `vercel vcr image ls dockerfile --project teka-edu --scope teka10` and `… image rm … <id>`, oldest first, never the image behind the live deployment (ISSUE-011).
- **First deployment = production:** Vercel makes the first deployment of a new project a production deployment even without `--prod`. The staging workflow refuses to deploy into a project with no deployment, passes an explicit `--target`, and verifies the target through the REST API before aliasing or smoke testing.
- **Runtime contract:**
  - The container listens on `$PORT`. Set the Vercel project variable `PORT=3000`, because the image runs as the non-root `node` user and may not bind port 80.
  - It binds `0.0.0.0` and is stateless.
  - On scale-down it receives SIGTERM with a 30-second grace period. The Next.js server stops accepting new connections and finishes in-flight requests.
- **Known platform constraints:**
  - Function limits apply: 4.5 MB request/response bodies, and a maximum duration that depends on the plan. Educational media must stay small, or later be served from Supabase Storage or a CDN.
  - Every request reaches the container (static files are not CDN-cached unless the response sends `s-maxage` / `CDN-Cache-Control`). This is a later optimisation, tracked in `PROJECT_STATUS.md`.
- **No duplicate deploys:** `vercel.json` sets `"git": { "deploymentEnabled": false }`, so Vercel's Git integration never deploys on its own. GitHub Actions is the only deployer (ADR-016).

## Staging (live since 2026-09-11)

- The URL is **https://teka-edu-staging.vercel.app**, protected by Vercel Authentication. Check it yourself with `vercel curl … --scope teka10`.
- The first verified deployment was run 34635262697: `dpl_99QEWbwtBTV53u5HzdudDaKndjgy`, commit `e2f8f69`, Preview, container, `cdg1`, Supabase DEV.
- Every merge into `develop` now deploys staging automatically (`STAGING_DEPLOY_ENABLED=true`). Production stays disabled.

## Smoke tests

- `tests/e2e/smoke.spec.ts` runs:
  - in CI, against the local standalone build
  - after each deployment, against the deployed URL (`PLAYWRIGHT_BASE_URL`)
- It checks `/api/health` (`status`, the expected `environment`, the expected `supabaseProjectRef` (the environment's own `SUPABASE_PROJECT_ID`), and the expected `commit`) and that the French home page renders.
- Vercel Deployment Protection is bypassed with the `x-vercel-protection-bypass` header when `VERCEL_AUTOMATION_BYPASS_SECRET` is configured.
- A failed smoke test turns the job red, and the job summary marks the deployment **unhealthy**. Investigate before promoting, and consider rolling back production.

### The public release check (`tests/e2e/production-public.spec.ts`)

The smoke test above reaches a protected deployment with `x-vercel-protection-bypass`. That is
correct for staging, and it is exactly why it cannot answer the release-day question: **a
production deployment that still required a Vercel login would pass every smoke test above.**

So there is a second suite that opens its own browser context with no bypass header, no
protection cookie and no stored state, and checks what a stranger sees: the home page answers
200 without a redirect to a login, both written classes are reachable, 2ème maternelle says it
is in preparation, a session opens, the story illustration loads, no page mentions a
non-production environment, `/api/health` reports `production` and never the DEV Supabase ref,
and nothing scrolls sideways at 360px.

```bash
PRODUCTION_PUBLIC_URL=https://teka-edu-teka10.vercel.app npm run test:e2e:public
# optionally, to pin the database as well:
EXPECTED_PRODUCTION_SUPABASE_REF=<prod-ref> PRODUCTION_PUBLIC_URL=... npm run test:e2e:public
```

Without `PRODUCTION_PUBLIC_URL` every case skips, so it never reddens the staging pipeline for
being honest about a deployment that does not exist yet. **It is deliberately not wired into
`deploy-production.yml`:** it cannot pass until Deployment Protection is changed, and failing it
_after_ `supabase db push` has already migrated PROD would be the worst possible moment. Run it
by hand immediately after the first production deployment; wire it into the workflow once
production is confirmed public.

### Deployment Protection: what the first release proved

**Settled 2026-09-22, by deploying.** This section was wrong twice before that, in opposite
directions, and the sequence is worth keeping because the second mistake looked like diligence.

1. The first audit read `ssoProtection.deploymentType = "all_except_custom_domains"`, reasoned
   that a project with no custom domain therefore has a protected production domain, and called
   it a blocker. **Correct.**
2. The second audit called that wrong. It leaned on the dashboard's wording for _Standard
   Protection_, on the API's modern name `prod_deployment_urls_and_all_previews`, and on an
   anonymous request to the production domain that answered `404 DEPLOYMENT_NOT_FOUND` rather
   than redirecting to a login. **Wrong.**
3. The first production deployment settled it. With a production deployment actually in place,
   the same anonymous request answers `302 → vercel.com/sso-api`.

**The 404 was the trap.** With no production deployment, Vercel's edge resolves the domain, finds
nothing and answers 404 _before_ protection is applied. That silence read like "not protected"
and it was only "nothing there yet". No amount of probing an empty production domain can tell you
how a deployed one will behave — only a deployment can.

**What the stored value actually means.** `all_except_custom_domains` is a _legacy_ protection
mode and is not one of the three the API documents today (`all`,
`prod_deployment_urls_and_all_previews`, `preview`). It protects everything except **custom**
domains — and a project with no custom domain has none, so the auto-assigned production alias is
protected like everything else. The dashboard may still render it as "Standard Protection", which
is how a correctly-saved-looking setting produced legacy behaviour.

Measured on 2026-09-22, anonymously, with a production deployment live:

| URL                                                           | Result                         |
| ------------------------------------------------------------- | ------------------------------ |
| `teka-edu-teka10.vercel.app` (production domain)              | **302 → `vercel.com/sso-api`** |
| `teka-7ip54y856-teka10.vercel.app` (generated production URL) | 302 → `vercel.com/sso-api`     |
| `teka-edu-staging.vercel.app` (preview alias)                 | 302 → `vercel.com/sso-api`     |

**The fix, and it is the owner's.** Select **Only Preview Deployments** in Vercel →
`teka-edu` → Settings → Deployment Protection → Vercel Authentication, and Save. Staging is a
_Preview_ deployment, so it stays protected; the production domain becomes public. Re-saving
"Standard Protection" may also rewrite the legacy value to the modern one, but that is a guess and
this setting has already cost one failed release — pick the mode whose name says what it does.

The trade-off, stated: under _Only Preview Deployments_ the generated production deployment URLs
become public too. For a beta that is acceptable. The alternative is a custom domain, which costs
money, and cost is not something this project spends without asking.

**Do not disable Vercel Authentication.** That would expose every preview.

### Preflight: what the production job proves before it changes anything

Two read-only checks run at the very start of the production deploy, before `supabase db push`:

| Preflight                                                               | Passes when                                                         | Why it is first                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /v9/projects/{VERCEL_PROJECT_ID}` with the production token        | HTTP 200 and the project is named `teka-edu`                        | The deploy token can only be exercised from `main` — the `production` environment is restricted to it — so a release is the first time it is used. Finding out it is scoped to the wrong team _after_ migrating production would be the worst moment. |
| `GET /v1/projects/{SUPABASE_PROJECT_ID}` with the Supabase access token | project is named `teka-edu-prod` **and** status is `ACTIVE_HEALTHY` | A Free-plan project pauses when unused, and `db push` against a paused project fails partway. It also catches the one silent, serious mistake: production wired to the development database.                                                          |

Both fail closed with a message naming the fix, and neither changes anything.

### Where a production release can fail, and what is true afterwards

The pipeline is ordered migration → deploy → verify → smoke, so each failure point leaves a known
state rather than a half-applied one.

| Fails at                                        | What has happened                                                                                                                                                     | What to do                                                                                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI, secret check, or `db push --dry-run`        | **Nothing.** No schema change, no deployment.                                                                                                                         | Fix and re-run. Production is untouched.                                                                                                          |
| `supabase db push` (migration)                  | Migrations up to the failing one are applied; the job stops **before** any deployment, so the live application is still the previous one against the previous schema. | Forward-fix with a new migration. Because migrations are additive and expand/contract, the running application keeps working meanwhile.           |
| After migration, before the deployment is READY | Schema is new, application is old. This is exactly the case expand/contract exists for: the old application does not use the new columns.                             | Re-run the deploy. No schema rollback.                                                                                                            |
| Deployment READY but smoke test red             | A bad application is live on the new schema.                                                                                                                          | `vercel rollback` to the previous production deployment — seconds, no rebuild. The schema stays; the previous application tolerates it by design. |

**The limitation, stated plainly:** there is no database rollback. Additive migrations and an
application rollback cover every case above, and that is the whole of the guarantee. A migration
that dropped or rewrote data would break it, which is why none does — see the audit in
`docs/releases/BETA_0_1_READINESS.md` §0.

### Database rollback and recovery

Migrations are not assumed to be reversible:

1. **Prefer a forward fix:** a new migration that repairs the problem, shipped through the normal pipeline.
2. **Backward-compatible design** (expand/contract) keeps the previous application version working against the new schema, so an application rollback alone is usually enough.
3. **Backups / point-in-time recovery** in Supabase are for data loss. Both projects are on the **Free plan (2026-09-11), which has no downloadable backups and no point-in-time recovery**. The project stays on Free in this phase (ADR-027), so the only recovery path is your own exports. The zero-cost design, not yet implemented, is in [FREE_TIER.md](FREE_TIER.md#zero-cost-backup-design-for-teka-edu-prod-design-only-not-implemented). Until then, the path is exports (`npx supabase db dump --project-ref <ref>` for schema, plus `--data-only` for data), kept outside the repository. Upgrade PROD before real user data arrives. Restoring is a manual, deliberate decision.
4. **Never** run destructive rollback SQL automatically, and never because an application deployment failed.

## Common deployment failures

| Symptom                                                                                                                   | Likely cause                                                                                          | Action                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Missing secret X in the 'staging' environment`                                                                           | GitHub Environment secret not set                                                                     | Add it (ENVIRONMENT_SETUP.md sections 10–11)                                                                                                          |
| `supabase link` fails                                                                                                     | Wrong `SUPABASE_PROJECT_ID`, expired `SUPABASE_ACCESS_TOKEN`, or wrong `SUPABASE_DB_PASSWORD`         | Check the values of _that_ environment                                                                                                                |
| `db push`: remote migration versions not found locally                                                                    | Someone changed the hosted schema outside migrations, or an old commit is being deployed              | Never edit hosted schemas by hand. Reconcile with `supabase migration list` / `supabase migration repair` after review                                |
| `db push` fails on SQL                                                                                                    | Migration invalid against real data                                                                   | Nothing was deployed. Fix forward with a new migration                                                                                                |
| Build fails with `Invalid public environment configuration`                                                               | A Vercel variable is missing or wrong (e.g. local URL in staging, secret key in a `NEXT_PUBLIC_` var) | Fix the variable in Vercel. The message names it without revealing the value                                                                          |
| Deployment works but requests time out or return 502                                                                      | `PORT` not set to `3000` in Vercel                                                                    | Set `PORT=3000` for that environment and redeploy                                                                                                     |
| Smoke test gets 401/403                                                                                                   | Deployment Protection without bypass                                                                  | Configure `VERCEL_AUTOMATION_BYPASS_SECRET`                                                                                                           |
| Smoke test: `environment` mismatch                                                                                        | `NEXT_PUBLIC_APP_ENV` missing or wrong in that Vercel scope                                           | Fix it in that Vercel scope and redeploy (read at container start)                                                                                    |
| Two deployments for one push                                                                                              | Vercel Git integration re-enabled                                                                     | Keep `git.deploymentEnabled: false`, and check the project settings                                                                                   |
| Staging build fails with `Invalid public environment configuration … production deployment` on the project's first deploy | Vercel makes the **first deployment of a new project** production, even without `--prod`              | Expected on a brand-new project. The failed production deployment is kept; later deploys are Preview. The workflow pre-check refuses an empty project |
| Vercel runs `npm run build` instead of building the image                                                                 | Project framework preset is not `container`                                                           | Set the project framework to `container` (it is also pinned in `vercel.json`)                                                                         |
| `/api/health` reports `environment: local` on Vercel                                                                      | Configuration was expected at build time (Vercel passes no build arguments)                           | Read configuration at runtime only (ADR-025). Check the Vercel variables of that scope                                                                |
| `Error: User not found.` from `vercel inspect` / `vercel alias` in CI                                                     | Project-scoped token cannot call user-level endpoints                                                 | Use the REST API (the workflows already do)                                                                                                           |
| CI `Promotion source` fails                                                                                               | PR into `main` from a feature branch, or from a fork                                                  | Merge into `develop` first                                                                                                                            |

## Secrets in logs

- Workflows never print secrets. Values come from `secrets.*`, which GitHub masks.
- Nothing dumps the environment (`env`, `printenv`, `set -x` are not used).
- The environment validation never includes values in its messages.
- Do not add debugging steps that print variables.
