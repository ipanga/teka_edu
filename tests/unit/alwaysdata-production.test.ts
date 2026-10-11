import { afterEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  assertProductionDeploymentConfig,
  readProductionDatabaseGate,
  validateProductionDatabaseGate,
} from "../../scripts/alwaysdata/preflight.mjs";
import {
  assertHealth,
  assertSite,
  siteAction,
  waitHealth,
} from "../../scripts/alwaysdata/site.mjs";
import {
  deploymentTarget,
  releaseMetadata,
  SITE_COMMAND,
} from "../../scripts/alwaysdata/targets.mjs";
import { hash, packageRelease } from "../../scripts/alwaysdata/package.mjs";

const sha = "c".repeat(40);
const now = Date.parse("2026-10-11T10:00:00Z");
const receipt = () => ({
  status: "PASS",
  target: "production",
  release_sha: sha,
  recorded_at: new Date(now - 1000).toISOString(),
  identity: {
    database: "congofoot_teka_edu_prod",
    login: "congofoot_user_teka_edu_prod",
    version: 160015,
    tls: true,
  },
  history: 46,
  pending: 0,
  canonical: { tables: 36, rows: 6170, exact: true },
  schema_baseline_comparison: true,
  gates: { access: true, integrity: true, idempotency: true },
  recovery: {
    source_sha256: "a".repeat(64),
    independent_sha256: "a".repeat(64),
    source_restore_verified: true,
    target_snapshot_sha256: "b".repeat(64),
  },
});
const activation = {
  GITHUB_EVENT_NAME: "workflow_dispatch",
  GITHUB_REF: "refs/heads/main",
  GITHUB_SHA: sha,
  TEKA_RELEASE_SHA: sha,
  ALWAYSDATA_PRODUCTION_DEPLOY_ENABLED: "true",
  ALWAYSDATA_PRODUCTION_OWNER_CONFIRMATION: `DEPLOY ${sha}`,
  ALWAYSDATA_PRODUCTION_QUIESCENCE_CONFIRMED: "true",
  ALWAYSDATA_SSH_HOST: "ssh-congofoot.alwaysdata.net",
  ALWAYSDATA_SSH_PORT: "22",
  ALWAYSDATA_SSH_USER: "congofoot",
};
const site = {
  id: 1083500,
  type: "nodejs",
  nodejs_version: "22",
  addresses: ["tekaedu.tootiye.com/"],
  working_directory: "/home/congofoot/www/tekaedu-prod",
  command: SITE_COMMAND,
  environment: "",
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("production app target isolation", () => {
  it("allows exactly two fixed identities and preserves the staging default", () => {
    expect(deploymentTarget()).toMatchObject({ siteId: 1083502, environment: "staging" });
    expect(deploymentTarget("production")).toMatchObject({
      siteId: 1083500,
      root: "/home/congofoot/www/tekaedu-prod",
      url: "https://tekaedu.tootiye.com",
    });
    for (const name of ["prod", "local", "__proto__", "constructor", "https://other.example"])
      expect(() => deploymentTarget(name)).toThrow();
    expect(() => assertSite(site, "production")).not.toThrow();
    expect(() => assertSite(site)).toThrow();
    for (const delta of [
      { id: 1083502 },
      { addresses: ["staging-tekaedu.tootiye.com"] },
      { working_directory: "/home/congofoot/www/tekaedu-staging" },
      { nodejs_version: "24" },
      { command: "npm start" },
      { environment: "PGPASSWORD=unit-private-value" },
      { environment: "NEXT_PUBLIC_SUPABASE_URL=unit-private-value" },
    ])
      expect(() => assertSite({ ...site, ...delta }, "production")).toThrow();
  });

  it("uses only the exact production GET and one restart POST, with no POST retry", async () => {
    vi.stubEnv("ALWAYSDATA_API_TOKEN", "unit-private-token");
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(site)))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    await expect(siteAction("restart", { targetName: "production", fetcher })).rejects.toThrow(
      "RESTART_NOT_CONFIRMED",
    );
    expect(fetcher.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ["https://api.alwaysdata.com/v1/site/1083500/", "GET"],
      ["https://api.alwaysdata.com/v1/site/1083500/restart/", "POST"],
    ]);
    fetcher.mockReset().mockResolvedValue(new Response(JSON.stringify({ ...site, id: 1083502 })));
    await expect(siteAction("restart", { targetName: "production", fetcher })).rejects.toThrow(
      "SITE_IDENTITY_INVALID",
    );
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("requires production, exact SHA, null project ref and the fixed production health URL", async () => {
    const body = { status: "ok", environment: "production", commit: sha, supabaseProjectRef: null };
    expect(() => assertHealth(body, sha, "production")).not.toThrow();
    for (const delta of [
      { environment: "staging" },
      { commit: "d".repeat(40) },
      { commit: null },
      { status: "bad" },
      { supabaseProjectRef: "unit-unexpected-project" },
    ])
      expect(() => assertHealth({ ...body, ...delta }, sha, "production")).toThrow();
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(body)));
    vi.stubGlobal("fetch", fetcher);
    await waitHealth(sha, 1, "production");
    expect(fetcher.mock.calls[0]![0]).toBe(`https://tekaedu.tootiye.com/api/health?release=${sha}`);
    expect(fetcher.mock.calls[0]![1].redirect).toBe("error");
  });
});

