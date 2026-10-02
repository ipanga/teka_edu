import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { format } from "prettier";
import { lessonDigest } from "../domain/lessons/review.ts";
import { mediaDigestSource } from "../domain/media/types.ts";

// Run only after the Cailloux viewport captures exist. Never restores an approval.
const baseline = "b4f242d77ecde3b7e67bdba37e14dcbe56d6061c";
const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "docs/review/histoire-cailloux");
if ((await readdir(out).catch(() => [])).includes("manifest.json")) {
  throw new Error("Evidence already frozen; never overwrite a submitted package.");
}
const json = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const oldBytes = (file) => execFileSync("git", ["show", `${baseline}:${file}`], { cwd: root });
const old = (file) => JSON.parse(oldBytes(file));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const expected = new Set(["m3-lang-08", "m3-lang-14", "m3-lang-18"]);
const registry = await json("content/media/registry.json");
const texts = (
  await Promise.all(
    ["maternelle-1", "maternelle-3"].map(async (level) => {
      const file = `content/texts/${level}.json`;
      if (!(await readFile(path.join(root, file))).equals(oldBytes(file)))
        throw new Error(`${file} changed`);
      return (await json(file)).texts;
    }),
  )
).flat();
const story = texts.find((text) => text.id === "les-trois-cailloux-de-tito");
const asset = registry.assets.find((item) => item.id === "histoire-cailloux");
if (!same(asset.sequence.pageFrames, [0, 1, 2, 3]) || story.lines.length !== 11) {
  throw new Error("Canonical page mapping changed");
}
const media = mediaDigestSource(registry.assets, texts);
const affected = [];
const currentDigests = new Set();
let unaffected = 0;
for (const level of ["maternelle-1", "maternelle-3"]) {
  const dir = `content/lessons/maternelle-cycle1-cd-2026/${level}`;
  for (const file of await readdir(path.join(root, dir))) {
    if (!file.endsWith(".json")) continue;
    const before = old(`${dir}/${file}`).lessons;
    for (const lesson of (await json(`${dir}/${file}`)).lessons) {
      const prior = before.find((item) => item.id === lesson.id);
      const freshDigest = lessonDigest(lesson, media);
      currentDigests.add(freshDigest);
      if (!expected.has(lesson.id)) {
        if (!same(lesson, prior) || lesson.review.reviewedDigest !== freshDigest) {
          throw new Error(`Unaffected lesson changed/stale: ${lesson.id}`);
        }
        unaffected++;
        continue;
      }
      const semantics = (item) => {
        const result = { ...item };
        delete result.status;
        delete result.review;
        return result;
      };
      if (
        !same(semantics(lesson), semantics(prior)) ||
        lesson.status !== "review" ||
        lesson.review !== null
      ) {
        throw new Error(`Incorrect lapse or semantic change: ${lesson.id}`);
      }
      if (freshDigest === prior.review.reviewedDigest)
        throw new Error(`Digest did not move: ${lesson.id}`);
      affected.push({
        id: lesson.id,
        level,
        priorDigest: prior.review.reviewedDigest,
        pendingDigest: freshDigest,
        status: lesson.status,
        review: lesson.review,
        canonicalLesson: semantics(lesson),
      });
    }
  }
}
if (unaffected !== 173 || affected.length !== 3 || currentDigests.size !== 176)
  throw new Error("Approval impact/digest mismatch");
