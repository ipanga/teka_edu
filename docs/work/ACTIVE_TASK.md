# Active Task

## Task

Integrate completed September rich-media work into develop

## Objective

Resolve the duplicate-history conflicts between PR #86 on `develop` and the completed
`codex/september-rich-media-pilot` branch, merge the validated integration PR into `develop`,
and perform controlled staging validation.

## Status

`staging_unhealthy`

## Branch

`develop`

## Base Branch

Base branch `origin/develop` at `5c8752876231bf3831173f64e996fb942104e06b`.
Accepted September reference branch `origin/codex/september-rich-media-pilot` at
`b4ca67cc8449ba4b5dae0ad7fd057591de2f833e`.

## Started

2026-10-01

## Last Checkpoint

PR #88 was squash-merged into `develop` after live reverification that the PR head was unchanged at
`de045acd068c271730986b6e2c74cce3f0f70671`, the PR was clean/mergeable, and required CI was green.
GitHub reports merge commit `5249dadfcea596a49bbe058f674ef61e27462d87`, merged at
2026-10-01T21:07:31Z. `origin/develop` was fetched and verified at the same SHA.

Recomputed final audit on the integration branch:
176/176 approved, zero review, 176 distinct valid digests, zero stale/unexpected lapses,
20/20 candidates integrated and independently accepted, 78 tracked runtime media files.

Final September database reconciliation is append-only:
`20261001192741_media_asset_webp_paths.sql` permits repository-local `.webp` media paths, and
generated migration `20261001192742_final_september_rich_media_reference.sql` reconciles final
September reference data from `content/`. A fresh local Supabase reset and pgTAP run passed.

Post-merge deploy-staging run `36926521934` rerun reached the staging workflow. Supabase DEV
`supabase db push --yes` finished successfully. Vercel deployment
`dpl_3mdGtH5GPsSCMYBgwaFZEbRLTaHE` deployed commit `5249dadfcea596a49bbe058f674ef61e27462d87` to
`https://teka-aptb19rjm-teka10.vercel.app`, verified target `preview` and state `READY`, and aliased
`teka-edu-staging.vercel.app`. Final deployed smoke is unhealthy: 65 passed, nine skipped, one
failure in `tests/e2e/rich-media-pilot.spec.ts` because one image's `naturalWidth` stayed `0` before
the 30 s test timeout. The broader rollout rich-media test passed on staging.

## Scope

Conflict resolution, integration validation, final reference-data migration, comparison with both
parents, integration branch push, PR creation, merge into `develop`, and controlled staging
validation.

## Out of Scope

Production deployment, production database mutation, `develop` to `main`, October, 2eme maternelle,
offline implementation, additional curriculum and unrelated features.

## Product Decisions

Mixed SVG/WebP architecture (ADR-049); canonical text governs illustrations.
Separate independent acceptance precedes fresh-digest, lapsed-only restoration (ADR-048/052).
Phone/tablet/laptop-MacBook only; TV/Smart TV unsupported (ADR-050).

## Completed

- Created the integration branch from `origin/develop`.
- Inspected PR #86 and the September reconfirmation migration.
- Merged the accepted feature branch and resolved conflicts without changing accepted media bytes.
- Removed one auto-merge duplicate registry row for `forme-maison-composee`.
- Recomputed the final rich-media audit successfully on the integration branch.
- Opened and merged PR #88: https://github.com/ipanga/teka_edu/pull/88.
- Added forward media path compatibility migration for `.webp` assets.
- Generated final September reference-data reconciliation migration from `content/`.
- Replayed local Supabase migrations from scratch and ran pgTAP successfully.
- Applied the two final migrations to Supabase DEV through the normal staging workflow.
- Deployed the staging preview and verified Vercel did not create a production deployment.

## In Progress

Staging is deployed but unhealthy because the deployed smoke suite fails one rich-media pilot image
load assertion. No production operation has been performed.

## Remaining

Investigate and fix or harden `tests/e2e/rich-media-pilot.spec.ts` for deployed staging. Do not
promote to `main` while staging smoke is unhealthy. Do not apply migrations to hosted PROD.

## Validation State

Results below apply to the controlled integration branch.

| Check              | Result | At                                                                      |
| ------------------ | ------ | ----------------------------------------------------------------------- |
| format             | PASS   | full repository Prettier check                                          |
| lint               | PASS   | final acceptance and QA generator                                       |
| typecheck          | PASS   | final acceptance and QA generator                                       |
| unit tests         | PASS   | 439/439; initial documentation syntax failure fixed                     |
| content validation | PASS   | 31 files                                                                |
| database tests     | PASS   | local db reset + pgTAP 152/152; CI Supabase job green                   |
| build              | PASS   | production Next build; no deployment                                    |
| E2E                | MIXED  | local pilot passed; PR CI green; staging smoke 65 pass/1 fail/9 skipped |
| Docker             | PASS   | CI portable + Vercel images                                             |
| secret scans       | PASS   | 14 client files; three fake server sentinels absent                     |
| independent review | PASS   | separate session accepted; owner relayed, no correction                 |
| final media audit  | PASS   | 176 approvals; 20 accepted; 78 tracked files; unchanged173              |

## Database State

No hosted operations. `supabase/migrations/20260926173653_september_reconfirmation.sql` is already
present from PR #86 and remains unchanged. The final PR #88 forward migrations are:

- `supabase/migrations/20261001192741_media_asset_webp_paths.sql`: schema compatibility for
  repository-local `.webp` media files.
- `supabase/migrations/20261001192742_final_september_rich_media_reference.sql`: generated,
  idempotent final September reference-data reconciliation from `content/`.

Local `npm run db:reset` replayed all migrations from scratch and local `npm run db:test` passed
152 pgTAP assertions. Supabase DEV migration apply finished successfully in run `36926521934`.
Production database unchanged.

## Deployment State

Staging deployment exists and is not production:

- Run: `36926521934`.
- Deployment: `dpl_3mdGtH5GPsSCMYBgwaFZEbRLTaHE`.
- Preview URL: `https://teka-aptb19rjm-teka10.vercel.app`.
- Stable alias: `teka-edu-staging.vercel.app`.
- Target/state: `preview` / `READY`.
- Final status: unhealthy because deployed smoke failed one rich-media pilot image load assertion.

Production unchanged.

## Git State

`develop` is at `5249dadfcea596a49bbe058f674ef61e27462d87` on `origin/develop`.
The accepted feature branch history was not rewritten.

## Blockers

Staging smoke failed after deployment. The failing check is
`tests/e2e/rich-media-pilot.spec.ts`; the deployed run reports `naturalWidth` remained `0` for one
pilot image before timeout. The same spec passed locally in 14.7 s, and staging's broader
rich-media rollout test passed.

## User Decisions Needed

Owner decision required before any production promotion. Engineering next action is to diagnose the
deployed smoke failure on staging.

## Exact Resume Point

Start from `develop` at `5249dadfcea596a49bbe058f674ef61e27462d87`. Investigate staging smoke
failure for `tests/e2e/rich-media-pilot.spec.ts` against
`https://teka-aptb19rjm-teka10.vercel.app` / `teka-edu-staging.vercel.app`; keep production
unchanged.

## Resume Verification

Verify git status/log/remote; rerun `node --import tsx scripts/final-rich-media-audit.mjs`,
`npm run review:lapse -- --dry-run=true`, and the standard validation suite.
