# October Batch 1 correction checkpoint

Date: 2026-10-02. Branch: `codex/october-maternelle-3`.
Reviewed baseline: `5139cc89058447b59702b8784455983e7788535e`.
Independent verdict: `accepted-with-modifications`. Owner authorized the seven corrections.
Implementation is complete and awaits independent reconfirmation; this document is not acceptance.

## Corrected evidence

| Issue                    | Affected content                                  | Correction                                                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package freshness        | Week 6 and Week 7                                 | Regenerated from canonical JSON after corrections. Parameterized freshness test now checks exact equality for every registered package and fails the suite on drift. It caught both stale October packages before regeneration.   |
| Ambiguous time contrast  | Day 26, `m3-time-10-a2`                           | Now versus later; bedtime explicitly later tonight. Title, French instruction/guidance, vocabulary, prompts and English scaffold agree.                                                                                           |
| Wrong weekday assumption | Day 28, `m3-time-11-a1`                           | Actual lesson date/day via placeholders, tomorrow and the following day. Removed Friday/week-end assumption. Date objective mapped explicitly.                                                                                    |
| Sentence complexity      | `m3-lang-25-a2`, `m3-lang-26-a2`, `m3-lang-29-a2` | Supported completion/production with quand or parce que. Concrete models, no grammatical terminology required of the child.                                                                                                       |
| Plant growth evidence    | Day 25, `m3-world-08-a1/a2`                       | Three deterministic SVGs show seed, sprout and young plant. Child points, names and indicates growth order from a shuffled presentation. Anatomy-only September asset removed from this October association, unchanged elsewhere. |
| Opening ritual           | Day 28, `m3-lang-28-a1`                           | Date before short ch/s retrieval; still three minutes, date objective included.                                                                                                                                                   |
| Premature count-on       | Day 28, `m3-math-28-a1/a2`                        | Visible addition of exactly one, before/after comparison and recounting all objects from one. Count-on remains deferred to days 34-44.                                                                                            |

All seven teaching days retain 13 language + 9 mathematics + 6 movement + 7 rotating domain = 35 minutes.
Day 30 is Monday 2026-10-12, an instructional day with no configured holiday. It is outside October 1-9 and intentionally deferred to the next authorized batch, not a structural or non-teaching gap.

## Media freeze

| New asset       | SHA-256                                                            |
| --------------- | ------------------------------------------------------------------ |
| `plante-graine` | `e5fb20101e4c2532c1fef46b146a8e41ece93e294e6a009ca7d4c48d0a0e6c6b` |
| `plante-pousse` | `c66b12eaabf6442b2f2161e6ce153aca6edce01cbb85d8246dfa8b193748f769` |
| `plante-jeune`  | `0d70193177c39ab74abaf7482527c6012b870ca526e0d871cd339c0bb368c1f3` |

Classification: required deterministic educational SVGs, not rich ImageGen. The rich-media queue remains empty.
Three 200 x 200 text-free diagrams use a common soil level and plant identity; seed has no leaves, sprout has two, young plant has four. Each has French alt text. Both observation activities show all three; the second uses a shuffled asset order. No tapping or dragging is required.

Generator: `node --import tsx tools/media/build.ts --ids=plante-graine,plante-pousse,plante-jeune`.
The targeted option preserves every existing registry row and file outside those ids.
September audit/QA derivation excludes later-only assets by actual instructional-day usage while retaining shared and unused September assets; frozen September evidence is unchanged.

Visual evidence under `docs/review/media/`:

- `october-batch-1-plant-stages.png`: existing contact-sheet template, rendered at 72/128/256 px. Its historical September header is template wording; these are three new October cards.
- `october-batch-1-plant-phone.png`, `october-batch-1-plant-tablet.png`, `october-batch-1-plant-laptop.png`: actual day-25 child surface, 390 x 844, 768 x 1024, 1440 x 900. All three SVGs decoded with nonzero natural width and visible bounds on each viewport.

## Validation actually performed

- `npm run format` and `npm run format:check`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed on sequential rerun after build. An initial concurrent run raced with build cleanup of `.next/types`; no source type error remained.
- `npm run test -- --reporter=json`: 34 files, 454/454 tests passed, including exact freshness for all 12 registered review packages.
- `node --import tsx scripts/validate-content.ts`: 31 registered JSON files valid and consistent.
- `node --import tsx scripts/programme-report.ts --level=maternelle-3 --day=23 --to=30`: days 23-29 complete, 35 minutes each; day 30 no-content.
- `node --import tsx scripts/coverage-report.ts --level=maternelle-3 --day=29`: 42 due objectives, 42 taught, zero missing.
- `node --import tsx scripts/media-report.ts --level=maternelle-3`: 43/43 required-image activities covered, zero required gaps; library 34 SVG and 20 WebP.
- `node --import tsx scripts/lapse-approvals.ts --dry-run=true`: zero approval lapses.
- `node --import tsx scripts/generate-reference-sql.ts`: regenerated only the repository pgTAP test mirror; no migration or database write.
- `npx next build --webpack` with the three CI fake server-only sentinels: passed.
- `node --import tsx scripts/check-client-bundle.ts` with the same sentinels: 28 client files scanned, all three values absent.
- Local Chromium contact sheet and actual phone/tablet/laptop lesson captures: passed. Local verification server stopped after capture.
- `git diff --check`: passed.

The npm content-validation wrapper initially hit the local tsx IPC `EPERM` restriction. Script execution via Node's tsx import ran the same validation successfully. Chromium required sandbox escalation for local captures. The documented Webpack build fallback was used directly.

## Integrity and review boundary

Compared with the frozen baseline: all 176 approved September lesson objects, including review records/digests/media associations, all 51 existing registry rows and all 98 previously tracked media files are identical. Teaching texts, review history and calendar files are unchanged. All 28 October lessons remain `review` with `review: null`; no approvals restored.

No rich generation, days 30-44 authoring, migrations, PR, merge, deployment or database mutation.
No owner decision is needed to finish this correction checkpoint. The next action is a fresh independent reconfirmation of the seven corrections, exact package freshness, the three SVGs and September integrity. Do not perform acceptance in the implementation session.
