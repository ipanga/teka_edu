# Deployment

This document covers how code moves from a feature branch to production, what each pipeline does, how to roll back, and what to do when something fails.

- Configuration of the services: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md).
- Variables: [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md).
- Decisions: ADR-012 to ADR-018 and ADR-022 in [`DECISIONS.md`](../DECISIONS.md).

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

- Only `develop` (or an emergency `hotfix/*` branch) may be merged into `main`. The CI `Promotion source` check enforces this and is required by the `main` ruleset.
- Promote with a PR `develop → main` and a **merge commit**, not a squash, so `main` and `develop` keep a shared history. Never delete `develop` after the merge.
- `deploy-production.yml` does the same as staging against `teka-edu-prod`, and deploys with `vercel deploy --prod`.
- Production runs are strictly serialised (`concurrency: deploy-production`, never cancelled mid-run).
- Manual approval can be added with **Required reviewers** on the GitHub `production` environment.

**Hotfix:** branch `hotfix/x` from `main`, then open a PR into `main` (merge commit). Afterwards, open a PR `main → develop` and merge it with a **merge commit**, so the branches do not diverge.

### Before the services are configured

The deploy jobs run only when the repository variables `STAGING_DEPLOY_ENABLED` / `PRODUCTION_DEPLOY_ENABLED` are `true`. Until then, pushes still run the full CI and the deploy job shows as _skipped_.

## CI pipeline (`ci.yml`)

These are separate jobs that run in parallel. Any failure blocks the merge and the deployment.

| Job                                          | Steps                                                                                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Promotion source                             | PRs into `main` must come from `develop` or `hotfix/*`                                                                                                                               |
| Format, lint, typecheck, unit tests, content | `npm ci` → `format:check` → `lint` → `typecheck` → `test` (Vitest) → `content:validate`                                                                                              |
| Build, client-bundle secret check, E2E smoke | `next build` with fake sentinel values for server secrets → `check:client-bundle` (fails if a sentinel appears in browser JS) → Playwright smoke against the built standalone server |
| Supabase migrations and database tests       | `supabase db start` (applies all migrations and the dev seed) → `supabase db reset` → `supabase test db` (pgTAP; includes the "RLS on every public table" guard)                     |
| Docker images                                | build `Dockerfile` → run it, wait for `/api/health`, stop it (must exit on SIGTERM, not be killed) → the same for `Dockerfile.vercel`                                                |

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
- **Commit applied migrations as they are.** Once a migration is on DEV or PROD, never edit or rename it. Fix forward with a new migration.

## Vercel container deployment

- The project root contains `Dockerfile.vercel`. Vercel detects it, builds the image **remotely** (linux/amd64), stores it in the **Vercel Container Registry**, and runs it as a Vercel Function (Fluid compute).
- No second registry is used (ADR-013). `Dockerfile` is the portable twin for other OCI hosts and for local production-like runs. **Keep the two files in sync.**
- The workflows use plain `vercel deploy` (remote build), not `vercel build && vercel deploy --prebuilt`. Research on 2026-09-11 (vercel/vercel source and docs) found:
  - The prebuilt path does not pass the project's build variables to `docker build`, so `NEXT_PUBLIC_*` values would be missing from the image.
  - The prebuilt path needs Docker plus an OIDC token on the runner.
  - A remote build passes the project's build variables as `--build-arg`, which is why `Dockerfile.vercel` declares every `NEXT_PUBLIC_*` as `ARG`.
- **Build metadata:** `--build-env NEXT_PUBLIC_GIT_SHA=$GITHUB_SHA` passes the commit to the build. Forwarding `--build-env` into container build arguments is inferred from the Vercel CLI source, not documented. If `/api/health` reports `"commit": null`, the commit check is skipped rather than failed.
- **Runtime contract:**
  - The container listens on `$PORT`. Set the Vercel project variable `PORT=3000`, because the image runs as the non-root `node` user and may not bind port 80.
  - It binds `0.0.0.0` and is stateless.
  - On scale-down it receives SIGTERM with a 30-second grace period. The Next.js server stops accepting new connections and finishes in-flight requests.
- **Known platform constraints:**
  - Function limits apply: 4.5 MB request/response bodies, and a maximum duration that depends on the plan. Educational media must stay small, or later be served from Supabase Storage or a CDN.
  - Every request reaches the container (static files are not CDN-cached unless the response sends `s-maxage` / `CDN-Cache-Control`). This is a later optimisation, tracked in `PROJECT_STATUS.md`.
