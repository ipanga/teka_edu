# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Approve 3ème maternelle Week 5, close the September pedagogy gate, and clear the registry
near-cap first.

## Objective

September is approved in full on digests computed from the exact text that was read, and the
registry has room again before another image is pushed.

## Status

`in_progress`

## Branch

`feat/approve-maternelle-3-week-5`

## Base Branch

`develop` at `dd1d2fe`

## Started

2026-09-20

## Last Checkpoint

2026-09-20 — registry 45 → 35 by hand; Week 5 approved 12/12 through the gate; September
176/176 on 176 distinct digests, 0 lapses; full local suite green.

## Scope

- Clear the registry near-cap before creating another deployment image.
- Record the final `accepted` pass and approve Week 5 through `scripts/approve-week.ts`.
- Regenerate the 11 packages, the pgTAP reference test and the data migration.

## Out of Scope

- October and 2ème maternelle. September closing does not start them.
- Production: still unconfigured, still undeployed, deliberately.
- Creating another Vercel token, or arming `REGISTRY_PRUNE_ENABLED` while CI cannot read the
  registry.

## Product Decisions

- The prune used the repository's tested policy to **choose** and the CLI to **delete**. The
  choice is the dangerous half, and it should not be improvised just because the deletion has
  to be manual.
- The approval gate remains the only way a week may be approved. It refused Week 5 until the
  final entry existed.
- Two state tests were restated rather than relaxed. « every unapproved lesson has no review
  record » was guarded by « there is at least one », and September leaves none — so it is now
  stated in both directions, which holds on real data today and revives when October is
  authored.

## Completed

- [x] Registry **45 → 35** by hand: the 10 oldest, 6–8 days old; live staging image and the 20
      newest protected, and the live image verified present afterwards
- [x] All 19 corrected Week 5 items re-verified in canonical content before approving
- [x] Fifth Week 5 history entry: `full-review` / `accepted`, 2026-09-20, ChatGPT, ai-assisted
- [x] **Week 5 approved 12/12**; the gate refused it first; all 12 digests computed fresh
- [x] **September complete: 176/176 approved, 176 distinct digests, 0 lapses, 0 mismatches**
- [x] **10 of 10 weekly packages accepted**; 0 lessons left in `review`

## In Progress

- [ ] PR into `develop`, CI, squash-merge, staging verification

## Remaining

- [ ] The remaining Beta 0.1 gates are all production configuration — none pedagogical.
      See `docs/releases/BETA_0_1_READINESS.md` section 5. **Owner decisions.**
- [ ] ISSUE-011 stays open: CI still cannot read the registry.

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

- Local: 27 migrations; `db reset` + 152 pgTAP assertions pass.
- DEV: not yet updated with `20260920204404_approve_maternelle_3_week_5.sql`.
- PROD: untouched.

## Deployment State

- Staging: at `dd1d2fe`; not yet redeployed with the approval.
- Container registry: **35 of 50** after the manual prune.
- Production: disabled; `main` at `1b95480`.

## Git State

- `feat/approve-maternelle-3-week-5`, branched from `develop` at `dd1d2fe`.

## Blockers

None for the content. ISSUE-011 remains blocked on platform access and is tracked separately.

## User Decisions Needed

**The next gate is yours, and it is no longer pedagogical.** Everything remaining in
`docs/releases/BETA_0_1_READINESS.md` section 5 is production configuration: the production
Vercel token, the production environment variables, the public URL, the Deployment Protection
model, migrating PROD, loading content into PROD, and rehearsing the rollback. None of it is
started, and none of it should be until you decide to open production.

## Exact Resume Point

Commit, open the PR into `develop`, wait for CI, squash-merge, verify staging.

## Resume Verification

1. `git branch --show-current` is `feat/approve-maternelle-3-week-5`;
2. `git log -n 5 --oneline` — branch point is `dd1d2fe`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head feat/approve-maternelle-3-week-5` — a PR may already exist;
5. `npx supabase migration list --linked` before assuming DEV needs the migration;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
