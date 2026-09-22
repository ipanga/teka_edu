# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Release Teka Edu Beta 0.1 to production.

## Objective

An ordinary parent can open `https://teka-edu-teka10.vercel.app` and start a lesson, without a
Vercel account.

## Status

`blocked`

## Branch

`fix/production-domain-is-protected`

## Base Branch

`develop` at `35e7056`

## Started

2026-09-22

## Last Checkpoint

2026-09-22 — production is deployed, migrated and healthy, and is **not public**. One owner
action remains.

## Scope

- Promote `develop` → `main`, migrate PROD, deploy production, verify anonymously.

## Out of Scope

- Changing Vercel Deployment Protection myself. It is security-sensitive and it is the owner's.
- Rolling back: the deployment is healthy and there is nothing earlier to return to.
- Any change to approved September content.

## Product Decisions

- The release is **not** called successful, because the anonymous check failed. The in-workflow
  smoke test passing does not count: it carries the protection bypass, which is precisely why it
  cannot answer this question.
- No rollback. The fault is access configuration, not the build, and rolling back would leave
  production with nothing while changing nothing about the cause.
- The 41 migrations stay applied. They are additive and forward-safe, and the database holds only
  reference content regenerated from `content/`.

## Completed

- [x] `PRODUCTION_DEPLOY_ENABLED=true` (the one authorised change)
- [x] Promotion PR **#76** merged into `main` as **`a729722`**, merge commit, promotion-source
      check passed; exactly one production workflow run
- [x] Environment review requested and approved; the same run resumed
- [x] Preflights passed — _Vercel project reached: teka-edu_; _Supabase project: teka-edu-prod
      (ACTIVE_HEALTHY)_
- [x] **Supabase PROD migrated 0 → 41**, from the first migration, confirming it began empty
- [x] Deployed `a729722`, `target=production`, **`dpl_2midgBHcdVDbF8uz57U18MKPmX8P`**, READY,
      aliased to `teka-edu.vercel.app` and `teka-edu-teka10.vercel.app`
- [x] In-workflow smoke test 30/30 (with bypass, against the generated URL)
- [x] **Anonymous check FAILED** — the production domain answers `302 → vercel.com/sso-api`
- [x] Documentation corrected: the earlier "Standard Protection is fine" conclusion was wrong,
      and the reasoning that produced it is recorded so it is not repeated

## In Progress

- [ ] PR into `develop` with the corrections; then the owner's protection change.

## Remaining

- [ ] **Owner:** Vercel → `teka-edu` → Settings → Deployment Protection → Vercel Authentication
      → **Only Preview Deployments** → Save.
- [ ] Then re-run `PRODUCTION_PUBLIC_URL=https://teka-edu-teka10.vercel.app npm run test:e2e:public`
      and confirm staging still redirects to the Vercel login.

## Validation State

| Check              | Result | At                                |
| ------------------ | ------ | --------------------------------- |
| format             | PASS   | working tree                      |
| lint               | PASS   | working tree                      |
| typecheck          | PASS   | working tree                      |
| unit tests         | PASS   | working tree — 355 tests          |
| content validation | PASS   | working tree — 31 files           |
| database tests     | PASS   | CI on `main` — 152 assertions     |
| build              | PASS   | CI on `main`                      |
| E2E                | FAIL   | anonymous public check — 6 of 9   |
| Docker             | PASS   | CI on `main` — both images        |
| secret scans       | PASS   | 0 tracked `.env*`; gitleaks in CI |

## Database State

- Local: 41 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: 41 applied.
- PROD: **41 applied**, `ACTIVE_HEALTHY`. Reference content only; no user data exists anywhere.

## Deployment State

- Production: **deployed and healthy, but not public.** `dpl_2midgBHcdVDbF8uz57U18MKPmX8P`,
  `a729722`, READY. The domain redirects to Vercel Authentication.
- Staging: protected, healthy, on `develop`.
- Container registry: ~38 of 50.

## Git State

- `main` at `a729722`, `develop` at `35e7056`. `fix/production-domain-is-protected` open.

## Blockers

**One, and it is the last one.** Vercel Authentication is in the legacy
`all_except_custom_domains` mode: everything except _custom_ domains is protected, and this
project has none, so the production domain is protected too.

## User Decisions Needed

**Set Vercel Authentication to _Only Preview Deployments_.** Staging is a Preview deployment and
stays protected; the production domain becomes public. Do not disable Vercel Authentication —
that would expose every preview.

Trade-off worth knowing: under that mode the generated production deployment URLs become public
as well. The alternative, a custom domain, costs money.

## Exact Resume Point

After the protection change: re-run the anonymous public check, confirm staging still redirects,
then update the documentation and declare the release.

## Resume Verification

1. `curl -sSI https://teka-edu-teka10.vercel.app/ | head -1` — 200 means public, 302 means not;
2. `curl -sSI https://teka-edu-staging.vercel.app/ | head -1` — must still be 302;
3. `PRODUCTION_PUBLIC_URL=https://teka-edu-teka10.vercel.app npm run test:e2e:public`;
4. `git status --short` — read uncommitted work before discarding it.
