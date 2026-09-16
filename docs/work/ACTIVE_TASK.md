# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Apply ChatGPT's second-pass corrections to 3ème maternelle September Week 1, and return the
regenerated package for its short confirmation pass.

## Objective

Every objective a Week 1 activity claims is one the child actually works, proved by rules rather
than by reading.

## Status

`in_progress`

## Branch

`fix/maternelle-3-week-1-review`

## Base Branch

`develop` at `a4a014d`

## Started

2026-09-16

## Last Checkpoint

2026-09-16 — all six corrections applied, the four defect classes closed across September, seven
regression rules written, generators fixed, full local suite green.

## Scope

- The five objective-mapping corrections plus the geometry exemplars and the zero-screen wording.
- Every other occurrence of the same defect classes, because the rules are written as rules.
- Regeneration: media, 11 review packages, pgTAP reference test, data migration.

## Out of Scope

- Approving Week 1, or any 3ème lesson. All 88 stay `review`.
- Reviewing Weeks 2–5. The mapping fixes there are forced by the rules, not a review.
- October, 2ème maternelle, production, `main`, anything paid.
- Re-mapping activities the rules did not force and ChatGPT has not read (`m3-math-06-a2`,
  `m3-math-20-a1`/`-a2` — reported in `docs/PEDAGOGICAL_REVIEW.md`).

## Product Decisions

- The pedagogical gate is an independent review, not necessarily a human one (ADR-047).
- A lesson's objective lists are **authored**; the validators force them to equal the union of the
  activities' objectives, in both directions. There is no generator to run, and adding one would
  replace a pedagogical judgement with a derivation.
- A correction is applied everywhere its class occurs when doing so moves nothing else. Every one
  here was free: the right activity was a sibling in the same lesson on the same day.
- Never edit generated content by hand; fix the generator. Both generators now format their own
  output, so regenerating no longer dirties the tree.
- Colour never carries meaning: each new shape variant wears the colour of a different shape.

## Completed

- [x] Six corrections applied — `m3-math-01` a1/a2, `m3-world-01-a1`, `m3-math-03-a2`,
      `m3-lang-04-a1`, `m3-math-04-a2`
- [x] Geometry: preparation asks for 2–3 of each shape; 4 generated variants on screen
- [x] `ChooseOne` now matches on what a picture **is**, so a tilted square is accepted
- [x] Eleven further occurrences of the same four classes corrected in Weeks 2–5, ripple-free
- [x] Seven regression rules, written against the official statements, not code lists
- [x] Zero screen interaction no longer described as the child using the device
- [x] `tools/media/build.ts` and `tools/annual-plan/build.ts` emit Prettier-formatted output
- [x] `scripts/reconfirmation-package.ts` reports the real instructional day, not the track step
- [x] Review history recorded for Week 1 and for each affected week 2–5
- [x] 26 of 3,084 compared fields changed — machine-proved, nothing unintended

## In Progress

- [ ] PR into `develop`, CI, squash-merge, staging verification

## Remaining

- [ ] Return `docs/review/2026-2027-maternelle-3-semaine-1.md` for ChatGPT's confirmation

## Validation State

| Check              | Result | At                                |
| ------------------ | ------ | --------------------------------- |
| format             | PASS   | working tree                      |
| lint               | PASS   | working tree                      |
| typecheck          | PASS   | working tree                      |
| unit tests         | PASS   | working tree — 260 tests          |
| content validation | PASS   | working tree — 31 files           |
| database tests     | PASS   | fresh reset — 152 assertions      |
| build              | PASS   | working tree                      |
| E2E                | PASS   | working tree — 28 tests           |
| Docker             | PASS   | both images, health + SIGTERM     |
| secret scans       | PASS   | 0 tracked `.env*`; gitleaks in CI |

## Database State

- Local: 13 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: not yet updated with `20260916183458_week1_review_corrections_m3.sql`.
- PROD: untouched.

## Deployment State

- Staging: not yet redeployed with these corrections.
- Production: disabled; `main` at `1b95480`.

## Git State

- `fix/maternelle-3-week-1-review`, branched from `develop` at `a4a014d`. No PR open yet.

## Blockers

None.

## User Decisions Needed

None outstanding. Week 1 goes back to ChatGPT; Weeks 2–5 still need their own first pass.

## Exact Resume Point

Commit, open the PR into `develop`, wait for CI, squash-merge, verify staging.

## Resume Verification

1. `git branch --show-current` is `fix/maternelle-3-week-1-review`;
2. `git log -n 5 --oneline` — branch point is `a4a014d`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head fix/maternelle-3-week-1-review` — a PR may already exist;
5. `npx supabase migration list --linked` before assuming DEV needs the migration;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
