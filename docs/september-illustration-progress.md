# September visual upgrade — progress log

Running log, newest entry last. Each entry says what was completed, what remains, what changed
on disk, and whether the checks passed. The exact resume point is in
[`work/ACTIVE_TASK.md`](work/ACTIVE_TASK.md); the counts are in
[`september-illustration-audit.md`](september-illustration-audit.md) (generated).

## Child-facing wording changes

Every change to an approved child-facing sentence is listed here and in the state file
(`decisions.progress.wordingChanges`). None so far.

## Log

### 2026-09-22 — B0 tracking system (done, `6d04196`)

**Completed**

- Previous task archived (`docs/work/archive/2026-09-beta-0-1-release.md`); new checkpoint.
- `docs/september-illustration-state.json`: verdict, priority and reason for all 49 assets;
  UX, motion and audio rules per renderer family; the six batches.
- `lib/content/visual-audit.ts` + `scripts/visual-audit.ts` (`npm run visual:audit`): the audit
  is generated from the content and the state file — 176 lessons, 302 activities, every one on
  its instructional day with its route.
- `tests/unit/visual-audit.test.ts`: freshness of the audit and of the derived state, full
  coverage, no verdict on an unknown asset, audio required nowhere.
- This plan, this log, the open items.

**Audit result** — 49 assets: keep 8 (the shapes), refine 18 (objects, the plant, the jointed
figure), redraw 23 (body parts, animals, stories, rhymes). 41 pictures to change. 48 activities
where a human recording is recommended, 29 where narration is optional, 0 where audio is
required. Motion is planned on the families that render 176 activities.

**Remains** — B1 to QA, as in the plan.

### 2026-09-22 — B1 UX frame, motion and audio plumbing (done)

**Completed** — no content change; every approval intact.

- **The stage.** Every picture sits on a tinted rounded panel (`.teka-stage`, token `--stage`):
  one large stage for a story picture or the thing to look at, one small stage per word card,
  counter or choice. Cards no longer read as empty.
- **Word cards**: stage, word in a larger weight, « Écouter : le mot » beside it when a recording
  exists (none does). The naming game is unchanged.
- **Rhymes**: larger lines with wide leading, arriving in sequence once; **stories**: three lines
  a page, the page rises once on turn; « Écouter la comptine » / « Écouter l'histoire » when a
  recording exists.
- **Off-screen frame**: soft filled panel instead of the dashed outline; the label says « Regardez
  l'image ensemble » only when there is a picture, and « Posez l'écran » otherwise — the dashed
  frame around movement steps used to say "look at the image" with no image.
- **The child's screen**: pictures and tiles grow one step (`ChildViewContext`), the counting row
  and count are centred, the choice tiles are taller.
- **Motion**: staggered entrances on cards, lines, steps, counters and choices (`teka-stagger`,
  a delayed `teka-rise`, capped at 600 ms) and the page turn. Still four keyframes; all off under
  `prefers-reduced-motion` (E2E proves it).
- **Audio plumbing**: `pronunciationFor(word, assets)` matches a `pronunciation` asset by its
  transcript, so a recorded word lights up on every card that teaches it with no change to the
  approved content; the session view resolves it per taught word.
- **Docs**: ADR-048 (a redraw lapses approvals and is reconfirmed), the recording brief for both
  classes in `AUDIO_GUIDELINES.md`, the screen patterns in `PARENT_SESSION.md`, the style
  pointer in `MEDIA_ARCHITECTURE.md`.
- **Tests**: 9 renderer tests (stage, no control without a recording, no autoplay, child-view
  sizes, rhyme lines, page turn, off-screen label), 3 pronunciation-lookup tests.

**Visual QA** — 66 screenshots (11 activities × 3 widths × parent and child views) in the
session scratchpad, not committed. Findings: the frame is right at 390, 820 and 1280 px; the
remaining weakness is the drawings themselves, which is B2–B4 — the Kumu and cailloux pictures
use only half their canvas, the hands and body parts read as icons.

**Checks** — format, lint, typecheck, unit (374), content validation, build, E2E (30 passed,
9 skipped: the production-public suite) all PASS on the working tree before commit.

**Remains** — B2 (1ère set), B3 (3ème set), B4 (objects, contact sheet, reconfirmation, lapses,
migration), QA of the redraws.

