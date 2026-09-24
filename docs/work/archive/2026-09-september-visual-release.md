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

`completed`

## Branch

`chore/registry-prune-and-cli-pin` → `develop`; then the promotion PR `develop` → `main`.

## Base Branch

`develop` at `da2d4fb`

## Started

2026-09-24

## Last Checkpoint

2026-09-24 — **SEPTEMBER VISUAL UPGRADE PRODUCTION RELEASE: SUCCESS.** Run 35983628116
(approved by the owner) applied migration 42 to PROD and deployed
`dpl_22DjVFzGbinNs4xkCrEzgMM5Svh7` (production, READY, `28dcb0a`). Anonymous verification passed
in full. Record: `docs/releases/SEPTEMBER_VISUAL_UPGRADE_RELEASE.md`.

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

- [x] Production run 35983628116: preflights, PROD 41 → 42, Vercel production READY, smoke 31.
- [x] Anonymous verification: public suite 9/9; 49/49 pictures with frozen hashes; 39 page views
      at phone/tablet/TV with 0 broken images; `m3-art-04-a1` shows the rain; PROD read-only:
      176 approved, 176 distinct digests, all `ai-assisted`, 36/36 RLS, no user data; staging,
      team alias and generated URL 302.

## In Progress

None.

## Remaining

- [ ] Promote these records to `main` at the next release (they live on `develop`).

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

- Local 42; DEV 42; **PROD 42** (= repository). Working copy linked to DEV (restored after the
  read-only PROD checks).

## Deployment State

- **Production:** https://teka-edu.vercel.app, `dpl_22DjVFzGbinNs4xkCrEzgMM5Svh7`, `28dcb0a`, PROD.
- Staging: `22d7b3a` (before this records PR). Registry: **37 of 50**.
- Supabase CLI: **2.117.0** pinned in CI and both deploy workflows.

## Git State

- `main` at `28dcb0a`; `develop` at `22d7b3a`; records on `docs/september-release-checkpoint`.

## Blockers

None.

## User Decisions Needed

None for this task. Proposed next task below; not started.

## Exact Resume Point

The release is closed. Next task (not started): **refine the October annual progression for 3ème
maternelle, then prepare October Weeks 1–2 as the first pedagogical-review batch.**

## Resume Verification

1. `git status --short`; `git branch --show-current`; `git log -n 5 --oneline`;
2. `vercel vcr image ls dockerfile --project teka-edu --scope teka10 --json` — the image count;
3. `curl -sS https://teka-edu.vercel.app/api/health` — the production commit.
