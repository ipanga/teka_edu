# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Apply the final editorial fix, approve 3ème maternelle Week 2, and prepare Week 3 for review.

## Objective

Week 2 is approved through a gate that still refuses every week nobody has read.

## Status

`in_progress`

## Branch

`feat/approve-maternelle-3-week-2`

## Base Branch

`develop` at `036a782`

## Started

2026-09-16

## Last Checkpoint

2026-09-19 — one scaffold fix (1 of 3,084 fields), Week 2 approved (20 lessons), Week 3 package
prepared, full local suite green.

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

- [x] One editorial change: the English scaffold on `m3-time-03-a2` now mirrors the French
      consigne instead of saying « compared to you »
- [x] **Semantic-diff gate: 1 of 3,084 fields changed**, and it was the permitted one
- [x] Final ChatGPT pass recorded as `accepted`; all four passes preserved unrewritten
- [x] **Week 2 approved — 20 lessons**, through `scripts/approve-week.ts`, which still refuses
      Weeks 3, 4 and 5
- [x] 3ème **36 / 88** · 1ère **88 / 88** · total **124 approved**, 124 distinct digests, 0 lapsed
- [x] Beta weekly packages **7 / 10**, computed from canonical data
- [x] ISSUE-026 re-verified live: scaffold change moves the digest, a rewritten story moves only
      its own lesson, missing text or media fails closed
- [x] Eight count-pinned tests made state-derived — a week is approved **iff** its history holds
      an accepted full review, and wholly or not at all. Proved by forging a valid-digest
      approval on an unreviewed week and watching the rule catch it
- [x] Week 3 package prepared, unreviewed and unapproved

## In Progress

- [ ] PR into `develop`, CI, squash-merge, staging verification

## Remaining

- [ ] Hand `docs/review/2026-2027-maternelle-3-semaine-3.md` to ChatGPT. Do not review or
      approve it here.

## Validation State

| Check              | Result | At                                |
| ------------------ | ------ | --------------------------------- |
| format             | PASS   | working tree                      |
| lint               | PASS   | working tree                      |
| typecheck          | PASS   | working tree                      |
| unit tests         | PASS   | working tree — 305 tests          |
| content validation | PASS   | working tree — 31 files           |
| database tests     | PASS   | fresh reset — 152 assertions      |
| build              | PASS   | working tree                      |
| E2E                | PASS   | working tree — 28 tests           |
| Docker             | PASS   | both images, health + SIGTERM     |
| secret scans       | PASS   | 0 tracked `.env*`; gitleaks in CI |

## Database State

- Local: 19 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: not yet updated with `20260919122247_approve_maternelle_3_week_2.sql`.
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

1. `git branch --show-current` is `feat/approve-maternelle-3-week-2`;
2. `git log -n 5 --oneline` — branch point is `036a782`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head feat/approve-maternelle-3-week-2` — a PR may already exist;
5. `npx supabase migration list --linked` before assuming DEV needs the migration;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
