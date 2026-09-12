# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Phase 3B — the September parent experience: visuals, interaction and real-session testing.

## Objective

A parent can open the staging app on a phone and run a September lesson that feels like a guided
session rather than rendered database rows: clear French, simple visuals where they help, a few
genuinely useful interactions, everything else deliberately off-screen — plus a way for the owner
to run one real 30-to-45-minute session and record what happened.

## Status

`in_progress`

## Branch

`feat/september-experience-and-media`

## Base Branch

`develop`

## Started

2026-09-12

## Last Checkpoint

2026-09-12 — documentation written (ADR-042, MEDIA_ARCHITECTURE, REAL_SESSION_TESTING, plan
amendment) and the full validation suite is green. About to mark PR #24 ready and wait for CI.

## Scope

- Audit the Phase 3A staging experience and fix what actually hurts a parent or child.
- Resolve PD-008: a media architecture, recorded as an ADR.
- A reusable visual baseline — shapes, quantities, word cards, story illustration — repository-
  managed, free, offline-friendly.
- A small set of interactive activities where interaction genuinely teaches: image choice,
  quantity, matching, sorting, shapes.
- A September media/interaction coverage report.
- A real-session test mode that records observations locally, with no child data.
- Non-destructive update of `TEKA_EDU_PROJECT_PLAN.md` so it stops misleading future sessions.

## Out of Scope

- **October content**, and 1ère/2ème maternelle content.
- Rewriting the 88 lessons. Content changes only where a visual genuinely requires it, minimal,
  documented, objective mapping preserved, status unchanged.
- Approving any lesson: usability testing is **not** pedagogical approval.
- Expanding the annual plan (ISSUE-022 stays open).
- Scoring, grades, dashboards, adaptive engines.
- Paid anything: no TTS, CDN, stock images, storage or extra projects.
- Production, `main`.

## Product Decisions

- Teka Edu is a parent-led after-school digital répétiteur; a session is 30–45 minutes (ADR-039).
- French Cycle 1 is the curriculum, DRC calendar and context, French-first with optional English
  scaffolding, PNEM as compatibility reference (ADR-037).
- The screen guides; it is not the activity. Movement, manipulation, drawing and conversation
  stay off-screen.
- The app must never claim to have assessed what it cannot observe.

## Completed

- [x] Resume protocol: read `CLAUDE.md`, `PROJECT_STATUS.md`, `ACTIVE_TASK.md`,
      `RESUMABLE_WORKFLOW.md`; verified git, PRs, Actions, DEV migrations

## In Progress

- [ ] PR #24 ready for review, four required CI checks, squash-merge, verify staging

## Remaining

1. Audit the September experience (calendar, lesson flow, guidance, English, pause, completion,
   catch-up, non-school day, phone and desktop). Record concrete problems, not aesthetics.
2. Media architecture + ADR resolving PD-008; `docs/MEDIA_ARCHITECTURE.md`.
3. Media registry and the first reusable assets (shapes, digits/quantities, a few object cards).
4. Classify all 170 activities: visual required / useful / not needed; audio; interactive or not.
5. Interactive renderers: image choice, quantity, matching, sorting, shapes — with gentle retry.
6. Wire media into the September activities that need it (minimal content change).
7. `npm run media:report` — September media and interaction coverage.
8. Real-session test mode + `docs/REAL_SESSION_TESTING.md`.
9. Tests: media integrity, renderer selection, interaction, parent flow, responsive, security.
10. Documentation, including a non-destructive amendment to `TEKA_EDU_PROJECT_PLAN.md`.
11. Full validation suite; PR ready; CI; squash-merge; verify staging.

## Validation State

| Check              | Result  | At                                         |
| ------------------ | ------- | ------------------------------------------ |
| format             | PASS    | working tree                               |
| lint               | PASS    | working tree — 0 warnings                  |
| typecheck          | PASS    | working tree                               |
| unit tests         | PASS    | working tree — 206 tests                   |
| content validation | PASS    | working tree — 21 files                    |
| database tests     | PASS    | working tree — 144 pgTAP assertions        |
| build              | PASS    | working tree                               |
| E2E                | PASS    | working tree — 17 tests                    |
| Docker             | NOT RUN | left to CI; no Dockerfile change           |
| secret scans       | PASS    | working tree — no leaks, 0 tracked `.env*` |
| staging            | STALE   | this branch has not been deployed yet      |

## Database State

- Local: 8 migrations applied.
- DEV: 8 migrations applied; local and remote lists identical (verified 2026-09-12).
- PROD: untouched, and must stay so.
- Expected here: at most one additive migration, only if media metadata needs mirroring.

## Deployment State

- Staging: enabled; last deployment `cd86efd`, success.
- Production: disabled. No production token, no `PRODUCTION_DEPLOY_ENABLED`; `main` at `1b95480`.

## Git State

- Branch `feat/september-experience-and-media`, from `develop` at `cd86efd`.
- Last checkpoint commit: none yet.
- Pushed: no. PR: none yet.
- Uncommitted work: this file.

## Blockers

None.

## User Decisions Needed

None yet. If any media approach risked a charge, work would stop and ask first.

## Exact Resume Point

Mark PR #24 ready (`gh pr ready 24`), wait for the four required checks, squash-merge, then
verify staging: the September calendar, a language lesson, a mathematics lesson, the shape
interaction, counting, a story, an off-screen activity, English hidden by default, catch-up, a
non-school date, and that the environment is staging on the DEV Supabase ref with no PROD ref.

## Resume Verification

1. `git branch --show-current` is `feat/september-experience-and-media`;
2. `git log -n 5 --oneline` — the branch point is `cd86efd`;
3. `git status --short` — read any uncommitted work before discarding it;
4. `gh pr list --head feat/september-experience-and-media` — a Draft PR may already exist;
5. `npx supabase migration list --linked` if a migration was in flight;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
