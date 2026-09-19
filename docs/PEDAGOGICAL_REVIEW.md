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

| Batch                                | Date             | Kind                                             | Outcome                                                          | Corrections                    | Status                      |
| ------------------------------------ | ---------------- | ------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------ | --------------------------- |
| 3ème maternelle, Week 1 (days 1–4)   | 2026-09-14 → -17 | AI-assisted (ChatGPT), 4 passes                  | pass 1-3 `accepted-with-modifications` → pass 4 **`accepted`**   | 13, then 6, then 2             | **`approved`** — 16 lessons |
| 3ème maternelle, Week 2 (days 5–9)   | 2026-09-17 → -19 | AI-assisted (ChatGPT), 4 passes                  | passes 1-3 `accepted-with-modifications` → pass 4 **`accepted`** | 14, then 4, then 2, then 1     | **`approved`** — 20 lessons |
| 3ème maternelle, Weeks 3–5           | —                | —                                                | not yet reviewed                                                 | inherited corrections only     | `review` — 0 approved       |
| 1ère maternelle, Week 1 (days 1–4)   | 2026-09-15       | AI-assisted (ChatGPT), 2 passes + reconfirmation | **`accepted`**                                                   | 11 items across the passes     | **`approved`** — 16 lessons |
| 1ère maternelle, Week 2 (days 5–9)   | 2026-09-15       | AI-assisted (ChatGPT), 2 passes + reconfirmation | **`accepted`**                                                   | 8 items                        | **`approved`** — 20 lessons |
| 1ère maternelle, Week 3 (days 10–14) | 2026-09-15       | AI-assisted (ChatGPT), 2 passes + reconfirmation | **`accepted`**                                                   | 8 items                        | **`approved`** — 20 lessons |
| 1ère maternelle, Week 4 (days 15–19) | 2026-09-15       | AI-assisted (ChatGPT), 2 passes                  | **`accepted`**                                                   | 8 items (7 + the Lisa picture) | **`approved`** — 20 lessons |
| 1ère maternelle, Week 5 (days 20–22) | 2026-09-15       | AI-assisted (ChatGPT), 2 passes                  | pass 1 `accepted-with-modifications` → pass 2 **`accepted`**     | 5 items                        | **`approved`** — 12 lessons |

**1ère maternelle September is complete: 88 of 88 lessons `approved`.** 3ème maternelle's Week 1
has Weeks 1 and 2 `approved` — **36 of 88** — leaving Weeks 3–5 (52 lessons) at `review`. Every approval
is `ai-assisted` and `accepted`. **No teacher has read any of it.**

Progress against the Beta 0.1 gate: **7 of 10 weekly packages accepted** — all five of 1ère
maternelle, plus 3ème Weeks 1 and 2. **3ème maternelle Weeks 3–5 are the remaining gate.**

## 3ème maternelle, Week 1 review, 2026-09-16 — accepted with modifications (pass 2)

ChatGPT read the regenerated package and accepted the week again with modifications. The
structure, the 35-minute day, the four-lesson rhythm, the stories, the rituals, the safety model
and the home-learning model were **accepted and deliberately not rewritten**. What it found was
five objectives attached to activities that do not work them, and one sentence the generator
prints that contradicts its own number.

| #   | Where                  | The claim                                              | Why it was wrong                                                                        |
| --- | ---------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| 1   | `m3-math-01-a1` day 1  | « Constituer une collection d’un cardinal donné »      | The child counts a set the adult has already laid out. Counting is not constituting.    |
| 2   | `m3-math-01-a2` day 1  | only « Dénombrer une collection »                      | This is the activity that builds a requested quantity, and it did not say so.           |
| 3   | `m3-world-01-a1` day 1 | « Se représenter avec un corps articulé en mouvement » | The child finds and moves their joints. Nothing is represented.                         |
| 4   | `m3-math-03-a2` day 3  | only « Décrire et nommer »                             | Sorting is the classifying, and the classification objective was on the other activity. |
| 5   | `m3-lang-04-a1` day 4  | « Scander les syllabes d’un mot »                      | The ritual says the date and recalls the week. There is no syllable task in it.         |
| 6   | `m3-math-04-a2` day 4  | only « la comptine numérique »                         | « Le tas de dix » builds a collection of ten and counts it.                             |

