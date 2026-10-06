import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  assertPreflightConfig,
  inspectPreflightApi,
  validatePreflightSite,
  validateReadOnlyDatabase,
  sshArguments,
  digest,
} from "../../scripts/alwaysdata/preflight.mjs";
import { readOnlyPayload } from "../../scripts/alwaysdata/preflight-sql";
// Scan executable tokens, excluding SQL literals/comments, independently of the helper.
const executableSql = (sql: string) =>
  sql.replace(
    /--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:""|[^"])*"|\$([a-z_][a-z_0-9]*|)\$[\s\S]*?\$\1\$/gi,
    (token) => " ".repeat(token.length),
  );

const env = {
  ALWAYSDATA_STAGING_DEPLOY_ENABLED: "",
  ALWAYSDATA_DEV_MIGRATIONS_APPROVED: "true",
  ALWAYSDATA_SSH_HOST: "ssh-congofoot.alwaysdata.net",
  ALWAYSDATA_SSH_PORT: "22",
  ALWAYSDATA_SSH_USER: "congofoot",
  ALWAYSDATA_SSH_PRIVATE_KEY: "fixture-key",
  ALWAYSDATA_SSH_KNOWN_HOSTS: "fixture-pin",
  ALWAYSDATA_API_TOKEN: "fixture-token",
  ALWAYSDATA_DEV_PGPASSWORD: "fixture-password",
};
const site = {
  id: 1083502,
  type: "nodejs",
  nodejs_version: "22",
  addresses: ["staging-tekaedu.tootiye.com"],
  working_directory: "/home/congofoot/www/tekaedu-staging",
  command: "/usr/alwaysdata/nodejs/22/bin/node current/runtime.mjs",
  environment: "",
};
describe("verification-only alwaysdata preflight", () => {
  it("refuses activation, target substitutions, missing approval and absent secrets", () => {
    expect(() => assertPreflightConfig(env)).not.toThrow();
    expect(() =>
      assertPreflightConfig({ ...env, ALWAYSDATA_STAGING_DEPLOY_ENABLED: "false" }),
    ).not.toThrow();
    for (const delta of [
      { ALWAYSDATA_STAGING_DEPLOY_ENABLED: "true" },
      { ALWAYSDATA_SSH_HOST: "other.example" },
      { ALWAYSDATA_SSH_PORT: "2222" },
      { ALWAYSDATA_SSH_USER: "root" },
      { ALWAYSDATA_DEV_MIGRATIONS_APPROVED: "false" },
      { ALWAYSDATA_API_TOKEN: "" },
    ])
      expect(() => assertPreflightConfig({ ...env, ...delta })).toThrow();
  });
  it("rejects live site mismatch and forbidden assignments without echoing credential values", () => {
    expect(() => validatePreflightSite(site)).not.toThrow();
    for (const delta of [
      { id: 1083500 },
      { type: "php" },
      { nodejs_version: "24" },
      { addresses: ["tekaedu.tootiye.com"] },
      { working_directory: "/home/congofoot/www/tekaedu-prod" },
      { command: "token-secret-fixture" },
      { environment: "PGPASSWORD=token-secret-fixture" },
      { environment: "VERCEL_TOKEN=token-secret-fixture" },
      { environment: "NEXT_PUBLIC_SUPABASE_URL=token-secret-fixture" },
    ]) {
      expect(() => validatePreflightSite({ ...site, ...delta })).toThrow();
      try {
        validatePreflightSite({ ...site, ...delta });
      } catch (e) {
        expect(String(e)).not.toContain("token-secret-fixture");
      }
    }
  });
  it("accepts the actual provider root-address payload and the no-slash representation", () => {
    const providerSite = {
      id: 1083502,
      type: "nodejs",
      nodejs_version: "22",
      addresses: ["staging-tekaedu.tootiye.com/"],
      working_directory: "www/tekaedu-staging",
      command: "/usr/alwaysdata/nodejs/22/bin/node current/runtime.mjs",
    };
    expect(validatePreflightSite(providerSite).addresses).toEqual(site.addresses);
    expect(validatePreflightSite(site).addresses).toEqual(site.addresses);
  });
  it("rejects non-root identities, malformed or additional addresses and changed commands", () => {
    for (const addresses of [
      ["other.example.com"],
      ["staging-tekaedu.tootiye.com.evil.example"],
      ["staging-tekaedu.tootiye.com/path"],
      ["staging-tekaedu.tootiye.com/path/"],
      ["staging-tekaedu.tootiye.com//"],
      ["staging-tekaedu.tootiye.com?query=1"],
      ["staging-tekaedu.tootiye.com#fragment"],
      ["https://staging-tekaedu.tootiye.com/"],
      ["http://staging-tekaedu.tootiye.com/"],
      ["ftp://staging-tekaedu.tootiye.com/"],
      ["staging-tekaedu.tootiye.com:443/"],
      ["staging-tekaedu.tootiye.com:8080"],
      ["staging-tekaedu.tootiye.com", "other.example.com"],
      ["staging-tekaedu.tootiye.com/", "staging-tekaedu.tootiye.com"],
      [""],
      ["/"],
      [],
      [null],
      null,
      "staging-tekaedu.tootiye.com/",
    ])
      expect(() => validatePreflightSite({ ...site, addresses })).toThrow(/addresses/);
    for (const command of ["npm run start", site.command + " ", site.command + " --port 3000"])
      expect(() =>
        validatePreflightSite({ ...site, addresses: [site.addresses[0] + "/"], command }),
      ).toThrow(/command/);
  });
  it("uses only account/site GETs and does not equate authentication with restart permission", async () => {
    const calls: { url: string; method?: string; redirect?: RequestRedirect }[] = [];
    const fakeFetch = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), method: init?.method, redirect: init?.redirect });
      return new Response(
        JSON.stringify(calls.length === 1 ? [{ id: 1, name: "congofoot" }] : site),
      );
    };
    const result = await inspectPreflightApi("fixture-token", fakeFetch);
    expect(calls).toEqual([
      { url: "https://api.alwaysdata.com/v1/account/", method: "GET", redirect: "error" },
      { url: "https://api.alwaysdata.com/v1/site/1083502/", method: "GET", redirect: "error" },
    ]);
    expect(result.restart_permission).toBe("NOT PROVED");
    calls.length = 0;
    await expect(
      inspectPreflightApi("fixture-token", async () => new Response('{"name":"wrong"}')),
    ).rejects.toThrow();
  });
  it("requires supplied pins and key with no local config, password or forwarding fallback", () => {
    const args = sshArguments("/ephemeral");
    for (const setting of [
      "StrictHostKeyChecking=yes",
      "UserKnownHostsFile=/ephemeral/known_hosts",
      "GlobalKnownHostsFile=/dev/null",
      "IdentitiesOnly=yes",
      "BatchMode=yes",
      "UpdateHostKeys=no",
      "PasswordAuthentication=no",
      "KbdInteractiveAuthentication=no",
      "ClearAllForwardings=yes",
    ])
      expect(args).toContain(setting);
    expect(args.slice(0, 2)).toEqual(["-F", "/dev/null"]);
    expect(args.at(-1)).toBe("congofoot@ssh-congofoot.alwaysdata.net");
  });
  it("generates no DML/DDL and rejects writable identity, history, ACL and canonical drift", async () => {
    const payload = await readOnlyPayload();
    const statements = executableSql(payload.sql)
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    expect(statements[0]).toBe("begin isolation level repeatable read read only");
    expect(statements.at(-1)).toBe("rollback");
    for (const statement of statements)
      expect(statement).toMatch(
        /^(begin isolation level repeatable read read only|set local|select\b|with (actual|objects)\b|rollback$)/i,
      );
    expect(executableSql(payload.sql)).not.toMatch(
      /\b(insert|update|delete|create|alter|drop|grant|revoke|copy|call)\b/i,
    );
    const access = Object.fromEntries(
      [
        "rls",
        "policies",
        "table_privileges",
        "function_privileges",
        "schema_privileges",
        "public_schema_create",
        "cross_environment_isolation",
        "btree_gist",
      ].map((k) => [k, true]),
    );
    const fixtureHistory = Array.from({ length: 46 }, (_, i) => ({
      version: String(i).padStart(14, "0"),
      filename: `fixture-${i}.sql`,
      source_sha256: "a".repeat(64),
      execution_sha256: "b".repeat(64),
      adapter_version: "fixture",
    }));
    const fixtureSchema = { tables: [{ name: "fixture", rls: true }] };
    const expected = {
      ...payload.expected,
      migrations_sha256: digest(fixtureHistory),
      schema_sha256: digest(fixtureSchema),
    };
    const rows = [
      { read_only: "on", isolation: "repeatable read", prod_connect: false },
      {
        version: 160015,
        database: "congofoot_teka_edu_dev",
        login: "congofoot_user_teka_edu_dev",
        tls: true,
        superuser: false,
      },
      fixtureHistory.map((m) => ({
        ...m,
        target: "staging",
        release_sha: "2315600fc0db4bfe67769afb2eb4727983c91bb6",
      })),
      fixtureSchema,
      access,
      [],
      ...payload.expected.counts.map((c) => ({ ...c, exact: true })),
    ];
    expect(validateReadOnlyDatabase(rows, expected).canonical_rows).toBe(6170);
    for (const corrupt of [
      (r: unknown[]) => {
        r[0] = { read_only: "off" };
      },
      (r: unknown[]) => {
        r[2] = [];
      },
      (r: unknown[]) => {
        (r[2] as { source_sha256: string }[])[0]!.source_sha256 = "c".repeat(64);
      },
      (r: unknown[]) => {
        r[3] = { tables: [] };
      },
      (r: unknown[]) => {
        r[4] = { rls: true };
      },
      (r: unknown[]) => {
        r.pop();
      },
    ]) {
      const copy = structuredClone(rows);
      corrupt(copy);
      expect(() => validateReadOnlyDatabase(copy, expected)).toThrow();
    }
  });
  it("keeps the workflow manual, isolated, secret-scoped and without artifact or deploy calls", () => {
    const workflow = readFileSync(".github/workflows/verify-alwaysdata-staging.yml", "utf8");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toMatch(/^\s+(push|pull_request|workflow_call):/m);
    expect(workflow).toContain("environment: staging");
    expect(workflow).toContain("needs: disabled");
    expect(workflow).not.toMatch(
      /upload-artifact|deploy\.sh|db:migrate|scp |rsync |restart\/|contents: write/,
    );
  });
});
