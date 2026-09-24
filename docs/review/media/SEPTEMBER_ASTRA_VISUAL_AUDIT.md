# September Astra visual audit

Status: **audit in progress; no implementation accepted**. Baseline `a0b743b` (develop); public production health independently verified at `28dcb0a` on 2026-09-24.

## Coverage and evidence

Canonical inventory: 176 approved lessons, 302 activities (132 + 170), 49 registered images. All 49 images independently inspected in six sheets at 270 px; 47 are referenced by September lessons. All 302 instructions and renderer assignments read. This is **not** a claim that every interactive state has been visually inspected. Six-viewport initial-state capture is in progress; story pages, retries, sorting and completion states still require inspection.

The previous acceptance decisions were not reused. Scores: 1 = misleading/unusable, 2 = substantial design weakness, 3 = usable with concerns, 4 = clear and suitable, 5 = precise for its teaching function. Phone/TV columns are provisional asset judgments, pending in-app verification; no child recognition study or physical viewing-distance test has been conducted.

Decisions: KEEP 23, REFINE 10, REDRAW 16; REMOVE 0; REPLACE-WITH-REAL-OBJECT 0. Existing off-screen activities should continue using real objects; do not remove registered teaching pictures to solve renderer problems.

## Asset inventory

Uses include media carried by a text; some are not the leading rendered illustration. Exact dependency mapping is in `astra-baseline/inventory.json`; approval effects must be computed from actual lesson digests, not inferred from this table.

