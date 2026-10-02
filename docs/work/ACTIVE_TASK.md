# Active Task

## Task

Plan October 2026 — 3ème maternelle

## Objective

Close the September production milestone at the planning level and establish the next
owner-authorized implementation plan for October 2026, 3ème maternelle, from the actual repository
state. Do not implement October lessons, generate October rich media, create migrations, merge or
deploy until the owner authorizes a follow-up implementation task.

## Status

`planning-complete`

## Branch

`codex/record-september-production-promotion`

## Base Branch

Authoritative implementation base for future October work: `origin/develop` at `6b8ba9e`.
Production remains `origin/main` at `ac3ebf9b9bd00662def3e7ec206aff1954f4694d`.

## Started

2026-10-02

## Last Checkpoint

October planning is captured in `docs/work/OCTOBER_3EME_PLAN.md`. Key result: October 2026 covers
instructional days 23-44, exactly 22 teaching days and 88 expected lessons for 3ème maternelle.
The current architecture supports October with canonical content and later generated reference-data
migration; no schema change is currently indicated.

Stop boundary remains active: do not generate the October lesson set, create rich illustrations,
mutate September canonical content/media/approvals, create database migrations, deploy, merge,
start 2ème maternelle, offline support or recorded audio without owner authorization.

## Previous September Production Checkpoint

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

PR #89 fixed the remaining staging smoke issue by splitting the rich-media pilot smoke into
independent supported-device viewport tests and by checking the expected image HTTP response,
browser decode and `naturalWidth` directly. PR #89 CI passed and was squash-merged into `develop`
as `1c5c5aad9c6e9871d7cab83813cfbe34bc057bc7`. Controlled staging workflow run `37046853410` was
manually dispatched on `develop`, confirmed Supabase DEV was already up to date, deployed Vercel
preview `dpl_9YzWw1XsgwhSDT5VeyTppsqe38RG` for commit
`1c5c5aad9c6e9871d7cab83813cfbe34bc057bc7` to
`https://teka-4urqhl8pb-teka10.vercel.app`, verified target `preview` and state `READY`, aliased
`teka-edu-staging.vercel.app`, and passed final deployed smoke: 71 passed, nine skipped, zero
failed. Production code and production data remain unchanged.

PR #90 recorded the healthy staging state in durable docs and was squash-merged into `develop` as
`c325c65e765984e5f8223b08e2ee00e99b4c6ecc`. Final pre-production functional validation was run
from a clean local `develop` aligned to that remote SHA after discarding the superseded local-only
docs commit `8823d05aac03c7f20ee17c072945aeaaebdf422e`, whose content was already represented by
PR #90. Push-triggered staging run `37048748582` deployed
`dpl_FwfCxXHYtNJrRV6H5G1CjZpegYaz` to `https://teka-6g69qd3wb-teka10.vercel.app`, aliased
`teka-edu-staging.vercel.app`, verified target `preview`, app environment `staging`, expected Git
SHA `c325c65e765984e5f8223b08e2ee00e99b4c6ecc`, and Supabase DEV through the protected workflow,
then passed deployed smoke: 71 passed, nine production-only checks skipped, zero failed.

The real-user functional sample covered parent entry and completion, pause/resume persistence,
child-screen transitions and return controls, rich story sequences, shared rhyme primary frames,
counting/numeracy handoff, language/vocabulary, matching/recognition, tracing/art-adjacent word-card
interaction, retained SVG usage and accepted WebP usage. Representative lesson IDs validated by the
staging browser suite were `m3-lang-01`, `m3-lang-02`, `m3-lang-03`, `m3-lang-05`, `m3-lang-06`,
`m3-math-10`, `m3-world-02`, `m1-lang-02`, `m1-lang-03`, `m1-lang-06`, `m1-lang-11` and
`m1-lang-18`. Supported device coverage remained phone, tablet and laptop/MacBook only; TV and
Smart TV were not tested or treated as supported. No functional defects were found and no accepted
educational content, approval history or media bytes were changed.

Production promotion was explicitly authorized after final staging validation. PR #92
(`develop` -> `main`) was opened from authorized `develop` SHA
`57deea9d807605b81af0131c1e11109554261c93`, passed all five required PR checks, and merged with a
merge commit as `ac3ebf9b9bd00662def3e7ec206aff1954f4694d` at 2026-10-02T19:34:29Z. Production
workflow run `37055002824` completed successfully for that SHA after the GitHub `production`
environment gate was approved. The workflow verified Vercel project `teka-edu` and Supabase project
`teka-edu-prod` (`ACTIVE_HEALTHY`), dry-ran then applied exactly
`20261001192741_media_asset_webp_paths.sql` and
`20261001192742_final_september_rich_media_reference.sql` to Supabase PROD, deployed
`dpl_A43iQuRrzzJLRm2PdCf9CWmdedz5` to `https://teka-dzw8t0mwf-teka10.vercel.app`, verified target
`production`, and aliased `https://teka-edu.vercel.app`. Exact-deployment smoke passed 71 checks
and skipped nine production-public checks. Public alias smoke passed 9/9 with
`PRODUCTION_PUBLIC_URL=https://teka-edu.vercel.app npm run test:e2e:public`.

