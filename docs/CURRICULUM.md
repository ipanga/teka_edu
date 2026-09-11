# Curriculum: official objectives and how they are stored

What a child should learn, quoted from the official programme, and how Teka Edu keeps official
text apart from its own work. Decisions: ADR-003, ADR-030, ADR-031. The daily programme is in
[`DAILY_PROGRAMME.md`](DAILY_PROGRAMME.md); authoring rules are in
[`CONTENT_AUTHORING.md`](CONTENT_AUTHORING.md).

## Sources

Teka Edu's preschool curriculum version `maternelle-cycle1-cd-2026` quotes three official
documents. Their citations and the SHA-256 of the exact PDFs imported are stored in
`content/curriculum/maternelle-cycle1-cd-2026/curriculum.json` and mirrored in the database
(`curriculum_sources`).

| Source id                      | Document                                                                            | Covers                       |
| ------------------------------ | ----------------------------------------------------------------------------------- | ---------------------------- |
| `programme-2026`               | Arrêté du 16 avril 2026 (NOR MENE2608627A), annexe, BO n° 19 du 7 mai 2026          | PHYS, ART, TIME-SPACE, WORLD |
| `programme-2024-langage`       | Arrêté du 22 octobre 2024 (NOR MENE2415135A), annexe 1, BO n° 41 du 31 octobre 2024 | LANG                         |
| `programme-2024-mathematiques` | Arrêté du 22 octobre 2024 (NOR MENE2415135A), annexe 2, BO n° 41 du 31 octobre 2024 | MATH                         |

The 2026 arrêté applies from the 2026–2027 school year and repeals the 2015 programme. It does
**not** restate language and mathematics: for those two domains it points to the 2024 annexes,
which is why the curriculum has three sources rather than one.

**Reuse:** education.gouv.fr publishes under the Licence Ouverte (etalab-2.0) and states that
official regulatory documents may be reproduced freely. Every quoted statement carries its
source and page.

## Hierarchy

```text
domain            Le développement et la structuration du langage oral et écrit      (6 domains)
  part            Acquérir le langage oral                                           (19 parts)
    competency    Enrichir son vocabulaire                                           (38 competencies)
      objective   Comprendre, mémoriser, réemployer les mots des corpus enseignés…   (398 objectives)
      example     Trouver un intrus dans une catégorie.                              (529 success examples)
```

The terms are the programme's own: it says the teaching of each domain is "structuré en
compétences", and that "les objectifs d'apprentissage et les exemples de réussite sont déclinés
par âge". "Part" is our name for the intermediate heading (e.g. "Se déplacer", "Découvrir les
nombres"); where the official tables sit directly under such a heading, the competency carries
the same title.

Some tables group their rows under a bold sub-heading (e.g. "Connaitre le nom des lettres",
"La longueur"). That label is kept on each objective as its `group`.

### Counts by domain

| Domain       | Parts | Competencies | Objectives | Success examples |
| ------------ | ----- | ------------ | ---------- | ---------------- |
| `LANG`       | 3     | 9            | 92         | 108              |
| `MATH`       | 5     | 6            | 73         | 158              |
| `PHYS`       | 4     | 4            | 39         | 46               |
| `ART`        | 3     | 9            | 76         | 84               |
| `TIME-SPACE` | 2     | 6            | 71         | 78               |
| `WORLD`      | 2     | 4            | 47         | 55               |
| **Total**    | 19    | 38           | **398**    | **529**          |

## Age bands, not classes

The programme states objectives by age, not by section:

| Band       | Official label                                                                  | Teka Edu level  | French section |
| ---------- | ------------------------------------------------------------------------------- | --------------- | -------------- |
| `before-4` | À aborder avant 4 ans                                                           | 1ère maternelle | PS             |
| `from-4`   | À partir de 4 ans ou dès que les apprentissages précédents ont pu être observés | 2ème maternelle | MS             |
| `from-5`   | À partir de 5 ans ou dès que les apprentissages précédents ont pu être observés | 3ème maternelle | GS             |

- **The level ↔ band mapping is a Teka Edu decision** (Plan §3), not an official statement. It is
  data (`curriculum_levels.age_band_code`), so it can change without touching code.
- **An objective is stored once, with every band it belongs to.** The programme repeats the same
  wording when learning continues; `objectivesForLevel` returns a level's own band **and every
  earlier band**, because the programme expects "le réinvestissement des compétences
  précédemment abordées". Ask for `ownBandOnly` to get just what is new at that age.
- A lesson may work on an objective of its level's band or of an earlier one, never a later one.
  The content validation enforces that.

## Success examples: evidence of progress

"Exemples de réussite" are what a child visibly does when learning is working. They answer
_"what evidence would show the child is progressing?"_.

They are attached to a **competency and an age band**, not to a single objective, because the
official tables do not align them row by row: a table often lists several objectives in one cell
and several examples in another. Attaching them to individual objectives would invent a link the
programme does not make. `successExamplesFor(syllabus, objective, band)` returns those of the
objective's competency and band (narrowed by row group when both have one).

The programme also warns that the examples "ne sont pas exhaustifs": they illustrate, they are
not a checklist.

## Provenance: official vs Teka Edu

Every statement says where it comes from, and nothing blurs the two:

| `origin`              | Meaning                                                  | Where                                                |
| --------------------- | -------------------------------------------------------- | ---------------------------------------------------- |
| `official`            | Quoted verbatim from the programme, with source and page | Objectives, success examples                         |
| `teka-edu-adaptation` | Teka Edu wording derived from an official text           | Not used yet (the schema supports it)                |
| `teka-edu-created`    | Written by Teka Edu                                      | Lessons, activities, materials, calendar assumptions |

- Official text is **never edited**, not even to normalise punctuation: the ministry's own PDFs
  mix typographic and straight apostrophes, and a unit test pins one such statement.
- The database refuses an objective marked `official` without a source, and refuses to store a
  lesson as official text at all.
- The API returns `origin` and `source` next to each objective.

## Importing and verifying

`tools/curriculum-import/` holds the one-off importer and its README. It reads the PDFs with
`pdfplumber`, using position, font weight and colour to find the structure and the two table
columns, then:

1. **cross-checks every extracted line against a second, independent extraction** (PDFKit) —
   the import is only accepted when no line is unmatched;
2. checks that the number of bulleted lines matches exactly (497 + 211 + 222 for the three PDFs);
3. writes the content files with stable codes.

Codes are positional and stable: `PHYS-S01-C01-O03` is part 1, competency 1, objective 3 of the
physical-activity domain. They do not depend on the French wording, so a future rewording is a
data change, not a re-keying.

## Asking the data questions

```ts
const data = getReferenceData();
const syllabus = getSyllabus("maternelle-cycle1-cd-2026", data);

objectivesForLevel(syllabus, curriculum, "maternelle-3"); // what this level learns
objectivesOfDomain(syllabus, "MATH"); // by domain
findObjective(syllabus, "MATH-S01-C01-O20"); // one objective, with its source
successExamplesFor(syllabus, objective, "from-5"); // evidence of progress
```

`npm run programme:report -- --level=maternelle-3 --day=1` prints a day with its objectives and
the official success examples. `GET /api/programme/2026-2027/maternelle-3/1` returns the same
over HTTP.

## A new programme version

A new official programme is a **new curriculum version**, never an edit of this one: add
`content/curriculum/<new-id>/`, assign the school years it applies to, and generate a reference
migration. Past school years keep the version they used, so nothing already taught is rewritten.
