import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import {
  runApiVerification,
  apiVerificationFailure,
  formatApiVerificationFailure,
} from "../../scripts/alwaysdata/verify-api.mjs";
import { inspectApiSite } from "../../scripts/alwaysdata/api-get.mjs";
const env: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  GITHUB_REF: "refs/heads/develop",
  GITHUB_EVENT_NAME: "workflow_dispatch",
  ALWAYSDATA_STAGING_DEPLOY_ENABLED: "false",
  STAGING_DEPLOY_ENABLED: "false",
  PRODUCTION_DEPLOY_ENABLED: "false",
  API_VERIFICATION_READ_ONLY_ACK: "true",
  DIAGNOSTIC_READ_ONLY: "true",
  DIAGNOSTIC_ALLOW_DEPLOYMENT: "false",
  ALWAYSDATA_API_TOKEN: "fake-unit-only",
};
describe("isolated authenticated verification guards and evidence", () => {
  it.each([
    { ALWAYSDATA_STAGING_DEPLOY_ENABLED: "true" },
    { ALWAYSDATA_STAGING_DEPLOY_ENABLED: undefined },
    { STAGING_DEPLOY_ENABLED: "true" },
    { PRODUCTION_DEPLOY_ENABLED: "true" },
    { GITHUB_REF: "refs/heads/main" },
    { GITHUB_REF: "refs/heads/codex/diagnostic" },
    { GITHUB_EVENT_NAME: "pull_request" },
    { API_VERIFICATION_READ_ONLY_ACK: "false" },
    { API_VERIFICATION_READ_ONLY_ACK: undefined },
    { DIAGNOSTIC_ALLOW_DEPLOYMENT: "true" },
    { NODE_TLS_REJECT_UNAUTHORIZED: "0" },
    { NODE_OPTIONS: "--insecure-http-parser" },
    { ALWAYSDATA_API_TOKEN: undefined },
  ])("rejects unsafe configuration before inspection %#", async (delta) => {
    const inspect = vi.fn(async () => ({ http_status: 200, attempts: 1 }));
    await expect(runApiVerification({ env: { ...env, ...delta }, inspect })).rejects.toThrow(
      /^API_VERIFICATION_/,
    );
    expect(inspect).not.toHaveBeenCalled();
  });
  it("uses only the GET inspector and reports independent success fields", async () => {
    const inspect = vi.fn(async () => ({ http_status: 200, attempts: 2 }));
    const result = await runApiVerification({ env, inspect });
    expect(inspect).toHaveBeenCalledExactlyOnceWith({ token: "fake-unit-only" });
    expect(result).toMatchObject({
      activation_guard: "PASS",
      token_access: "PASS",
      authentication: "PASS",
      attempts: 2,
      retries: 1,
      site_identity: "PASS",
      tls_validation: "PASS",
      account: "congofoot",
      restart_post_requests: 0,
      provider_mutations: 0,
      database_connections: 0,
    });
    expect(JSON.stringify(result)).not.toContain("fake-unit-only");
  });
  it("retains HTTP authorization rejection separately from network failures", async () => {
    const http = await inspectApiSite({
      token: "fake-unit-only",
      fetcher: vi.fn().mockResolvedValue(new Response("secret-body", { status: 403 })),
    }).catch((e) => e);
    expect(apiVerificationFailure(http, { guardPassed: true, tokenPresent: true })).toMatchObject({
      activation_guard: "PASS",
      token_access: "PASS",
      authentication: "FAIL",
      classification: "HTTP_AUTHORIZATION_REJECTED",
      http_status: 403,
      attempts: 1,
      tls_validation: "PASS",
      restart_post_requests: 0,
    });
    const network = await inspectApiSite({
      token: "fake-unit-only",
      fetcher: vi
        .fn()
        .mockRejectedValue(Object.assign(new Error("secret-body"), { code: "ENOTFOUND" })),
    }).catch((e) => e);
    expect(
      apiVerificationFailure(network, { guardPassed: true, tokenPresent: true }),
    ).toMatchObject({
      authentication: "NOT PROVED",
      classification: "TRANSPORT_FAILURE",
      attempts: 1,
      http_status: null,
      tls_validation: "NOT PROVED",
    });
    expect(JSON.stringify(apiVerificationFailure(http))).not.toContain("secret-body");
  });
  it("redacts unknown/hostile errors and rejects invalid result metadata", async () => {
    expect(formatApiVerificationFailure(new Error("fake-unit-only Authorization: private"))).toBe(
      "API_VERIFICATION_FAILED",
    );
    const hostile = Object.create(null);
    Object.defineProperty(hostile, "message", {
      get() {
        throw new Error("fake-unit-only");
      },
    });
    expect(formatApiVerificationFailure(hostile)).toBe("API_VERIFICATION_FAILED");
    const inspect = vi.fn(async () => ({ http_status: 200, attempts: 4 }));
    await expect(runApiVerification({ env, inspect })).rejects.toThrow(
      "API_VERIFICATION_RESULT_INVALID",
    );
  });
  it("keeps the actual switches before Environment access and passes only the API secret", () => {
    const workflow = readFileSync(".github/workflows/verify-alwaysdata-api.yml", "utf8");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toMatch(
      /pull_request:|push:|pull_request_target|deploy\.sh|PGPASSWORD|SSH_PRIVATE_KEY|DEV_PGPASSWORD/,
    );
    for (const name of [
      "ALWAYSDATA_STAGING_DEPLOY_ENABLED",
      "STAGING_DEPLOY_ENABLED",
      "PRODUCTION_DEPLOY_ENABLED",
    ])
      expect(workflow).toContain(name + ": ${{ vars." + name + " }}");
    expect(workflow).toContain("needs: disabled");
    expect(workflow).toContain("environment: staging");
    expect(workflow.match(/secrets\.[A-Z_]+/g)).toEqual(["secrets.ALWAYSDATA_API_TOKEN"]);
    expect(workflow.indexOf("verify-api.mjs guard")).toBeLessThan(
      workflow.indexOf("environment: staging"),
    );
    expect(readFileSync("scripts/alwaysdata/verify-api.mjs", "utf8")).not.toContain(
      'from "./site.mjs"',
    );
    expect(readFileSync("scripts/alwaysdata/api-get.mjs", "utf8")).not.toMatch(
      /method:\s*["']POST["']|restart\//,
    );
  });
  it.each(["restart", "inspect extra"])(
    "rejects unsupported CLI input %s without printing a secret",
    (action) => {
      const result = spawnSync(
        process.execPath,
        ["scripts/alwaysdata/verify-api.mjs", ...action.split(" ")],
        { encoding: "utf8", env: { ...process.env, ...env } },
      );
      expect(result.status).toBe(1);
      expect(JSON.parse(result.stdout)).toMatchObject({
        code: "API_VERIFICATION_ACTION_DENIED",
        restart_post_requests: 0,
        provider_mutations: 0,
      });
      expect(result.stdout + result.stderr).not.toContain("fake-unit-only");
    },
  );
});