| Media ID | Used by lessons / activities | Class | Purpose | Quality | Recognition | Age | Phone | TV | Decision | Reason | Treatment | Approval impact |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [forme-carre](astra-baseline/assets-1.png) | m1-math-11-a1; m1-math-13-a1; m1-math-16-a1; m1-math-19-a1; m3-math-03-a1; m3-math-03-a2; m3-math-08-a1; m3-math-08-a2; m3-math-18-a1; m3-math-18-a2 | 1ère maternelle, 3ème maternelle | Un carré | 5 | pass | yes | pass | pass | KEEP | Unambiguous geometry; orientation/colour variants prevent a prototype-only cue. | Retain exact bytes. | none: retain |
| [forme-rectangle](astra-baseline/assets-1.png) | m3-math-03-a1; m3-math-03-a2; m3-math-08-a1; m3-math-08-a2; m3-math-18-a1; m3-math-18-a2 | 3ème maternelle | Un rectangle | 5 | pass | yes | pass | pass | KEEP | Unambiguous geometry; orientation/colour variants prevent a prototype-only cue. | Retain exact bytes. | none: retain |
| [forme-triangle](astra-baseline/assets-1.png) | m1-math-16-a1; m1-math-19-a1; m3-math-03-a1; m3-math-03-a2; m3-math-08-a1; m3-math-08-a2; m3-math-18-a1; m3-math-18-a2 | 1ère maternelle, 3ème maternelle | Un triangle | 5 | pass | yes | pass | pass | KEEP | Unambiguous geometry; orientation/colour variants prevent a prototype-only cue. | Retain exact bytes. | none: retain |
| [forme-disque](astra-baseline/assets-1.png) | m1-math-11-a1; m1-math-13-a1; m1-math-16-a1; m1-math-19-a1; m3-math-03-a1; m3-math-03-a2; m3-math-08-a1; m3-math-08-a2; m3-math-18-a1; m3-math-18-a2 | 1ère maternelle, 3ème maternelle | Un disque, tout rond | 5 | pass | yes | pass | pass | KEEP | Unambiguous geometry; orientation/colour variants prevent a prototype-only cue. | Retain exact bytes. | none: retain |
| [forme-carre-penche](astra-baseline/assets-1.png) | m3-math-03-a1; m3-math-03-a2; m3-math-08-a1 | 3ème maternelle | Un carré posé de biais, plus petit | 5 | pass | yes | pass | pass | KEEP | Unambiguous geometry; orientation/colour variants prevent a prototype-only cue. | Retain exact bytes. | none: retain |
| [forme-rectangle-debout](astra-baseline/assets-1.png) | m3-math-03-a1; m3-math-03-a2; m3-math-08-a1 | 3ème maternelle | Un rectangle debout, plus haut que large | 5 | pass | yes | pass | pass | KEEP | Unambiguous geometry; orientation/colour variants prevent a prototype-only cue. | Retain exact bytes. | none: retain |
| [forme-triangle-quelconque](astra-baseline/assets-1.png) | m3-math-03-a1; m3-math-03-a2; m3-math-08-a1 | 3ème maternelle | Un triangle aux trois côtés différents, posé de travers | 5 | pass | yes | pass | pass | KEEP | Unambiguous geometry; orientation/colour variants prevent a prototype-only cue. | Retain exact bytes. | none: retain |
| [forme-disque-petit](astra-baseline/assets-1.png) | m3-math-03-a1; m3-math-03-a2; m3-math-08-a1 | 3ème maternelle | Un petit disque, tout rond | 5 | pass | yes | pass | pass | KEEP | Unambiguous geometry; orientation/colour variants prevent a prototype-only cue. | Retain exact bytes. | none: retain |
| [objet-cuillere](astra-baseline/assets-1.png) | m1-math-04-a1; m1-math-06-a1; m1-math-08-a1; m1-math-10-a1; m1-math-15-a1; m1-math-20-a1 | 1ère maternelle | Une cuillère | 3 | concern | yes | concern | pass | REFINE | Short handle and large bowl can read as a hand mirror. | Lengthen handle; use a shallow oval bowl and restrained metal shading. | expected lapse for dependent lessons (6 mapped); compute before commit |
| [objet-crayon](astra-baseline/assets-2.png) | m3-lang-02-a2; m3-lang-19-a2 | 3ème maternelle | Un crayon | 4 | pass | yes | pass | pass | KEEP | Graphite tip, shaft and eraser are distinct; simple silhouette helps repeated use. | Retain. | none: retain |
| [objet-cahier](astra-baseline/assets-2.png) | m3-lang-02-a2; m3-lang-19-a2 | 3ème maternelle | Un cahier | 4 | pass | yes | pass | pass | KEEP | Spine and ruled label read clearly as a school notebook. | Retain. | none: retain |
| [objet-sac](astra-baseline/assets-2.png) | m3-lang-02-a2 | 3ème maternelle | Un sac d’école | 3 | concern | yes | concern | pass | REFINE | Front view reads as a handbag as readily as a school bag. | Show a softly rounded backpack and visible shoulder straps. | expected lapse for dependent lessons (1 mapped); compute before commit |
| [objet-table](astra-baseline/assets-2.png) | m1-lang-02-a2; m1-lang-06-a2; m3-lang-02-a2 | 1ère maternelle, 3ème maternelle | Une table | 4 | pass | yes | pass | pass | KEEP | Top and four legs remain separable; object name is clear. | Retain. | none: retain |
| [objet-chaise](astra-baseline/assets-2.png) | m1-lang-02-a2; m1-lang-06-a2; m3-lang-02-a2 | 1ère maternelle, 3ème maternelle | Une chaise | 4 | pass | yes | pass | pass | KEEP | Back, seat and legs remain distinct. | Retain. | none: retain |
| [objet-porte](astra-baseline/assets-2.png) | m1-lang-01-a2; m1-lang-06-a2; m1-lang-22-a2; m3-lang-07-a2; m3-lang-19-a2 | 1ère maternelle, 3ème maternelle | Une porte | 4 | pass | yes | pass | pass | KEEP | Frame, panels and handle clearly identify a door. | Retain. | none: retain |
| [objet-fenetre](astra-baseline/assets-2.png) | m3-lang-07-a2 | 3ème maternelle | Une fenêtre | 4 | pass | yes | pass | pass | KEEP | Frame and sill identify a window; sun is a small contextual cue. | Retain. | none: retain |
| [objet-lit](astra-baseline/assets-2.png) | m3-lang-07-a2 | 3ème maternelle | Un lit | 4 | pass | yes | pass | pass | KEEP | Pillow, blanket and headboard make a clear bed silhouette. | Retain. | none: retain |
| [objet-marmite](astra-baseline/assets-2.png) | m3-lang-07-a2; m3-lang-19-a2 | 3ème maternelle | Une marmite | 4 | pass | yes | pass | pass | KEEP | Lid, deep vessel and two side handles clearly identify a cooking pot. | Retain. | none: retain |
| [objet-seau](astra-baseline/assets-3.png) | m1-lang-01-a2; m1-lang-06-a2; m1-lang-22-a2; m3-lang-07-a2 | 1ère maternelle, 3ème maternelle | Un seau | 4 | pass | yes | pass | pass | KEEP | Arched handle and open tapering vessel are distinct from the pot. | Retain. | none: retain |
| [objet-panier](astra-baseline/assets-3.png) | m3-lang-13-a2; m3-lang-19-a2 | 3ème maternelle | Un panier | 4 | pass | yes | pass | pass | KEEP | Woven surface and handle support recognition without a label. | Retain. | none: retain |
| [objet-tomate](astra-baseline/assets-3.png) | m3-lang-13-a2; m3-lang-19-a2 | 3ème maternelle | Une tomate | 3 | pass | yes | pass | pass | REFINE | Recognizable but spherical disk and radiating stalk remain icon-like. | Organic lobed silhouette, short calyx and softer highlight. | expected lapse for dependent lessons (2 mapped); compute before commit |
| [objet-banane](astra-baseline/assets-3.png) | m3-lang-13-a2 | 3ème maternelle | Une banane | 3 | pass | yes | pass | pass | REFINE | Crescent is recognizable; square stem and needle tip look mechanical. | Natural tapered ends and restrained curved ridge. | expected lapse for dependent lessons (1 mapped); compute before commit |
| [objet-oignon](astra-baseline/assets-3.png) | m3-lang-13-a2 | 3ème maternelle | Un oignon | 3 | concern | yes | concern | pass | REFINE | Grey sprouting bulb can read as garlic or a generic seed. | Warm papery skin, dry neck and fine root tuft; keep one whole onion. | expected lapse for dependent lessons (1 mapped); compute before commit |
| [objet-caillou](astra-baseline/assets-3.png) | m3-math-01-a1; m3-math-02-a1; m3-math-04-a2; m3-math-05-a1; m3-math-07-a1; m3-math-09-a1; m3-math-10-a2; m3-math-11-a1; m3-math-12-a1; m3-math-17-a1; m3-math-19-a2; m3-math-20-a1; m3-math-22-a1 | 3ème maternelle | Un caillou | 4 | pass | yes | pass | pass | KEEP | Simple irregular pebble remains clear when repeated for counting. | Retain; do not introduce extra marks resembling counters. | none: retain |
| [corps-main](astra-baseline/assets-3.png) | m1-world-02-a1; m1-lang-11-a2; m1-lang-18-a2; m1-world-20-a1; m1-lang-22-a2 | 1ère maternelle | Une main ouverte, les cinq doigts écartés | 2 | concern | yes | concern | concern | REDRAW | Oval palm overlays separate tubular fingers; wrist reads as glove cuff. | Continuous natural hand silhouette, five credible digits, short forearm, soft skin modelling. | expected lapse for dependent lessons (5 mapped); compute before commit |
| [corps-pied](astra-baseline/assets-3.png) | m1-world-02-a1; m1-lang-11-a2; m1-lang-18-a2; m1-world-20-a1 | 1ère maternelle | Un pied nu, vu de dessus, avec ses cinq orteils | 1 | fail | concern | concern | concern | REDRAW | Five circular beads sit above an oval sole; reads as a footprint symbol. | Natural top/three-quarter foot with connected toes, ankle and instep; no detached circles. | expected lapse for dependent lessons (4 mapped); compute before commit |
| [corps-tete](astra-baseline/assets-3.png) | m1-world-08-a1; m1-lang-13-a2; m1-lang-18-a2; m1-world-20-a1; m1-lang-22-a2 | 1ère maternelle | La tête d’un enfant, avec ses cheveux, ses oreilles et son sourire | 2 | pass | yes | pass | concern | REDRAW | Floating neck block and separate shoulder arc look assembled. | Friendly connected head-and-shoulders portrait, natural ears and varied skin tone within the character system. | expected lapse for dependent lessons (5 mapped); compute before commit |
| [corps-ventre](astra-baseline/assets-4.png) | m1-world-08-a1; m1-lang-13-a2; m1-lang-18-a2; m1-world-20-a1 | 1ère maternelle | Le ventre d’un enfant, avec le nombril, le tee-shirt relevé au-dessus et le short en dessous | 1 | concern | concern | concern | concern | REDRAW | Headless torso and block shorts feel detached; belly outline is rigid. | Child touching their own belly, continuous body, relaxed pose and unambiguous target. | expected lapse for dependent lessons (4 mapped); compute before commit |
| [animal-poule](astra-baseline/assets-4.png) | m3-lang-03-a2; m3-world-02-a1; m3-world-05-a1 | 3ème maternelle | Une poule blanche, avec sa crête rouge | 2 | concern | yes | concern | concern | REDRAW | Round body, tube legs and three tail strokes look like a generic bird icon. | Credible hen silhouette: small head, comb/wattle, feathered tail and feet. | expected lapse for dependent lessons (3 mapped); compute before commit |
| [animal-poussin](astra-baseline/assets-4.png) | m3-lang-03-a2; m3-world-05-a1 | 3ème maternelle | Un petit poussin jaune, tout rond | 3 | pass | yes | pass | pass | REFINE | Yellow chick is recognizable but identical rounded machinery limits warmth. | Soft fluffy contour, fine feet and a small natural wing. | expected lapse for dependent lessons (2 mapped); compute before commit |
| [animal-chevre](astra-baseline/assets-4.png) | m3-world-02-a1; m3-lang-09-a2; m3-world-05-a1; m3-world-06-a2 | 3ème maternelle | Une chèvre blanche, avec ses cornes et sa barbichette | 2 | concern | yes | concern | concern | REDRAW | Pill body and straight capsule legs; ears/muzzle and hooves insufficiently distinct. | Goat silhouette with lateral ears, short beard, curved horns and cloven hooves. | expected lapse for dependent lessons (4 mapped); compute before commit |
| [histoire-seau-lisa](astra-baseline/assets-4.png) | m1-lang-03-a2; m1-lang-06-a3; m1-lang-07-a2; m1-lang-08-a3; m1-lang-14-a3; m1-lang-15-a2; m1-lang-17-a2; m1-lang-18-a3 | 1ère maternelle | Lisa, une petite fille en robe rouge, debout à côté d’une chaise, avec son seau bleu posé dessus | 2 | pass | yes | pass | concern | REDRAW | Lisa is visible but is a geometric doll; weak emotional engagement. | Preschool Lisa beside a chair with blue bucket ON its seat; richer warm scene, no extra answer cues. | expected lapse for dependent lessons (8 mapped); compute before commit |
| [histoire-tika](astra-baseline/assets-4.png) | m1-lang-09-a2; m1-lang-21-a2 | 1ère maternelle | Un enfant qui s’étire dans son lit, le soleil à la fenêtre | 2 | concern | yes | concern | concern | REDRAW | Arms end as capsules; child appears mounted behind a bed icon. | Natural waking stretch in bed, connected hands and shoulders, morning light at window. | expected lapse for dependent lessons (2 mapped); compute before commit |
| [histoire-kumu](astra-baseline/assets-4.png) | m3-lang-03-a2; m3-lang-04-a3; m3-lang-09-a3; m3-lang-17-a3 | 3ème maternelle | Kumu, le petit poussin, qui sort tout seul du poulailler dont la porte est ouverte | 2 | pass | yes | pass | concern | REDRAW | Departure reads, but shed and chick are adjacent icons rather than an engaging scene. | Small chick walking away from open henhouse, a little ground/path, no ending revealed. | expected lapse for dependent lessons (4 mapped); compute before commit |
| [histoire-nsimba](astra-baseline/assets-4.png) | m3-lang-01-a3; m3-lang-10-a3; m3-lang-15-a2; m3-lang-15-a3 | 3ème maternelle | Nsimba, un petit garçon avec son sac d’école sur le dos, devant la porte de l’école | 2 | pass | yes | pass | concern | REDRAW | Rectangular limbs and isolated door convey little school context or emotion. | Consistent preschool boy with backpack arriving at a modest school doorway; restrained expression. | expected lapse for dependent lessons (3 mapped); compute before commit |
| [histoire-mangue](astra-baseline/assets-4.png) | m3-lang-02-a3; m3-lang-11-a3; m3-lang-22-a3 | 3ème maternelle | Une mangue entière, et trois morceaux de mangue coupés sur une assiette | 2 | concern | yes | concern | concern | REDRAW | Whole fruit floats and three halves imply three mangoes rather than three pieces. | Single whole mango as reference and exactly three credible cut portions on a plate; verify story quantities. | expected lapse for dependent lessons (3 mapped); compute before commit |
| [histoire-bibi](astra-baseline/assets-5.png) | m3-lang-05-a3; m3-lang-09-a2; m3-lang-13-a3 | 3ème maternelle | Bibi la chèvre, le nez dans un buisson, devant une barrière | 2 | concern | yes | concern | concern | REDRAW | Goat repeats weak anatomy; bush obscures its muzzle and action. | Recognizable goat leaning toward leaves beside a simple fence; clear head/neck gesture. | expected lapse for dependent lessons (3 mapped); compute before commit |
| [histoire-marche](astra-baseline/assets-5.png) | m3-lang-06-a3; m3-lang-12-a3; m3-lang-19-a3 | 3ème maternelle | Un panier de marché avec des tomates, un régime de bananes et un oignon | 3 | concern | yes | concern | pass | REFINE | Banana looks like a single leaf; onion is apple-like; no human story engagement. | Clarify produce silhouettes and basket contents; do not add narrative events. | expected lapse for dependent lessons (3 mapped); compute before commit |
| [histoire-pluie](astra-baseline/assets-5.png) | m1-lang-09-a3; m1-lang-10-a3; m1-lang-15-a3; m1-lang-20-a3; m3-lang-03-a3; m3-art-04-a1; m3-lang-21-a3 | 1ère maternelle, 3ème maternelle | La pluie qui tombe d’un nuage sur le toit d’une maison | 4 | pass | yes | pass | pass | KEEP | Cloud, raindrops, roof and puddle give clear useful context. | Retain; richer scenery would compete with listening to rain. | none: retain |
| [histoire-cailloux](astra-baseline/assets-5.png) | m3-lang-08-a3; m3-lang-14-a3; m3-lang-18-a3 | 3ème maternelle | Trois cailloux différents : un rond, un plat et un pointu | 3 | concern | yes | concern | pass | REFINE | Pointed stone is an exact triangle; can teach a shape symbol instead of a rock. | Natural irregular pointed rock while preserving three distinct stones: round, flat, pointed. | expected lapse for dependent lessons (3 mapped); compute before commit |
| [histoire-malo](astra-baseline/assets-5.png) | m3-lang-07-a3; m3-lang-16-a3; m3-lang-20-a3 | 3ème maternelle | Malo, un petit chien couché en rond sur son tapis, les yeux fermés, sous la lune et les étoiles | 2 | concern | yes | concern | concern | REDRAW | Muzzle is small, tail cat-like; sleeping dog remains ambiguous at small size. | Clear dog profile with long muzzle, floppy ear, forepaws and relaxed curled tail on mat. | expected lapse for dependent lessons (3 mapped); compute before commit |
| [comptine-compter](astra-baseline/assets-5.png) | m3-art-02-a1; m3-art-04-a1 | 3ème maternelle | Une main qui montre trois doigts | 2 | concern | yes | concern | concern | REDRAW | Three raised fingers visible but folded fingers/palm are assembled blobs. | Anatomically credible counting hand with exactly three raised fingers and two naturally folded. | expected lapse for dependent lessons (2 mapped); compute before commit |
| [comptine-bonjour](astra-baseline/assets-5.png) | m1-lang-01-a3; m1-lang-03-a3; m1-lang-13-a3; m1-lang-19-a3 | 1ère maternelle | Le soleil qui se lève derrière la colline, et deux mains qui font bonjour | 2 | concern | yes | concern | concern | REDRAW | Detached cuffed hands flank a giant sun; greeting has no human anchor. | Friendly greeting gesture with natural hand anatomy and restrained sunrise context. | expected lapse for dependent lessons (4 mapped); compute before commit |
| [comptine-mains](astra-baseline/assets-5.png) | m1-lang-02-a3; m1-art-04-a1; m1-lang-04-a3; m1-art-07-a1; m1-art-11-a1; m1-lang-11-a3; m1-lang-16-a3; m1-art-17-a1; m1-lang-22-a3 | 1ère maternelle | Deux mains ouvertes, levées, paumes vers toi | 2 | concern | yes | concern | concern | REDRAW | Both palms are separate ovals; five digits readable but glove-like. | Two natural open hands with short forearms; five fingers each, thumbs inward, clear separation. | expected lapse for dependent lessons (9 mapped); compute before commit |
| [comptine-semaine](astra-baseline/assets-5.png) | unused in September | none | Sept perles sur un fil : cinq rondes, puis deux carrées | 4 | pass | yes | pass | pass | KEEP | Seven beads with five circles and two squares are explicit and distinguishable. | Retain; no September lesson currently uses it. | none: retain |
| [comptine-cabri](astra-baseline/assets-6.png) | unused in September | none | Un petit cabri qui saute, les quatre pattes en l’air, au-dessus de l’herbe | 3 | concern | yes | concern | pass | REFINE | Airborne pose works; goat anatomy inherits generic pill silhouette. | Use the goat family anatomy if later needed; no September lesson currently uses it. | expected lapse for dependent lessons (0 mapped); compute before commit |
| [comptine-formes](astra-baseline/assets-6.png) | m3-art-05-a1; m3-art-07-a1 | 3ème maternelle | Les quatre formes qui dansent : rond, carré, rectangle, triangle | 4 | pass | yes | pass | pass | KEEP | Four recognizable shapes; motion marks are restrained, no distracting faces. | Retain exact geometry. | none: retain |
| [plante-parties](astra-baseline/assets-6.png) | m3-world-03-a1; m3-world-06-a2 | 3ème maternelle | Une plante avec ses feuilles, sa tige et ses racines sous la terre | 3 | pass | yes | pass | pass | REFINE | Plant reads, but roots are a rigid fork and soil is a hard block. | Organic branching roots below a clear soil cutaway; retain leaf, stem, root separation. | expected lapse for dependent lessons (2 mapped); compute before commit |
| [bonhomme-articule](astra-baseline/assets-6.png) | m1-lang-05-a3; m1-lang-07-a3; m1-lang-12-a3; m1-lang-17-a3; m1-lang-21-a3; m3-world-01-a2; m3-world-04-a2 | 1ère maternelle, 3ème maternelle | Un bonhomme dessiné au crayon sur une feuille, avec les bras et les jambes pliés | 4 | pass | yes | pass | pass | KEEP | Stick drawing is purposeful here: an achievable model for drawing joints. | Retain; a finished character would raise the drawing expectation. | none: retain |

