import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "../..");
const WORKFLOWS = path.join(ROOT, ".github/workflows");

/**
 * One Supabase CLI for the whole project (docs/DEPLOYMENT.md). supabase/setup-cli installs the
 * latest CLI when it is given no version; on 2026-09-23 that meant CI ran a different CLI from
 * the one the project tests with, and the migration tool could change under a release unnoticed.
 */
describe("the Supabase CLI is pinned everywhere to the same version", () => {
  const pinned = (
    JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8")) as {
      devDependencies: Record<string, string>;
    }
  ).devDependencies["supabase"];

  it("is pinned exactly in package.json", () => {
    expect(pinned).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("gives every setup-cli step in every workflow that exact version", () => {
    let steps = 0;
    for (const file of readdirSync(WORKFLOWS).filter((f) => f.endsWith(".yml"))) {
      const lines = readFileSync(path.join(WORKFLOWS, file), "utf8").split("\n");
      lines.forEach((line, index) => {
        if (!line.includes("uses: supabase/setup-cli@")) return;
        steps += 1;
        const block = lines.slice(index + 1, index + 4).join("\n");
        expect(block, `${file}:${index + 1} has no pinned version`).toMatch(
          new RegExp(`with:\\s*\\n\\s*version:\\s*${pinned!.replaceAll(".", "\\.")}\\s*$`, "m"),
        );
      });
    }
    expect(steps, "no setup-cli step found").toBeGreaterThanOrEqual(3);
  });
});
