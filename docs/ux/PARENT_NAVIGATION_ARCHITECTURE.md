# Parent navigation architecture

Date: 2026-10-04. Scope: navigation, presentation and browser-local state only.
Base: develop `ae07c243d4c1dd8ce710edf8d9c93e8582649448`.
Production audit: `https://teka-edu.vercel.app`, main `81b759f`.

## Live audit before changes

Fresh-parent journey actually followed: home, 3eme class, only browsing link, September
calendar, preparation, first activity, child handoff, next activity, pause, reload, resume,
completion, calendar and reopening the completed session. No observation was submitted;
progress was disposable browser-local convenience state, not hosted data.
Read-only Chromium screenshots/DOM measurements cover all eight supported sizes.

| Priority     | Demonstrated finding                                                                     | Response                                                     |
| ------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| P1           | October has no discoverable list; class explicitly links September only                  | Data-derived months and lesson list                          |
| P1           | Calendar says 44 sessions under September but lists only 22                              | Counts scoped to selected month                              |
| P1           | Completed lesson reopens as new; restart outranks resume                                 | Completion guard, explicit replay, primary valid resume      |
| P1           | No month context or month return from preparation/activity/end                           | Shared parent breadcrumbs and month-preserving returns       |
| P2, required | Phone home class selection buried under beta text/tall cards                             | Compact class rows first, optional beta details below        |
| P2, required | Narrow calendar wraps dates/status and includes non-teaching dates in discovery          | Primary lesson list; same browser calendar as secondary view |
| P2, required | Identical start labels open preparation and start activities; early stop sounds complete | Outcome-specific labels; pause/stop remain unfinished        |
| P3           | Tall child stories can require scrolling to return                                       | Deferred; existing full-screen/modal separation retained     |

No demonstrated P0. At 320x740 production home: first class top 468px, third class top
1152px; class browse link top 824px. September calendar is approximately 2936px tall.
No horizontal overflow before changes; missing navigation is not missing curriculum.
Live October catch-up date was honestly Friday October 2 on Sunday October 4.

## Model and routes

Home -> Class -> Month -> Lessons -> Session. Resume, today and catch-up bypass browsing.
`/maternelle/<level>` is the class overview, named by actual education data.
`/maternelle/<level>/lecons?mois=YYYY-MM` is the primary monthly session list.
`/maternelle/<level>/calendrier?mois=YYYY-MM` is the same month browser with non-teaching dates.
Both views share month links, status and counts. Existing calendar URLs still work.
Unknown, duplicated or unavailable month parameters return 404, never fabricated sessions.
Without a parameter: current available month, nearest preceding available month, then first.
Session URLs stay `/maternelle/<level>/seance/<instructional-day>`; bookmarks do not change.
Parent breadcrumbs always expose home, class and the session's actual month. Completion and
observation preserve that month; browser Back is unnecessary.

## Month derivation

`sessionCatalogue(levelId, schoolYearId, data)` finds the matching calendar/programme,
generates school days and daily plans, and includes only complete plans with every lesson
approved. Civil dates group those sessions by `YYYY-MM`; Intl supplies French month labels.
Months and sessions sort chronologically, and totals are derived, not authored in UI code.
Client components receive only compact session summaries, not the canonical content database.
This release still uses the existing active school-year configuration `SCHOOL_YEAR_ID` and
maternelle route slug map. The derivation itself accepts any registered year/level.
Adding an approved future month to registered content exposes it automatically. Synthetic
November programme-extension regression verifies discovery without editing navigation.
Incomplete/draft/review plans remain unavailable. Do not invent future availability dates.

## State and recommendations

Storage remains browser-only, version 2, keyed by school year, level, instructional day and
field. No account, child record or server write. Same-tab writes, storage events and focus
refresh navigation. Reads/writes fail safely in restricted browsers.
Recommendation order: most recently visited valid unfinished bookmark (including activity
zero), unfinished authored today, latest unfinished past session, earliest future session.
Old bookmarks have no visit timestamp; ties choose the latest date deterministically.
Completed sessions never become an unfinished recommendation merely by reopening them.
All completed means browse/replay, not an invented next lesson. Today is only an exact date
match in Africa/Lubumbashi; weekend/missing-content explanations remain visible.
Statuses distinguish completed/in-progress/today/catch-up/upcoming. Valid resume opens
preparation with resume as primary and restart secondary. Completion requires deliberate
replay before start; opening replay preparation alone preserves completion.
Activity/page/game state remains session-owned and keyed by activity id. Reload restores
position, not detailed transient game state, as before. Pausing or stopping never completes.
New activity and pause/finish headings receive immediate keyboard focus/scroll; no smooth motion.

