/**
 * Writes the human review packages, one per school week (docs/PEDAGOGICAL_REVIEW.md, ADR-035).
 *
 *   npm run review:package
 *   npm run review:package -- --level=maternelle-3 --year=2026-2027 --week=2 --from=5 --to=9
 *
 * The output is deterministic: a unit test fails if the committed file is out of date.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getReferenceData } from "../lib/content/reference-data";
import { REVIEW_PACKAGES, reviewPackagePath } from "../lib/content/review-packages";
import { buildReviewPackage } from "../lib/content/review-package";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, value] = arg.replace(/^--/, "").split("=");
      return [key ?? "", value ?? "true"];
    }),
);

const data = getReferenceData();
const requested = args.has("level")
  ? [
      {
        levelId: args.get("level") ?? "",
        schoolYearId: args.get("year") ?? "2026-2027",
        week: Number(args.get("week") ?? 1),
        fromDay: Number(args.get("from") ?? 1),
        toDay: Number(args.get("to") ?? 5),
      },
    ]
  : REVIEW_PACKAGES;

for (const options of requested) {
  const file = reviewPackagePath(options);
  const full = path.join(ROOT, file);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buildReviewPackage(data, options));
  console.log(`Wrote ${file}`);
}
