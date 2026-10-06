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
export function validatePreflightSite(site) {
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
  if (typeof site.environment !== "string" && site.environment != null)
    throw new Error("Unexpected site environment representation");
  if (/\b(PG\w*|\w*DATABASE_URL|\w*SUPABASE\w*|\w*VERCEL\w*)\s*=/i.test(site.environment ?? ""))
    throw new Error(
      "Forbidden DB/Supabase/Vercel assignment in site environment (values suppressed)",
    );
  return expected;
}
export async function inspectPreflightApi(token, fetcher = fetch) {
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
  const accounts = await get("account/");
  if (!Array.isArray(accounts) || accounts.filter((a) => a.name === "congofoot").length !== 1)
    throw new Error("API intended account congofoot not identified");
  const site = validatePreflightSite(await get("site/1083502/"));
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
  if (
    state?.read_only !== "on" ||
    state.isolation !== "repeatable read" ||
    state.prod_connect !== false ||
    identity?.version !== 160015 ||
    identity.database !== "congofoot_teka_edu_dev" ||
    identity.login !== "congofoot_user_teka_edu_dev" ||
    identity.tls !== true ||
    identity.superuser !== false
  )
    throw new Error("Read-only DEV identity/TLS/PROD isolation failed");
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
    throw new Error("DEV history differs from reviewed 46-migration chain");
  if (
    digest(history.map((row) => Object.fromEntries(keys.map((key) => [key, row[key]])))) !==
    expected.migrations_sha256
  )
    throw new Error("DEV history checksum/metadata differs from reviewed chain");
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
    throw new Error("DEV schema/access drift");
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
    throw new Error("DEV canonical row/value mismatch");
  return {
    authentication: "PASS",
    identity,
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
// Fixed scripts streamed as command arguments/stdin; nothing is written on the server.
const rootCheck = `import os,pathlib,pwd,json,subprocess
r=pathlib.Path('/home/congofoot/www/tekaedu-staging')
u=pwd.getpwuid(os.getuid()).pw_name
assert u=='congofoot' and r.is_dir() and not r.is_symlink() and str(r.resolve())==str(r)
assert pwd.getpwuid(r.stat().st_uid).pw_name=='congofoot' and os.access(r,os.W_OK)
assert not list(r.iterdir()), 'Staging root is no longer empty; separate review required'
v=subprocess.check_output(['/usr/alwaysdata/nodejs/22/bin/node','--version'],text=True).strip()
assert v.startswith('v22.')
print(json.dumps({'identity':u,'root':str(r),'root_empty':True,'current_exists':False,'credential_files':False,'node':v}))`;
const databaseCheck = `import sys,json,os,subprocess
p=json.load(sys.stdin)
e={'PATH':os.environ['PATH'],'PGHOST':'postgresql-congofoot.alwaysdata.net','PGPORT':'5432','PGDATABASE':'congofoot_teka_edu_dev','PGUSER':'congofoot_user_teka_edu_dev','PGPASSWORD':p['password'],'PGSSLMODE':'verify-full','PGSSLROOTCERT':'/etc/ssl/certs/ca-certificates.crt','PGCONNECT_TIMEOUT':'15','PGGSSENCMODE':'disable','PGOPTIONS':'-c default_transaction_read_only=on'}
r=subprocess.run(['psql','-X','-qAt','--no-password','-v','ON_ERROR_STOP=1'],env=e,input=p['sql'],text=True,capture_output=True)
if r.returncode: print('Read-only DEV query failed; server diagnostics suppressed',file=sys.stderr);sys.exit(1)
sys.stdout.write(r.stdout)`;
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
export async function preflight(env = process.env) {
  assertPreflightConfig(env);
  const evidence = {
    recorded_at: new Date().toISOString(),
    commit: env.GITHUB_SHA,
    deployment_switch: env.ALWAYSDATA_STAGING_DEPLOY_ENABLED || "UNSET",
    secret_names: secretNames,
    mutations: {
      application_upload: false,
      site_restart: false,
      database_dml_ddl: false,
      prod_connection: false,
    },
  };
  if (!/^[a-f0-9]{40}$/.test(evidence.commit ?? ""))
    throw new Error("Exact workflow commit SHA required");
  // API identity mismatch stops before remote checks. No restart-capable helper is imported.
  evidence.api = await inspectPreflightApi(env.ALWAYSDATA_API_TOKEN);
  const payload = JSON.parse(
    execFileSync(process.execPath, ["--import", "tsx", "scripts/alwaysdata/preflight-sql.ts"], {
      env: { PATH: env.PATH },
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    }),
  );
  const dir = mkdtempSync(join(tmpdir(), "teka-preflight-")); // mkdtemp creates mode 0700.
  try {
    writeFileSync(join(dir, "key"), env.ALWAYSDATA_SSH_PRIVATE_KEY + "\n", { mode: 0o600 });
    writeFileSync(join(dir, "known_hosts"), env.ALWAYSDATA_SSH_KNOWN_HOSTS + "\n", { mode: 0o600 });
    const ssh = (program, input) => {
      try {
        return execFileSync("ssh", [...sshArguments(dir), "python3 -c " + shellQuote(program)], {
          env: { PATH: env.PATH },
          input,
          encoding: "utf8",
          maxBuffer: 32 * 1024 * 1024,
          timeout: 180000,
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch {
        throw new Error("Pinned-key SSH/read-only remote check failed; diagnostics suppressed");
      }
    };
    evidence.ssh = { ...JSON.parse(ssh(rootCheck)), private_key: "PASS", known_hosts: "PASS" };
    const output = ssh(
      databaseCheck,
      JSON.stringify({ password: env.ALWAYSDATA_DEV_PGPASSWORD, sql: payload.sql }),
    );
    evidence.database = validateReadOnlyDatabase(
      output.trim().split("\n").map(JSON.parse),
      payload.expected,
    );
    evidence.status = "CONNECTIONS PASS; RESTART PERMISSION NOT PROVED";
    const safe = JSON.stringify(evidence, null, 2);
    // Defense in depth: refuse all output if any credential accidentally entered evidence.
    for (const name of secretNames)
      if (safe.includes(env[name])) throw new Error("Evidence rejected by secret exposure check");
    console.log(safe);
    if (env.GITHUB_STEP_SUMMARY)
      appendFileSync(env.GITHUB_STEP_SUMMARY, "```json\n" + safe + "\n```\n");
    return evidence;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  preflight()
    .then(() => {
      process.exitCode = 2;
    })
    .catch((error) => {
      // All errors above are fixed text or field names, never raw provider/SSH responses.
      const message = error instanceof Error ? error.message : "Preflight failed";
      console.error(
        secretNames.some((name) => process.env[name] && message.includes(process.env[name]))
          ? "Preflight failed (diagnostics suppressed)"
          : message,
      );
      process.exitCode = 1;
    });
}
