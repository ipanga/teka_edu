# Pedagogical review

How Teka Edu content is reviewed, the register of reviews performed, and what each decided. The
gate itself is in [`CONTENT_QUALITY_GATE.md`](CONTENT_QUALITY_GATE.md); the decision is
**ADR-047**.

## The current gate

**An independent pedagogical review of a generated Markdown package against the official
programme.** Today that review is performed by **ChatGPT**, outside the product, and submitted by
the product owner. It is an **AI-assisted pedagogical review** — never a teacher's approval, and
both the documentation and the stored record say so.

**A review by a person who teaches this age is optional future external assurance.** It is a
stronger claim, it stays desirable before broad school adoption, and it **does not block**
authoring, new classes, later months or staging.

Roles, kept distinct on purpose:

|                      | Does what                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude Code**      | Authors content from authoritative sources, generates the package, applies corrections. Never approves its own work                             |
| **ChatGPT**          | Reviews the package independently; returns `accepted` / `accepted-with-modifications` / `needs-revision`                                        |
| **Product owner**    | Requests work, submits packages for review, decides direction, tests the live app. Not recorded as a teacher, because that is not what they are |
| **A teacher, later** | Optional external assurance                                                                                                                     |

## Register of reviews

| Batch                                | Date       | Kind                                              | Outcome                                                      | Corrections                                                                            | Status                                                                                                                                                                   |
| ------------------------------------ | ---------- | ------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3ème maternelle, Week 1 (days 1–5)   | 2026-09-14 | AI-assisted (ChatGPT)                             | `accepted-with-modifications`                                | 13 items, all applied                                                                  | `review` — the corrections materially changed the pedagogy, so the regenerated package awaits re-review                                                                  |
| 3ème maternelle, Weeks 2–5           | —          | —                                                 | not yet reviewed                                             | —                                                                                      | `review`                                                                                                                                                                 |
| 1ère maternelle, Week 1 (days 1–4)   | 2026-09-15 | AI-assisted (ChatGPT), 2 passes + re-confirmation | `accepted-with-modifications`                                | pass 1: 9 pedagogical and safety items · pass 2: 2 progression-metadata items          | **`approved`** — 16 lessons. The approval lapsed once when the progression engine changed; re-confirmed after a machine-proven metadata-only diff, with a **new** digest |
| 1ère maternelle, Week 2 (days 5–9)   | 2026-09-15 | AI-assisted (ChatGPT), 2 passes                   | `accepted-with-modifications`                                | pass 1: 6 items · pass 2: 2 items (seed-bag fallback, failure-neutral balance wording) | **`approved`** — 20 lessons                                                                                                                                              |
| 1ère maternelle, Week 3 (days 10–14) | 2026-09-15 | AI-assisted (ChatGPT), 2 passes                   | pass 1 `accepted-with-modifications` → pass 2 **`accepted`** | 8 items, all applied                                                                   | **`approved`** — 20 lessons                                                                                                                                              |
| 1ère maternelle, Week 4 (days 15–19) | 2026-09-15 | AI-assisted (ChatGPT)                             | `accepted-with-modifications`                                | 7 items, all applied                                                                   | `review` — **ready for a short second pass**                                                                                                                             |
| 1ère maternelle, Week 5              | —          | —                                                 | not yet reviewed                                             | —                                                                                      | `review`                                                                                                                                                                 |

**56 lessons are `approved`** — 1ère maternelle Weeks 1, 2 and 3, all `ai-assisted`. The other
120 September lessons remain at `review`: 32 in 1ère (Weeks 4–5) and all 88 in 3ème.
**No teacher has read any of it.**

Progress against the Beta 0.1 gate: **3 of 10 weekly packages accepted**.

### Why Week 1 could be re-confirmed without a third full reading

Its approval lapsed because the progression engine changed the objective metadata the digest
covers — the protection working exactly as ADR-035 intended. It was **not** re-stamped by
weakening that protection. The re-confirmation rests on a machine-proven diff against the exact
content that had been approved (commit `5899d94`): every lesson title, child instruction, parent
guidance, story, rhyme, question, activity order, type, material, duration, difficulty,
vocabulary, English scaffold, illustration and **activity-level objective** was compared, and
**zero** had changed. Only the taught/revisited split, the stage, and the status moved. A fresh
digest was generated; the old one was not reused.

That distinction matters: an approval may only be carried forward when a machine can prove
nothing a reviewer judged has changed. Anything else goes back for reading.

---

## Phase 2.5 pre-review of the pilot week

A structured review of the 20 pilot lessons and 40 activities for 3ème maternelle, done in
Phase 2.5 **by Claude, not by a teacher**. It is a pre-review: it clears away defects so that the
independent reviewer spends their time on judgement, not on typos. Nothing here approves
anything.