- **No duplicate deploys:** `vercel.json` sets `"git": { "deploymentEnabled": false }`, so Vercel's Git integration never deploys on its own. GitHub Actions is the only deployer (ADR-016).

## Smoke tests

- `tests/e2e/smoke.spec.ts` runs:
  - in CI, against the local standalone build
  - after each deployment, against the deployed URL (`PLAYWRIGHT_BASE_URL`)
- It checks `/api/health` (`status`, expected `environment`, expected `commit`) and that the French home page renders.
- Vercel Deployment Protection is bypassed with the `x-vercel-protection-bypass` header when `VERCEL_AUTOMATION_BYPASS_SECRET` is configured.
- A failed smoke test turns the job red, and the job summary marks the deployment **unhealthy**. Investigate before promoting, and consider rolling back production.

## Rollback

### Application rollback

The fastest option is Vercel's instant rollback. It re-points the domain without rebuilding. Run it from a checkout linked with `vercel link`, or with `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` exported.

```bash
vercel rollback --token "$VERCEL_TOKEN"                 # previous production deployment
vercel rollback <deployment-url-or-id> --token ...      # a specific one (Pro/Enterprise)
vercel rollback status --token ...
vercel promote <deployment-url-or-id> --token ...       # re-enable normal promotion afterwards
```

- On **Hobby**, only the previous production deployment is available. On **Pro/Enterprise**, any earlier production deployment is.
- After a rollback, automatic promotion of new production deployments is paused until `vercel promote` is run.
- **Code rollback:** revert the faulty commit on `develop` → staging → `main`. The normal pipeline redeploys.
  - Re-running an **old** deployment workflow run is not a rollback. Its `supabase db push` fails if the remote database already has newer migrations.
- **Other OCI hosts:** redeploy the previous image, built from the previous commit with `Dockerfile`.

### Database rollback and recovery

Migrations are not assumed to be reversible:

1. **Prefer a forward fix:** a new migration that repairs the problem, shipped through the normal pipeline.
2. **Backward-compatible design** (expand/contract) keeps the previous application version working against the new schema, so an application rollback alone is usually enough.
3. **Backups / point-in-time recovery** in Supabase are for data loss. Their availability depends on the plan, recorded in ENVIRONMENT_SETUP.md section 3. Restoring is a manual, deliberate decision.
4. **Never** run destructive rollback SQL automatically, and never because an application deployment failed.

## Common deployment failures

| Symptom                                                     | Likely cause                                                                                          | Action                                                                                                                 |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `Missing secret X in the 'staging' environment`             | GitHub Environment secret not set                                                                     | Add it (ENVIRONMENT_SETUP.md sections 10–11)                                                                           |
| `supabase link` fails                                       | Wrong `SUPABASE_PROJECT_ID`, expired `SUPABASE_ACCESS_TOKEN`, or wrong `SUPABASE_DB_PASSWORD`         | Check the values of _that_ environment                                                                                 |
| `db push`: remote migration versions not found locally      | Someone changed the hosted schema outside migrations, or an old commit is being deployed              | Never edit hosted schemas by hand. Reconcile with `supabase migration list` / `supabase migration repair` after review |
| `db push` fails on SQL                                      | Migration invalid against real data                                                                   | Nothing was deployed. Fix forward with a new migration                                                                 |
| Build fails with `Invalid public environment configuration` | A Vercel variable is missing or wrong (e.g. local URL in staging, secret key in a `NEXT_PUBLIC_` var) | Fix the variable in Vercel. The message names it without revealing the value                                           |
| Deployment works but requests time out or return 502        | `PORT` not set to `3000` in Vercel                                                                    | Set `PORT=3000` for that environment and redeploy                                                                      |
| Smoke test gets 401/403                                     | Deployment Protection without bypass                                                                  | Configure `VERCEL_AUTOMATION_BYPASS_SECRET`                                                                            |
| Smoke test: `environment` mismatch                          | `NEXT_PUBLIC_APP_ENV` missing or wrong in that Vercel scope                                           | Fix it and redeploy (the value is inlined at build time)                                                               |
| Two deployments for one push                                | Vercel Git integration re-enabled                                                                     | Keep `git.deploymentEnabled: false`, and check the project settings                                                    |
| CI `Promotion source` fails                                 | PR into `main` from a feature branch                                                                  | Merge into `develop` first                                                                                             |

## Secrets in logs

- Workflows never print secrets. Values come from `secrets.*`, which GitHub masks.
- Nothing dumps the environment (`env`, `printenv`, `set -x` are not used).
- The environment validation never includes values in its messages.
- Do not add debugging steps that print variables.
