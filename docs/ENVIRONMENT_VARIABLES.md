# Environment Variable Inventory

This is the **single authoritative list** of every variable Teka Edu uses. Keep it in sync with:

- `lib/env/schema.ts`, which validates the values (the app refuses to start or build if they are invalid)
- `.env.example`, `.env.local.example`, `.env.development.example`, `.env.production.example`
- `.github/workflows/*.yml` and `Dockerfile` / `Dockerfile.vercel`
- the Vercel project settings and GitHub Environments (see [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md))

Change a variable in all of those places in the same pull request, and update this file too.

**Two families that must never mix:**

1. **Application variables** (A, B and C below) are read by the Next.js app. They live in `.env.local` locally and in **Vercel** for hosted environments.
2. **Deployment and CI credentials** (D and E) let GitHub Actions control Vercel and Supabase. They live **only** in **GitHub Environment secrets and variables**. They are never Vercel variables, never `NEXT_PUBLIC_*`, and never read by the app.

Legend: **Public** means inlined into the browser JavaScript, so anyone can read it. **Secret** means server-side only and must never be exposed. **Build** means the value is fixed when `next build` runs. **Runtime** means it is read when the server starts or on use.

## A. Application: browser-safe (`NEXT_PUBLIC_*`, build time)

Next.js inlines these into the JavaScript at build time. Changing one requires a **rebuild or redeploy**. In Docker they are build arguments. On Vercel, the platform passes them to `docker build` as build arguments.

| Name                                     | Scope | Local                             | Staging                         | Production                       | Public/Secret             | Used by                                                        | Required                                                                    | Source                           |
| ---------------------------------------- | ----- | --------------------------------- | ------------------------------- | -------------------------------- | ------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_APP_NAME`                   | build | `Teka Edu`                        | `Teka Edu`                      | `Teka Edu`                       | Public                    | `app/layout.tsx` (title)                                       | No (default `Teka Edu`)                                                     | Constant                         |
| `NEXT_PUBLIC_DEFAULT_LOCALE`             | build | `fr`                              | `fr`                            | `fr`                             | Public                    | `<html lang>`                                                  | No (default `fr`)                                                           | Constant (ADR-001)               |
| `NEXT_PUBLIC_DEFAULT_COUNTRY`            | build | `CD`                              | `CD`                            | `CD`                             | Public                    | Config (calendar in Phase 1)                                   | No (default `CD`)                                                           | Constant                         |
| `NEXT_PUBLIC_APP_ENV`                    | build | `local`                           | `staging`                       | `production`                     | Public                    | Env guard, `/api/health`                                       | **Yes** in staging/prod (defaults to `local`; deploy smoke tests verify it) | Per environment                  |
| `NEXT_PUBLIC_APP_URL`                    | build | `http://localhost:3000`           | staging URL                     | production domain                | Public                    | Guard (future: auth redirects, links)                          | **Yes** in staging/prod (must not be a local host)                          | Vercel domain / DNS              |
| `NEXT_PUBLIC_SUPABASE_URL`               | build | `http://127.0.0.1:54321` or empty | `https://<DEV_REF>.supabase.co` | `https://<PROD_REF>.supabase.co` | Public                    | Future Supabase browser client                                 | Only if cloud sync is on (set together with the key)                        | Supabase → Connect / project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`   | build | local `sb_publishable_…` or empty | DEV `sb_publishable_…`          | PROD `sb_publishable_…`          | Public (protected by RLS) | Future Supabase browser client                                 | Only if cloud sync is on                                                    | Supabase → Settings → API Keys   |
| `NEXT_PUBLIC_ENABLE_ENGLISH_SCAFFOLDING` | build | `true`                            | `true`                          | `true`                           | Public                    | Feature flag (Phase 2)                                         | No (default `true`)                                                         | Product decision                 |
| `NEXT_PUBLIC_ENABLE_CLOUD_SYNC`          | build | `false`                           | `false` until sync exists       | `false` until sync exists        | Public                    | Feature flag; `true` makes the Supabase browser vars mandatory | No (default `false`)                                                        | Product decision                 |
| `NEXT_PUBLIC_APP_VERSION`                | build | (package.json)                    | (package.json)                  | (package.json)                   | Public                    | `/api/health`                                                  | No (default `package.json` version)                                         | `next.config.ts`                 |
| `NEXT_PUBLIC_GIT_SHA`                    | build | empty                             | commit SHA                      | commit SHA                       | Public                    | `/api/health`, smoke tests                                     | No (set by CD)                                                              | CD: `vercel deploy --build-env`  |

Validation rules enforced in `lib/env/schema.ts`:

- The publishable key must start with `sb_publishable_`. A key starting with `sb_secret_` is refused with a "rotate it" error.
- With `NEXT_PUBLIC_APP_ENV=local`, Supabase URLs must be local hosts (`127.0.0.1`, `localhost`, `[::1]`, `host.docker.internal`).
- With `staging` or `production`, Supabase URLs must use https and must not be local hosts.
- Once the project refs are recorded in `lib/env/supabase-projects.ts`, a staging deployment pointing at the PROD project is refused, and vice versa.

## B. Application: server-only secrets (runtime)

Never prefix these with `NEXT_PUBLIC_`. They are read only through `lib/env/server.ts` (which imports `server-only`) and validated at server start (`instrumentation.ts`). CI verifies they never appear in browser bundles (`npm run check:client-bundle`).

| Name                  | Scope             | Local                        | Staging                                    | Production                  | Public/Secret | Used by                                       | Required                                | Source                                      |
| --------------------- | ----------------- | ---------------------------- | ------------------------------------------ | --------------------------- | ------------- | --------------------------------------------- | --------------------------------------- | ------------------------------------------- |
| `SUPABASE_SECRET_KEY` | runtime           | local `sb_secret_…` or empty | DEV `sb_secret_…`                          | PROD `sb_secret_…`          | **Secret**    | Nothing yet (future privileged server code)   | No (planned)                            | Supabase → Settings → API Keys              |
| `DATABASE_URL`        | runtime           | local DB URL or empty        | DEV **transaction pooler** URL (port 6543) | PROD transaction pooler URL | **Secret**    | Nothing yet (planned server/DB tooling)       | No (planned)                            | Supabase → **Connect** → Transaction pooler |
| `DIRECT_DATABASE_URL` | runtime / tooling | local DB URL or empty        | DEV **direct** URL (port 5432)             | PROD direct URL             | **Secret**    | Nothing yet (planned migration/admin tooling) | No (planned)                            | Supabase → **Connect** → Direct connection  |
| `AI_ENABLED`          | runtime           | `false`                      | `false`                                    | `false`                     | Config        | Env guard: must be `false` (ADR-002)          | No (default `false`; `true` is refused) | Constant                                    |

- The secret key must start with `sb_secret_`.
- Both database URLs must be `postgres://` or `postgresql://` URLs. Percent-encode special characters in the password.
- CI/CD migrations do **not** use these URLs. They use `supabase link` with the D-section credentials.

