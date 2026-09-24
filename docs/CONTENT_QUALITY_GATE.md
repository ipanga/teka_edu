# Content quality gate

How educational content moves from written to teachable, and why no lesson can approve itself.
Decisions: ADR-035, refined by **ADR-047** (who the independent reviewer must be). Authoring
rules: [`CONTENT_AUTHORING.md`](CONTENT_AUTHORING.md).

## The problem this solves

Teka Edu's lessons are drafted with the help of a language model. That is allowed (ADR-002 bans
runtime AI, not authoring help), but it creates a specific risk: plausible, fluent, well-formatted
content that nobody has independently reviewed reaching a five-year-old. Schema validation cannot
catch "this is wrong for this age"; only a reader judging it against the programme can.

The gate makes that a mechanical property of the content, not a promise in a document.

## Who reviews (ADR-047)

No preschool teacher is available to the project, and a gate that can never open is an outage,
not a quality control. So the gate stays and the reviewer changed:

|                   | **AI-assisted review**                                                                                                                 | **Human-teacher review**           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Status            | **The active development gate**                                                                                                        | Optional future external assurance |
| Who               | An AI model reading the generated package against the official programme, outside the product (today: ChatGPT, submitted by the owner) | A person who teaches this age      |
| Blocks authoring? | Yes — each batch passes it before being treated as accepted                                                                            | **No**                             |
| Recorded as       | `reviewKind: "ai-assisted"`                                                                                                            | `reviewKind: "human-teacher"`      |

The two are **not** equivalent, and the record says which one happened. A check refuses to store
a review by an obvious tool name as `human-teacher`, and the database constraint refuses an
approval that does not name a kind at all.

**Never write** _teacher approved_, _certified_ or _validated by an educator_ unless a named
teacher actually did it. **Write** _AI-assisted pedagogical review_, or _reviewed against
authoritative curriculum references_.

## The lifecycle

```text
draft ──▶ review ──▶ approved ──▶ retired
  │         ▲           │
  │         └───────────┘  any edit to approved content sends it back
  └─ never scheduled for a child
```

| Status     | Meaning                                                                              | Who sets it |
| ---------- | ------------------------------------------------------------------------------------ | ----------- |
| `draft`    | Being written, incomplete                                                            | Author      |
| `review`   | Finished, not yet through the gate. **Where AI-drafted content stops.**              | Author      |
| `approved` | An independent review accepted this exact text on a date, and said which kind it was | Reviewer    |
| `retired`  | Withdrawn, kept for history                                                          | Owner       |

Where September stands is in `PROJECT_STATUS.md` (Content Status): both classes were accepted in
full, and 80 lessons went back to `review` on 2026-09-22 when their pictures were redrawn (ADR-048).

## What an approval must carry

An approved lesson records **who** approved it, **their role**, **when**, and a **digest of the
exact text** they read:

```json
"status": "approved",
"review": {
  "reviewKind": "ai-assisted",
  "outcome": "accepted-with-modifications",
  "reviewer": "A. Mbala",
  "reviewerRole": "institutrice de 3ème maternelle",
  "reviewedOn": "2026-09-20",
  "reviewedDigest": "3f7a1c92b40de5aa",
  "notes": "Raccourcir la consigne de la deuxième activité."
}
```

The database enforces the same shape: `status = 'approved'` if and only if a reviewer is named,
with a role, a date and a digest.

## Why the digest matters

`reviewedDigest` covers everything a reviewer judges: the child instruction, the adult guidance,
the objectives claimed, durations, materials, vocabulary, scaffolds and activity payloads. If any
of it changes, the digest changes, content validation fails, and the lesson must return to
`review`.

That closes the obvious hole: editing an approved lesson and silently keeping someone else's
approval. The digest is a change detector (FNV-1a over a canonical serialisation), not a security
measure — it protects against mistakes, not against a determined author.

## Official curriculum is a different thing

Do not confuse the two:

|                   | Official curriculum                                                                             | Teka Edu lessons                    |
| ----------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------- |
| What              | Objectives and success examples quoted from the programme                                       | Lessons and activities we write     |
| Provenance        | `origin: "official"`, with source document and page                                             | `origin: "teka-edu-created"`        |
| How it is checked | Imported verbatim, cross-checked against a second extraction ([`CURRICULUM.md`](CURRICULUM.md)) | Independent pedagogical review      |
| Lifecycle         | None: it is a quotation, not a draft                                                            | draft → review → approved → retired |

The database refuses to store a lesson as official text, and refuses an official objective with
no source.

## Reviewing content

1. `npm run review:package` regenerates the reviewer's document from the canonical content.
2. The package goes to the reviewer — for the active gate, ChatGPT, submitted by the owner. It is
   read against the official programme, developmental expectations, objective/activity alignment,
   progression, language, duration, safety, material availability, DRC context and media use.
3. The review returns one of **`accepted`**, **`accepted-with-modifications`** or
   **`needs-revision`**.
4. Corrections come back as edits to the content: fixes first, then `status: "approved"` with the
   review block, generated together so the digest matches.
5. `npm run content:validate` refuses any approval that is incomplete or stale.
6. `npm run db:reference -- --new-migration <name>` mirrors it into the database.

**Re-review rules.** `accepted` needs nothing further. `accepted-with-modifications` means apply
every correction, regenerate, re-validate — and **submit again when the corrections materially
affect the pedagogy**; purely mechanical, fully specified fixes may be recorded as applied without
pretending they were independently re-approved. `needs-revision` means the content does not
advance until it is corrected and reviewed again.

**What the package must contain**, so the reviewer never has to open the repository: level, age
band, curriculum and version, the authoritative source, instructional day, lesson title,
objectives, official expected outcomes, **the full text of every story, rhyme and song**,
comprehension questions, activities, child instructions, parent guidance, materials,
substitutions, safety notes, durations, French vocabulary, optional English scaffolding, media
information and progression/revisit information.

Generation **fails** — and so does CI — when a package names a text it cannot quote, or when a
bullet promises a list and delivers nothing. Both are real failures that reached a reviewer once.
A unit test also fails if the committed package is out of date, so a reviewer is never handed a
document that no longer matches what the app serves.

**A redrawn picture (ADR-048).** The digest covers the bytes of every picture a lesson shows, so
redrawing one lapses the approvals of the lessons that show it. `npm run review:lapse` sends them
back to `review` (it re-stamps nothing), the lapse is recorded as a `consequence` entry per week,
and `npm run review:visual` writes a **visual reconfirmation package** per level — the changed
pictures with their old and new descriptions, the lapsed lessons per week, and a before/after
sheet — after verifying that no reviewable text moved. The reviewer answers `accepted` or
`accepted-with-modifications`; a `full-review` entry per week and `scripts/approve-week.ts`
restore the approvals with freshly computed digests.

**Granularity.** Review a batch small enough to be read properly: a week, or a month. Never
generate a year and call one pass a review.

## What is deliberately not built

- **No user accounts, roles or permissions.** The reviewer is a name and a role in the content,
  not a login. A real identity system belongs with parent accounts, later.
- **No approval workflow in an interface.** Review happens through the document and the PR.
- **No pedagogical judgement in the test suite.** The tests check structure — that an approval is
  attributable, complete, current and honest about its kind. They never pretend to decide whether a lesson is
  good for a child.
