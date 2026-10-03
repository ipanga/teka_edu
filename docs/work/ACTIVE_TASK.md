# Active Task

## Task

Complete owner-authorized October DEV/staging integration and stop before production.

## Objective

Merge reviewed PR #95 into develop, observe the normal DEV/staging workflow, verify hosted
reference data and deployed smoke, preserve October/September/P1, and record the production gate.

## Status

`blocked`

## Branch

`codex/october-integration-checkpoint`

## Base Branch

Integrated develop `ae07c243d4c1dd8ce710edf8d9c93e8582649448`.
Reviewed PR head `f059cb18daa4579c1db2f659260cd5bf3baf516f`; accepted correction checkpoint
`1f573c508b30ddd0ade57d7a8cd8329d5eb901ce`.
Reviewed baseline `61b2e07`; accepted Batch 1 `2170413`, corrected Batch 1 `461e946`,
authoring base `1ada5f2` and merged P1 develop `603efdc` remain ancestors.

## Started

2026-10-03

## Last Checkpoint

Owner explicitly authorized merge with normal automatic DEV migration and staging workflow.
Pre-merge checks passed immediately: open, exact expected head, develop target, CLEAN/mergeable,
nine expected commits, four required checks green. PR #95 merged 2026-10-03T20:57:24Z;
remote develop verified at ae07c243d4c1dd8ce710edf8d9c93e8582649448.
Before merge, actual read-only DEV listing matched all prior migrations; only 20261003195954
was pending. No manual DEV mutation. Staging run 37153385137 FAILED before hosted writes:
public.ecr.aws/supabase/pg_prove:3.36 pull timed out three times. Local reset succeeded;
pgTAP assertions did not execute. Deploy job skipped. Final DEV listing remains unchanged.
Integrated tree exactly equals reviewed head; final audit/media report pass again.

## Scope

Authorized PR #95 merge, normal DEV migration/staging workflow, validation and three checkpoint
files. No accepted pedagogy, media, schema or runtime edits.

## Out of Scope

Manual DEV mutation outside the established workflow, main merge, PROD migration/deployment,
new media generation, November, P2/P3, 2ème maternelle and TV/Smart TV support.

## Product Decisions

Canonical rotation gives 22 LANG / 22 MATH / 22 PHYS / 7 ART / 6 WORLD / 9 TIME-SPACE.
Do not revert to obsolete 7/7/8 planning totals. Phone, tablet and laptop/MacBook only.
AI-assisted pedagogical review, not teacher certification; ISSUE-017 remains future assurance.

## Completed

Ten owner-relayed history records appended (modifications and accepted verdicts per Week 6–10).
88 new approvals through approve-week, after dry runs, without --lapsed-only or manual JSON stamps.
Fresh independent digests, regenerated Weeks 6–10 and inventory, final audit and generated
reference migration. Local reset, reference-data idempotence, RLS/pgTAP and current full technical
validation pass. Historical review evidence and accepted media/P1 remain unchanged.

## In Progress

None. Staging run 37153385137 completed with failure; no automatic retry.

## Remaining

After owner-directed infrastructure retry, observe workflow listing/apply, deployment and smoke;
verify actual DEV reference rows. Production authorization remains blocked on staging health.

## Validation State

The table below is the preserved final-content local validation evidence, not a claim that staging
passed. Integrated tree equals reviewed head; audit/coverage/media/lapse were recomputed.
Integrated CI: quality/504 units PASS, build/client/E2E 87 PASS (nine production-public SKIP),
Docker images/smoke PASS; database FAIL before pgTAP because the runner image pull timed out.
Local migration/reset succeeded. PR-head 154 pgTAP PASS remains historical, not integrated-run
success. Hosted reference validation and deployed smoke NOT RUN because deploy was skipped.

