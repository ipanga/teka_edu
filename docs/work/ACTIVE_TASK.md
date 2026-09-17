# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Approve 3ème maternelle September Week 1 after ChatGPT's final `accepted`, and generate the Week 2
review package.

## Objective

Week 1 is approved through a mechanism that would refuse to approve it if the review had not
happened; Weeks 2-5 are untouched by that approval.

## Status

`in_progress`

## Branch

`feat/approve-maternelle-3-week-1`

## Base Branch

`develop` at `21076a6`

## Started

2026-09-16

## Last Checkpoint

2026-09-17 — Week 1 approved (16 lessons, fresh digests), approval gate written and proved to
refuse Weeks 2-5, Week 2 package generated, full local suite green.

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

- [x] All 13 previously requested corrections verified still present before approving — none had
      regressed
- [x] ChatGPT's final `accepted` recorded in `content/reviews/history.json`, alongside the three
      earlier `accepted-with-modifications` passes, unrewritten
- [x] `scripts/approve-week.ts` — approves only a week with a `full-review` that concluded
      `accepted`, computes every digest with `lessonDigest` including media fingerprints, and
      refuses a week not entirely at `review`
- [x] Proved it refuses Weeks 2, 3, 4 and 5 before using it on Week 1
- [x] **16 Week 1 lessons `approved`**; 72 remain `review` with `review: null`
- [x] 16 distinct digests, each recomputing exactly, none shared with 1ère maternelle
- [x] A package for a never-read week says so, and labels an inherited correction as one
- [x] pgTAP fixture repaired: four constraint assertions had started passing vacuously
- [x] 11 new tests, including digest lapse on adult guidance, child instruction and media bytes

## In Progress

- [ ] PR into `develop`, CI, squash-merge, staging verification

## Remaining

- [ ] Hand `docs/review/2026-2027-maternelle-3-semaine-2.md` to ChatGPT. Do not review it here.

## Validation State

| Check              | Result | At                                |
| ------------------ | ------ | --------------------------------- |
| format             | PASS   | working tree                      |
| lint               | PASS   | working tree                      |
| typecheck          | PASS   | working tree                      |
| unit tests         | PASS   | working tree — 283 tests          |
| content validation | PASS   | working tree — 31 files           |
| database tests     | PASS   | fresh reset — 152 assertions      |
| build              | PASS   | working tree                      |
| E2E                | PASS   | working tree — 28 tests           |
| Docker             | PASS   | both images, health + SIGTERM     |
| secret scans       | PASS   | 0 tracked `.env*`; gitleaks in CI |

## Database State

- Local: 15 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: not yet updated with `20260917185354_approve_maternelle_3_week_1.sql`.
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

1. `git branch --show-current` is `feat/approve-maternelle-3-week-1`;
2. `git log -n 5 --oneline` — branch point is `21076a6`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head feat/approve-maternelle-3-week-1` — a PR may already exist;
5. `npx supabase migration list --linked` before assuming DEV needs the migration;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
