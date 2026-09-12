# Content quality gate

How educational content moves from written to teachable, and why no lesson can approve itself.
Decision: ADR-035. Authoring rules: [`CONTENT_AUTHORING.md`](CONTENT_AUTHORING.md).

## The problem this solves

Teka Edu's lessons are drafted with the help of a language model. That is allowed (ADR-002 bans
runtime AI, not authoring help), but it creates a specific risk: plausible, fluent, well-formatted
content that no qualified person has ever read reaching a five-year-old. Schema validation cannot
catch "this is wrong for this age" — only a person who teaches it can.

The gate makes that a mechanical property of the content, not a promise in a document.

## The lifecycle

```text
draft ──▶ review ──▶ approved ──▶ retired
  │         ▲           │
  │         └───────────┘  any edit to approved content sends it back
  └─ never scheduled for a child
```

| Status     | Meaning                                                                      | Who sets it    |
| ---------- | ---------------------------------------------------------------------------- | -------------- |
| `draft`    | Being written, incomplete                                                    | Author         |
| `review`   | Finished, waiting for a human reviewer. **Where AI-assisted content stops.** | Author         |
| `approved` | A named person accepted this exact text on a date                            | Human reviewer |
| `retired`  | Withdrawn, kept for history                                                  | Owner          |

Every lesson in the repository today is `review`.

## What an approval must carry

An approved lesson records **who** approved it, **their role**, **when**, and a **digest of the
exact text** they read:

```json
"status": "approved",
"review": {
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
| How it is checked | Imported verbatim, cross-checked against a second extraction ([`CURRICULUM.md`](CURRICULUM.md)) | Pedagogical review by a person      |
| Lifecycle         | None: it is a quotation, not a draft                                                            | draft → review → approved → retired |

The database refuses to store a lesson as official text, and refuses an official objective with
no source.

## Reviewing content

1. `npm run review:package` regenerates the reviewer's document from the canonical content.
2. The reviewer reads [`review/2026-2027-maternelle-3-semaine-1.md`](review/) and fills in the
   checklist per lesson: objective alignment, age, clarity, load, duration, engagement, language,
   culture, materials, safety.
3. Their decisions come back as edits to the content: fixes first, then `status: "approved"` with
   the review block, generated together so the digest matches.
4. `npm run content:validate` refuses any approval that is incomplete or stale.
5. `npm run db:reference -- --new-migration <name>` mirrors it into the database.

A unit test fails if the committed review package is out of date, so a reviewer is never handed
a document that no longer matches what the app serves.

## What is deliberately not built

- **No user accounts, roles or permissions.** The reviewer is a name and a role in the content,
  not a login. A real identity system belongs with parent accounts, later.
- **No approval workflow in an interface.** Review happens through the document and the PR.
- **No automated pedagogical judgement.** The tests check structure — that an approval is
  attributable, complete and bound to the text. They never pretend to decide whether a lesson is
  good for a child.
