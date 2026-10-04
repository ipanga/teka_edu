# Active Task

## Current production promotion override

STOPPED after production infrastructure failure, 2026-10-04. The navigation release is merged
but NOT live or production-validated. Documentation branch: `codex/navigation-production-checkpoint`.
Owner authorized exact develop `047de0f14e18f9bb03b589c77478d409c6da2932`; fetched unchanged.
Full main..develop delta reviewed: validated UX and related docs only. Canonical/objective,
accepted media/approval/schema/migration/workflow/environment/dependency paths identical.

PR #99 https://github.com/ipanga/teka_edu/pull/99 MERGED by guarded merge commit after all five
required checks passed in `37229831365`. Merged 2026-10-04T19:55:58Z;
remote main `ac003f8580ca81dcfb426a70c45c02102b8e0551`, tree identical to authorized develop.
Automatic production run https://github.com/ipanga/teka_edu/actions/runs/37230143801 FAILED.
All four merge-commit CI jobs passed; Promotion source appropriately skipped on push.
Normal production reviewer approval used, deployment record 6845958345; no protection bypass.
Deploy job `111518388259` failed publishing the container after successful application/image build.

Exact failure at 2026-10-04T20:02:57Z:
`writing manifest: uploading manifest ac003f8580ca to vcr.vercel.com/teka10/teka-edu/dockerfile: denied: repository has reached the maximum allowed number of images`
Vercel's generic access-denied guidance is less specific than this underlying quota error.
Classification: container-registry image-count capacity, not network timeout, SQL/content/test,
or demonstrated application regression. A blind retry cannot be assumed to resolve capacity.
Do not weaken tests/change code/SQL/migrations or delete registry images without new scope.

Failed deployment `dpl_Hjk6B3F9C9wPuT9FThxwMr7LXrfr`, ERROR/production, exact new main,
https://teka-4ysfeh8rf-teka10.vercel.app. It never became READY; production smoke was SKIPPED.
New UX production Home/class/month/October/session/P1/device acceptance is NOT RUN.
No old-release browser checks may be labelled new-release acceptance.

The canonical public URL https://teka-edu.vercel.app remains healthy on old main
`81b759ffe7ffb8d6bc44a6b3774dd81e4a4c7d05`, production, PROD ref eganrivpkjhozkkahyxy.
Retained READY live/recovery deployment `dpl_HkEkuSvjzXs5wkh6aW7GtHnxyZkL`:
https://teka-me63jfn92-teka10.vercel.app. No rollback/revert/retry was performed or needed.
No image was deleted; no account/token/registry/protection configuration was changed.

PROD preflight and final read-only migration history: 46 matched, zero pending. Workflow dry-run
19:59:57Z and normal apply 19:59:59Z both said remote up to date: zero migrations applied.
Final dry-run upToDate=true, migrations/seeds/roles empty. Local link remains DEV.
GET-only actual PROD reference comparison: all 36 canonical tables / 6,170 rows exact; no
auth/user/child/progress tables queried or manual write. Repository freeze 420 identical files,
176 September / 88 October approvals, zero review/stale/lapses, 88 fresh distinct digests,
56/56 October objectives, 15 fresh packages. Accepted media and Batch 1/P1 source preserved.
Fresh targeted units 31/31 passed including future-month, recommendation/replay and P1.
Staging run 37215383441 remains successful (96/0 failures, eight devices); no staging rerun.

Owner decision required: authorize a bounded registry capacity inventory/remediation, preserving
live and recovery image/deployment dependencies, then separately approve retrying only the
failed production job at the SAME main ac003f8. Do not delete images or retry under this task.
After authorized retry succeeds, run all production smoke/browser/eight-device/API/media checks,
then finalize healthy-release documentation through a protected develop PR. No healthy-release
documentation PR opened while release is failed. Checkpoint commits are pushed for recovery only.
STOP: no November, 2eme, P2/P3, offline/PWA, audio or unrelated polish.

## Completed staging task

Recover and complete parent-navigation staging UX validation after browser approval interruption.

## Objective / Status

`completed` at staging; awaiting separate owner production-promotion authorization.
No completed merge or deployment was repeated.

## Branch / SHAs

Documentation-only `codex/navigation-staging-checkpoint`.
Integrated develop: `047de0f14e18f9bb03b589c77478d409c6da2932`.
Reviewed PR #98 head: `069fe163fe699cafab783e358df209c7feacd0f7`.
Production main/health unchanged: `81b759ffe7ffb8d6bc44a6b3774dd81e4a4c7d05`.

## Last Checkpoint

2026-10-04 recovery: clean repo, remote refs and completed GitHub workflow reverified.
PR #97 CLOSED without merge at 16:04:00Z; historical branch retained at ceae6c1.
Its production ACTIVE_TASK archive is byte-identical; other release history remains preserved.
PR #98 squash-merged at 16:04:03Z; integrated tree equals exact green reviewed head.
Existing staging run 37215383441 SUCCEEDED. No rerun, redispatch, duplicate merge or deploy.
Fresh browser-use request succeeded, without requesting full CDP or changing protection.
Independent deployed phone journey and P1 story-state checks completed.

## Staging Deployment

