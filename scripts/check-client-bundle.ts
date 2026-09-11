/**
 * Guards against server secrets leaking into browser bundles.
 *
 * Run after `next build` with sentinel values assigned to the server-only variables
 * (CI does this). Fails if any sentinel value appears in the client output (.next/static).
 * Values are never printed.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SERVER_ONLY_VARIABLES = [
  "SUPABASE_SECRET_KEY",
  "DATABASE_URL",
  "DIRECT_DATABASE_URL",
] as const;

const STATIC_DIR = path.resolve(import.meta.dirname, "..", ".next", "static");

async function main() {
  const sentinels = SERVER_ONLY_VARIABLES.flatMap((name) => {
    const value = process.env[name];
    return value && value.length >= 12 ? [{ name, value }] : [];
  });
  if (sentinels.length === 0) {
    console.error(
      `Set sentinel values (>= 12 chars) for ${SERVER_ONLY_VARIABLES.join(", ")} before building.`,
    );
    process.exit(1);
  }

  const entries = await readdir(STATIC_DIR, { withFileTypes: true, recursive: true });
  const files = entries.filter((e) => e.isFile()).map((e) => path.join(e.parentPath, e.name));
  const leaks: string[] = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    for (const { name, value } of sentinels) {
      if (content.includes(value))
        leaks.push(`${name} found in ${path.relative(STATIC_DIR, file)}`);
    }
  }

  if (leaks.length > 0) {
    console.error("Server-only values leaked into client bundles:");
    for (const leak of leaks) console.error(`  - ${leak}`);
    process.exit(1);
  }
  console.log(
    `Client bundle check passed: ${files.length} file(s) scanned, ${sentinels.length} server-only value(s) absent.`,
  );
}

await main();
