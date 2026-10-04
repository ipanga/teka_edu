# Active Task

## Task

Controlled production promotion of exact validated October release; stop when healthy.

## Objective

Promote exact develop ae07c243 through PR #96 and protected production workflow; verify PROD
reference data, deployment, non-destructive smoke and supported devices; then stop.

## Status

`awaiting_ci`

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

2026-10-04: owner explicitly authorized controlled production promotion with gates. All remotes
fetched, clean tree, develop unchanged ae07c243, main ac3ebf9. Main->develop diff reviewed:
91 files, validated P1 #94/October #95/prior release docs only. Required production secret names
verified; main allows merge-commit PR only, five required checks, production reviewer gate.
Actual read-only PROD history: all prior versions match, only 20261003195954 pending.
Recovery: READY dpl_A43iQuRrzzJLRm2PdCf9CWmdedz5, alias https://teka-edu.vercel.app,
generated https://teka-dzw8t0mwf-teka10.vercel.app, healthy exact main and PROD ref eganrivpkjhozkkahyxy.
Application rollback available; no database backup/PITR verified, reference-only forward-fix policy.
PR #96 open at exact source; CI 37182500231 pending, Promotion source PASS. No mutation yet.
Staging health still validated SHA/DEV; final audit/lapse rerun PASS. Prior phase evidence follows.

Owner authorized failed-job retry only, with no application/SQL/test/workflow changes.
Remote develop remains exact ae07c243d4c1dd8ce710edf8d9c93e8582649448; previous failure
reconfirmed as registry timeout before assertions. Pre-retry DEV listing unchanged, only
20261003195954 pending. gh run rerun 37153385137 --failed started attempt 2 at the same SHA;
database job 111297974423 and deploy job 111298348789. Attempt 2 SUCCEEDED: database pgTAP,
normal DEV listing/dry-run/apply, preview deployment and deployed smoke all passed.
Final read-only DEV listing matches all versions, including October; none pending.
GET-only hosted comparison matches every canonical row/column: 36 tables and 6,170 rows.
Alias health reports staging, exact integrated SHA and DEV ref. Three October SVGs byte-identical.
No code/migration/test/workflow changes or manual DEV mutation. Stop for separate production
authorization. The initial failed attempt evidence below is historical, not current status.

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

Authorized exact October production PR/merge, normal protected PROD workflow, read-only PROD
reference validation, non-destructive browser/media/device checks and protected checkpoint docs PR.

## Out of Scope

Manual PROD table edits, unexpected migrations, new feature/content/media/UX/schema changes,
November, P2/P3, 2ème maternelle, offline/PWA, audio, refactoring and TV/Smart TV support.

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

PR #96 CI run 37182500231. Production unchanged until all required checks pass and guarded merge.

## Remaining

Complete authorized production gates, deployment and actual safe verification; stop on failure.

## Validation State

The table below is the preserved final-content local validation evidence, not a claim that staging
passed. Integrated tree equals reviewed head; audit/coverage/media/lapse were recomputed.
Integrated CI: quality/504 units PASS, build/client/E2E 87 PASS (nine production-public SKIP),
Docker images/smoke PASS. Attempt 1 database image pull FAIL; attempt 2 database pgTAP PASS:
pg_prove:3.36 downloaded successfully, four files / 154 assertions, Result: PASS.
Attempt 2 hosted migration/deployment/smoke PASS: 87 deployed tests, zero failures, nine
production-public skips. Hosted reference comparison PASS (36/36 tables,
6,170 rows), stable alias health PASS, all three October growth SVG deployed bytes PASS.
Eight supported phone/tablet/laptop-MacBook sizes and P1 journeys are covered by the deployed
full E2E suite. No production smoke claimed. Local checkpoint format/structure checks rerun.

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
20261003195954 pending. Attempt 2 workflow dry-run logged exactly this migration and no other;
normal apply finished successfully at 2026-10-03T21:36:02Z.
Final linked DEV listing: all prior versions unchanged, October matched, zero pending.
Independent GET-only comparison against referenceTables(getReferenceData()): 36/36 canonical
tables and 6,170 rows exactly equal, including lessons, approvals/digests, activities/media and
objectives. No manual writes. Generated migration remains reference-only; no schema or
auth/user/child/progress mutation in its SQL. PROD untouched.

## Deployment State

PR #95 merged; staging run 37153385137 attempt 2 SUCCEEDED at integrated develop ae07c243.
Database job 111297974423; deploy job 111298348789. GitHub staging deployment record 6833399953.
Vercel deployment dpl_6N4jG4aCeaJxqfRSFVK4ceAZ8QDv, target preview, READY.
Preview https://teka-1y4i9trp9-teka10.vercel.app; stable alias https://teka-edu-staging.vercel.app.
Normal deployed Smoke tests step PASS (87 passed / nine production-only skipped, 3.9 minutes).
Independent vercel curl alias health: status ok,
environment staging, commit ae07c243d4c1dd8ce710edf8d9c93e8582649448, DEV quyhkkizsmosybavoewd.
Accepted plante-graine/plante-pousse/plante-jeune SVGs fetched via alias match repository bytes.
Main remains ac3ebf9b9bd00662def3e7ec206aff1954f4694d; no production action performed.

## Git State

Documentation branch codex/october-integration-checkpoint starts at integrated develop ae07c243.
Only these three checkpoint files may change. Do not push to develop or trigger another deployment.

## Blockers

No blocking October integration failure. Previous pg_prove image timeout resolved on retry.
Nonblocking registry warning: dedicated VERCEL_VCR_TOKEN image-list request returned 404;
capacity could not be checked, no pruning occurred. Deployment succeeded; monitor headroom.

## User Decisions Needed

Production promotion authorized subject to gates; no later content/UX work authorized.

## Exact Resume Point

Read live PR #96 checks/run 37182500231; verify source still exact ae07c243 and base/main state.
If all five required checks green, merge normally with exact head guard. Record new main and run;
follow production environment approval/preflight and actual migration listing/dry-run. Expected
only 20261003195954; stop on discrepancy. No manual PROD writes or blind retry. Verify all 36
canonical tables GET-only, deployment, health, smoke/public entry and supported devices; document
results through normal protected docs PR. Once October healthy in production, STOP.

## Resume Verification

Run git status, git log and git branch --show-current. Verify remote develop and merged PR #95.
Run node --import tsx scripts/check-october-final.ts and lapse-approvals.ts --dry-run=true.
The old check-october-frozen.ts and check-october-phys-corrections.ts are historical pre-approval
guards preserved unchanged: they intentionally require review/null and old history/packages,
so do not run them against final approved state or weaken them to bypass approval differences.
The final audit strictly permits only October status/review changes relative to accepted 1f573c5.
