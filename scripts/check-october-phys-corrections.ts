/** Read-only proof that the four authorized O11 removals are the entire lesson diff. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Lesson } from "../domain/lessons/types";
import { getReferenceData } from "../lib/content/reference-data";
import { buildReviewPackage } from "../lib/content/review-package";
import { REVIEW_PACKAGES, reviewPackagePath } from "../lib/content/review-packages";

const baseline = "61b2e07e9b1f3fbc793cf230291215feef3991fd";
const authorized = new Set(["m3-phys-33", "m3-phys-38", "m3-phys-42", "m3-phys-44"]);
const code = "PHYS-S01-C01-O11";
const git = (...args: string[]) => execFileSync("git", args, { maxBuffer: 32 * 1024 * 1024 });
git("merge-base", "--is-ancestor", baseline, "HEAD");
const paths = (prefix: string) =>
  git("ls-tree", "-r", "--name-only", baseline, prefix)
    .toString()
    .trim()
    .split("\n")
    .filter(Boolean);
let unchanged = 0;
let changed = 0;
for (const file of paths("content/lessons")) {
  const before = JSON.parse(git("show", `${baseline}:${file}`).toString()) as { lessons: Lesson[] };
  const current = JSON.parse(readFileSync(file, "utf8")) as { lessons: Lesson[] };
  const expected = structuredClone(before);
  for (const lesson of expected.lessons) {
    if (!authorized.has(lesson.id)) {
      unchanged++;
      continue;
    }
    assert.equal(lesson.activities.length, 1, lesson.id);
    assert.ok(lesson.supportingObjectiveCodes.includes(code), lesson.id);
    assert.ok(lesson.activities[0]!.objectiveCodes.includes(code), lesson.id);
    lesson.supportingObjectiveCodes = lesson.supportingObjectiveCodes.filter((c) => c !== code);
    lesson.activities = lesson.activities.map((a) => ({
      ...a,
      objectiveCodes: a.objectiveCodes.filter((c) => c !== code),
    }));
    changed++;
  }
  assert.deepEqual(current, expected, file);
  if (!file.endsWith("/maternelle-3/phys.json"))
    assert.equal(readFileSync(file).compare(git("show", `${baseline}:${file}`)), 0, file);
}
assert.equal(changed, 4);
assert.equal(unchanged, 260);
let protectedFiles = 0;
for (const prefix of [
  "public/media",
  "content/media",
  "content/texts",
  "content/reviews",
  "content/calendars",
  "content/curriculum",
  "content/materials.json",
  "content/programmes",
  "components",
  "app",
  "domain",
  "lib/programme",
  "lib/session",
  "supabase/migrations",
  "docs/review/media",
]) {
  for (const file of paths(prefix)) {
    assert.equal(readFileSync(file).compare(git("show", `${baseline}:${file}`)), 0, file);
    protectedFiles++;
  }
}
const data = getReferenceData();
let untouchedPackages = 0;
for (const options of REVIEW_PACKAGES) {
  const file = reviewPackagePath(options);
  const saved = readFileSync(file, "utf8");
  assert.equal(saved, buildReviewPackage(data, options), file);
  if (options.levelId === "maternelle-3" && options.fromDay >= 30) {
    console.log(`${file}: exact; sha256:${createHash("sha256").update(saved).digest("hex")}`);
  } else {
    assert.equal(saved, git("show", `${baseline}:${file}`).toString(), file);
    untouchedPackages++;
  }
}
const october = data.lessons.filter(
  (l) => l.levelIds.includes("maternelle-3") && l.themeId === "octobre-je-grandis-en-francais",
);
assert.equal(october.length, 88);
assert.ok(october.every((l) => l.status === "review" && l.review === null));
console.log(
  `PHYS correction integrity PASS: exactly ${changed} mapping-only lesson corrections, ${unchanged} unchanged lessons, ${protectedFiles} byte-identical files, ${untouchedPackages} unchanged weekly packages, all ${REVIEW_PACKAGES.length} packages fresh, 88 October lessons review/null.`,
);
