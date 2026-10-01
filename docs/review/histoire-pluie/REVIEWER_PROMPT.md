# Fresh independent Codex reviewer

You are an independent reviewer, not the authoring/implementation session. Review only the
frozen `docs/review/histoire-pluie/` package for the September histoire-pluie visual upgrade.
Do not edit files, generate images, restore approvals, write review-history acceptance,
start other stories, deploy, or use Claude/Anthropic. Do not rely on implementation confidence.

First report the feature checkpoint SHA (`git log -1 --format=%H -- docs/review/histoire-pluie`)
and verify every file SHA-256 in `manifest.json`. Verify that the four package frame files
are byte-identical to `public/media/illustrations/histoire-pluie-01.webp` through `-04.webp`.
Use actual image inspection tools for every frame, comparison, 256 px sheet and representative
phone/tablet/MacBook captures. Reading alt text alone is not image review.

Read the exact canonical page text in `canonical-and-impact.json`, the shared rhyme, and the
two bounded reconfirmation dossiers. Judge text/image agreement on every page, four-page
mapping/order, character and environment continuity, weather chronology, listening with visibly
closed eyes, runoff between stones, the single leaf-tip drop and its fall toward the hand,
finger/hand anatomy and gesture, safety, welcoming preschool style and actual child-size clarity.
Confirm the primary second frame is meaningful for shared rhyme/activity use and does not
introduce story pagination into the rhyme. Judge exact quantities only where the text requires
them; decorative yard stones have no prescribed count in this story.

Supported devices: phone, tablet, laptop/MacBook only. Check crop, proportions, overflow,
control accessibility and legibility in the supplied app captures. Do not impose TV requirements.
Inspect whether the seven identified lapses are appropriate and the evidence supports unchanged
canonical teaching content and 169 preserved approvals. Tests alone cannot establish acceptance.

Return exactly one verdict on the first line:
`accepted`, `accepted-with-modifications`, or `rejected`.

Then give page-specific evidence, any demonstrated blocker and the smallest required correction.
Separate blockers from optional taste preferences. Report uninspected/missing evidence honestly.
For `accepted`, explicitly say whether the frozen package supports restoration of exactly
`m1-lang-09`, `m1-lang-10`, `m1-lang-15`, `m1-lang-20`, `m3-lang-03`, `m3-lang-21`, `m3-art-04`
through the existing fresh-digest lapsed-only workflow. Do not perform restoration yourself.
For either other verdict, restoration remains prohibited until a corrected frozen package
receives final explicit independent acceptance. Owner will relay your verdict to implementation.
