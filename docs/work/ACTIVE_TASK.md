# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Apply ChatGPT's first-pass corrections to 3ème maternelle Week 5 and return it for a final pass.

## Objective

Every Week 5 objective is proved by the task the child actually performs, and nothing the review
accepted is disturbed.

## Status

`in_progress`

## Branch

`fix/maternelle-3-week-5-first-review`

## Base Branch

`develop` at `5ff352b`

## Started

2026-09-20

## Last Checkpoint

2026-09-20 — 8 Week 5 corrections (20 of 3,084 fields), 8 reusable rules each proved against the
pre-correction content, 164 approvals untouched, full local suite green.

## Scope

- The eight corrections ChatGPT asked for, and every other occurrence the new rules force.
- The shared material-label defect, fixed in the data rather than in four generated documents.
- Regeneration: 11 review packages, the change audit, pgTAP reference test, data migration.

## Out of Scope

- Approving Week 5. All 12 stay `review`.
- Anything the review accepted: the read-aloud-for-pleasure design, the English-scaffold policy,
  pause and early-stop behaviour, durations, screen-time policy, small-object safety notes.
- ISSUE-011, which is a separate infrastructure blocker.
- October, 2ème maternelle, production, `main`, anything paid.

## Product Decisions

- Where an objective sat on the wrong sibling, the objective moved. Where the task genuinely did
  not do the work — rhyme, the day cards, the movement chain — the task changed instead.
- « Deux tas pour faire dix » claims only the decomposition. The counting that confirms each pile
  is the adult's check, not the child's task, so it under-claims rather than over-claims.
- The « À défaut » label belongs to the renderer and the content to the data. Fixing the data
  changed four approved weeks' _packages_ and no approved _lesson_: the digest covers material
  codes, not their prose.
- Two rules were widened, not the content narrowed, when they fired on approved lessons that do
  the work without the obvious words.

## Completed

- [x] Week 5's **first actual full review** recorded; its three inherited entries left as
      `consequence`, not relabelled as readings
- [x] 8 corrections — six objective mappings, the rhyme that had to become a rhyme, the day
      cards that must not test reading, the movement chain, the contradicted choice, the label
- [x] **8 reusable rules**, each proved against the pre-correction content, each naming exactly
      the activity the review flagged
- [x] **20 of 3,084 fields changed**, all Week 5, 2 child-facing; 1ère maternelle byte-identical
      across 2,552 fields; **164 approvals, 0 lapsed, 0 mismatches**

## In Progress

- [ ] PR into `develop`, CI, squash-merge, staging verification

## Remaining

- [ ] Hand the regenerated `docs/review/2026-2027-maternelle-3-semaine-5.md` back to ChatGPT for
      its final pass. **The owner's action, not a step this repository can take.**
- [ ] ISSUE-011: prune the registry by hand before it reaches 50, and ask Vercel whether the
      registry API accepts an access token. **The owner's action.**

## Validation State

| Check              | Result | At                                |
| ------------------ | ------ | --------------------------------- |
| format             | PASS   | working tree                      |
| lint               | PASS   | working tree                      |
| typecheck          | PASS   | working tree                      |
| unit tests         | PASS   | working tree — 355 tests          |
| content validation | PASS   | working tree — 31 files           |
| database tests     | PASS   | fresh reset — 152 assertions      |
| build              | PASS   | working tree                      |
| E2E                | PASS   | working tree — 28 tests           |
| Docker             | PASS   | both images, health + SIGTERM     |
| secret scans       | PASS   | 0 tracked `.env*`; gitleaks in CI |

## Database State

- Local: 26 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: not yet updated with `20260920200532_week5_review_corrections.sql`.
- PROD: untouched.

## Deployment State

- Staging: at `5ff352b`; not yet redeployed with these corrections.
- Container registry: **44 of 50**, unreadable from CI, pruned only by hand (ISSUE-011).
- Production: disabled; `main` at `1b95480`.

## Git State

- `fix/maternelle-3-week-5-first-review`, branched from `develop` at `5ff352b`.

## Blockers

None for the content. ISSUE-011 remains blocked on platform access and is tracked separately.

## User Decisions Needed

1. **Week 5 goes back to ChatGPT** for its final pass. If it passes, September closes for both
   levels and the Beta 0.1 pedagogy gate reaches 10 of 10.
2. **Prune the registry by hand** before it reaches 50, and ask Vercel whether
   `/v1/vcr/repository/*` accepts an access token (ISSUE-011).

## Exact Resume Point

Commit, open the PR into `develop`, wait for CI, squash-merge, verify staging.

## Resume Verification

1. `git branch --show-current`;
2. `git log -n 5 --oneline`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head fix/maternelle-3-week-5-first-review` — a PR may already exist;
5. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