## UI findings and isolated correctness defects

- **P1 correctness, isolated — movement payloads:** `m1-phys-06-a1`, `08`, `11`, `15`, `19` ask for throwing but carry running steps; `09`, `12`, `16`, `20` ask for line walking but carry running steps. Other imitation activities also repeat generic running steps. Do not silently edit these approved payloads in a visual task. Independent content correction required.
- **P1 correctness, isolated — off-screen quantity:** `CountTogether` adds “Touche chaque objet…” even when the approved task names fingers, hidden objects, number strips, two sets or making a collection. All September session modes are off-screen. This changes the task presented by the renderer; document exact affected activities before a separate correctness fix.
- **P1 correctness, isolated — generic choices:** `look-and-name` selects `ChooseOne` whenever there is more than one picture. Animal-part observation becomes “Montre : poule” rather than naming parts. Body-part observation similarly becomes an image quiz. Do not silently change teaching behavior.
- **P1 layout:** `ChooseOne` reserves four columns at >=640 px regardless of option count; two/three options leave unused space and undersized TV targets.
- **P1 layout:** child word cards are fixed at 160 px, too wide for two columns inside a 320 px phone; TV labels stay at 24 px despite much larger available width.
- **P2 layout:** narrative picture stacks above text at every size, causing unnecessary TV scroll. Full story-page and question-state QA pending.
- **P2 controls:** “Jouer : je montre le mot” enters a choice interaction; “Montrer à l’enfant” opens a clean screen. They are not behaviorally redundant. Preserve both actions, consider “Jouer avec les images” and make presentation the primary parent action. Opening child mode remounts the renderer and resets the current interaction/page; report before changing behavior.
- **P2 motion:** CSS attention effect runs twice for 900 ms (1.8 seconds), inconsistent with the documented approximate one-second budget. Reduced motion rules exist; verify dynamically.
- **P2 inclusion:** all human assets use one skin tone and geometric limb construction. The replacement family should use natural proportions and varied skin tones without changing named story identities.

