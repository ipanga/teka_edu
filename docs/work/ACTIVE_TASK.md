# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Finish 1ère maternelle Week 1 (two progression-metadata corrections), record it as the first
content through the AI-assisted gate, and open the Beta 0.1 readiness tracking.

## Objective

Week 1 approved honestly, progression derived rather than templated, and a release checklist
that cannot be marked done before it is true.

## Status

`in_progress`

## Branch

`fix/week-1-progression-metadata`

## Base Branch

`develop` at `b3aacc6`

## Started

2026-09-15

## Last Checkpoint

2026-09-15 — both corrections applied, Week 1 approved, readiness doc written, full local
suite green.

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
- **An interaction pattern may be reused across levels; its assumptions about a child's body may
  not.** Counting material, furniture handling and running targets are all age-specific, and are
  now held by tests rather than by prose.
- **Anything a generated document says about "the child" must be derived from the level.** A
  fixed age string was right for one level and silently wrong for the next.
- Media is repository SVG by stable id; reuse before creating (ADR-042).
- The app opens on a class; a class with no lessons says so and borrows nothing (ADR-044).
- Animation is decoration, always off under `prefers-reduced-motion` (ADR-045).
- The parent is the voice; no synthesised speech for a word a child copies (ADR-046).
- The pedagogical gate is an independent review, not necessarily a human one (ADR-047).
- Never edit generated content by hand; fix the generator.
- An activity claims only what it actually works.
- Never claim the app observed what it cannot see.

## Completed

- [x] Day-2 stale TIME-SPACE claim removed; **a validator now refuses any lesson-level objective
      no activity works** — it found 53 stale claims, 52 in 3ème, all metadata
- [x] ART progression fixed at source: progression is derived from the order a child meets
      content, day by day and across tracks, not per track in isolation
- [x] **Child-facing content proved unchanged**, field by field, across both levels
- [x] 1ère Week 1: **16 lessons `approved`**, `ai-assisted`, `accepted-with-modifications`
- [x] `docs/releases/BETA_0_1_READINESS.md` opened; privacy audited (no personal data at all)
- [x] `--timestamp=` on the migration generator, so a deliberate name can pass the ordering guard

## In Progress

- [ ] PR, CI, merge, staging

## Remaining

- [ ] Submit 1ère Week 2 to the gate — the next task

## Validation State

| Check              | Result  | At                                |
| ------------------ | ------- | --------------------------------- |
| format             | PASS    | working tree                      |
| lint               | PASS    | working tree                      |
| typecheck          | PASS    | working tree                      |
| unit tests         | PASS    | working tree — 226 tests          |
| content validation | PASS    | working tree — 30 files           |
| database tests     | PASS    | fresh reset — 151 assertions      |
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
