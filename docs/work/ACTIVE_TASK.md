# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Apply ChatGPT's second-pass corrections to 3ème maternelle Week 4, and stop the container
registry from filling up again (ISSUE-011).

## Objective

Every Week 4 objective is proved by the task the child actually performs, and a full registry
can no longer block `develop`.

## Status

`in_progress`

## Branch

`fix/maternelle-3-week-4-second-review`

## Base Branch

`develop` at `e60eaa3`

## Started

2026-09-20

## Last Checkpoint

2026-09-20 — 4 corrections + 1 safety refinement (35 of 3,084 fields), 6 reusable rules each
proved against the pre-correction content, the registry prune automated and rehearsed against
the real registry, 0 approvals lapsed.

## Scope

- The four second-pass corrections, the cloth-in-the-path safety refinement, and every other
  occurrence the new rules force.
- ISSUE-011: why the ~40 threshold never fired, and the smallest preventive fix.
- Regeneration: 11 review packages, the change audit, pgTAP reference test, data migration.

## Out of Scope

- Approving Week 4, or any 3ème lesson. All 32 remaining stay `review`.
- Reading Week 5. Its one change is forced by a rule, not by a review.
- October, 2ème maternelle, production, `main`, anything paid.

## Product Decisions

- `TIME-SPACE-S01-C02-O08` stays in its plan window because day 16 introduces it honestly; the
  story lesson stops borrowing it. September now shows it once, which the coverage report says
  plainly rather than hides.
- The running activity was rewritten rather than remapped down two age bands. Under-claiming to
  `before-4` would have been honest and pointless on a consolidation day about duration.
- The registry policy is a pure function with its own tests, because a deletion cannot be
  rehearsed against a real registry without deleting something.
- The live commit comes from `/api/health`, not from a Vercel deployment field: a project with
  no Git connection never fills that field in.

## Completed

- [x] Week 4's **second full review** recorded; the first pass and the four inherited
      `consequence` entries left exactly as they were
- [x] 4 corrections — story chronology, the run that had to become a run, the two number-strip
      mappings, the walk that had to put a balance at stake
- [x] The optional cloth in the stepping path replaced by a chalk, taped or pointed-out line
- [x] **6 reusable rules**, each proved against the pre-correction content, each naming exactly
      the activity the review had flagged
- [x] **One occurrence in Week 5** (`m3-math-21-a1`), corrected as a consequence and recorded
      as one; Week 5 still unread
- [x] **ISSUE-011 prevented**, not just recovered: prune before the push, thresholds in code,
      14 unit tests, both refusal paths exercised against the real registry in `--dry-run`
- [x] **35 of 3,084 fields changed**; 144 approved lessons, **0 lapsed**, 0 digest mismatches

## In Progress

- [ ] PR into `develop`, CI, squash-merge, staging verification

## Remaining

- [ ] Hand the regenerated `docs/review/2026-2027-maternelle-3-semaine-4.md` back to ChatGPT for
      its final confirmation pass. **This is the owner's action, not a step this repository can
      take.**

## Validation State

| Check              | Result | At                                |
| ------------------ | ------ | --------------------------------- |
| format             | PASS   | working tree                      |
| lint               | PASS   | working tree                      |
| typecheck          | PASS   | working tree                      |
| unit tests         | PASS   | working tree — 342 tests          |
| content validation | PASS   | working tree — 31 files           |
| database tests     | PASS   | fresh reset — 152 assertions      |
| build              | PASS   | working tree                      |
| E2E                | PASS   | working tree — 28 tests           |
| Docker             | PASS   | both images, health + SIGTERM     |
| secret scans       | PASS   | 0 tracked `.env*`; gitleaks in CI |

## Database State

- Local: 24 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: not yet updated with `20260920083109_week4_second_review_corrections.sql`.
- PROD: untouched.

## Deployment State

- Staging: at `e60eaa3`; not yet redeployed with these corrections.
- Container registry: 37 of 50 images. The next deploy prunes by itself above 40.
- Production: disabled; `main` at `1b95480`.

## Git State

- `fix/maternelle-3-week-4-second-review`, branched from `develop` at `e60eaa3`.

## Blockers

None.

## User Decisions Needed

None outstanding. Week 4 goes back to ChatGPT for its final pass; Week 5 still needs its first.

## Exact Resume Point

Commit, open the PR into `develop`, wait for CI, squash-merge, verify staging.

## Resume Verification

1. `git branch --show-current` is `fix/maternelle-3-week-4-second-review`;
2. `git log -n 5 --oneline` — branch point is `e60eaa3`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head fix/maternelle-3-week-4-second-review` — a PR may already exist;
5. `npx supabase migration list --linked` before assuming DEV needs the migration;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
