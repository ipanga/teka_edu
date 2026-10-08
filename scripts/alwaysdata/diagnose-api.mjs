import { Resolver } from "node:dns/promises";
import https from "node:https";
import {
  getDefaultAutoSelectFamily,
  getDefaultAutoSelectFamilyAttemptTimeout,
  isIP,
} from "node:net";
import { pathToFileURL } from "node:url";

export const DIAGNOSTIC_URL = "https://api.alwaysdata.com/v1/site/1083502/";
const HOST = "api.alwaysdata.com";
const CONNECT_MS = 5000;
const OVERALL_MS = 15000;
const CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ENODATA",
  "ETIMEOUT",
  "ECANCELLED",
  "ESERVFAIL",
  "EREFUSED",
  "ETIMEDOUT",
  "ENETUNREACH",
  "EHOSTUNREACH",
  "ECONNREFUSED",
  "ECONNRESET",
  "EPIPE",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_SOCKET",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "CERT_HAS_EXPIRED",
  "CERT_NOT_YET_VALID",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "ERR_SSL_WRONG_VERSION_NUMBER",
  "EPROTO",
  "DIAGNOSTIC_CONNECT_TIMEOUT",
  "DIAGNOSTIC_OVERALL_TIMEOUT",
]);

export function assertDiagnosticGuard(env) {
  if (env.DIAGNOSTIC_READ_ONLY !== "true" || env.DIAGNOSTIC_ALLOW_DEPLOYMENT !== "false")
    throw new Error("DIAGNOSTIC_GUARD_DENIED");
  if (
    (env.NODE_TLS_REJECT_UNAUTHORIZED && env.NODE_TLS_REJECT_UNAUTHORIZED !== "1") ||
    env.NODE_OPTIONS
  )
    throw new Error("DIAGNOSTIC_RUNTIME_OVERRIDE_DENIED");
  for (const key of [
    "ALWAYSDATA_API_TOKEN",
    "ALWAYSDATA_SSH_PRIVATE_KEY",
    "ALWAYSDATA_DEV_PGPASSWORD",
    "PGPASSWORD",
    "DATABASE_URL",
    "DIRECT_DATABASE_URL",
    "SUPABASE_SECRET_KEY",
    "VERCEL_TOKEN",
  ])
    if (env[key]) throw new Error("DIAGNOSTIC_SECRET_INPUT_DENIED");
}

// Never copy messages, headers, response bodies, hostnames or arbitrary error properties.
export function sanitizeDiagnosticError(error) {
  const found = [];
  const visited = new Set();
  function visit(value, depth) {
    if (!value || typeof value !== "object" || visited.has(value) || depth > 4) return;
    visited.add(value);
    const code = CODES.has(value.code)
      ? value.code
      : value.name === "TimeoutError"
        ? "DIAGNOSTIC_OVERALL_TIMEOUT"
        : value.name === "AbortError"
          ? "ABORTED"
          : null;
    if (code) {
      const family = typeof value.address === "string" ? isIP(value.address) : 0;
      found.push({ code, ...(family ? { family } : {}) });
    }
    visit(value.cause, depth + 1);
    if (Array.isArray(value.errors))
      for (const child of value.errors.slice(0, 8)) visit(child, depth + 1);
  }
  visit(error, 0);
  return found.length ? found : [{ code: "TRANSPORT_FAILURE" }];
}

function codeError(code) {
  return Object.assign(new Error(code), { code });
}
function elapsed(start) {
  return Math.round(performance.now() - start);
}
function statusOf(status) {
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : null;
}

async function probeDns(resolver, family) {
  const start = performance.now();
  try {
    const addresses = await (family === 4 ? resolver.resolve4(HOST) : resolver.resolve6(HOST));
    return {
      status: "RESOLVED",
      addresses: addresses.filter((address) => isIP(address) === family),
      elapsed_ms: elapsed(start),
    };
  } catch (error) {
    return { status: "FAILED", errors: sanitizeDiagnosticError(error), elapsed_ms: elapsed(start) };
  }
}

