# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.
-->

## Task

Prune the container registry, pin the Supabase CLI everywhere, and release the September visual
upgrade to production.

## Objective

Production serves the reconfirmed September visual upgrade (176/176 approved) from Supabase PROD,
verified anonymously at https://teka-edu.vercel.app, with the operational debt closed first.

## Status

`awaiting_user`

## Branch

`chore/registry-prune-and-cli-pin` → `develop`; then the promotion PR `develop` → `main`.

## Base Branch

`develop` at `da2d4fb`

## Started

2026-09-24

## Last Checkpoint

2026-09-24 — **Paused at the production approval gate.** Promotion PR #84 merged into `main` as
`28dcb0a` (all 5 checks green, Promotion source passed). Run **35983628116** (Deploy production):
CI green; job « Migrate Supabase PROD, deploy Vercel production, smoke test » is **waiting** for
the `production` environment review (reviewer: the owner). Nothing has touched PROD yet.

## Scope

- Registry maintenance (done); CLI pin in `deploy-staging.yml` and `deploy-production.yml`.
- Validate `develop`; promote `develop` → `main`; production deployment through its gates.

## Out of Scope

- October content; domain changes; any paid service; any manual SQL on PROD.

## Product Decisions

- Owner authorised: pruning, and the production release once every required check is green.

## Completed

- [x] Registry pruned 44 → 35 (production `a7297228f173`, staging `da2d4fbd32c3` protected).
- [x] Supabase CLI pinned to 2.117.0 in CI and both deploy workflows; drift test (PR #83,
      `22d7b3a`). Staging redeployed at `22d7b3a` (run 35982180315, dispatched because GitHub
      created no run for the merge push), `dpl_GxFyze4amNh5A5srt46JnP9cSWuS` READY, smoke 31.
- [x] `develop` validated: 176/176, 176 distinct digests, 0 review, frozen pictures, no content
      change since `e882c10`; full local suite exit 0.
- [x] Promotion PR #84 merged into `main` (`28dcb0a`).

## In Progress

- [ ] Run 35983628116 waiting for the owner's `production` environment approval.

## Remaining

- [ ] After approval: watch the run (PROD preflight, migration 41 → 42, Vercel production, smoke).
- [ ] Anonymous public suite against https://teka-edu.vercel.app; visual checks; staging 302.
- [ ] Records and final report; archive this checkpoint.

## Validation State

| Check              | Result | At                                        |
| ------------------ | ------ | ----------------------------------------- |
| format             | PASS   | `22d7b3a` local, exit 0                   |
| lint               | PASS   | `22d7b3a` local, exit 0                   |
| typecheck          | PASS   | `22d7b3a` local, exit 0                   |
| unit tests         | PASS   | `22d7b3a` local — 397                     |
| content validation | PASS   | `22d7b3a` local — 31 files                |
| database tests     | PASS   | `22d7b3a` local — 152 pgTAP; CI on #84    |
| build              | PASS   | `22d7b3a` local; client bundle PASS       |
| E2E                | PASS   | `22d7b3a` local 31; staging smoke 31      |
| Docker             | PASS   | `22d7b3a` local, both images smoke-tested |
| secret scans       | PASS   | gitleaks 186 commits; 0 tracked `.env*`   |

## Database State

- DEV: 42 migrations (incl. `20260923192024_september_visual_upgrade`). PROD: 41 (Beta 0.1).

## Deployment State

- Production: still `a729722` (Beta 0.1) until the approved run deploys. Staging `22d7b3a`.
- Registry: 35 of 50 before the production push (the production deploy adds one).

## Git State

- `main` at `28dcb0a`; `develop` at `22d7b3a`; this checkpoint on `docs/september-release-checkpoint`.

## Blockers

None.

## User Decisions Needed

- **Approve run 35983628116** in the `production` environment:
  https://github.com/ipanga/teka_edu/actions/runs/35983628116 → « Review deployments ».

## Exact Resume Point

`gh run view 35983628116 --json status,jobs` — if still `waiting`, the owner has not approved.
Once approved: `gh run watch 35983628116 --exit-status`, then
`PLAYWRIGHT_BASE_URL=https://teka-edu.vercel.app npx playwright test tests/e2e/production-public.spec.ts`.

## Resume Verification

1. `git status --short`; `git branch --show-current`; `git log -n 5 --oneline`;
2. `vercel vcr image ls dockerfile --project teka-edu --scope teka10 --json` — the image count;
3. `curl -sS https://teka-edu.vercel.app/api/health` — the production commit.