### 2026-09-22 — B2 illustrations, the 1ère maternelle set (done)

**Completed** — on `feat/september-illustrations`, stacked on the UX branch.

- `tools/media/build.ts` gained the illustration system: the palette with a shade per tone,
  `ground()`, `face()`, `capsule()` and a parametric `hand()` (thumb side, folded fingers, a
  folded thumb for « trois doigts »). The legacy constants stay for the eight shapes, which are
  byte-identical (`git diff public/media/shapes` is empty).
- **16 pictures redrawn or refined**: `comptine-mains` (two open hands, palms out, thumbs facing
  each other), `corps-main`, `corps-pied`, `corps-tete`, `corps-ventre` (all in a warm brown
  skin), `comptine-compter`, `comptine-bonjour` (sun behind a hill, two waving hands),
  `histoire-seau-lisa` (Lisa in a red dress beside the chair with her blue bucket, still the
  largest thing), `histoire-tika` (a child stretching in bed, sun in the window),
  `histoire-pluie`, `bonhomme-articule` (a crayon figure on a sheet, joints marked), and the
  objects `cuillere`, `porte`, `seau`, `table`, `chaise` (shade, ground, fuller canvas).
- `npm run media:sheet` renders the before/after contact sheet at 72, 128 and 256 px with
  Chromium; the close-ups were reviewed at 2× and two drawings corrected (the foot's heel, the
  belly's shape).
- **44 approvals lapsed, as ADR-048 requires** — 35 in 1ère, 9 in 3ème (the lessons that show
  `histoire-pluie`, `bonhomme-articule` or a refined object). `npm run review:lapse` sets them to
  `review`; it re-stamps nothing.
- **Two gaps found and closed on the way.** The 1ère reviews of 2026-09-15 lived only in the
  lesson `review` blocks, which the lapse deletes: they are now transcribed as `full-review`
  entries in `content/reviews/history.json`, word for word, marked as a transcription. And the
  lapse itself is recorded as one `consequence` entry per affected week, naming the pictures and
  the lessons, so no week can look "never reviewed" because its pictures improved.
- The review-state test now states the rule ADR-048 creates: an accepted week whose lessons are
  at `review` must carry a consequence entry dated on or after the accepting pass.
- Review packages and the pgTAP reference test regenerated. The data migration waits for B4 so
  one migration carries the whole set.

**Checks** — content validation, unit (374) PASS on the working tree.

**Remains** — B3 (3ème set), B4, QA.

### 2026-09-22 — B3 illustrations, the 3ème maternelle set (done)

**Completed**

- Reusable animals in the generator — `chick()`, `hen()`, `goat()` (facing, jumping) — and
  `puffs()` for a cloud or a bush, so Kumu, Bibi and the cabri are the same animals in their
  stories as on their cards.
- **14 pictures redrawn**: `animal-poussin`, `animal-poule`, `animal-chevre`; the stories
  `kumu` (the open henhouse door), `nsimba` (a boy with his school bag at the school door),
  `mangue` (a whole mango and three slices on a plate), `bibi` (nose in a bush at the fence),
  `marche` (basket, tomatoes, bananas, an onion, a coin), `cailloux` (round, flat, pointed),
  `malo` (a puppy asleep on his mat under the moon); the rhymes `formes`, `semaine` (seven
  beads, five round then two square, so the kinds differ by shape and not only by colour),
  `cabri`; and `plante-parties` (soil, roots, stem, four leaves).
- Close-ups reviewed at 2×; one correction (the bead string's ground).
- **23 more approvals lapsed — 67 in total** (35 in 1ère, 32 in 3ème); the ten `consequence`
  entries of 2026-09-22 now name all 30 changed pictures and every lapsed lesson.
- The test that every standing approval records the ISSUE-026 re-stamp now accepts an empty
  set only when the history records the lapse that emptied it.

**Checks** — content validation, unit (374) PASS on the working tree.

**Remains** — B4: the 11 remaining objects, the reviewer's contact sheet in
`docs/review/media/`, `npm run review:visual`, the data migration, QA in the running app.

### 2026-09-23 — B4 objects, reviewer's sheet, reconfirmation packages, migration (done)

**Completed**

- **11 objects refined** with the new palette (`crayon`, `cahier`, `sac`, `fenêtre`, `lit`,
  `marmite`, `panier`, `tomate`, `banane`, `oignon`, `caillou`): a shade band, a ground, a
  fuller canvas, a highlight on the tomato and the stone. The legacy constants now serve the
  eight shapes only. **41 of 49 pictures changed; 8 shapes byte-identical.**
- **13 more approvals lapsed — 80 in total**: 35 in 1ère, 45 in 3ème. Every `consequence`
  entry of 2026-09-22 names all 41 pictures and its week's lessons.
- `npm run review:visual` writes `docs/review/2026-2027-maternelle-1-reconfirmation-visuelle.md`
  (35 lessons, 15 pictures) and `…-maternelle-3-reconfirmation-visuelle.md` (45 lessons, 30
  pictures), and renders `docs/review/media/septembre-avant-apres.png` (41 pictures at 72, 128,
  256 px). The script **verifies before writing** that no reviewable field of any lesson and no
  text changed since `develop`, and refuses to write otherwise.
- Data migration `supabase/migrations/20260922220249_september_visual_upgrade.sql`; local
  `db reset` + **152 pgTAP assertions PASS**.

### 2026-09-23 — QA (done)

- Build with the new pictures; 66 screenshots (11 activities × 3 widths × parent and child
  views) inspected for the two screenshot cases of the brief, the body cards, the shape game,
  counting, the Kumu story and a movement activity.
- E2E: 30 passed (9 skipped: the production-public suite), including reduced motion.
- `npm run media:report`: 0 screens with nothing to show, both classes.
- Unit 374, content validation 31 files, format, lint, typecheck: PASS.

## Final report

### 1. Summary

Every September activity of 1ère and 3ème maternelle was audited (302 activities, 176 lessons,
49 assets). The child's screen got a frame — a stage under every picture, cards, rhyme lines and
steps arriving in sequence, a page turn, a calmer off-screen panel, a bigger child view — with no
content change. 41 of the 49 pictures were redrawn or refined under one illustration system; the
8 shapes were deliberately left alone. Audio got its per-activity decision, the plumbing that
lights a recorded word up on every card that teaches it, and a recording brief — and no
synthetic voice. The approvals of 80 lessons lapsed because the pictures they cover changed; the
lapse is recorded per week, two reconfirmation packages with a before/after sheet are ready for
the reviewer, and the live product is unaffected.

### 2. Audit coverage

176 / 176 lessons, 302 / 302 activities, 49 / 49 assets — generated and freshness-tested
(`docs/september-illustration-audit.md`).

### 3. Illustration improvements completed

41 pictures: 23 redrawn (body parts, hands, animals, all ten story pictures, six rhyme
pictures), 18 refined (17 objects, the plant). Unchanged by decision: the 8 shapes. Contact sheet:
`docs/review/media/septembre-avant-apres.png`.

### 4. Audio additions completed

Zero recordings, by ADR-046 (no synthetic voice for a word the child copies; no paid service).
Delivered instead: the decision per activity (48 recommended, 29 optional, 225 unnecessary, 0
required), `pronunciationFor()` matching a `pronunciation` asset by transcript so a recorded word
appears on every card that teaches it with no content change, listen controls on word cards and
rhymes that render only when a recording exists, and the recording brief in
`docs/AUDIO_GUIDELINES.md` (both classes' words, the seven rhymes, the stories).

### 5. Animation improvements completed

Staggered entrances (`teka-stagger`, a delayed `teka-rise`, capped at 600 ms) on word cards,
rhyme lines, prompts, movement steps, counters and choices; a page turn that rises once. Still
four keyframes; all off under `prefers-reduced-motion`, proved by E2E.

### 6. UX / UI improvements completed

The stage; word cards with a larger word; rhymes in a larger size on one page; stories three
lines a page; the off-screen frame as a soft panel whose label no longer says "look at the image"
when there is none; the child's screen grows pictures one step and centres counting; choice tiles
taller on the child's screen; sort groups as filled panels; feedback unchanged.

### 7. Files changed

- UX branch (`feat/september-visual-ux`, PR #79): `components/session/ActivityRenderer.tsx`,
  `components/session/SessionRunner.tsx`, `app/globals.css`, `lib/programme/session-view.ts`,
  `domain/media/types.ts`, `lib/content/visual-audit.ts`, `scripts/visual-audit.ts`, tests,
  `DECISIONS.md` (ADR-048), docs.
- Illustration branch (`feat/september-illustrations`, PR #80): `tools/media/build.ts`,
  `public/media/**` (41 files), `content/media/registry.json`, `content/lessons/**` (statuses),
  `content/reviews/history.json`, `scripts/media-contact-sheet.ts`, `scripts/lapse-approvals.ts`,
  `scripts/visual-reconfirmation.ts`, `docs/review/**`, `supabase/migrations/20260922220249_…`,
  `supabase/tests/database/reference_data.test.sql`, tests, docs.

### 8. Tests / validation

Both branches: format, lint, typecheck, unit (374), content validation (31 files), build, E2E
(30) PASS. Illustration branch additionally: 152 pgTAP assertions PASS on a local `db reset`.

### 9. Open items

`docs/september-illustration-open-items.md`: the owner submits the two visual reconfirmation
packages (OI-001) and decides who records the audio (OI-002). Deferred: shapes untouched, a
display font, sequenced motion.

### 10. Exact resume point

`docs/work/ACTIVE_TASK.md`. The work is complete on both branches; what remains is the owner's:
merge #79, submit the reconfirmation packages, record the outcome, run `approve-week` per
week, merge #80.

### 2026-09-23 — Final visual QA and freeze (done)

- **All 49 pictures re-judged at 72, 128, 256 px and on a 1920 px child screen**: 35 accepted,
  11 refined, 3 redrawn, 0 open (`docs/work/SEPTEMBER_VISUAL_QA.md`, generated).
- Refined: the hand (read as a glove), the small face's mouth (read as a beard on Lisa and
  Nsimba), the foot's heel stub, the rhyme's touching thumbs, the folded thumb, Kumu (now walks
  away from the open door), the mango slices (read as eggs). Redrawn: the belly, Malo (read as a
  bear), the leaping cabri. **No new lapse**: every changed picture was already under
  reconfirmation.
- Motion: staggered lists never start invisible (`teka-settle`, ADR-045 amended), proved by E2E.
- Child's full screen: word cards centre and grow, an off-screen line becomes the screen,
  prompts scale — found by walking four whole sessions at phone and TV size.
- Audio: four classes; `docs/audio/septembre-script-enregistrement.md` (29 pronunciation
  models, 7 rhymes, 10 optional narrations). Zero recordings.
- Style guide `docs/ILLUSTRATION_STYLE_GUIDE.md`; typography kept (system UI), decision recorded.
- **`SEPTEMBER_VISUAL_ASSETS_FROZEN_FOR_RECONFIRMATION`**: 49 hashes frozen, a test holds them.
  Packages regenerated with per-activity before/after hashes and a verified summary.
- Data migration regenerated as `20260923175037_september_visual_upgrade` (the earlier one had
  never reached a hosted database).

### 2026-09-23 — Reconfirmation result and the m3-art-04-a1 correction (done)

- **1ère `accepted`**: five `full-review` entries; 35 approvals restored with
  `approve-week --lapsed-only` (7 + 9 + 7 + 7 + 5), fresh digests, 53 standing approvals untouched.
- **3ème `accepted-with-modifications`**: `m3-art-04-a1` showed `comptine-compter` (the counting
  rhyme said over the rain-making). Now it names `histoire-pluie`, and
  `domain/lessons/pictures.ts` lets a task's own picture lead a rhyme said over it; a story keeps
  its own picture (so Kumu's and Bibi's story scenes do not change).
- **Narrow media audit** (`lib/content/media-consistency.ts`, test in
  `tests/unit/media-consistency.test.ts`): 110 activities, 184 shown pictures; 1 genuine defect;
  rejected on evidence — `m3-world-06-a2` (plant and goat: the lesson is about caring for an
  animal or a plant, and the guidance says to use the picture), the five 1ère « Je marche, je
  m'arrête » rhymes (the crayon figure with bent legs is a body walking and sitting; tags
  `bouger`, `marcher` added — tags are outside the digest), and `m3-lang-03-a2` / `m3-lang-09-a2`
  (story pictures correctly lead their stories; their older animal pictures stay covered but
  unseen). The test failed on the defect before the fix and passes after.
- No picture file changed; the freeze holds. 3ème package regenerated; the sheet is unchanged.
- Data migration regenerated as `20260923184512_september_visual_upgrade` (never applied to a
  hosted database).
