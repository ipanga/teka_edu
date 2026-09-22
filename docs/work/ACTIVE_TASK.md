# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Re-check the Deployment Protection blocker, and bring Beta 0.1 to the point where only the owner's authorisation remains.

## Objective

A precise, verified answer to "is everything ready for a controlled Beta 0.1 production
deployment?" — and for every no, the exact action that fixes it.

## Status

`in_progress`

## Branch

`fix/deployment-protection-standard-is-correct`

## Base Branch

`develop` at `16883b9`

## Started

2026-09-21

## Last Checkpoint

2026-09-21 — every technical gate met. Production still undeployed and still disabled.

## Scope

- Re-check the Deployment Protection assumption against what the setting actually does.
- Re-verify every production prerequisite, read-only.
- Correct the documentation where the earlier audit was wrong.

## Out of Scope

- Deploying production, migrating PROD, touching `main`, setting `PRODUCTION_DEPLOY_ENABLED`.
- Changing anything in the Vercel dashboard: the configuration was already right.
- Any change to approved September content.

## Product Decisions

- Standard Protection is the model Beta 0.1 wants and already has. Previews and generated
  production URLs stay protected; the production domain is public.
- The public release check must target the production **domain**. A generated deployment URL is
  _meant_ to stay protected, so the spec refuses one rather than blaming the configuration for
  doing its job.

## Completed

- [x] **Corrected my own blocker.** `all_except_custom_domains` is the legacy name for Standard
      Protection (`prod_deployment_urls_and_all_previews`), which leaves the production domain
      public. The earlier audit read the identifier instead of the behaviour.
- [x] Evidence recorded three ways: the dashboard wording, the API's current name, and the live
      404 `DEPLOYMENT_NOT_FOUND` on the production domain versus the SSO redirect on the preview
      alias
- [x] Guard added: the public spec refuses a generated deployment URL, with the reason
- [x] Re-verified read-only — PROD `ACTIVE_HEALTHY` and untouched, seven production secrets,
      five Vercel production variables, no DEV reference, `main` at `1b95480`, zero production
      deployments, `PRODUCTION_DEPLOY_ENABLED` unset, 176/176 and 10/10 unchanged

## In Progress

- [ ] PR into `develop`, CI, squash-merge, staging verification

## Remaining

- [ ] **Nothing technical.** The first production release is the owner's decision.

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
| E2E                | PASS   | 30 passed, 9 skipped (no prod)    |
| Docker             | PASS   | both images, health + SIGTERM     |
| secret scans       | PASS   | 0 tracked `.env*`; gitleaks in CI |

## Database State

- Local: 41 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: 41 applied, matching the repository.
- PROD: **0 applied. `ACTIVE_HEALTHY` and untouched.**

## Deployment State

- Staging: healthy, protected, deploying from `develop`.
- Production: never deployed; `PRODUCTION_DEPLOY_ENABLED` unset; `main` at `1b95480`.
- Container registry: 37 of 50.

## Git State

- `chore/beta-0.1-production-preflight`, branched from `develop` at `58b9146`.

## Blockers

**None.** Every technical gate is met.

## User Decisions Needed

**One, and it is a decision rather than a fix: authorise the first production release.** When you
choose to:

1. set the repository variable `PRODUCTION_DEPLOY_ENABLED=true`;
2. open a PR `develop` → `main` and merge it with a merge commit;
3. approve the `production` environment when GitHub asks;
4. let the workflow run: CI → secret check → the two preflights → migrate PROD → deploy →
   verify the target is production → smoke test;
5. then confirm anonymously, in a logged-out browser:
   `PRODUCTION_PUBLIC_URL=https://teka-edu-teka10.vercel.app npm run test:e2e:public`, and that
   `https://teka-edu-staging.vercel.app` still redirects to the Vercel login.

If the production **domain** redirects to Vercel Authentication after that deployment, the release
is not successful and must not be called one. The generated `teka-edu-<hash>.vercel.app` URL
redirecting is expected and is not that.

## Exact Resume Point

Nothing to resume. The next task begins when the owner has done 1–4.

## Resume Verification

1. `npx supabase projects list` — is `teka-edu-prod` `ACTIVE_HEALTHY` yet?
2. `vercel env ls --scope teka10 --project teka-edu` — is `NEXT_PUBLIC_APP_URL` on Production?
3. `gh api repos/ipanga/teka_edu/environments/production/secrets --jq '.secrets[].name'`;
4. `gh variable list` — `PRODUCTION_DEPLOY_ENABLED` must still be absent until the gate is met;
5. `git status --short` — read uncommitted work before discarding it.
