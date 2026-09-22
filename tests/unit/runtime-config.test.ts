import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SOURCE_DIRS = ["app", "lib", "components", "domain"];
const SOURCE_FILES = ["instrumentation.ts", "next.config.ts"];

function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) out.push(full);
    }
  };
  for (const dir of SOURCE_DIRS) walk(path.join(ROOT, dir));
  return [...out, ...SOURCE_FILES.map((f) => path.join(ROOT, f))];
}

describe("runtime configuration (ADR-025)", () => {
  it("never reads NEXT_PUBLIC_* in the build-time-inlined form", () => {
    // Next.js replaces the literal `process.env.NEXT_PUBLIC_X` at BUILD time. Vercel's
    // container builder passes no build arguments, so that would silently freeze defaults.
    const offenders = sourceFiles().filter((file) =>
      /process\.env\.NEXT_PUBLIC_/.test(readFileSync(file, "utf8")),
    );
    expect(offenders.map((f) => path.relative(ROOT, f))).toEqual([]);
  });

  describe("getPublicEnv", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    it("reads the running environment, not values fixed at build time", async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_ENV", "staging");
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://teka-edu-staging.vercel.app");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://quyhkkizsmosybavoewd.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_only_value");
      const { getPublicEnv } = await import("@/lib/env/public");
      expect(getPublicEnv()).toMatchObject({
        NEXT_PUBLIC_APP_ENV: "staging",
        NEXT_PUBLIC_SUPABASE_URL: "https://quyhkkizsmosybavoewd.supabase.co",
      });
    });

    it("refuses a staging container configured with the production project", async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_ENV", "staging");
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://teka-edu-staging.vercel.app");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://eganrivpkjhozkkahyxy.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_only_value");
      const { getPublicEnv } = await import("@/lib/env/public");
      expect(() => getPublicEnv()).toThrow(/points at the production Supabase project/);
    });
  });
});
