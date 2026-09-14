# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Phase 3D — home screen, class selection, child visual design, illustrations, motion and audio.

## Objective

Teka Edu opens on a welcoming home screen where a parent picks the class; the level is explicit
in the routes and the data rather than assumed in components; the child's surface looks like it
was made for a five-year-old; illustrations cover what they should; motion is calm and optional;
and audio has an architecture with an honest account of what can and cannot be recorded.

## Status

`in_progress`

## Branch

`feat/home-visual-audio-experience`

## Base Branch

`develop`

## Started

2026-09-14

## Last Checkpoint

2026-09-14 — documentation done (ADR-044/045/046, PARENT_SESSION, MEDIA_ARCHITECTURE,
REAL_SESSION_TESTING, CLAUDE, README, PROJECT_STATUS) and the full local suite is green.
Next: mark PR #28 ready, wait for CI, squash-merge, verify staging.

## Scope

- A home screen with the three maternelle classes, honest about which have content.
- Level-aware routing and state; no hardcoded `maternelle-3` in components.
- A visual pass on the child-facing surface; keep the two zones.
- Re-audit illustrations against current content; add what genuinely helps.
- A small CSS animation system honouring `prefers-reduced-motion`.
- An audio architecture, with assets only where a trustworthy recording exists.
- Report media, motion and audio coverage together.

## Out of Scope

- **October**, and authoring 1ère/2ème maternelle content.
- Child profiles, accounts, analytics, progress sync, gamification.
- Approving lessons; ISSUE-017 stays open.
- Paid anything; production; `main`.

## Product Decisions

- Parent-led after-school répétiteur; 30-45 minutes, September stays at 35 (ADR-039).
- French Cycle 1 is the curriculum; DRC calendar and context; PNEM as compatibility (ADR-037).
- Media is repository SVG by stable id, $0 (ADR-042).
- The screen guides; it never replaces speaking, moving or handling real things.
- Never claim the app observed what it cannot see.

## Completed

- [x] Resume protocol; state verified against the repository and the cloud
- [x] Checkpoint commit, push, **Draft PR #28**
- [x] **M1** home screen with the three classes; `/maternelle/<1|2|3>/…` routes; the level is a
      parameter everywhere, no component assumes 3ème maternelle; an unwritten class says so and
      never borrows another's lessons
- [x] **M2** visual pass: bigger pictures that grow with the screen, larger targets, roomier
      child surface, the two zones kept
- [x] **M4** motion system in one stylesheet — rise, pop, nudge, attention — all disabled by
      `prefers-reduced-motion`, none required to use an activity
- [x] Child screen is now a real modal `<dialog>`: the parent's navigation is inert behind it,
      so a mis-tap cannot end the activity (a test proves the home link is unclickable)
- [x] **M5** audio architecture: `AudioAsset`, registry list, text narration, a listen control
      that appears only when a recording exists — **zero assets, deliberately**
- [x] **M6** `npm run media:report` now covers illustrations, audio, motion and class availability

## In Progress

- [ ] M8 — PR #28 ready for review, CI, merge, staging verification

## Remaining

1. M1 home screen, level routes, availability, persistence.
2. M2 child-facing visual pass.
3. M3 illustration audit and new assets.
4. M4 animation system with reduced-motion.
5. M5 audio architecture and an honest pronunciation plan.
6. M6 reporting; M7 tests; M8 documentation, validation, staging.

## Validation State

| Check              | Result  | At                                |
| ------------------ | ------- | --------------------------------- |
| format             | PASS    | working tree                      |
| lint               | PASS    | working tree                      |
| typecheck          | PASS    | working tree                      |
| unit tests         | PASS    | working tree — 210 tests          |
| content validation | PASS    | working tree — 21 files           |
| database tests     | PASS    | local reset — 144 assertions      |
| build              | PASS    | working tree — 9 routes           |
| client bundle      | PASS    | sentinels, 3 values absent        |
| E2E                | PASS    | working tree — 27 tests           |
| secret scans       | PASS    | 0 tracked `.env*`; gitleaks in CI |
| Docker images      | NOT RUN | left to CI                        |
| staging            | STALE   | not deployed from this branch yet |

## Database State

- Local: 12 migrations; `db reset` + 144 pgTAP assertions pass.
- DEV: 12 migrations, local and remote identical; 38 media assets, 14 illustrated texts, 36
  tables, 0 approved lessons; security advisors clean.
- PROD: untouched.

## Deployment State

- Staging: deployed at `27e9054`; 20 E2E tests passed against the live deployment.
- Production: disabled; `main` at `1b95480`.

## Git State

- Branch `feat/home-visual-audio-experience`, from `develop` at `11c8f6c`.
- No checkpoint commit yet, not pushed, no PR.
- Uncommitted: this file.

## Blockers

None.

## User Decisions Needed

- Which task comes next. The recommendation is to run one real September session with a child,
  following `docs/REAL_SESSION_TESTING.md`, before deciding between October, audio, or more
  visuals.

## Exact Resume Point

Mark PR #28 ready for review, wait for the four required checks, squash-merge into
`develop`, then verify the live staging application against the Phase 3D checklist.

## Resume Verification

1. `git branch --show-current` is `feat/september-child-experience`;
2. `git log -n 5 --oneline` — branch point is `ec4eb26`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head feat/september-child-experience` — a Draft PR may exist;
5. `npx supabase migration list --linked` only if a migration was in flight;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
