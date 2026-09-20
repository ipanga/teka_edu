# Environment Variable Inventory

This is the **single source of truth** for every environment variable Teka Edu uses.

> **Repository policy (ADR-023):** no file whose name starts with `.env` is ever tracked by Git. That includes `.env.example`-style templates. Real values live only in:
>
> - your local, Git-ignored `.env.local`
> - GitHub Environment secrets and variables
> - Vercel project environment variables
> - the Supabase dashboard
>
> The examples in this document are placeholders or harmless constants only.
>
> **Current storage (2026-09-11):** the real Supabase DEV and PROD values are in the owner's macOS Keychain (accounts `teka-edu-dev` / `teka-edu-prod`, one item per variable; see [ENVIRONMENT_SETUP.md section 2](ENVIRONMENT_SETUP.md#2-supabase-projects-done-2026-09-11)). The CI credentials are in the GitHub `staging` / `production` environments. The Vercel project `teka-edu` holds the runtime values: Preview (= staging) has the DEV values and Production the PROD values, without `NEXT_PUBLIC_APP_URL` yet. See [ENVIRONMENT_SETUP.md sections 6–8](ENVIRONMENT_SETUP.md#6-vercel-project-done-2026-09-11).

Keep this file in sync with:

- `lib/env/schema.ts`, which validates the values (the app refuses to build or start with an invalid configuration)
- `.github/workflows/*.yml`
- `app/`, `lib/`: variables are read at runtime only, never as a literal `process.env` member for `NEXT_PUBLIC_*` (ADR-025)
- the Vercel project settings and GitHub Environments ([ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md))

Change a variable in all of those places in the same pull request.

**Two families that must never mix:**

1. **Application variables** are read by the Next.js app (sections 1–2 and 6). They live in `.env.local` locally and in **Vercel** when hosted.
2. **Deployment credentials and controls** are used only by GitHub Actions (sections 3–5). They live **only** in **GitHub**. They are never Vercel variables, never `NEXT_PUBLIC_*`, and never read by the app.

**Public** (`NEXT_PUBLIC_*`) means the value is safe to show in a browser. All variables, public or secret, are **read by the server at runtime** (ADR-025), because Vercel's container builder passes no build arguments. Changing a value takes effect at the next deployment or container start, and browser code only ever receives values the server passes explicitly. **Secret** means server- or CI-only and must never be exposed.

## 1. Application

| Variable                                 | Purpose                                                                                  | Local                   | Staging                   | Production                | Public / Secret | Where configured                                 | Where obtained        | Required / Optional                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------- | ------------------------- | ------------------------- | --------------- | ------------------------------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_NAME`                   | App name (page title)                                                                    | `Teka Edu`              | `Teka Edu`                | `Teka Edu`                | Public          | `.env.local` / Vercel                            | Constant              | Optional (default `Teka Edu`)                                                                        |
| `NEXT_PUBLIC_APP_ENV`                    | Environment identity; drives the environment guard and `/api/health`                     | `local`                 | `staging`                 | `production`              | Public          | `.env.local` / Vercel (per scope)                | Per environment       | **Required** in staging/production (defaults to `local`; deploy smoke tests check it)                |
| `NEXT_PUBLIC_APP_URL`                    | Public URL of this deployment                                                            | `http://localhost:3000` | staging URL               | production domain         | Public          | `.env.local` / Vercel                            | Vercel domain / DNS   | **Required** in staging/production (must not be a local host)                                        |
| `NEXT_PUBLIC_DEFAULT_LOCALE`             | Default UI language (`<html lang>`)                                                      | `fr`                    | `fr`                      | `fr`                      | Public          | `.env.local` / Vercel                            | Constant (ADR-001)    | Optional (default `fr`)                                                                              |
| `NEXT_PUBLIC_DEFAULT_COUNTRY`            | Default country (calendar in Phase 1)                                                    | `CD`                    | `CD`                      | `CD`                      | Public          | `.env.local` / Vercel                            | Constant              | Optional (default `CD`)                                                                              |
| `NEXT_PUBLIC_ENABLE_ENGLISH_SCAFFOLDING` | Feature flag: optional English support                                                   | `true`                  | `true`                    | `true`                    | Public          | `.env.local` / Vercel                            | Product decision      | Optional (default `true`)                                                                            |
| `NEXT_PUBLIC_ENABLE_CLOUD_SYNC`          | Feature flag: cloud progress sync. `true` makes the Supabase browser variables mandatory | `false`                 | `false` until sync exists | `false` until sync exists | Public          | `.env.local` / Vercel                            | Product decision      | Optional (default `false`)                                                                           |
| `AI_ENABLED`                             | Must stay `false`: V1 has no runtime AI (ADR-002)                                        | `false`                 | `false`                   | `false`                   | Server config   | `.env.local` / Vercel                            | Constant              | Optional (default `false`; `true` is refused)                                                        |
| `PORT`                                   | Port the server listens on                                                               | `3000` (default)        | **`3000`**                | **`3000`**                | Config          | Vercel (all scopes); Dockerfiles default it      | Constant              | **Required on Vercel** (Vercel routes to `PORT`, default 80; the non-root container listens on 3000) |
| `NEXT_PUBLIC_GIT_SHA`                    | Deployed commit reported by `/api/health`                                                | empty                   | commit SHA                | commit SHA                | Public          | Deploy workflow: `vercel deploy --env` (runtime) | GitHub (`github.sha`) | Optional (set by CD)                                                                                 |

