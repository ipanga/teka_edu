# Histoire-pluie independent review

This isolated package freezes only the Pluie upgrade against accepted baseline
`4b2648f462e4abd2467d3515a68822796c5005ee`. Implementation is not pedagogical acceptance.
Read `REVIEWER_PROMPT.md`, verify `manifest.json`, then inspect the actual image files.

- `canonical-and-impact.json`: exact unchanged canonical story/rhyme, page lines, mapping,
  final hashes, exact affected lesson content, prior and freshly computed pending digests.
- `frames/page-1.webp` through `page-4.webp`: final 1200x900 application bytes, in page order.
- `comparison.png`: before/after and all four frames, accessible descriptions, exact uses.
- `child-size-256.png`: all four images at exactly 256x192, left to right pages 1-4.
- `screens/`: unscaled application captures of pages 1-4 and shared rhyme at phone 390x844,
  tablet 768x1024 and MacBook 1440x900. Other tested widths: 320, 360, 430, 1024, 1280.
  Overview sheets show pages 1-4 in reading order. Three-line pages can require vertical
  scrolling on small phones; the separate phone page-2 return capture verifies the parent
  control remains reachable. Overview images are navigation aids; inspect unscaled originals.
- `reconfirmation-maternelle-1.md` and `reconfirmation-maternelle-3.md`: bounded generated
  dossiers proving unchanged teaching content and listing four plus three lapsed lessons.

Ten story lines render four pages of 3/3/3/1. Mapping [0,1,2,3] is unchanged pagination.
Page 2 is the primary non-story image, showing rain tapping the roof and Tito listening.
The rhyme is a single screen; it does not inherit the story's page sequence.

Continuity specification: Tito has brown skin, short black curls, mustard-yellow shirt,
teal shorts and brown sandals. The ochre house, wooden doorway, corrugated roof, broad-leaf
plant, stones and yard remain coherent. Rain starts, intensifies, stops, then Tito goes out.
Both eyes are closed on page 2. One prominent drop hangs on page 3 and is detached above
his open catching palm on page 4. Page 4 was corrected before freeze to show the falling drop.
Inspect these claims independently; no claim in this package binds the reviewer's judgment.

Delivery: WebP quality 88, smart subsampling, 1200x900; four files total 1,154,344 bytes.
Local PNG masters are retained under ignored
`private/astra-visual-evidence/september-rich-media-rollout-masters/histoire-pluie/`.
Sources: 1448x1086 except page 2 at 1447x1087; normalization to 4:3 changes its ratio by less
than 0.2 percent. Runtime recovery depends only on tracked WebPs, not local masters.

Technical verification: 438 unit tests, production Webpack build and TypeScript pass;
all three fake CI server sentinels are absent from 28 client-bundle files. Existing 42 browser
tests pass; eight Pluie viewport checks pass with 40 page/rhyme captures. Content validates
31 JSON files; lapse dry run zero. All 169 unaffected lessons and 50 unrelated registry/media
assets match the baseline; canonical texts and review history are byte-identical.
Technical evidence never substitutes for independent pedagogical acceptance.

Current approval state: 169 approved, seven review, zero stale/unexpected lapses. No approval
restored and no accepted review recorded. Cailloux and Malo are untouched. Supported devices
are phone, tablet and laptop/MacBook only. No PR, merge, deployment or database operation.

The implementation checkpoint is the feature commit that adds this package; obtain its exact
SHA with `git log -1 --format=%H -- docs/review/histoire-pluie`. Package file hashes are in
`manifest.json`; its own hash is recorded in the continuation checkpoint.