**The geometry lesson needed more than a remapping.** `MATH-S03-C01-O07` asks the child to
classify plane shapes _« indépendamment d’autres critères comme la couleur, la taille,
l’orientation »_, and the lesson offered one exemplar of each shape — one size, one colour, one
orientation. That teaches the prototype the objective exists to prevent. The preparation now asks
the adult for two or three of each shape, of different sizes and laid in different directions, and
the screen shows a second exemplar of each: a square on its point, a rectangle standing up, a
triangle with three unequal sides, a smaller disk. **Each variant wears the colour of a different
shape**, so colour cannot become the cue. No technical vocabulary reaches the child.

Fixing the pictures exposed a defect in the app itself: the « Montre : le carré » game compared the
tapped picture's asset id with the wanted one, so the tilted square would have been called a wrong
answer. It now compares what the picture _is_ — a tilted square is a square, and the child is told
so.

### The same five defects, elsewhere in September

Each finding was a class, not a one-off, and the regression tests are written as rules, so every
occurrence had to be corrected or the rules would not hold. **Eleven further activities** in
Weeks 2–5 carried the identical mistake — six rituals claiming a phonological-awareness objective
with no phonological task, three piles-of-N claiming only the counting rhyme, two more
body-identification activities claiming representation, and the day-5 twin of the day-1 inversion.

**Every one was free to correct**: in each case the right activity was a sibling in the _same
lesson_ on the _same day_, so no lesson-level objective list, no first-taught day, no progression
stage and no coverage figure moved. Machine-checked: 26 fields changed out of 3,084 compared
across 88 lessons. **No approved 1ère maternelle lesson uses any of these objective codes**, so no
approval digest lapsed.

These are corrections forced by the rules, recorded in each week's review history. **They are not
a review of those weeks** — Weeks 2–5 still await their own first pass.

### Two mappings reported, deliberately not changed

`m3-math-06-a2` (« Compte les miens, puis compte les tiens », day 6) and `m3-math-20-a1`
(« Compte les objets… combien en ai-je enlevé ? », day 20) both claim « Constituer une collection
d’un cardinal donné » while the child only counts. `m3-math-20-a2`, which does reconstitute the
collection, claims it not at all — the same inversion again. They are **left as they are**: the
rules did not force them, ChatGPT has not read those weeks, and guessing at a mapping it has not
judged would be authoring a review rather than applying one. They belong to Weeks 2 and 4's own
first pass.

---

## 3ème maternelle, Week 1 review, 2026-09-17 — accepted with modifications (pass 3)

ChatGPT confirmed that the five pedagogical corrections of pass 2 were correctly applied: the
mathematics mappings, the identify-versus-represent split, the phonology ritual, the sorting
objective and the screen-time wording. The week's structure, stories, durations, language level,
English scaffolding, progression and home-learning model remain accepted and were not rewritten.
Two narrow issues remained.

### Who moves the furniture

Two movement activities still told the adult to have the **child** clear the space:

| Activity              | Was                                                                                            | Now                                                                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `m3-phys-01-a1` day 1 | « Dégagez l’espace avec l’enfant : c’est lui qui écarte la chaise. »                           | « Dégagez l’espace vous-même : **c’est vous qui déplacez les chaises et les meubles**. L’enfant aide en portant ce qui est léger et sans risque — un coussin, un pagne, un jouet. » |
| `m3-phys-02-a1` day 2 | « Refaites l’espace dégagé **avec l’enfant**, comme hier : c’est lui qui écarte ce qui gêne. » | « Refaites l’espace dégagé comme hier : **c’est vous qui déplacez les chaises et les meubles**, l’enfant aide avec ce qui est léger — un coussin, un pagne. »                       |

A chair is light in one home and heavy or unstable in another, and « ce qui gêne » is whatever
happens to be there. A product used in homes it cannot see does not hand a five-year-old an
object of unknown weight. The running, the stopping rule and the endurance work are unchanged;
no fear-based language and no extra warnings were added.

