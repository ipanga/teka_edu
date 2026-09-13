# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Phase 3C — the September session a parent and child can actually sit down and do.

## Objective

A parent opens Teka Edu after school, understands at once what to prepare, what to say and what
the child should do, runs a pleasant 30-to-45-minute session without teaching expertise, and
finishes knowing it went well. The child sees one clear thing at a time, in large type, with a
picture when a picture helps.

## Status

`in_progress`

## Branch

`feat/september-child-experience`

## Base Branch

`develop`

## Started

2026-09-13

## Last Checkpoint

2026-09-13 — branch created from `develop` at `ec4eb26`. Resume protocol run: clean tree, no open
PRs, staging green at `ec4eb26`, DEV 10/10 migrations matched, media report reproduced (29/29
required visuals served, 58 useful gaps).

## Scope

- M1 audit the whole September parent journey at phone, tablet and desktop widths.
- M2 separate what the parent needs from what the child needs, with the smallest model that fits.
- M3 classify the 58 visual opportunities one by one and close the ones that matter.
- M4 add interaction only where it carries the learning.
- M5 stories, pauses, stopping early without it feeling like failure.
- M6 make a real session trivial for a non-technical parent to run and report.
- M7 full validation and staging. M8 documentation and report.

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
- The screen guides; it never replaces speaking, moving or handling real things.
- Never claim the app observed what it cannot see.

## Completed

- [x] Resume protocol; state verified against the repository and the cloud

## In Progress

- [ ] M1 — audit the September parent journey

## Remaining

1. M1 audit, recorded as concrete problems before any fix.
2. M2 parent/child separation.
3. M3 visual classification and the assets that matter.
4. M4 interactions.
5. M5 stories, pause, early stop.
6. M6 real-session testing procedure.
7. M7 validation and staging; M8 documentation and final report.

## Validation State

Inherited from `develop` at `ec4eb26`; each becomes `STALE` when this branch changes what it covers.

| Check              | Result | At                                 |
| ------------------ | ------ | ---------------------------------- |
| format             | PASS   | `ec4eb26`                          |
| lint               | PASS   | `ec4eb26`                          |
| typecheck          | PASS   | `ec4eb26`                          |
| unit tests         | PASS   | `ec4eb26` — 206 tests              |
| content validation | PASS   | `ec4eb26` — 21 files               |
| database tests     | PASS   | `ec4eb26` — 144 pgTAP assertions   |
| build              | PASS   | `ec4eb26`                          |
| E2E                | PASS   | `ec4eb26` — 17 tests               |
| Docker             | PASS   | CI at `ec4eb26`                    |
| secret scans       | PASS   | `ec4eb26`                          |
| staging            | PASS   | `ec4eb26` deployed, workflow green |

## Database State

- Local: 10 migrations.
- DEV: 10 migrations, local and remote identical (verified 2026-09-13).
- PROD: untouched, and must stay so.
- Expected here: no migration unless the session model genuinely needs one.

## Deployment State

- Staging: enabled; last deployment `ec4eb26`, success.
- Production: disabled; `main` at `1b95480`.

## Git State

- Branch `feat/september-child-experience`, from `develop` at `ec4eb26`.
- No checkpoint commit yet, not pushed, no PR.
- Uncommitted: this file.

## Blockers

None.

## User Decisions Needed

None yet.

## Exact Resume Point

Commit this checkpoint, push, open the Draft PR, then run M1: the audit of the September journey
in a real browser at phone, tablet and desktop widths, recording concrete problems before fixing
anything.

## Resume Verification

1. `git branch --show-current` is `feat/september-child-experience`;
2. `git log -n 5 --oneline` — branch point is `ec4eb26`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head feat/september-child-experience` — a Draft PR may exist;
5. `npx supabase migration list --linked` only if a migration was in flight;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
