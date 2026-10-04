/** Read-only UX freeze proof against the integrated, production-validated October tree. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { checkLessonReview } from "../domain/lessons/review";
import { mediaDigestSource } from "../domain/media/types";
import { generateSchoolDays } from "../domain/calendar/school-days";
import { generateDailyPlan } from "../domain/programme/daily-plan";
import { entriesDueBy } from "../domain/programme/annual-plan";
import { getProgramme, getReferenceData } from "../lib/content/reference-data";
import { buildReviewPackage } from "../lib/content/review-package";
import { REVIEW_PACKAGES, reviewPackagePath } from "../lib/content/review-packages";

const baseline = "ae07c243d4c1dd8ce710edf8d9c93e8582649448";
const git = (...args: string[]) => execFileSync("git", args, { maxBuffer: 64 * 1024 * 1024 });
git("merge-base", "--is-ancestor", baseline, "HEAD");
const protectedPaths = [
  "content",
  "public/media",
  "docs/review",
  "supabase",
  "lib/content",
  "domain",
  "scripts/check-october-final.ts",
];
const paths = (buffer: Buffer) => buffer.toString().split("\0").filter(Boolean).sort();
const before = paths(git("ls-tree", "-r", "-z", "--name-only", baseline, "--", ...protectedPaths));
const current = paths(
  git("ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", ...protectedPaths),
);
assert.deepEqual(current, before, "protected file inventory changed");
const aggregate = createHash("sha256");
for (const file of before) {
  const bytes = readFileSync(file);
  assert.equal(bytes.compare(git("show", `${baseline}:${file}`)), 0, file);
  aggregate.update(file).update("\0").update(createHash("sha256").update(bytes).digest());
}
const data = getReferenceData();
const media = mediaDigestSource(data.media, data.texts);
for (const lesson of data.lessons) {
  assert.equal(lesson.status, "approved", lesson.id);
  assert.deepEqual(checkLessonReview(lesson, media), [], lesson.id);
}
const calendar = data.calendars.find((c) => c.schoolYear.id === "2026-2027")!;
const days = generateSchoolDays(calendar, data.publicHolidays);
const programme = getProgramme("maternelle-3", "2026-2027", data)!;
const october = days
  .filter((day) => day.instructional && day.date.startsWith("2026-10"))
  .map((day) => generateDailyPlan(day, programme, data.lessons));
assert.deepEqual(
  october.map((plan) => plan.instructionalDay),
  Array.from({ length: 22 }, (_, index) => index + 23),
);
assert.ok(october.every((plan) => plan.status === "complete" && plan.totalMinutes === 35));
const lessons = october.flatMap((plan) => plan.sessions.map((step) => step.lesson!));
assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, 88);
assert.equal(new Set(lessons.map((lesson) => lesson.review!.reviewedDigest)).size, 88);
assert.deepEqual(
  Object.fromEntries(
    ["LANG", "MATH", "PHYS", "ART", "WORLD", "TIME-SPACE"].map((code) => [
      code,
      lessons.filter((lesson) => lesson.domainCode === code).length,
    ]),
  ),
  { LANG: 22, MATH: 22, PHYS: 22, ART: 7, WORLD: 6, "TIME-SPACE": 9 },
);
assert.equal(data.lessons.length - lessons.length, 176);
assert.equal(
  generateDailyPlan(
    days.find((day) => day.instructionalDay === 45)!,
    programme,
    data.lessons,
  ).status,
  "no-content",
);
const taught = new Set(
  days
    .filter((day) => day.instructionalDay !== null && day.instructionalDay <= 44)
    .flatMap((day) => generateDailyPlan(day, programme, data.lessons).objectiveCodes),
);
const due = entriesDueBy(
  data.annualPlans.find((plan) => plan.levelId === "maternelle-3")!,
  44,
);
assert.equal(due.length, 56);
assert.ok(due.every((entry) => taught.has(entry.objectiveCode)));
for (const options of REVIEW_PACKAGES)
  assert.equal(
    readFileSync(reviewPackagePath(options), "utf8"),
    buildReviewPackage(data, options),
    reviewPackagePath(options),
  );
console.log(
  JSON.stringify(
    {
      baseline,
      protectedFiles: before.length,
      aggregate: aggregate.digest("hex"),
      septemberApproved: 176,
      octoberApproved: 88,
      review: 0,
      stale: 0,
      distinctOctoberDigests: 88,
      objectives: "56/56",
      packages: REVIEW_PACKAGES.length,
      day45: "no-content",
    },
    null,
    2,
  ),
);
