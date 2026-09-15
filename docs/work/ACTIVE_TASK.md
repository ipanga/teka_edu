# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Apply the 1ère maternelle Week 3 review corrections (8 items) and return the package for a
short second pass.

## Objective

Close the copy-and-rename family of defects with general validators, not per-lesson checks.

## Status

`in_progress`

## Branch

`fix/maternelle-1-week-3-review`

## Base Branch

`develop` at `24d1619`

## Started

2026-09-15

## Last Checkpoint

2026-09-15 — all 8 corrections applied, 6 validators added, full local suite green.

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

- [x] Seed-bag fallback removed from the **shared** material definition, with a safety note
      explaining why; affects 3ème's material text too, reported
- [x] Line walking fully failure-neutral: the child chooses to continue or restart
- [x] `sans écran` → `sans interaction écran`, and the parent screen no longer says « posez
      l'écran » while showing a picture on it
- [x] **Week 1 diff machine-proven against `5899d94`: 0 substantive child-facing changes**
- [x] **36 lessons approved** — Weeks 1 and 2, `ai-assisted`, fresh digests, old ones not reused

## In Progress

- [ ] PR, CI, merge, staging

## Remaining

- [ ] Return Week 3 for its short second pass

## Validation State

| Check              | Result  | At                                |
| ------------------ | ------- | --------------------------------- |
| format             | PASS    | working tree                      |
| lint               | PASS    | working tree                      |
| typecheck          | PASS    | working tree                      |
| unit tests         | PASS    | working tree — 234 tests          |
| content validation | PASS    | working tree — 30 files           |
| database tests     | PASS    | fresh reset — 152 assertions      |
| build              | PASS    | working tree                      |
| E2E                | PASS    | working tree — 28 tests           |
| Docker             | NOT RUN | left to CI                        |
| secret scans       | PASS    | 0 tracked `.env*`; gitleaks in CI |

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

Open the PR into `develop`, wait for CI, squash-merge, verify staging.

## Resume Verification

1. `git branch --show-current` is `feat/september-child-experience`;
2. `git log -n 5 --oneline` — branch point is `ec4eb26`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head feat/september-child-experience` — a Draft PR may exist;
5. `npx supabase migration list --linked` only if a migration was in flight;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
