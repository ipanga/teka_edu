# Pedagogical pre-review of the pilot week

A structured review of the 20 pilot lessons and 40 activities for 3ème maternelle, done in
Phase 2.5 **by Claude, not by a teacher**. It is a pre-review: it clears away defects so that the
human reviewer spends their time on judgement, not on typos. Nothing here approves anything.

- **The content it reviews:** [`review/2026-2027-maternelle-3-semaine-1.md`](review/2026-2027-maternelle-3-semaine-1.md)
- **The gate it feeds:** [`CONTENT_QUALITY_GATE.md`](CONTENT_QUALITY_GATE.md)
- **Status:** all 20 lessons remain `review`. ISSUE-017 stays open until a person who teaches
  this age has read them.

## Rubric

Each lesson and activity was judged on thirteen criteria, and each finding given a severity.

| Criterion            | Question                                                        |
| -------------------- | --------------------------------------------------------------- |
| Objective alignment  | Does the activity exercise the objective it claims?             |
| Age appropriateness  | Is it realistic at 5 years old?                                 |
| Instruction clarity  | Can the adult follow it? Can the child understand the consigne? |
| Cognitive load       | Too easy, too hard, or right?                                   |
| Duration             | Is the stated time realistic?                                   |
| Engagement           | Is the child doing, not watching?                               |
| Physical balance     | Does the day avoid sitting and screens too long?                |
| Repetition           | Is important learning revisited?                                |
| Progression          | Does difficulty grow sensibly?                                  |
| Language acquisition | Does it build French usefully?                                  |
| Cultural relevance   | Does it work in a Congolese home, urban or rural?               |
| Materials            | Can a family find the material, or something like it?           |
| Safety               | Is it safe for a preschool child?                               |

| Severity     | Meaning                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `BLOCKER`    | Educationally inappropriate, unsafe, factually wrong, or falsely attributed to an official objective |
| `MAJOR`      | Substantially misses its objective, or is badly calibrated for the age                               |
| `MINOR`      | Wording, duration or material to improve                                                             |
| `SUGGESTION` | Optional improvement                                                                                 |

## Result

**0 blockers · 3 major · 7 minor · 4 suggestions.** The three major findings were defects in
Phase 2's own work and are **fixed in this phase**; the rest are recorded for the human reviewer
or for the next content phase.

### Major findings (all fixed here)

**M1 — Success examples implied a link the official text does not make.** The API and the report
showed "réussites attendues" next to a single activity, taking the first examples of the
competency. For the greeting activity this displayed _"Pour acheter les fruits du gouter, il
faudrait compter les élèves de la classe"_ — an example of a different objective. The official
tables attach examples to a **competency and age band**, never to one objective.
_Fixed:_ the API field is now `competencySuccessExamples`, carries the competency code and title,
and the review package shows them once per competency with an explicit note that they illustrate
the whole competency and are not exhaustive.

**M2 — The pilot over-declared screen dependence.** Three activities were marked as needing a
screen while their own adult guidance had the adult tell the story, sing the rhyme, or point at
real people. `mode` describes what the **child** does, so these were wrong, and they inflated
screen time in a product for five-year-olds.
_Fixed:_ `m3-lang-01-a2`, `m3-lang-03-a1` and `m3-art-02-a1` are now `off-screen` with no screen
material. Daily screen time across the pilot week fell from 5–13 min to 0–6 min.

