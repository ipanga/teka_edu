# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Apply the 1ère maternelle Week 1 pedagogical review corrections (ChatGPT,
`accepted-with-modifications`), regenerate the package, and return it for a second pass.

## Objective

Correct the level/band template bug, the objective mismatch, the stale vocabulary, and three
real safety defaults inherited from an older class.

## Status

`in_progress`

## Branch

`fix/maternelle-1-week-1-review`

## Base Branch

`develop` at `baeebbc`

## Started

2026-09-15

## Last Checkpoint

2026-09-15 — all corrections applied, packages regenerated, full local suite green.

## Scope

To be filled in when the next task begins.

## Out of Scope

- October, and 2ème maternelle content.
- Marking any lesson `approved` before its batch has passed the review gate (ADR-047).
- Claiming a human-teacher review: none has happened (ISSUE-017, open and non-blocking).
- Paid anything; production; `main`.

## Product Decisions

- Parent-led after-school répétiteur; 30-45 minutes (1ère: about 30) (ADR-039).
- French Cycle 1 is the curriculum; DRC calendar and context; PNEM as compatibility (ADR-037).
- Level → band: 1ère `before-4` (116 objectives), 2ème `from-4` (139), 3ème `from-5` (162).
  `before-4` is the earliest band, so 1ère introduces everything it touches.
- Media is repository SVG by stable id; reuse before creating (ADR-042).
- The app opens on a class; a class with no lessons says so and borrows nothing (ADR-044).
- Animation is decoration, always off under `prefers-reduced-motion` (ADR-045).
- The parent is the voice; no synthesised speech for a word a child copies (ADR-046).
- The pedagogical gate is an independent review, not necessarily a human one (ADR-047).
- **Never edit generated content by hand.** Fix the generator; a hand edit gets reverted
  silently the next time anyone regenerates.
- An activity claims only what it actually works; a mis-mapped ritual means auditing the month.
- A reviewer must see what they are asked to judge.
- Never claim the app observed what it cannot see.

## Completed

- [x] Phase 3A — September programme and the parent session (archived)
- [x] Session duration policy and the resumable-work protocol (archived)
- [x] Phase 3B — visuals, interaction and real-session testing (archived)
- [x] Phase 3C — the session a parent and child can sit down and do (archived)

## In Progress

- [ ] PR, CI, merge, staging

## Remaining

- [ ] Return the regenerated Week 1 package for the second ChatGPT pass

## Validation State

| Check              | Result  | At                                |
| ------------------ | ------- | --------------------------------- |
| format             | PASS    | working tree                      |
| lint               | PASS    | working tree                      |
| typecheck          | PASS    | working tree                      |
| unit tests         | PASS    | working tree — 224 tests          |
| content validation | PASS    | working tree — 30 files           |
| database tests     | PASS    | fresh reset — 149 assertions      |
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
