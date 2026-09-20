# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Approve 3ème maternelle Week 4 on ChatGPT's final pass, and prepare Week 5 without reviewing it.

## Objective

Week 4 is approved on digests computed from the exact text that was read, and the history still
says the week took three passes.

## Status

`in_progress`

## Branch

`feat/approve-maternelle-3-week-4`

## Base Branch

`develop` at `d7b8a01`

## Started

2026-09-20

## Last Checkpoint

2026-09-20 — Week 4 approved 20/20 through the gate, 164 approvals on 164 distinct digests,
0 lapses, full local suite green.

## Scope

- Record the final `accepted` pass and approve Week 4 through `scripts/approve-week.ts`.
- Regenerate the 11 packages, the pgTAP reference test and the data migration.
- Regenerate Week 5's package mechanically.

## Out of Scope

- Reviewing Week 5. Its package is regenerated, not read.
- Changing any Week 4 content: the week was approved as it stood.
- October, 2ème maternelle, production, `main`, anything paid.
- ISSUE-011 pruning, which is blocked on a credential and tracked separately.

## Product Decisions

- The approval gate is the only way a week may be approved. It refused Week 4 until the
  `accepted` entry existed, and that refusal is the feature.
- The six earlier Week 4 entries are left exactly as written. Four are inherited corrections and
  two are passes that asked for changes; squashing them would make the week look cleaner than it
  was.
- `scripts/approve-week.ts` now formats its own output, like the media and annual-plan
  generators. Approving a week should touch the approval, not six files' worth of whitespace.

## Completed

- [x] Seventh Week 4 history entry: `full-review` / `accepted`, 2026-09-20, ChatGPT, ai-assisted
- [x] **Week 4 approved 20/20** through `scripts/approve-week.ts`; the gate refused it first
- [x] All 20 digests computed fresh; **none carried forward**
- [x] 1ère 88 · W1 16 · W2 20 · W3 20 · W4 20 · W5 0 · **164 of 176**, 12 remaining
- [x] **164 distinct digests, 0 lapses, 0 recompute mismatches**
- [x] Re-running the approval is refused — it will not re-stamp an approved week
- [x] `approve-week.ts` formats its own output; the week-state test follows the real state
- [x] Week 5's package regenerated mechanically, **not reviewed**

## In Progress

- [ ] PR into `develop`, CI, squash-merge, staging verification

## Remaining

- [ ] ISSUE-011: the registry prune still cannot authenticate in CI. Needs a dedicated
      `VERCEL_VCR_TOKEN` in the `staging` environment — **the owner's action**.
- [ ] Hand `docs/review/2026-2027-maternelle-3-semaine-5.md` to ChatGPT for its first pass.
      **The owner's action, not a step this repository can take.**

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

- Local: 25 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: not yet updated with `20260920134804_approve_maternelle_3_week_4.sql`.
- PROD: untouched.

## Deployment State

- Staging: at `d7b8a01`; not yet redeployed with the approval.
- Container registry: ~39 of 50. The automatic prune is **inert** — it warns and never blocks,
  because the deploy token cannot read the registry endpoint.
- Production: disabled; `main` at `1b95480`.

## Git State

- `feat/approve-maternelle-3-week-4`, branched from `develop` at `d7b8a01`.

## Blockers

None for the content. ISSUE-011 is blocked on a credential the owner must create.

## User Decisions Needed

**One, unchanged.** Create a Vercel access token scoped to the TEKA team and store it as the
`VERCEL_VCR_TOKEN` secret in the GitHub `staging` environment, so the registry prune stops being
inert. Cost $0. Creating a token is an owner action (CLAUDE.md).

## Exact Resume Point

Commit, open the PR into `develop`, wait for CI, squash-merge, verify staging.

## Resume Verification

1. `git branch --show-current` is `feat/approve-maternelle-3-week-4`;
2. `git log -n 5 --oneline` — branch point is `d7b8a01`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head feat/approve-maternelle-3-week-4` — a PR may already exist;
5. `npx supabase migration list --linked` before assuming DEV needs the migration;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
