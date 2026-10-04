# October 2026 — 3ème maternelle Batch 1

Status: independent review returned accepted-with-modifications; corrections applied, pending independent reconfirmation. See `docs/work/OCTOBER_BATCH_1_CORRECTIONS.md`. Do not approve, merge, deploy,
create database migrations or generate rich ImageGen assets from this document alone.

## Branch and baseline

- Branch: `codex/october-maternelle-3`
- Base: `origin/develop` at `6b8ba9e87802d96c2f193fe73d3c9897e084ba9c`
- Planning checkpoint commit: `1242f5a`
- Production baseline: `origin/main` at `ac3ebf9b9bd00662def3e7ec206aff1954f4694d`

September production content, media, approvals, digests, media associations and calendar records are
not intentionally changed by this batch.

## Calendar and structure

Verified October 2026 for 3ème maternelle:

- 22 instructional days, 2026-10-01 through 2026-10-30, weekdays only.
- No configured October public holiday, observed holiday or school vacation.
- October instructional days are 23-44.
- Full October target remains 88 lessons: 22 language, 22 mathematics, 22 physical activity, 7 arts,
  7 world and 8 time-space.

Batch 1 authors the first two October instructional weeks only:

- Week 6: days 23-24, 2026-10-01 and 2026-10-02.
- Week 7: days 25-29, 2026-10-05 through 2026-10-09.
- Day 30, Monday 2026-10-12, is a teaching day, not a holiday or structural gap. It intentionally remains `no-content`, deferred to the next authorized implementation batch.

## Authored lessons

All 28 new lessons are `status: "review"` with `review: null`.

| Day | Date       | Lessons                                                 |
| --- | ---------- | ------------------------------------------------------- |
| 23  | 2026-10-01 | `m3-lang-23`, `m3-math-23`, `m3-phys-23`, `m3-time-09`  |
| 24  | 2026-10-02 | `m3-lang-24`, `m3-math-24`, `m3-phys-24`, `m3-art-08`   |
| 25  | 2026-10-05 | `m3-lang-25`, `m3-math-25`, `m3-phys-25`, `m3-world-08` |
| 26  | 2026-10-06 | `m3-lang-26`, `m3-math-26`, `m3-phys-26`, `m3-time-10`  |
| 27  | 2026-10-07 | `m3-lang-27`, `m3-math-27`, `m3-phys-27`, `m3-art-09`   |
| 28  | 2026-10-08 | `m3-lang-28`, `m3-math-28`, `m3-phys-28`, `m3-time-11`  |
| 29  | 2026-10-09 | `m3-lang-29`, `m3-math-29`, `m3-phys-29`, `m3-world-09` |

## Pedagogical progression

Batch 1 continues September instead of restarting:

- Language: moves from September self-presentation, date ritual and story retelling into oral time
  markers, longer statements, object description and `ch/s`, `ch/j` pronunciation play.
- Mathematics: moves from counting and composing small quantities into quantity/name/numeral
  association and the first `+1`/next-number foundation.
- Physical activity: moves from running, stopping, aiming and balance into short obstacle running,
  jumping, throwing and simple coordination courses.
- Time-space: extends the week/date ritual into near-future events in the week.
- World: extends animal/plant needs into early life-stage observation.
- Arts: extends individual drawing into parent-child collective drawing, explicitly noting the home
  limitation of a collective-art objective.

## Media inventory

No final rich ImageGen illustration is generated in this batch.

Required/reused accepted assets:

- `m3-lang-23`, read-aloud: `histoire-nsimba`.
- `m3-lang-24`, read-aloud: `histoire-pluie`.
- `m3-lang-25`, read-aloud: `histoire-kumu`.
- `m3-lang-26`, vocabulary: `objet-seau`, `objet-marmite`, `objet-panier`; read-aloud:
  `histoire-marche`.
- `m3-lang-27`, read-aloud: `histoire-bibi`.
- `m3-lang-28`, read-aloud: `histoire-malo`.
- `m3-lang-29`, read-aloud: `histoire-cailloux`.
- `m3-math-23`, `m3-math-26`: `objet-caillou` as a simple counter reference.
- `m3-world-08`: new deterministic `plante-graine`, `plante-pousse`, `plante-jeune` SVGs for both observation activities. The anatomy-only `plante-parties` is no longer associated with this lesson; its September bytes and uses are unchanged.
- `m3-world-09`: `animal-poussin`, `animal-poule`.

Required new SVGs:

- Three distinct growth-stage cards: seed without leaves, sprout with two leaves, young plant with four leaves. Same plant and soil reference across the set; text-free, 200 x 200, French accessibility descriptions, SHA-256 recorded in the registry.
- Activity 1 names the visible stages; activity 2 presents them in a different order and asks the child to indicate growth order and name them. No screen interaction is required.

- Numeral cards and day cards are made by the parent on paper in this batch.
- The media report classifies some drawings/cards as useful but non-blocking; none leaves the child
  without something required to see.

No rich ImageGen pending for Batch 1:

- The batch intentionally reuses accepted September story/rhyme assets for daily read-aloud and
  keeps new learning mostly off-screen/manipulative.
- Future October weeks may require rich scenes for biodiversity, life stages or new stories, but no
  such asset is required by days 23-29.

Media report after authoring:

- required image activities: 43/43 with image
- required image gaps: 0
- useful but non-blocking image ideas: 36
- runtime media library: 34 SVG and 20 WebP registered assets; all 51 existing rows and all 98 previously tracked media files unchanged

## Review packages

Generated review packages:

- `docs/review/2026-2027-maternelle-3-semaine-6.md` for days 23-24.
- `docs/review/2026-2027-maternelle-3-semaine-7.md` for days 25-29.

Recommended independent review flow:

1. Review week 6 and week 7 together as one October Batch 1 pedagogical review.
2. Return `accepted`, `accepted-with-modifications` or `needs-revision`.
3. If accepted or corrected to accepted, approve only affected October lessons with fresh digests.
4. Do not alter September approvals during October approval.

## Original implementation validation checkpoint

Final local validation performed during implementation:

- `npm run format`: passed.
- `npm run format:check`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 34 files / 443 tests.
- `npm run content:validate`: passed.
- `npm run programme:report -- --level=maternelle-3 --day=23 --to=30`: passed; days 23-29 complete,
  day 30 no-content.
- `npm run coverage:report -- --level=maternelle-3 --day=29`: passed; 42 expected objectives due by
  day 29, 42 taught, 0 missing.
- `npm run media:report -- --level=maternelle-3`: passed; 0 required image gaps.
- `npm run review:lapse -- --dry-run=true`: passed, 0 approvals lapsed.
- `env ... npx next build --webpack`: passed with CI fake server-only sentinels.
- `env ... npm run check:client-bundle`: passed, 28 client files scanned, 3 sentinels absent.

Note: plain Turbopack `npm run build` passed once during validation, then later reproduced the known
local port-binding `EPERM` panic after the failed sentinel rebuild attempt. The Webpack production
fallback passed and produced the bundle scanned above.

Full suite status is recorded in `docs/work/ACTIVE_TASK.md` after final validation.

## Next stop

After correction validation and push, stop for owner-directed independent reconfirmation. The original packages were stale despite the original passing suite; freshness now checks all packages and both October packages have been regenerated. Do not generate rich images,
author days 30-44, create migrations, open a PR, merge or deploy.
