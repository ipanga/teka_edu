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

An ordinary parent can open Teka Edu and start a lesson, without a Vercel account.

## Status

`completed`

## Branch

`feat/beta-0.1-released`

## Base Branch

`develop` at `9b45733`

## Started

2026-09-22

## Last Checkpoint

2026-09-22 — **Beta 0.1 is live and public at https://teka-edu.vercel.app.** Anonymous check
9/9. Staging still protected.

## Scope

- Promote `develop` → `main`, migrate PROD, deploy production, verify anonymously.
- Correct the release record after the first verification was pointed at the wrong alias.

## Out of Scope

- Changing Vercel Deployment Protection. It was correct all along.
- Redeploying to change a release status.
- October, 2ème maternelle, and any change to approved September content.

## Product Decisions

- The canonical production URL is **`https://teka-edu.vercel.app`**. The team-scoped alias
  `teka-edu-teka10.vercel.app` is protected by design and is not the public URL.
- `NEXT_PUBLIC_APP_URL` corrected to the canonical URL. Nothing renders from it — it is
  validation only — so no redeployment was forced.
- The "release failed" report is kept in the record. It was wrong, and the reasoning that
  produced it is more useful than a tidy history.

## Completed

- [x] `PRODUCTION_DEPLOY_ENABLED=true`; promotion PR **#76** merged as **`a729722`**
- [x] Environment review approved; the same run resumed; preflights passed
- [x] **Supabase PROD 0 → 41**; **`dpl_2midgBHcdVDbF8uz57U18MKPmX8P`** READY, `target=production`
- [x] **Anonymous public check 9/9** against `https://teka-edu.vercel.app`
- [x] Staging still protected (302); team alias and generated URLs still protected
- [x] `NEXT_PUBLIC_APP_URL` corrected to the canonical URL
- [x] Records corrected without erasing the failed first verification

## In Progress

None.

## Remaining

- [ ] Promote these corrections to `main` at the next convenient release.

## Validation State

| Check              | Result | At                                  |
| ------------------ | ------ | ----------------------------------- |
| format             | PASS   | working tree                        |
| lint               | PASS   | working tree                        |
| typecheck          | PASS   | working tree                        |
| unit tests         | PASS   | working tree — 355 tests            |
| content validation | PASS   | working tree — 31 files             |
| database tests     | PASS   | CI on `main` — 152 assertions       |
| build              | PASS   | CI on `main`                        |
| E2E                | PASS   | 30 local · **9/9 anonymous public** |
| Docker             | PASS   | CI on `main` — both images          |
| secret scans       | PASS   | 0 tracked `.env*`; gitleaks in CI   |

## Database State

- Local: 41 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: 41 applied.
- PROD: **41 applied**, `ACTIVE_HEALTHY`. Reference content only; no user data exists.

## Deployment State

- Production: **LIVE and public** — https://teka-edu.vercel.app, `a729722`, Supabase PROD.
- Staging: protected, healthy, on `develop`.
- Container registry: ~38 of 50.

## Git State

- `main` at `a729722` (Beta 0.1), `develop` at `9b45733`, `feat/beta-0.1-released` open.

## Blockers

None.

## User Decisions Needed

None. Two non-blocking items remain open and documented: **ISSUE-011** (CI cannot list the
container registry; manual pruning is the proven fallback) and **ISSUE-017** (no teacher has read
the 176 lessons; every approval says `ai-assisted`).

## Exact Resume Point

Beta 0.1 is released. The next work is whatever the owner chooses: October, 2ème maternelle, or
the open issues.

## Resume Verification

1. `curl -sS https://teka-edu.vercel.app/api/health` — `production`, PROD ref, commit `a729722`;
2. `curl -sSI https://teka-edu-staging.vercel.app/ | head -1` — must still be 302;
3. `git log -n 3 --oneline`;
4. `git status --short` — read uncommitted work before discarding it.