## Responsive and accessible behavior

Phone first: compact class rows, short class action, wrapping underlined month links,
single-column lesson list with date/status on separate lines when needed. No horizontal
carousel hides months. Tablet/laptop use comfortable bounded widths, not an admin dashboard.
Selected month is `aria-current=page`; month links work with keyboard Enter and real URLs.
Parent navigation and major controls have at least 44px targets. Existing French media alts,
reduced-motion styles, inert parent chrome during child mode and activity focus are retained.
Supported exactly: 320x740, 360x800, 390x844, 430x932, 768x1024, 1024x768, 1280x900, 1440x900.
TV/Smart TV unsupported.

## Integrity and documentation reconciliation

PR #97 remains open on `codex/october-integration-checkpoint` at `ceae6c1`.
Quality/build/Docker passed; CI 37183531836 DB job failed pulling storage-api:v1.72.1
from ECR (rate exceeded), before assertions. This task neither retries nor merges #97.
The UX branch was created directly from origin/develop, then retained #97's verified three
documentation files before adding this newer task checkpoint. The original remote branch and
PR are untouched. The UX PR is a documentation superset; owner must reconcile/close #97 or
merge/rebase it deliberately before integration, avoiding two competing active checkpoints.
Production evidence remains in PROJECT_STATUS and CODEX_CONTINUATION, never silently discarded.

`check-navigation-integrity.ts` proves complete file-inventory/byte equality for content,
accepted media, review evidence, reference-data code, domain and Supabase files against exact
integrated baseline. It recomputes approval/digest/objective/package invariants read-only.
The old final October audit is not weakened: its UI byte freeze passes before this task,
but is intentionally stale for authorized UX changes. The scoped freeze plus P1 behavioral
regressions replaces its UI-byte premise, not its educational assertions.

## Remaining work and boundary

Deferred P2: cross-device progress synchronization, offline/PWA, optional recorded audio,
multi-school-year selection. Deferred P3: broader renderer polish and tall-story return placement.
No canonical lesson/media/review change, schema/migration change, hosted DB operation,
staging/production deployment or curriculum expansion. Stop after pushed focused develop PR;
owner reviews UX and resolves #97 documentation overlap before authorizing integration.

## Validation and evidence

Final local validation: formatting/lint/typecheck PASS; 520/520 unit tests in 39 files;
31 content JSON files valid; zero approval lapses; 420 protected files identical, aggregate
`1937cce2157e1f6a52b7ba785331efcc780a1f8a764a2f485f00b08b2884bc45`.
88 October approved/zero review/zero stale/88 fresh distinct digests; all 176 September
approved objects and Batch 1 unchanged. Days 23-44 complete; 45 absent; 56/56 objectives,
59/59 required media, 15/15 exact packages. No required rich media pending.
Webpack production build PASS; 28 client files scanned, all three CI server sentinels absent.
Full local production-build Chromium suite: 96 passed, zero failed, nine public-production
tests appropriately skipped on localhost. Includes eight new full fresh-parent journeys,
eight P1 journeys and all existing September/October media/layout checks.

Initial draft CI 37213308072: quality, DB (154 pgTAP assertions) and Docker passed;
build/E2E failed only because an older viewport loop expected a fresh start on its second
visit to the same unfinished activity-zero session. It now explicitly chooses restart for
that layout test. Full local suite rerun passes; no assertion removed or timeout increased.
Final PR checks must be inspected at the final head, not inferred from this older run.

Manual after journey used a fresh `localhost:3001` origin (zero initial progress) at 390x844:
home -> 3eme -> October -> September -> October -> preparation/safety -> parent -> child ->
next -> pause -> reload -> primary activity-two resume -> completion -> October list ->
completed-session guard. No browser Back, account, report submission or hosted write.
Keyboard month activation and unavailable parameter handling also pass.

