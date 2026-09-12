# Curriculum: official objectives and how they are stored

What a child should learn, quoted from the official programme, and how Teka Edu keeps official
text apart from its own work. Decisions: ADR-003, ADR-030, ADR-031. The daily programme is in
[`DAILY_PROGRAMME.md`](DAILY_PROGRAMME.md); authoring rules are in
[`CONTENT_AUTHORING.md`](CONTENT_AUTHORING.md).

## Curriculum authority

The **French Cycle 1 programme is Teka Edu's curriculum** — everything below comes from it. The
DRC's own preschool programme (PNEM 2021) is a **compatibility, context and enrichment
reference**, not a second curriculum: see [`DRC_CURRICULUM_COMPARISON.md`](DRC_CURRICULUM_COMPARISON.md)
for the comparison, the decision (ADR-037) and the mapping designed to answer "which PNEM
expectation does this lesson also cover?". Academic reference France, calendar and context DRC.

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

Every quoted statement carries its source and page. What may be reused, and on what terms, is
set out in [Reuse, licence and attribution](#reuse-licence-and-attribution) below.

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

**Present them as what they are.** Showing an example beside a single activity suggests a link
the official tables do not make — a Phase 2.5 review found exactly that defect and fixed it. The
API returns them as `competencySuccessExamples` with the competency's code and title, and the
review document groups them per competency with a note. Keep that wording in any future
interface.

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

## Reuse, licence and attribution

The repository is public and quotes official text verbatim, so the terms matter. What follows is
the result of checking the documents and the sites themselves; **it is not legal advice**, and
the three questions at the end need a lawyer (ISSUE-021).

### The French programme

- **No rights notice.** The three annexes carry no licence statement, no copyright line and no
  reuse terms of their own. Nothing in the PDFs grants a reuse right, so the right has to come
  from the law or from the publisher's site terms.
- **Statute.** French law has **no statutory exception** for official texts. The exclusion of
  _actes officiels_ from copyright is a **case-law doctrine** (Cour de cassation, and the Conseil
  d'État for administrative acts): an act that everyone is required to know is not protected by
  author's rights. An arrêté and its annexed programme fall within it, but it is a doctrine, not
  an article of the Code de la propriété intellectuelle that can be cited by number.
- **Site terms.** education.gouv.fr's footer points to **etalab-2.0** (Licence Ouverte 2.0),
  while its _mentions légales_ elsewhere describe the ministry as a non-commercial body and
  restrict reuse. **The two statements contradict each other.** Teka Edu therefore relies on the
  narrower of the two readings and complies with the Licence Ouverte in full, which is stricter
  than the official-texts doctrine would require.
- **Licence Ouverte 2.0 obliges the reuser to cite the source _and_ the date of its last
  update**, and not to suggest endorsement. That is why every source record now carries
  `publishedOn` (mirrored as `curriculum_sources.published_on`): the attribution line is
  generated from the data, not hand-written.
- **Excluded from any reuse:** the **Marianne**, the Republic's and the ministry's logos, and any
  other official emblem. They are protected separately from the text and are **not** in this
  repository. Do not add them, and do not reproduce the PDFs' layout or headers.
- **The PDFs themselves are not redistributed.** Only the statements are stored, as data, with
  their citation and SHA-256 so the import can be re-verified from the official URL.

**Attribution wording to use wherever official statements are displayed:**

> Objectifs d'apprentissage issus du programme d'enseignement de l'école maternelle (cycle 1),
> ministère de l'Éducation nationale, publié le \<date de dernière mise à jour de la source\>,
> repris sous [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/).
> Teka Edu n'est ni édité, ni approuvé, ni cautionné par le ministère de l'Éducation nationale.

The no-endorsement sentence is not optional politeness: the Licence Ouverte forbids suggesting
endorsement, and a product marked "programme officiel" without it invites exactly that reading.

### The DRC programme (PNEM 2021)

The opposite situation, and it is why the PNEM is referenced and never copied (ISSUE-020):

- **Ordonnance-loi n° 86-033 du 5 avril 1986, art. 7** places official acts in the public domain
  but **protects other State publications for the State itself**. The PNEM is a ministry
  publication, and no arrêté promulgating it was found, so it is not an official act.
- **edu-nc.gouv.cd** allows consultation, download and printing for personal and educational use
  with attribution, and **prohibits reproduction without authorisation**.
- Consequence for the model: a PNEM curriculum profile may hold **codes, official names, a
  citation and Teka Edu's own short description** marked `teka-edu-adaptation`. Storing the
  wording requires written permission from MINEDU-NC first.

### Rules that follow, for anyone adding content

1. Official text is stored **verbatim with `origin: "official"`, a source and a page**, or it is
   not stored as official at all.
2. A paraphrase is **never** `official`. It is `teka-edu-adaptation`, and its wording is Teka
   Edu's, which is what the reader is told.
3. Displaying official statements means displaying the attribution above, with the source's
   publication date.
4. No emblem, logo or PDF reproduction.
5. Anything whose status is unclear is marked for human or legal review rather than assumed.

### For the lawyer (ISSUE-021)

1. Does the official-texts doctrine cover a **programme annexed to an arrêté**, or only the
   arrêté's articles?
2. Which of education.gouv.fr's two contradictory statements governs — the etalab-2.0 footer or
   the restrictive _mentions légales_ — and does the answer change for a **public repository**
   rather than a product screen?
3. Does quoting a French programme inside a product distributed in the **DRC** raise any
   additional obligation, and is the attribution wording above sufficient in both countries?

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