## Scope

Conflict resolution, integration validation, final reference-data migration, comparison with both
parents, integration branch push, PR creation, merge into `develop`, controlled staging validation,
and protected production promotion.

## Out of Scope

October, 2eme maternelle, offline implementation, additional curriculum and unrelated features.

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
- Fixed and merged PR #89 for the remaining rich-media pilot staging smoke timeout.
- Merged PR #90 with durable healthy-staging documentation.
- Deployed the final staging preview and verified Vercel did not create a production deployment.
- Completed final pre-production functional validation of staging.
- Promoted the validated September release to production through PR #92 and workflow run
  `37055002824`.
- Applied the two final September migrations to Supabase PROD through the established production
  workflow.
- Verified the production deployment and public canonical alias.

## In Progress

None. The authorized integration, smoke fix, PR merge, staging validation and production promotion
are complete.

## Remaining

None for the September production promotion. Future curriculum expansion still requires fresh owner
authorization.

## Validation State

Results below apply to the controlled integration branch.

| Check              | Result | At                                                          |
| ------------------ | ------ | ----------------------------------------------------------- |
| format             | PASS   | full repository Prettier check                              |
| lint               | PASS   | final acceptance and QA generator                           |
| typecheck          | PASS   | final acceptance and QA generator                           |
| unit tests         | PASS   | 439/439; initial documentation syntax failure fixed         |
| content validation | PASS   | 31 files                                                    |
| database tests     | PASS   | local db reset + pgTAP 152/152; CI Supabase job green       |
| build              | PASS   | production Next build and Vercel production deploy          |
| E2E                | PASS   | production smoke 71 pass/0 fail/9 skipped; public smoke 9/9 |
| Docker             | PASS   | CI portable + Vercel images                                 |
| secret scans       | PASS   | 14 client files; three fake server sentinels absent         |
| independent review | PASS   | separate session accepted; owner relayed, no correction     |
| final media audit  | PASS   | 176 approvals; 20 accepted; 78 tracked files; unchanged173  |

## Database State

No hosted operations. `supabase/migrations/20260926173653_september_reconfirmation.sql` is already
present from PR #86 and remains unchanged. The final PR #88 forward migrations are:

- `supabase/migrations/20261001192741_media_asset_webp_paths.sql`: schema compatibility for
  repository-local `.webp` media files.
- `supabase/migrations/20261001192742_final_september_rich_media_reference.sql`: generated,
  idempotent final September reference-data reconciliation from `content/`.

Local `npm run db:reset` replayed all migrations from scratch and local `npm run db:test` passed
152 pgTAP assertions. Supabase DEV migration apply finished successfully in run `36926521934`; runs
`37046853410` and `37048748582` confirmed the remote DEV database was already up to date. Supabase
PROD applied both final September migrations through production workflow run `37055002824`. No auth,
user, child or progress table mutation was performed; the migration review and schema evidence
classify the changes as canonical reference/schema data only.

## Deployment State

Staging deployment exists and is not production:

- Run: `37048748582`.
- Deployment: `dpl_FwfCxXHYtNJrRV6H5G1CjZpegYaz`.
- Preview URL: `https://teka-6g69qd3wb-teka10.vercel.app`.
- Stable alias: `teka-edu-staging.vercel.app`.
- Target/state: `preview` / `READY`.
- Final status: healthy; deployed smoke passed 71 checks, skipped nine production-only checks, and
  failed zero checks.

Production is healthy:

- Run: `37055002824`.
- Deployment: `dpl_A43iQuRrzzJLRm2PdCf9CWmdedz5`.
- Production URL: `https://teka-dzw8t0mwf-teka10.vercel.app`.
- Public alias: `https://teka-edu.vercel.app`.
- Git SHA: `ac3ebf9b9bd00662def3e7ec206aff1954f4694d`.
- Target/state: `production` / healthy workflow result.
- Smoke: 71 passed, zero failed, nine public-production checks skipped on exact deployment; 9/9
  public canonical checks passed on the alias.

## Git State

`origin/main` is at production merge commit `ac3ebf9b9bd00662def3e7ec206aff1954f4694d`.
`origin/develop` remains at validated release commit `57deea9d807605b81af0131c1e11109554261c93`
before this documentation follow-up. The accepted feature branch history was not rewritten.

## Blockers

None.

## User Decisions Needed

None for this task.

## Exact Resume Point

Start from `main` at `ac3ebf9b9bd00662def3e7ec206aff1954f4694d` for production evidence, or from
the docs branch `codex/record-september-production-promotion` for this documentation follow-up.
Production is healthy at `https://teka-edu.vercel.app`. Stop unless the owner authorizes a new
post-September task.

## Resume Verification

Verify git status/log/remote; rerun `node --import tsx scripts/final-rich-media-audit.mjs`,
`npm run review:lapse -- --dry-run=true`, and the standard validation suite.
