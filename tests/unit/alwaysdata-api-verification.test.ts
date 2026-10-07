import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  runApiVerification,
  formatApiVerificationFailure,
} from "../../scripts/alwaysdata/verify-api.mjs";

const env: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  GITHUB_REF: "refs/heads/develop",
  GITHUB_EVENT_NAME: "workflow_dispatch",
  ALWAYSDATA_STAGING_DEPLOY_ENABLED: "false",
  API_VERIFICATION_READ_ONLY_ACK: "true",
  DIAGNOSTIC_READ_ONLY: "true",
  DIAGNOSTIC_ALLOW_DEPLOYMENT: "false",
  ALWAYSDATA_API_TOKEN: "fake-unit-only",
};

describe("prepared authenticated read-only API verification", () => {
  it.each([
    { ALWAYSDATA_STAGING_DEPLOY_ENABLED: "true" },
    { ALWAYSDATA_STAGING_DEPLOY_ENABLED: "unexpected" },
    { GITHUB_REF: "refs/heads/main" },
    { GITHUB_REF: "refs/heads/codex/diagnostic" },
    { GITHUB_EVENT_NAME: "pull_request" },
    { API_VERIFICATION_READ_ONLY_ACK: "false" },
    { API_VERIFICATION_READ_ONLY_ACK: undefined },
    { DIAGNOSTIC_ALLOW_DEPLOYMENT: "true" },
    { NODE_TLS_REJECT_UNAUTHORIZED: "0" },
    { ALWAYSDATA_API_TOKEN: undefined },
  ])("rejects unsafe input before accessing the inspector: %#", async (delta) => {
    const inspect = vi.fn(async () => ({ http_status: 200, attempts: 1 }));
    await expect(runApiVerification({ env: { ...env, ...delta }, inspect })).rejects.toThrow(
      /^API_VERIFICATION_/,
    );
    expect(inspect).not.toHaveBeenCalled();
  });

  it.each(["false", "", undefined])(
    "allows only inspect under the disabled switch (%s)",
    async (value) => {
      const inspect = vi.fn(async () => ({ http_status: 200, attempts: 1 }));
      const result = await runApiVerification({
        env: { ...env, ALWAYSDATA_STAGING_DEPLOY_ENABLED: value },
        inspect,
      });
      expect(inspect).toHaveBeenCalledExactlyOnceWith("inspect");
      expect(result).toMatchObject({
        verification: "READ_ONLY",
        authentication: "PASS",
        http_status: 200,
        attempts: 1,
        site_identity: "PASS",
        site_id: 1083502,
        account: "congofoot",
        restart: "NOT ATTEMPTED",
        provider_mutations: 0,
        database_connections: 0,
      });
      expect(JSON.stringify(result)).not.toContain("fake-unit-only");
    },
  );

  it("does not suppress identity errors, retry inspection or expose arbitrary errors", async () => {
    const inspect = vi.fn(async () => {
      throw new Error("fake-unit-only Authorization: private");
    });
    await expect(runApiVerification({ env, inspect })).rejects.toThrow();
    expect(inspect).toHaveBeenCalledOnce();
    expect(formatApiVerificationFailure(new Error("fake-unit-only Authorization: private"))).toBe(
      "STAGING_ACTION_FAILED",
    );
    expect(formatApiVerificationFailure(new Error("API_VERIFICATION_SWITCH_ENABLED"))).toBe(
      "API_VERIFICATION_SWITCH_ENABLED",
    );
  });

  it("keeps the actual switch guard before staging Environment access and passes only the API secret", () => {
    const workflow = readFileSync(".github/workflows/verify-alwaysdata-api.yml", "utf8");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toMatch(
      /pull_request:|push:|pull_request_target|deploy\.sh|PGPASSWORD|SSH_PRIVATE_KEY|DEV_PGPASSWORD/,
    );
    expect(workflow).toContain(
      "ALWAYSDATA_STAGING_DEPLOY_ENABLED: ${{ vars.ALWAYSDATA_STAGING_DEPLOY_ENABLED }}",
    );
    expect(workflow).toContain("needs: disabled");
    expect(workflow).toContain("environment: staging");
    expect(workflow).toContain("verify-api.mjs guard");
    expect(workflow).toContain("verify-api.mjs inspect");
    expect(workflow.match(/secrets\.[A-Z_]+/g)).toEqual(["secrets.ALWAYSDATA_API_TOKEN"]);
    expect(workflow.indexOf("verify-api.mjs guard")).toBeLessThan(
      workflow.indexOf("environment: staging"),
    );
  });
});
