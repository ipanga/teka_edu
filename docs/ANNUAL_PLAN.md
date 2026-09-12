# The annual scope and sequence

Which objectives the year introduces, when they come back, and when the child should own them.
Decision: ADR-040. It is **pacing, never content**: no lesson text lives here.

- **The plan:** `content/programmes/maternelle-cycle1-cd-2026/maternelle-3-annual-plan.json`
- **The generator (kept for audit):** `tools/annual-plan/build.ts`
- **The report:** `npm run coverage:report`

## Why it exists

A month of lessons written without a year in view drifts. Counting gets taught in four different
weeks; comparing masses never gets taught at all; nobody notices until the year is over. The plan
makes coverage **provable**: at any instructional day it says what should have been taught by
then, and a test compares that with the lessons that actually exist.

## What it holds

For 3ème maternelle in 2026–2027: **162 objectives** over **189 instructional days**, in six
phases aligned with the school periods.

| Field                                 | Meaning                                                           |
| ------------------------------------- | ----------------------------------------------------------------- |
| `phase`                               | The period it is introduced in (`P1`…`P6`)                        |
| `introduceFromDay` / `introduceByDay` | The window, in instructional days, in which it must be taught     |
| `reinforceUntilDay`                   | Last day of deliberate reinforcement                              |
| `consolidateByDay`                    | By when the child should manage it without help                   |
| `plannedRevisits`                     | How many times the year comes back to it                          |
| `cadence`                             | `daily` (language, mathematics, movement), `frequent`, `periodic` |
| `needsDedicatedLesson` / `embeddable` | Whether it needs a lesson of its own, or rides inside another     |
| `homeFeasibility`                     | `full`, `partial`, `school-only` — see below                      |

## The year's teaching set

The official programme states objectives by **age band**, not by class. 3ème maternelle maps to
`from-5`, so the year's teaching set is the **162 objectives carrying that band**. The other 236
are earlier-band objectives: lessons reinvest them as _supporting_ objectives, but the plan does
not schedule them, because this level is not introducing them.

| Domain     | Planned | Cadence  |
| ---------- | ------- | -------- |
| LANG       | 39      | daily    |
| MATH       | 35      | daily    |
| TIME-SPACE | 29      | frequent |
| ART        | 26      | periodic |
| WORLD      | 18      | periodic |
| PHYS       | 15      | daily    |

## Phases

| Phase | Days    | Focus                                                                      |
| ----- | ------- | -------------------------------------------------------------------------- |
| P1    | 1–47    | Rentrée: speaking French, small quantities, the daily ritual               |
| P2    | 48–79   | Consolidating oral work and quantities; syllable awareness                 |
| P3    | 80–107  | Rhymes, phonemes, first letters; part-whole problems                       |
| P4    | 108–127 | Writing digits and letters; comparing lengths and masses                   |
| P5    | 128–160 | Alphabetic principle and first writing; patterns and landmarks in the year |
| P6    | 161–189 | Consolidation and preparation for primary school — **no new objectives**   |

## The spiral

An objective is not met once and dropped:

```text
Découverte  →  pratique guidée  →  réinvestissement  →  reprise  →  consolidation
```

Daily-cadence objectives plan about twelve revisits, frequent ones eight, periodic ones five, and
an objective introduced late in the year plans fewer — there is less year left to revisit it in.
In September each planned objective appears **6.2 times on average, and never fewer than twice**.

## What a home session cannot carry

Sixteen objectives are marked `partial` or `school-only`, because they assume something a home
does not have: **swimming** (`PHYS-S02-C01-O06`, school-only), **meeting artists**
(`ART-S03-C02-O08`, school-only), singing in a group, collective artwork and staging, attacking
and defending roles, describing what another pupil did, heritage musical works, and the spaces
around the school.

This is recorded rather than hidden. Teka Edu reinforces what an after-school session can carry
and says plainly what it cannot, instead of implying a parent at home can deliver the whole
official programme.

## Reading the plan

```bash
npm run coverage:report                      # the whole year, and what is covered so far
npm run coverage:report -- --day=22          # coverage as at the end of September
```

The report prints objectives per phase and per domain, what is missing against the plan, how
often each has been revisited, anything seen only once, and the home-feasibility list.

## Changing it

The plan is generated: edit `tools/annual-plan/build.ts` and re-run it, rather than hand-editing
the JSON. The September allocation is an explicit table in that file — the rentrée has to teach
what an after-school session can build on, which is a pedagogical judgement, not something to
spread evenly. The rest of the year is spread deterministically and is **expected to be refined**
as each month is authored: it is a plan, not a promise.

Changing the plan changes what the tests require of the content, which is the point.