**M3 — An objective was claimed but barely exercised.** "Bonjour ! Je me présente" claimed
`LANG-S01-C02-O01` _Diversifier les pronoms employés_, but the activity only ever elicited _je_.
_Fixed:_ the adult guidance and prompts now bring in a third person ("Et ton frère, que
fait-il ?"), which is what the objective asks for.

### Minor findings

| #   | Finding                                                                                                                                                  | Disposition                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| m1  | The consigne "Range les objets : ceux qui servent à écrire, ceux qui servent à porter, ceux qui servent à s'asseoir" is long for a child learning French | Shortened to "Range les objets en trois tas : pour écrire, pour porter, pour s'asseoir."                                                           |
| m2  | Materials named one object ("cailloux") with no stated alternative                                                                                       | Every material now carries `alternatives`; the review package and the plan show them                                                               |
| m3  | Small objects to count are a choking risk with younger siblings around                                                                                   | `safetyNote` added to `petits-objets`, `objets-maison` and `espace-degage`, shown to the parent                                                    |
| m4  | Sorting household objects "by shape" is awkward: a cushion is not a square                                                                               | Left for the reviewer: the activity works with faces of objects, but paper shapes would be cleaner                                                 |
| m5  | The counting rhyme mentions cherries, not a Congolese fruit                                                                                              | Left as is: it is a traditional French rhyme, and the guidance already invites a family comptine instead. A sourced local comptine would be better |
| m6  | "Dis le mot sans sa première syllabe" is demanding at the very start of the year                                                                         | Left for the reviewer: it is a `from-5` objective and the guidance allows failure                                                                  |
| m7  | Day 4 is 40 min with two phonology activities in a row                                                                                                   | Left for the reviewer                                                                                                                              |

### Suggestions

- **s1 — Free play.** The PNEM gives _activités libres_ 2h30 a week, its largest block, closing
  every day. Teka Edu has no equivalent. Adding a short "jeu libre" closing suggestion would
  match both programmes ("Apprendre en jouant").
- **s2 — Practical life and hygiene.** The PNEM timetables _vie pratique_ and _promotion de la
  santé_ weekly; the pilot touches health once. Worth a track when content scales.
- **s3 — A comprehension read-aloud every day** (see below).
- **s4 — Local songs and stories**, sourced rather than invented, for the arts track.

## The daily read-aloud, checked against the text

The Phase 2 documentation said the daily read-aloud implements an official rule. Checked against
the 2024 language annex, the official text asks for **two distinct things every day**:

> « **Au moins une fois par jour**, le professeur lit une histoire et/ou un texte documentaire aux
> élèves **et enseigne la compréhension** afin de susciter chez les élèves le gout et le plaisir de
> la lecture… »

> « **Quotidiennement**, le professeur offre à ses élèves un temps de lecture, **sans
> questionnement**, dont le seul objectif est de développer le plaisir de lire. »

So: a taught read-aloud **with comprehension work**, at least daily, **and** a separate daily
reading for pleasure with no questions.

**What the pilot does:** the pleasure reading is there every day (3 min, no questions) ✓. The
comprehension read-aloud appears **once in five days** (day 3, _Kumu, le petit poussin_) ✗.

**Finding (MAJOR, not fixed here):** the gap is real, but closing it is a content decision, not a
defect to patch silently before review. A 40-minute home session cannot hold a full daily
comprehension read-aloud without dropping something else, and the official rule describes a
school day. **Recommendation for the next content phase:** alternate the daily read-aloud —
questions on some days, pure pleasure on others — or extend the language block on days without a
story lesson. The documentation in [`DAILY_PROGRAMME.md`](DAILY_PROGRAMME.md) now states the rule
and the gap instead of implying full compliance.

## French acquisition, for a child arriving from English

- **Vocabulary load:** 8 new words on day 1, 5 on day 2, 5 on day 3, 0 on day 4 (phonology), 3 on
  day 5. Reasonable, and below the official expectation of three taught corpora per période.
- **Sentence length:** consignes are one or two short sentences; the one long consigne was
  shortened (m1).
- **Comprehension before production:** the pattern is right — the adult models, the child
  repeats, then produces. Guidance says to reformulate rather than correct, which is what the
  official text asks.
- **English scaffolds:** 39 of 40 activities carry one short English sentence. They are accurate,
  and none replaces the French. **Risk:** offered on everything, they invite a child to wait for
  the English. **Recommended rule for Phase 4** (needs the child profile, so not implemented):
  show a scaffold only when `frenchSupportLevel` is `beginner` or `developing`, only after the
  child has heard the French twice, and never for an instruction the child has already met.
- **Pronunciation:** the child speaks in most activities; audio models arrive with the media
  work in Phase 3.

## Rhythm and session model

The pilot's day is language + mathematics + physical + one rotating domain, 40–41 minutes.

- **Daily language, mathematics and movement** are each backed by official text (see
  [`DAILY_PROGRAMME.md`](DAILY_PROGRAMME.md)). Keep.
- **Rotating arts, world and time-space** get 8 minutes every two to three days. Thin against the
  PNEM's weekly grid (arts alone gets 2h/week there), but defensible for a home reinforcement
  session that cannot mirror a school day.
- **Recommended session model (unchanged duration):** 40 minutes as **one session that may be
  split in two** — for example language and mathematics after school, movement and the rotating
  domain later. Teka Edu is **reinforcement, not replacement**: the child's school day remains
  the main teaching. This is stated for the reviewer to confirm.

## What the human reviewer must decide

1. Are the 20 lessons appropriate for 5-year-olds in the DRC? (ISSUE-017)
2. Is 40 minutes a day realistic in a home, as one block or two?
3. Should the daily read-aloud include comprehension questions more often?
4. Are minor findings m4, m5, m6 and m7 worth changing?
5. Should free play and practical-life content be added before the year is written? (s1, s2)
