# September visual upgrade — open items

Blockers, deferred items, decisions the owner must take, and quality notes. Resolved items move
to the bottom with their resolution.

## Decisions needed from the owner

### OI-001 — When to submit the visual reconfirmation package

Redrawing a picture lapses the approval of every lesson that shows it (ADR-048; `lessonDigest`
covers picture bytes since ISSUE-026). After B2–B4, the lessons of both classes that show a
changed picture are at `review`, and `npm run review:visual` generates one package per level
with a before/after contact sheet. The owner submits it to the AI-assisted reviewer, records the
outcome in `content/reviews/history.json` (one `full-review` entry per week, scope and wording
as in the package), and runs `scripts/approve-week.ts` per week. Until then the product keeps
serving the lessons; only the status differs.

**Merge order is the owner's call**: `feat/september-visual-ux` can merge at once (no content
change); `feat/september-illustrations` can merge before or after the reconfirmation, since the
runtime does not gate on status.

### OI-002 — Who records the audio

Nothing in this task records a voice. The recording brief in `docs/AUDIO_GUIDELINES.md` names
every word, rhyme and story worth recording, the file names and the registry rows. One adult who
speaks French comfortably, one quiet room, about twenty minutes for the words. When the files
exist, the listen controls appear with no code change.

## Deferred

- **Shapes unchanged.** The eight shape assets keep their bytes: the form is the point and they
  are already right. Re-inking them for consistency would lapse nine more lessons for no
  pedagogical gain. Revisit if a real session shows the ink mismatch.
- **Rhymes no lesson reads.** `comptine-semaine` and `comptine-cabri` illustrate texts that no
  September activity reads. They are redrawn for consistency (P3) and lapse nothing.
- **A display font.** A rounded child-friendly typeface would help, but every font is either a
  network request (Google Fonts — against offline-first and privacy) or a binary in the repository
  with a licence to track. System UI stays. Revisit with the PWA work.
- **Sequenced motion** (a number line filling, a hand folding finger by finger for the rhyme)
  would need a library or scripted SVG animation. Out of ADR-045's four effects; revisit only if
  a real session shows a child needs the demonstration.

## Quality notes

- The `Picture` component renders `<img>` at fixed pixel sizes with `max-w-*` classes; the stage
  must scale with it rather than fix its own size, or a phone shows a picture smaller than its
  panel.
- The counting row repeats one asset up to 20 times at 72 px; every refined object must still
  read at that size (checked on the contact sheet).
- `histoire-seau-lisa` illustrates a story **and** a rhyme (`comptine-le-petit-seau`) and eight
  1ère lessons ask the child to find Lisa in it. Lisa must stay the largest, most obvious thing.

## Resolved

None yet.
