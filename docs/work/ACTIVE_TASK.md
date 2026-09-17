# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Apply ChatGPT's first-pass corrections to 3ème maternelle September Week 2 and return it for a second
pass.

## Objective

Every Week 2 activity claims only what its own text supports, and nothing a child is asked to do
requires furniture, contact with glass, or an ambiguous rule.

## Status

`in_progress`

## Branch

`fix/maternelle-3-week-2-review`

## Base Branch

`develop` at `b5def49`

## Started

2026-09-16

## Last Checkpoint

2026-09-17 — 14 Week 2 corrections applied, 8 new rule-shaped tests, 0 approvals lapsed,
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

- [x] 14 corrections applied across 6 lessons, 3 domains and one story
- [x] Objective mappings split so no activity carries what its sibling works
- [x] Obstacle course made soft: cloth held by the adult, cushion, flat strip — no furniture
- [x] Balance activity's material narrowed to a floor marker
- [x] « Va toucher la fenêtre » → « Montre-moi la fenêtre du doigt »
- [x] Cat game's roles named and swapped; weekday task works one day at a time
- [x] Forced repetition replaced by invite-accept-reformulate; « à sa droite » removed
- [x] Tito's story keeps the quantity reasoning, loses the formal operation
- [x] Biological needs reworded; `ils` removed from a lexicon that never asks for it
- [x] Three **new** material codes rather than editing the shared entry 3 approved 1ère lessons use
- [x] **0 of 104 approvals lapsed** — verified with `checkLessonReview` across both levels
- [x] Two occurrences outside Week 2 corrected (day 15 ritual, Tito on days 14 and 18), recorded
      as `consequence` — not as reviews of those weeks
- [x] 8 new rule-shaped tests, each proved to fail against the old content before being kept
- [x] Existing phonology rule refined: it tested the declared type, and would have rejected a
      ritual that genuinely claps syllables

## In Progress

- [ ] PR into `develop`, CI, squash-merge, staging verification

## Remaining

- [ ] Hand the regenerated `docs/review/2026-2027-maternelle-3-semaine-2.md` back to ChatGPT for
      its second pass. Do not review or approve it here.

## Validation State

| Check              | Result | At                                |
| ------------------ | ------ | --------------------------------- |
| format             | PASS   | working tree                      |
| lint               | PASS   | working tree                      |
| typecheck          | PASS   | working tree                      |
| unit tests         | PASS   | working tree — 291 tests          |
| content validation | PASS   | working tree — 31 files           |
| database tests     | PASS   | fresh reset — 152 assertions      |
| build              | PASS   | working tree                      |
| E2E                | PASS   | working tree — 28 tests           |
| Docker             | PASS   | both images, health + SIGTERM     |
| secret scans       | PASS   | 0 tracked `.env*`; gitleaks in CI |

## Database State

- Local: 16 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: not yet updated with `20260917205257_week2_review_corrections.sql`.
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

1. `git branch --show-current` is `fix/maternelle-3-week-2-review`;
2. `git log -n 5 --oneline` — branch point is `b5def49`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head fix/maternelle-3-week-2-review` — a PR may already exist;
5. `npx supabase migration list --linked` before assuming DEV needs the migration;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