At 320x740, class links now start at 252px/524px (previously 468px/1152px); both fully fit
the first viewport. Class primary action starts at 336px, month links at 594px, and all-lessons
link at 655px (previous September-only link 824px). Navigation targets measured 44-48px,
primary 52px. No horizontal overflow at any of the eight supported sizes.

| Device           | Before home/class/calendar                                                                                                          | After home/class/October                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Phone 390x844    | [Home](evidence/before-phone-home.png), [class](evidence/before-phone-class.png), [calendar](evidence/before-phone-calendar.png)    | [Home](evidence/after-phone-home.png), [class](evidence/after-phone-class.png), [October](evidence/after-phone-october.png)    |
| Tablet 768x1024  | [Home](evidence/before-tablet-home.png), [class](evidence/before-tablet-class.png), [calendar](evidence/before-tablet-calendar.png) | [Home](evidence/after-tablet-home.png), [class](evidence/after-tablet-class.png), [October](evidence/after-tablet-october.png) |
| MacBook 1440x900 | [Home](evidence/before-laptop-home.png), [class](evidence/before-laptop-class.png), [calendar](evidence/before-laptop-calendar.png) | [Home](evidence/after-laptop-home.png), [class](evidence/after-laptop-class.png), [October](evidence/after-laptop-october.png) |

All-size preparation/handoff/completion screenshots are also produced by the committed
Playwright test in ignored local `test-results/`. Evidence was inspected visually.
Review PR [#98](https://github.com/ipanga/teka_edu/pull/98); do not merge or deploy.

## Deployed staging acceptance - 2026-10-04

The implementation review boundary above is historical. Owner authorized integration:
PR #97 closed without merge (production archive byte-identical), PR #98 squash-merged at
2026-10-04T16:04:03Z into develop 047de0f14e18f9bb03b589c77478d409c6da2932.
Staging run [37215383441](https://github.com/ipanga/teka_edu/actions/runs/37215383441) succeeded:
all four merge-commit CI jobs, 520 units, 154 pgTAP, both Docker image smokes; deployed full suite
96 passed, zero failed, nine production-only skipped. All eight new navigation and P1 journeys
passed. DEV listing/dry-run/apply were already up to date; no migration applied, 46 matched versions.

Actual READY preview dpl_6Zfr3NRw3URZ7HTzcDuSBEaaPxqw:
https://teka-d3s6v9qxm-teka10.vercel.app, alias https://teka-edu-staging.vercel.app.
Health matches exact integrated SHA, staging and DEV ref quyhkkizsmosybavoewd.
Recovery after stuck browser approval used a fresh ordinary browser request, no CDP/protection change,
duplicate merge or deployment. Independent clean-origin phone journey completed through October
preparation/child/next/pause/reload/class-resume/completion/month return/completed guard/replay.
September and October have 22 links each; calendar agrees. Sunday catch-up is honest, resume wins,
other class stays 0/22. Kumu page 2 survives handoff/pause; next story starts at 1. Keyboard month
switching works. Home and October list measured at all eight sizes: zero overflow; third phone
class fully visible even at 320x740 (top 524px, bottom 638px). Viewport override reset.

| Phone home                                    | Phone class                                    | Phone October                                    | Tablet October                                    | Laptop October                                    |
| --------------------------------------------- | ---------------------------------------------- | ------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------- |
| [Screenshot](evidence/staging-phone-home.jpg) | [Screenshot](evidence/staging-phone-class.jpg) | [Screenshot](evidence/staging-phone-october.jpg) | [Screenshot](evidence/staging-tablet-october.jpg) | [Screenshot](evidence/staging-laptop-october.jpg) |

420-file educational freeze, all 15 packages, zero lapses and targeted navigation/storage/P1 units
39/39 pass again. Production main and GET health stay 81b759f; no PROD mutation.
GET-only comparison: all 22 October API payloads plus Day 45 match repository route output;
all 81 distinct accepted media files (including sequence frames) are HTTP 200 and byte/hash exact.
Existing registry listing 404 still prevents headroom check/prune, although deploy succeeded.
No real-parent/child study claimed. STOP: ready for separate owner production-promotion authorization,
not authorized to promote, expand curriculum or implement deferred P2/P3.
