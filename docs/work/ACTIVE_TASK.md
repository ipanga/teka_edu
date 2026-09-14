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

The Week 1 review corrections are merged. No new task has been started.

## Status

`planned`

## Branch

`develop` — no feature branch open.

## Base Branch

`develop`

## Started

—

## Last Checkpoint

2026-09-14 — reset after PR #31 merged as `183e7e4` and verified on live staging.

## Scope

To be filled in when the next task begins.

## Out of Scope

- **October**, and 1ère/2ème maternelle content.
- Approving any lesson; ISSUE-017 stays open.
- Scores, points, rewards, dashboards, adaptive engines.
- A child account or profile system.
- Paid anything: no TTS, CDN, stock imagery, storage.
- Production, `main`.

## Product Decisions

- Parent-led after-school répétiteur; 30-45 minutes, September stays at 35 (ADR-039).
- French Cycle 1 is the curriculum; DRC calendar and context; PNEM as compatibility (ADR-037).
- Media is repository SVG by stable id, $0 (ADR-042).
- The app opens on a class; a class with no lessons says so and borrows nothing (ADR-044).
- Animation is decoration, always off under `prefers-reduced-motion` (ADR-045).
- The parent is the voice; no synthesised speech for a word a child copies (ADR-046).
- **An activity claims only what it actually works.** When one instance of a repeated ritual is
  mis-mapped, audit the whole month, and never repair a mapping by changing the pedagogy.
- **A reviewer must see what they are asked to judge**: the review package quotes every story,
  rhyme and question in full, and never truncates official text.
- The screen guides; it never replaces speaking, moving or handling real things.
- Never claim the app observed what it cannot see.

## Completed

- [x] Phase 3A — September programme and the parent session (archived)
- [x] Session duration policy and the resumable-work protocol (archived)
- [x] Phase 3B — visuals, interaction and real-session testing (archived)
- [x] Phase 3C — the session a parent and child can sit down and do (archived)

## In Progress

- [ ] Nothing.

## Remaining

1. Awaiting the owner's choice of next task.

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