- **The content it reviews:** [`review/2026-2027-maternelle-3-semaine-1.md`](review/2026-2027-maternelle-3-semaine-1.md)
- **The gate it feeds:** [`CONTENT_QUALITY_GATE.md`](CONTENT_QUALITY_GATE.md)
- **Status:** all 88 September lessons remain `review`. See the register above.

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
Phase 2's own work and are **fixed in this phase**; the rest are recorded for the reviewer
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

> **Superseded on 2026-09-12 (ADR-039).** The 40 minutes above describe the pilot week as it
> stood at this review. The product decision is now **30 to 45 minutes**, about 35, and the
> September programme runs at 35. The finding is kept as written because it is the record of
> what was reviewed; the split-session recommendation was accepted and implemented as the plan's
> pause point.

## 1ère maternelle, Week 4 review, 2026-09-15 — accepted with modifications

Seven items, all applied to Week 4 and Week 5. The finding that matters beyond this week is
what the corrections could **not** touch.

**Four of the seven defects also exist, identically, in Weeks 1–3 — which are approved.** The
same activity text was authored once and reused across the month, so correcting Week 4's copy
leaves the earlier copies as they were read and signed off:

| Defect                                                            | Approved activities still carrying it |
| ----------------------------------------------------------------- | ------------------------------------- |
| « Ferme les yeux » required rather than offered                   | `m1-lang-10-a2` (day 10)              |
| Generic « Move with me. » English scaffold                        | 12 movement activities, days 1–14     |
| « à trois ans » instead of a developmental band                   | `m1-lang-03-a2` (day 3)               |
| Comprehension answers: pointing/one word not stated as sufficient | `m1-lang-03-a2` (day 3)               |
| Maths advice that reads as contradicting the count to six         | 14 lesson-level notes, days 1–14      |

These were **not** silently fixed. Editing them would change text a reviewer accepted and would
invalidate 56 digests — precisely what ADR-035 exists to prevent. The 13 activity-level cases are
listed in `tests/unit/september.test.ts` as `APPROVED_DEBT`, a list that may only shrink, so the
rules bind all new content while the debt stays visible.

**Deciding what to do about them is the product owner's, not this task's.** Fixing them means
sending Weeks 1–3 back for a short re-confirmation, exactly as Week 1 needed once before.

## 1ère maternelle, Week 3 — approved 2026-09-15 after two passes

Pass 1 returned `accepted-with-modifications` with eight items; after the corrections, pass 2
returned **`accepted`**, and the 20 lessons are `approved` with `reviewKind: ai-assisted`. The
history is kept as it happened — Week 3 was not accepted on its first reading.

The pattern behind most of the eight is worth naming, because it will recur: **an activity was copied, its title changed, and its body left behind.** « Donne-moi
trois » asked for two. « Un, deux, trois, quatre » counted three. « Sur, sous, dans » only did
two of the three. « Ma tête, mon ventre » had inherited the household-object material of a lesson
about doors and buckets, and had spread its target words onto a greeting ritual and a rhyme about
hands and feet.

The sensory activity had drifted differently: it told the child to close their eyes and say what
the object _was_, while the guidance told the adult to ask what it _felt like_, and the lesson
claimed no materials were needed while asking the child to touch two things. It now names two
safe textures, asks « c'est doux, ou c'est rugueux ? », treats closed eyes as an optional game,
and drops « piquant » — the objective is sensory vocabulary, not tolerating discomfort.

Six general validators now hold these, written as rules rather than checks on particular lesson
ids. Two of them had to be narrowed after they produced false positives on 3ème maternelle: a
title may name a quantity that is not a request (« les quatre mots » reviews four words while
asking the child to say one or two), and a lexicon is a _teaching target_, so « courir » may
legitimately appear in an instruction as « cours ». The rule that matched the real defect is
narrower: a sibling activity may not simply inherit the vocabulary activity's word list.

## 1ère maternelle, Week 1 — finalised 2026-09-15 after two passes

|        | Kind        | Outcome                               | What followed                                                                                                                                                                        |
| ------ | ----------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pass 1 | ai-assisted | `accepted-with-modifications`         | 9 items: a level-wide template bug, an objective mismatch, a stale vocabulary example, three safety defaults, a story's causal gap, a comprehension check, a temporal simplification |
| Pass 2 | ai-assisted | `accepted-with-modifications`         | 2 items, both progression metadata; no child-facing text changed                                                                                                                     |
| Final  | ai-assisted | **accepted for Teka Edu development** | 16 lessons `approved`, `reviewKind: ai-assisted`                                                                                                                                     |

