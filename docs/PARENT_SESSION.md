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
Aujourd’hui            →  the date, whether it is a school day, today's session
  ↓
À préparer             →  materials, what to use instead, safety notes
  ↓
Activité 1 … n         →  one instruction at a time
    · À dire à l’enfant       the French sentence the parent reads aloud
    · Afficher le conseil     the guidance, folded away until asked
    · Besoin d’aide en anglais ?   optional, hidden by default
  ↓
Pause suggérée         →  about halfway, if the child needs it
  ↓
C’est fini !           →  what the child managed today
```

Three pages carry it:

| Route         | What it does                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `/`           | Today: the date, the session, its length, what to prepare. Offers the last session when today is a weekend or a holiday. |
| `/seance/<n>` | One instructional day, run activity by activity. `<n>` is the instructional day, not the date (ADR-004).                 |
| `/calendrier` | September, day by day: sessions, weekends and holidays, each shown for what it is.                                       |

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
  the screen holds the words and, later, the images and audio.
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

Three interactions, and only where they carry the learning:

- **Montre le carré** — the named picture among four. A wrong tap says « Essaie encore. Regarde
  bien » ; after two, the answer is shown and the parent is asked to name it together.
- **Compter en touchant** — one tap per object, the count said back, always restartable.
- **Ranger par groupes** — tap a picture, tap its group. Tapping, never dragging: small fingers.

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
