# October Batch 1 focused reconfirmation

Prepared 2026-10-03. This is implementation evidence, not an independent verdict or approval.

## Frozen scope

- Branch: `codex/october-maternelle-3`.
- Reviewed baseline: `5139cc89058447b59702b8784455983e7788535e`.
- Frozen corrected implementation: `461e946e3ef4d7a63909bd1e720d5876dd568bf4`.
- The subsequent evidence-only checkpoint adds this dossier and its discovery link; implementation content stays identical to the frozen SHA above.
- Scope: instructional days 23-29, October 1-9, 2026; 28 lessons, each `review` with `review: null`.
- Prior independent verdict, relayed by the owner: `accepted-with-modifications`. It has not been converted into accepted history or approval.

## Package freshness proof

On 2026-10-03, separately loaded canonical data with `getReferenceData()`, regenerated each of the 12 `REVIEW_PACKAGES` in memory with `buildReviewPackage(data, options)`, and compared the complete UTF-8 string with the saved file. All 12 were exactly equal; a mismatch throws and fails the check. These are implementation checks, not independent pedagogical acceptance.

| Package                                       | Canonical selection                             | Exact equality | Saved package SHA-256                                              |
| --------------------------------------------- | ----------------------------------------------- | -------------- | ------------------------------------------------------------------ |
| [Week 6](2026-2027-maternelle-3-semaine-6.md) | `maternelle-3`, `2026-2027`, week 6, days 23-24 | PASS           | `079119d010d22e35d0f2fc5279613ac98d6fde8642e869940ca6bf3e0a81a422` |
| [Week 7](2026-2027-maternelle-3-semaine-7.md) | `maternelle-3`, `2026-2027`, week 7, days 25-29 | PASS           | `7b786f7c74a14ed5465b865390bbfb556e276252dd69721b8673eb8aedcdfbaf` |

Canonical source identifiers at the frozen implementation SHA:

- Curriculum `maternelle-cycle1-cd-2026`; level `maternelle-3`; school year `2026-2027`.
- Lesson files: `content/lessons/maternelle-cycle1-cd-2026/maternelle-3/{lang,math,phys,art,time-space,world}.json`.
- Calendar: `content/calendars/cd/{2026-2027,national}.json`.
- Programme and progression: `content/programmes/maternelle-cycle1-cd-2026/{maternelle-3,maternelle-3-annual-plan}.json`.
- Objectives: `content/curriculum/maternelle-cycle1-cd-2026/objectives/{LANG,MATH,PHYS,ART,TIME-SPACE,WORLD}.json`.
- Media, materials, teaching texts and history: `content/media/registry.json`, `content/materials.json`, `content/texts/maternelle-3.json`, `content/reviews/history.json`.
- Loader: `lib/content/reference-data.ts`; selection registry: `lib/content/review-packages.ts`; generator: `lib/content/review-package.ts`.

Reproduce saved packages only through `scripts/review-package.ts`, with `--level=maternelle-3 --year=2026-2027 --week=6 --from=23 --to=24` and `--week=7 --from=25 --to=29`, respectively. The hard-failure `it.each(REVIEW_PACKAGES)` test in `tests/unit/content-quality-gate.test.ts` checks every registered package, not just index zero. No generated package was manually patched.

## Seven findings: before and after

| Finding           | Exact affected IDs                                                                                             | Reviewed baseline                                                | Corrected implementation                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Freshness         | Week 6 and Week 7 packages                                                                                     | Saved evidence drifted; equality test covered only first package | Regenerated both packages; exact equality enforced for all 12                       |
| Temporal contrast | Lesson `m3-time-10`, activity `m3-time-10-a2`                                                                  | Today/later overlaps for bedtime tonight                         | Now/later, explicitly bedtime later tonight; wording and scaffold aligned           |
| Weekday logic     | Lesson `m3-time-11`, activity `m3-time-11-a1`                                                                  | Friday/Saturday model and weekend assumption on Thursday         | Actual day/date placeholders; today, tomorrow, following day; no weekend assumption |
| Oral progression  | Lessons `m3-lang-25`, `m3-lang-26`, `m3-lang-29`; activities `m3-lang-25-a2`, `m3-lang-26-a2`, `m3-lang-29-a2` | Simple utterances without meaningful oral linking progression    | Supported quand/parce que completion or production with concrete adult models       |
| Plant stages      | Lesson `m3-world-08`; activities `m3-world-08-a1`, `m3-world-08-a2`                                            | Anatomy image instead of growth-stage evidence                   | Seed/sprout/young plant; observation, naming and ordering from shuffled images      |
| Opening ritual    | Lesson `m3-lang-28`, activity `m3-lang-28-a1`                                                                  | Sound retrieval without date-first ritual                        | Date first, then brief ch/s retrieval; three minutes; date objective retained       |
| Mathematics       | Lesson `m3-math-28`; activities `m3-math-28-a1`, `m3-math-28-a2`                                               | Compulsory continuation/count-on                                 | Visible +1, before/after comparison, full recount from one                          |

