import { afterEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { packageRelease, hash } from "../../scripts/alwaysdata/package.mjs";
import {
  SITE_COMMAND,
  SITE_ID,
  assertSite,
  assertHealth,
  siteAction,
} from "../../scripts/alwaysdata/site.mjs";
const sha = "a".repeat(40);
const site = {
  id: SITE_ID,
  type: "nodejs",
  working_directory: "/home/congofoot/www/tekaedu-staging",
  command: SITE_COMMAND,
  nodejs_version: "22",
  addresses: ["staging-tekaedu.tootiye.com"],
  environment: "",
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("alwaysdata staging acceptance guards", () => {
  it("rejects absent/stale SHA and stale Supabase health identity", () => {
    const health = { status: "ok", environment: "staging", commit: sha, supabaseProjectRef: null };
    expect(() => assertHealth(health, sha)).not.toThrow();
    for (const delta of [
      { commit: null },
      { commit: "b".repeat(40) },
      { environment: "production" },
      { supabaseProjectRef: "stale" },
      { status: "bad" },
    ])
      expect(() => assertHealth({ ...health, ...delta }, sha)).toThrow();
  });
  it("refuses a different site, address, runtime, root or SQL environment before restart", () => {
    expect(() => assertSite(site)).not.toThrow();
    for (const delta of [
      { id: 1083500 },
      { working_directory: "/home/congofoot/www/tekaedu-prod" },
      { command: "npm start" },
      { nodejs_version: "24" },
      { addresses: ["tekaedu.tootiye.com"] },
      { addresses: [...site.addresses, "other.example"] },
      { environment: "PGPASSWORD=value" },
      { environment: "NEXT_PUBLIC_SUPABASE_URL=value" },
    ])
      expect(() => assertSite({ ...site, ...delta })).toThrow();
  });
  it("validates site GET before sending only the staging restart POST", async () => {
    vi.stubEnv("ALWAYSDATA_API_TOKEN", "fake-unit-only");
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => site })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetcher);
    await siteAction("restart");
    expect(fetcher.mock.calls.map((call) => call[0])).toEqual([
      "https://api.alwaysdata.com/v1/site/1083502/",
      "https://api.alwaysdata.com/v1/site/1083502/restart/",
    ]);
    expect(fetcher.mock.calls[1]?.[1].method).toBe("POST");
    fetcher
      .mockReset()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...site, id: 1083500 }) });
    await expect(siteAction("restart")).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("exercises archive rejection, immutable releases and A→B→A→B pointers", () => {
    execFileSync("python3", ["-B", "tests/unit/alwaysdata_remote_test.py"], { stdio: "pipe" });
  });
  it("packages traced server/static/media and rejects credential or escaping entries", () => {
    const fixture = mkdtempSync(path.join(os.tmpdir(), "teka-package-"));
    try {
      for (const dir of [".next/standalone", ".next/static", "public", "scripts/alwaysdata"])
        mkdirSync(path.join(fixture, dir), { recursive: true });
      writeFileSync(path.join(fixture, ".next/standalone/server.js"), "// fixture");
      writeFileSync(path.join(fixture, ".next/static/chunk.js"), "// fixture");
      writeFileSync(path.join(fixture, "public/media.svg"), "<svg/>");
      writeFileSync(
        path.join(fixture, "scripts/alwaysdata/runtime.mjs"),
        readFileSync("scripts/alwaysdata/runtime.mjs"),
      );
      const output = path.join(fixture, "output");
      const { archive } = packageRelease(fixture, output, sha);
      expect(JSON.parse(readFileSync(path.join(output, "artifact.json"), "utf8"))).toMatchObject({
        sha,
        sha256: hash(readFileSync(archive)),
      });
      expect(execFileSync("tar", ["-tzf", archive], { encoding: "utf8" })).toContain(
        "./public/media.svg",
      );
      writeFileSync(path.join(fixture, ".next/standalone/.env.local"), "fixture-only");
      expect(() => packageRelease(fixture, path.join(fixture, "forbidden"), sha)).toThrow(
        "Forbidden",
      );
      rmSync(path.join(fixture, ".next/standalone/.env.local"));
      writeFileSync(path.join(fixture, "outside"), "fixture-only");
      symlinkSync(path.join(fixture, "outside"), path.join(fixture, ".next/standalone/link"));
      expect(() => packageRelease(fixture, path.join(fixture, "escaping"), sha)).toThrow(
        "Escaping",
      );
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });
});