**Audited across all of September, 3ème maternelle.** Every occurrence of « écarte / déplace /
dégage / meuble / chaise / obstacle » in a parent guidance, adult guidance or child instruction
was inspected. **These two activities were the only ones affected**, both in Week 1. Deliberately
left alone: `m3-phys-06` (the adult installs the course, the child passes _under_ a chair),
`m3-phys-14` (the adult lays the cloths), `m3-time-01-a2` (the child moves a pebble marker),
`m3-math-13` (the child counts chairs). So there is nothing for Weeks 2–5 to carry.

### A document that offered an approval nobody had performed

The cross-week document asserted that the weeks it covered « avaient été acceptées » and closed
by offering to restore them to `approved`. That text was written while reconfirming 1ère
maternelle, whose weeks really had been approved and really did lapse. Generated for 3ème
maternelle it was false twice over: **no 3ème week has ever been approved, and four of them have
never been read at all.**

The generator now derives its wording from canonical state (`weekReviewState`, in
`domain/lessons/review.ts`):

| State            | What the document may say                                       |
| ---------------- | --------------------------------------------------------------- |
| `approved`       | approval lapsed; may be restored once the changes are confirmed |
| `reviewed`       | a change audit since the last pass; no approval to restore      |
| `never-reviewed` | never read; confirming these changes approves nothing           |
| `draft`          | still being written; no decision asked                          |

Telling a `full-review` from a `consequence` used to depend on reading the `reviewer` string, so
four unread weeks looked reviewed. `scope` is now a field on every history entry, and the
question is answered from data.

The file is named for what it is: `…-audit-des-changements.md` when no week is approved,
`…-reconfirmation.md` when one is. The misleading
`2026-2027-maternelle-3-semaines-1-5-reconfirmation.md` was **removed**, not left beside its
replacement.

---

## 3ème maternelle, Week 1 — approved 2026-09-17 after four passes

ChatGPT's final confirmation, against the Cycle 1 programme applicable in 2026–2027 (arrêté du
16 avril 2026, with the arrêtés du 22 octobre 2024 for language and mathematics), concluded
**`accepted`**. The two safety corrections were judged satisfactory and required no further pass.
**The 16 lessons of Week 1 are now `approved`.**

The history is kept as it happened: passes 1–3 were `accepted-with-modifications`, and only the
fourth accepted. Nothing was rewritten to make the earlier passes look cleaner, and the review
stays `ai-assisted` — **no teacher has read this content** (ISSUE-017).

**The promotion is reproducible from canonical content.** `scripts/approve-week.ts` refuses more
than it does:

- it approves only a week whose history holds a **`full-review` that concluded `accepted`**. A
  `consequence` entry — a correction inherited from another week — never qualifies, and neither
  does `accepted-with-modifications`. Run against Weeks 2–5 it refuses all four;
- every `reviewedDigest` is **computed** by `lessonDigest`, including the fingerprint of every
  picture the lesson shows. The 16 digests are distinct, none is shared with 1ère maternelle, and
  each recomputes exactly from the content;
- it refuses a week that is not entirely at `review`, so it cannot silently re-stamp.

That matters because the five weeks approved before it existed were promoted by hand, which is
how an approval twice came to sit on lessons whose reviewed text had since changed.

### What the audit did not do

The 28-field cross-week change audit is **confirmed as a change audit**. It approves nothing.
Weeks 2–5 keep their inherited corrections and their history entries, have **no `accepted`
full-review entry, no approval digest and no approved lesson**, and their own complete review
packages — which already carry those corrections and say plainly that the week has never been
read — remain to be done.

A pgTAP fixture had to be repaired on the way: four constraint assertions used `m3-lang-01` as a
lesson that could not legally be approved. Once Week 1 was approved the constraint stopped
firing and the four passed vacuously — measuring the content rather than the constraint. The
block now resets its subject inside its own transaction, so it says the same thing whatever has
been approved since.

---

## 3ème maternelle, Week 2 review, 2026-09-17 — accepted with modifications (first pass)

