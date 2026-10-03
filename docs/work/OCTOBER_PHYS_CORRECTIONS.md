# October Weeks 3–5 PHYS corrections

Date: 2026-10-03. Branch: `codex/october-maternelle-3`.
Reviewed baseline: `61b2e07e9b1f3fbc793cf230291215feef3991fd`.
Owner relayed `accepted-with-modifications`, then authorized Days 38/42 in addition to
the preserved uncommitted Days 33/44 corrections. No reset was performed.
The corrected checkpoint is the commit containing this dossier; the completion summary gives
its exact SHA. Independent reconfirmation is pending, not self-performed.

## Exactly four authorized corrections

Removed `PHYS-S01-C01-O11` (letter O) from each lesson's supporting objectives and its
single activity's objective codes. No other field changed.

| Activity        | Preserved task                                             | Remaining objectives                          |
| --------------- | ---------------------------------------------------------- | --------------------------------------------- |
| `m3-phys-33-a1` | Short run, stop, throw; no crossing task added             | O12 coordination/throwing, safety O07         |
| `m3-phys-38-a1` | Fast steps, flat-line crossing, statue; no running added   | Safety O07                                    |
| `m3-phys-42-a1` | Fast steps, crossing, orientation; no running added        | O13 orientation, safety O07                   |
| `m3-phys-44-a1` | Choose walking, crossing, jumping or throwing; orientation | O12 coordination, O13 orientation, safety O07 |

Safety, materials, six-minute duration, home alternatives, English scaffolds, titles, actions
and unrelated mappings are unchanged. Day 33's running alone does not establish O11's combined
running/crossing requirement. Annual-plan O11 introduction on Day 23 and genuine reinforcement
elsewhere remain intact. No artificial task or wording was added.

## Running assertion

NFC normalization, Unicode-letter tokenization and explicit running-word membership recognize
`course`, `cours`, `courir`, trotting and galloping forms, but reject `parcours` and
`parcourir`. Five positive and three negative cases pass, with direct mapping/duration/state
checks on all four days. Soft assertions collect failures without exemptions or weakening.
The previous 500/501 failure exposed Days 38/42; it was not frozen as green. Authorization
resolved those findings. Current full suite: 503/503, no further demonstrated instance.

## Generated evidence

Only Weeks 8/9/10 regenerated through the canonical generator; all 15 registered packages
exactly equal regeneration and the other twelve remain byte-identical to the reviewed baseline.
The related 115-activity inventory changes only its three hashes: 99 no-media-required,
16 accepted-asset reuse. SQL reference test mirror regenerated, not executed; no migration.

| Package | Canonical selection                     | SHA-256                                                            |
| ------- | --------------------------------------- | ------------------------------------------------------------------ |
| Week 8  | `maternelle-3`, `2026-2027`, days 30–34 | `87028abf637090c96a058dbb8cee2e947d0886abdc169e8d2cca7e7eaf6a6d27` |
| Week 9  | `maternelle-3`, `2026-2027`, days 35–39 | `a9c3bd13a6d14109d24cbf2cc3c85828534929d7e8909e58a51b86cb9dd66f11` |
| Week 10 | `maternelle-3`, `2026-2027`, days 40–44 | `049d7cc1c3381ed30b7c1dd546c83917d58c046bbabeb952d6a6dea458acc790` |

Source: `content/lessons/maternelle-cycle1-cd-2026/maternelle-3/phys.json`.
Generator uses canonical programme/objectives/calendar/media/materials/text/history loaded by
`lib/content/reference-data.ts`; generated packages were not hand-edited.

## Current validation

Targeted tests 70/70; full units 38 files, 503/503. Formatting/check, lint, typecheck,
31-file content validation PASS. Programme days 30–44 complete at 35 minutes each;
coverage 56/56 due, zero missing; media 59/59 required, zero gaps (56 useful-only nonblocking
items unchanged); lapse dry run zero. Package equality and SHA-256 checks PASS.
Production Webpack build PASS; client scan 28 files, three server-only sentinel values absent.
Full local Chromium suite: 87 PASS, nine production-public checks skipped without a configured
production URL. October and P1 journeys pass at all eight supported phone/tablet/laptop sizes.
Verification server stopped; no tracked accepted screenshots/media updated.

The sandbox blocked the tsx CLI IPC pipe for programme reporting; equivalent
`node --import tsx scripts/programme-report.ts --level=maternelle-3 --year=2026-2027 --day=30 --to=44`
passed. Webpack was used directly for the documented local Turbopack restriction.
No current Turbopack, database execution, Docker or remote production pass is claimed.
No inherited result substitutes for a required current check.

## Frozen and unaffected state

Read-only `scripts/check-october-phys-corrections.ts` compares against reviewed 61b2e07:
exactly four mapping-only changes, 260 unchanged lesson objects, 286 byte-identical protected
files, twelve untouched packages, all fifteen fresh, all 88 October lessons review/null.
Existing `scripts/check-october-frozen.ts`: 204 frozen objects (176 September approvals/digests,
28 Batch 1 review/null), 395 protected files, five P1 fixes/expected authoring fixture and
ancestry preserved. Plant SVGs, accepted media/history, calendar and programme remain unchanged.
No approval/history write, media generation, migration, DB write, PR, merge or deployment.

## Focused independent reconfirmation prompt

```text
Open a fresh independent read-only session on codex/october-maternelle-3 at the corrected SHA supplied in the completion summary. Reviewed baseline: 61b2e07e9b1f3fbc793cf230291215feef3991fd. Read docs/work/OCTOBER_PHYS_CORRECTIONS.md and docs/work/ACTIVE_TASK.md. Verify the supplied SHA and clean local/remote checkpoint, compare canonical PHYS content and Weeks 8–10 packages, and independently rerun relevant read-only guards/tests.

Verify m3-phys-33-a1, m3-phys-38-a1, m3-phys-42-a1 and m3-phys-44-a1. O11 must be absent where unsupported: Day 33 has running but no crossing, while Days 38/42/44 must not acquire artificial running. Check actual actions support remaining objectives; safety, materials, six-minute duration, English scaffold and home feasibility are unchanged; all 15 packages exactly match regeneration and recorded hashes; token-aware running detection recognizes course/cours/courir but rejects parcours/parcourir; exactly four mapping-only changes and no unrelated lesson changes; frozen September/Batch 1/P1/media/history/calendar/programme integrity; all 88 October lessons review with review: null. Reject any further demonstrated mapping defect or weakened test. Distinguish current checks from skipped evidence.

Return exactly one verdict: accepted, accepted-with-modifications, or rejected, with supporting findings and precise file/activity references. Do not modify files or approvals, write accepted history, generate media, author November/P2/P3, create migrations/PRs, mutate databases, merge or deploy. Stop after the verdict.
```
