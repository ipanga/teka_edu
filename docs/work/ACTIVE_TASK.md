# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Apply ChatGPT's first-pass corrections to 3ème maternelle Week 4 and return it for a second pass.

## Objective

Every Week 4 objective describes the work its own activity sets, and nothing a child steps on
slides.

## Status

`in_progress`

## Branch

`fix/maternelle-3-week-4-first-review`

## Base Branch

`develop` at `c15d535`

## Started

2026-09-16

## Last Checkpoint

2026-09-19 — 10 Week 4 corrections (33 of 3,084 fields), 8 reusable rules, 0 approvals lapsed,
full local suite green.

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

- [x] Week 4's **first actual full review** recorded; its four inherited entries left as
      `consequence`, not relabelled as readings
- [x] 10 corrections — seven objective mappings, the rhyme fallback, the shape-pathway safety,
      the branching of animal and plant needs
- [x] The dance activity took the **alternative** direction: mapped to the endurance objective it
      already earns, rather than rewritten into a dance to fit a code
- [x] `objets-faces-planes` added — a **new narrow material**, not a widening of the generic one
- [x] **8 reusable rules**, each proved against the pre-correction content; two narrowed after
      over-firing on approved lessons
- [x] **Reported, not changed:** three approved lessons claim the safety objective on adult-facing
      text alone. The safety check is a pinned test, not a corpus rule, so no approval lapses
- [x] **33 of 3,084 fields changed**, all Week 4; 144 approved lessons, **0 lapsed**

## In Progress

- [ ] PR into `develop`, CI, squash-merge, staging verification

## Remaining

- [ ] Hand the regenerated `docs/review/2026-2027-maternelle-3-semaine-4.md` back to ChatGPT
      for its second pass. Do not review or approve it here.

## Validation State

| Check              | Result | At                                |
| ------------------ | ------ | --------------------------------- |
| format             | PASS   | working tree                      |
| lint               | PASS   | working tree                      |
| typecheck          | PASS   | working tree                      |
| unit tests         | PASS   | working tree — 322 tests          |
| content validation | PASS   | working tree — 31 files           |
| database tests     | PASS   | fresh reset — 152 assertions      |
| build              | PASS   | working tree                      |
| E2E                | PASS   | working tree — 28 tests           |
| Docker             | PASS   | both images, health + SIGTERM     |
| secret scans       | PASS   | 0 tracked `.env*`; gitleaks in CI |

## Database State

- Local: 23 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: not yet updated with `20260919194738_week4_review_corrections.sql`.
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

1. `git branch --show-current` is `fix/maternelle-3-week-4-first-review`;
2. `git log -n 5 --oneline` — branch point is `c15d535`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head fix/maternelle-3-week-4-first-review` — a PR may already exist;
5. `npx supabase migration list --linked` before assuming DEV needs the migration;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
