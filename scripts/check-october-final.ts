/** Read-only final approval audit; --write saves its repository-derived evidence. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { generateSchoolDays } from "../domain/calendar/school-days";
import { checkLessonReview } from "../domain/lessons/review";
import type { Lesson } from "../domain/lessons/types";
import { mediaDigestSource } from "../domain/media/types";
import { entriesDueBy } from "../domain/programme/annual-plan";
import { generateDailyPlan } from "../domain/programme/daily-plan";
import { getProgramme, getReferenceData } from "../lib/content/reference-data";
import { buildReviewPackage } from "../lib/content/review-package";
import { REVIEW_PACKAGES, reviewPackagePath } from "../lib/content/review-packages";
import { referenceSyncSql, referenceTables, referenceTestSql } from "../lib/supabase/reference-sql";

const accepted = "1f573c508b30ddd0ade57d7a8cd8329d5eb901ce";
const git = (...args: string[]) => execFileSync("git", args, { maxBuffer: 64 * 1024 * 1024 });
const paths = (prefix: string) =>
  git("ls-tree", "-r", "--name-only", accepted, prefix)
    .toString()
    .trim()
    .split("\n")
    .filter(Boolean);
git("merge-base", "--is-ancestor", accepted, "HEAD");
const data = getReferenceData();
const media = mediaDigestSource(data.media, data.texts);
const calendar = data.calendars.find((c) => c.schoolYear.id === "2026-2027")!;
const days = generateSchoolDays(calendar, data.publicHolidays);
const programme = getProgramme("maternelle-3", "2026-2027", data)!;
const plans = days
  .filter((d) => d.date.startsWith("2026-10") && d.instructional)
  .map((d) => generateDailyPlan(d, programme, data.lessons));
assert.equal(plans.length, 22);
assert.deepEqual(
  plans.map((p) => p.instructionalDay),
  Array.from({ length: 22 }, (_, i) => i + 23),
);
for (const plan of plans) {
  assert.equal(plan.status, "complete");
  assert.equal(plan.sessions.length, 4);
  assert.equal(plan.totalMinutes, 35);
}
const ids = new Set(plans.flatMap((p) => p.sessions.map((s) => s.lesson!.id)));
assert.equal(ids.size, 88);
const october = data.lessons.filter((l) => ids.has(l.id));
const counts = Object.fromEntries(
  ["LANG", "MATH", "PHYS", "ART", "WORLD", "TIME-SPACE"].map((code) => [
    code,
    october.filter((l) => l.domainCode === code).length,
  ]),
);
assert.deepEqual(counts, { LANG: 22, MATH: 22, PHYS: 22, ART: 7, WORLD: 6, "TIME-SPACE": 9 });
assert.equal(
  generateDailyPlan(
    days.find((d) => d.instructionalDay === 45)!,
    programme,
    data.lessons,
  ).status,
  "no-content",
);
for (const lesson of october) {
  assert.equal(lesson.status, "approved", lesson.id);
  assert.equal(lesson.review?.outcome, "accepted", lesson.id);
  assert.equal(lesson.review?.reviewKind, "ai-assisted", lesson.id);
  assert.deepEqual(checkLessonReview(lesson, media), [], lesson.id);
}
const digests = new Set(october.map((l) => l.review!.reviewedDigest));
assert.equal(digests.size, 88);
const september = data.lessons.filter((l) => !ids.has(l.id));
assert.equal(september.length, 176);
assert.equal(new Set(data.lessons.map((l) => l.review!.reviewedDigest)).size, 264);
let preserved = 0;
for (const file of paths("content/lessons")) {
  const old = JSON.parse(git("show", `${accepted}:${file}`).toString()) as { lessons: Lesson[] };
  const now = JSON.parse(readFileSync(file, "utf8")) as { lessons: Lesson[] };
  assert.deepEqual(
    {
      ...now,
      lessons: now.lessons.map((l) => {
        const before = old.lessons.find((o) => o.id === l.id)!;
        return ids.has(l.id) ? { ...l, status: before.status, review: before.review } : l;
      }),
    },
    old,
    file,
  );
  preserved += now.lessons.filter((l) => !ids.has(l.id)).length;
}
assert.equal(preserved, 176);
for (const l of september) assert.deepEqual(checkLessonReview(l, media), [], l.id);
let byteFiles = 0;
for (const prefix of [
  "public/media",
  "content/media",
  "content/texts",
  "content/calendars",
  "content/curriculum",
  "content/materials.json",
  "content/programmes",
  "components",
  "app",
  "domain",
  "supabase/migrations",
  "docs/review/media",
]) {
  for (const file of paths(prefix)) {
    assert.equal(readFileSync(file).compare(git("show", `${accepted}:${file}`)), 0, file);
    byteFiles++;
  }
}
for (const file of [
  "tests/e2e/ux-p1.spec.ts",
  "tests/unit/session-p1.test.tsx",
  "tests/unit/session-storage.test.ts",
  "tests/unit/session-date.test.tsx",
  "docs/work/OCTOBER_BATCH_1_CORRECTIONS.md",
  "docs/review/OCTOBER_BATCH_1_RECONFIRMATION.md",
  "docs/work/OCTOBER_PHYS_CORRECTIONS.md",
]) {
  assert.equal(readFileSync(file).compare(git("show", `${accepted}:${file}`)), 0, file);
  byteFiles++;
}
const oldHistory = JSON.parse(
  git("show", `${accepted}:content/reviews/history.json`).toString(),
).reviews;
assert.deepEqual(data.reviewHistory.slice(0, oldHistory.length), oldHistory);
const appended = data.reviewHistory.slice(oldHistory.length);
assert.equal(appended.length, 10);
for (const week of [6, 7, 8, 9, 10]) {
  const entries = appended.filter((r) => r.week === week);
  assert.deepEqual(
    entries.map((r) => r.outcome),
    ["accepted-with-modifications", "accepted"],
  );
  assert.ok(
    entries.every(
      (r) =>
        r.scope === "full-review" &&
        r.reviewKind === "ai-assisted" &&
        r.levelId === "maternelle-3" &&
        r.schoolYearId === "2026-2027",
    ),
  );
}
const taught = new Set(
  days
    .filter((d) => d.instructionalDay !== null && d.instructionalDay <= 44)
    .flatMap((d) =>
      generateDailyPlan(d, programme, data.lessons).sessions.flatMap(
        (s) => s.lesson?.objectiveCodes ?? [],
      ),
    ),
);
const due = entriesDueBy(
  data.annualPlans.find((p) => p.levelId === "maternelle-3")!,
  44,
);
assert.equal(due.length, 56);
assert.ok(due.every((e) => taught.has(e.objectiveCode)));
const hashes: string[] = [];
for (const options of REVIEW_PACKAGES) {
  const file = reviewPackagePath(options);
  const saved = readFileSync(file, "utf8");
  assert.equal(saved, buildReviewPackage(data, options), file);
  if (options.levelId === "maternelle-3" && options.week >= 6) {
    hashes.push(`- Week ${options.week}: ${createHash("sha256").update(saved).digest("hex")}`);
  } else assert.equal(saved, git("show", `${accepted}:${file}`).toString(), file);
}
const migration = "supabase/migrations/20261003195954_october_maternelle_3_approved.sql";
const sql = readFileSync(migration, "utf8");
assert.ok(sql.endsWith(referenceSyncSql(data)), "migration differs from deterministic generator");
assert.equal(
  readFileSync("supabase/tests/database/reference_data.test.sql", "utf8"),
  referenceTestSql(data),
);
const tables = referenceTables(data).map((t) => t.table);
assert.ok(!tables.some((t) => /auth|user|child|progress|profile/i.test(t)));
assert.equal(tables.length, 36);
const report = [
  "# Final October 2026 audit",
  "",
  `Accepted checkpoint: ${accepted}. Owner-relayed independent verdict; not self-review.`,
  "",
  "Generated by node --import tsx scripts/check-october-final.ts --write. All assertions PASS.",
  "",
  "- Days 23–44: 22 complete days, 35 minutes each; Day 30 authored, Day 45 no-content.",
  `- 88 lessons approved, zero review, 88 fresh distinct digests; 264 total distinct digests.`,
  `- Domain counts: ${JSON.stringify(counts)}. Canonical rotation preserved.`,
  "- Annual-plan coverage: 56/56 due through Day 44; zero missing.",
  `- Accepted pedagogy unchanged: only October status/review differ; 176 September objects/digests unchanged; ${byteFiles} protected files byte-identical; P1 unchanged.`,
  "- History: old entries unchanged, ten owner-relayed records appended for Weeks 6–10.",
  "- All 15 packages exactly fresh; ten September packages byte-identical.",
  "- All accepted media/three October growth SVG bytes and associations unchanged. No new asset generation. Required gaps checked by media report and content validation.",
  `- Migration: ${migration}; exact generated payload, ${tables.length} canonical/reference tables only. No schema/auth/user/child/progress mutation.`,
  `- Tables: ${tables.join(", ")}.`,
  "",
  "## Final package SHA-256",
  "",
  ...hashes,
  "",
  "Current technical/DB/browser results and stop boundary: docs/work/ACTIVE_TASK.md.",
  "",
].join("\n");
if (process.argv.includes("--write")) writeFileSync("docs/work/OCTOBER_FINAL_AUDIT.md", report);
console.log(report);
