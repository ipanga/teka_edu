# Active Task

## Task

September Visual Experience Review — GPT Astra

## Objective

Independently audit all September child-facing activities in 1ère and 3ème maternelle;
improve justified visual defects, validate on staging, and return independent review material.
Preserve approved pedagogy and media approval integrity. Production is out of scope.

## Status

`in_progress`

## Branch

`codex/september-astra-visual-review`

## Base Branch

Started on clean `develop` at `a0b743b997f1effc5f83981e0f32f19514c10251`.
Remote develop verified at the same SHA on 2026-09-24; remote main `28dcb0a732436908e2442525fd3fdb8201e5ae9b`.

## Started

2026-09-24

## Last Checkpoint

2026-09-24 — Baseline inventory and first independent asset audit written. No runtime/content/media changes.
Previous completed checkpoint retained in `archive/2026-09-september-visual-release.md`.

## Scope

176 September lessons, 302 activities, 49 registered images; all responsive parent/child states.
Complete audit before broad illustration edits. Counts freshly validated. Asset decisions: KEEP 23, REFINE 10, REDRAW 16, REMOVE 0,
REPLACE-WITH-REAL-OBJECT 0. These are audit recommendations, not replacement acceptances.

## Out of Scope

Pedagogical text, objectives, dates, duration, progression, October, 2ème maternelle,
production release, approval stamping, synthetic audio, paid services.

## Product Decisions

User authorizes a new independent visual review and staging improvements, never self-approval.
Keep existing illustration freeze/history intact as baseline evidence.

## Completed

- Read task attachment, stable project rules, release record and resumable protocol.
- Verified clean baseline and remote branches; created dedicated branch.
- Content validation PASS at baseline; 176 current approvals, 302 activities, 49 images.
- Audited all 49 images; wrote `docs/review/media/SEPTEMBER_ASTRA_VISUAL_AUDIT.md`,
  `astra-asset-decisions.json`, six readable sheets and canonical inventory.
- Wrote `docs/VISUAL_DESIGN_SYSTEM.md`; isolated movement and generic renderer correctness
  issues without modifying approved content. Implementation batches remain planned.

## In Progress

Six-viewport production capture running with resumable per-day markers under
`test-results/astra-baseline/screens`. Source review covers 302 instructions; six asset sheets
cover 49 pictures. Full interactive-state visual inspection remains pending.

## Remaining

- Complete 49 asset and 302 activity audit; inspect actual rendered states at six sizes.
- Define visual specification and evidence-based implementation batches.
- Implement, inspect before/after, honestly lapse only affected approvals and prepare packages.
- All required validation; feature PR/CI; staging evaluation; final independent review handoff.
- UI findings, accepted assets and detailed batch states will link to the new audit.

## Validation State

| Check                                                           | Result  | At       |
| --------------------------------------------------------------- | ------- | -------- |
| format/lint/types/unit/content/media/digests/history/curriculum | NOT RUN | new task |
| pgTAP/RLS/build/responsive/reduced-motion                       | NOT RUN | new task |
| Docker portable/Vercel/smoke/client and repository secrets      | NOT RUN | new task |

Prior release checks are historical evidence only, not validation of this task.
Baseline reported approvals 88/88 + 88/88; intentional lapses 0; unexpected lapses 0;
fresh digest verification pending. Weekly packages 10/10 per release record.

## Database State

No database operations. Release record says local/DEV/PROD migration 42.

## Deployment State

DEV and staging unchanged by this task. Production release record: `28dcb0a`,
https://teka-edu.vercel.app. Live health independently verified: production `28dcb0a`, status ok.
Never change PRODUCTION_DEPLOY_ENABLED or dispatch production.

## Git State

Feature branch based on current remote develop. First audit checkpoint ready to commit/push.

## Blockers

None established. Network reads require sandbox escalation; remote Git read succeeded.

## User Decisions Needed

None at this stage.

## Exact Resume Point

Continue `node scripts/astra-render-audit.mjs` (resumes existing day markers). Inspect
representative screenshots and remaining interaction states. Complete audit before broad changes;
then start body/character draft briefs and responsive UI batch.

## Resume Verification

```sh
git status --short --branch
git log -5 --oneline
cat docs/work/ACTIVE_TASK.md
npm run content:validate
npm run media:report
```
