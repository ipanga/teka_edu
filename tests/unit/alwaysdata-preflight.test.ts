import { describe, expect, it, vi } from "vitest";
import { readFileSync, statSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync, type ExecFileSyncOptions } from "node:child_process";
import {
  assertPreflightConfig,
  inspectPreflightApi,
  validatePreflightSite,
  validateReadOnlyDatabase,
  sshArguments,
  digest,
  preflight,
  databaseAuthSql,
  databaseCheck,
  rootCheck,
  validateRootResponse,
  validateDatabaseAuthentication,
  classifySshFailure,
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
const authIdentity = {
  database: "congofoot_teka_edu_dev",
  login: "congofoot_user_teka_edu_dev",
  version: 160015,
  tls: true,
  read_only: "on",
  default_read_only: "on",
  isolation: "repeatable read",
};
const rootIdentity = {
  ok: true,
  identity: "congofoot",
  root: "/home/congofoot/www/tekaedu-staging",
  root_empty: true,
  current_exists: false,
  credential_files: false,
  node: "v22.22.2",
};
// Execute the shipped Python probe with bounded read operations replaced by fixtures.
// No remote paths are inspected and no actual Node subprocess is started by the probe.
const rootProbeHarness = `import json,sys,stat,subprocess
from types import SimpleNamespace
from unittest.mock import MagicMock,patch
from contextlib import ExitStack

fixture=json.load(sys.stdin)
case=fixture['case']
expected='/home/congofoot/www/tekaedu-staging'
node='/usr/alwaysdata/nodejs/22/bin/node'
private='raw-fixture-private-error'
root=MagicMock()
root.__str__.return_value=expected
root.exists.return_value=case!='root_missing'
root.stat.return_value=SimpleNamespace(st_uid=42000,st_mode=stat.S_IFDIR|0o755)
root.is_symlink.return_value=case=='root_symlink'
root.resolve.return_value=expected if case!='root_real_path' else '/arbitrary-private-path'
root.__truediv__.return_value=expected+'/current'
root.iterdir.return_value=iter([private] if case=='root_nonempty' else [])
if case=='root_stat':root.stat.side_effect=OSError(private)
if case=='root_directory':root.stat.return_value.st_mode=stat.S_IFREG|0o644
if case=='root_resolve':root.resolve.side_effect=OSError(private)
if case=='root_list':root.iterdir.side_effect=OSError(private)
if case=='root_owner_stat':
 class UnreadableOwner:
  st_mode=stat.S_IFDIR|0o755
  @property
  def st_uid(self):raise OSError(private)
 root.stat.return_value=UnreadableOwner()

def owner(uid):
 if uid==42000 and case=='root_owner_lookup':raise KeyError(private)
 return SimpleNamespace(pw_name='other-private-owner' if uid==42000 and case=='root_owner_mismatch' else 'congofoot')
def access(path,mode):
 if mode==2:
  assert path is root
  return case!='root_not_writable'
 assert path==node and mode==1
 return case!='node_not_executable'
def execute(args,universal_newlines=False,stderr=None):
 assert args==[node,'--version']
 assert universal_newlines is True and stderr==subprocess.PIPE
 if case=='node_nonzero':raise subprocess.CalledProcessError(1,args,stderr=private)
 if case=='node_spawn_error':raise OSError(private)
 if case=='node_argument_error':raise TypeError(private)
 return 'v24.1.0' if case=='node_version' else 'v22.22.2\\n'

with ExitStack() as stack:
 path=stack.enter_context(patch('pathlib.Path',return_value=root))
 if case=='unexpected':path.side_effect=RuntimeError(private)
 stack.enter_context(patch('os.getuid',return_value=10000))
 stack.enter_context(patch('pwd.getpwuid',side_effect=owner))
 stack.enter_context(patch('os.access',side_effect=access))
 stack.enter_context(patch('os.path.lexists',return_value=case=='current_exists'))
 stack.enter_context(patch('os.path.isfile',return_value=case!='node_missing'))
 stack.enter_context(patch('subprocess.check_output',side_effect=execute))
 try:exec(fixture['program'],{})
 except SystemExit as result:
  assert result.code==0
`;
function executeRootFixture(testCase: string) {
  const stdout = execFileSync("python3", ["-c", rootProbeHarness], {
    input: JSON.stringify({ program: rootCheck, case: testCase }),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  for (const forbidden of [
    "raw-fixture-private-error",
    "arbitrary-private-path",
    "other-private-owner",
    "42000",
    "Traceback",
  ])
    expect(stdout).not.toContain(forbidden);
  return JSON.parse(stdout);
}
describe("executed read-only root/runtime invariants", () => {
  it.each([
    ["root_missing", "ROOT_EXISTS"],
    ["root_stat", "ROOT_STAT"],
    ["root_directory", "ROOT_DIRECTORY"],
    ["root_symlink", "ROOT_SYMLINK"],
    ["root_resolve", "ROOT_RESOLVE"],
    ["root_real_path", "ROOT_REAL_PATH"],
    ["root_owner_stat", "ROOT_OWNER_STAT"],
    ["root_owner_lookup", "ROOT_OWNER_LOOKUP"],
    ["root_owner_mismatch", "ROOT_OWNER_MISMATCH"],
    ["root_not_writable", "ROOT_WRITABLE"],
    ["current_exists", "CURRENT_EXISTS"],
    ["root_list", "ROOT_LIST"],
    ["root_nonempty", "ROOT_EMPTY"],
    ["node_missing", "NODE_FILE"],
    ["node_not_executable", "NODE_EXECUTABLE"],
    ["node_nonzero", "NODE_EXEC"],
    ["node_spawn_error", "NODE_EXEC"],
    ["node_argument_error", "NODE_EXEC"],
    ["node_version", "NODE_VERSION"],
    ["unexpected", "ROOT_UNEXPECTED"],
  ])("maps %s to only %s", (testCase, invariant) => {
    const result = executeRootFixture(testCase);
    expect(result).toEqual({ ok: false, invariant });
    expect(() => validateRootResponse(result)).toThrow(invariant);
  });
  it("executes the successful root/runtime probe with a Python 3.6 subprocess signature", () => {
    const result = executeRootFixture("success");
    expect(result).toEqual(rootIdentity);
    expect(validateRootResponse(result)).toMatchObject({
      identity: rootIdentity.identity,
      root: rootIdentity.root,
      node: rootIdentity.node,
    });
    expect(rootCheck).not.toContain("ROOT_READ");
    expect(rootCheck).not.toMatch(/\b(mkdir|chmod|symlink)\(/);
  });
});
it.each([
  ["success", null],
  ["authentication", "DEV_AUTHENTICATION"],
  ["tls", "DEV_TLS"],
  ["connection", "DEV_CONNECTION"],
  ["query", "DEV_QUERY"],
  ["missing", "PSQL_UNAVAILABLE"],
  ["timeout", "DEV_TIMEOUT"],
  ["unexpected", "DEV_REMOTE_READ"],
])("executes the Python 3.6 DEV transport for %s without starting psql", (testCase, invariant) => {
  // Both text and capture_output were added after Python 3.6. This stub intentionally
  // cannot accept either keyword; the shipped program must work with the old API.
  const harness = `import json,sys,io,subprocess
from types import SimpleNamespace
from unittest.mock import patch
fixture=json.load(sys.stdin)
case=fixture['case']
private='raw-fixture-private-error'
sys.stdin=io.StringIO(json.dumps({'password':'fixture-private-password','sql':'begin read only; select 1; rollback;'}))
def run(args,env=None,input=None,universal_newlines=False,stdout=None,stderr=None,timeout=None):
 assert args==['psql','-X','-qAt','--no-password','-v','ON_ERROR_STOP=1']
 assert universal_newlines is True and stdout==subprocess.PIPE and stderr==subprocess.PIPE
 assert env['PGDATABASE']=='congofoot_teka_edu_dev' and env['PGUSER']=='congofoot_user_teka_edu_dev'
 assert env['PGSSLMODE']=='verify-full' and env['PGOPTIONS']=='-c default_transaction_read_only=on'
 assert env['PGPASSWORD']=='fixture-private-password'
 assert input=='begin read only; select 1; rollback;' and timeout==150
 if case=='missing':raise FileNotFoundError(private)
 if case=='timeout':raise subprocess.TimeoutExpired(args,timeout,output=private,stderr=private)
 if case=='unexpected':raise RuntimeError(private)
 errors={'authentication':'password authentication failed','tls':'SSL error','connection':'Connection refused','query':'query failed'}
 if case in errors:return SimpleNamespace(returncode=1,stdout='private-untrusted-stdout',stderr=errors[case]+' '+private)
 return SimpleNamespace(returncode=0,stdout='1\\n',stderr='')
with patch('subprocess.run',new=run):exec(fixture['program'],{})
`;
  const stdout = execFileSync("python3", ["-c", harness], {
    input: JSON.stringify({ program: databaseCheck, case: testCase }),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  expect(JSON.parse(stdout)).toEqual(
    invariant ? { ok: false, invariant } : { ok: true, rows: ["1"] },
  );
  expect(stdout).not.toContain("fixture-private-password");
  expect(stdout).not.toContain("raw-fixture-private-error");
  expect(stdout).not.toContain("private-untrusted-stdout");
  expect(stdout).not.toContain("Traceback");
});
type DiagnosticEvidence = Awaited<ReturnType<typeof preflight>>;
const diagnosticEnv = {
  NODE_ENV: "test" as const,
  ...env,
  PATH: process.env.PATH,
  GITHUB_SHA: "d".repeat(40),
};
async function diagnosticFixture(stop = "", detail = "") {
  const payload = await readOnlyPayload();
  const history = Array.from({ length: 46 }, (_, i) => ({
    version: String(i).padStart(14, "0"),
    filename: `fixture-${i}.sql`,
    source_sha256: "a".repeat(64),
    execution_sha256: "b".repeat(64),
    adapter_version: "fixture",
  }));
  const schema = { tables: [{ name: "fixture", rls: true }] };
  const expected = {
    ...payload.expected,
    migrations_sha256: digest(history),
    schema_sha256: digest(schema),
  };
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
  const rows = [
    { read_only: "on", isolation: "repeatable read", prod_connect: false },
    { ...authIdentity, superuser: false },
    history.map((h) => ({
      ...h,
      target: "staging",
      release_sha: "2315600fc0db4bfe67769afb2eb4727983c91bb6",
    })),
    schema,
    access,
    [],
    ...payload.expected.counts.map((c) => ({ ...c, exact: true })),
  ];
  const calls: { bin: string; args: string[]; input?: string }[] = [];
  const reports: DiagnosticEvidence[] = [];
  const rawError = Object.assign(new Error("fixture-password raw-provider-secret"), {
    status: 255,
    stderr: detail + " fixture-password",
  });
  const run = (bin: string, args: string[], options: ExecFileSyncOptions) => {
    calls.push({
      bin,
      args,
      input: typeof options?.input === "string" ? options.input : undefined,
    });
    if (bin === "ssh-keygen") {
      if (args.includes("-y")) {
        expect(options.stdio?.[1]).toBe("ignore");
        expect(statSync(args.at(-1)!).mode & 0o777).toBe(0o600);
        if (stop === "key") throw rawError;
        return "derived-public-key-never-print";
      }
      if (args.includes("-F")) {
        if (stop === "pin-entry") throw rawError;
        return "# Host found\nssh-congofoot.alwaysdata.net ssh-ed25519 matching-pin-never-print\n";
      }
      if (stop === "pin-syntax") throw rawError;
      expect(options.stdio?.[1]).toBe("ignore");
      return "fingerprint-never-print";
    }
    if (bin === "ssh") {
      const command = args.at(-1)!;
      if (command === "id -un") {
        if (stop === "auth") throw rawError;
        return stop === "identity" ? "root\n" : "congofoot\n";
      }
      if (command.includes("pathlib"))
        return JSON.stringify(
          stop === "root" ? { ok: false, invariant: detail || "ROOT_EMPTY" } : rootIdentity,
        );
      const input = JSON.parse(options.input as string);
      expect(input.password).toBe("fixture-password");
      expect(args.join(" ")).not.toContain("fixture-password");
      if (input.sql === databaseAuthSql)
        return JSON.stringify(
          stop === "db-auth"
            ? { ok: false, invariant: detail || "DEV_AUTHENTICATION" }
            : { ok: true, rows: [JSON.stringify(authIdentity)] },
        );
      expect(input.sql).toBe(payload.sql);
      const actual = structuredClone(rows);
      if (stop === "full") actual[2] = [];
      return JSON.stringify({ ok: true, rows: actual.map((r) => JSON.stringify(r)) });
    }
    return JSON.stringify({ sql: payload.sql, expected });
  };
  let count = 0;
  const fetcher = async () =>
    new Response(JSON.stringify(++count === 1 ? [{ name: "congofoot" }] : site));
  return { calls, reports, run, fetcher, emit: (r: DiagnosticEvidence) => reports.push(r) };
}
describe("separate sanitized diagnostic phases", () => {
  it("retains all eleven PASS/limit statuses on success and orders minimal auth before full SELECT", async () => {
    const f = await diagnosticFixture();
    const report = await preflight(diagnosticEnv, f);
    expect(Object.keys(report.checks)).toHaveLength(11);
    expect(Object.values(report.checks).slice(0, 10)).toEqual(Array(10).fill("PASS"));
    expect(report.checks.RESTART_PERMISSION).toBe("NOT PROVED");
    expect(f.calls.filter((c) => c.bin === "ssh")).toHaveLength(4);
    expect(f.calls.filter((c) => c.bin === "ssh")[0]!.args.at(-1)).toBe("id -un");
    const queries = f.calls.filter((c) => c.input).map((c) => JSON.parse(c.input!).sql);
    expect(queries[0]).toBe(databaseAuthSql);
    expect(queries[1]).not.toBe(databaseAuthSql);
    expect(report.database?.canonical_rows).toBe(6170);
  });
  it.each([
    ["key", "", "SSH_PRIVATE_KEY_FORMAT", "KEY_FORMAT_OR_PASSPHRASE", 0],
    ["pin-entry", "", "KNOWN_HOSTS_ENTRY", "KNOWN_HOSTS_HOST_ENTRY", 0],
    ["pin-syntax", "", "KNOWN_HOSTS_ENTRY", "KNOWN_HOSTS_SYNTAX", 0],
    ["auth", "Host key verification failed", "SSH_AUTH", "HOST_KEY_VALIDATION", 1],
    ["auth", "Permission denied (publickey)", "SSH_AUTH", "SSH_AUTHENTICATION", 1],
    ["auth", "Connection timed out", "SSH_AUTH", "SSH_CONNECTION", 1],
    ["identity", "", "SSH_AUTH", "LOGIN_IDENTITY", 1],
    ["root", "ROOT_EMPTY", "SSH_ROOT_RUNTIME", "ROOT_EMPTY", 2],
    ["db-auth", "DEV_AUTHENTICATION", "DEV_DB_AUTH_TLS", "DEV_AUTHENTICATION", 3],
    ["db-auth", "DEV_TLS", "DEV_DB_AUTH_TLS", "DEV_TLS", 3],
    ["full", "", "DEV_READONLY_VERIFY", "HISTORY_CHAIN", 4],
  ])(
    "stops %s with its own safe invariant and no later phase",
    async (stop, detail, phase, invariant, sshCalls) => {
      const f = await diagnosticFixture(String(stop), String(detail));
      await expect(preflight(diagnosticEnv, f)).rejects.toThrow(String(invariant));
      const report = f.reports[0]!;
      expect(report.failure).toEqual({ phase, invariant });
      expect(report.checks[phase]).toBe("FAIL");
      expect(report.checks.API_AUTH).toBe("PASS");
      const phases = Object.keys(report.checks).slice(0, 10);
      for (const p of phases.slice(phases.indexOf(String(phase)) + 1))
        expect(report.checks[p]).toBe("NOT REACHED");
      expect(f.calls.filter((c) => c.bin === "ssh")).toHaveLength(Number(sshCalls));
      if (phase !== "DEV_READONLY_VERIFY")
        expect(f.calls.some((c) => c.bin === process.execPath)).toBe(false);
      for (const text of [
        "fixture-password",
        "raw-provider-secret",
        "derived-public-key-never-print",
        "matching-pin-never-print",
        "fingerprint-never-print",
      ])
        expect(JSON.stringify(report)).not.toContain(text);
      const key = f.calls.find((c) => c.bin === "ssh-keygen")!.args.at(-1)!;
      expect(existsSync(dirname(key))).toBe(false);
    },
  );
  it("rejects each minimal DEV identity/TLS/read-only drift before full verification", () => {
    expect(validateDatabaseAuthentication(authIdentity).sslmode).toBe("verify-full");
    for (const delta of [
      { database: "congofoot_teka_edu_prod" },
      { login: "other" },
      { version: 160014 },
      { tls: false },
      { read_only: "off" },
      { default_read_only: "off" },
      { isolation: "read committed" },
    ])
      expect(() => validateDatabaseAuthentication({ ...authIdentity, ...delta })).toThrow();
    expect(executableSql(databaseAuthSql)).not.toMatch(
      /\b(insert|update|delete|create|alter|drop|grant|revoke|copy|call)\b/i,
    );
    expect(databaseAuthSql).toContain("begin isolation level repeatable read read only");
    expect(databaseCheck).toContain("'PGSSLMODE':'verify-full'");
    expect(databaseCheck).toContain("'PGOPTIONS':'-c default_transaction_read_only=on'");
    expect(databaseCheck).not.toContain("congofoot_teka_edu_prod");
    expect(rootCheck).not.toMatch(/\b(mkdir|chmod|symlink)\(/);
    execFileSync(
      "python3",
      [
        "-c",
        "import json,sys;[compile(p,'fixed-read-only-program','exec') for p in json.load(sys.stdin)]",
      ],
      { input: JSON.stringify([rootCheck, databaseCheck]), stdio: ["pipe", "ignore", "pipe"] },
    );
  });
  it("rejects unknown remote diagnostics and arbitrary runtime output", () => {
    expect(() => validateRootResponse({ ok: false, invariant: "raw-provider-secret" })).toThrow(
      "CHECK_FAILED",
    );
    expect(() => validateRootResponse({ ...rootIdentity, node: "raw-provider-secret" })).toThrow(
      "REMOTE_RESPONSE",
    );
    expect(classifySshFailure({ status: 255, stderr: "raw-provider-secret" })).toBe(
      "SSH_TRANSPORT",
    );
  });
  it("writes a partial failure summary without exposing stderr and cleans local keys", async () => {
    const f = await diagnosticFixture("auth", "Permission denied (publickey)");
    const dir = mkdtempSync(join(tmpdir(), "teka-summary-test-"));
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await expect(
        preflight(
          { ...diagnosticEnv, GITHUB_STEP_SUMMARY: join(dir, "summary") },
          { run: f.run, fetcher: f.fetcher },
        ),
      ).rejects.toThrow("SSH_AUTHENTICATION");
      const summary = readFileSync(join(dir, "summary"), "utf8");
      expect(summary).toContain("| SSH_AUTH | FAIL |");
      expect(summary).toContain("| DEV_DB_AUTH_TLS | NOT REACHED |");
      expect(summary).toContain("| RESTART_PERMISSION | NOT PROVED |");
      expect(summary).not.toContain("fixture-password");
      expect(summary).not.toContain("raw-provider-secret");
      expect(spy.mock.calls).toHaveLength(1);
    } finally {
      spy.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it("checks a real local key and only matching host entries with OpenSSH, without network access", async () => {
    const dir = mkdtempSync(join(tmpdir(), "teka-key-test-"));
    try {
      const source = join(dir, "fixture");
      execFileSync("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-f", source], {
        stdio: "ignore",
      });
      const key = readFileSync(source, "utf8");
      const pin = "ssh-congofoot.alwaysdata.net " + readFileSync(source + ".pub", "utf8");
      for (const [privateKey, pins, phase] of [
        [key, pin, "SSH_ROOT_RUNTIME"],
        ["broken-key", pin, "SSH_PRIVATE_KEY_FORMAT"],
        [key, "other.example.com " + readFileSync(source + ".pub", "utf8"), "KNOWN_HOSTS_ENTRY"],
        [key, "ssh-congofoot.alwaysdata.net ssh-ed25519 invalid\n", "KNOWN_HOSTS_ENTRY"],
      ]) {
        const f = await diagnosticFixture("root", "ROOT_EMPTY");
        const mockRun = f.run;
        f.run = (bin, args, options) =>
          bin === "ssh-keygen"
            ? String(execFileSync(bin, args, options) ?? "")
            : mockRun(bin, args, options);
        await expect(
          preflight(
            {
              ...diagnosticEnv,
              ALWAYSDATA_SSH_PRIVATE_KEY: privateKey!,
              ALWAYSDATA_SSH_KNOWN_HOSTS: pins!,
            },
            f,
          ),
        ).rejects.toThrow();
        expect(f.reports[0]!.failure!.phase).toBe(phase);
        expect(JSON.stringify(f.reports[0])).not.toContain(key.trim());
        expect(JSON.stringify(f.reports[0])).not.toContain(pin.trim());
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
