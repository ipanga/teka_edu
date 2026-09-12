# Authoring educational content

How to write a Teka Edu lesson, and the rules CI enforces. Decisions: ADR-005, ADR-028, ADR-032.
What the curriculum is: [`CURRICULUM.md`](CURRICULUM.md). How a day is assembled:
[`DAILY_PROGRAMME.md`](DAILY_PROGRAMME.md).

## Where content lives

```text
content/
  curriculum/<curriculum>/curriculum.json        version, sources, age bands, domains, levels
  curriculum/<curriculum>/objectives/<DOMAIN>.json   OFFICIAL objectives + success examples (imported)
  materials/…                                     content/materials.json: what a home needs
  lessons/<curriculum>/<level>/<domain>.json      Teka Edu lessons and their activities
  programmes/<curriculum>/<level>.json            the rhythm and the lesson tracks
```

Every file must be registered in `lib/content/reference-data.ts`, or `npm run content:validate`
fails. Git is the editable source of truth; the database copy is generated (ADR-028).

## The golden rule

**Never present Teka Edu's words as official.** Objectives are quoted from the programme and
carry a source; lessons and activities are ours and are marked `teka-edu-created`. A lesson
_implements_ an objective, it never restates it as if it were the programme.

## Writing a lesson

A lesson is one coherent unit for one level, small enough for a home session.

```jsonc
{
  "id": "m3-math-01",                   // stable slug, never reused
  "curriculumId": "maternelle-cycle1-cd-2026",
  "levelIds": ["maternelle-3"],
  "domainCode": "MATH",                 // primary domain
  "title": "Je compte jusqu’à cinq",
  "summary": "…",                       // one line, for the adult
  "objectiveCodes": ["MATH-S01-C01-O20"],        // what it teaches (at least one)
  "supportingObjectiveCodes": ["MATH-S01-C01-O05"], // what it reinvests
  "stage": "discovery",                 // discovery | practice | consolidation | review
  "difficulty": 1,                      // 1-3 within the level
  "themeId": "la-rentree",
  "parentGuidance": "…",                // how to guide, what to watch for
  "activities": [ … ],
  "origin": "teka-edu-created",
  "status": "review",                   // draft | review | approved | retired (ADR-035)
  "review": null                        // filled in only when a person approves it
}
```

**A lesson you write stops at `review`.** Only a named human reviewer moves it to `approved`, and
the approval records who, their role, the date and a digest of the exact text
([`CONTENT_QUALITY_GATE.md`](CONTENT_QUALITY_GATE.md)). Editing approved content lapses the
approval, on purpose.

### Rules the validator checks

- Each objective exists, and belongs to the level's age band **or an earlier one** — never a
  later one.
- The same objective cannot be both taught and supporting.
- An objective is discovered once per track; a `practice`, `consolidation` or `review` lesson
  must build on something taught earlier in its track.
- Activity positions are 1…n; ids are unique across all content.

## Writing an activity

```jsonc
{
  "id": "m3-math-01-a1",
  "position": 1,
  "type": "counting", // one of the registered kinds
  "title": "Je compte les cailloux",
  "childInstruction": "Compte les cailloux, un par un…", // spoken to the child, in French
  "adultGuidance": "Posez trois cailloux, puis quatre…", // spoken to the adult
  "minutes": 6, // 2-20
  "mode": "off-screen", // off-screen | on-screen | mixed
  "objectiveCodes": ["MATH-S01-C01-O20"], // must be among the lesson's objectives
  "materialCodes": ["petits-objets"], // or ["aucun"]
  "vocabulary": [{ "fr": "combien", "en": "how many" }],
  "scaffolds": [{ "language": "en", "childInstruction": "Count the stones one by one." }],
  "payload": { "upTo": 5, "objects": "cailloux" }, // shape depends on the type
}
```

### Writing for a five-year-old

- **Child instruction:** one thing to do, short sentence, words a child knows, French only.
- **Adult guidance:** what to say, what to look for, what to do when it does not work. It is the
  place for pedagogical detail, never the child instruction.
- **No worksheets.** The programme asks to limit "le recours aux fiches"; prefer talking,
  manipulating, moving, drawing and playing.
- **Real objects from a DRC home**: cailloux, capsules, haricots, une boîte, un tissu, la poule,
  la chèvre. Avoid things a Congolese family may not have, and avoid European-only references.
- **Repetition is expected**, but "dans des conditions variées": change the objects, the place or
  the game rather than repeating the identical exercise.

### Activity kinds

`conversation`, `vocabulary`, `listening-story`, `read-aloud`, `song-rhyme`, `phonology`,
`counting`, `matching`, `sorting`, `observation`, `drawing`, `graphic-practice`, `movement`,
`manipulation`, `memory-game`.

The list lives in `domain/lessons/types.ts` and each kind has a payload schema in
`lib/content/lesson-schemas.ts`. Adding a kind means adding it there (and later a renderer) —
never a new database table.

### English scaffolding

French is the instruction; English is help for a child who does not understand it yet
(ADR-001). A scaffold is a short `en` instruction and optional `en` words next to the French
ones. Never write an English version of a lesson, and never translate a whole activity.

### Media (not implemented)

Activities have no media field yet. When images or audio arrive, they will be referenced by
stable identifiers resolved through a media registry, so content stays free of file paths and
can be packaged for offline use. Adding the field is additive: no existing content changes.

## Materials

`content/materials.json` lists what a home needs, by category (`none`, `screen`, `paper`,
`writing`, `household`, `toy`, `outdoor`). Every activity lists its materials, using `aucun`
when it needs none. The daily plan aggregates them so a parent can prepare in one go. There is
no inventory tracking.

Every material also carries:

- **`alternatives`** — what to use instead. Homes in the DRC differ: city flat, peri-urban plot,
  village. An activity must never fail because one object is missing, so write "cailloux,
  capsules, haricots, graines" rather than "cailloux".
- **`safetyNote`** — what the adult must watch for, when there is something to watch: small
  objects near a toddler, furniture that must be stable, an outdoor space to check first.

Both are shown to the parent in the daily plan and in the review document.

## Before you commit

```bash
npm run content:validate                       # registration, schemas, every rule above
npm run programme:report -- --level=maternelle-3 --day=1 --to=5   # read the days back
npm run test                                   # unit tests
npm run db:reference -- --new-migration <name> # mirror the change into the database (ADR-028)
npm run db:reset && npm run db:test            # apply and check the mirror
```

A content change that unbalances a day (too long, too much screen, no movement, a repeat on two
days in a row) fails validation. That is deliberate: the balance rules are part of the content,
not advice.

## Review before a child sees it

`status` starts at `review`. Pedagogical review by a person is still required before content is
marked `published` (Plan §28, §35); the pilot week is written but **not yet reviewed by a
teacher**. LLM-drafted material follows the same path: schema validation, then human review.
