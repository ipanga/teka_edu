/**
 * Educational content validation (run in CI: `npm run content:validate`, Plan §8.2).
 *
 * 1. Every JSON file under content/ must be registered in lib/content/reference-data.ts
 *    (so the application actually ships it) and must match its Zod schema.
 * 2. The registered data must satisfy every cross-file and business rule (school years,
 *    holidays, calendar exceptions, levels, curricula).
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  REFERENCE_CONTENT_FILES,
  ReferenceDataError,
  parseReferenceData,
} from "../lib/content/reference-data";
import { webpSize } from "../lib/content/webp-size";

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

  /**
   * Every picture a lesson can show must exist and must still be the picture that was
   * fingerprinted. An approval covers the bytes, so an asset that has drifted from its recorded
   * hash — or that cannot be read at all — has to fail here rather than quietly weaken a digest.
   */
  //
  // A story sequence is checked frame by frame: every frame's bytes are part of the approval, so
  // a missing or redrawn frame fails exactly like a missing or redrawn single picture.
  if (failures.length === 0) {
    const registryPath = path.join(CONTENT_DIR, "media/registry.json");
    const registry = JSON.parse(await readFile(registryPath, "utf8")) as {
      assets: {
        id: string;
        file: string;
        contentHash: string;
        width?: number;
        height?: number;
        sequence?: {
          frames: { file: string; contentHash: string; width: number; height: number }[];
        };
      }[];
    };
    const mediaRoot = path.resolve(import.meta.dirname, "..", "public", "media");
    for (const asset of registry.assets) {
      for (const entry of [asset, ...(asset.sequence?.frames ?? [])]) {
        const file = path.resolve(mediaRoot, entry.file);
        // Never outside public/media/: a lesson must not reach into the rest of the repository.
        if (file !== path.normalize(file) || !file.startsWith(`${mediaRoot}${path.sep}`)) {
          failures.push(`media "${asset.id}": ${entry.file} escapes public/media/`);
          continue;
        }
        let bytes: Buffer;
        try {
          bytes = await readFile(file);
        } catch {
          failures.push(`media "${asset.id}": cannot read public/media/${entry.file}`);
          continue;
        }
        const actual = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
        if (actual !== entry.contentHash) {
          failures.push(
            `media "${asset.id}": ${entry.file} has changed since it was fingerprinted ` +
              `(recorded ${entry.contentHash.slice(0, 19)}…, now ${actual.slice(0, 19)}…). ` +
              `Run \`npx tsx tools/media/build.ts\`.`,
          );
        }
        if (entry.file.endsWith(".webp")) {
          const size = webpSize(bytes);
          if (size === null) {
            failures.push(`media "${asset.id}": ${entry.file} is not a readable WebP image`);
          } else if (size.width !== entry.width || size.height !== entry.height) {
            failures.push(
              `media "${asset.id}": ${entry.file} is ${size.width}×${size.height}, ` +
                `but the registry declares ${entry.width}×${entry.height}`,
            );
          }
        }
      }
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