export function probeHttps(family, request = https.request) {
  const start = performance.now();
  return new Promise((resolve) => {
    let phase = "DNS";
    let settled = false;
    let req;
    const timing = {};
    const connection = { tcp_connected: false, tls_established: false, tls_authorized: false };
    let connectTimer;
    let overallTimer;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(connectTimer);
      clearTimeout(overallTimer);
      resolve({
        family,
        ...result,
        connection: { ...connection },
        timing: { ...timing, elapsed_ms: elapsed(start) },
      });
    };
    try {
      req = request(
        {
          hostname: HOST,
          port: 443,
          path: "/v1/site/1083502/",
          method: "GET",
          family,
          servername: HOST,
          rejectUnauthorized: true,
          agent: false,
          headers: { Accept: "application/json" },
        },
        (response) => {
          timing.http_ms = elapsed(start);
          const status = statusOf(response.statusCode);
          finish({
            status: status >= 300 && status < 400 ? "REDIRECT_REJECTED" : "HTTP_REACHED",
            http_status: status,
            tls_verified: connection.tls_authorized,
            authentication: "NOT ATTEMPTED",
          });
          response.destroy();
        },
      );
      req.on("socket", (socket) => {
        socket.once("lookup", (error) => {
          if (!error) {
            timing.dns_ms = elapsed(start);
            phase = "TCP";
          }
        });
        socket.once("connect", () => {
          connection.tcp_connected = true;
          timing.tcp_ms = elapsed(start);
          phase = "TLS";
          clearTimeout(connectTimer);
        });
        socket.once("secureConnect", () => {
          connection.tls_established = true;
          connection.tls_authorized = socket.authorized === true;
          timing.tls_ms = elapsed(start);
          phase = "HTTP";
        });
      });
      req.once("error", (error) =>
        finish({ status: "FAILED", phase, errors: sanitizeDiagnosticError(error) }),
      );
      connectTimer = setTimeout(
        () => req.destroy(codeError("DIAGNOSTIC_CONNECT_TIMEOUT")),
        CONNECT_MS,
      );
      overallTimer = setTimeout(
        () => req.destroy(codeError("DIAGNOSTIC_OVERALL_TIMEOUT")),
        OVERALL_MS,
      );
      req.end();
    } catch (error) {
      finish({ status: "FAILED", phase, errors: sanitizeDiagnosticError(error) });
      req?.destroy();
    }
  });
}

async function probeFetch(fetcher, pause) {
  const attempts = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const start = performance.now();
    try {
      const response = await fetcher(DIAGNOSTIC_URL, {
        method: "GET",
        redirect: "error",
        signal: AbortSignal.timeout(OVERALL_MS),
        headers: { Accept: "application/json" },
      });
      attempts.push({
        attempt,
        status: "HTTP_REACHED",
        http_status: statusOf(response.status),
        authentication: "NOT ATTEMPTED",
        elapsed_ms: elapsed(start),
      });
      await response.body?.cancel().catch(() => {});
      break;
    } catch (error) {
      attempts.push({
        attempt,
        status: "FAILED",
        errors: sanitizeDiagnosticError(error),
        elapsed_ms: elapsed(start),
      });
      if (attempt < 2) await pause(300);
    }
  }
  return attempts;
}

export async function runDiagnostic({
  env = process.env,
  resolver,
  request = https.request,
  fetcher = fetch,
  pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  assertDiagnosticGuard(env);
  const deploymentSwitch = env.ALWAYSDATA_STAGING_DEPLOY_ENABLED;
  const dnsResolver = resolver ?? new Resolver({ timeout: 4000, tries: 1 });
  const [a, aaaa, ipv4, ipv6, nodeFetch] = await Promise.all([
    probeDns(dnsResolver, 4),
    probeDns(dnsResolver, 6),
    probeHttps(4, request),
    probeHttps(6, request),
    probeFetch(fetcher, pause),
  ]);
  return {
    diagnostic: "READ_ONLY",
    target: DIAGNOSTIC_URL,
    deployment_allowed: false,
    repository_activation_switch:
      deploymentSwitch === undefined || deploymentSwitch === ""
        ? "UNSET"
        : ["true", "false"].includes(deploymentSwitch)
          ? deploymentSwitch
          : "UNEXPECTED",
    authentication: "NOT ATTEMPTED",
    api_token: "NOT AVAILABLE TO THIS DIAGNOSTIC",
    node: {
      version: process.version,
      auto_select_family: getDefaultAutoSelectFamily(),
      auto_select_family_attempt_timeout_ms: getDefaultAutoSelectFamilyAttemptTimeout(),
    },
    limits: {
      dns_timeout_ms: 4000,
      https_connect_timeout_ms: CONNECT_MS,
      overall_timeout_ms: OVERALL_MS,
      https_attempts_per_family: 1,
      fetch_max_attempts: 2,
    },
    dns: { A: a, AAAA: aaaa },
    https: { ipv4, ipv6 },
    node_fetch: nodeFetch,
    provider_mutations: 0,
    database_connections: 0,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await runDiagnostic(), null, 2));
  } catch (error) {
    const allowed = [
      "DIAGNOSTIC_GUARD_DENIED",
      "DIAGNOSTIC_RUNTIME_OVERRIDE_DENIED",
      "DIAGNOSTIC_SECRET_INPUT_DENIED",
    ];
    console.log(
      JSON.stringify({
        diagnostic: "REFUSED",
        code: allowed.includes(error.message) ? error.message : "DIAGNOSTIC_FAILED",
      }),
    );
    process.exitCode = 1;
  }
}