## C. Application: runtime/platform

| Name                      | Scope         | Local                          | Staging    | Production | Public/Secret | Used by                   | Required                                                                                        | Source                         |
| ------------------------- | ------------- | ------------------------------ | ---------- | ---------- | ------------- | ------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------ |
| `PORT`                    | runtime       | `3000` (default)               | **`3000`** | **`3000`** | Config        | Next.js standalone server | **Yes on Vercel** (Vercel routes to `PORT`, default 80; the non-root container listens on 3000) | Set in Vercel project env vars |
| `HOSTNAME`                | runtime       | set by Dockerfiles (`0.0.0.0`) | same       | same       | Config        | Next.js standalone server | Do not set in Vercel                                                                            | Dockerfiles                    |
| `NODE_ENV`                | runtime       | `production` in images         | same       | same       | Config        | Node/Next.js              | Set by Dockerfiles / Next.js                                                                    | Dockerfiles                    |
| `NEXT_TELEMETRY_DISABLED` | build/runtime | `1` in images                  | same       | same       | Config        | Next.js                   | Set by Dockerfiles                                                                              | Dockerfiles                    |

## D. Deployment/CI credentials: GitHub Environment secrets

These are stored in GitHub → Settings → Environments → `staging` / `production`. The same names are used in both environments and each holds that environment's value. Workflows read them as `secrets.X`. They must **never** be added to Vercel or to any `.env` file.

