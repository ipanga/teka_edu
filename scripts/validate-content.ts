/**
 * Educational content validation (run in CI: `npm run content:validate`, Plan §8.2).
 *
 * 1. Every JSON file under content/ must be registered in lib/content/reference-data.ts
 *    (so the application actually ships it) and must match its Zod schema.
 * 2. The registered data must satisfy every cross-file and business rule (school years,
 *    holidays, calendar exceptions, levels, curricula).
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  REFERENCE_CONTENT_FILES,
  ReferenceDataError,
  parseReferenceData,
} from "../lib/content/reference-data";

const CONTENT_DIR = path.resolve(import.meta.dirname, "..", "content");

async function listJsonFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true, recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();
}

async function main() {
  const files = await listJsonFiles(CONTENT_DIR);
  const failures: string[] = [];

  for (const file of files) {
    const relative = path.relative(CONTENT_DIR, file).split(path.sep).join("/");
    const registered = REFERENCE_CONTENT_FILES.find((entry) => entry.path === relative);
    try {
      const data: unknown = JSON.parse(await readFile(file, "utf8"));
      if (registered === undefined) {
        failures.push(`${relative}: not registered in lib/content/reference-data.ts`);
        continue;
      }
      const result = registered.schema.safeParse(data);
      if (!result.success) {
        for (const issue of result.error.issues) {
          failures.push(`${relative}: ${issue.path.join(".") || "(root)"}: ${issue.message}`);
        }
      }
    } catch (error) {
      failures.push(`${relative}: ${(error as Error).message}`);
    }
  }

  if (failures.length === 0) {
    try {
      parseReferenceData(REFERENCE_CONTENT_FILES);
    } catch (error) {
      if (!(error instanceof ReferenceDataError)) throw error;
      failures.push(...error.problems);
    }
  }

  if (failures.length > 0) {
    console.error(`Content validation failed (${failures.length} problem(s)):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(
    `Content validation passed: ${files.length} JSON file(s), all registered, schema-valid and consistent.`,
  );
}

await main();