## 2. Supabase runtime (application)

| Variable                               | Purpose                                                                                                                                                                                         | Local                             | Staging                                 | Production                               | Public / Secret | Where configured                  | Where obtained                                                      | Required / Optional                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------- | ---------------------------------------- | --------------- | --------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase API URL for the browser client                                                                                                                                                         | `http://127.0.0.1:54321` or unset | `https://<DEV_PROJECT_REF>.supabase.co` | `https://<PROD_PROJECT_REF>.supabase.co` | Public          | `.env.local` / Vercel             | `npx supabase status` (local); dashboard → **Connect** (hosted)     | Required only when cloud sync is on (set together with the key) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser key (`sb_publishable_…`), protected by RLS                                                                                                                                              | local publishable key or unset    | DEV publishable key                     | PROD publishable key                     | Public          | `.env.local` / Vercel             | `npx supabase status`; dashboard → Settings → **API Keys**          | Required only when cloud sync is on                             |
| `SUPABASE_SECRET_KEY`                  | Privileged server key (`sb_secret_…`)                                                                                                                                                           | local secret key or unset         | DEV secret key                          | PROD secret key                          | **Secret**      | `.env.local` / Vercel (Sensitive) | `npx supabase status`; dashboard → Settings → **API Keys**          | Optional (no code uses it yet)                                  |
| `DATABASE_URL`                         | Postgres URL for server code (serverless: transaction pooler, port 6543)                                                                                                                        | local DB URL or unset             | DEV pooler URL                          | PROD pooler URL                          | **Secret**      | `.env.local` / Vercel (Sensitive) | `npx supabase status`; dashboard → **Connect** → Transaction pooler | Optional (planned)                                              |
| `DIRECT_DATABASE_URL`                  | Direct Postgres URL for tooling (port 5432). **IPv6 only** on Supabase unless the IPv4 add-on is bought; unreachable from IPv4 networks such as Vercel. Use the session pooler for IPv4 tooling | local DB URL or unset             | DEV direct URL                          | PROD direct URL                          | **Secret**      | `.env.local` / Vercel (Sensitive) | `npx supabase status`; dashboard → **Connect** → Direct connection  | Optional (planned)                                              |

