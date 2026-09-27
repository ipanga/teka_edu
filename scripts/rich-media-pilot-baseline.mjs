import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const audit = JSON.parse(
  await readFile(join(root, "docs/september-rich-media-audit.json"), "utf8"),
);
const pilotAssetIds = [
  "corps-tete",
  "animal-chevre",
  "comptine-bonjour",
  "histoire-nsimba",
  "histoire-mangue",
];
const affectedLessonIds = [
  ...new Set(
    audit.assets
      .filter((asset) => pilotAssetIds.includes(asset.id))
      .flatMap((asset) => asset.approvalImpact.lessonIds),
  ),
].sort();

const lessons = new Map();
const lessonRoot = join(root, "content/lessons/maternelle-cycle1-cd-2026");
for (const level of ["maternelle-1", "maternelle-3"]) {
  for (const file of (await readdir(join(lessonRoot, level))).filter((name) =>
    name.endsWith(".json"),
  )) {
    const data = JSON.parse(await readFile(join(lessonRoot, level, file), "utf8"));
    for (const lesson of data.lessons) lessons.set(lesson.id, lesson);
  }
}

const records = affectedLessonIds.map((id) => {
  const lesson = lessons.get(id);
  if (!lesson) throw new Error(`Missing affected lesson ${id}`);
  if (lesson.status !== "approved" || !lesson.review?.reviewedDigest) {
    throw new Error(`Affected lesson is not approved with a digest: ${id}`);
  }
  return {
    lessonId: id,
    status: lesson.status,
    reviewedDigest: lesson.review.reviewedDigest,
    reviewRecordSha256: createHash("sha256").update(JSON.stringify(lesson.review)).digest("hex"),
  };
});

const result = {
  generatedOn: "2026-09-27",
  baselineCommit: "cbc1cf3",
  pilotAssetIds,
  affectedLessonCount: records.length,
  approvedCount: records.filter((record) => record.status === "approved").length,
  reviewCount: records.filter((record) => record.status === "review").length,
  records,
};

await writeFile(
  join(root, "docs/review/2026-2027-september-rich-media-pilot-baseline.json"),
  `${JSON.stringify(result, null, 2)}\n`,
);

console.log(JSON.stringify({ affected: records.length, approved: result.approvedCount }));
