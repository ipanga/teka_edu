# The parent session

How a parent actually uses Teka Edu, and what the interface does about it. Decision: ADR-039.
The content rules are in [`CONTENT_AUTHORING.md`](CONTENT_AUTHORING.md); the pacing is in
[`ANNUAL_PLAN.md`](ANNUAL_PLAN.md).

## What Teka Edu is

> **A digital répétiteur guided by the parent.**

The child goes to school during the day. Afterwards — usually late afternoon or evening — a
parent opens Teka Edu and runs a structured session of **30 to 45 minutes**, about 35 in
practice. Teka Edu supplies the pedagogy, the words to say and the material; the parent supplies
the presence.

It is **not** a replacement for school, a full school day, an app that keeps a child busy alone,
an AI tutor, or a second curriculum. And it does not know what the class did today: nothing in
the product may claim to. The day's work is called _la leçon du jour_, never _"ce que la maitresse
a fait aujourd’hui"_.

## The daily journey

```text
Choisir la classe      →  1ère · 2ème · 3ème maternelle; a class with no lessons says so
  ↓                       and is not clickable (ADR-044)
Aujourd’hui            →  the date, whether it is a school day, today's session
  ↓                       (not a school day → the most recent session, and why)
À préparer             →  a short list; replacements behind « Je n’ai pas tout »
  ↓
Activité 1 … n         →  two zones (ADR-043)
    · La part de l’enfant     the sentence to read aloud, the picture, the interaction
    · Montrer à l’enfant      fills the device; no parent chrome on it
    · Pour vous               guidance and English, folded away until asked
    · Faire une petite pause · Terminer pour aujourd’hui
  ↓
C’est fini !           →  what the child managed · noter comment ça s’est passé
```

Leaving and coming back is safe: the browser remembers the position and offers
« Reprendre où nous nous étions arrêtés » rather than deciding for you.

Four pages carry it. `<c>` is the class: `1`, `2` or `3` (ADR-044).

| Route                        | What it does                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/`                          | The three maternelle classes. Only a class that has lessons is a link; the others say they are being prepared.                |
| `/maternelle/<c>`            | Today for that class: the date, the session, its length, what to prepare. Offers the most recent session on a non-school day. |
| `/maternelle/<c>/seance/<n>` | One instructional day, run activity by activity. `<n>` is the instructional day, not the date (ADR-004).                      |
| `/maternelle/<c>/calendrier` | The month, day by day: sessions, weekends and holidays, each shown for what it is.                                            |

Only 3ème maternelle has lessons today. 1ère and 2ème appear on the home screen and open nothing —
showing another class's work to a three-year-old is worse than showing nothing.

## Rules the interface follows

- **French first, always.** The child hears the French instruction. English is one short sentence
  behind a button, hidden by default, and folded away again when the parent moves on (ADR-001).
  There is no English version of the programme.
- **One thing at a time.** One activity fills the screen. The instruction for the child is one or
  two short sentences; the guidance for the adult is numbered steps.
- **No curriculum apparatus.** Objective codes, competency titles, success examples, sources and
  digests never appear in the session. They stay in the API, the review packages and the reports.
  A test enforces it.
- **The screen steps back.** Movement, manipulation, drawing and conversation happen away from it;
  the screen holds the words, the pictures and — when a recording exists — the audio.
- **Going back home is the parent's alone.** « ← Accueil » lives in the parent's chrome and never
  on the child's screen. While the child's view is open it is a modal dialog, so the rest of the
  page cannot be clicked at all: a mis-tap cannot end the activity (ADR-044).
- **Motion is decoration.** A card rises, a correct answer pulses once, a wrong one nudges. All of
  it stops under `prefers-reduced-motion`, and no activity needs any of it (ADR-045).
- **The parent is the voice.** Every word is written to be read aloud. Where a human recording
  exists, a small « Écouter » appears beside it — never autoplaying, never the only route
  (ADR-046, [`AUDIO_GUIDELINES.md`](AUDIO_GUIDELINES.md)).
- **Catch-up is normal.** A missed session stays open at its own address. The parent chooses
  today's lesson or an earlier one; nothing is locked and nothing is marked late.

## Renderer families

Fifteen activity kinds share **ten** screens (ADR-036,
[`PHASE3_RENDERER_PLAN.md`](PHASE3_RENDERER_PLAN.md)). `components/session/ActivityRenderer.tsx`
implements the families September uses:

| Family            | Activity kinds                          | What the screen shows                         |
| ----------------- | --------------------------------------- | --------------------------------------------- |
| `oral-exchange`   | conversation                            | The questions to ask, one per line            |
| `word-cards`      | vocabulary                              | The words to teach, as cards                  |
| `audio-narrative` | listening-story, read-aloud, song-rhyme | The full text, plus questions where there are |
| `sound-game`      | phonology                               | The words to play with                        |
| `quantity`        | counting                                | The number line to count along                |
| `group-and-match` | matching, sorting, memory-game          | The categories or the pairs                   |
| `look-and-name`   | observation                             | What to look at                               |
| `trace-and-draw`  | drawing, graphic-practice               | What to draw                                  |
| `move`            | movement                                | The moves, numbered                           |
| `hands-on`        | manipulation                            | What to handle                                |

**Images are implemented** (ADR-042): the shapes, the objects of the three vocabulary corpora,
what gets counted, and the animals of the stories. `npm run media:report` says exactly what is
covered. **Audio is not**, and nothing depends on it: the parent reads aloud, which is what an
adult-guided session does anyway.

### Where the screen steps back

Movement, phonology, drawing, manipulation and most conversation render inside an explicit frame:

> **Posez l'écran : cette activité se fait sans lui**

That is not decoration. It is the difference between a répétiteur and a screen that keeps a child
busy.

### Where a tap teaches

Four interactions, and only where they carry the learning:

- **Montre le carré** — the named picture among four. A wrong tap says « Essaie encore. Regarde
  bien » ; after two, the answer is shown and the parent is asked to name it together.
- **Compter en touchant** — one tap per object, the count said back, always restartable.
- **Ranger par groupes** — tap a picture, tap its group. Tapping, never dragging: small fingers.
- **Je montre le mot** — after the word cards have been seen, the same pictures without their
  words, and the child is asked for one by name.

Nothing is scored. A child who taps the wrong shape has not failed anything, and the interface
never says so.

## Progress

The browser remembers, per day, one of `not_started`, `in_progress`, `completed`, under
`teka-edu.session.<day>` in `localStorage`.

- It is a convenience for the parent, **never a record about a child** (ADR-006).
- Nothing is sent anywhere. There is no account, no profile and no child record.
- Every read and write is wrapped in `try`/`catch`: a private window or blocked storage must not
  interrupt a lesson.
- The canonical programme does not depend on it. Clearing it loses nothing but a badge.

A real progress model — observation-based, positive, per child — belongs to a later phase and to
the child profile that does not exist yet.

## What is not built

- Audio, images and a media registry (PD-008).
- A child profile, so the English scaffold cannot yet be turned down as French improves.
- TV / presentation mode.
- Any child-facing area separate from the parent's.
- Offline (the PWA service worker).