`DIRECT_DATABASE_URL` is not needed today. The Supabase CLI and CI already use the IPv4 **session pooler** (port 5432), and backup or migration tooling over IPv4 should use that session-pooler string too; see [FREE_TIER.md](FREE_TIER.md#direct_database_url-ipv6-only). The environment guard is an allowlist: hosted database and Supabase URLs must contain exactly their environment's project ref.

Server secrets are read only through `lib/env/server.ts` (which imports `server-only`) and validated at server start (`instrumentation.ts`). CI proves they never reach browser bundles (`npm run check:client-bundle`). CI/CD migrations do **not** use these database URLs; they use section 3.

## 3. Supabase deployment (GitHub Actions only)

| Variable                | Purpose                                        | Local | Staging                        | Production               | Public / Secret         | Where configured                                     | Where obtained                                               | Required / Optional |
| ----------------------- | ---------------------------------------------- | ----- | ------------------------------ | ------------------------ | ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------ | ------------------- |
| `SUPABASE_ACCESS_TOKEN` | Lets the Supabase CLI link and push migrations | —     | Supabase personal access token | same or a separate token | **Secret**              | GitHub Environment secret (`staging` / `production`) | https://supabase.com/dashboard/account/tokens                | **Required** for CD |
| `SUPABASE_PROJECT_ID`   | Project ref for `supabase link --project-ref`  | —     | **DEV** ref                    | **PROD** ref             | **Secret** (identifier) | GitHub Environment secret                            | Dashboard URL `…/project/<ref>` or Settings → General        | **Required** for CD |
| `SUPABASE_DB_PASSWORD`  | Database password used by `link` / `db push`   | —     | **DEV** password               | **PROD** password        | **Secret**              | GitHub Environment secret                            | Chosen at project creation (reset under Settings → Database) | **Required** for CD |

`SUPABASE_DB_URL` is **not used**. In a job that runs the _local_ Supabase stack, never export `SUPABASE_PROJECT_ID`: the CLI also treats it as the local project id.

## 4. Vercel deployment (GitHub Actions only)

| Variable                          | Purpose                                                                    | Local | Staging       | Production                        | Public / Secret         | Where configured          | Where obtained                                                                   | Required / Optional                                        |
| --------------------------------- | -------------------------------------------------------------------------- | ----- | ------------- | --------------------------------- | ----------------------- | ------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `VERCEL_TOKEN`                    | Authenticates `vercel deploy` / `vercel alias`                             | —     | Vercel token  | Vercel token (may be the same)    | **Secret**              | GitHub Environment secret | Vercel → Account Settings → Tokens                                               | **Required** for CD                                        |
| `VERCEL_VCR_TOKEN`                | Reads and prunes the container registry before a push (ISSUE-011)          | —     | Vercel token  | not set — production never prunes | **Secret**              | GitHub Environment secret | Vercel → Account Settings → Tokens, scoped to the TEKA team                      | Optional; without it the prune step warns and does nothing |
| `VERCEL_ORG_ID`                   | Selects the Vercel team                                                    | —     | team/user ID  | same                              | **Secret** (identifier) | GitHub Environment secret | Team Settings → General (Team ID), or `.vercel/project.json` after `vercel link` | **Required** for CD                                        |
| `VERCEL_PROJECT_ID`               | Selects the Vercel project                                                 | —     | project ID    | same (one project)                | **Secret** (identifier) | GitHub Environment secret | Project → Settings → General (Project ID)                                        | **Required** for CD                                        |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Lets smoke tests pass Deployment Protection (`x-vercel-protection-bypass`) | —     | bypass secret | same                              | **Secret**              | GitHub Environment secret | Project → Settings → Deployment Protection → Protection Bypass for Automation    | Required only if Deployment Protection is on (recommended) |

## 5. Deployment controls (GitHub variables, not secret)

| Variable                    | Purpose                                                                  | Local | Staging                           | Production                           | Public / Secret | Where configured                      | Where obtained       | Required / Optional                           |
| --------------------------- | ------------------------------------------------------------------------ | ----- | --------------------------------- | ------------------------------------ | --------------- | ------------------------------------- | -------------------- | --------------------------------------------- |
| `STAGING_DEPLOY_ENABLED`    | Enables the deploy job of `deploy-staging.yml`                           | —     | `true` once staging is configured | —                                    | Not secret      | GitHub **repository** variable        | Owner decision       | Unset = staging CD **off** (current state)    |
| `REGISTRY_PRUNE_ENABLED`    | Arms the container-registry deletion step (ISSUE-011)                    | —     | `true` once the prune is verified | —                                    | Not secret      | GitHub **repository** variable        | Owner decision       | Unset = report only, delete nothing           |
| `PRODUCTION_DEPLOY_ENABLED` | Enables the deploy job of `deploy-production.yml`                        | —     | —                                 | `true` once production is configured | Not secret      | GitHub **repository** variable        | Owner decision       | Unset = production CD **off** (current state) |
| `VERCEL_STAGING_TARGET`     | `staging` to use a Vercel Custom Environment (Pro plan); empty = Preview | —     | empty or `staging`                | —                                    | Not secret      | GitHub `staging` environment variable | Vercel plan          | Optional                                      |
| `STAGING_DOMAIN`            | Stable alias assigned to each staging deployment                         | —     | e.g. `staging.<domain>`           | —                                    | Not secret      | GitHub `staging` environment variable | DNS / Vercel domains | Optional                                      |

## 6. Platform and workflow-internal (never configured by hand)

| Variable                                                                           | Purpose                                                                                            | Set by                                       |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `HOSTNAME` (`0.0.0.0`), `NODE_ENV` (`production`), `NEXT_TELEMETRY_DISABLED` (`1`) | Container runtime                                                                                  | Dockerfiles. Do not set `HOSTNAME` in Vercel |
| `VERCEL_CLI_VERSION`, `VERCEL_TELEMETRY_DISABLED`                                  | Pinned Vercel CLI, no telemetry                                                                    | Deploy workflows                             |
| `PLAYWRIGHT_BASE_URL`, `EXPECTED_GIT_SHA`, `EXPECTED_APP_ENV`                      | Smoke tests against the exact deployment                                                           | Deploy workflows                             |
| Sentinel values for `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `DIRECT_DATABASE_URL`   | Fake values proving no server secret reaches browser bundles                                       | `ci.yml`                                     |
| `GITHUB_EVENT_PATH`, `GITHUB_SHA`, …                                               | GitHub-provided context (for example, the `Promotion source` check reads the pull request payload) | GitHub Actions                               |

## Examples (Markdown only: never commit them as files)

### Local: `.env.local` (optional)

The app runs locally with **no** environment file at all. Create `.env.local` only to override defaults or to use the local Supabase stack. The Supabase values are printed by `npx supabase status` once `npm run db:start` is running.

```dotenv
NEXT_PUBLIC_APP_NAME=Teka Edu
NEXT_PUBLIC_DEFAULT_LOCALE=fr
NEXT_PUBLIC_DEFAULT_COUNTRY=CD
NEXT_PUBLIC_APP_ENV=local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_ENGLISH_SCAFFOLDING=true
NEXT_PUBLIC_ENABLE_CLOUD_SYNC=false
AI_ENABLED=false

# Optional: local Supabase stack (leave all unset to run without Supabase)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<LOCAL_SUPABASE_PUBLISHABLE_KEY>
SUPABASE_SECRET_KEY=<LOCAL_SUPABASE_SECRET_KEY>
DATABASE_URL=<LOCAL_SUPABASE_DATABASE_URL>
DIRECT_DATABASE_URL=<LOCAL_SUPABASE_DATABASE_URL>
```

With `NEXT_PUBLIC_APP_ENV=local`, the app accepts only local Supabase and database hosts. It never connects to a hosted project from local.

### Staging: Vercel Preview (or `staging`) scope

```dotenv
NEXT_PUBLIC_APP_NAME=Teka Edu
NEXT_PUBLIC_DEFAULT_LOCALE=fr
NEXT_PUBLIC_DEFAULT_COUNTRY=CD
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_URL=<STAGING_URL>
NEXT_PUBLIC_ENABLE_ENGLISH_SCAFFOLDING=true
NEXT_PUBLIC_ENABLE_CLOUD_SYNC=false
AI_ENABLED=false
PORT=3000
NEXT_PUBLIC_SUPABASE_URL=https://<DEV_PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<DEV_SUPABASE_PUBLISHABLE_KEY>
SUPABASE_SECRET_KEY=<DEV_SUPABASE_SECRET_KEY>
DATABASE_URL=<DEV_SUPABASE_POOLER_DATABASE_URL>
DIRECT_DATABASE_URL=<DEV_SUPABASE_DIRECT_DATABASE_URL>
```

### Production: Vercel Production scope

This is the same list as staging with `NEXT_PUBLIC_APP_ENV=production`, `NEXT_PUBLIC_APP_URL=<PRODUCTION_DOMAIN>`, and every Supabase value taken from **`teka-edu-prod`**: `<PROD_PROJECT_REF>`, `<PROD_SUPABASE_PUBLISHABLE_KEY>`, `<PROD_SUPABASE_SECRET_KEY>`, `<PROD_SUPABASE_POOLER_DATABASE_URL>`, `<PROD_SUPABASE_DIRECT_DATABASE_URL>`.

### GitHub Environment secrets (`staging` and `production`, same names, different values)

```text
VERCEL_TOKEN=<VERCEL_TOKEN>
VERCEL_ORG_ID=<VERCEL_ORG_ID>
VERCEL_PROJECT_ID=<VERCEL_PROJECT_ID>
VERCEL_AUTOMATION_BYPASS_SECRET=<VERCEL_AUTOMATION_BYPASS_SECRET>
SUPABASE_ACCESS_TOKEN=<SUPABASE_ACCESS_TOKEN>
SUPABASE_PROJECT_ID=<DEV_OR_PROD_PROJECT_REF>
SUPABASE_DB_PASSWORD=<DEV_OR_PROD_DB_PASSWORD>
```

## Validation rules (enforced by `lib/env/schema.ts`)

- **Context-aware requirements:**
  - Without cloud sync, no Supabase value is required in any environment.
  - With `NEXT_PUBLIC_ENABLE_CLOUD_SYNC=true`, the Supabase URL and publishable key are required.
  - Setting one of those two without the other is refused.
- **Key checks:**
  - The publishable key must start with `sb_publishable_`.
  - A value starting with `sb_secret_` in a `NEXT_PUBLIC_` variable is refused with a "rotate it" error.
  - The secret key must start with `sb_secret_`.
- **Environment isolation:**
  - `local` accepts only local hosts (`127.0.0.1`, `localhost`, `[::1]`, `host.docker.internal`).
  - `staging` and `production` require https and refuse local hosts.
  - Once the project refs are recorded in `lib/env/supabase-projects.ts`, a deployment that points at the other environment's project is refused.
- **Other rules:**
  - Database URLs must be `postgres://` or `postgresql://` URLs. Percent-encode special characters in the password.
  - `AI_ENABLED=true` is refused.
  - Empty values count as unset.
  - Error messages name the variable and never include its value.

## DEV/PROD separation (strict)

These must **never** hold the same value in staging and production: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `DIRECT_DATABASE_URL`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`.

A staging or local configuration that reaches the production database is a **high-severity configuration defect**. Fix it immediately and rotate any exposed credentials.
