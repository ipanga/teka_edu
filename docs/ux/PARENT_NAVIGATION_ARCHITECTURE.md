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

In progress. See ACTIVE_TASK for fresh results and final screenshot links.