The week's first complete pedagogical review. **Structurally sound, no rewrite**: rhythm,
durations, stories, progression and the home-learning model are accepted. Fourteen corrections
were asked for, and all were applied. **The 20 lessons stay `review`; none is approved.**

### Objectives carried by the wrong activity

The recurring shape of it: one lesson, two activities, and the objective list copied across both.

| Activity                                    | Was                             | Now                                                     |
| ------------------------------------------- | ------------------------------- | ------------------------------------------------------- |
| `m3-world-02-a1` _Les parties de l'animal_  | `O08 + O10`                     | `O08` — morphology only                                 |
| `m3-world-02-a2` _De quoi a-t-il besoin ?_  | `O08`                           | `O10` — needs only                                      |
| `m3-world-03-a1` _Les parties de la plante_ | `O10 + O08`                     | `O08`                                                   |
| `m3-lang-07-a1` ritual (claps syllables)    | `LANG-S01-C01-O03` (vocabulary) | `LANG-S02-C01-O03` (syllables)                          |
| `m3-lang-09-a1` ritual                      | `+ LANG-S02-C03-O14` (emotions) | date only — O14 stays on _Comment se sent Bibi ?_       |
| `m3-math-06-a2` _Vérifions en comptant_     | `O21`                           | `O20 + O05` — it counts both rows and compares          |
| `m3-math-09-a2` _Plus, moins, autant_       | `O20`                           | `O05 + O20` — comparison is the work; counting verifies |

### Safety, clarity and language

- **The obstacle course is soft now.** `m3-phys-06-a1` no longer sends the child under a chair or
  over a stick: they pass under a cloth the adult holds, round a cushion, over a strip laid flat.
  If furniture is in the way, the adult moves it. `m3-phys-05-a1` asks only for a floor marker
  instead of the household-objects box, which is where the chairs and the stick live.
- **« Va toucher la fenêtre » became « Montre-moi la fenêtre du doigt ».** The work is naming, not
  contact with glass or a cooking pot.
- **The cat game names its roles.** « Tu me sauves / tu me cherches » was ambiguous about who
  chases whom; the rule now says who is the cat, who is the mouse, and when they swap. No score,
  no winner.
- **One day at a time.** « Dis-moi ce que tu fais chaque jour de la semaine » sounded like all
  seven; the guidance always worked one.
- **Forced repetition replaced by reformulation.** « Exigez la phrase entière » becomes: invite a
  sentence, accept what comes, reformulate once, do not make the child repeat. « à sa droite »
  left the guidance of a lesson that does not teach left and right.
- **No formal arithmetic in a story.** _Les trois cailloux de Tito_ kept its reasoning about
  quantities and lost « moins un, ça fait deux ».
- **Biological needs stated carefully**: food, water and somewhere to live; water, light and air,
  with soil as the usual support rather than a fourth universal need.
- **Shape invariance on screen as well as on paper**: _La même forme_ shows the eight Week 1
  exemplars, and says that neither colour nor size nor orientation tells you which shape it is.
- **`ils` left a lexicon** that only ever asks for `il` and `elle`.

### Two occurrences outside Week 2

`m3-lang-15-a1` (day 15) claimed the emotions objective on a ritual that claps syllables — the
same defect as `m3-lang-09-a1`. Corrected: the objective stays on _Nsimba a peur, puis ça va
mieux_, in the same lesson. Nothing else moved. The Tito story is also read on days 14 and 18, so
Weeks 3 and 4 carry that change too. Both are recorded as `consequence` entries. **They are not
reviews of those weeks.**

**Reported, deliberately not changed:** `m3-world-06-a2` (« Regarde-le bien et dis-moi ce que tu
remarques ») claims the biological-needs objective while asking only for observation. Removing it
would leave the activity with no objective at all, and choosing its replacement is a pedagogical
judgement about a week ChatGPT has not read. It belongs to that week's own first pass.

---

## 3ème maternelle, Week 2 review, 2026-09-18 — accepted with modifications (pass 2)

The first-pass corrections were verified as materially correct. Four small mapping defects
remained, all the same family: **an activity carrying an objective its neighbour works.**

