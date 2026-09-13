import type { ContentOrigin } from "../curriculum/types";

/**
 * A story, rhyme or song the platform supplies, so a lesson never depends on the family owning
 * a particular book (docs/CONTENT_AUTHORING.md). A read-aloud activity names a text by id; the
 * parent reads it from the screen. Texts are reused across the year on purpose: hearing the
 * same story again is what a five-year-old needs, not a new one every day.
 */
export type TeachingTextKind = "story" | "rhyme";

export type TeachingText = {
  id: string;
  kind: TeachingTextKind;
  title: string;
  /** The text itself, one entry per line or short paragraph, in French. */
  lines: readonly string[];
  /** Who wrote it. Teka Edu texts are original; anything else needs verified rights. */
  origin: ContentOrigin;
  /** Where it comes from, in one line — the rights position, stated per text. */
  provenance: string;
  /** Roughly how long it takes to read aloud, in minutes. */
  minutes: number;
  /**
   * A picture for the story or the rhyme, by media id (ADR-042). A five-year-old listening needs
   * somewhere to rest their eyes, and it is the first thing a parent can point at afterwards.
   */
  illustrationId: string | null;
};

export function findText(texts: readonly TeachingText[], id: string): TeachingText | undefined {
  return texts.find((text) => text.id === id);
}

/**
 * Cross-file rule: every text a lesson names must exist, and a supplied text must not be
 * orphaned without anyone noticing. A read-aloud that points at a missing story would leave the
 * parent with nothing to read.
 */
export function checkTexts(
  texts: readonly TeachingText[],
  lessons: readonly {
    id: string;
    activities: readonly { id: string; payload: Readonly<Record<string, unknown>> }[];
  }[],
): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const text of texts) {
    if (ids.has(text.id)) problems.push(`text "${text.id}": defined more than once`);
    ids.add(text.id);
  }
  for (const lesson of lessons) {
    for (const activity of lesson.activities) {
      const textId = activity.payload["textId"];
      if (typeof textId === "string" && !ids.has(textId)) {
        problems.push(`activity "${activity.id}": unknown text "${textId}"`);
      }
    }
  }
  return problems;
}
