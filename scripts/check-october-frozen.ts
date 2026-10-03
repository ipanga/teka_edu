/** Read-only freeze proof for October authoring. Never restamps approvals or packages. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { lessonDigest, checkLessonReview } from "../domain/lessons/review";
import { mediaDigestSource } from "../domain/media/types";
import { lessonsFileSchema } from "../lib/content/lesson-schemas";
import { getReferenceData } from "../lib/content/reference-data";
import { buildReviewPackage } from "../lib/content/review-package";
import { REVIEW_PACKAGES, reviewPackagePath } from "../lib/content/review-packages";

const checkpoint = "1ada5f2dbd258adea9ca4e913729c4620958074c";
const git = (...args: string[]) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
const frozen = (file: string) => git("show", `${checkpoint}:${file}`);
const paths = (prefix: string) =>
  git("ls-tree", "-r", "--name-only", checkpoint, prefix).trim().split("\n");
for (const sha of [
  checkpoint,
  "2170413173b4a7aa2e6e8b2245af0fcf4c52b0bc",
  "603efdc14de535ea78f9dbe4488ff3e49ccc5186",
]) {
  git("merge-base", "--is-ancestor", sha, "HEAD");
}
let byteFiles = 0;
// Runtime and P1 assertions must remain exactly as integrated; authoring does not edit UX.
for (const prefix of [
  "public/media",
  "content/media",
  "content/texts",
  "content/reviews",
  "content/calendars",
  "content/curriculum",
  "content/materials.json",
  "components",
  "app",
  "lib/programme",
  "lib/session",
  "domain",
  "supabase/migrations",
  "docs/review",
]) {
  for (const file of paths(prefix).filter(Boolean)) {
    assert.equal(
      readFileSync(file).compare(
        execFileSync("git", ["show", `${checkpoint}:${file}`], { maxBuffer: 32 * 1024 * 1024 }),
      ),
      0,
      file,
    );
    byteFiles++;
  }
}
for (const file of [
  "tests/e2e/ux-p1.spec.ts",
  "tests/unit/session-p1.test.tsx",
  "tests/unit/session-storage.test.ts",
  "docs/work/OCTOBER_BATCH_1.md",
  "docs/work/OCTOBER_BATCH_1_CORRECTIONS.md",
  "docs/work/OCTOBER_3EME_PLAN.md",
]) {
  assert.equal(readFileSync(file, "utf8"), frozen(file), file);
  byteFiles++;
}
// Only the day-30 availability fixture changes now that its lesson exists.
const dateTest = "tests/unit/session-date.test.tsx";
assert.equal(
  readFileSync(dateTest, "utf8"),
  frozen(dateTest).replace('["2026-10-12", false, latest]', '["2026-10-12", true, "2026-10-12"]'),
  "P1 date assertions changed beyond day-30 availability fixture",
);
const data = getReferenceData();
const source = mediaDigestSource(data.media, data.texts);
let lessonObjects = 0;
let approvals = 0;
for (const file of paths("content/lessons")) {
  const old = JSON.parse(frozen(file)) as { lessons: typeof data.lessons };
  const current = JSON.parse(readFileSync(file, "utf8")) as { lessons: typeof data.lessons };
  assert.deepEqual(current.lessons.slice(0, old.lessons.length), old.lessons, file);
  for (const lesson of lessonsFileSchema.parse(JSON.parse(frozen(file))).lessons) {
    const now = data.lessons.find((l) => l.id === lesson.id)!;
    assert.deepEqual(now, lesson, lesson.id);
    assert.equal(lessonDigest(now, source), lessonDigest(lesson, source), lesson.id);
    assert.deepEqual(checkLessonReview(now, source), [], lesson.id);
    lessonObjects++;
    if (lesson.status === "approved") approvals++;
  }
}
for (const file of paths("content/programmes")) {
  const old = JSON.parse(frozen(file));
  const current = JSON.parse(readFileSync(file, "utf8"));
  if (!file.endsWith("/maternelle-3.json")) assert.deepEqual(current, old, file);
  else {
    const originalTracks = old.tracks as { id: string; lessonIds: string[] }[];
    const originalLengths = new Map(originalTracks.map((t) => [t.id, t.lessonIds.length]));
    const restored = {
      ...current,
      tracks: current.tracks.map((t: { id: string; lessonIds: string[] }) => ({
        ...t,
        lessonIds: t.lessonIds.slice(0, originalLengths.get(t.id)),
      })),
    };
    assert.deepEqual(restored, old, "programme changed outside appended track ids");
  }
}
for (const options of REVIEW_PACKAGES) {
  assert.equal(
    readFileSync(reviewPackagePath(options), "utf8"),
    buildReviewPackage(data, options),
    reviewPackagePath(options),
  );
}
console.log(
  `Frozen integrity PASS: ${lessonObjects} unchanged lesson objects (${approvals} September approvals + 28 Batch 1 review/null), ${byteFiles} unchanged files, ${REVIEW_PACKAGES.length} exact packages; P1 and ancestry preserved.`,
);