| Activity                                    | Was                  | Now                                                               |
| ------------------------------------------- | -------------------- | ----------------------------------------------------------------- |
| `m3-lang-05-a1` day-5 ritual                | `+ LANG-S01-C04-O11` | date only — O11 stays on _D'abord, ensuite, après_                |
| `m3-time-02-a1` _Le jour de quoi ?_         | `+ TIME-SPACE-O12`   | `O10` only — the child situates an event, does not state the date |
| `m3-math-08-a2` _Des formes dans la maison_ | `MATH-O07`           | **`O07 + O08`** — the child says the shape's name                 |
| `m3-math-09-a1` _Le jeu du combien_         | `+ MATH-O05`         | `O20` only — it counts, it does not compare                       |

**Nothing was moved to preserve a count.** Removing the date objective from `m3-time-02-a1` left
its lesson claiming an objective no activity worked, so it left the lesson's list too rather than
being recollected onto the neighbouring activity. The validator caught that immediately.

### What became a rule, and what stayed a pinned test

Two of the four generalise cleanly and are now corpus rules: **« énoncer la date »** is tied to
the activities that ask for it _in both directions_ (25 activities, 0 exceptions), and **naming a
shape** requires the naming objective.

The conversation objective does not. « Participer à une conversation … et reformuler son propos »
is real work in a describing game and in talking about what a character feels, and not real work
in « dis la date, puis nomme un animal ». Every predicate tried either cleared the ritual or
condemned four legitimate activities. **It stays a targeted test on the case the reviewer found**,
because a rule that is wrong four times out of five is worse than no rule.

---

## The approval digest now covers the story, 2026-09-18 (ISSUE-026)

An activity names a story by id. The digest covered the id, and the bytes of the picture the story
carries — but not the story. **A story could be rewritten under a standing approval and nothing
would object**: the lesson was byte-identical and the reviewer's digest still matched.

Proved against the old implementation: rewriting a story left the old digest unchanged at
`f376980e96ef6e90`, and moves the new one from `364846d9fa84c689` to `42c0708ec69e1f2e`.

**31 of 104 approvals lapsed** — exactly the approved lessons that read a text. The other 73 were
untouched, because they read nothing.

**None was rubber-stamped.** `scripts/restamp-digests.ts` answers, per lesson, which of the two
changed — the definition or the content:

- it finds the commit that wrote the lesson's stored digest, which is the revision the reviewer's
  decision was recorded against;
- it compares every approval-relevant field at that revision with the content now, plus the kind,
  description and bytes of every picture, plus the kind, title and lines of every story;
- it re-stamps **only** on proven identity, and reports anything else for re-review.

**104 of 104 proven identical. 0 held back.** The tool was tested by rewriting an approved
lesson's story and confirming it refuses to re-stamp. The pedagogical decision — who reviewed,
what they concluded, when — is carried over untouched, because no new reading happened: only the
definition of what an approval covers got stronger. Recorded as `consequence` entries for 1ère
Weeks 1–5 and 3ème Week 1, never as new readings.

---

## 3ème maternelle, Week 2 review, 2026-09-19 — accepted with modifications (pass 3)

The four mapping corrections of pass 2 were confirmed, and the ISSUE-026 approval-integrity work
was reviewed and accepted in principle. Two inconsistencies remained, both about a lesson saying
one thing and its activity doing another.

**The reference frame drifted.** `m3-time-03` claims _« Situer des objets par rapport à soi »_,
its summary and parent guidance say everything is said relative to the child's body, and its
first activity does exactly that. The second had slipped to object-to-object: the adult put the
object « quelque part » and reformulated « il est derrière **la chaise** ». It is now the child's
body again — the adult places the object in front of, behind and beside the child, and reformulates
« Oui, il est derrière **toi** ».

|       | Was                                                                                              | Now                                                                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Child | « Dis-moi où est l'objet, sans le montrer du doigt. »                                            | « Dis-moi où est l'objet **par rapport à toi**, sans le montrer du doigt. »                                                                                 |
| Adult | places the object « quelque part »; invites a full sentence; reformulates « derrière la chaise » | places it in front of / behind / beside **the child**; « Derrière moi » is a good answer; reformulates once « Oui, il est derrière **toi** », no repetition |

