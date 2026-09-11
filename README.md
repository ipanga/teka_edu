# Teka Edu

A French-first educational web app (PWA) giving preschool children (1ère, 2ème and 3ème maternelle) structured daily lessons. A parent guides each session at home, online or offline. It follows the official French Cycle 1 curriculum and the DRC school calendar.

> **Status:** Phase 0 (foundation and infrastructure). The app is a placeholder French home page plus a health endpoint. There is no educational feature yet. See [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

## Documentation

| File                                                             | Purpose                                                   |
| ---------------------------------------------------------------- | --------------------------------------------------------- |
| [`TEKA_EDU_PROJECT_PLAN.md`](TEKA_EDU_PROJECT_PLAN.md)           | Product and technical specification                       |
| [`PROJECT_STATUS.md`](PROJECT_STATUS.md)                         | Current implementation status and next tasks              |
| [`DECISIONS.md`](DECISIONS.md)                                   | Architecture and product decision log                     |
| [`CLAUDE.md`](CLAUDE.md)                                         | Working context and rules for coding agents               |
| [`docs/ENVIRONMENT_SETUP.md`](docs/ENVIRONMENT_SETUP.md)         | Configure local, Supabase, Vercel and GitHub step by step |
| [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md) | Every environment variable (authoritative inventory)      |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)                       | CI/CD, migrations, rollback, troubleshooting              |

## Stack

Next.js 16 (App Router, standalone output) · React 19 · TypeScript 5.9 · Tailwind CSS 4 · Zod 4 · Vitest + React Testing Library · Playwright · Supabase (PostgreSQL, CLI migrations) · Docker · GitHub Actions · Vercel (container deployment).

## Prerequisites

- Node.js 22 (see `.nvmrc`) and npm 10+
- Docker (for the local Supabase stack and container builds)

## Getting started

```bash
npm ci
npx playwright install chromium     # once, for E2E tests
npm run dev                         # http://localhost:3000
```

No environment file is needed. The repository contains **no** `.env*` file, not even a template (ADR-023). To override defaults, create a Git-ignored `.env.local` by hand, using the examples in [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md).

The app needs no Supabase or cloud credentials to run locally. To start the local Supabase stack (PostgreSQL, Auth, Storage, Studio):

```bash
npm run db:start      # prints the local URL and keys for .env.local
npm run db:stop
```

## Commands

| Command                                                                       | Purpose                                                                                                |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `npm run dev`                                                                 | Development server                                                                                     |
| `npm run build` / `npm run start`                                             | Production build / run the standalone server (as in the containers)                                    |
| `npm run verify`                                                              | Everything to run before pushing: format check, lint, typecheck, unit tests, content validation, build |
| `npm run lint`, `npm run format`, `npm run format:check`, `npm run typecheck` | Code quality                                                                                           |
| `npm run test` / `npm run test:watch`                                         | Unit and component tests (Vitest)                                                                      |
| `npm run test:e2e`                                                            | Playwright smoke tests against the local build (run `npm run build` first)                             |
| `npm run content:validate`                                                    | Educational content validation                                                                         |
| `npm run check:client-bundle`                                                 | Fails if server-only values appear in browser bundles (used by CI)                                     |
| `npm run db:start` / `db:stop` / `db:status`                                  | Local Supabase stack                                                                                   |
| `npm run db:reset` / `db:test`                                                | Replay migrations + seed / run pgTAP database tests                                                    |
| `npm run db:types`                                                            | Generate `lib/supabase/database.types.ts` from the local schema (create `lib/supabase/` first)         |
| `npm run docker:build` / `docker:run` / `docker:smoke`                        | Build, run and smoke-test the portable image                                                           |

**New database migration:**

```bash
npx supabase migration new <description>
npm run db:reset
npm run db:test
```

## Configuration

- All configuration is validated by `lib/env/`. The app refuses to build or start with an invalid configuration, and the error names the variable without revealing its value.
- No `.env*` file is ever committed (ADR-023). Every variable, with safe examples, is documented in [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md). Real values live only in your local `.env.local` (Git-ignored), GitHub Environment secrets, Vercel and Supabase.
- `.gitignore` ignores every file starting with `.env`.

## Docker

```bash
npm run docker:build     # docker build -t teka-edu:local .
npm run docker:run       # http://localhost:3000, health at /api/health
npm run docker:smoke     # health check + graceful-stop check
```

- `Dockerfile` is the portable image, for any OCI host.
- `Dockerfile.vercel` is what Vercel builds and runs.
- The image is environment-neutral: all configuration, including the browser-safe `NEXT_PUBLIC_*` values, is read at runtime (`docker run -e KEY=value`, or the platform's variables). Nothing environment-specific is baked into the image (ADR-025).

## Branching and deployment

`feature/*` → PR → `develop` (staging) → PR → `main` (production). Do not commit directly to `main`.

- GitHub Actions runs CI on every pull request.
- On `develop` and `main` it runs CI, then applies Supabase migrations, deploys the Vercel container and runs smoke tests.
- Deployment is disabled until the services are configured (see [`docs/ENVIRONMENT_SETUP.md`](docs/ENVIRONMENT_SETUP.md)).
- Details: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
