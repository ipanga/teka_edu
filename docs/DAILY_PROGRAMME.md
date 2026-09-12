# Daily learning programme

How Teka Edu decides what a child does on a given school day. Decisions: ADR-033, ADR-034.
The calendar is in [`SCHOOL_CALENDAR.md`](SCHOOL_CALENDAR.md), the objectives in
[`CURRICULUM.md`](CURRICULUM.md).

## Inputs and output

```text
instructional day n  (calendar)  ─┐
level programme      (content)   ─┼─▶ generateDailyPlan ─▶ DailyPlan
lessons + activities (content)   ─┘
```

- **Keyed by instructional-day number, not by date** (ADR-004). Day 1 is 1 September 2026; a
  new holiday shifts dates but never the order of learning, so content stays valid.
- **Pure and deterministic:** no clock, no database, no random choice. The same inputs always
  produce the same plan, which a test asserts.
- **Not stored.** A plan is derived from the calendar and the programme definition, like school
  days themselves. Only the definition is content.

## The programme definition

`content/programmes/<curriculum>/<level>.json` is authored, reviewable content:

- `sessionMinutes` — the guided range a day should stay within (30–45 min for 3ème maternelle).
- `rhythm` — a repeating cycle of days; each day lists ordered **slots**, each pointing at a track.
- `tracks` — one ordered sequence of lessons per domain.

The rhythm for 3ème maternelle is five days long:

| Rhythm day | 1       | 2             | 3                 | 4            |
| ---------- | ------- | ------------- | ----------------- | ------------ |
| 1          | langage | mathématiques | activité physique | monde        |
| 2          | langage | mathématiques | activité physique | arts         |
| 3          | langage | mathématiques | activité physique | temps-espace |
| 4          | langage | mathématiques | activité physique | arts         |
| 5          | langage | mathématiques | activité physique | monde        |

## The algorithm

1. The day of the rhythm is `((instructionalDay − 1) mod R) + 1`.
2. Each slot takes the **next lesson of its track**: a track advances by one every time the
   rhythm gives it a slot. Nothing is taught twice and nothing is skipped.
3. A slot whose track has run out is reported as empty (`status: "partial"` or `"no-content"`),
   never filled with a repeat.
4. A date that is not instructional gets `status: "not-instructional"`, no sessions, and the
   calendar's reasons (weekend, holiday, vacation…).

## Where each rule comes from

Rules are separated by authority, because official prescriptions and product choices are not the
same kind of claim.

### Official text (the programme itself)

| Rule                                                                                                | Source                    |
| --------------------------------------------------------------------------------------------------- | ------------------------- |
| "L'éducation physique est quotidienne, d'une durée effective de trente à quarante-cinq minutes"     | Arrêté du 16 avril 2026   |
| A story is read or told at least once a day, plus a daily reading time "sans questionnement"        | Arrêté du 22 octobre 2024 |
| Daily adult–child language interaction; daily vocabulary sessions (three corpora per période in GS) | Arrêté du 22 octobre 2024 |
| Mathematics encountered daily; dedicated problem-solving sessions from mid-cycle                    | Arrêté du 22 octobre 2024 |
| Phonology in short sessions, regularly repeated                                                     | Arrêté du 22 octobre 2024 |
| "Diversifier les formes des exercices proposés en limitant le recours aux fiches"                   | Arrêté du 16 avril 2026   |
| "Leur stabilisation nécessite de nombreuses répétitions dans des conditions variées"                | Arrêté du 16 avril 2026   |
| Memorise comptines, chansons, poésies through repeated exposure                                     | Arrêté du 16 avril 2026   |

In the generator these become: physical activity every day, language every day (ending with the
daily read-aloud), mathematics every day, and no worksheet-style activity type.

**Where the pilot does not yet meet the text.** The official rule is two daily moments: a taught
read-aloud _"et enseigne la compréhension"_, **and** a separate reading _"sans questionnement"_.
The pilot has the pleasure reading every day, but the comprehension read-aloud only once in five
days. A 40-minute home session cannot hold both every day without dropping something else, so
this is recorded as a content decision for the next phase rather than a silent claim of
compliance ([`PEDAGOGICAL_REVIEW.md`](PEDAGOGICAL_REVIEW.md)).

### Official guidance (ministry booklets, not binding)

- éduscol _livrets d'accompagnement_ "à partir de 5 ans" describe taught sessions of about
  **20–30 minutes in a small group**. These are classroom figures with a teacher and 4–6
  children.
- éduscol recommends **screen-free** digital tools for phonological work.
- Opening rituals should stay "courte et dynamique" and not be turned into drill.

### Public-health guidance (French government, non-education)