The repository objective is `MATH-S01-C01-O24` (letter O), not the prompt's `MATH-S01-C01-024`. Its count-on window remains days 34-44; it is not introduced by this correction.

## Media, calendar and regression evidence

See [correction checkpoint](../work/OCTOBER_BATCH_1_CORRECTIONS.md) for the three SVG hashes, accessibility descriptions, targeted deterministic generation, visual captures and complete validation results.

- Assets: `plante-graine`, `plante-pousse`, `plante-jeune`; 200 x 200, common soil reference, distinct stages, no embedded text, French alt descriptions. `plante-parties` remains unchanged elsewhere.
- Visual evidence: [stage contact sheet](media/october-batch-1-plant-stages.png), [phone](media/october-batch-1-plant-phone.png), [tablet](media/october-batch-1-plant-tablet.png), [laptop](media/october-batch-1-plant-laptop.png).
- Day 28 is Thursday 2026-10-08. Day 30 is Monday 2026-10-12, a teaching day without configured holiday/closure, deliberately `no-content` until the next authorized batch.
- Baseline comparison: 176 approved September lesson objects (including review records, digests and media associations), 51 original media registry rows, and 98 previously tracked media files unchanged. Teaching texts, review history and calendar bytes unchanged.
- Full correction validation at `461e946`: formatting/check, lint, sequential typecheck, 454/454 tests, 31-file content validation, programme, coverage (42/42 due), media (43/43 required), all-package freshness, zero-lapse dry run, SQL test-mirror generation, Webpack production build, 28-file sentinel client scan, and three device captures passed.
- Caveats: content wrapper IPC EPERM bypassed with Node tsx import; initial concurrent typecheck/build race resolved sequentially; Chromium required local sandbox escalation. Webpack fallback was run directly, not a new Turbopack attempt. These checks were not rerun as a full suite for this evidence-only addition; current freshness and documentation checks are separate.

No approval, independent acceptance, rich ImageGen, UX work, days 30-44 authoring, migration, PR, merge or deployment. No owner decision is needed before the independent review.

Evidence-only rechecks on 2026-10-03: all 12 in-memory package comparisons passed; focused content quality gate passed 45/45 tests; repository format check passed. New dossier formatting is checked explicitly because review artifacts are excluded by the repository's normal formatting policy.

## Ready-to-paste independent prompt

```text
Independently reconfirm October 2026, 3eme maternelle Batch 1 on branch codex/october-maternelle-3. Frozen corrected implementation SHA: 461e946e3ef4d7a63909bd1e720d5876dd568bf4. Reviewed baseline: 5139cc89058447b59702b8784455983e7788535e. Verify the current evidence-only checkpoint has identical implementation content. Read docs/review/OCTOBER_BATCH_1_RECONFIRMATION.md, docs/work/OCTOBER_BATCH_1_CORRECTIONS.md, both Week 6/7 packages and the authoritative canonical sources. Focus on the seven demonstrated corrections, but remain free to reject any introduced regression.

Verify independently:
1. Both packages exactly match canonical regeneration; all 12 registered packages have hard-failure freshness coverage.
2. m3-time-10-a2 uses unambiguous now/later, with bedtime later tonight.
3. m3-time-11-a1 follows actual Thursday 2026-10-08 and successive days without fragile hard-coded weekday/weekend assumptions.
4. m3-lang-25-a2, m3-lang-26-a2 and m3-lang-29-a2 demonstrate supported preschool oral linking progression.
5. m3-world-08-a1/a2 show seed, sprout and young plant and support ordering/naming; inspect SVGs, hashes and accessibility evidence.
6. m3-lang-28-a1 restores date first, then sound retrieval, within three minutes and with the date objective.
7. m3-math-28-a1/a2 use visible +1 and full recount, not compulsory premature count-on; MATH-S01-C01-O24 remains deferred to days 34-44.
8. Day 30 (Monday October 12) is a valid teaching day, deliberately deferred/no-content, not a holiday or structural gap.
9. September content, media bytes/associations, approvals, digests, review history, texts and calendar remain unchanged against the baseline.
10. All 28 October Batch 1 lessons remain review with review: null; no self-approval or accepted history was written.
11. No unnecessary rich ImageGen work was introduced.

Check validation evidence and distinguish checks you actually rerun from inherited results. Return exactly one verdict: accepted, accepted-with-modifications, or rejected, with supporting findings and file/ID references. Do not modify or approve content, author later weeks, start UX work, create a migration/PR, merge or deploy. Stop after the independent verdict.
```
