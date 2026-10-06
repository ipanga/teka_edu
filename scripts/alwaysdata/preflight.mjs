import { mkdtempSync, writeFileSync, rmSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const normalize = (v) =>
  Array.isArray(v)
    ? v.map(normalize)
    : v !== null && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([k, x]) => [k, normalize(x)]),
        )
      : v;
export const digest = (v) =>
  createHash("sha256")
    .update(JSON.stringify(normalize(v)))
    .digest("hex");

const secretNames = [
  "ALWAYSDATA_SSH_PRIVATE_KEY",
  "ALWAYSDATA_SSH_KNOWN_HOSTS",
  "ALWAYSDATA_API_TOKEN",
  "ALWAYSDATA_DEV_PGPASSWORD",
];
export function assertPreflightConfig(env) {
  if (!["", "false"].includes(env.ALWAYSDATA_STAGING_DEPLOY_ENABLED ?? ""))
    throw new Error("Deployment switch must be unset or false");
  for (const [name, value] of Object.entries({
    ALWAYSDATA_SSH_HOST: "ssh-congofoot.alwaysdata.net",
    ALWAYSDATA_SSH_PORT: "22",
    ALWAYSDATA_SSH_USER: "congofoot",
    ALWAYSDATA_DEV_MIGRATIONS_APPROVED: "true",
  }))
    if (env[name] !== value) throw new Error(`Configuration mismatch: ${name}`);
  for (const name of secretNames)
    if (!env[name]?.trim()) throw new Error(`Missing secret: ${name}`);
}
export function validatePreflightSiteConfig(site) {
  const expected = {
    id: 1083502,
    type: "nodejs",
    nodejs_version: "22",
    addresses: ["staging-tekaedu.tootiye.com"],
    working_directory: "www/tekaedu-staging",
    command: "/usr/alwaysdata/nodejs/22/bin/node current/runtime.mjs",
  };
  const actual = {
    ...site,
    nodejs_version: String(site.nodejs_version),
    // Alwaysdata serializes a root address with a trailing slash. Remove only that
    // single terminal slash; exact comparison still rejects schemes, ports and paths.
    addresses: Array.isArray(site.addresses)
      ? site.addresses.map((address) =>
          typeof address === "string" ? address.replace(/\/$/, "") : address,
        )
      : site.addresses,
    working_directory: (site.working_directory ?? "")
      .replace(/^\/home\/congofoot\//, "")
      .replace(/\/$/, ""),
  };
  const mismatches = Object.keys(expected).filter(
    (key) => !isDeepStrictEqual(actual[key], expected[key]),
  );
  // Report field names only: a malformed command/field could itself contain a credential.
  if (mismatches.length)
    throw new Error(`Site 1083502 fields differ from expected values: ${mismatches.join(", ")}`);
  return expected;
}
export function validatePreflightSiteEnvironment(site) {
  if (typeof site.environment !== "string" && site.environment != null)
    throw new Error("Unexpected site environment representation");
  if (/\b(PG\w*|\w*DATABASE_URL|\w*SUPABASE\w*|\w*VERCEL\w*)\s*=/i.test(site.environment ?? ""))
    throw new Error(
      "Forbidden DB/Supabase/Vercel assignment in site environment (values suppressed)",
    );
  return true;
}
export function validatePreflightSite(site) {
  const expected = validatePreflightSiteConfig(site);
  validatePreflightSiteEnvironment(site);
  return expected;
}
export async function inspectPreflightApi(
  token,
  fetcher = fetch,
  check = async (_name, action) => action(),
) {
  const headers = {
    Authorization: "Basic " + Buffer.from(`${token} account=congofoot:`).toString("base64"),
  };
  async function get(path) {
    let response;
    try {
      response = await fetcher(`https://api.alwaysdata.com/v1/${path}`, {
        method: "GET",
        headers,
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new Error(`API GET ${path}: connection failed (diagnostics suppressed)`);
    }
    if (!response.ok) throw new Error(`API GET ${path}: HTTP ${response.status}`);
    try {
      return await response.json();
    } catch {
      throw new Error(`API GET ${path}: invalid JSON`);
    }
  }
  const rawSite = await check(
    "API_AUTH",
    async () => {
      const accounts = await get("account/");
      if (!Array.isArray(accounts) || accounts.filter((a) => a.name === "congofoot").length !== 1)
        throw new Error("API intended account congofoot not identified");
      return get("site/1083502/");
    },
    "API_ACCESS_OR_IDENTITY",
  );
  const site = await check(
    "SITE_CONFIG",
    () => validatePreflightSiteConfig(rawSite),
    "SITE_FIELDS",
  );
  await check(
    "SITE_ENVIRONMENT",
    () => validatePreflightSiteEnvironment(rawSite),
    "SITE_ENVIRONMENT",
  );
  // The documented token/site/account GET schemas expose no effective restart ACL.
  // Never request token listings (they may contain keys), and never test by POST.
  return {
    authentication: "PASS",
    account: "congofoot",
    site,
    restart_permission: "NOT PROVED",
    permission_limitation:
      "Documented read-only API fields do not establish effective restart permission; linked profile permission evidence is required",
  };
}
export function validateReadOnlyDatabase(lines, expected) {
  const [state, identity, history, schema, access, , ...canonical] = lines;
  for (const [name, ok] of [
    ["TRANSACTION_READ_ONLY", state?.read_only === "on"],
    ["ISOLATION", state?.isolation === "repeatable read"],
    ["PROD_CONNECT_DENIED", state?.prod_connect === false],
    ["POSTGRES_VERSION", identity?.version === 160015],
    ["DATABASE_IDENTITY", identity?.database === "congofoot_teka_edu_dev"],
    ["LOGIN_IDENTITY", identity?.login === "congofoot_user_teka_edu_dev"],
    ["DEV_TLS", identity?.tls === true],
    ["DEV_NON_SUPERUSER", identity?.superuser === false],
  ])
    if (!ok) throw new DiagnosticFailure(name);
  const keys = ["version", "filename", "source_sha256", "execution_sha256", "adapter_version"];
  if (
    history?.length !== 46 ||
    !/^[a-f0-9]{64}$/.test(expected.migrations_sha256) ||
    history.some(
      (row) =>
        row.target !== "staging" ||
        row.release_sha !== "2315600fc0db4bfe67769afb2eb4727983c91bb6" ||
        keys.some((key) => typeof row[key] !== "string"),
    )
  )
    throw new DiagnosticFailure("HISTORY_CHAIN");
  if (
    digest(history.map((row) => Object.fromEntries(keys.map((key) => [key, row[key]])))) !==
    expected.migrations_sha256
  )
    throw new DiagnosticFailure("HISTORY_CHECKSUM");
  const accessKeys = [
    "rls",
    "policies",
    "table_privileges",
    "function_privileges",
    "schema_privileges",
    "public_schema_create",
    "cross_environment_isolation",
    "btree_gist",
  ];
  if (
    digest(schema) !== expected.schema_sha256 ||
    !access ||
    accessKeys.some((key) => access[key] !== true)
  )
    throw new DiagnosticFailure("SCHEMA_ACCESS");
  if (
    canonical.length !== 36 ||
    expected.counts.length !== 36 ||
    canonical.some(
      (row, i) =>
        row.exact !== true ||
        row.table !== expected.counts[i].table ||
        row.rows !== expected.counts[i].rows,
    ) ||
    canonical.reduce((n, row) => n + row.rows, 0) !== 6170
  )
    throw new DiagnosticFailure("CANONICAL_VALUES");
  return {
    authentication: "PASS",
    identity: {
      version: 160015,
      database: "congofoot_teka_edu_dev",
      login: "congofoot_user_teka_edu_dev",
      tls: true,
      superuser: false,
    },
    transaction_read_only: true,
    sslmode: "verify-full",
    prod_connect: false,
    applied: 46,
    pending: 0,
    canonical_tables: 36,
    canonical_rows: 6170,
    exact_values: true,
    schema_access: "PASS",
    behavioral_integrity: "NOT RERUN (DML forbidden)",
    idempotency: "NOT RERUN (DML forbidden)",
  };
}
// Fixed programs run read-only over SSH; no files are written on the server.
export const rootCheck = `import os,pathlib,pwd,json,subprocess,re

def fail(name):
 print(json.dumps({'ok':False,'invariant':name}));raise SystemExit(0)
try:
 r=pathlib.Path('/home/congofoot/www/tekaedu-staging')
 u=pwd.getpwuid(os.getuid()).pw_name
 if u!='congofoot':fail('LOGIN_IDENTITY')
 if not r.exists():fail('ROOT_EXISTS')
 if not r.is_dir():fail('ROOT_DIRECTORY')
 if r.is_symlink():fail('ROOT_SYMLINK')
 if str(r.resolve())!=str(r):fail('ROOT_REAL_PATH')
 if pwd.getpwuid(r.stat().st_uid).pw_name!='congofoot':fail('ROOT_OWNER')
 if not os.access(r,os.W_OK):fail('ROOT_WRITABLE')
 if os.path.lexists(r/'current'):fail('CURRENT_EXISTS')
 if list(r.iterdir()):fail('ROOT_EMPTY')
 node='/usr/alwaysdata/nodejs/22/bin/node'
 if not os.path.isfile(node) or not os.access(node,os.X_OK):fail('NODE_EXECUTABLE')
 v=subprocess.check_output([node,'--version'],text=True,stderr=subprocess.PIPE).strip()
 if not re.fullmatch(r'v22\\.\\d+\\.\\d+',v):fail('NODE_VERSION')
 print(json.dumps({'ok':True,'identity':u,'root':str(r),'root_empty':True,'current_exists':False,'credential_files':False,'node':v}))
except Exception:fail('ROOT_READ')`;
export const databaseCheck = `import sys,json,os,subprocess,re

def fail(name):
 print(json.dumps({'ok':False,'invariant':name}));raise SystemExit(0)
try:
 p=json.load(sys.stdin)
 e={'PATH':os.environ['PATH'],'PGHOST':'postgresql-congofoot.alwaysdata.net','PGPORT':'5432','PGDATABASE':'congofoot_teka_edu_dev','PGUSER':'congofoot_user_teka_edu_dev','PGPASSWORD':p['password'],'PGSSLMODE':'verify-full','PGSSLROOTCERT':'/etc/ssl/certs/ca-certificates.crt','PGCONNECT_TIMEOUT':'15','PGGSSENCMODE':'disable','PGOPTIONS':'-c default_transaction_read_only=on'}
 r=subprocess.run(['psql','-X','-qAt','--no-password','-v','ON_ERROR_STOP=1'],env=e,input=p['sql'],text=True,capture_output=True,timeout=150)
 if r.returncode:
  if re.search(r'password authentication failed|no password supplied|authentication failed',r.stderr,re.I):fail('DEV_AUTHENTICATION')
  if re.search(r'certificate|sslrootcert|SSL error|TLS',r.stderr,re.I):fail('DEV_TLS')
  if re.search(r'could not translate host name|Connection refused|Connection timed out|Network is unreachable|No route to host',r.stderr,re.I):fail('DEV_CONNECTION')
  fail('DEV_QUERY')
 print(json.dumps({'ok':True,'rows':r.stdout.strip().splitlines()}))
except FileNotFoundError:fail('PSQL_UNAVAILABLE')
except subprocess.TimeoutExpired:fail('DEV_TIMEOUT')
except Exception:fail('DEV_REMOTE_READ')`;
export const databaseAuthSql = `begin isolation level repeatable read read only;
select jsonb_build_object('database',current_database(),'login',current_user,
'version',current_setting('server_version_num')::integer,
'read_only',current_setting('transaction_read_only'),
'default_read_only',current_setting('default_transaction_read_only'),
'isolation',current_setting('transaction_isolation'),
 'tls',coalesce((select ssl from pg_stat_ssl where pid=pg_backend_pid()),false));
rollback;`;
const shellQuote = (s) => "'" + s.replaceAll("'", "'\\''") + "'";
export function sshArguments(dir) {
  return [
    "-F",
    "/dev/null",
    "-i",
    join(dir, "key"),
    "-p",
    "22",
    "-o",
    "StrictHostKeyChecking=yes",
    "-o",
    `UserKnownHostsFile=${join(dir, "known_hosts")}`,
    "-o",
    "GlobalKnownHostsFile=/dev/null",
    "-o",
    "IdentitiesOnly=yes",
    "-o",
    "BatchMode=yes",
    "-o",
    "PasswordAuthentication=no",
    "-o",
    "KbdInteractiveAuthentication=no",
    "-o",
    "UpdateHostKeys=no",
    "-o",
    "ConnectTimeout=15",
    "-o",
    "ClearAllForwardings=yes",
    "congofoot@ssh-congofoot.alwaysdata.net",
  ];
}
const invariantNames = new Set([
  "CHECK_FAILED",
  "CONFIGURATION",
  "API_ACCESS_OR_IDENTITY",
  "SITE_FIELDS",
  "SITE_ENVIRONMENT",
  "KEY_FORMAT_OR_PASSPHRASE",
  "KNOWN_HOSTS_HOST_ENTRY",
  "KNOWN_HOSTS_SYNTAX",
  "HOST_KEY_VALIDATION",
  "SSH_AUTHENTICATION",
  "SSH_CONNECTION",
  "SSH_TRANSPORT",
  "REMOTE_COMMAND",
  "LOGIN_IDENTITY",
  "ROOT_EXISTS",
  "ROOT_DIRECTORY",
  "ROOT_SYMLINK",
  "ROOT_REAL_PATH",
  "ROOT_OWNER",
  "ROOT_WRITABLE",
  "CURRENT_EXISTS",
  "ROOT_EMPTY",
  "NODE_EXECUTABLE",
  "NODE_VERSION",
  "ROOT_READ",
  "REMOTE_RESPONSE",
  "DEV_AUTHENTICATION",
  "DEV_TLS",
  "DEV_CONNECTION",
  "DEV_QUERY",
  "PSQL_UNAVAILABLE",
  "DEV_TIMEOUT",
  "DEV_REMOTE_READ",
  "DATABASE_IDENTITY",
  "POSTGRES_VERSION",
  "TRANSACTION_READ_ONLY",
  "DEFAULT_READ_ONLY",
  "ISOLATION",
  "HISTORY_CHAIN",
  "HISTORY_CHECKSUM",
  "SCHEMA_ACCESS",
  "CANONICAL_VALUES",
  "PAYLOAD_GENERATION",
  "LOCAL_CLEANUP",
  "PROD_CONNECT_DENIED",
  "DEV_NON_SUPERUSER",
]);
export class DiagnosticFailure extends Error {
  constructor(invariant) {
    const safe = invariantNames.has(invariant) ? invariant : "CHECK_FAILED";
    super(safe);
    this.invariant = safe;
  }
}
export function classifySshFailure(error) {
  const stderr = Buffer.isBuffer(error?.stderr)
    ? error.stderr.toString("utf8")
    : typeof error?.stderr === "string"
      ? error.stderr
      : "";
  if (
    /Host key verification failed|REMOTE HOST IDENTIFICATION HAS CHANGED|No .* host key is known/i.test(
      stderr,
    )
  )
    return "HOST_KEY_VALIDATION";
  if (/Permission denied|sign_and_send_pubkey|Load key .*invalid format/i.test(stderr))
    return "SSH_AUTHENTICATION";
  if (
    /Could not resolve hostname|Connection timed out|Connection refused|Network is unreachable|No route to host|Connection (closed|reset)/i.test(
      stderr,
    )
  )
    return "SSH_CONNECTION";
  return error?.status === 255 || error?.code === "ETIMEDOUT" ? "SSH_TRANSPORT" : "REMOTE_COMMAND";
}
export function validateRootResponse(value) {
  if (value?.ok === false) throw new DiagnosticFailure(value.invariant);
  if (
    value?.ok !== true ||
    value.identity !== "congofoot" ||
    value.root !== "/home/congofoot/www/tekaedu-staging" ||
    value.root_empty !== true ||
    value.current_exists !== false ||
    value.credential_files !== false ||
    !/^v22\.\d+\.\d+$/.test(value.node ?? "")
  )
    throw new DiagnosticFailure("REMOTE_RESPONSE");
  return {
    identity: "congofoot",
    root: value.root,
    root_empty: true,
    current_exists: false,
    credential_files: false,
    node: value.node,
  };
}
export function validateDatabaseAuthentication(value) {
  for (const [name, ok] of [
    ["DATABASE_IDENTITY", value?.database === "congofoot_teka_edu_dev"],
    ["LOGIN_IDENTITY", value?.login === "congofoot_user_teka_edu_dev"],
    ["POSTGRES_VERSION", value?.version === 160015],
    ["DEV_TLS", value?.tls === true],
    ["TRANSACTION_READ_ONLY", value?.read_only === "on"],
    ["DEFAULT_READ_ONLY", value?.default_read_only === "on"],
    ["ISOLATION", value?.isolation === "repeatable read"],
  ])
    if (!ok) throw new DiagnosticFailure(name);
  return {
    database: value.database,
    login: value.login,
    version: 160015,
    tls: true,
    sslmode: "verify-full",
    transaction_read_only: true,
    default_transaction_read_only: true,
  };
}
const phaseNames = [
  "ACTIVATION_GUARD",
  "API_AUTH",
  "SITE_CONFIG",
  "SITE_ENVIRONMENT",
  "SSH_PRIVATE_KEY_FORMAT",
  "KNOWN_HOSTS_ENTRY",
  "SSH_AUTH",
  "SSH_ROOT_RUNTIME",
  "DEV_DB_AUTH_TLS",
  "DEV_READONLY_VERIFY",
];
function publishEvidence(evidence, env) {
  const safe = JSON.stringify(evidence, null, 2);
  if (secretNames.some((name) => env[name] && safe.includes(env[name])))
    throw new DiagnosticFailure("REMOTE_RESPONSE");
  console.log(safe);
  if (env.GITHUB_STEP_SUMMARY) {
    const rows = Object.entries(evidence.checks)
      .map(([name, status]) => `| ${name} | ${status} |`)
      .join("\n");
    appendFileSync(
      env.GITHUB_STEP_SUMMARY,
      `| Read-only check | Status |\n| --- | --- |\n${rows}\n\n\`\`\`json\n${safe}\n\`\`\`\n`,
    );
  }
}
/**
 * @typedef {Object} PreflightEvidence
 * @property {string} recorded_at
 * @property {string} commit
 * @property {string} deployment_switch
 * @property {string[]} secret_names
 * @property {Record<string, string>} checks
 * @property {{application_upload: boolean, site_restart: boolean, database_dml_ddl: boolean, prod_connection: boolean}} mutations
 * @property {{phase: string, invariant: string}} [failure]
 * @property {Awaited<ReturnType<typeof inspectPreflightApi>>} [api]
 * @property {ReturnType<typeof validateRootResponse> & {private_key?: string, known_hosts?: string}} [ssh]
 * @property {ReturnType<typeof validateDatabaseAuthentication>} [database_auth]
 * @property {ReturnType<typeof validateReadOnlyDatabase>} [database]
 * @property {string} [status]
 */
export async function preflight(env = process.env, options = {}) {
  const run = options.run ?? execFileSync;
  /** @type {PreflightEvidence} */
  const evidence = {
    recorded_at: new Date().toISOString(),
    commit: /^[a-f0-9]{40}$/.test(env.GITHUB_SHA ?? "") ? env.GITHUB_SHA : "INVALID",
    deployment_switch: ["", "false"].includes(env.ALWAYSDATA_STAGING_DEPLOY_ENABLED ?? "")
      ? env.ALWAYSDATA_STAGING_DEPLOY_ENABLED || "UNSET"
      : "ENABLED_OR_INVALID",
    secret_names: secretNames,
    checks: {
      ...Object.fromEntries(phaseNames.map((name) => [name, "NOT REACHED"])),
      RESTART_PERMISSION: "NOT PROVED",
    },
    mutations: {
      application_upload: false,
      site_restart: false,
      database_dml_ddl: false,
      prod_connection: false,
    },
  };
  let dir;
  async function check(name, action, invariant = "CHECK_FAILED") {
    evidence.checks[name] = "FAIL";
    try {
      const result = await action();
      evidence.checks[name] = "PASS";
      return result;
    } catch (error) {
      evidence.failure = {
        phase: name,
        invariant: error instanceof DiagnosticFailure ? error.invariant : invariant,
      };
      throw new DiagnosticFailure(evidence.failure.invariant);
    }
  }
  const parse = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      throw new DiagnosticFailure("REMOTE_RESPONSE");
    }
  };
  try {
    await check(
      "ACTIVATION_GUARD",
      () => {
        assertPreflightConfig(env);
        if (!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA ?? ""))
          throw new DiagnosticFailure("CONFIGURATION");
      },
      "CONFIGURATION",
    );
    // API/site checks stay first; local key/pin validation precedes every network SSH call.
    evidence.api = await inspectPreflightApi(
      env.ALWAYSDATA_API_TOKEN,
      options.fetcher ?? fetch,
      check,
    );
    dir = mkdtempSync(join(tmpdir(), "teka-preflight-"));
    writeFileSync(join(dir, "key"), env.ALWAYSDATA_SSH_PRIVATE_KEY + "\n", { mode: 0o600 });
    writeFileSync(join(dir, "known_hosts"), env.ALWAYSDATA_SSH_KNOWN_HOSTS + "\n", { mode: 0o600 });
    const local = { env: { PATH: env.PATH }, timeout: 15000, stdio: ["ignore", "ignore", "pipe"] };
    await check(
      "SSH_PRIVATE_KEY_FORMAT",
      () => {
        // Empty passphrase is explicit: no prompt, public key or fingerprint output.
        run("ssh-keygen", ["-y", "-P", "", "-f", join(dir, "key")], local);
      },
      "KEY_FORMAT_OR_PASSPHRASE",
    );
    await check(
      "KNOWN_HOSTS_ENTRY",
      () => {
        let found;
        try {
          found = run(
            "ssh-keygen",
            ["-F", "ssh-congofoot.alwaysdata.net", "-f", join(dir, "known_hosts")],
            { ...local, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
          );
        } catch {
          throw new DiagnosticFailure("KNOWN_HOSTS_HOST_ENTRY");
        }
        const entries = String(found)
          .split("\n")
          .filter((line) => line.trim() && !line.trimStart().startsWith("#"));
        if (!entries.length) throw new DiagnosticFailure("KNOWN_HOSTS_HOST_ENTRY");
        // Validate only matching entries; another host's valid key cannot mask a bad pin.
        writeFileSync(join(dir, "matched_known_hosts"), entries.join("\n") + "\n", { mode: 0o600 });
        run("ssh-keygen", ["-l", "-f", join(dir, "matched_known_hosts")], local);
      },
      "KNOWN_HOSTS_SYNTAX",
    );
    const ssh = (command, input) => {
      try {
        return run("ssh", [...sshArguments(dir), command], {
          env: { PATH: env.PATH },
          input,
          encoding: "utf8",
          maxBuffer: 32 * 1024 * 1024,
          timeout: 180000,
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (error) {
        throw new DiagnosticFailure(classifySshFailure(error));
      }
    };
    await check("SSH_AUTH", () => {
      if (!/^congofoot\r?\n?$/.test(ssh("id -un"))) throw new DiagnosticFailure("LOGIN_IDENTITY");
    });
    evidence.ssh = await check("SSH_ROOT_RUNTIME", () =>
      validateRootResponse(parse(ssh("python3 -c " + shellQuote(rootCheck)))),
    );
    evidence.ssh.private_key = "PASS";
    evidence.ssh.known_hosts = "PASS";
    const query = (sql) => {
      const value = parse(
        ssh(
          "python3 -c " + shellQuote(databaseCheck),
          JSON.stringify({ password: env.ALWAYSDATA_DEV_PGPASSWORD, sql }),
        ),
      );
      if (value?.ok === false) throw new DiagnosticFailure(value.invariant);
      if (
        value?.ok !== true ||
        !Array.isArray(value.rows) ||
        value.rows.some((row) => typeof row !== "string")
      )
        throw new DiagnosticFailure("REMOTE_RESPONSE");
      return value.rows.map(parse);
    };
    evidence.database_auth = await check("DEV_DB_AUTH_TLS", () => {
      const rows = query(databaseAuthSql);
      if (rows.length !== 1) throw new DiagnosticFailure("REMOTE_RESPONSE");
      return validateDatabaseAuthentication(rows[0]);
    });
    evidence.database = await check("DEV_READONLY_VERIFY", () => {
      let payload;
      try {
        payload = parse(
          run(process.execPath, ["--import", "tsx", "scripts/alwaysdata/preflight-sql.ts"], {
            env: { PATH: env.PATH },
            encoding: "utf8",
            maxBuffer: 32 * 1024 * 1024,
          }),
        );
      } catch {
        throw new DiagnosticFailure("PAYLOAD_GENERATION");
      }
      return validateReadOnlyDatabase(query(payload.sql), payload.expected);
    });
    evidence.status = "CONNECTIONS PASS; RESTART PERMISSION NOT PROVED";
  } catch {
    evidence.failure ??= { phase: "LOCAL_SETUP", invariant: "CHECK_FAILED" };
    evidence.status = "VERIFICATION FAILED";
  } finally {
    if (dir) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        evidence.failure = { phase: "LOCAL_CLEANUP", invariant: "LOCAL_CLEANUP" };
        evidence.status = "VERIFICATION FAILED";
      }
    }
    (options.emit ?? ((value) => publishEvidence(value, env)))(evidence);
  }
  if (evidence.failure) throw new DiagnosticFailure(evidence.failure.invariant);
  return evidence;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  preflight()
    .then(() => {
      process.exitCode = 2;
    })
    .catch(() => {
      process.exitCode = 1;
    });
}
