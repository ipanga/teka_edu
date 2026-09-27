import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { narrativePageCount } from "@/domain/lessons/texts";
import {
  type MediaAsset,
  type MediaFrame,
  assetFiles,
  assetFingerprint,
  checkMediaSequences,
  mediaDigestSource,
} from "@/domain/media/types";
import { mediaRegistryFileSchema, teachingTextsFileSchema } from "@/lib/content/lesson-schemas";
import { webpSize } from "@/lib/content/webp-size";

/**
 * Rich WebP art and story sequences (the September rich-media pilot). These tests read the
 * registry and the texts directly, not through `getReferenceData()`, so they judge the model
 * itself — whether or not every approval that covers a changed picture has been reconfirmed yet.
 */

const ROOT = path.resolve(import.meta.dirname, "../..");
const readJson = (file: string): unknown => JSON.parse(readFileSync(path.join(ROOT, file), "utf8"));
const registry = mediaRegistryFileSchema.parse(readJson("content/media/registry.json"));
const texts = ["maternelle-1", "maternelle-3"].flatMap(
  (level) => teachingTextsFileSchema.parse(readJson(`content/texts/${level}.json`)).texts,
);
const asset = (id: string) => registry.assets.find((candidate) => candidate.id === id)!;
const text = (id: string) => texts.find((candidate) => candidate.id === id)!;

const frame = (n: number, over: Partial<MediaFrame> = {}): MediaFrame => ({
  file: `illustrations/histoire-x-0${n}.webp`,
  alt: `Scène ${n}`,
  contentHash: `sha256:${String(n).repeat(64)}`,
  width: 1448,
  height: 1086,
  ...over,
});
const story = (lines: number) => ({
  id: "histoire-x-texte",
  kind: "story" as const,
  lines: Array.from({ length: lines }, (_, i) => `Ligne ${i + 1}`),
  illustrationId: "histoire-x",
});
const sequenced = (over: Partial<MediaAsset> = {}): MediaAsset => ({
  id: "histoire-x",
  kind: "illustration",
  file: frame(1).file,
  alt: "Scène 1",
  width: 1448,
  height: 1086,
  tags: ["histoire"],
  origin: "teka-edu-created",
  provenance: "Séquence d’essai écrite pour ce test, jamais livrée.",
  contentHash: frame(1).contentHash,
  sequence: { frames: [frame(1), frame(2), frame(3)], pageFrames: [0, 1, 2, 2] },
  ...over,
});

describe("the pilot's registry rows", () => {
  it("keeps the five stable ids, now painted WebP with a declared size", () => {
    for (const id of [
      "corps-tete",
      "animal-chevre",
      "comptine-bonjour",
      "histoire-nsimba",
      "histoire-mangue",
    ]) {
      const row = asset(id);
      expect(row.file, id).toMatch(/\.webp$/);
      expect(row.width, id).toBeGreaterThan(0);
      expect(row.height, id).toBeGreaterThan(0);
    }
  });

  it("maps Nsimba's five pages onto five chronology-aligned frames", () => {
    const nsimba = asset("histoire-nsimba");
    expect(narrativePageCount(text("le-premier-jour-de-nsimba"))).toBe(5);
    expect(nsimba.sequence?.pageFrames).toEqual([0, 1, 2, 3, 4]);
    expect(nsimba.sequence?.frames.map((f) => f.file)).toEqual(
      [0, 1, 2, 3, 4].map((n) => `illustrations/histoire-nsimba-0${n}.webp`),
    );
  });

  it("maps the mango story's four pages onto three frames, the last held over two pages", () => {
    const mangue = asset("histoire-mangue");
    expect(narrativePageCount(text("la-mangue-partagee"))).toBe(4);
    expect(mangue.sequence?.pageFrames).toEqual([0, 1, 2, 2]);
    expect(mangue.sequence?.frames.map((f) => f.file)).toEqual(
      [1, 2, 3].map((n) => `illustrations/histoire-mangue-0${n}.webp`),
    );
  });

  it("passes every sequence rule against the real texts", () => {
    expect(checkMediaSequences(registry.assets, texts)).toEqual([]);
  });

  it("gives the three single pictures the exact bytes and size of the accepted candidates", () => {
    for (const id of ["corps-tete", "animal-chevre", "comptine-bonjour"]) {
      const row = asset(id);
      const bytes = readFileSync(path.join(ROOT, "public/media", row.file));
      expect(webpSize(bytes), id).toEqual({ width: row.width, height: row.height });
    }
  });
});

describe("the registry schema", () => {
  const row = registry.assets.find((candidate) => candidate.id === "corps-tete")!;
  const parse = (over: Record<string, unknown>) =>
    mediaRegistryFileSchema.safeParse({ audio: [], assets: [{ ...row, ...over }] }).success;

  it("still accepts an SVG with no size", () => {
    const svg = { file: "objects/corps-tete.svg", width: undefined, height: undefined };
    expect(parse(svg)).toBe(true);
  });

  it("refuses painted art without its size, or with half of it", () => {
    expect(parse({ width: undefined, height: undefined })).toBe(false);
    expect(parse({ height: undefined })).toBe(false);
  });

  it("refuses a PNG, a URL, or an unbounded sequence", () => {
    expect(parse({ file: "objects/corps-tete.png" })).toBe(false);
    expect(parse({ file: "https://example.org/tete.webp" })).toBe(false);
    const frames = Array.from({ length: 7 }, (_, i) => frame(i + 1));
    expect(parse({ sequence: { frames, pageFrames: [0] } })).toBe(false);
  });
});