- Workflow: https://github.com/ipanga/teka_edu/actions/runs/37215383441
- Deploy job: 111475309898, SUCCESS.
- ID: `dpl_6Zfr3NRw3URZ7HTzcDuSBEaaPxqw`, target preview, READY.
- Generated URL: https://teka-d3s6v9qxm-teka10.vercel.app
- Stable alias: https://teka-edu-staging.vercel.app
- Health: ok, staging, exact develop SHA, DEV ref `quyhkkizsmosybavoewd`.
- Normal workflow dry-run and apply: remote already up to date, zero migrations applied.
- Final read-only DEV history: 46 matched versions, zero unmatched/pending; October already matched.
- No new migration/schema/reference change; no manual hosted mutation.

## UX Acceptance Evidence

Fresh deployed origin started at 0/44 progress. Home -> 3eme -> September -> October -> first
October lesson -> preparation/safety -> parent -> child -> return -> next instruction -> pause
-> reload -> class resume priority -> activity-two resume -> complete -> October list -> completed
guard -> deliberate replay preparation -> October retained completion -> calendar -> other class.
No browser Back, observation submission, account/child records or hosted data write.
Only disposable browser-local progress was exercised.

October clearly discoverable: 22 dated sessions, days 23-44, selected aria-current month.
September switch: 22 sessions. Calendar: same 22 October session links, consistent status.
Sunday October 4 honestly offered Friday October 2 catch-up, not today's lesson.
Future dates clearly marked; true-today cases verified by integrated automated units.
Resume wins over catch-up, including valid activity zero in deployed suite.
Class-scoped state: 1ere remained 0/22 and no October link after 3eme completion.
P1: Kumu page 2 survived parent/child handoff and pause; next story started at page 1.
New instruction focused and visible (phone blockquote top 108px); completion focus retained.

All eight deployed full journeys/P1 tests passed in workflow, recovered rather than rerun.
Additional live DOM measurements: every home/class link first viewport, all October lists 22,
selected month correct, zero horizontal overflow at 320x740, 360x800, 390x844, 430x932,
768x1024, 1024x768, 1280x900, 1440x900. At 320px third class top 524/bottom 638.
Laptop keyboard Enter month switching passed. Phone/tablet/laptop screenshots visually inspected.
TV/Smart TV unsupported. Viewport override reset; staging October tab retained for owner review.

## Validation State

| Check                              | Result                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------ |
| exact-head PR #98 CI               | PASS four required; Promotion source appropriately skipped               |
| integrated quality/content         | PASS 520 units, formatting/lint/types/content in workflow                |
| integrated DB                      | PASS 154 pgTAP assertions, four files                                    |
| integrated build/client/Docker     | PASS both image smokes and client sentinel scan                          |
| deployed smoke                     | PASS 96, zero failures, nine production-only skips                       |
| deployed devices/P1/new navigation | PASS all eight full journeys, keyboard/unavailable cases                 |
| recovered browser parent journey   | PASS actual staging, fresh progress and full completion                  |
| targeted units/future-month        | PASS 39/39 across navigation/storage/P1; synthetic approved November     |
| content/approval/package freeze    | PASS 420 identical files, 176 September / 88 October approved            |
| October digests/coverage           | PASS zero review/stale, 88 fresh distinct, 56/56 objectives, 15 packages |
| approval dry-run                   | PASS zero lapses                                                         |
| DEV final migration history        | PASS 46 matching, none pending/applied by UX release                     |
| production health                  | PASS unchanged prior main/PROD identity, GET-only                        |

Old final October audit's UI-byte premise remains STALE for authorized navigation changes.
It was not weakened; scoped educational byte freeze plus P1 regressions are current evidence.
GET-only deployed corroboration PASS: all 22 October API payloads plus Day 45 match the local
route response exactly; Day 45 is no-content. All 81 distinct accepted media files (including
sequence frames) return HTTP 200 with exact repository bytes and accepted SHA-256 hashes.

## Evidence

- Architecture and live staging screenshots: ../ux/PARENT_NAVIGATION_ARCHITECTURE.md
- Screenshots: staging-phone-home.jpg, staging-phone-class.jpg, staging-phone-october.jpg,
  staging-tablet-october.jpg, staging-laptop-october.jpg in ../ux/evidence/.
- Preserved production checkpoint: archive/2026-10-october-production-promotion.md
- PR #97: https://github.com/ipanga/teka_edu/pull/97
- PR #98: https://github.com/ipanga/teka_edu/pull/98

## Remaining Risks / Deferred Work

Existing container-registry listing 404 prevented capacity check/prune; deploy/image publication
succeeded. Registry headroom remains unverified; no infrastructure/security change authorized.
Browser-local progress has no cross-device sync. No real-parent/child usability study claimed.
Deferred P2/P3: offline/PWA, optional audio, school-year picker, broader renderer/story-return polish.
Transient browser home navigations exceeded the short tool selector deadline; next snapshots
showed correct home, no repeat click or persistent regression. Full deployed suite had zero failures.

## Owner Decision / Exact Resume Point

UX release is healthy on staging and ready for separate production-promotion authorization.
Review actual staging and evidence, then explicitly authorize promoting exact develop 047de0f.
STOP: do not merge main, deploy/migrate PROD, start November/2eme or unrelated P2/P3.
Documentation branch is not auto-merged because that would trigger another staging deployment.
Reverify current develop/main, workflow/deployment and health before any future promotion.
