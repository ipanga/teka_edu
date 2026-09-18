# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Apply ChatGPT's second-pass corrections to 3ème maternelle Week 2, and close the ISSUE-026 approval
integrity gap before any further approval.

## Objective

An approval covers the words the child hears, and every approval standing today is proven to be
bound to the content its reviewer actually read.

## Status

`in_progress`

## Branch

`fix/week2-second-review-and-text-digest`

## Base Branch

`develop` at `7fa2159`

## Started

2026-09-16

## Last Checkpoint

2026-09-18 — 4 mapping corrections, ISSUE-026 closed, 31 approvals lapsed and all 31 restored on
proven identity, full local suite green.

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

- [x] Four mapping corrections; nothing moved to preserve a count. Removing the date objective
      left a lesson claiming what nothing worked, so it left the lesson list too
- [x] **ISSUE-026 closed**: the digest covers the kind, title and lines of every story a lesson
      reads, and fails closed when a text cannot be resolved
- [x] Proved against the old implementation — the old digest did not move when a story was
      rewritten; the new one does
- [x] **31 of 104 approvals lapsed** (exactly those that read a text); **all 31 restored**
- [x] `scripts/restamp-digests.ts` re-stamps only on proven identity against the approval commit,
      and was tested by rewriting a story and confirming it refuses
- [x] **104 of 104 proven identical**, 0 held back, 0 requiring re-review
- [x] Two rules made reusable (date objective both ways, shape naming); the conversation
      objective stays a targeted test because no predicate separated it honestly
- [x] Supabase PROD pause documented as expected behaviour — no upgrade, no keep-alive job

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
| unit tests         | PASS   | working tree — 305 tests          |
| content validation | PASS   | working tree — 31 files           |
| database tests     | PASS   | fresh reset — 152 assertions      |
| build              | PASS   | working tree                      |
| E2E                | PASS   | working tree — 28 tests           |
| Docker             | PASS   | both images, health + SIGTERM     |
| secret scans       | PASS   | 0 tracked `.env*`; gitleaks in CI |

## Database State

- Local: 17 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: not yet updated with `20260918173226_week2_second_review_and_text_digest.sql`.
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

1. `git branch --show-current` is `fix/week2-second-review-and-text-digest`;
2. `git log -n 5 --oneline` — branch point is `7fa2159`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head fix/week2-second-review-and-text-digest` — a PR may already exist;
5. `npx supabase migration list --linked` before assuming DEV needs the migration;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
