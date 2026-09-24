/**
 * Sends every approved lesson whose digest no longer matches back to `review` (ADR-048).
 *
 *   npx tsx scripts/lapse-approvals.ts [--dry-run=true]
 *
 * This is the honest half of redrawing a picture: the approval covered the bytes the reviewer
 * saw, the bytes changed, so the approval lapses. The script does only what content validation
 * would otherwise demand by hand — status to `review`, the review record removed — and lists the
 * lessons so the visual reconfirmation package can name them. It never re-stamps anything;
 * restoration is `scripts/approve-week.ts`, after a recorded review.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import { lessonDigest } from "@/domain/lessons/review";
import { mediaDigestSource } from "@/domain/media/types";

const ROOT = path.resolve(import.meta.dirname, "..");
const dryRun = process.argv.includes("--dry-run=true");
const DOMAINS = ["lang", "math", "phys", "art", "time-space", "world"];
const LEVELS = ["maternelle-1", "maternelle-3"];

// Raw files, not `getReferenceData()`: the reference data refuses to load while an approval is
// stale, which is exactly the state this script exists to resolve.
const readJson = (file: string) => JSON.parse(readFileSync(path.join(ROOT, file), "utf8"));
const registry = readJson("content/media/registry.json").assets;
const texts = LEVELS.flatMap((levelId) => readJson(`content/texts/${levelId}.json`).texts);
const media = mediaDigestSource(registry, texts);
const lapsed: string[] = [];

for (const levelId of LEVELS) {
  for (const domain of DOMAINS) {
    const file = path.join(
      ROOT,
      `content/lessons/maternelle-cycle1-cd-2026/${levelId}/${domain}.json`,
    );
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    let touched = false;
    for (const raw of parsed.lessons as {
      id: string;
      status: string;
      review: { reviewedDigest: string } | null;
    }[]) {
      if (raw.status !== "approved" || raw.review === null) continue;
      if (lessonDigest(raw as never, media) === raw.review.reviewedDigest) continue;
      raw.status = "review";
      raw.review = null;
      lapsed.push(raw.id);
      touched = true;
    }
    if (touched && !dryRun) {
      const text = JSON.stringify(parsed, null, 2);
      writeFileSync(
        file,
        await format(text, { ...(await resolveConfig(file)), filepath: file }),
        "utf8",
      );
    }
  }
}

console.log(`${dryRun ? "[dry run] " : ""}${lapsed.length} approval(s) lapsed`);
for (const id of lapsed) console.log(`  ${id}`);
