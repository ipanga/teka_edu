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

`in_progress`

## Branch

`chore/registry-prune-and-cli-pin` → `develop`; then the promotion PR `develop` → `main`.

## Base Branch

`develop` at `da2d4fb`

## Started

2026-09-24

## Last Checkpoint

2026-09-24 — Registry pruned **44 → 35** (9 oldest, production `a7297228f173` and staging
`da2d4fbd32c3` protected and verified present). Supabase CLI pinned to 2.117.0 in both deploy
workflows with a drift test. PR into `develop` next.

## Scope

- Registry maintenance (done); CLI pin in `deploy-staging.yml` and `deploy-production.yml`.
- Validate `develop`; promote `develop` → `main`; production deployment through its gates.

## Out of Scope

- October content; domain changes; any paid service; any manual SQL on PROD.

## Product Decisions

- Owner authorised: pruning, and the production release once every required check is green.

## Completed

- [x] Registry pruned to 35 with the repository policy.
- [x] CLI pinned in both deploy workflows; `tests/unit/supabase-cli-pin.test.ts` (shown failing
      on an unpinned workflow).

## In Progress

- [ ] PR `chore/registry-prune-and-cli-pin` → `develop`.

## Remaining

- [ ] Validate `develop` (176/176, frozen pictures, DEV migrations, PROD still without them).
- [ ] Promotion PR `develop` → `main` (merge commit); production workflow approval gate.
- [ ] PROD migration, Vercel production, anonymous verification, records.

## Validation State

| Check              | Result  | At  |
| ------------------ | ------- | --- |
| format             | NOT RUN |     |
| lint               | NOT RUN |     |
| typecheck          | NOT RUN |     |
| unit tests         | NOT RUN |     |
| content validation | NOT RUN |     |
| database tests     | NOT RUN |     |
| build              | NOT RUN |     |
| E2E                | NOT RUN |     |
| Docker             | NOT RUN |     |
| secret scans       | NOT RUN |     |

## Database State

- DEV: 42 migrations (incl. `20260923192024_september_visual_upgrade`). PROD: 41 (Beta 0.1).

## Deployment State

- Production `a729722` (Beta 0.1). Staging `da2d4fb`. Registry 35 of 50.

## Git State

- `develop` at `da2d4fb`; `main` at `a729722`.

## Blockers

None.

## User Decisions Needed

None yet. The production workflow will pause for the owner's environment approval.

## Exact Resume Point

Open the PR for `chore/registry-prune-and-cli-pin`, wait for green CI, squash-merge, watch
`deploy-staging`.

## Resume Verification

1. `git status --short`; `git branch --show-current`; `git log -n 5 --oneline`;
2. `vercel vcr image ls dockerfile --project teka-edu --scope teka10 --json` — the image count;
3. `curl -sS https://teka-edu.vercel.app/api/health` — the production commit.