if (
  !(await readFile(path.join(root, "content/reviews/history.json"))).equals(
    oldBytes("content/reviews/history.json"),
  )
) {
  throw new Error("Review history changed without independent verdict");
}
for (const item of registry.assets) {
  if (item.id === asset.id) continue;
  if (
    !same(
      item,
      old("content/media/registry.json").assets.find((prior) => prior.id === item.id),
    )
  ) {
    throw new Error(`Unrelated registry row changed: ${item.id}`);
  }
  for (const frame of [item, ...(item.sequence?.frames ?? [])]) {
    const file = `public/media/${frame.file}`;
    if (!(await readFile(path.join(root, file))).equals(oldBytes(file)))
      throw new Error(`Unrelated media changed: ${file}`);
  }
}
for (const file of execFileSync(
  "git",
  ["ls-tree", "-r", "--name-only", baseline, "--", "docs/review/histoire-pluie"],
  { cwd: root, encoding: "utf8" },
)
  .trim()
  .split("\n")) {
  if (!(await readFile(path.join(root, file))).equals(oldBytes(file)))
    throw new Error(`Accepted Pluie evidence changed: ${file}`);
}
await mkdir(path.join(out, "frames"), { recursive: true });
await mkdir(path.join(out, "screens"), { recursive: true });
const delivery = [];
for (const [index, frame] of asset.sequence.frames.entries()) {
  const source = path.join(root, "public/media", frame.file);
  const bytes = await readFile(source);
  const metadata = await sharp(bytes).metadata();
  if (
    `sha256:${hash(bytes)}` !== frame.contentHash ||
    metadata.width !== 1200 ||
    metadata.height !== 900
  ) {
    throw new Error(`Frame integrity failure: ${frame.file}`);
  }
  await sharp(bytes).raw().toBuffer();
  const file = `frames/page-${index + 1}.webp`;
  await copyFile(source, path.join(out, file));
  delivery.push({ ...frame, packageFile: file, bytes: bytes.length });
}
await copyFile(
  path.join(root, "docs/review/media/september-rich-media-rollout-batch-9-comparison.png"),
  path.join(out, "comparison.png"),
);
for (const level of [3]) {
  await copyFile(
    path.join(root, `docs/review/2026-2027-maternelle-${level}-reconfirmation-visuelle.md`),
    path.join(out, `reconfirmation-maternelle-${level}.md`),
  );
}
const captures = path.join(root, "private/astra-visual-evidence/histoire-cailloux-screens");
await copyFile(
  path.join(captures, "phone-390-page-2-return.png"),
  path.join(out, "screens/phone-390-page-2-return.png"),
);
for (const name of ["phone-390", "tablet-portrait", "macbook-1440"]) {
  for (let page = 1; page <= 4; page++) {
    await copyFile(
      path.join(captures, `${name}-page-${page}.png`),
      path.join(out, "screens", `${name}-page-${page}.png`),
    );
  }
  const width = name === "phone-390" ? 390 : name === "tablet-portrait" ? 384 : 720;
  const height = name === "phone-390" ? 844 : name === "tablet-portrait" ? 512 : 450;
  const panels = await Promise.all(
    [1, 2, 3, 4].map(async (page, index) => ({
      input: await sharp(path.join(captures, `${name}-page-${page}.png`))
        .resize(width, height)
        .png()
        .toBuffer(),
      left: (index % 2) * width,
      top: Math.floor(index / 2) * height,
    })),
  );
  await sharp({
    create: { width: width * 2, height: height * 2, channels: 3, background: "#ffffff" },
  })
    .composite(panels)
    .png()
    .toFile(path.join(out, `${name}-overview.png`));
}
const tiles = await Promise.all(
  delivery.map(async (frame, index) => ({
    input: await sharp(path.join(out, frame.packageFile)).resize(256, 192).png().toBuffer(),
    left: index * 272,
    top: 0,
  })),
);
await sharp({ create: { width: 1072, height: 192, channels: 3, background: "#ffffff" } })
  .composite(tiles)
  .png()
  .toFile(path.join(out, "child-size-256.png"));
const writeJson = async (file, value) =>
  writeFile(path.join(out, file), await format(JSON.stringify(value), { parser: "json" }));
await writeJson("canonical-and-impact.json", {
  baseline,
  approvalState: { approved: 173, review: 3, stale: 0, unaffectedByteIdentical: 173 },
  unrelatedRegistryAndMediaPreserved: 50,
  reviewHistoryUnchanged: true,
  story,
  sharedTexts: texts.filter((text) => text.illustrationId === asset.id && text.id !== story.id),
  pageFrames: asset.sequence.pageFrames,
  pages: asset.sequence.pageFrames.map((frame, index) => ({
    page: index + 1,
    frame: frame + 1,
    lines: story.lines.slice(index * 3, index * 3 + 3),
    delivery: delivery[frame],
  })),
  visibleStoneCounts: [3, 2, 2, 3],
  primaryFrame: 1,
  primaryReason: "Story-only asset; page 1 establishes the three collected stone identities.",
  affected,
});
const entries = await readdir(out, { recursive: true, withFileTypes: true });
const files = [];
for (const entry of entries) {
  if (!entry.isFile() || entry.name === "manifest.json") continue;
  const absolute = path.join(entry.parentPath, entry.name);
  const bytes = await readFile(absolute);
  files.push({ file: path.relative(out, absolute), bytes: bytes.length, sha256: hash(bytes) });
}
await writeJson("manifest.json", {
  baseline,
  candidate: "histoire-cailloux",
  verdict: "pending",
  files: files.sort((a, b) => a.file.localeCompare(b.file)),
});
console.log(
  `Frozen Cailloux evidence: ${files.length} files; 3 expected lapses; 173 unchanged valid approvals. No restoration.`,
);
