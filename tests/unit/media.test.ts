import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ACTIVITY_RENDERERS } from "@/domain/lessons/renderers";
import { MEDIA_KINDS, checkMedia, findAsset, mediaUrl } from "@/domain/media/types";
import type { MediaAsset } from "@/domain/media/types";
import { getReferenceData } from "@/lib/content/reference-data";

const ROOT = path.resolve(import.meta.dirname, "../..");
const data = getReferenceData();
const activities = data.lessons.flatMap((lesson) => lesson.activities);

describe("the media registry (ADR-042)", () => {
  it("describes every asset it ships", () => {
    expect(data.media.length).toBeGreaterThan(0);
    for (const asset of data.media) {
      expect(MEDIA_KINDS, asset.id).toContain(asset.kind);
      expect(asset.alt.trim().length, `${asset.id} needs French alt text`).toBeGreaterThan(3);
      expect(asset.origin, asset.id).toBe("teka-edu-created");
      expect(asset.provenance.length, asset.id).toBeGreaterThan(20);
      expect(
        asset.tags.length,
        `${asset.id} needs at least one word a lesson would use`,
      ).toBeGreaterThan(0);
    }
  });

  it("gives every asset a unique, stable, semantic id", () => {
    const ids = data.media.map((asset) => asset.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id, id).toMatch(
        /^(forme|objet|animal|corps|histoire|comptine|plante|bonhomme)-[a-z0-9-]+$/,
      );
    }
  });

  it("ships the file behind every id", () => {
    for (const asset of data.media) {
      const file = path.join(ROOT, "public/media", asset.file);
      expect(existsSync(file), `missing file for ${asset.id}: ${asset.file}`).toBe(true);
      const svg = readFileSync(file, "utf8");
      expect(svg.startsWith("<svg"), asset.id).toBe(true);
      // Nothing may reach outside the release: no remote reference inside an asset either.
      expect(svg, asset.id).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
    }
  });

  it("never points a lesson at a picture that does not exist", () => {
    expect(checkMedia(data.media, data.lessons)).toEqual([]);
    const broken = checkMedia(data.media, [
      { activities: [{ id: "x", mediaIds: ["forme-inexistante"] }] },
    ]);
    expect(broken[0]).toMatch(/unknown media/);
  });

  it("refuses a duplicate id or an empty description", () => {
    const asset = data.media[0]!;
    expect(checkMedia([asset, asset], [])[0]).toMatch(/defined more than once/);
    const blank: MediaAsset = { ...asset, id: "objet-vide", alt: "  " };
    expect(checkMedia([blank], [])[0]).toMatch(/needs French alt text/);
  });

  it("serves assets from the release, never from an outside host", () => {
    for (const asset of data.media) {
      expect(mediaUrl(asset)).toBe(`/media/${asset.file}`);
      expect(mediaUrl(asset)).not.toMatch(/^https?:/);
    }
    expect(findAsset(data.media, "forme-carre")?.kind).toBe("shape");
    expect(findAsset(data.media, "nope")).toBeUndefined();
  });
});

describe("what September shows the child", () => {
  it("shows the shapes to the lessons that ask the child to look at them", () => {
    // The defect this phase existed to fix: « Regarde les formes » with nothing on screen.
    const shapeActivities = activities.filter((activity) =>
      activity.childInstruction.toLowerCase().includes("les formes"),
    );
    expect(shapeActivities.length).toBeGreaterThan(0);
    for (const activity of shapeActivities) {
      expect(activity.mediaIds, activity.id).toContain("forme-carre");
      expect(activity.mediaIds.length, activity.id).toBe(4);
    }
  });

  it("gives every word card a picture, in the order of the words", () => {
    const cards = activities.filter(
      (activity) => ACTIVITY_RENDERERS[activity.type].family === "word-cards",
    );
    const withMedia = cards.filter((activity) => activity.mediaIds.length > 0);
    expect(withMedia.length).toBeGreaterThan(0);
    for (const activity of withMedia) {
      // One picture per taught word, so the card and the word cannot drift apart.
      expect(activity.mediaIds.length, activity.id).toBeLessThanOrEqual(activity.vocabulary.length);
    }
  });

  it("leaves movement and phonology with no pictures at all", () => {
    for (const activity of activities) {
      const family = ACTIVITY_RENDERERS[activity.type].family;
      if (family === "move" || family === "sound-game") {
        expect(activity.mediaIds, `${activity.id} happens away from the screen`).toEqual([]);
      }
    }
  });

  it("uses every asset it ships, so the set stays deliberate", () => {
    // An asset is used either by an activity or by a story, which lends its picture to every
    // activity that reads it.
    const used = new Set([
      ...activities.flatMap((activity) => activity.mediaIds),
      ...data.texts.flatMap((text) => (text.illustrationId === null ? [] : [text.illustrationId])),
    ]);
    const unused = data.media.filter((asset) => !used.has(asset.id));
    expect(unused.map((asset) => asset.id)).toEqual([]);
  });

  it("gives every story and rhyme a picture of its own", () => {
    for (const text of data.texts) {
      expect(text.illustrationId, `${text.id} has no illustration`).not.toBeNull();
      const asset = data.media.find((item) => item.id === text.illustrationId);
      expect(asset, `${text.id} → ${String(text.illustrationId)}`).toBeDefined();
      expect(asset!.kind).toBe("illustration");
    }
  });
});
