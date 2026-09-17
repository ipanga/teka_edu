# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Apply ChatGPT's confirmation-pass corrections to 3ème maternelle September Week 1: movement-space
safety, and the review-state semantics of the cross-week document.

## Objective

No activity asks a five-year-old to move furniture, and no generated document offers an approval
nobody performed.

## Status

`in_progress`

## Branch

`fix/maternelle-3-week-1-safety-and-review-state`

## Base Branch

`develop` at `f2c018f`

## Started

2026-09-16

## Last Checkpoint

2026-09-17 — safety normalisation applied and audited across September, the change-audit
generator made state-aware, twelve new regression tests, full local suite green.

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

- [x] `m3-phys-01-a1` and `m3-phys-02-a1` — the adult moves the furniture; the child carries a
      cushion, a pagne or a toy. The activity itself is unchanged
- [x] September audited for the pattern: those two were the only occurrences, both in Week 1
- [x] Four further matches inspected and deliberately left (adult-installed course, adult-laid
      cloths, pebble marker, counting chairs)
- [x] `scope` (`full-review` | `consequence`) added to every review-history entry, so "has this
      week been read?" is data rather than a guess at the `reviewer` string
- [x] `weekReviewState` in `domain/lessons/review.ts`: approved / reviewed / never-reviewed / draft
- [x] The change-audit document says only what the state supports, and is named for what it is
- [x] The misleading `…-semaines-1-5-reconfirmation.md` removed, not left beside its replacement
- [x] Empty-diff bug fixed: the generator used to write « semaines-undefined-undefined »
- [x] 12 new tests — four states, the consequence-vs-review distinction, the canonical state of
      both levels, the audit's wording, and two movement-safety content rules
- [x] Both safety tests proved to fail against the old wording before being kept

## In Progress

- [ ] PR into `develop`, CI, squash-merge, staging verification

## Remaining

- [ ] Return the regenerated Week 1 package and the change audit for ChatGPT's final confirmation

## Validation State

| Check              | Result | At                                |
| ------------------ | ------ | --------------------------------- |
| format             | PASS   | working tree                      |
| lint               | PASS   | working tree                      |
| typecheck          | PASS   | working tree                      |
| unit tests         | PASS   | working tree — 272 tests          |
| content validation | PASS   | working tree — 31 files           |
| database tests     | PASS   | fresh reset — 152 assertions      |
| build              | PASS   | working tree                      |
| E2E                | PASS   | working tree — 28 tests           |
| Docker             | PASS   | both images, health + SIGTERM     |
| secret scans       | PASS   | 0 tracked `.env*`; gitleaks in CI |

## Database State

- Local: 14 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: not yet updated with `20260917132516_week1_safety_and_review_scope.sql`.
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

1. `git branch --show-current` is `fix/maternelle-3-week-1-safety-and-review-state`;
2. `git log -n 5 --oneline` — branch point is `f2c018f`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head fix/maternelle-3-week-1-safety-and-review-state` — a PR may already exist;
5. `npx supabase migration list --linked` before assuming DEV needs the migration;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
