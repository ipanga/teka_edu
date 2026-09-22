import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "../..");
const DOMAIN = path.join(ROOT, "domain");

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && /\.tsx?$/.test(e.name))
    .map((e) => path.join(e.parentPath, e.name));
}

describe("architecture (CLAUDE.md: app/, components/ → domain/ ← lib/)", () => {
  it("domain/ imports nothing but other domain modules (no React, Next.js, storage, lib/)", () => {
    const offenders = files(DOMAIN).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const imports = [...source.matchAll(/^\s*(?:import|export)\b[^;]*?from\s+"([^"]+)"/gm)].map(
        (m) => m[1] ?? "",
      );
      return imports
        .filter((specifier) => {
          if (!specifier.startsWith(".")) return true;
          return !path.resolve(path.dirname(file), specifier).startsWith(DOMAIN);
        })
        .map((specifier) => `${path.relative(ROOT, file)} → ${specifier}`);
    });
    expect(offenders).toEqual([]);
  });

  it("calendar logic never uses Date except to turn an instant into a date", () => {
    const offenders = files(path.join(DOMAIN, "calendar")).filter((file) => {
      const source = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
      const uses = source.match(
        /\bnew Date\b|\bDate\.(now|parse|UTC)\b|\.get(Day|Date|Month|FullYear|Hours)\(/g,
      );
      return uses !== null;
    });
    expect(offenders.map((f) => path.relative(ROOT, f))).toEqual([]);
  });
});
