# September visual upgrade — plan and style system

The strategy, the style system and the batches for upgrading what a child sees, hears and feels
in the September sessions of 1ère and 3ème maternelle. The audit it acts on is
[`september-illustration-audit.md`](september-illustration-audit.md) (generated); the running
log is [`september-illustration-progress.md`](september-illustration-progress.md); blockers and
decisions are in [`september-illustration-open-items.md`](september-illustration-open-items.md);
the machine-readable state is `september-illustration-state.json`. The checkpoint that says
where to resume is [`work/ACTIVE_TASK.md`](work/ACTIVE_TASK.md).

Decisions this plan rests on: ADR-042 (media), ADR-043 (two zones), ADR-045 (motion), ADR-046
(audio), ADR-047 (the review gate), and **ADR-048** (a redrawn picture lapses approvals, and the
lapse is reconfirmed rather than bypassed).

## What is wrong today, in one paragraph

The pedagogy is right and reviewed. The pictures are a flat icon set drawn to close a gap —
« Regarde les formes » with no shapes — and they did that. They were never illustration: two
outline hands with no thumbs for a rhyme about hands, an amber blob for « la main », a circle over
a plank for a child waking up, a stick figure with a red face for Lisa. They float on white inside
white cards, so the child's zone looks empty even when it is full. Motion is right but minimal,
and there is no sound at all, on purpose. The parent's screen is clear but under-designed.

## Principles

1. **The pedagogy is locked.** No approved sentence changes unless a picture, a sound or a layout
   needs it, and every such change is logged with its reason.
2. **Improve what is weak, keep what is right.** Shapes stay as they are: a shape is a shape. The
   Lisa picture is redrawn because a three-year-old is asked to find Lisa in it.
3. **The rules already in force stay in force.** Colour never carries meaning; a picture is one
   clear subject; nothing loops; nothing autoplays; nothing is the only route; the screen steps
   back when the child moves, speaks, draws or handles things.
4. **Everything is regenerable.** Pictures are drawn by `tools/media/build.ts`; the audit by
   `npm run visual:audit`; the reconfirmation package by `npm run review:visual`. Nothing is done
   by hand that a script could redo after an interruption.
5. **The gate is honoured.** Redrawing a picture changes what a reviewer judged. The affected
   lessons go back to `review` in the same commit, a visual reconfirmation package is generated
   with a before/after sheet, and `scripts/approve-week.ts` restores the approvals when the
   review says so. The live product is unaffected: the runtime does not gate on status.

## The illustration system

**Canvas.** 200 × 200, `viewBox="0 0 200 200"`, ids and file paths unchanged so no lesson moves.
The subject fills about 75 % of the canvas; the old set used about half.

**Line.** One ink, `#2b2a33`, 6 px, round joins and caps, on every outline. It is the thing that
makes 49 drawings by different rules look like one set.

**Fill: flat, with one shade.** Each colour has a base and a shade; the shade is a single band or
crescent on the lower or far side, never a gradient. It gives volume without texture, keeps the
files small and keeps the style honest at 72 px in a counting row.

| Name  | Base      | Shade     | Used for                        |
| ----- | --------- | --------- | ------------------------------- |
| paper | `#fffdf7` | `#efe9dc` | the app background, highlights  |
| sky   | `#7cbbe6` | `#5395c4` | water, the sky, blue objects    |
| leaf  | `#86c692` | `#5fa46e` | plants, green objects           |
| sun   | `#f3c86d` | `#d9a63f` | the sun, wood, warm objects     |
| clay  | `#e08d6a` | `#bf6a4b` | roofs, terracotta, red-brown    |
| stone | `#c9c2b4` | `#a49c8e` | metal, stone, grey objects      |
| skin  | `#9a6540` | `#7a4c2e` | people and body parts           |
| hair  | `#2b2a33` | —         | hair, eyes                      |
| berry | `#d8626b` | `#b34650` | tomatoes, a dress, red accents  |
| night | `#3f4c7a` | `#2d3759` | the night sky of the Malo story |

Skin is a warm brown: the children in Teka Edu's stories live in Kinshasa, and the body parts the
youngest class names are their own. Colour never carries meaning (ADR-042): the child is asked
for _la main_, never _the brown one_.

**Ground.** Objects, animals and people stand on a soft ellipse of `#efe9dc` (no outline). It is
what stops a drawing floating.

**Faces.** People and animals have a face — two dot eyes, a small curved mouth, nothing more.
Objects and shapes never do: a smiling triangle would teach that a triangle is a character.

**Composition.** One subject, seen from the front or three-quarter, no background scene. A story
picture may hold two things when the story is about the two (Lisa and her bucket, Kumu and the
henhouse door), never a crowd.