| Name                              | Scope | Local | Staging (`staging` env)        | Production (`production` env)        | Public/Secret           | Used by                                                                                | Required                                          | Source                                                                                  |
| --------------------------------- | ----- | ----- | ------------------------------ | ------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `VERCEL_TOKEN`                    | CI    | —     | Vercel token                   | Vercel token (may be the same token) | **Secret**              | `vercel deploy`, `vercel alias`                                                        | **Yes**                                           | Vercel → Account Settings → Tokens                                                      |
| `VERCEL_ORG_ID`                   | CI    | —     | Vercel team/user ID            | same value                           | **Secret** (identifier) | Vercel CLI project selection                                                           | **Yes**                                           | Vercel team Settings → General (Team ID), or `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID`               | CI    | —     | Vercel project ID              | same value (one Vercel project)      | **Secret** (identifier) | Vercel CLI project selection                                                           | **Yes**                                           | Vercel project → Settings → General (Project ID)                                        |
| `SUPABASE_ACCESS_TOKEN`           | CI    | —     | Supabase personal access token | same or a separate token             | **Secret**              | `supabase link`, `supabase db push`                                                    | **Yes**                                           | https://supabase.com/dashboard/account/tokens                                           |
| `SUPABASE_PROJECT_ID`             | CI    | —     | **DEV** project ref            | **PROD** project ref                 | **Secret** (identifier) | `supabase link --project-ref`                                                          | **Yes**                                           | Dashboard URL `…/project/<ref>` or Settings → General                                   |
| `SUPABASE_DB_PASSWORD`            | CI    | —     | **DEV** database password      | **PROD** database password           | **Secret**              | `supabase link` / `db push`                                                            | **Yes**                                           | Set when creating the project (Settings → Database to reset)                            |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | CI    | —     | bypass secret                  | same value                           | **Secret**              | Smoke tests through Vercel Deployment Protection (`x-vercel-protection-bypass` header) | Only if Deployment Protection is on (recommended) | Vercel project → Settings → Deployment Protection → Protection Bypass for Automation    |

`SUPABASE_DB_URL` is **not used**: migrations run through `supabase link` plus `SUPABASE_DB_PASSWORD`.

In any job that runs the _local_ Supabase stack, do not export `SUPABASE_PROJECT_ID`: the CLI also treats it as the local project id.

## E. Deployment/CI switches: GitHub variables (not secret)

| Name                        | Where                          | Value                                                              | Used by                                                | Required                     |
| --------------------------- | ------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------ | ---------------------------- |
| `STAGING_DEPLOY_ENABLED`    | Repository variable            | `true` once staging is configured                                  | `deploy-staging.yml` (deploy job is skipped otherwise) | Yes, to enable staging CD    |
| `PRODUCTION_DEPLOY_ENABLED` | Repository variable            | `true` once production is configured                               | `deploy-production.yml`                                | Yes, to enable production CD |
| `VERCEL_STAGING_TARGET`     | `staging` environment variable | empty (Preview) or `staging` (Vercel Custom Environment, Pro plan) | `deploy-staging.yml`                                   | No                           |
| `STAGING_DOMAIN`            | `staging` environment variable | e.g. `staging.<domain>`                                            | `deploy-staging.yml` (`vercel alias set`)              | No                           |

## F. Workflow-internal (set by the workflows, never configured)

| Name                                                                            | Purpose                                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `VERCEL_CLI_VERSION`                                                            | Pinned Vercel CLI version in deploy workflows                            |
| `VERCEL_TELEMETRY_DISABLED`                                                     | Disables Vercel CLI telemetry in CI                                      |
| `PLAYWRIGHT_BASE_URL`                                                           | Target URL for deployment smoke tests                                    |
| `EXPECTED_GIT_SHA`, `EXPECTED_APP_ENV`                                          | Smoke tests assert the deployed commit and environment via `/api/health` |
| CI sentinels for `SUPABASE_SECRET_KEY` / `DATABASE_URL` / `DIRECT_DATABASE_URL` | Fake values used only to prove no server secret reaches browser bundles  |

## DEV/PROD separation (strict)

These must **never** hold the same value in staging and production: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `DIRECT_DATABASE_URL`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`.

A staging or local configuration that reaches the production database is a **high-severity configuration defect**. Fix it immediately and rotate any exposed credentials.
