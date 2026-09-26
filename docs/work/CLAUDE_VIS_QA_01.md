# VIS-QA-01 — Prepare remaining September visual evidence

## GOAL

Prepare a readable, resumable local review index from existing September screenshots. Do not repeat completed captures or mark images reviewed.

## CURRENT STATE

Base implementation is `4a062ee` on `codex/september-astra-visual-review`. All 49 registered images, 302 initial phone and 302 initial TV screens, and 1,002 noninitial phone/TV viewports have been inspected. The latest scroll capture contains 1,606 states and 1,042 additional scroll images; only the six named in `astra-interaction-scroll-evidence.json` were visually inspected. Four other viewport sets and parent layouts remain pending. Astra judges visual quality; you prepare evidence.

## FILES / AREA

Read `CLAUDE.md`, `PROJECT_STATUS.md`, `DECISIONS.md`, `docs/work/ACTIVE_TASK.md` first. Work only in `scripts/astra-*`, new local evidence under ignored `private/astra-visual-evidence/`, and relevant `docs/work/` / `docs/review/media/` checkpoint files. Inspect existing sheet scripts and manifests before adding machinery.

## CONSTRAINTS

Follow repository and approval rules. Preserve all `.env*` restrictions; never read or expose credentials. Never weaken tests or bypass pedagogical approval/media fingerprints. No production, staging, push, PR, Git commit, dependency installation, billing changes, or cloud actions. No lesson/media/runtime edits. One implementation worker only. Use normal permissions; do not bypass permission checks. Do not claim visual acceptance based on automation. Preserve existing evidence and reviewed flags. No inference API spending beyond the supervisor-approved authentication/budget.

## ACCEPTANCE CRITERIA

1. Create readable local sheets/indexes for remaining scroll frames with source filenames, activity/state, viewport, and scroll offsets; keep phone panels at least 320px wide and explicitly show that these are separate scroll positions.
2. Provide a manifest preserving the six previously reviewed scroll frames and default every other frame to unreviewed. Clearly distinguish capture coverage from manual review.
3. Identify and prepare existing large-phone/tablet-portrait/tablet-landscape/desktop initial screenshots for review using their actual source dimensions; no fresh browser captures if existing evidence suffices. Label source revision/staleness honestly.
4. Summarize parent-mode evidence gaps without inventing coverage.
5. Update the durable checkpoint with exact files/counts and next review entry. Keep overall status IN_PROGRESS.

## TESTS REQUIRED

Check source/output existence, manifest completeness and duplicate entries; verify sheet generation succeeds if browser permission is available. Run formatting/lint only for changed source. No app test reruns for evidence-only changes. If blocked by tool/permission failure, save partial progress and report the exact failure; do not improvise a bypass.

## WHAT NOT TO TOUCH

Content, media registry, approval records/history/digests, assets, application components, environment/config files, deployment settings, October, 2ème maternelle. Do not remove previous outputs.

## STOP CONDITIONS

Stop after evidence preparation and checkpoint, or at a permission/cost/credential issue. Visual acceptance belongs to Astra and pedagogical reconfirmation remains independent.

## REPORT FORMAT

Return compact sections: Summary; Files changed; Why; Tests (actual commands/results); Approval impact; Deployment impact; Open issues; Exact next step. Include generated sheet/frame counts and the first unreviewed sheet path. If any test changed, report old behavior, why incomplete, new rule, and evidence it catches the original defect.