describe("completed production DB and recovery receipt", () => {
  it("accepts a matching completed receipt for at most 24 hours", () => {
    expect(validateProductionDatabaseGate(receipt(), sha, now).status).toBe("PASS");
    expect(() =>
      validateProductionDatabaseGate(
        { ...receipt(), recorded_at: new Date(now - 86400000).toISOString() },
        sha,
        now,
      ),
    ).not.toThrow();
  });

  it("rejects stale, future, wrong-environment, incomplete, or unverified receipts", () => {
    const valid = receipt();
    const deltas = [
      { status: "NOT PROVED" },
      { target: "staging" },
      { release_sha: "d".repeat(40) },
      { recorded_at: new Date(now - 86400001).toISOString() },
      { recorded_at: new Date(now + 1).toISOString() },
      { recorded_at: "invalid" },
      { identity: { ...valid.identity, database: "congofoot_teka_edu_dev" } },
      { identity: { ...valid.identity, login: "congofoot_user_teka_edu_dev" } },
      { identity: { ...valid.identity, version: 150015 } },
      { identity: { ...valid.identity, tls: false } },
      { history: 45 },
      { pending: 1 },
      { canonical: { ...valid.canonical, tables: 0 } },
      { canonical: { ...valid.canonical, rows: 0 } },
      { canonical: { ...valid.canonical, exact: false } },
      { schema_baseline_comparison: false },
      ...["access", "integrity", "idempotency"].map((key) => ({
        gates: { ...valid.gates, [key]: false },
      })),
      { recovery: { ...valid.recovery, independent_sha256: "d".repeat(64) } },
      { recovery: { ...valid.recovery, source_restore_verified: false } },
      { recovery: { ...valid.recovery, target_snapshot_sha256: "not-a-checksum" } },
      { recovery: undefined },
    ];
    for (const delta of deltas)
      expect(() => validateProductionDatabaseGate({ ...valid, ...delta }, sha, now)).toThrow(
        "Completed production DB verification and recovery receipt required",
      );
  });

  it("pins the exact protected receipt bytes and suppresses malformed file contents", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "teka-prod-gate-"));
    const file = path.join(directory, "receipt.json");
    try {
      const bytes = JSON.stringify(receipt()) + "\n";
      writeFileSync(file, bytes);
      expect(readProductionDatabaseGate(file, hash(bytes), sha, now).status).toBe("PASS");
      expect(() => readProductionDatabaseGate(file, "0".repeat(64), sha, now)).toThrow(
        "checksum invalid",
      );
      writeFileSync(file, "unit-private-malformed-receipt");
      expect(() => readProductionDatabaseGate(file, hash(readFileSync(file)), sha, now)).toThrow(
        "Production DB receipt file or checksum invalid",
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("requires manual main, the new opt-in, exact SHA, owner confirmation and quiescence", () => {
    expect(() => assertProductionDeploymentConfig(activation)).not.toThrow();
    for (const delta of [
      { GITHUB_EVENT_NAME: "push" },
      { GITHUB_REF: "refs/heads/develop" },
      { GITHUB_SHA: "c".repeat(7) },
      { TEKA_RELEASE_SHA: "d".repeat(40) },
      { ALWAYSDATA_PRODUCTION_DEPLOY_ENABLED: "" },
      { ALWAYSDATA_PRODUCTION_OWNER_CONFIRMATION: "DEPLOY" },
      { ALWAYSDATA_PRODUCTION_QUIESCENCE_CONFIRMED: "false" },
      { ALWAYSDATA_SSH_HOST: "other.example" },
      { PGPASSWORD: "unit-private-password" },
      { SUPABASE_ACCESS_TOKEN: "unit-private-token" },
    ])
      expect(() => assertProductionDeploymentConfig({ ...activation, ...delta })).toThrow();
    expect(() =>
      assertProductionDeploymentConfig({
        ...activation,
        PRODUCTION_DEPLOY_ENABLED: "true",
        ALWAYSDATA_PRODUCTION_DEPLOY_ENABLED: "false",
      }),
    ).toThrow();
  });
});

describe("production immutable artifact and offline app deployment", () => {
  it("packages allowlisted production release metadata and target runtime support", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "teka-prod-package-"));
    try {
      for (const folder of [".next/standalone", ".next/static", "public", "scripts/alwaysdata"])
        mkdirSync(path.join(directory, folder), { recursive: true });
      writeFileSync(path.join(directory, ".next/standalone/server.js"), "// unit fixture");
      writeFileSync(path.join(directory, "public/media.svg"), "<svg/>");
      cpSync(
        "scripts/alwaysdata/runtime.mjs",
        path.join(directory, "scripts/alwaysdata/runtime.mjs"),
      );
      const { archive } = packageRelease(
        directory,
        path.join(directory, "output"),
        sha,
        "production",
      );
      const metadata = JSON.parse(
        execFileSync("tar", ["-xOf", archive, "./release.json"], { encoding: "utf8" }),
      );
      expect(metadata).toEqual(releaseMetadata(sha, "production"));
      expect(execFileSync("tar", ["-tzf", archive], { encoding: "utf8" })).toContain(
        "./targets.mjs",
      );
      expect(() =>
        packageRelease(directory, path.join(directory, "invalid"), sha, "prod"),
      ).toThrow();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("starts the production runtime from release metadata and rejects a database env or swapped URL", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "teka-prod-runtime-"));
    try {
      for (const file of ["runtime.mjs", "targets.mjs"])
        cpSync(`scripts/alwaysdata/${file}`, path.join(directory, file));
      writeFileSync(
        path.join(directory, "release.json"),
        JSON.stringify(releaseMetadata(sha, "production")),
      );
      writeFileSync(
        path.join(directory, "server.js"),
        "process.stdout.write(JSON.stringify({environment:process.env.NEXT_PUBLIC_APP_ENV,url:process.env.NEXT_PUBLIC_APP_URL,sha:process.env.NEXT_PUBLIC_GIT_SHA,sync:process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC}));",
      );
      const args = [
        "--import",
        'data:text/javascript,Object.defineProperty(process.versions,"node",{value:"22.22.2"})',
        path.join(directory, "runtime.mjs"),
      ];
      const env = {
        NODE_ENV: "test" as const,
        PATH: process.env.PATH,
        IP: "127.0.0.1",
        PORT: "3097",
      };
      expect(
        JSON.parse(execFileSync(process.execPath, args, { env, encoding: "utf8", stdio: "pipe" })),
      ).toEqual({
        environment: "production",
        url: "https://tekaedu.tootiye.com",
        sha,
        sync: "false",
      });
      for (const name of [
        "PGPASSWORD",
        "DATABASE_URL",
        "SUPABASE_SECRET_KEY",
        "NEXT_PUBLIC_SUPABASE_URL",
      ])
        expect(() =>
          execFileSync(process.execPath, args, {
            env: { ...env, [name]: "unit-private-sentinel" },
            stdio: "pipe",
          }),
        ).toThrow();
      writeFileSync(
        path.join(directory, "release.json"),
        JSON.stringify({
          ...releaseMetadata(sha, "production"),
          url: "https://staging-tekaedu.tootiye.com",
        }),
      );
      expect(() => execFileSync(process.execPath, args, { env, stdio: "pipe" })).toThrow();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("keeps the production workflow manual, protected, application-only and isolated from legacy switches", () => {
    const workflow = readFileSync(".github/workflows/deploy-alwaysdata-production.yml", "utf8");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toMatch(/^\s+(push|pull_request|workflow_call):/m);
    expect(workflow).toContain("name: production");
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow).toContain("uses: ./.github/workflows/ci.yml");
    expect(workflow).toContain("cancel-in-progress: false");
    expect(workflow).toContain("secrets.ALWAYSDATA_PRODUCTION_DB_VERIFICATION");
    expect(workflow).not.toMatch(
      /secrets\.(?:PGPASSWORD|SUPABASE|DATABASE|ALWAYSDATA_PROD_PGPASSWORD)|db:migrate|db push|db-stage\.mjs|vars\.PRODUCTION_DEPLOY_ENABLED|contents: write/,
    );
    expect(workflow).toContain("bash scripts/alwaysdata/deploy.sh production");
  });

  it("initializes runner paths in a deploy step without forbidden job env contexts", () => {
    // Parse the actual YAML using the parser already bundled with ESLint.
    const workflow = JSON.parse(
      execFileSync(
        process.execPath,
        [
          "node_modules/js-yaml/bin/js-yaml.js",
          ".github/workflows/deploy-alwaysdata-production.yml",
        ],
        { encoding: "utf8", stdio: "pipe" },
      ),
    ) as {
      on: Record<string, unknown>;
      jobs: Record<
        string,
        {
          env?: Record<string, string>;
          if?: string;
          environment?: { name: string };
          steps?: { name?: string; run?: string }[];
        }
      >;
    };
    expect(Object.keys(workflow.on)).toEqual(["workflow_dispatch"]);
    for (const job of Object.values(workflow.jobs))
      expect(JSON.stringify(job.env ?? {})).not.toMatch(/\$\{\{\s*runner(?:\.|\[)/);
    const deploy = workflow.jobs.deploy!;
    expect(deploy.if).toContain("github.event_name == 'workflow_dispatch'");
    expect(deploy.if).toContain("github.ref == 'refs/heads/main'");
    expect(deploy.environment?.name).toBe("production");
    const initialization = deploy.steps?.[0];
    expect(initialization?.name).toBe("Prepare deployment paths");
    expect(initialization?.run).toBeTypeOf("string");
    const directory = mkdtempSync(path.join(tmpdir(), "teka workflow paths "));
    const envFile = path.join(directory, "github-env");
    try {
      execFileSync("/bin/bash", ["-euo", "pipefail", "-c", initialization!.run!], {
        env: { NODE_ENV: "test", RUNNER_TEMP: directory, GITHUB_ENV: envFile },
        stdio: "pipe",
      });
      expect(readFileSync(envFile, "utf8").trim().split("\n")).toEqual([
        `PRODUCTION_DB_GATE_FILE=${directory}/production-db-verification.json`,
        `ARTIFACT_DIR=${directory}/alwaysdata-production-artifact`,
        `EVIDENCE_DIR=${directory}/alwaysdata-production-evidence`,
      ]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("accepts a healthy first production release without forced rollback or any live service calls", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "teka-prod-deploy-"));
    const quote = (value: string) => "'" + value.replaceAll("'", "'\\''") + "'";
    try {
      const log = path.join(directory, "calls");
      const bin = path.join(directory, "bin");
      mkdirSync(bin);
      const fake = (name: string, code: string) =>
        writeFileSync(path.join(bin, name), "#!/bin/bash\nset -euo pipefail\n" + code + "\n", {
          mode: 0o755,
        });
      fake(
        "node",
        `if [[ "\${1:-}" == scripts/alwaysdata/site.mjs ]]; then printf '%s\\n' "$*" >> "$OFFLINE_CALL_LOG"; exit 0; fi\nexec ${quote(process.execPath)} "$@"`,
      );
      fake("git", `printf '%s\\n' "$GITHUB_SHA"`);
      fake("ssh-keygen", `exit 0`);
      fake("scp", `printf 'scp %s\\n' "$*" >> "$OFFLINE_CALL_LOG"`);
      fake(
        "ssh",
        `printf 'ssh %s\\n' "$*" >> "$OFFLINE_CALL_LOG"\nif [[ "$*" == *' inspect --target production'* ]]; then printf '{"sha":null}\\n'; fi`,
      );
      fake("npm", `printf 'npm %s\\n' "$*" >> "$OFFLINE_CALL_LOG"`);
      const report = { ...receipt(), recorded_at: new Date().toISOString() };
      const bytes = JSON.stringify(report);
      const gateFile = path.join(directory, "receipt.json");
      writeFileSync(gateFile, bytes);
      const artifact = path.join(directory, "artifact");
      mkdirSync(artifact);
      writeFileSync(path.join(artifact, "release.tar.gz"), "offline archive fixture");
      const checksum = hash(readFileSync(path.join(artifact, "release.tar.gz")));
      writeFileSync(
        path.join(artifact, "artifact.json"),
        JSON.stringify({ sha, sha256: checksum }),
      );
      const evidence = path.join(directory, "evidence");
      const env = {
        NODE_ENV: "test" as const,
        ...activation,
        PATH: bin + path.delimiter + (process.env.PATH ?? ""),
        OFFLINE_CALL_LOG: log,
        PRODUCTION_DB_GATE_FILE: gateFile,
        PRODUCTION_DB_GATE_SHA256: hash(bytes),
        ALWAYSDATA_SSH_PRIVATE_KEY: "unit-private-key",
        ALWAYSDATA_SSH_KNOWN_HOSTS: "unit-pinned-host",
        ALWAYSDATA_API_TOKEN: "unit-private-token",
        ARTIFACT_DIR: artifact,
        EVIDENCE_DIR: evidence,
      };
      const output = execFileSync("/bin/bash", ["scripts/alwaysdata/deploy.sh", "production"], {
        env,
        encoding: "utf8",
        stdio: "pipe",
      });
      expect(output).toContain("healthy production application release; rollback NOT PROVED");
      const calls = readFileSync(log, "utf8");
      expect(calls.match(/site\.mjs restart --target production/g)).toHaveLength(1);
      expect(calls.match(/remote\.py' switch --target production/g)).toHaveLength(1);
      expect(calls).not.toMatch(/db\.mjs|tools\.tar|psql|staging|PGPASSWORD/);
      expect(
        JSON.parse(readFileSync(path.join(evidence, "application-release.json"), "utf8")),
      ).toMatchObject({
        status: "PASS",
        target: "production",
        previous: null,
        rollback: "NOT PROVED",
        artifact_sha256: checksum,
      });
      // A stale receipt fails before any mocked provider operation.
      writeFileSync(log, "");
      writeFileSync(gateFile, JSON.stringify({ ...report, release_sha: "d".repeat(40) }));
      expect(() =>
        execFileSync("/bin/bash", ["scripts/alwaysdata/deploy.sh", "production"], {
          env: { ...env, PRODUCTION_DB_GATE_SHA256: hash(readFileSync(gateFile)) },
          stdio: "pipe",
        }),
      ).toThrow();
      expect(readFileSync(log, "utf8")).toBe("");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
