import type { ContentOrigin } from "../curriculum/types";
import { type TeachingTextKind, narrativePageCount } from "../lessons/texts";

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

/** A story sequence stays small: a few scenes aligned to pages, never a picture book per page. */
export const MAX_SEQUENCE_FRAMES = 6;

/** One picture of a story sequence. */
export type MediaFrame = {
  /** Path under public/media/, e.g. "illustrations/histoire-nsimba-02.webp". */
  file: string;
  /** What this scene shows, in French: it replaces the asset's own description on its pages. */
  alt: string;
  /** `sha256:<64 hex>` of the file's bytes, like `MediaAsset.contentHash`. */
  contentHash: string;
  /** Intrinsic size in pixels, so the page reserves the right box before the file arrives. */
  width: number;
  height: number;
};

/**
 * A story told in a few pictures (the September rich-media pilot).
 *
 * The story's text is approved content and is not touched: the pages already exist, because the
 * renderer turns a story three lines at a time (`narrativePageCount`). The registry only says,
 * for each of those pages in order, which frame it shows. `pageFrames: [0, 0, 1, 2, 3]` gives a
 * five-page story four pictures, the first held over two pages.
 */
export type MediaSequence = {
  /** Every frame, in story order. The asset's own `file` is one of them: its primary frame. */
  frames: readonly MediaFrame[];
  /** One entry per page of the story the asset illustrates: the index of the frame to show. */
  pageFrames: readonly number[];
};

