# Active Task

## Task

Controlled parent-navigation integration and deployed staging validation.

## Objective

Retire superseded documentation PR #97, merge exact validated PR #98, exercise the actual
staging Home -> Class -> Month -> Lessons -> Session journey, then STOP before production.

## Status

`in_progress`

## Branch / Base

Documentation-only `codex/navigation-staging-checkpoint` from integrated develop
`047de0f14e18f9bb03b589c77478d409c6da2932`.
Production main remains `81b759ffe7ffb8d6bc44a6b3774dd81e4a4c7d05`.

## Last Checkpoint

2026-10-04: owner authorized closing #97, merging #98 and normal staging workflow.
#97 is CLOSED without merge; branch retained. Its ACTIVE_TASK archive is byte-identical and
other durable historical release information retained. #98 exact head 069fe163fe699cafab783e358df209c7feacd0f7
passed all four required checks in 37214014418 (154 pgTAP), remained CLEAN/mergeable, and
squash-merged at 2026-10-04T16:04:03Z. Integrated tree equals reviewed head.
Read-only DEV preflight: 46 local/remote matched versions, zero pending.
Staging workflow 37215383441 is running exact merge-commit CI; deployed UX validation pending.

## Completed

- Independently verified both PRs, exact commits, clean branch, CI and authoritative refs.
- Compared all three PR #97 durable files; preserved completed production evidence.
- Reviewed final UX diff: data-driven months, synthetic future-month coverage, P1 preservation.
- Scoped freeze passed again: 420 files unchanged, September 176 / October 88 approved,
  zero review/stale, 88 distinct October digests, 56/56 objectives, all 15 packages fresh.
- Closed #97 without merge/deletion and protected squash-merged #98.

## In Progress / Remaining

Observe 37215383441. Check hosted migration listing/dry-run before any unexpected apply.
Preflight is already zero-pending and migration inventory is identical to prior staging.
After normal deploy, verify exact SHA/environment/DEV identity, URLs/READY, deployed full smoke,
all eight supported devices and a clean-state manual parent journey.
Update durable checkpoint with actual results, commit/push documentation branch, stop for owner.

## Validation State

| Check                           | Result                                                              |
| ------------------------------- | ------------------------------------------------------------------- |
| exact-head PR CI                | PASS all four required; Promotion source appropriately skipped      |
| content/navigation integrity    | PASS 420 protected files identical; zero stale; 15 fresh packages   |
| preflight DEV migrations        | PASS 46 matching versions, zero pending, read-only                  |
| merge-commit CI                 | RUNNING in 37215383441                                              |
| staging deployment              | PENDING                                                             |
| deployed parent/P1/device smoke | PENDING                                                             |
| synthetic future month          | Prior 16 navigation unit cases passed; rerun on integration pending |
| production                      | Unchanged / NOT authorized                                          |

Implementation proof remains in docs/ux/PARENT_NAVIGATION_ARCHITECTURE.md: 520 unit tests,
96 browser passes / zero failures / nine production-only skips, all eight viewports.
Old final October audit's UI-byte premise is STALE for authorized UX; not weakened.
Scoped educational byte freeze and P1 behavioral regressions are the current appropriate proof.

## Database / Deployment

No new migration, schema, canonical reference-data change or manual DEV write.
Normal staging workflow may run `db push --yes`, expected no-op after 46 matched versions.
STOP on unexpected pending migration. Never run hosted apply manually.
Production remains validated October release at main 81b759f; no PROD operation authorized.

## Evidence / History

- PR #97: https://github.com/ipanga/teka_edu/pull/97
- PR #98: https://github.com/ipanga/teka_edu/pull/98
- Staging run: https://github.com/ipanga/teka_edu/actions/runs/37215383441
- Preserved completed production checkpoint: archive/2026-10-october-production-promotion.md
- Architecture / before-after: ../ux/PARENT_NAVIGATION_ARCHITECTURE.md

## Decisions / Stop Boundary

Staging validation only. No main merge, production deployment/migration, November, 2eme,
offline/PWA/audio, unrelated P2/P3 or curriculum change.
If staging is healthy, owner separately authorizes production promotion.
A reproduced genuine UX regression requires a focused follow-up fix PR, never weakened tests.

## Exact Resume Point

Read this checkpoint and actual remote run state before any operation. Observe existing
37215383441, never dispatch a duplicate deployment. Verify origin/develop 047de0f and main
81b759f. Finish deployed validation and record results; STOP before production.
