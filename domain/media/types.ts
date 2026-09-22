import type { ContentOrigin } from "../curriculum/types";

/**
 * A picture the child looks at (ADR-042, docs/MEDIA_ARCHITECTURE.md).
 *
 * Assets live in the repository under public/media/ and are described here, so a lesson names a
 * stable id — `forme-carre` — and never a file path or a URL. Renaming a file is then a registry
 * change, not a content migration, and a missing file is a test failure rather than a blank space
 * in front of a five-year-old.
 */
export const MEDIA_KINDS = ["shape", "object", "animal", "illustration"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export type MediaAsset = {
  id: string;
  kind: MediaKind;
  /** Path under public/media/, e.g. "shapes/forme-carre.svg". */
  file: string;
  /** French description, read aloud by assistive technology. Never empty. */
  alt: string;
  /** Words a lesson might use for it, so the set can be searched while authoring. */
  tags: readonly string[];
  origin: ContentOrigin;
  provenance: string;
  /**
   * `sha256:<64 hex>` of the file's bytes, written by `tools/media/build.ts` and checked against
   * the file by content validation.
   *
   * An id is not a fingerprint. `histoire-seau-lisa` kept its id while the drawing was redrawn
   * to put Lisa in it — a real pedagogical change to what a child sees, invisible to any digest
   * that hashes only the id. This is what makes the picture itself part of an approval.
   */
  contentHash: string;
};

/**
 * The media source an approval digest uses: an asset's canonical fingerprint, and the picture a
 * teaching text carries. Built here so the rule lives beside the type it fingerprints.
 */
export function mediaDigestSource(
  assets: readonly MediaAsset[],
  texts: readonly {
    id: string;
    kind: string;
    title: string;
    lines: readonly string[];
    illustrationId: string | null;
  }[],
): {
  fingerprint(mediaId: string): string | undefined;
  illustrationOf(textId: string): string | null;
  textFingerprint(textId: string): string | undefined;
} {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const byTextId = new Map(texts.map((text) => [text.id, text]));
  return {
    fingerprint(mediaId) {
      const asset = byId.get(mediaId);
      // Kind and description are part of it: a picture relabelled from "un seau" to "Lisa" is a
      // different thing to a reviewer even if the bytes happened not to move.
      return asset === undefined ? undefined : `${asset.kind}|${asset.alt}|${asset.contentHash}`;
    },
    illustrationOf(textId) {
      return byTextId.get(textId)?.illustrationId ?? null;
    },
    /**
     * The story or rhyme itself — the words a child actually hears (ISSUE-026).
     *
     * An activity names a text by id and the digest used to stop there, so the body behind a
     * stable id could be rewritten under an approval without the approval lapsing. That is the
     * same hole that was closed for pictures, left open for the thing the lesson spends most of
     * its minutes on.
     *
     * The fingerprint is a canonical string of what a reviewer judges: the kind, the title and
     * every line, in order. It is built only from canonical content — never from a path, an
     * mtime, the Git state or the machine — so the same story fingerprints identically
     * everywhere. Compression is left to `lessonDigest`, which hashes the whole canonical
     * serialisation anyway.
     */
    textFingerprint(textId) {
      const text = byTextId.get(textId);
      if (text === undefined) return undefined;
      // U+241F separates lines so that moving a line break cannot leave the body unchanged.
      return `${text.kind}|${text.title}|${text.lines.join("\u241f")}`;
    },
  };
}

/** Public URL of an asset, as the browser requests it. */
export function mediaUrl(asset: MediaAsset): string {
  return `/media/${asset.file}`;
}

export function findAsset(assets: readonly MediaAsset[], id: string): MediaAsset | undefined {
  return assets.find((asset) => asset.id === id);
}

/**
 * Cross-file rules: ids are unique, every asset is described, and every id a lesson names exists.
 * A lesson pointing at a missing picture is the defect this prevents.
 */
export function checkMedia(
  assets: readonly MediaAsset[],
  lessons: readonly {
    activities: readonly { id: string; mediaIds: readonly string[] }[];
  }[],
): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const asset of assets) {
    if (ids.has(asset.id)) problems.push(`media "${asset.id}": defined more than once`);
    ids.add(asset.id);
    if (asset.alt.trim() === "") problems.push(`media "${asset.id}": needs French alt text`);
  }
  for (const lesson of lessons) {
    for (const activity of lesson.activities) {
      for (const id of activity.mediaIds) {
        if (!ids.has(id)) problems.push(`activity "${activity.id}": unknown media "${id}"`);
      }
    }
  }
  return problems;
}

/**
 * Sound, when sound is the point (ADR-046).
 *
 * Audio is not decoration here: it exists for what a printed page cannot carry — how a French
 * word is actually pronounced, what a rhyme sounds like in rhythm, what an animal or the rain
 * sounds like when recognising it *is* the learning objective.
 *
 * It is deliberately never required. Every activity works with no audio at all, because the
 * parent reading aloud is the design and not a fallback: a five-year-old learning French from a
 * person they love beats a recording (docs/AUDIO_GUIDELINES.md).
 */
export const AUDIO_KINDS = [
  /** One word or short phrase, said by a human, for a child to hear and copy. */
  "pronunciation",
  /** A story or a rhyme read aloud, for the days a parent cannot. */
  "narration",
  /** A sound the child must recognise: an animal, rain, an object. */
  "ambience",
] as const;
export type AudioKind = (typeof AUDIO_KINDS)[number];

export type AudioAsset = {
  id: string;
  kind: AudioKind;
  /** Path under public/audio/, e.g. "mots/le-crayon.mp3". */
  file: string;
  /** Exactly what is said, so the text and the sound can never drift apart. */
  transcript: string;
  /** Roughly how long it lasts, in seconds; used to decide whether to preload. */
  seconds: number;
  origin: ContentOrigin;
  /** Who recorded it and on what terms. A synthetic voice must say so here. */
  provenance: string;
};

export function audioUrl(asset: AudioAsset): string {
  return `/audio/${asset.file}`;
}

export function findAudio(assets: readonly AudioAsset[], id: string): AudioAsset | undefined {
  return assets.find((asset) => asset.id === id);
}

/** Ids are unique, nothing is silent, and every id a text names exists. */
export function checkAudio(
  assets: readonly AudioAsset[],
  texts: readonly { id: string; audioId: string | null }[],
): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const asset of assets) {
    if (ids.has(asset.id)) problems.push(`audio "${asset.id}": defined more than once`);
    ids.add(asset.id);
    if (asset.transcript.trim() === "") {
      problems.push(`audio "${asset.id}": needs a transcript of what is said`);
    }
  }
  for (const text of texts) {
    if (text.audioId !== null && !ids.has(text.audioId)) {
      problems.push(`text "${text.id}": unknown audio "${text.audioId}"`);
    }
  }
  return problems;
}
