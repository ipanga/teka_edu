# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Verify the new production deploy token and close every Beta 0.1 gate that can close without opening production.

## Objective

A precise, verified answer to "is everything ready for a controlled Beta 0.1 production
deployment?" — and for every no, the exact action that fixes it.

## Status

`in_progress`

## Branch

`chore/beta-0.1-production-preflight`

## Base Branch

`develop` at `58b9146`

## Started

2026-09-21

## Last Checkpoint

2026-09-21 — four gates closed, one left. Production still disabled, PROD still unmigrated.

## Scope

- Verify the production deploy token, Supabase PROD, and the Vercel production variables.
- Build the beta indicator and the copy action.
- Harden the production job with read-only preflights.

## Out of Scope

- Deploying production, migrating PROD, touching `main`, setting `PRODUCTION_DEPLOY_ENABLED`.
- Changing Deployment Protection: it is the owner's call and the last gate.
- Any change to approved September content.

## Product Decisions

- The deploy token is **not** exercised from anywhere but a real release. The `production`
  environment is restricted to `main`, and loosening that to test a credential would trade a
  real protection for a convenience.
- What replaces that test is two read-only preflights at the start of the production job, so the
  first use of the token happens **before** `supabase db push`, not after.
- The beta indicator is parent-facing only and collects nothing. A badge and a sentence are
  enough to tell a tester they are testing; anything more would be a notice, not a product.

## Completed

- [x] Production deploy token **present** in the `production` GitHub environment, scoped there;
      staging keeps its own, separate one
- [x] `teka-edu-prod` **ACTIVE_HEALTHY** — resumed; ref, region and plan confirmed; still
      0 migrations, still untouched
- [x] Vercel Production variables: **11 derived checks pass**, no value printed, no DEV ref, no
      secret in a `NEXT_PUBLIC_*`, and the pulled file deleted
- [x] **Two read-only preflights** added before any production change: the Vercel project must be
      `teka-edu`, and Supabase must be `teka-edu-prod` and `ACTIVE_HEALTHY`
- [x] **Beta feedback built**: badge + sentence on the front door, copy button on the note, both
      tested — including that the badge never reaches the child's screen

## In Progress

- [ ] PR into `develop`, CI, squash-merge, staging verification

## Remaining

- [ ] **Deployment Protection** — the last technical gate. Owner action.
- [ ] Then, deliberately: `PRODUCTION_DEPLOY_ENABLED=true` and the first release.

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
| E2E                | PASS   | 30 passed, 8 skipped (no prod)    |
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

**One.** Vercel Deployment Protection still covers production, so a public beta is impossible
until it is scoped to previews.

## User Decisions Needed

1. **Deployment Protection** — Vercel → `teka-edu` → Settings → Deployment Protection → Vercel
   Authentication → **Only Preview Deployments** → Save. Then check, logged out, that
   `https://teka-edu-staging.vercel.app` still answers `302` and the production domain no longer
   redirects to a login. Do not disable protection.
2. **Then, and only then:** authorise the release. Setting `PRODUCTION_DEPLOY_ENABLED=true` and
   promoting `develop` → `main` is the deliberate final action, and it is yours.

## Exact Resume Point

Nothing to resume. The next task begins when the owner has done 1–4.

## Resume Verification

1. `npx supabase projects list` — is `teka-edu-prod` `ACTIVE_HEALTHY` yet?
2. `vercel env ls --scope teka10 --project teka-edu` — is `NEXT_PUBLIC_APP_URL` on Production?
3. `gh api repos/ipanga/teka_edu/environments/production/secrets --jq '.secrets[].name'`;
4. `gh variable list` — `PRODUCTION_DEPLOY_ENABLED` must still be absent until the gate is met;
5. `git status --short` — read uncommitted work before discarding it.