describe("sequence rules", () => {
  it("accepts a sequence whose pages match its story", () => {
    expect(checkMediaSequences([sequenced()], [story(10)])).toEqual([]);
  });

  it("refuses a story whose length no longer matches the page map", () => {
    expect(checkMediaSequences([sequenced()], [story(13)])[0]).toMatch(/has 5 page\(s\)/);
  });

  it("refuses a page naming a missing frame, and a frame no page shows", () => {
    const broken = sequenced({
      sequence: { frames: [frame(1), frame(2), frame(3)], pageFrames: [0, 1, 1, 4] },
    });
    const problems = checkMediaSequences([broken], [story(10)]);
    expect(problems.some((p) => /page 4 names frame 4/.test(p))).toBe(true);
    expect(problems.some((p) => /histoire-x-03\.webp is never shown/.test(p))).toBe(true);
  });

  it("requires the primary file to be one of the frames, with the same bytes", () => {
    expect(
      checkMediaSequences([sequenced({ file: "illustrations/ailleurs.webp" })], [story(10)])[0],
    ).toMatch(/must be one of its frames/);
    expect(
      checkMediaSequences([sequenced({ contentHash: `sha256:${"f".repeat(64)}` })], [story(10)])[0],
    ).toMatch(/different bytes/);
  });

  it("keeps every frame one size, so turning a page never moves the text", () => {
    const frames = [frame(1), frame(2, { height: 1448 }), frame(3)];
    const uneven = sequenced({ sequence: { frames, pageFrames: [0, 1, 2, 2] } });
    expect(checkMediaSequences([uneven], [story(10)])[0]).toMatch(/not the size of the first/);
  });

  it("pages only through a story, and only one that uses it", () => {
    expect(checkMediaSequences([sequenced()], [{ ...story(4), kind: "rhyme" }])[0]).toMatch(
      /only a story pages through/,
    );
    expect(checkMediaSequences([sequenced()], [])[0]).toMatch(/must illustrate a story/);
  });

  it("lists every frame file once, so validation reads and hashes each of them", () => {
    expect(assetFiles(sequenced()).map((f) => f.file)).toEqual([1, 2, 3].map((n) => frame(n).file));
  });
});

describe("approval integrity covers every frame", () => {
  it("fingerprints a picture without a sequence as before, so no other approval lapses", () => {
    const plain = asset("forme-carre");
    expect(assetFingerprint(plain)).toBe(`${plain.kind}|${plain.alt}|${plain.contentHash}`);
  });

  it("moves when a frame is redrawn, re-described, or moved to another page", () => {
    const base = assetFingerprint(sequenced());
    const withSecond = (second: MediaFrame, pageFrames = [0, 1, 2, 2]) =>
      sequenced({ sequence: { frames: [frame(1), second, frame(3)], pageFrames } });
    const redrawn = withSecond(frame(2, { contentHash: `sha256:${"9".repeat(64)}` }));
    const described = withSecond(frame(2, { alt: "Autre" }));
    const remapped = withSecond(frame(2), [0, 1, 1, 2]);
    for (const changed of [redrawn, described, remapped]) {
      expect(assetFingerprint(changed)).not.toBe(base);
    }
    // The digest source uses the same fingerprint, so a lesson reading the story lapses.
    const digest = mediaDigestSource([redrawn], []);
    expect(digest.fingerprint("histoire-x")).toBe(assetFingerprint(redrawn));
  });
});

describe("reading a WebP header", () => {
  it("reads the lossy candidates' size", () => {
    const dir = "docs/review/media/september-rich-benchmark";
    const size = (file: string) => webpSize(readFileSync(path.join(ROOT, dir, file)));
    expect(size("corps-tete.webp")).toEqual({ width: 1254, height: 1254 });
    expect(size("nsimba-school-gate.webp")).toEqual({ width: 1448, height: 1086 });
  });

  it("reads the lossless and extended layouts", () => {
    const header = (chunk: string, body: number[]) =>
      Uint8Array.from([
        ...Buffer.from("RIFF"),
        0,
        0,
        0,
        0,
        ...Buffer.from("WEBP"),
        ...Buffer.from(chunk),
        0,
        0,
        0,
        0,
        ...body,
        ...Array(16).fill(0),
      ]);
    // VP8L: 0x2f, then (width-1) and (height-1) in 14 bits each: 1448×1086.
    const bits = (1448 - 1) | ((1086 - 1) << 14);
    const lossless = [0x2f, bits & 0xff, (bits >> 8) & 0xff, (bits >> 16) & 0xff, bits >>> 24];
    expect(webpSize(header("VP8L", lossless))).toEqual({ width: 1448, height: 1086 });
    // VP8X: flags and reserved bytes, then 24-bit (width-1) and (height-1): 1254×1086.
    const extended = [0, 0, 0, 0, 1253 & 0xff, 1253 >> 8, 0, 1085 & 0xff, 1085 >> 8, 0];
    expect(webpSize(header("VP8X", extended))).toEqual({ width: 1254, height: 1086 });
  });

  it("refuses bytes that are not a WebP image", () => {
    const svg = readFileSync(path.join(ROOT, "public/media/shapes/forme-carre.svg"));
    expect(webpSize(svg)).toBeNull();
  });
});
