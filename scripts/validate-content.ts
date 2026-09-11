/**
 * Educational content validation (run in CI: `npm run content:validate`).
 *
 * Phase 0 scope: every JSON file under content/ must parse. Zod schemas for calendars,
 * curriculum and lessons are added in Phase 1 (see PROJECT_STATUS.md); register them in
 * `validators` below so CI rejects malformed content (Plan §8.2).
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const CONTENT_DIR = path.resolve(import.meta.dirname, "..", "content");

type Validator = { matches: (relativePath: string) => boolean; validate: (data: unknown) => void };
const validators: Validator[] = [];

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
    const relative = path.relative(CONTENT_DIR, file);
    try {
      const data: unknown = JSON.parse(await readFile(file, "utf8"));
      for (const validator of validators) {
        if (validator.matches(relative)) validator.validate(data);
      }
    } catch (error) {
      failures.push(`${relative}: ${(error as Error).message}`);
    }
  }

  if (failures.length > 0) {
    console.error(`Content validation failed (${failures.length} file(s)):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(
    `Content validation passed: ${files.length} JSON file(s), ${validators.length} schema validator(s).`,
  );
}

await main();