No left or right, no new objective: `TIME-SPACE-S02-C01-O16` stands.

**The guidance described one question of three.** `m3-lang-09-a2` asks three emotion questions —
when Bibi finds the garden, when mama Lelo arrives, and at the end — but the adult guidance walked
through only the middle one and then jumped to the child's own experience. It now names the three
in story order, accepts a word, a gesture or a short answer, reformulates without asking for
repetition, and connects to the child only afterwards. **The story, the three questions and the
seven minutes are unchanged.**

### The gate that proved nothing else moved

Regenerating and diffing against the package ChatGPT reviewed: **4 changed fields out of 3,084
compared across 88 lessons** — three on `m3-time-03-a2` (child instruction, adult guidance,
English scaffold) and one on `m3-lang-09-a2` (adult guidance). Nothing else, child-facing or
otherwise. Both lessons' digests moved, as they must; **no standing approval lapsed**, because
neither lesson is approved and nothing they depend on changed for anyone else.

---

## 3ème maternelle, Week 2 — approved 2026-09-19 after four passes

ChatGPT's final review concluded **`accepted`**. **The 20 lessons of Week 2 are now `approved`**,
bringing 3ème maternelle to **36 of 88**.

The history is kept as it happened — three passes concluded `accepted-with-modifications` and only
the fourth accepted, and nothing was rewritten to make the earlier ones look cleaner:

| Pass | Date       | Outcome                       | Asked for                                 |
| ---- | ---------- | ----------------------------- | ----------------------------------------- |
| —    | 2026-09-16 | inherited change              | corrections from Week 1's review          |
| 1    | 2026-09-17 | `accepted-with-modifications` | 14 items                                  |
| 2    | 2026-09-18 | `accepted-with-modifications` | 4 mapping defects                         |
| 3    | 2026-09-19 | `accepted-with-modifications` | the spatial frame, Bibi's three questions |
| 4    | 2026-09-19 | **`accepted`**                | one English scaffold                      |

The last pass asked for a single editorial change. « Tell me where the object is **compared to
you**, without pointing » is not how anyone says it, and « compared to » is ambiguous for a spatial
relation. It became « Tell me where the object is: **in front of you, behind you, or beside you.**
Don't point. » — which is what the French consigne says. Nothing else moved: **1 changed field out
of 3,084 compared across 88 lessons.**

The review stays `ai-assisted`. **No teacher has read any of this** (ISSUE-017).

### The approval, and what it now covers

Promoted by `scripts/approve-week.ts`, which refuses a week without a `full-review` that concluded
`accepted` — run against Weeks 3, 4 and 5 it still refuses all three. Every digest was computed,
never copied: **124 approved lessons, 124 distinct digests, 0 lapsed.**

Since ISSUE-026 those digests cover the words of the story a lesson reads as well as the bytes of
its pictures, and both fail closed. Verified again here: changing the English scaffold moved
`m3-time-03`'s digest; rewriting Bibi's story moves `m3-lang-09`'s and leaves `m3-time-03` alone;
an unresolvable text or picture throws rather than degrading.

---

## Where the review history lives

Each weekly review is now recorded in `content/reviews/history.json` and **rendered into the
package itself**, so a reviewer opening a week for the second time is told what the first pass
asked for and what has changed since — including changes that arrived as a consequence of some
other week's review, which would otherwise reach them unannounced. The register below stays as
the human summary.

**Who approved these.** The decision was ChatGPT's, on the regenerated packages and on a compact
reconfirmation document; Claude Code authored the content and applied the corrections and may not
approve its own work (ADR-047). The `reviewer` field records ChatGPT, and the notes record how
many passes each week took and what each one asked for.

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

## 1ère maternelle, Week 5 review, 2026-09-15 — accepted with modifications

Five items, all applied, all confined to days 20–22. The week was already a true consolidation
period — 0 new objectives, 15 revisited — and remains one.