**No teacher has read this content.** The approval records the review that actually happened.

The second pass found a subtler class of error than the first, and it is worth naming: the
lesson-level objective lists were **template metadata that had drifted from the activities**. A
day-2 lesson still listed a temporal objective after the activity carrying it had been corrected,
and day 1 filed « dire ou chanter au moins cinq comptines » under _already seen_ while being the
first day the child ever sang one — day 4 then claimed to introduce it.

The fix was not to edit the two lessons. Progression is now derived from the order a child
actually meets the content — day by day, slot by slot, across tracks rather than inside one — and
two validators enforce it: a lesson may not claim an objective no activity works, and nothing may
be listed as _already seen_ before something teaches it. That surfaced **53 stale claims**, 52 of
them in 3ème maternelle, all metadata; no child-facing field changed, and that was verified field
by field rather than asserted.

## 3ème maternelle, Week 1 review, 2026-09-14 — accepted with modifications

ChatGPT reviewed the generated Week 1 package and returned **`accepted-with-modifications`**.
All corrections are applied; the package is regenerated and goes back for a second pass, because
several of them change pedagogy or safety.

The two findings worth carrying forward:

- **A template can be wrong for a whole level at once.** The reviewer's own age question was the
  fixed string « un enfant de 5 ans (3ème maternelle) », so a reviewer of _three-year-olds_ was
  asked sixteen times in one week whether the work suited a five-year-old. It was right when
  written and silently wrong the moment a second level existed. The wording is now derived from
  the level and its band, and a test refuses to let any package name another level.
- **Safety defaults are inherited too.** 3ème maternelle counts with cailloux, capsules and
  haricots, and that material rode into the youngest band, where the same objects are a choking
  risk. A child was also told to push a chair and to run at a wall. Reusing an interaction is
  right; reusing its assumptions about what a child's body can do is not — three tests now hold
  these, because prose did not.

## 3ème maternelle, Week 1 review, 2026-09-14 — accepted with modifications

The generated Week 1 package was submitted to **ChatGPT**, which reviewed it against the official
Cycle 1 programme and returned **`accepted-with-modifications`** with 13 items. **All are
applied**, in the content and in the generator, and the packages were regenerated.

**No lesson became `approved`.** The corrections materially changed the pedagogy — objective
mappings, a redesigned activity, changed guidance — so under the re-review rule
([`CONTENT_QUALITY_GATE.md`](CONTENT_QUALITY_GATE.md)) the corrected package goes back for a
second pass before Week 1 is recorded as accepted. Promoting it on the strength of a review of
the _uncorrected_ text would claim approval for words the reviewer never saw.

What it changed, and what it taught us:

- **A mis-mapped objective repeats.** « Le temps de lecture » claimed
  `LANG-S02-C03-O15` on days 1, 2 and 4 — and, once audited, on all 22 days. The lesson for the
  authoring pipeline is that a ritual copied across a month copies its defects across a month;
  when one instance is wrong, the audit is the whole month, not the days quoted.
- **Do not fix a mapping by changing the pedagogy.** The daily moment is deliberately
  question-free. Adding comprehension questions to justify O15 would have damaged the activity to
  protect a claim. O15 moved instead to the two activities that genuinely link a story to the
  child's life; the ritual took `LANG-S02-C03-O04`, which sustained listening really does build.
- **The annual plan can inherit a wrong claim.** O15 was paced `daily, introduce by day 3`
  because the plan had been fitted to the ritual. When a mapping is corrected, its pacing entry
  must be re-examined in the same change.
- **An earlier band is not a demotion.** `O04` is `before-4`; using it at `from-5` is allowed and
  is the opposite of acceleration. The alternative, `O13`, sits at day 127 in the plan, and
  pulling it forward to make a mapping neat would have been exactly the acceleration ADR-038
  forbids.
- **A generated package can hide the thing being judged.** The reviewer was asked to approve
  « L'histoire de Kumu » and its three questions without being shown either, and official
  excerpts were being cut at their first line. Both are now tested, not just fixed.

Item 3 of _Open questions for a reviewer_ below — whether the daily read-aloud should carry
questions more often — is now a live question with a documented default rather than an
assumption: it stays question-free.

## Open questions for a reviewer

1. Are the 20 lessons appropriate for 5-year-olds in the DRC? (ISSUE-017)
2. Is the daily session realistic in a home, as one block or two? (40 min when this review was
   written; **35 min in the September programme**, within the 30–45 range of ADR-039.)
3. Should the daily read-aloud include comprehension questions more often?
4. Are minor findings m4, m5, m6 and m7 worth changing?
5. Should free play and practical-life content be added before the year is written? (s1, s2)
