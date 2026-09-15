# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

None in progress.

## Objective

1ère maternelle Week 1 is finalised and merged. No new task has been started.

## Status

`planned`

## Branch

`develop` — no feature branch open.

## Base Branch

`develop`

## Started

—

## Last Checkpoint

2026-09-15 — reset after PR #39 merged as `5899d94` and verified on live staging.

## Scope

To be filled in when the next task begins.

## Out of Scope

- October, and 2ème maternelle content.
- Production: `PRODUCTION_DEPLOY_ENABLED` stays off until both September gates are met
  (`docs/releases/BETA_0_1_READINESS.md`).
- Marking a week `approved` before it has passed the gate (ADR-047).
- Claiming a human-teacher review: none has happened (ISSUE-017, open and non-blocking).
- Paid anything; `main`.

## Product Decisions

- **Beta 0.1** is the first public release: 1ère and 3ème September available, 2ème « en
  préparation ». It ships when both classes' September passes the AI-assisted gate.
  Previews stay protected; only the production domain becomes public.
- Beta 0.1 stores **no personal data** and makes no client-side network write. Keep it that way.
- Parent-led répétiteur; 30-45 minutes (1ère: about 30) (ADR-039).
- Level → band: 1ère `before-4` (116), 2ème `from-4` (139), 3ème `from-5` (162).
- **Progression follows the days a child lives, not the tracks.** A lesson may not claim an
  objective no activity works, and nothing is « déjà vu » before something teaches it.
- An interaction pattern may be reused across levels; its assumptions about a child's body may not.
- Anything a generated document says about "the child" is derived from the level.
- Media is repository SVG by stable id; reuse before creating (ADR-042).
- Animation is decoration (ADR-045); the parent is the voice (ADR-046).
- The pedagogical gate is an independent review, not necessarily a human one (ADR-047).
- Never edit generated content by hand; fix the generator.

## Completed

- [x] Phase 3A — September programme and the parent session (archived)
- [x] Session duration policy and the resumable-work protocol (archived)
- [x] Phase 3B — visuals, interaction and real-session testing (archived)
- [x] Phase 3C — the session a parent and child can sit down and do (archived)

## In Progress

- [ ] Nothing.

## Remaining

**Next task (not started):** submit `docs/review/2026-2027-maternelle-1-semaine-2.md` to the
gate. Then Weeks 3-5, and 3ème's Week 1 re-review plus Weeks 2-5, in either order. Not October,
not 2ème maternelle, no production.

## Validation State

| Check              | Result | At                                         |
| ------------------ | ------ | ------------------------------------------ |
| format             | PASS   | working tree                               |
| lint               | PASS   | working tree — 0 warnings                  |
| typecheck          | PASS   | working tree                               |
| unit tests         | PASS   | working tree — 207 tests                   |
| content validation | PASS   | working tree — 21 files                    |
| database tests     | PASS   | working tree — 144 pgTAP assertions        |
| build              | PASS   | working tree                               |
| E2E                | PASS   | working tree — 20 tests                    |
| Docker             | PASS   | CI at `27e9054` — both images              |
| secret scans       | PASS   | working tree — no leaks, 0 tracked `.env*` |
| staging            | PASS   | `27e9054` deployed, 20 E2E against it      |

## Database State

- Local: 12 migrations; `db reset` + 144 pgTAP assertions pass.
- DEV: 12 migrations, local and remote identical; 38 media assets, 14 illustrated texts, 36
  tables, 0 approved lessons; security advisors clean.
- PROD: untouched.

## Deployment State

- Staging: deployed at `27e9054`; 20 E2E tests passed against the live deployment.
- Production: disabled; `main` at `1b95480`.

## Git State

- `develop` at `27e9054` plus this closing change. No feature branch, no open PR.

## Blockers

None.

## User Decisions Needed

- Which task comes next. The recommendation is to run one real September session with a child,
  following `docs/REAL_SESSION_TESTING.md`, before deciding between October, audio, or more
  visuals.

## Exact Resume Point

No task is in progress. When the next one starts: fill this file in, create the feature branch
from `develop`, commit an initial checkpoint, and open a Draft PR before the long work begins.

## Resume Verification

1. `git branch --show-current` is `feat/september-child-experience`;
2. `git log -n 5 --oneline` — branch point is `ec4eb26`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head feat/september-child-experience` — a Draft PR may exist;
5. `npx supabase migration list --linked` only if a migration was in flight;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
