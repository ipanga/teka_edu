import type { ContentOrigin } from "../curriculum/types";

/**
 * A picture the child looks at (ADR-042, docs/MEDIA_ARCHITECTURE.md).
 *
 * Assets live in the repository under public/media/ and are described here, so a lesson names a
 * stable id — `forme-carre` — and never a file path or a URL. Renaming a file is then a registry
 * change, not a content migration, and a missing file is a test failure rather than a blank space
 * in front of a five-year-old.
 */
export const MEDIA_KINDS = ["shape", "object", "animal"] as const;
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
};

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