**Repeats.** A row of thirteen cailloux is drawn from one asset; the asset must therefore read at
72 px. Every asset is checked at 72, 128 and 256 px on the contact sheet.

**Acceptable variation.** A story picture may be busier than an object; an object may be plainer
than an animal. What may not vary: the ink, the line weight, the ground, the palette, the absence
of gradients and of text inside a picture.

## The child-facing screen patterns

- **The stage.** Every picture sits on a tinted rounded panel (paper shade, radius 24 px) that
  scales with the picture. One picture: a large centred stage. Several: a grid of small stages.
  The stage is what makes a card look furnished rather than empty.
- **Word cards.** Picture on a stage, the word below in a large weight, a listen control beside
  the word only when a recording exists. The « je montre le mot » game is unchanged.
- **Rhymes.** Picture on a stage, then the lines in a larger size with a wide leading, each line
  arriving in sequence once. Stories keep three lines a page; the page turn rises once.
- **Off-screen.** The frame keeps its sentence (« Posez l'écran ») but loses the dashed border
  that read as "failed to load"; a soft tinted panel instead.
- **The child's full-screen view.** The instruction stays the largest text; the renderer gets a
  wider stage; the return control stays small and last.
- **Feedback.** « Bravo ! » and « Essaie encore » keep their words; the pop and the nudge keep
  their timing.

## Motion policy (ADR-045, unchanged in spirit)

Allowed: an entrance that rises once (`teka-rise`), staggered by up to 60 ms per item and never
on re-render; a page turn that rises once; a correct answer that pops once; a "look again" that
nudges once; the picture the child is asked to find, pulsed twice. Nothing loops, nothing runs
longer than about a second, nothing waits for anything, and `prefers-reduced-motion` switches all
of it off. Additions in this task: staggered entrances on word cards, rhyme lines and movement
steps, and the page turn. No new library.

## Audio policy (ADR-046, unchanged)

No activity requires audio. **Recommended** where a human recording teaches what a page cannot:
the pronunciation of a taught word, the rhythm of a rhyme, a syllable or rhyme model in a sound
game. **Optional** narration of a story, for a day the parent cannot read. **Unnecessary**
everywhere else. The reviewer of this task decides per activity; the audit records it.

What this task ships: the per-activity decision, a listen control on word cards and rhymes that
renders only when a recording exists, and the recording brief in
[`AUDIO_GUIDELINES.md`](AUDIO_GUIDELINES.md). What it does not ship: recordings. A synthetic
voice for a word the child must copy is forbidden, and a human voice is a person's job.

## Batches

| Batch | Branch                         | Content                                                                                           | Approval impact                        |
| ----- | ------------------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------- |
| B0    | `feat/september-visual-ux`     | Tracking system, audit, this plan                                                                 | none                                   |
| B1    | `feat/september-visual-ux`     | Stage, word cards, rhyme and story layout, off-screen frame, child screen, motion, audio plumbing | none                                   |
| B2    | `feat/september-illustrations` | The 1ère set: body parts, hands, five rhymes, two stories, five objects                           | lapses the 1ère lessons that show them |
| B3    | `feat/september-illustrations` | The 3ème set: stories, rhymes, animals, plant                                                     | lapses the 3ème lessons that show them |
| B4    | `feat/september-illustrations` | Remaining objects, contact sheet, visual reconfirmation package, migration, review packages       | packages generated for the owner       |
| QA    | both                           | Screenshots at three widths, reduced motion, E2E, contrast, no missing asset                      | none                                   |

Order of value: the 1ère set first, because it is the youngest child and the two screenshots the
owner sent are both 1ère; then the stories, because a picture is where a listening child rests
their eyes; then the objects, which are recognisable already and only need polish.

## QA plan

- `npm run verify` (format, lint, types, unit, content, build) after every batch.
- `npm run test:e2e` after B1 and B4, including the reduced-motion run.
- Screenshots of one word-card activity, one rhyme, one story, one counting activity and one
  off-screen activity at 390, 820 and 1280 px, in the parent view and in « Montrer à l'enfant ».
- The contact sheet (`docs/review/media/`) at 72, 128 and 256 px for every changed asset.
- `npm run media:report` for both levels: 0 screens with nothing to show, unchanged.
- Contrast: ink on paper and on every stage ≥ 7:1; no meaning carried by colour alone.

## How to resume

Read `docs/work/ACTIVE_TASK.md`, then run `npm run visual:audit`; if it produces a diff, the
state file was edited and not regenerated — commit the regeneration first. The progress log's
last entry names the batch in progress and the exact next action.
