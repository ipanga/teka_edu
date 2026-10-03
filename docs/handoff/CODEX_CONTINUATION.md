# Codex continuation

Current task: October Weeks 3–5 authoring, authorized 2026-10-03 from verified `1ada5f2`.
Owner chose canonical rotation: all 60 lessons now exist, ART/WORLD/TIME-SPACE 5/4/6, no Day-40
exception. Full October rotating totals are 7/6/9 because frozen Batch 1 is 2/2/3.
All new lessons remain review/null. Weeks 8–10 packages and 115-activity media inventory are generated;
491 unit tests, content/reports, lint/typecheck, build/client and 87 browser tests pass (nine production-only
skips). All eight supported sizes and P1 journeys passed. See ACTIVE_TASK.md and OCTOBER_WEEKS_3_5.md.
Freeze proof protects 204 lesson objects and 395 files, with the exact P1 day-30 fixture-only update.
The review-ready checkpoint is the commit containing this handoff; verify local/remote HEAD and a clean
tree before one fresh independent review of days 30–44.
Preserve all frozen objects/media/packages and P1 fixes. No approvals, later authoring, migration,
database writes, PR, merge or deployment.

## Historical completed P1 gate

Current authorization: complete the mandatory P1 UX gate and reconcile frozen October Batch 1.
PR [#94](https://github.com/ipanga/teka_edu/pull/94) passed all four required checks and merged
into develop at `603efdc14de535ea78f9dbe4488ff3e49ccc5186`. Accepted October content at `2170413`
(corrected implementation `461e946`) has fresh independent `accepted` reconfirmation, relayed by
the owner. October reconciliation `61fa079` is committed and pushed without rewriting history;
content/media/package hashes remain identical. Combined checks passed: 482 unit tests, 79 browser
tests with nine production-only skips, 12 fresh packages and zero approval lapses. Staging run
37098065260 passed on develop 603efdc: DEV already up to date (zero migrations), preview READY,
79 smoke tests passed. Every gate is complete. Stop and await the next explicit instruction. Do not author Day
30 or Weeks 3–5, change approvals, mutate DEV/PROD, add migrations or deploy production.

Read `docs/work/ACTIVE_TASK.md` and `docs/work/PARENT_CHILD_UX_P1.md` for exact resume information.
The dated evidence below is historical and remains preserved; it does not supersede this instruction.

## Historical October planning baseline — 2026-10-02

Read `docs/work/OCTOBER_3EME_PLAN.md` and `docs/work/OCTOBER_BATCH_1.md` before continuing October
work. The authoritative Batch 1 base is `origin/develop` at `6b8ba9e87802d96c2f193fe73d3c9897e084ba9c`.
Production remains healthy on `origin/main` at `ac3ebf9b9bd00662def3e7ec206aff1954f4694d`; do not
redeploy production merely for documentation.

October 2026 for 3ème maternelle covers instructional days 23-44: 22 teaching days, no configured
October public holidays, no observed holidays and no school vacation. Expected October content is
88 lessons: 22 language, 22 mathematics, 22 physical activity, seven arts, seven world and eight
time-space lessons. The existing schema supports this; no October schema migration is currently
indicated. Implementation should start from a dedicated branch such as `codex/october-maternelle-3`
only after owner authorization.

Batch 1 branch: `codex/october-maternelle-3`. Planning checkpoint commit: `1242f5a`. Batch 1
authors days 23-29 only and leaves day 30 as `no-content`. All new October lessons remain
`review` with `review: null`; independent review requested modifications, and corrected content awaits reconfirmation.

Original implementation validation passed: format, format check, lint, typecheck, 443 unit tests, content
validation, programme report for days 23-30, coverage report through day 29 with 42/42 due
objectives taught, media report with zero required image gaps, approval-lapse dry run with 0 lapses,
Webpack production build with CI fake server-only sentinels, and client-bundle scan over 28 files
with all three sentinels absent. Plain Turbopack `npm run build` passed once, then later reproduced
the known local port-binding `EPERM` panic after a failed sentinel rebuild attempt; the Webpack
fallback passed.

Stop boundary: do not generate final October rich media, modify September canonical content/media
or approval history, create migrations, open a PR, merge, deploy, start 2ème maternelle, offline
support or recorded audio without explicit owner authorization.

## Current authorization override — mandatory P1 UX gate, 2026-10-03

The latest owner instruction supersedes the historical September continuation below. Implement
only five P1 UI/browser-state fixes on `codex/parent-child-ux-p1` based on exact develop `6b8ba9e`.
Accepted October Batch 1 is frozen at `2170413` (corrected content `461e946`, independently
reconfirmed `accepted`). Preserve content, media, packages, approval history and accepted branch
history. Do not author Day 30 or Weeks 3–5, add migrations, mutate DEV/PROD, or promote production.

Implementation, local validation and required CI passed. PR #94 is merged; non-destructive October reconciliation 61fa079 and combined
verification are complete. Use the ready-to-paste future prompt only after the owner issues it.
If merge cannot respect the no-DEV-mutation boundary, stop ready to merge. Do not supply a Weeks
3–5 continuation prompt until every gate succeeds. Exact resume state is in
`docs/work/ACTIVE_TASK.md`; evidence is in `docs/work/PARENT_CHILD_UX_P1.md`.

## Verified recovery baseline

- Branch: `codex/september-rich-media-pilot`.
- HEAD and remote: `4b2648f462e4abd2467d3515a68822796c5005ee`; clean before work.
- September: 176 approved, 0 review, 176 distinct valid digests, 0 stale approvals.
- 51 assets, 69 tracked runtime files, all SHA-256 values verified; 7,597,868 bytes.
- 17/20 independently completed candidates; seven sequences; 31 retained SVGs.
- Remaining canonical order: `histoire-pluie`, `histoire-cailloux`, `histoire-malo`.
- Recovery validation: 31 content files valid; lapse dry run zero.

## Current phase and next action

Integration update, 2026-10-01: owner authorized controlled PR #88 merge to `develop` and staging
validation. PR #88 was squash-merged after live verification that the head was unchanged at
`de045acd068c271730986b6e2c74cce3f0f70671`, clean/mergeable, and green. GitHub reports merge commit
`5249dadfcea596a49bbe058f674ef61e27462d87`; `origin/develop` was fetched and verified at that SHA.
The accepted feature reference remains unchanged at `b4ca67cc8449ba4b5dae0ad7fd057591de2f833e`.
PR #88 contains forward-only migrations `20261001192741_media_asset_webp_paths.sql` and generated
`20261001192742_final_september_rich_media_reference.sql`. The first only updates the
`media_assets_file_check` constraint to allow repository-local `.webp` assets; the second is the
generator output from `content/`. Local `npm run db:reset` and `npm run db:test` passed from a fresh
replay (152 pgTAP assertions).

Controlled staging workflow run `36926521934` rerun passed pre-deploy CI and applied migrations to
Supabase DEV successfully, but final staging smoke was unhealthy: 65 passed, nine skipped, and one
failure in `tests/e2e/rich-media-pilot.spec.ts` because one pilot image's `naturalWidth` remained
`0` before the 30 s timeout. The broader `rich-media-rollout` staging check passed.

PR #89 fixed that remaining smoke issue by splitting the rich-media pilot smoke into independent
phone/tablet/laptop-MacBook viewport tests and checking expected image HTTP response, browser decode
and `naturalWidth` directly. PR #89 CI passed and was squash-merged into `develop` as
`1c5c5aad9c6e9871d7cab83813cfbe34bc057bc7`. Controlled staging workflow run `37046853410` on
`develop` passed CI, confirmed Supabase DEV was already up to date, deployed Vercel preview
`dpl_9YzWw1XsgwhSDT5VeyTppsqe38RG` to `https://teka-4urqhl8pb-teka10.vercel.app`, verified target
`preview` and state `READY`, aliased `teka-edu-staging.vercel.app`, and passed deployed smoke:
71 passed, nine skipped, zero failed. Production code and production data remain unchanged. Resume
from `docs/work/ACTIVE_TASK.md`; stop unless the owner explicitly authorizes production promotion
or a new task.

PR #90 recorded the healthy staging state and was squash-merged into `develop` as
`c325c65e765984e5f8223b08e2ee00e99b4c6ecc`. The previous local `develop` divergence was the
superseded local-only docs commit `8823d05aac03c7f20ee17c072945aeaaebdf422e`; it was removed by
aligning local `develop` to `origin/develop`, with no remote rewrite. Final pre-production
functional validation used push-triggered staging run `37048748582`: Vercel deployment
`dpl_FwfCxXHYtNJrRV6H5G1CjZpegYaz`, URL `https://teka-6g69qd3wb-teka10.vercel.app`, alias
`teka-edu-staging.vercel.app`, target `preview`, state `READY`, expected Git SHA
`c325c65e765984e5f8223b08e2ee00e99b4c6ecc`, app environment `staging`, Supabase DEV, deployed
smoke 71 passed / 0 failed / 9 production-only skipped.

Representative functional sample covered parent entry/completion, pause/resume persistence,
child-screen transitions and return controls, story paging, shared rhyme primary frames, counting
handoff, vocabulary/recognition interactions, retained SVGs and accepted WebPs across phone, tablet
and laptop/MacBook. Lesson IDs: `m3-lang-01`, `m3-lang-02`, `m3-lang-03`, `m3-lang-05`,
`m3-lang-06`, `m3-math-10`, `m3-world-02`, `m1-lang-02`, `m1-lang-03`, `m1-lang-06`, `m1-lang-11`,
`m1-lang-18`. TV and Smart TV remain excluded. No defects were found; no accepted content, approval
history or media bytes changed. September integrity rechecked: 176/176 approved, 176 distinct valid
digests, zero review, zero stale/unexpected lapses, 20/20 rich-media accepted, 78 runtime media
files. Production code and data remain unchanged. Stop for owner production decision.

Accepted September implementation checkpoint: `c7967163dedd26fa4c69a68de5a34ccdd52ca1f1`, validated,
pushed and remote-verified. The final documentation-only follow-up changes no validated bytes;
resolve its SHA with `git log -1` and verify the clean tree and matching feature remote.
Completed task archive: docs/work/archive/2026-10-september-rich-media-complete.md.

September rich-media completion verified on 2026-10-01. The owner relayed separate independent
acceptance of Malo without correction; the implementation session did not self-review.
Frozen implementation 8b5a8655222e299fea90e7582906c3723b3eca79 and documentation checkpoint
1c3372298eaa9e3463aa7a889762bb9cc662db2b were reverified before restoration.
All 26 Malo package hashes and byte lengths matched; manifest SHA-256
f76f81e72adef7810695da6cb2b29d6fde0aa4dc981e9abd43fc0f1289141603.
Only m3-lang-07, m3-lang-16 and m3-lang-20 restored, after dry-run, through
approve-week --lapsed-only=true with newly computed digests. All 173 unaffected records unchanged.
176 lessons / 176 approved / zero review / 176 distinct current valid digests / zero stale or
unexpected lapses. Twenty candidates integrated and independently accepted; none deferred/pending.
51 registered assets, ten sequences, 47 WebPs and 31 retained SVGs: 78 tracked runtime files,
10,791,652 bytes. Canonical teaching content matches rollout baseline cbc1cf3; accepted media
and all three committed frozen packages are preserved byte for byte. No temporary/chat/master
dependency is required for recovery.
Accepted verdict: docs/review/verdicts/2026-10-01-malo.json. Repository-derived checks:
docs/media/SEPTEMBER_RICH_MEDIA_FINAL_AUDIT.json, regenerated by
node --import tsx scripts/final-rich-media-audit.mjs.
Final validation/checkpoint freshness is recorded in docs/work/ACTIVE_TASK.md.
STOP after the authorized feature checkpoint/push. No PR, merge, deployment, database operation,
October, 2eme maternelle, infrastructure or unrelated feature work is authorized.
Recommended next phase, only after owner authorization: PR to develop, CI/staging, owner
phone/tablet/laptop-MacBook inspection and a small real parent-child September pilot before
curriculum expansion. Alternatives: offline reliability, owner-recorded audio, or reviewed
2eme/October content after pilot findings. No alternative has started.

## Policies

- Phone, tablet, laptop/MacBook only (ADR-050); TV/Smart TV excluded. Representative
  widths: 320/360/390/430, 768/1024, 1280/1440.
- Built-in ImageGen for complex story scenes; retain high-quality local masters under
  ignored `private/astra-visual-evidence/`. Commit optimized WebP application assets.
- Preserve accepted WebPs and 31 intentional SVGs. No paid API or runtime generation.
- Canonical text controls images; never change pedagogy to accommodate generated art.
- Calculate exact media dependencies, lapse only affected approvals, preserve unaffected
  records, validate fresh digests and zero unintended stale approvals (ADR-048).
- Freeze canonical mapping, comparison, final frames, 256 px and responsive evidence,
  hashes and approval impact in a committed isolated package.
- The implementation session cannot self-approve. Owner opens a fresh independent Codex
  session and relays `accepted`, `accepted-with-modifications` or `rejected`.
- Restore only after an explicit final independent acceptance supports restoration;
  use existing full-review history and `approve-week --lapsed-only=true`, fresh digests.
- No October, 2eme maternelle, offline implementation, unrelated refactoring, production promotion
  or production deployment. Feature checkpoints and pushes are authorized.
- Keep DEV/PROD separate, RLS intact, secrets private, `.env*` untracked and server secrets
  out of client bundles. No production data mutation or force-push.

## Completion boundary

September rich-media rollout is complete. Report, checkpoint/push feature only and STOP.
No new phase starts without an owner decision. Resolve the final checkpoint with git log -1,
verify a clean tree and matching remote SHA, then read ACTIVE_TASK.md before any action.