export type MediaAsset = {
  id: string;
  kind: MediaKind;
  /**
   * Path under public/media/, e.g. "shapes/forme-carre.svg" or "objects/corps-tete.webp". For a
   * sequence this is the primary frame: what any use other than paging through the story shows.
   */
  file: string;
  /** French description, read aloud by assistive technology. Never empty. */
  alt: string;
  /**
   * Intrinsic size of `file` in pixels. Required for raster art, whose aspect ratio is not
   * always square; absent for the SVG set, which is drawn square.
   */
  width?: number;
  height?: number;
  /** Present only on a story told in several pictures. */
  sequence?: MediaSequence;
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
 * The canonical fingerprint of one asset, as an approval covers it.
 *
 * Kind and description are part of it: a picture relabelled from "un seau" to "Lisa" is a
 * different thing to a reviewer even if the bytes happened not to move. A sequence adds every
 * frame's description and bytes, and which page shows which frame: a redrawn scene, a missing
 * frame or a page moved to another picture all change what the child sees during the story.
 *
 * An asset without a sequence fingerprints exactly as it always has, so adding sequences to the
 * model lapses no approval that does not use one. Dimensions are not in it: they follow from the
 * bytes, and content validation checks them against the file.
 */
export function assetFingerprint(asset: {
  kind: string;
  alt: string;
  contentHash: string;
  sequence?: {
    frames: readonly { alt: string; contentHash: string }[];
    pageFrames: readonly number[];
  };
}): string {
  const own = `${asset.kind}|${asset.alt}|${asset.contentHash}`;
  if (asset.sequence === undefined) return own;
  // U+241E between frames, as U+241F between lines of a text: no description can fake a boundary.
  const frames = asset.sequence.frames.map((frame) => `${frame.alt}|${frame.contentHash}`);
  return `${own}|sequence|${frames.join("␞")}|pages|${asset.sequence.pageFrames.join(",")}`;
}

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
      return asset === undefined ? undefined : assetFingerprint(asset);
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

/** Public URL of an asset (or of one frame of it), as the browser requests it. */
export function mediaUrl(asset: { file: string }): string {
  return `/media/${asset.file}`;
}

/** Every file an asset ships — its own and its frames' — each once. */
export function assetFiles(asset: MediaAsset): { file: string; contentHash: string }[] {
  const files = [{ file: asset.file, contentHash: asset.contentHash }];
  for (const frame of asset.sequence?.frames ?? []) {
    if (!files.some((known) => known.file === frame.file)) files.push(frame);
  }
  return files;
}

/**
 * Story sequences are bounded and tied to real pages (the September rich-media pilot):
 *
 *  - the primary file is one of the frames, with the same bytes, so an ordinary use of the id
 *    shows a picture that belongs to the story;
 *  - every frame is shown on at least one page, and every page names an existing frame;
 *  - frames share one size, so turning a page never moves the text under the parent's eyes;
 *  - the asset illustrates at least one story, and every story it illustrates has exactly as many
 *    pages as `pageFrames` has entries. A non-story text may share the asset: it shows the primary
 *    frame and never pages through the sequence. A story rewritten to another length makes this
 *    fail rather than show the wrong scene on a page.
 */
export function checkMediaSequences(
  assets: readonly MediaAsset[],
  texts: readonly {
    id: string;
    kind: TeachingTextKind;
    lines: readonly unknown[];
    illustrationId: string | null;
  }[],
): string[] {
  const problems: string[] = [];
  for (const asset of assets) {
    const sequence = asset.sequence;
    const where = `media "${asset.id}"`;
    if (sequence === undefined) continue;
    const { frames, pageFrames } = sequence;
    if (asset.kind !== "illustration") {
      problems.push(`${where}: only an illustration has a sequence`);
    }
    if (frames.length < 2 || frames.length > MAX_SEQUENCE_FRAMES) {
      problems.push(`${where}: a sequence has 2 to ${MAX_SEQUENCE_FRAMES} frames`);
    }
    const primary = frames.find((frame) => frame.file === asset.file);
    if (primary === undefined) {
      problems.push(`${where}: its file ${asset.file} must be one of its frames`);
    } else if (primary.contentHash !== asset.contentHash) {
      problems.push(`${where}: its file and its frame ${asset.file} record different bytes`);
    } else if (primary.width !== asset.width || primary.height !== asset.height) {
      problems.push(`${where}: its size and its frame ${asset.file}'s size differ`);
    }
    if (new Set(frames.map((frame) => frame.file)).size !== frames.length) {
      problems.push(`${where}: a frame file is listed twice`);
    }
    for (const frame of frames) {
      if (frame.alt.trim() === "") {
        problems.push(`${where}: frame ${frame.file} needs French alt text`);
      }
      if (frame.width !== frames[0]?.width || frame.height !== frames[0]?.height) {
        problems.push(`${where}: frame ${frame.file} is not the size of the first frame`);
      }
    }
    pageFrames.forEach((index, page) => {
      if (!Number.isInteger(index) || index < 0 || index >= frames.length) {
        problems.push(`${where}: page ${page + 1} names frame ${index}, which does not exist`);
      }
    });
    frames.forEach((frame, index) => {
      if (!pageFrames.includes(index)) {
        problems.push(`${where}: frame ${frame.file} is never shown on a page`);
      }
    });
    const illustratedStories = texts.filter(
      (text) => text.illustrationId === asset.id && text.kind === "story",
    );
    if (illustratedStories.length === 0) {
      problems.push(`${where}: a sequence must illustrate at least one story`);
    }
    for (const text of illustratedStories) {
      const pages = narrativePageCount(text);
      if (pages !== pageFrames.length) {
        problems.push(
          `${where}: text "${text.id}" has ${pages} page(s); the sequence maps ${pageFrames.length}`,
        );
      }
    }
  }
  return problems;
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

/**
 * The recording of one taught word, found by what it says rather than by an id.
 *
 * A vocabulary entry is `{ fr, en }` in the content, and the content is approved text: adding an
 * `audioId` to every entry would change the digest of every approved lesson to attach a sound
 * that does not exist yet. So a `pronunciation` asset is matched on its transcript instead — the
 * exact word, compared without case, surrounding space or the article's typographic apostrophe.
 * When the word is recorded, it lights up in every lesson that teaches it, with no content change
 * (ADR-046).
 */
export function pronunciationFor(
  word: string,
  assets: readonly AudioAsset[],
): AudioAsset | undefined {
  const wanted = canonicalWord(word);
  return assets.find(
    (asset) => asset.kind === "pronunciation" && canonicalWord(asset.transcript) === wanted,
  );
}

function canonicalWord(word: string): string {
  return word.trim().toLocaleLowerCase("fr").replaceAll("’", "'").replace(/\s+/g, " ");
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
