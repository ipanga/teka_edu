# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Make an independent AI-assisted pedagogical review the active development gate, so the
absence of a preschool teacher stops blocking curriculum work — without ever implying a teacher
approved anything (ADR-047).

## Objective

Unblock 1ère/2ème maternelle and later months, and make `approved` say which kind of review
closed the gate.

## Status

`in_progress`

## Branch

`docs/pedagogical-review-policy`

## Base Branch

`develop` at `c820dc5`

## Started

2026-09-15

## Last Checkpoint

2026-09-15 — ADR-047 written, schema/DB/tests/docs updated, full local suite green.
Next: PR, CI, merge.

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

- [x] **ADR-047** written; ADR-035 marked _refined by_, its original text preserved
- [x] `reviewKind` (`ai-assisted` | `human-teacher`) and `outcome` on the review record — the
      whole schema change — with a check that refuses a tool name as a human teacher
- [x] Database mirror + migration `20260915090000_review_kind.sql`, constraint extended; 147 pgTAP
- [x] Review package generation **fails** on an unquoted text or a bullet that promises nothing
- [x] Two tests that asserted "every lesson is `review`" rewritten as invariants
- [x] ISSUE-017 reclassified: open, **non-blocking**, future external assurance; history kept
- [x] Active-policy wording updated in CLAUDE.md, README, PROJECT_STATUS, CONTENT_QUALITY_GATE,
      CONTENT_AUTHORING, PEDAGOGICAL_REVIEW, EDUCATIONAL_MODEL, DAILY_PROGRAMME,
      REAL_SESSION_TESTING, the shipped class page and the observation form

## In Progress

- [ ] PR, CI, squash-merge

## Remaining

- [ ] Report; then 1ère maternelle as a separate task

## Validation State

| Check              | Result  | At                                |
| ------------------ | ------- | --------------------------------- |
| format             | PASS    | working tree                      |
| lint               | PASS    | working tree                      |
| typecheck          | PASS    | working tree                      |
| unit tests         | PASS    | working tree — 217 tests          |
| content validation | PASS    | working tree — 21 files           |
| database tests     | PASS    | fresh reset — 147 assertions      |
| build              | PASS    | working tree                      |
| E2E                | PASS    | working tree — 27 tests           |
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

Open the PR into `develop`, wait for the four required checks, squash-merge.

## Resume Verification

1. `git branch --show-current` is `feat/september-child-experience`;
2. `git log -n 5 --oneline` — branch point is `ec4eb26`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head feat/september-child-experience` — a Draft PR may exist;
5. `npx supabase migration list --linked` only if a migration was in flight;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