Two of the five are the same fault the month has produced repeatedly: **an instruction that does
not say what to do.** « Prends le crayon et trace avec moi » never named a gesture, which is fine
for a teacher and useless to a parent; it now asks for vertical strokes, top to bottom, and says
that a scribble is not a failure. « Tous les mots du mois » declared cushions, a chair, a stick
and a cloth as its material while reviewing _door, bucket, hand, head_ — the four pictures it
already carried were the material all along.

Two are contradictions between an activity and its own guidance: « Tout mon corps » asked for four
body parts while the guidance said two are enough (now: two first, the other two only if the child
is still with you), and « Tout ce que je sais compter » declared objects and showed a spoon for a
task that is purely reciting to six. That last one matters beyond the activity: saying the number
sequence and enumerating a collection are different learnings, September only does the first, and
a test now refuses to let a pure oral-sequence activity be dressed as a six-object collection.

The fifth is a genuine alignment question rather than a slip. « Je choisis mon jeu » claimed
« éprouver le plaisir de jouer dans le respect des autres et des règles communes » while only
offering a choice. **The objective was kept and the activity made to earn it**: the child chooses,
then the adult announces one simple shared rule — wait for « vas-y », take turns throwing, wait
until the line is clear — and plays along. No winner, no score. Remapping to a weaker objective
would have been the easier fix and the less honest one.

## The approval digest now covers the picture itself, 2026-09-15

Adding `mediaIds` to the digest was necessary and not sufficient, and the reviewer said so: **an
asset can be redrawn while keeping its id.** That is not hypothetical — `histoire-seau-lisa` kept
its id while being redrawn to put Lisa into it, which is exactly the kind of change an approval
must not survive silently.

So a referenced picture now contributes its **content** to the digest:

```text
mediaId  →  kind | French description | sha256 of the file's bytes
```

- The hash is written into `content/media/registry.json` by `tools/media/build.ts` and **checked
  against the file** by content validation. An asset that has drifted from its recorded hash, or
  that cannot be read, or whose path escapes `public/media/`, **fails validation**.
- A lesson depends only on the pictures it references — including the one a story carries — so
  redrawing an unrelated asset does not invalidate the curriculum.
- A missing fingerprint **throws**. A digest that quietly ignores an unknown picture is worse than
  no digest.

Seven tests hold it: stable when nothing moves, different when the bytes change, different when
the description changes, different when the lesson points elsewhere, unchanged when an unrelated
asset changes, throwing when the asset is missing, and covering a story's illustration rather than
only the ids an activity names.

## The approved-weeks debt, resolved 2026-09-15

The Week 4 review exposed defects that Weeks 1–3 carried identically, because the same activity
text had been authored once and reused across the month. The product owner decided they should be
corrected **before** Beta 0.1 rather than shipped because their digests happened to be approved.

**31 occurrences were corrected**, re-derived from canonical content rather than trusted from the
earlier estimate: 14 lesson notes blurring the two mathematics rules, 12 generic English
scaffolds, one required « ferme les yeux », one fixed age, one missing comprehension-response
rule, and the two Lisa activities. A machine-checked diff found **0 unexpected substantive
changes** across 2,552 compared fields in 88 lessons.

**Two findings came out of this that matter more than the corrections.**

The first is that « Montre-moi Lisa » had been shipped against a drawing of a bucket. The task was
impossible as authored, and it survived two pedagogical passes — it only surfaced once the review
package started naming the picture each activity shows. The illustration now contains Lisa, and a
test asserts that the activity asking a child to find her shows a picture whose description
mentions her.

The second is worse, and is why every approval now lapses. **`mediaIds` was not part of the
approval digest.** The picture a child is shown could be swapped under an approved lesson without
the approval noticing — and that is precisely what would have happened here. `mediaIds` and
`role` are now covered. Correcting the definition invalidated the remaining 27 approvals whose
text had not otherwise changed, which is the honest consequence: nothing should stand on a digest
that ignored what the child sees.

|                             | Lapsed because              | Count  |
| --------------------------- | --------------------------- | ------ |
| Content genuinely changed   | the targeted corrections    | 29     |
| Digest definition corrected | `mediaIds` and `role` added | 27     |
| **Total**                   |                             | **56** |

The historical approvals are recorded above and are not rewritten: those weeks _were_ approved, on
the text as it then stood.

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
