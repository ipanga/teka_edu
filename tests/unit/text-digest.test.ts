import { describe, expect, it } from "vitest";
import { lessonDigest } from "@/domain/lessons/review";
import type { MediaDigestSource } from "@/domain/lessons/review";
import { mediaDigestSource } from "@/domain/media/types";
import { getReferenceData } from "@/lib/content/reference-data";

/**
 * ISSUE-026: an approval has to cover the words the child hears.
 *
 * An activity names a story by id. The digest covered the id, and the bytes of the picture the
 * story carries — but not the story. So the body behind a stable id could be rewritten under a
 * standing approval and nothing would object: the lesson was byte-identical and the reviewer's
 * digest still matched. That is the hole that was closed for pictures, left open for the thing a
 * read-aloud lesson spends most of its minutes on.
 */
const data = getReferenceData();
const media = mediaDigestSource(data.media, data.texts);
/** A lesson that reads a story, and the story it reads. */
const reader = data.lessons.find((l) =>
  l.activities.some((a) => typeof a.payload["textId"] === "string"),
)!;
const readTextId = reader.activities
  .map((a) => a.payload["textId"])
  .find((t): t is string => typeof t === "string")!;

/** The same source, with one story's resolved content swapped for another. */
const sourceWithTexts = (texts: typeof data.texts): MediaDigestSource =>
  mediaDigestSource(data.media, texts);
const editText = (
  id: string,
  change: (t: (typeof data.texts)[number]) => (typeof data.texts)[number],
) => sourceWithTexts(data.texts.map((t) => (t.id === id ? change(t) : t)));

describe("an approval covers the story, not just its name", () => {
  it("is stable while the story is unchanged", () => {
    expect(lessonDigest(reader, media)).toBe(lessonDigest(reader, media));
    expect(lessonDigest(reader, sourceWithTexts(data.texts))).toBe(lessonDigest(reader, media));
  });

  it("changes when the body of the story changes", () => {
    // The test that fails against the old implementation: same lesson, same textId, new words.
    const after = editText(readTextId, (t) => ({
      ...t,
      lines: [...t.lines, "Une ligne ajoutée."],
    }));
    expect(lessonDigest(reader, after)).not.toBe(lessonDigest(reader, media));
  });

  it("changes when a line is reworded without changing the line count", () => {
    const after = editText(readTextId, (t) => ({
      ...t,
      lines: t.lines.map((line, i) => (i === 0 ? "Un tout autre début." : line)),
    }));
    expect(lessonDigest(reader, after)).not.toBe(lessonDigest(reader, media));
  });

  it("changes when the story's title changes", () => {
    const after = editText(readTextId, (t) => ({ ...t, title: `${t.title} (autre)` }));
    expect(lessonDigest(reader, after)).not.toBe(lessonDigest(reader, media));
  });

  it("changes when the lesson is pointed at a different story", () => {
    const other = data.texts.find((t) => t.id !== readTextId)!;
    const pointed = {
      ...reader,
      activities: reader.activities.map((a) =>
        typeof a.payload["textId"] === "string"
          ? { ...a, payload: { ...a.payload, textId: other.id } }
          : a,
      ),
    };
    expect(lessonDigest(pointed, media)).not.toBe(lessonDigest(reader, media));
  });

  it("fails closed when the story cannot be resolved", () => {
    const missing = {
      ...reader,
      activities: reader.activities.map((a) =>
        typeof a.payload["textId"] === "string"
          ? { ...a, payload: { ...a.payload, textId: "une-histoire-qui-nexiste-pas" } }
          : a,
      ),
    };
    // Never a quiet fallback to hashing the id: a lesson that reads something nobody can find
    // must not be approvable at all.
    expect(() => lessonDigest(missing, media)).toThrow(/cannot be resolved/);
  });

  it("ignores a story the lesson does not read", () => {
    const other = data.texts.find((t) => t.id !== readTextId)!;
    const after = editText(other.id, (t) => ({ ...t, lines: ["Rien à voir avec cette leçon."] }));
    expect(lessonDigest(reader, after)).toBe(lessonDigest(reader, media));
  });

  it("still covers the picture the story carries", () => {
    const illustrated = data.lessons.find((l) =>
      l.activities.some((a) => {
        const t = a.payload["textId"];
        return typeof t === "string" && media.illustrationOf(t) !== null;
      }),
    )!;
    const textId = illustrated.activities
      .map((a) => a.payload["textId"])
      .find((t): t is string => typeof t === "string" && media.illustrationOf(t) !== null)!;
    const picture = media.illustrationOf(textId)!;
    const poisoned: MediaDigestSource = {
      fingerprint: (id) =>
        id === picture ? `illustration|autre|sha256:${"7".repeat(64)}` : media.fingerprint(id),
      illustrationOf: (id) => media.illustrationOf(id),
      textFingerprint: (id) => media.textFingerprint(id),
    };
    expect(lessonDigest(illustrated, poisoned)).not.toBe(lessonDigest(illustrated, media));
  });

  it("gives the same fingerprint on any machine, from canonical content alone", () => {
    // No path, no mtime, no Git state, no iteration order: the same story, twice, is the same.
    const a = mediaDigestSource(data.media, data.texts).textFingerprint(readTextId);
    const b = mediaDigestSource(
      [...data.media].reverse(),
      [...data.texts].reverse(),
    ).textFingerprint(readTextId);
    expect(a).toBe(b);
    // And it is built from the content a reviewer reads: the title and the lines, in order.
    const story = data.texts.find((t) => t.id === readTextId)!;
    expect(a).toContain(story.title);
    for (const line of story.lines) expect(a).toContain(line);
  });
});

describe("every approval standing today is bound to the story it reads", () => {
  it("recomputes exactly for every approved lesson", () => {
    const approved = data.lessons.filter((l) => l.status === "approved");
    expect(approved.length).toBeGreaterThan(0);
    for (const l of approved) {
      expect(lessonDigest(l, media), l.id).toBe(l.review?.reviewedDigest);
    }
  });

  it("records that the re-stamp was a schema change, not a new reading", () => {
    const restamped = data.lessons.filter(
      (l) => l.status === "approved" && l.review?.notes?.includes("ISSUE-026"),
    );
    // The approved lessons that read a story at the time: the only ones the definition touched.
    // Every one of them shows a story picture, and every story picture was redrawn on
    // 2026-09-22, which lapsed those approvals (ADR-048). The re-stamp then stands on nothing
    // today — and that is only acceptable because the lapse is itself on record.
    if (restamped.length === 0) {
      const lapses = data.reviewHistory.filter(
        (r) => r.scope === "consequence" && r.summary.includes("ADR-048"),
      );
      expect(
        lapses.length,
        "no approval carries the re-stamp and no lapse explains it",
      ).toBeGreaterThan(0);
      return;
    }
    for (const l of restamped) {
      expect(l.review?.notes, l.id).toMatch(/Aucune nouvelle relecture/);
      expect(l.review?.reviewKind, l.id).toBe("ai-assisted");
    }
  });
});
