# Phase 3 preparation: renderer families

Fifteen activity kinds do not need fifteen screens. This maps each kind to the family that can
present it, so Phase 3 builds ten interactions rather than fifteen unrelated ones. Decision:
ADR-036. **Nothing here is implemented**: the map is planning data, kept in
`domain/lessons/renderers.ts` and checked by a test so a new activity kind cannot appear without
a rendering decision.

## The families

| Family            | Activity kinds                          | What the child does                                   | Screen                            | Media needed | Evidence of completion | Offline                        |
| ----------------- | --------------------------------------- | ----------------------------------------------------- | --------------------------------- | ------------ | ---------------------- | ------------------------------ |
| `oral-exchange`   | conversation                            | Answers the adult's questions aloud                   | Prompt for the adult              | —            | Adult confirms         | Yes                            |
| `word-cards`      | vocabulary                              | Names, repeats and reuses words, real objects at hand | Word and image                    | image, audio | Adult confirms         | Needs audio                    |
| `audio-narrative` | listening-story, read-aloud, song-rhyme | Listens, then answers or sings                        | Text and illustration, or nothing | audio, image | Adult confirms         | Needs audio (read-aloud: none) |
| `sound-game`      | phonology                               | Claps, removes, finds syllables and sounds            | Prompt only                       | audio        | Adult confirms         | Yes                            |
| `quantity`        | counting                                | Counts, shows and checks quantities                   | Counters                          | image        | Child taps             | Yes                            |
| `group-and-match` | matching, sorting, memory-game          | Groups, pairs, sorts and explains                     | Cards to move                     | image        | Child taps             | Needs images                   |
| `look-and-name`   | observation                             | Observes the real world or an image, describes        | Image, optional                   | image        | Adult confirms         | Needs images                   |
| `trace-and-draw`  | drawing, graphic-practice               | Draws or traces, on paper or screen                   | Model or nothing                  | image        | Child produces         | Yes                            |
| `move`            | movement                                | Runs, throws, dances, balances                        | **None**                          | —            | Adult confirms         | Yes                            |
| `hands-on`        | manipulation                            | Handles real objects to solve a small problem         | Prompt only                       | —            | Adult confirms         | Yes                            |

## What this implies for Phase 3

- **Build in this order.** `oral-exchange`, `move` and `hands-on` need no media and cover 17 of
  the pilot's 40 activities; they can ship first and prove the daily flow end to end.
- **Audio before images.** `audio-narrative`, `word-cards` and `sound-game` are where French
  acquisition happens, and they need recorded French more than they need pictures. Offline audio
  is the first real media decision (PD-008).
- **The screen must be able to disappear.** `move` renders nothing; several families only prompt
  the adult. The daily plan already knows which activities are off-screen.
- **Completion evidence differs by family.** Most activities are confirmed by the adult, not
  measured by the app. Progress tracking (Phase 4) should assume observation, matching ADR-010.
- **Media stays out of content for now.** Activities reference no media yet; when they do it will
  be through stable identifiers resolved by a registry, so content remains packageable for
  offline use ([`CONTENT_AUTHORING.md`](CONTENT_AUTHORING.md)).

## What Phase 3 still has to decide

1. Where audio comes from: recorded voice, or the browser's speech synthesis (PD-007).
2. Whether `quantity` and `group-and-match` share one draggable-token component.
3. How TV/projection mode changes layout (Plan §10.1).
4. What a child sees when an activity is off-screen: nothing, a timer, or an illustration.