For ages 3–6, screen use should stay "exceptionnel", limited to quality educational content and
"toujours accompagné par un adulte". **No official numerical daily limit exists.**

### Teka Edu decisions (ours, not prescribed by anyone)

| Decision                                                               | Why                                                                                     |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| A home session of 30–45 min for 3ème maternelle                        | Plan §6; classroom figures are not evidence for a parent-and-child session              |
| Four slots a day: language, mathematics, physical, one rotating domain | Keeps the daily official requirements and still visits all six domains                  |
| A five-day rhythm, rotating arts / world / time-and-space              | Every domain appears within one cycle                                                   |
| Screen time at most half a session, and never the whole session        | Transposes "exceptionnel, accompagné" into a checkable rule                             |
| The same lesson never on two consecutive days                          | Avoids mechanical repetition; official repetition happens "dans des conditions variées" |
| Each activity lasts 2–20 minutes                                       | Keeps a session composable out of short pieces                                          |
| Progression is authored, not computed                                  | A reviewer can read the whole sequence; no adaptive algorithm in Phase 2                |

The validator checks the checkable ones for every generated day, so a content change that breaks
the balance fails CI rather than reaching a child.

### Session model

**30 to 45 minutes per instructional day, about 35** (ADR-039). It is **one session that may be
split in two** — for example language and mathematics after school, movement and the rotating
domain later. The plan carries a **pause point** (`pauseAfterSession`), computed as the session
that first takes the day past its halfway mark: the parent can stop there and finish later.

Teka Edu is **reinforcement, not replacement**: the child's school day remains the main teaching,
and the PNEM's own school week is 17h30. The range is enforced by `checkDailyBalance`, so content
cannot quietly grow past it. Whether 35 minutes is right for a child after a full school day is
still a question for the human reviewer.

### A known divergence: the DRC's own preschool programme

The DRC has a national preschool programme (PNEM, SERNAFOR, 2021) with a weekly grid: 30-minute
slots, 08h30–12h00, free activity closing every day, and **physical activity about twice a week**,
where the French programme requires it daily. Teka Edu follows the French programme (ADR-003)
while using the DRC calendar, so it schedules movement every day. That is a real divergence, not
a harmonisation: it is recorded in ADR-034 and is open for review (PD-016).

## Progression

Progression is expressed in the authored order of each track, and checked:

- An objective is **discovered once** per track. A later lesson that practises, consolidates or
  reviews must work on something taught earlier in the same track.
- A lesson separates what it **teaches** (`objectiveCodes`) from what it **reinvests**
  (`supportingObjectiveCodes`), so a daily ritual does not count as teaching something new.
- Stages: `discovery` → `practice` → `consolidation` → `review`.

Spaced repetition with computed intervals is **not** implemented: no official spacing schedule
exists, and a deterministic authored sequence is enough for Phase 2. The review scheduler
belongs to the progress phase.

## Reading a plan

```bash
npm run programme:report -- --level=maternelle-3 --day=1
npm run programme:report -- --level=maternelle-3 --day=1 --to=5
npm run programme:report -- --level=maternelle-3 --date=2026-09-15
```

```http
GET /api/programme/2026-2027/maternelle-3/1
GET /api/programme/2026-2027/maternelle-3/2026-09-15
```

The response carries the date, the instructional day, the rhythm day, the status, the total and
screen minutes, the materials, and each session with its lesson, activities, objectives (with
their official source and success examples) and optional English scaffolding.

## September 2026 (3ème maternelle)

The first month authored in full: **22 instructional days**, 88 lessons, 170 activities, every
day 35 minutes and 0-6 minutes of screen. The day's shape is language (13 min) + mathematics
(9) + movement (6) + a rotating domain (7); the rotation runs on a ten-day rhythm so that arts,
the world and time-space each get a fair share of the month.

Print any day with `npm run programme:report -- --level=maternelle-3 --day=<n>`, and the month's
coverage against the annual plan with `npm run coverage:report`. The weekly review documents are
in [`review/`](review/).

| Week | Instructional days | Dates           | Theme                                |
| ---- | ------------------ | --------------- | ------------------------------------ |
| 1    | 1–4                | 1–4 September   | La rentrée : moi, l’école, mon corps |
| 2    | 5–9                | 7–11 September  | Ma maison, ma famille, les animaux   |
| 3    | 10–14              | 14–18 September | Les objets et les formes             |
| 4    | 15–19              | 21–25 September | Au marché : quantités et rimes       |
| 5    | 20–22              | 28–30 September | Je montre ce que je sais             |

Each day opens with the ritual — the date, then something brought back — and the last
instructional day of every week consolidates (days 4, 9, 14, 19, 22). October is deliberately
not written: it comes after this month has been reviewed.
