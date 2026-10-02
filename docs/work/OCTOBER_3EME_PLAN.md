# October 2026 — 3ème maternelle planning baseline

Status: planning-only, owner authorization required before implementation.

## Repository baseline

- `origin/main`: `ac3ebf9b9bd00662def3e7ec206aff1954f4694d`, September production release.
- `origin/develop`: `6b8ba9e`, post-production documentation from PR #93.
- No production redeploy is needed merely to synchronize documentation.
- Supported devices remain exactly phone, tablet and laptop/MacBook. TV and Smart TV are unsupported.

## September retrospective

Retain these practices for October:

- Author from the annual plan first, then lessons.
- Keep lesson text, media, review history and reference data separate but digest-linked.
- Use fresh digest computation and affected-only approval lapse for any content or media change.
- Require independent AI-assisted pedagogical review before approving lessons.
- Freeze visual evidence for changed media: canonical mapping, hashes, 256 px readability, supported-device captures and approval impact.
- Preserve accepted September content, media bytes, associations, digests, calendar records and approval history.
- Use phone/tablet/laptop-MacBook validation only.
- Generate reference-data migrations only after canonical content is accepted for implementation.

Avoid repeating September-specific overhead where possible:

- Do not use one-review-per-story as the default for October. Review complete weekly or two-week batches when the media evidence is clean.
- Do not generate rich images before lesson architecture and media requirements are fixed.
- Do not replace rich story needs with weak SVGs for convenience.

## October calendar

October 2026 covers instructional days 23-44:

- Thu 2026-10-01: day 23
- Fri 2026-10-02: day 24
- Mon-Fri 2026-10-05 through 2026-10-09: days 25-29
- Mon-Fri 2026-10-12 through 2026-10-16: days 30-34
- Mon-Fri 2026-10-19 through 2026-10-23: days 35-39
- Mon-Fri 2026-10-26 through 2026-10-30: days 40-44

There are 22 teaching days, no configured October public holidays, no observed holidays, and no school vacations.

Expected lesson count is 88 lessons:

- 22 language lessons
- 22 mathematics lessons
- 22 physical-activity lessons
- 7 arts lessons
- 7 world lessons
- 8 time-space lessons

Session duration remains 30-45 minutes, normally about 35 minutes: 13 language, 9 mathematics, 6 movement, 7 rotating domain.

## Curriculum scope

October continues P1, not a restart. It should consolidate the September French-entry work while introducing the remaining day 23-44 P1 windows:

- LANG: oral time system, more complex oral statements, pronunciation contrasts `ch/s`, `ch/j`, `ch/z`, and clusters `br/cr/bl/pl/sl`.
- MATH: matching quantity, number name and written numeral; +1 successor idea; conservation of quantity across object type and spatial arrangement; surcounting.
- PHYS: fast running with an obstacle, coordinated throwing and jumping, orienting in a less familiar space, and school-only water exploration recorded honestly as not fully home-carried.
- TIME-SPACE: months as yearly landmarks, naming most months, seasons.
- WORLD: biodiversity-preserving action near school/home, life stages to age six, matching a technical solution to a function.
- ART: drawing vocabulary and transforming/reusing classroom motifs.

October should continue retrieval from September every day, with weekly consolidation at the last instructional day of each week. French acquisition remains central: child-facing work stays French-first with optional brief English scaffolds for the parent.

## Media plan

Plan media before generation:

- Reuse existing assets for school objects, shapes, body references, animals, September story/rhyme sequences and simple counting contexts where the lesson facts match.
- Use SVG for exact numerals, month/season cards, simple patterns, technical-function diagrams, object/shape recognition, counting aids, tracing supports and classification cards.
- Use rich ImageGen only for new narrative read-alouds, expressive character continuity, life-stage scenes, biodiversity action scenes that depend on people/animals/environment, or multi-frame stories where story facts and emotion matter.
- For any multi-frame story, write a compact visual specification first: characters, clothing, setting, time of day, art style, exact objects/counts, actions, emotion, continuity, prohibited elements and page-to-frame mapping.
- Validate exact quantities as requirements, especially for counting, surcounting, conservation and story facts.
- Check usefulness at the actual story display size, approximately 256 px, before review.

Likely October media categories:

- No illustration required: movement games, most conversations, phonology drills, parent-led retrieval, off-screen manipulation.
- Existing asset: school/home objects, body/articulation references, Kumu/Nsimba/Mangue/Bibi/Marche/Pluie/Cailloux/Malo sequences when reused only as retrieval or pleasure reading.
- SVG: numerals and ten-frame/number strips, month and season cards, weather/season sorting, simple technical object/function cards, motif/pattern cards, obstacle-course diagram if needed.
- Rich ImageGen: any new October story with recurring child/animal characters, expressive scenes, life-stage progression, biodiversity care scene, or complex environment.
- Independent review required: every new lesson batch; every new or changed media asset; every lesson whose digest changes because of media.

## Review strategy

Use fewer, stronger review batches:

- Batch review by week or two-week slice, not by individual lesson, unless a media candidate is unusually risky.
- Keep independent review separate from implementation. The authoring session must not self-approve.
- Regenerate review packages from canonical content, not hand-written summaries.
- For media changes, include frozen hashes, before/after sheets where applicable, 256 px evidence, supported-device screenshots and exact lesson impact.
- Restore only affected approvals with fresh digests and `lapsed-only` mechanics.

## Implementation batches

Recommended implementation batches:

1. Create `codex/october-maternelle-3` from `origin/develop`; add October plan docs and skeleton track extensions for days 23-44 without approving content.
2. Author October weeks 1-2, including texts/media requirements; generate review package; no approval until independent review.
3. Produce only the approved media needed for weeks 1-2, then visual review and fresh-digest restoration.
4. Author October weeks 3-5 with the same path.
5. Generate final reference-data migration after accepted content/media state is stable; run full local validation and open PR to `develop`.

## Database impact

No schema change is currently indicated. Existing lesson, curriculum, programme, media registry, review, calendar and Supabase reference-data models support October. October implementation should require canonical content/reference rows and eventually a generated reference-data migration only.

## Git and release workflow

Use:

`codex/october-maternelle-3` -> PR to `develop` -> staging -> validation -> owner production authorization -> `main`.

Do not merge, deploy, mutate production, or create migrations during planning.

## Recommended first authorized task

Authorize creation of `codex/october-maternelle-3` from `origin/develop` and implementation of the October 3ème maternelle content skeleton plus weeks 1-2 draft lessons and media requirements, stopping at `review` status with no generated rich media beyond approved planning needs.
