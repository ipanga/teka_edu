# Media

What a child looks at, where it comes from, and why none of it costs anything. Decision: ADR-042
(resolves PD-008). How it is used in a session: [`PARENT_SESSION.md`](PARENT_SESSION.md).

## The problem it solves

The September audit found the gap in one screen. A lesson said:

> « Regarde les formes. Nomme-les : le carré, le rectangle, le triangle, le disque. »

and the screen showed the sentence _"À observer : le carré, le rectangle…"_ — and nothing else.
The child was told to look at shapes that did not exist unless the parent had cut them out of
paper first. Counting activities named objects but showed none; word cards were words with no
pictures.

A digital répétiteur that asks a five-year-old to look at something has to show it.

## Where media lives

**In the repository, as static files under `public/media/`, described by
`content/media/registry.json`.** Nothing else.

| Considered                       | Decision                                                                                                                                                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase Storage                 | **No.** It buys nothing here and costs complexity: the assets are small, static, versioned with the content they belong to, and must work offline. A bucket would add a network hop, a policy surface and a free-tier quota for no gain. Revisit only if parents ever upload. |
| A CDN or image service           | **No.** Paid, and the Vercel build already serves `public/` from its edge.                                                                                                                                                                                                    |
| Generated images from a paid API | **No.** Paid, non-deterministic, and unreviewable.                                                                                                                                                                                                                            |
| SVG committed to Git             | **Yes.** A few kilobytes each, diffable, deterministic, scalable to a TV, works offline, costs nothing.                                                                                                                                                                       |

Consequence: media ships **inside the release**, like the curriculum. No runtime fetch, no key,
no quota, and a lesson cannot break because an external URL rotted.

## The registry

`content/media/registry.json` is canonical content, validated like everything else:

```json
{
  "id": "forme-carre",
  "kind": "shape",
  "file": "shapes/forme-carre.svg",
  "alt": "Un carré bleu",
  "tags": ["carré", "forme"],
  "origin": "teka-edu-created",
  "provenance": "Tracé original produit par tools/media/build.ts pour Teka Edu."
}
```

- **`id` is stable and semantic** — `forme-carre`, `objet-crayon`, `animal-poule`. A lesson names
  the id; the file path is an implementation detail the registry owns. Renaming a file never
  touches content.
- **One asset, many lessons.** `forme-carre` is the square everywhere a square is needed. There is
  no per-lesson copy.
- **`alt` is French and describes the thing**, because it is read aloud by assistive technology to
  a French-speaking family.
- **`origin` and `provenance`** follow the same rule as every other content record: everything
  shipped is Teka Edu's own. No stock image, no third-party drawing, nothing with unresolved
  rights (which is also why this phase adds no photographs).

**Never put a bare URL in a lesson.** A lesson references `mediaIds`; the registry resolves them.
A test fails on an unknown id, a duplicate id, a missing file, or a missing `alt`.

## What is drawn, and what is computed

Two different things, deliberately:

|                                 |                                                                                                                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Assets** (in the registry)    | Things with an identity: the square, the triangle, a pencil, a hen. Authored once, reused.                                                                                                                                          |
| **Computed visuals** (no asset) | Things whose identity is the _number_: five dots to count, a number strip to ten. The `quantity` renderer draws them from the activity's own payload, so there is no `quantite-5.svg` to maintain, and `upTo: 7` needs nothing new. |

## Generation

`tools/media/build.ts` writes the shape and card SVGs from a compact declaration, so the set is
consistent and regenerable:

```bash
npx tsx tools/media/build.ts     # rewrites public/media/**, then re-validate content
```

The SVGs are committed. The generator exists for consistency and audit, exactly like
`tools/annual-plan/build.ts`; it is not run at build time.

`npm run media:sheet` renders a before/after contact sheet of every picture that changed since a
Git revision, at the three sizes the product uses (72, 128 and 256 px), with the same Chromium
the E2E tests use. It is how a redraw is looked at before it ships, and what the reviewer judges
when approvals lapse for it (ADR-048, `npm run review:visual`).

## Visual style

The illustration system — one ink, flat fills with a single shade, a warm brown skin for people
and body parts, a soft ground under objects, faces on people and animals only, and the palette —
is defined in [`september-illustration-upgrade-plan.md`](september-illustration-upgrade-plan.md)
and applied by `tools/media/build.ts`. The rules that predate it still hold:

Flat, simple, high-contrast, uncluttered: a shape is a shape, an object is recognisable in one
glance at arm's length on a phone. A single restrained palette, no gradients, no faces on
objects, no clutter that competes with the learning target. Culturally neutral or DRC-relevant —
a marmite, a seau, a panier — never a scene that assumes one kind of home.

**Colour never carries meaning on its own.** The square is not "the blue one": the child is asked
for the square, the shapes differ by form, and correctness never depends on seeing a colour.

## Accessibility

- Every meaningful asset has French `alt`, rendered as `<img alt="…">`.
- Decorative repetition — the five dots of a counting row — is `aria-hidden`, with one label on
  the group, so a screen reader says "cinq objets à compter" rather than "image, image, image…".
- Interactive choices are real `<button>`s with accessible names, reachable by keyboard, and their
  state is not colour-only.

## Offline

Static files under `public/` are part of the deployment, so a future service worker can precache
them with the rest of the release. There is no runtime dependency on any external host, which is
the point: a session in a home with a weak connection must still show the child a square.

## Audio

The same registry holds an `audio` array, and it is deliberately **empty**. The reasoning, the
rejection of browser speech synthesis as the educational voice, and the exact words worth
recording first are in [`AUDIO_GUIDELINES.md`](AUDIO_GUIDELINES.md) and ADR-046. The short
version: the parent reads aloud, and a recording is a second opinion on pronunciation — never the
only route, and never autoplaying.

`npm run media:report` counts the recordings alongside the images, so the gap stays visible.

## Motion

Pictures do not move. The four animations the product allows are CSS keyframes in
`app/globals.css`, all switched off by `prefers-reduced-motion`, and none of them attaches to
media (ADR-045). A gallery of pictures arrives one after another (`teka-stagger`), which is the
rise with a delay per item, not a fifth effect.

## Cost

**$0.** Kilobytes of SVG in a Git repository, served by the hosting that already serves the app.
Audio, when it exists, is recorded by a person and committed the same way; the point at which
that stops being reasonable (~25 MB) is stated in the audio guidelines.