| Check              | State                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| format             | PASS scoped formatting and full format check                                                                      |
| lint               | PASS zero warnings                                                                                                |
| typecheck          | PASS                                                                                                              |
| unit tests         | PASS 504/504 across 38 files; targeted approval/mapping tests passed                                              |
| content validation | PASS 31 registered JSON files                                                                                     |
| database tests     | PASS fresh local reset, reference-data mirror/idempotence and 154 pgTAP assertions across four files              |
| build              | PASS sentinel production Webpack build; Docker Turbopack build also PASS                                          |
| E2E                | PASS 87 local Chromium tests; nine production-public tests skipped without a configured production URL            |
| Docker             | PASS portable and Vercel images built locally; both health/SIGTERM smoke checks pass                              |
| secret scans       | PASS 28 client files, three server-only sentinel values absent                                                    |
| programme          | PASS days 23–44 complete at 35 minutes; Day 30 authored; Day 45 no-content                                        |
| coverage           | PASS 56/56 objectives due through Day 44, zero missing                                                            |
| media              | PASS 59/59 required for authored m3 corpus; zero gaps, 56 useful-only nonblocking ideas unchanged                 |
| package freshness  | PASS all 15 exact; ten September packages unchanged; five final hashes in OCTOBER_FINAL_AUDIT.md                  |
| approvals          | PASS 88 approved/zero review, 88 distinct valid digests; 264 total distinct; lapse dry run zero                   |
| integrity          | PASS 176 September objects/digests, accepted October pedagogy, prior history and 290 protected files/P1 unchanged |

Full browser suite includes eight exact supported phone/tablet/laptop sizes and P1 journeys.
Local verification server stopped and Docker smoke containers cleaned up. The existing local
Supabase database remains local; no hosted command was used. No remote production smoke claimed.

Initial pgTAP failed because a September-only 88-count assertion counted all m3 months. Scoped it
to the five original September themes without reducing the expected 88, adding two explicit
October loaded/approved checks (152 became 154). Full rerun passes.
Initial lapse dry run incorrectly flagged m3-lang-24: raw accepted text has a pre-existing trailing
space, while approval hashes schema-normalized canonical text. Lapse now uses the same schema
normalization; accepted raw text/digest unchanged. Added a non-mutating regression; zero lapses.
Resolved-date daily plans are not used for canonical digest checks.
No suppressions, relaxed running assertions, media generation or pedagogical edits.

## Database State

Generated `20261003195954_october_maternelle_3_approved.sql` via generate-reference-sql,
exact payload verified against referenceSyncSql and test mirror against referenceTestSql.
36 canonical/reference tables only; no schema/auth/user/child/progress mutation.
Before merge: DEV linked ref quyhkkizsmosybavoewd, all prior migrations matched, only expected
20261003195954 pending. Final read-only listing confirms identical history and October still
pending. Hosted workflow listing/dry-run/apply NOT RUN: deploy job skipped after CI failure.
No manual writes, schema changes or auth/user/child/progress mutation performed. PROD untouched.

## Deployment State

PR #95 merged; staging run 37153385137 FAILED at integrated develop ae07c243.
Deploy job SKIPPED; no new Vercel deployment ID/preview URL/alias or deployed smoke.
Latest GitHub staging deployment record remains 6823484316 at previous develop 603efdc,
created 2026-10-03T04:57:35Z. Prior successful staging run 37098065260 is not October evidence.
Main remains ac3ebf9b9bd00662def3e7ec206aff1954f4694d; no production action performed.

## Git State

Documentation branch codex/october-integration-checkpoint starts at integrated develop ae07c243.
Only these three checkpoint files may change. Do not push to develop or trigger another deployment.

## Blockers

Infrastructure failure: public.ecr.aws/v2 and token/manifest endpoints timed out while pulling
supabase/pg_prove:3.36, after CLI retries at 4s and 8s. No failing SQL assertion or migration error.
Do not change content, migration, tests or workflow without evidence of a reproducible code defect.

## User Decisions Needed

Whether to retry failed jobs of staging run 37153385137 after registry connectivity recovers.
Separate production-promotion authorization only after DEV/staging is fully verified.

## Exact Resume Point

STOP at diagnosed infrastructure failure. Recommended next action: owner-directed retry of failed
jobs on run 37153385137 without code changes, preserving successful checks and exact SHA.
Before retry verify live run/develop and DEV listing. Then verify database assertions, workflow
listing/dry-run/apply, actual deployment target/health/smoke and read-only hosted canonical rows.
Do not dispatch another develop push, manually apply DEV, promote production or begin later work.

## Resume Verification

Run git status, git log and git branch --show-current. Verify remote develop and merged PR #95.
Run node --import tsx scripts/check-october-final.ts and lapse-approvals.ts --dry-run=true.
The old check-october-frozen.ts and check-october-phys-corrections.ts are historical pre-approval
guards preserved unchanged: they intentionally require review/null and old history/packages,
so do not run them against final approved state or weaken them to bypass approval differences.
The final audit strictly permits only October status/review changes relative to accepted 1f573c5.