## Audio adjacency

Derived from all activities: important-for-pronunciation 18; recommended 30; optional 29; not-needed 225. Recordings 0. Keep existing human recording policy and script. Classification of environmental sound listening as pronunciation is over-broad: flag for recording-plan review, do not synthesize it.

## Implementation batches

| Batch | Scope | State |
| --- | --- | --- |
| 1 | Body parts and hand rhymes; character specification | planned |
| 2 | Everyday object refinements | planned |
| 3 | Animals and plant | planned |
| 4 | Story scenes, referencing approved texts exactly | planned |
| 5 | Math: retain geometry, refine natural stones only | planned |
| 6 | Movement/spatial: preserve real objects; isolate content defects | planned |
| 7 | Responsive layout, TV, control hierarchy, motion | planned |
| 8 | Full interaction QA, before/after, reconfirmation, staging | planned |

No media changed. Approvals before/still valid: 176/176; intentional/unexpected lapses: 0/0; content validation passes. No approval digest edited.

## Every activity

Rows below record source inspection and proposed visual treatment; screen coverage is separately recorded by the capture manifest. “Source reviewed” must never be read as “all interactive states accepted”.

| Activity | Lesson | Class/day | Renderer | Media | Audio | Source review / follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| m1-lang-01-a1 | m1-lang-01 | 1ère maternelle / 1 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-01-a2 | m1-lang-01 | 1ère maternelle / 1 | word-cards | objet-porte, objet-seau | important-for-pronunciation | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-01-a3 | m1-lang-01 | 1ère maternelle / 1 | audio-narrative | comptine-bonjour | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-01-a1 | m1-math-01 | 1ère maternelle / 1 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m1-phys-01-a1 | m1-phys-01 | 1ère maternelle / 1 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-time-01-a1 | m1-time-01 | 1ère maternelle / 1 | look-and-name | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-02-a1 | m1-lang-02 | 1ère maternelle / 2 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-02-a2 | m1-lang-02 | 1ère maternelle / 2 | word-cards | objet-table, objet-chaise | important-for-pronunciation | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-02-a3 | m1-lang-02 | 1ère maternelle / 2 | audio-narrative | comptine-mains | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-02-a1 | m1-math-02 | 1ère maternelle / 2 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m1-phys-02-a1 | m1-phys-02 | 1ère maternelle / 2 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-world-02-a1 | m1-world-02 | 1ère maternelle / 2 | look-and-name | corps-main, corps-pied | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-03-a1 | m1-lang-03 | 1ère maternelle / 3 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-03-a2 | m1-lang-03 | 1ère maternelle / 3 | audio-narrative | histoire-seau-lisa | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-03-a3 | m1-lang-03 | 1ère maternelle / 3 | audio-narrative | comptine-bonjour | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-03-a1 | m1-math-03 | 1ère maternelle / 3 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m1-phys-03-a1 | m1-phys-03 | 1ère maternelle / 3 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-time-03-a1 | m1-time-03 | 1ère maternelle / 3 | look-and-name | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-art-04-a1 | m1-art-04 | 1ère maternelle / 4 | audio-narrative | comptine-mains | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-04-a1 | m1-lang-04 | 1ère maternelle / 4 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-04-a2 | m1-lang-04 | 1ère maternelle / 4 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-04-a3 | m1-lang-04 | 1ère maternelle / 4 | audio-narrative | comptine-mains | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-04-a1 | m1-math-04 | 1ère maternelle / 4 | quantity | objet-cuillere | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m1-phys-04-a1 | m1-phys-04 | 1ère maternelle / 4 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-art-05-a1 | m1-art-05 | 1ère maternelle / 5 | trace-and-draw | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-05-a1 | m1-lang-05 | 1ère maternelle / 5 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-05-a2 | m1-lang-05 | 1ère maternelle / 5 | trace-and-draw | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-05-a3 | m1-lang-05 | 1ère maternelle / 5 | audio-narrative | bonhomme-articule | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-05-a1 | m1-math-05 | 1ère maternelle / 5 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m1-phys-05-a1 | m1-phys-05 | 1ère maternelle / 5 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-lang-06-a1 | m1-lang-06 | 1ère maternelle / 6 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-06-a2 | m1-lang-06 | 1ère maternelle / 6 | word-cards | objet-porte, objet-seau, objet-table, objet-chaise | important-for-pronunciation | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-06-a3 | m1-lang-06 | 1ère maternelle / 6 | audio-narrative | histoire-seau-lisa | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-06-a1 | m1-math-06 | 1ère maternelle / 6 | hands-on | objet-cuillere | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-phys-06-a1 | m1-phys-06 | 1ère maternelle / 6 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-time-06-a1 | m1-time-06 | 1ère maternelle / 6 | look-and-name | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-art-07-a1 | m1-art-07 | 1ère maternelle / 7 | audio-narrative | comptine-mains | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-07-a1 | m1-lang-07 | 1ère maternelle / 7 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-07-a2 | m1-lang-07 | 1ère maternelle / 7 | look-and-name | histoire-seau-lisa | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-07-a3 | m1-lang-07 | 1ère maternelle / 7 | audio-narrative | bonhomme-articule | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-07-a1 | m1-math-07 | 1ère maternelle / 7 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m1-phys-07-a1 | m1-phys-07 | 1ère maternelle / 7 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-lang-08-a1 | m1-lang-08 | 1ère maternelle / 8 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-08-a2 | m1-lang-08 | 1ère maternelle / 8 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-08-a3 | m1-lang-08 | 1ère maternelle / 8 | audio-narrative | histoire-seau-lisa | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-08-a1 | m1-math-08 | 1ère maternelle / 8 | hands-on | objet-cuillere | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-phys-08-a1 | m1-phys-08 | 1ère maternelle / 8 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-world-08-a1 | m1-world-08 | 1ère maternelle / 8 | look-and-name | corps-tete, corps-ventre | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-art-09-a1 | m1-art-09 | 1ère maternelle / 9 | trace-and-draw | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-09-a1 | m1-lang-09 | 1ère maternelle / 9 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-09-a2 | m1-lang-09 | 1ère maternelle / 9 | audio-narrative | histoire-tika | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-09-a3 | m1-lang-09 | 1ère maternelle / 9 | audio-narrative | histoire-pluie | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-09-a1 | m1-math-09 | 1ère maternelle / 9 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m1-phys-09-a1 | m1-phys-09 | 1ère maternelle / 9 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-lang-10-a1 | m1-lang-10 | 1ère maternelle / 10 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-10-a2 | m1-lang-10 | 1ère maternelle / 10 | sound-game | none | important-for-pronunciation | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-10-a3 | m1-lang-10 | 1ère maternelle / 10 | audio-narrative | histoire-pluie | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-10-a1 | m1-math-10 | 1ère maternelle / 10 | hands-on | objet-cuillere | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-phys-10-a1 | m1-phys-10 | 1ère maternelle / 10 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-time-10-a1 | m1-time-10 | 1ère maternelle / 10 | look-and-name | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-art-11-a1 | m1-art-11 | 1ère maternelle / 11 | audio-narrative | comptine-mains | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-11-a1 | m1-lang-11 | 1ère maternelle / 11 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-11-a2 | m1-lang-11 | 1ère maternelle / 11 | word-cards | corps-main, corps-pied | important-for-pronunciation | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-11-a3 | m1-lang-11 | 1ère maternelle / 11 | audio-narrative | comptine-mains | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-11-a1 | m1-math-11 | 1ère maternelle / 11 | group-and-match | forme-disque, forme-carre | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-phys-11-a1 | m1-phys-11 | 1ère maternelle / 11 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-lang-12-a1 | m1-lang-12 | 1ère maternelle / 12 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-12-a2 | m1-lang-12 | 1ère maternelle / 12 | trace-and-draw | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-12-a3 | m1-lang-12 | 1ère maternelle / 12 | audio-narrative | bonhomme-articule | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-12-a1 | m1-math-12 | 1ère maternelle / 12 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-phys-12-a1 | m1-phys-12 | 1ère maternelle / 12 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-time-12-a1 | m1-time-12 | 1ère maternelle / 12 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-13-a1 | m1-lang-13 | 1ère maternelle / 13 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-13-a2 | m1-lang-13 | 1ère maternelle / 13 | word-cards | corps-tete, corps-ventre | important-for-pronunciation | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-13-a3 | m1-lang-13 | 1ère maternelle / 13 | audio-narrative | comptine-bonjour | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-13-a1 | m1-math-13 | 1ère maternelle / 13 | group-and-match | forme-disque, forme-carre | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-phys-13-a1 | m1-phys-13 | 1ère maternelle / 13 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-world-13-a1 | m1-world-13 | 1ère maternelle / 13 | look-and-name | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-art-14-a1 | m1-art-14 | 1ère maternelle / 14 | trace-and-draw | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-14-a1 | m1-lang-14 | 1ère maternelle / 14 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-14-a2 | m1-lang-14 | 1ère maternelle / 14 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-14-a3 | m1-lang-14 | 1ère maternelle / 14 | audio-narrative | histoire-seau-lisa | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-14-a1 | m1-math-14 | 1ère maternelle / 14 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m1-phys-14-a1 | m1-phys-14 | 1ère maternelle / 14 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-lang-15-a1 | m1-lang-15 | 1ère maternelle / 15 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-15-a2 | m1-lang-15 | 1ère maternelle / 15 | audio-narrative | histoire-seau-lisa | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-15-a3 | m1-lang-15 | 1ère maternelle / 15 | audio-narrative | histoire-pluie | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-15-a1 | m1-math-15 | 1ère maternelle / 15 | hands-on | objet-cuillere | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-phys-15-a1 | m1-phys-15 | 1ère maternelle / 15 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-time-15-a1 | m1-time-15 | 1ère maternelle / 15 | look-and-name | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-16-a1 | m1-lang-16 | 1ère maternelle / 16 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-16-a2 | m1-lang-16 | 1ère maternelle / 16 | sound-game | none | important-for-pronunciation | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-16-a3 | m1-lang-16 | 1ère maternelle / 16 | audio-narrative | comptine-mains | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-16-a1 | m1-math-16 | 1ère maternelle / 16 | group-and-match | forme-disque, forme-carre, forme-triangle | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-phys-16-a1 | m1-phys-16 | 1ère maternelle / 16 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-world-16-a1 | m1-world-16 | 1ère maternelle / 16 | look-and-name | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-art-17-a1 | m1-art-17 | 1ère maternelle / 17 | audio-narrative | comptine-mains | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-17-a1 | m1-lang-17 | 1ère maternelle / 17 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-17-a2 | m1-lang-17 | 1ère maternelle / 17 | look-and-name | histoire-seau-lisa | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-17-a3 | m1-lang-17 | 1ère maternelle / 17 | audio-narrative | bonhomme-articule | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-17-a1 | m1-math-17 | 1ère maternelle / 17 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m1-phys-17-a1 | m1-phys-17 | 1ère maternelle / 17 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-lang-18-a1 | m1-lang-18 | 1ère maternelle / 18 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-18-a2 | m1-lang-18 | 1ère maternelle / 18 | word-cards | corps-main, corps-pied, corps-tete, corps-ventre | important-for-pronunciation | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-18-a3 | m1-lang-18 | 1ère maternelle / 18 | audio-narrative | histoire-seau-lisa | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-18-a1 | m1-math-18 | 1ère maternelle / 18 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-phys-18-a1 | m1-phys-18 | 1ère maternelle / 18 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-time-18-a1 | m1-time-18 | 1ère maternelle / 18 | look-and-name | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-art-19-a1 | m1-art-19 | 1ère maternelle / 19 | trace-and-draw | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-19-a1 | m1-lang-19 | 1ère maternelle / 19 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-19-a2 | m1-lang-19 | 1ère maternelle / 19 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-19-a3 | m1-lang-19 | 1ère maternelle / 19 | audio-narrative | comptine-bonjour | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-19-a1 | m1-math-19 | 1ère maternelle / 19 | group-and-match | forme-disque, forme-carre, forme-triangle | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-phys-19-a1 | m1-phys-19 | 1ère maternelle / 19 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-lang-20-a1 | m1-lang-20 | 1ère maternelle / 20 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-20-a2 | m1-lang-20 | 1ère maternelle / 20 | trace-and-draw | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-20-a3 | m1-lang-20 | 1ère maternelle / 20 | audio-narrative | histoire-pluie | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-20-a1 | m1-math-20 | 1ère maternelle / 20 | quantity | objet-cuillere | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m1-phys-20-a1 | m1-phys-20 | 1ère maternelle / 20 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-world-20-a1 | m1-world-20 | 1ère maternelle / 20 | look-and-name | corps-main, corps-pied, corps-tete, corps-ventre | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-21-a1 | m1-lang-21 | 1ère maternelle / 21 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-21-a2 | m1-lang-21 | 1ère maternelle / 21 | audio-narrative | histoire-tika | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-21-a3 | m1-lang-21 | 1ère maternelle / 21 | audio-narrative | bonhomme-articule | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-21-a1 | m1-math-21 | 1ère maternelle / 21 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-phys-21-a1 | m1-phys-21 | 1ère maternelle / 21 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-time-21-a1 | m1-time-21 | 1ère maternelle / 21 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-22-a1 | m1-lang-22 | 1ère maternelle / 22 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m1-lang-22-a2 | m1-lang-22 | 1ère maternelle / 22 | word-cards | objet-porte, objet-seau, corps-main, corps-tete | important-for-pronunciation | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-lang-22-a3 | m1-lang-22 | 1ère maternelle / 22 | audio-narrative | comptine-mains | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m1-math-22-a1 | m1-math-22 | 1ère maternelle / 22 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m1-phys-22-a1 | m1-phys-22 | 1ère maternelle / 22 | move | none | not-needed | Source reviewed. Check instruction versus generic moves; isolate mismatch. |
| m1-world-22-a1 | m1-world-22 | 1ère maternelle / 22 | look-and-name | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-01-a1 | m3-lang-01 | 3ème maternelle / 1 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-01-a2 | m3-lang-01 | 3ème maternelle / 1 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-01-a3 | m3-lang-01 | 3ème maternelle / 1 | audio-narrative | histoire-nsimba | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-01-a1 | m3-math-01 | 3ème maternelle / 1 | quantity | objet-caillou | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-math-01-a2 | m3-math-01 | 3ème maternelle / 1 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-phys-01-a1 | m3-phys-01 | 3ème maternelle / 1 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-world-01-a1 | m3-world-01 | 3ème maternelle / 1 | look-and-name | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-world-01-a2 | m3-world-01 | 3ème maternelle / 1 | trace-and-draw | bonhomme-articule | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-art-01-a1 | m3-art-01 | 3ème maternelle / 2 | trace-and-draw | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-02-a1 | m3-lang-02 | 3ème maternelle / 2 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-02-a2 | m3-lang-02 | 3ème maternelle / 2 | word-cards | objet-cahier, objet-crayon, objet-sac, objet-table, objet-chaise | important-for-pronunciation | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-lang-02-a3 | m3-lang-02 | 3ème maternelle / 2 | audio-narrative | histoire-mangue | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-02-a1 | m3-math-02 | 3ème maternelle / 2 | hands-on | objet-caillou | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-02-a2 | m3-math-02 | 3ème maternelle / 2 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-phys-02-a1 | m3-phys-02 | 3ème maternelle / 2 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-03-a1 | m3-lang-03 | 3ème maternelle / 3 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-03-a2 | m3-lang-03 | 3ème maternelle / 3 | audio-narrative | animal-poussin, animal-poule, histoire-kumu | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-lang-03-a3 | m3-lang-03 | 3ème maternelle / 3 | audio-narrative | histoire-pluie | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-03-a1 | m3-math-03 | 3ème maternelle / 3 | look-and-name | forme-carre, forme-carre-penche, forme-rectangle, forme-rectangle-debout, forme-triangle, forme-triangle-quelconque, forme-disque, forme-disque-petit | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-03-a2 | m3-math-03 | 3ème maternelle / 3 | group-and-match | forme-carre, forme-triangle-quelconque, forme-disque, forme-rectangle-debout, forme-carre-penche, forme-rectangle, forme-disque-petit, forme-triangle | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-phys-03-a1 | m3-phys-03 | 3ème maternelle / 3 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-01-a1 | m3-time-01 | 3ème maternelle / 3 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-01-a2 | m3-time-01 | 3ème maternelle / 3 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-art-02-a1 | m3-art-02 | 3ème maternelle / 4 | audio-narrative | comptine-compter | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-lang-04-a1 | m3-lang-04 | 3ème maternelle / 4 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-04-a2 | m3-lang-04 | 3ème maternelle / 4 | sound-game | none | important-for-pronunciation | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-04-a3 | m3-lang-04 | 3ème maternelle / 4 | audio-narrative | histoire-kumu | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-04-a1 | m3-math-04 | 3ème maternelle / 4 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-math-04-a2 | m3-math-04 | 3ème maternelle / 4 | hands-on | objet-caillou | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-phys-04-a1 | m3-phys-04 | 3ème maternelle / 4 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-05-a1 | m3-lang-05 | 3ème maternelle / 5 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-05-a2 | m3-lang-05 | 3ème maternelle / 5 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-05-a3 | m3-lang-05 | 3ème maternelle / 5 | audio-narrative | histoire-bibi | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-05-a1 | m3-math-05 | 3ème maternelle / 5 | quantity | objet-caillou | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-math-05-a2 | m3-math-05 | 3ème maternelle / 5 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-phys-05-a1 | m3-phys-05 | 3ème maternelle / 5 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-world-02-a1 | m3-world-02 | 3ème maternelle / 5 | look-and-name | animal-poule, animal-chevre | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-world-02-a2 | m3-world-02 | 3ème maternelle / 5 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-06-a1 | m3-lang-06 | 3ème maternelle / 6 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-06-a2 | m3-lang-06 | 3ème maternelle / 6 | sound-game | none | important-for-pronunciation | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-06-a3 | m3-lang-06 | 3ème maternelle / 6 | audio-narrative | histoire-marche | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-06-a1 | m3-math-06 | 3ème maternelle / 6 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-math-06-a2 | m3-math-06 | 3ème maternelle / 6 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-phys-06-a1 | m3-phys-06 | 3ème maternelle / 6 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-02-a1 | m3-time-02 | 3ème maternelle / 6 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-02-a2 | m3-time-02 | 3ème maternelle / 6 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-art-03-a1 | m3-art-03 | 3ème maternelle / 7 | trace-and-draw | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-07-a1 | m3-lang-07 | 3ème maternelle / 7 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-07-a2 | m3-lang-07 | 3ème maternelle / 7 | word-cards | objet-porte, objet-fenetre, objet-lit, objet-marmite, objet-seau | important-for-pronunciation | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-lang-07-a3 | m3-lang-07 | 3ème maternelle / 7 | audio-narrative | histoire-malo | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-07-a1 | m3-math-07 | 3ème maternelle / 7 | hands-on | objet-caillou | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-07-a2 | m3-math-07 | 3ème maternelle / 7 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-phys-07-a1 | m3-phys-07 | 3ème maternelle / 7 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-08-a1 | m3-lang-08 | 3ème maternelle / 8 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-08-a2 | m3-lang-08 | 3ème maternelle / 8 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-08-a3 | m3-lang-08 | 3ème maternelle / 8 | audio-narrative | histoire-cailloux | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-08-a1 | m3-math-08 | 3ème maternelle / 8 | group-and-match | forme-carre, forme-carre-penche, forme-rectangle, forme-rectangle-debout, forme-triangle, forme-triangle-quelconque, forme-disque, forme-disque-petit | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-08-a2 | m3-math-08 | 3ème maternelle / 8 | look-and-name | forme-carre, forme-rectangle, forme-triangle, forme-disque | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-phys-08-a1 | m3-phys-08 | 3ème maternelle / 8 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-03-a1 | m3-time-03 | 3ème maternelle / 8 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-03-a2 | m3-time-03 | 3ème maternelle / 8 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-09-a1 | m3-lang-09 | 3ème maternelle / 9 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-09-a2 | m3-lang-09 | 3ème maternelle / 9 | audio-narrative | animal-chevre, histoire-bibi | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-lang-09-a3 | m3-lang-09 | 3ème maternelle / 9 | audio-narrative | histoire-kumu | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-09-a1 | m3-math-09 | 3ème maternelle / 9 | quantity | objet-caillou | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-math-09-a2 | m3-math-09 | 3ème maternelle / 9 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-phys-09-a1 | m3-phys-09 | 3ème maternelle / 9 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-world-03-a1 | m3-world-03 | 3ème maternelle / 9 | look-and-name | plante-parties | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-world-03-a2 | m3-world-03 | 3ème maternelle / 9 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-10-a1 | m3-lang-10 | 3ème maternelle / 10 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-10-a2 | m3-lang-10 | 3ème maternelle / 10 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-10-a3 | m3-lang-10 | 3ème maternelle / 10 | audio-narrative | histoire-nsimba | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-10-a1 | m3-math-10 | 3ème maternelle / 10 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-math-10-a2 | m3-math-10 | 3ème maternelle / 10 | hands-on | objet-caillou | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-phys-10-a1 | m3-phys-10 | 3ème maternelle / 10 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-04-a1 | m3-time-04 | 3ème maternelle / 10 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-04-a2 | m3-time-04 | 3ème maternelle / 10 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-11-a1 | m3-lang-11 | 3ème maternelle / 11 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-11-a2 | m3-lang-11 | 3ème maternelle / 11 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-11-a3 | m3-lang-11 | 3ème maternelle / 11 | audio-narrative | histoire-mangue | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-11-a1 | m3-math-11 | 3ème maternelle / 11 | hands-on | objet-caillou | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-11-a2 | m3-math-11 | 3ème maternelle / 11 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-phys-11-a1 | m3-phys-11 | 3ème maternelle / 11 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-world-04-a1 | m3-world-04 | 3ème maternelle / 11 | look-and-name | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-world-04-a2 | m3-world-04 | 3ème maternelle / 11 | trace-and-draw | bonhomme-articule | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-art-04-a1 | m3-art-04 | 3ème maternelle / 12 | audio-narrative | histoire-pluie, comptine-compter | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-lang-12-a1 | m3-lang-12 | 3ème maternelle / 12 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-12-a2 | m3-lang-12 | 3ème maternelle / 12 | group-and-match | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-12-a3 | m3-lang-12 | 3ème maternelle / 12 | audio-narrative | histoire-marche | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-12-a1 | m3-math-12 | 3ème maternelle / 12 | hands-on | objet-caillou | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-12-a2 | m3-math-12 | 3ème maternelle / 12 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-phys-12-a1 | m3-phys-12 | 3ème maternelle / 12 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-13-a1 | m3-lang-13 | 3ème maternelle / 13 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-13-a2 | m3-lang-13 | 3ème maternelle / 13 | word-cards | objet-tomate, objet-banane, objet-oignon, objet-panier | important-for-pronunciation | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-lang-13-a3 | m3-lang-13 | 3ème maternelle / 13 | audio-narrative | histoire-bibi | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-13-a1 | m3-math-13 | 3ème maternelle / 13 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-math-13-a2 | m3-math-13 | 3ème maternelle / 13 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-phys-13-a1 | m3-phys-13 | 3ème maternelle / 13 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-05-a1 | m3-time-05 | 3ème maternelle / 13 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-05-a2 | m3-time-05 | 3ème maternelle / 13 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-art-05-a1 | m3-art-05 | 3ème maternelle / 14 | audio-narrative | comptine-formes | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-lang-14-a1 | m3-lang-14 | 3ème maternelle / 14 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-14-a2 | m3-lang-14 | 3ème maternelle / 14 | sound-game | none | important-for-pronunciation | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-14-a3 | m3-lang-14 | 3ème maternelle / 14 | audio-narrative | histoire-cailloux | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-14-a1 | m3-math-14 | 3ème maternelle / 14 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-math-14-a2 | m3-math-14 | 3ème maternelle / 14 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-phys-14-a1 | m3-phys-14 | 3ème maternelle / 14 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-15-a1 | m3-lang-15 | 3ème maternelle / 15 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-15-a2 | m3-lang-15 | 3ème maternelle / 15 | audio-narrative | histoire-nsimba | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-lang-15-a3 | m3-lang-15 | 3ème maternelle / 15 | audio-narrative | histoire-nsimba | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-15-a1 | m3-math-15 | 3ème maternelle / 15 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-math-15-a2 | m3-math-15 | 3ème maternelle / 15 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-phys-15-a1 | m3-phys-15 | 3ème maternelle / 15 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-world-05-a1 | m3-world-05 | 3ème maternelle / 15 | look-and-name | animal-poule, animal-chevre, animal-poussin | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-world-05-a2 | m3-world-05 | 3ème maternelle / 15 | trace-and-draw | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-16-a1 | m3-lang-16 | 3ème maternelle / 16 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-16-a2 | m3-lang-16 | 3ème maternelle / 16 | sound-game | none | important-for-pronunciation | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-16-a3 | m3-lang-16 | 3ème maternelle / 16 | audio-narrative | histoire-malo | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-16-a1 | m3-math-16 | 3ème maternelle / 16 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-math-16-a2 | m3-math-16 | 3ème maternelle / 16 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-phys-16-a1 | m3-phys-16 | 3ème maternelle / 16 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-06-a1 | m3-time-06 | 3ème maternelle / 16 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-06-a2 | m3-time-06 | 3ème maternelle / 16 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-art-06-a1 | m3-art-06 | 3ème maternelle / 17 | trace-and-draw | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-17-a1 | m3-lang-17 | 3ème maternelle / 17 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-17-a2 | m3-lang-17 | 3ème maternelle / 17 | sound-game | none | important-for-pronunciation | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-17-a3 | m3-lang-17 | 3ème maternelle / 17 | audio-narrative | histoire-kumu | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-17-a1 | m3-math-17 | 3ème maternelle / 17 | hands-on | objet-caillou | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-17-a2 | m3-math-17 | 3ème maternelle / 17 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-phys-17-a1 | m3-phys-17 | 3ème maternelle / 17 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-18-a1 | m3-lang-18 | 3ème maternelle / 18 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-18-a2 | m3-lang-18 | 3ème maternelle / 18 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-18-a3 | m3-lang-18 | 3ème maternelle / 18 | audio-narrative | histoire-cailloux | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-18-a1 | m3-math-18 | 3ème maternelle / 18 | group-and-match | forme-carre, forme-rectangle, forme-triangle, forme-disque | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-18-a2 | m3-math-18 | 3ème maternelle / 18 | trace-and-draw | forme-carre, forme-rectangle, forme-triangle, forme-disque | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-phys-18-a1 | m3-phys-18 | 3ème maternelle / 18 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-07-a1 | m3-time-07 | 3ème maternelle / 18 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-07-a2 | m3-time-07 | 3ème maternelle / 18 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-19-a1 | m3-lang-19 | 3ème maternelle / 19 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-19-a2 | m3-lang-19 | 3ème maternelle / 19 | group-and-match | objet-cahier, objet-crayon, objet-porte, objet-marmite, objet-tomate, objet-panier | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-lang-19-a3 | m3-lang-19 | 3ème maternelle / 19 | audio-narrative | histoire-marche | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-19-a1 | m3-math-19 | 3ème maternelle / 19 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-math-19-a2 | m3-math-19 | 3ème maternelle / 19 | hands-on | objet-caillou | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-phys-19-a1 | m3-phys-19 | 3ème maternelle / 19 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-world-06-a1 | m3-world-06 | 3ème maternelle / 19 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-world-06-a2 | m3-world-06 | 3ème maternelle / 19 | look-and-name | plante-parties, animal-chevre | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-lang-20-a1 | m3-lang-20 | 3ème maternelle / 20 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-20-a2 | m3-lang-20 | 3ème maternelle / 20 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-20-a3 | m3-lang-20 | 3ème maternelle / 20 | audio-narrative | histoire-malo | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-20-a1 | m3-math-20 | 3ème maternelle / 20 | hands-on | objet-caillou | not-needed | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-20-a2 | m3-math-20 | 3ème maternelle / 20 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-phys-20-a1 | m3-phys-20 | 3ème maternelle / 20 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-08-a1 | m3-time-08 | 3ème maternelle / 20 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-time-08-a2 | m3-time-08 | 3ème maternelle / 20 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-21-a1 | m3-lang-21 | 3ème maternelle / 21 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-21-a2 | m3-lang-21 | 3ème maternelle / 21 | sound-game | none | important-for-pronunciation | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-21-a3 | m3-lang-21 | 3ème maternelle / 21 | audio-narrative | histoire-pluie | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-21-a1 | m3-math-21 | 3ème maternelle / 21 | group-and-match | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-math-21-a2 | m3-math-21 | 3ème maternelle / 21 | quantity | none | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-phys-21-a1 | m3-phys-21 | 3ème maternelle / 21 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-world-07-a1 | m3-world-07 | 3ème maternelle / 21 | trace-and-draw | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-world-07-a2 | m3-world-07 | 3ème maternelle / 21 | look-and-name | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-art-07-a1 | m3-art-07 | 3ème maternelle / 22 | audio-narrative | comptine-formes | recommended | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-art-07-a2 | m3-art-07 | 3ème maternelle / 22 | trace-and-draw | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-22-a1 | m3-lang-22 | 3ème maternelle / 22 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-22-a2 | m3-lang-22 | 3ème maternelle / 22 | oral-exchange | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-lang-22-a3 | m3-lang-22 | 3ème maternelle / 22 | audio-narrative | histoire-mangue | optional | Source reviewed. Inspect composition with asset decisions above; preserve instruction. |
| m3-math-22-a1 | m3-math-22 | 3ème maternelle / 22 | quantity | objet-caillou | not-needed | Source reviewed. Isolate generic screen-counting mismatch; no pedagogy change. |
| m3-math-22-a2 | m3-math-22 | 3ème maternelle / 22 | hands-on | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
| m3-phys-22-a1 | m3-phys-22 | 3ème maternelle / 22 | move | none | not-needed | Source reviewed. Retain off-screen interaction; verify in-app composition. |
