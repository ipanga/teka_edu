# Audio

When Teka Edu makes a sound, why it usually does not, and what would have to be recorded before
it does. Decision: ADR-046.

## The position

**The parent reading aloud is the design, not a fallback.** A five-year-old learning French from
a person they love, who pauses, repeats and reacts, beats any recording. Teka Edu exists to help
that happen, not to replace it with a narrator.

So audio is added only where sound carries something a page cannot, and **no activity ever
requires it**. Every lesson works, today, with the sound off.

## Where sound genuinely earns its place

| Kind            | Why                                                                                                     | Status                    |
| --------------- | ------------------------------------------------------------------------------------------------------- | ------------------------- |
| `pronunciation` | How a French word is actually said. A child copying a wrong model learns the wrong word.                | **No assets.** See below. |
| `narration`     | A story read aloud, for a day when the parent cannot read — illness, a younger sibling, a late evening. | **No assets.**            |
| `ambience`      | A sound the child must _recognise_: an animal, the rain. Here the sound **is** the objective.           | **No assets.**            |

## Why there is no audio yet

The highest-value audio is French pronunciation, and it is exactly the audio that must not be
faked.

- **Browser speech synthesis was evaluated and rejected as the educational voice.** The French
  voice differs between Chrome, Safari, Android and Windows; some are markedly non-native; none
  is available offline; and the same word can sound different on the parent's phone and the
  family tablet. A child copying that is being taught a moving target.
- **Paid text-to-speech is out of scope** — the project runs at $0 (ADR-027), and a paid voice
  would also be a runtime dependency on an external service.
- Shipping a mediocre voice and labelling it "la prononciation" would create false confidence.
  Silence is more honest, and the parent's voice is better anyway.

So the architecture exists and the library is empty. That is a decision, not an omission.

## What would have to be recorded

If you want pronunciation audio, this is the whole job — about **twenty minutes of recording** by
one adult who speaks French comfortably. The per-activity decision (recommended, optional,
unnecessary) is in `docs/september-illustration-audit.md`; nothing is required anywhere.

**The taught words**, each said twice, slowly, with a pause. A word's recording is found **by its
transcript**: the `transcript` of a `pronunciation` asset must be the word exactly as the lesson
teaches it (case and spacing do not matter), and it then lights up on every card that teaches that
word, in both classes, with no change to the approved content.

- _1ère maternelle_ — la porte, le seau, la table, la chaise, la main, le pied, la tête,
  le ventre, un, deux, trois
- _3ème maternelle, École_ — le cahier, le crayon, le sac, la table, la chaise
- _3ème maternelle, Maison_ — la porte, la fenêtre, le lit, la marmite, le seau
- _3ème maternelle, Marché_ — la tomate, la banane, l'oignon, le panier, la monnaie
- _The four shapes_ — le carré, le rectangle, le triangle, le disque

**The rhymes**, read in rhythm (about six minutes in total) — this is where a recording helps most
after pronunciation, because a rhyme has a beat a reader may not know. Set `audioId` on the text
in `content/texts/<level>.json`; the control says « Écouter la comptine ».

- _1ère_ — Un, deux, trois, mes mains · Bonjour, petit · Je marche, je m'arrête · Le petit
  seau · La pluie tombe
- _3ème_ — Un, deux, trois, je compte · Les formes qui dansent

**Optionally, the stories** (`narration`), for a day the parent cannot read: nine in 3ème, two in
1ère. The control says « Écouter l'histoire ».

Record in a quiet room on a phone, one file per word, normal speaking voice, no music, no effects.
Add each file under `public/audio/<folder>/<id>.mp3` and one row in the `audio` list of
`content/media/registry.json` with its `transcript` and `provenance` naming the speaker:

```json
{
  "id": "mot-la-main",
  "kind": "pronunciation",
  "file": "mots/la-main.mp3",
  "transcript": "la main",
  "seconds": 2,
  "origin": "teka-edu-created",
  "provenance": "Enregistré par <prénom, rôle> le <date>, pour Teka Edu."
}
```

Nothing else needs to change: the player appears when an asset exists.

## Rules for any audio that is added

- **Never autoplay.** Sound happens when someone taps, never on arrival. Browsers block autoplay
  anyway, and a five-year-old should not be startled by a device.
- **Never the only route.** Every recording has a `transcript`, and the text is on the page.
- **Short.** A word is a word; a story is a story; nothing loops.
- **Provenance names the voice.** A synthetic voice, if one is ever used, must say so in
  `provenance` and must never be presented as _the_ pronunciation.
- **Parent guidance is not read aloud.** Audio serves the child's task; the adult reads.
- **Interface sound effects:** none today. If any are ever added they must be subtle, optional and
  mutable, and no navigation may depend on hearing them.

## Storage

Static files under `public/audio/`, like the pictures (ADR-042): versioned with the content,
offline-friendly, no bucket, no CDN, $0.

**Threshold:** roughly **25 MB** of audio in the repository. Twenty spoken words is well under a
megabyte; full narration of a school year would not be. If the library approaches that, move to a
free-tier-compatible host and reference assets by the same stable ids — the registry already
isolates callers from the file location, so that migration is a registry change.
