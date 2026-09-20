# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Audit Beta 0.1 production readiness, and prepare what can be prepared without opening production.

## Objective

A precise, verified answer to "is everything ready for a controlled Beta 0.1 production
deployment?" — and for every no, the exact action that fixes it.

## Status

`completed`

## Branch

`chore/beta-0.1-production-readiness`

## Base Branch

`develop` at `6d61299`

## Started

2026-09-20

## Last Checkpoint

2026-09-20 — audit complete, six gates open, the public release check written and proved, no
production action taken.

## Scope

- Verify the release gate against the live services rather than the documents.
- Build the anonymous production smoke test.
- Document the Deployment Protection model, the migration plan and the rollback.

## Out of Scope

- Deploying production, migrating PROD, touching `main`, setting `PRODUCTION_DEPLOY_ENABLED`.
- Changing Deployment Protection: it is security-sensitive and it is the owner's to make.
- October, 2ème maternelle, and any change to approved September content.
- Building the beta indicator and copy button — proposed as its own task, not smuggled in here.

## Product Decisions

- The public release check is **not** wired into `deploy-production.yml`. It cannot pass until
  protection changes, and failing it after `supabase db push` has migrated PROD would be the
  worst possible moment to find out.
- Beta 0.1 uses the default Vercel production domain. No domain is bought, and none is invented.
- Deployment Protection moves to preview-only rather than off. Disabling it would expose every
  preview to make one deployment public.

## Completed

- [x] **Supabase PROD verified INACTIVE (paused)** — everything downstream of it left unclaimed
- [x] **Deployment Protection verified blocking**: `all_except_custom_domains` + 0 custom domains
- [x] **`NEXT_PUBLIC_APP_URL` missing from Vercel Production** — proved to throw at boot
- [x] The production Vercel deploy token is absent; `PRODUCTION_DEPLOY_ENABLED` unset; `main`
      policy and required reviewer confirmed
- [x] Migrations audited: 41 repo / 41 DEV / **0 PROD**, additive, environment-neutral, scoped
      deletes that are no-ops on an empty database
- [x] Privacy audited: **zero** network calls in app code, no Supabase client, `localStorage`
      only, no personal-data tables in any migration
- [x] **`tests/e2e/production-public.spec.ts`** — 8 anonymous cases, no bypass; proved against
      the local build (7 pass, and the production-environment assertion fails as it must)
- [x] Documented the protection model, the four failure points, and the no-DB-rollback limit
- [x] Corrected the readiness document's false claim that the feedback note has a copy button

## In Progress

None.

## Remaining

- [ ] Six owner actions before any production deployment — see `User Decisions Needed`.

## Validation State

| Check              | Result | At                                |
| ------------------ | ------ | --------------------------------- |
| format             | PASS   | working tree                      |
| lint               | PASS   | working tree                      |
| typecheck          | PASS   | working tree                      |
| unit tests         | PASS   | working tree — 355 tests          |
| content validation | PASS   | working tree — 31 files           |
| database tests     | PASS   | fresh reset — 152 assertions      |
| build              | PASS   | working tree                      |
| E2E                | PASS   | 28 passed, 8 skipped (no prod)    |
| Docker             | PASS   | both images, health + SIGTERM     |
| secret scans       | PASS   | 0 tracked `.env*`; gitleaks in CI |

## Database State

- Local: 41 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: 41 applied, matching the repository.
- PROD: **0 applied, project paused.** Untouched.

## Deployment State

- Staging: `6d61299`, healthy, protected.
- Production: never deployed; the production domain answers 404. `main` at `1b95480`.
- Container registry: 36 of 50.

## Git State

- `chore/beta-0.1-production-readiness`, branched from `develop` at `6d61299`.

## Blockers

**Production is not ready.** Six gates are open; five are a single owner action each.

## User Decisions Needed

In this order:

1. **Resume `teka-edu-prod`** — Supabase dashboard → project `teka-edu-prod` → Restore/Resume.
   Free, and nothing below can be verified until it is `ACTIVE_HEALTHY`.
2. **Deployment Protection** → Vercel → `teka-edu` → Settings → Deployment Protection → Vercel
   Authentication → **Only Preview Deployments**. Keeps staging protected, makes production
   public. Do not disable protection.
3. **`NEXT_PUBLIC_APP_URL`** = `https://teka-edu-teka10.vercel.app` in the Vercel **Production**
   environment. Without it the container throws on boot.
4. **The production Vercel deploy token** → GitHub → Settings → Environments → `production` →
   add it under the name the production workflow reads. Scope it to the TEKA team.
5. **Beta indicator + copy button** — a small UI change, proposed as its own task.
6. **`PRODUCTION_DEPLOY_ENABLED=true`** — last, and only when 1–5 are done.

## Exact Resume Point

Nothing to resume. The next task begins when the owner has done 1–4.

## Resume Verification

1. `npx supabase projects list` — is `teka-edu-prod` `ACTIVE_HEALTHY` yet?
2. `vercel env ls --scope teka10 --project teka-edu` — is `NEXT_PUBLIC_APP_URL` on Production?
3. `gh api repos/ipanga/teka_edu/environments/production/secrets --jq '.secrets[].name'`;
4. `gh variable list` — `PRODUCTION_DEPLOY_ENABLED` must still be absent until the gate is met;
5. `git status --short` — read uncommitted work before discarding it.
