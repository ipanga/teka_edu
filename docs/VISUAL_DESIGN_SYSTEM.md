# September visual design system — independent review

Design direction for the Astra review, 2026-09-24. This specification supplements the existing
illustration guide; it does not retroactively accept replacement artwork or change the approved
curriculum. Decisions and evidence: [audit](review/media/SEPTEMBER_ASTRA_VISUAL_AUDIT.md).

## Purpose and visual modes

Recognition comes before decoration. An adult should be able to cover the label and still name
the subject. Use a continuous, credible silhouette, ample breathing room and gentle dimensional
shading. Avoid heavy black outlines, capsule limbs, circles standing in for toes, and rectangular
anatomy. Do not add faces to objects. Preserve all eight geometry files exactly.

- **Recognition:** isolated everyday subject, approximately 70–85% of the image frame. Minimal
  background, recognizable contour at 72/128 px. A neutral paper ground may establish weight.
- **Concept:** only the context necessary to understand the relation. A soil cutaway separates
  roots from leaves; spatial tasks still happen with the actual objects prescribed by the lesson.
- **Story/rhyme:** characters, gesture and limited environment form a scene. Retain only events
  supported by the approved text; do not add an answer, a later event or extra countable objects.
  Richer does not mean busier. Never turn every story into a vocabulary icon.

## Palette, shape and characters

Keep the warm paper, muted sky, leaf, ochre, clay and berry palette as the common foundation.
Use dark brown/charcoal details with lighter local contour colours rather than one black-heavy
stroke on every shape. Soft shading is allowed when it helps form. No text baked into pictures.

Use preschool proportions: a large but credible head, short torso, softly bent limbs, connected
hands and feet, small expressive eyes and a natural mouth. Lisa, Tika and Nsimba retain their
identities and story requirements. Skin tones may vary naturally across the family, with consistent
facial and line treatment. Clothes are ordinary preschool clothes; no cultural costume shorthand.
A reference character sheet must be inspected before generating multiple scenes.

For a hand: exactly five connected digits, natural thumb opposition, clear wrist continuation.
For a foot: connected toes graduating in size, clear instep and heel, never five beads above an
oval. A belly may be shown on a child gently touching it if the target remains obvious; this
revises the prior guide's blanket preference for isolated parts and requires independent visual
reconfirmation. Do not replace body-based instruction with a screen task.

## Layout and typography

Child view: instruction, primary picture/manipulation, essential supporting words, quiet parent
return. Parent view retains separate “La part de l’enfant” and “Pour vous” zones. Presentation
and playing are different actions; clarify wording without changing their behavior.

Use option-count-aware grids. At 320 px, two recognition choices must fit without horizontal
scroll. At 1920×1080, two or three choices should occupy the central stage rather than a portion
of a four-column row. Target 280–360 px pictures for sparse choices and 36 px key labels on TV.
For many options preserve enough room to distinguish each shape; scrolling remains preferable
to clipped content. Large-screen narrative may place image and text side by side, while phones
stack them. Never truncate approved instructions or story text to fit a design.

Keep the system font, French accents, clear focus indicators, real buttons, French alt descriptions
and non-colour-only feedback. Touch targets should be at least 44 px where practical. Actual
viewing-distance readability remains a human check, not a screenshot assertion.

## Motion and audio

No decorative loops or background motion. Restrained entry/feedback is enough. Keep every state
usable with `prefers-reduced-motion`; no information conveyed only by animation. A success pulse
should occur once. Audio remains recorded human French only, parent initiated; add no recordings
for this visual review.

## Production and acceptance

Retain SVG for precise geometry and simple objects. Richer raster illustration may use native
image generation, then be optimized and committed locally with provenance and exact byte hashes.
Do not hotlink. Preserve the canonical generator for generated SVG. A draft image outside the
registry does not lapse approval; integrating it does and must trigger the existing lapse workflow.

Inspect each replacement at 72, 128, 256 and TV size, with labels covered, then in actual affected
activities. Produce readable before/after sheets and an explicit affected-lesson list. Do not
refresh approval digests. No replacement is accepted merely because it generated successfully.
If the required quality is unavailable, retain the baseline and attach the precise brief; label
that batch pending rather than shipping a placeholder or claiming completion.
