# Illustration style guide

How every Teka Edu picture is drawn, so that October, 2ème maternelle and every later month look
like the same product as September. Decisions: ADR-042 (media), ADR-045 (motion), ADR-048
(redraws and approvals). The generator is `tools/media/build.ts`; the per-asset record of the
September pass is `docs/work/SEPTEMBER_VISUAL_QA.md`.

**The goal is calm, warm, clear and educational — not a cartoon game.** A picture helps a child
understand first, and is attractive second.

## The frame every picture shares

| Rule       | Value                                                                                  |
| ---------- | -------------------------------------------------------------------------------------- |
| Canvas     | 200 × 200, `viewBox="0 0 200 200"`; the subject fills about three quarters             |
| Line       | One ink, `#2b2a33`, 6 px, round joins and caps. Thin details (a crease, a mouth) scale |
| Fill       | Flat, one base and at most one shade per colour; no gradients, no texture              |
| Ground     | A soft ellipse of `#efe9dc`, no outline, under anything that stands                    |
| Background | None by default; the app's tinted stage frames the picture                             |
| Text       | Never inside a picture                                                                 |
| File       | Static SVG, a few kilobytes, no external reference                                     |

The palette (base / shade): paper `#fffdf7`/`#efe9dc`, sky `#7cbbe6`/`#5395c4`, leaf
`#86c692`/`#5fa46e`, sun `#f3c86d`/`#d9a63f`, clay `#e08d6a`/`#bf6a4b`, stone `#c9c2b4`/`#a49c8e`,
skin `#9a6540`/`#7a4c2e`, berry `#d8626b`/`#b34650`, night `#3f4c7a`/`#2d3759`. Nothing outside
it. **Colour never carries meaning**: a child is asked for _the square_ or _Lisa_, never for _the
blue one_; two things a child must tell apart differ by shape (the week's beads are round, then
square).

## People

- Warm, simple proportions: a large round head, a body about one and a half heads tall, limbs as
  capsules. Credible, never realistic.
- A face is two dot eyes and one small mouth, **in proportion to the eyes** (`face()` scales the
  mouth's line to the eye radius). A 6 px smile under small eyes reads as a beard at television
  size — the defect the final QA found on Lisa and Nsimba.
- Skin is the warm brown of the palette, because the children in Teka Edu's stories live in
  Kinshasa. Hair is the ink colour; girls and boys differ by hair and clothes, never by
  stereotype.
- A gesture must read without a caption: the hand is one skin fill, a round palm, four fingers
  fanning slightly and a thumb on the correct side (`hand()`), no crease across the palm (it read
  as a frown).
- One person per picture unless the story is about two.

## Body parts

The part alone, on a plain ground, as a child would see it on themselves: a hand palm-out, a
foot from above with five toes, a head with hair, ears and a smile, a belly between a lifted
t-shirt and shorts with the arms at the sides. Never a whole figure where a part is asked for —
finding the part inside the figure is a second task.

## Objects

- The real-world silhouette, from the angle a child knows it (a chair from the front, a pot from
  slightly above).
- One shade band for volume, a ground for weight, a highlight only where it helps (a tomato, a
  stone).
- No face on an object or a shape, ever: a smiling triangle teaches that a triangle is a
  character.
- It must read at 72 px, because counting repeats one object up to twenty times.

## Shapes

A shape is a shape. The eight shape assets keep their exact geometry and bytes: one canonical
exemplar and one variant (smaller, tilted, or standing) per shape, the variant wearing another
shape's colour so colour cannot become the cue (MATH-S03-C01-O07). Rendering may improve only if
it does not change what the child must recognise.

## Story and rhyme pictures

- **One picture per story or rhyme.** A read-aloud is not a picture book; the picture is where a
  listening child's eyes rest.
- It shows the **character, the object and the action** the story is about, with one
  environmental cue at most (a door, a bush, a moon) — enough to understand the situation, not
  enough to replace listening. Kumu walks _away_ from the open henhouse; the fear and the return
  stay in the words.
- The child must understand the important part without an adult explaining the picture. The
  seven questions of `docs/work/SEPTEMBER_VISUAL_QA.md` are the test.

## Scale

Every picture is checked at 72 px (a counting row), 128 px (a word card), 256 px (a story), and
on the child's full screen at television size, where it may reach 480 px. `npm run media:sheet`
renders the first three for any changed picture; screenshots of the session cover the last.

## Motion

Pictures do not move. The session's motion (ADR-045) is CSS on the frame: a card rises, a list
settles in sequence without ever being invisible, a correct answer pops, a page turns. No looping,
no bouncing, no confetti, and all of it off under `prefers-reduced-motion`.

## Typography

**The system UI font stays.** Evaluated in the final QA (2026-09-23):

- It is highly readable, renders French accents and numerals well on every platform, and costs
  nothing: no file, no network request, no licence, and it works offline.
- The children do not read the interface; the parent does. The words a child sees are few and
  large, where weight and size already carry the warmth.
- A rounded "children's" display face was the candidate for headings only. Every option is
  either a network request (against offline-first and privacy) or a binary committed with a
  licence to track, and the ones that feel warmest blur `I`, `l` and `1` or `a` and `ɑ`. The gain
  did not justify either cost.

Revisit only with the PWA work, if a self-hosted, openly licensed face with clear `I l 1` and
`a g` is chosen for headings — never for instructions.

## Adding a picture

1. Draw it in `tools/media/build.ts` with the helpers (`ground`, `face`, `capsule`, `hand`,
   `chick`, `hen`, `goat`, `puffs`) and the palette.
2. `npx tsx tools/media/build.ts`, then `npm run media:sheet -- --ids=<id> --scale=2` and look.
3. Give it a decision in the state file and `npm run visual:audit`.
4. If lessons already approved show it, `npm run review:lapse` and a visual reconfirmation
   (ADR-048). Never re-stamp.
