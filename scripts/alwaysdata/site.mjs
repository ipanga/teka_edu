import { pathToFileURL } from "node:url";
import { validatePreflightSite } from "./preflight.mjs";
export const SITE_ID = 1083502;
export const STAGING_URL = "https://staging-tekaedu.tootiye.com";
export const SITE_COMMAND = "/usr/alwaysdata/nodejs/22/bin/node current/runtime.mjs";
// Deployment uses the independently verified, redacted site contract from develop.
export function assertSite(site) {
  validatePreflightSite(site);
}
export function assertHealth(body, sha) {
  if (
    body.status !== "ok" ||
    body.environment !== "staging" ||
    body.commit !== sha ||
    body.supabaseProjectRef !== null
  )
    throw new Error("Strict staging health identity mismatch");
}
export async function waitHealth(sha, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(STAGING_URL + "/api/health?release=" + sha, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("HTTP health failure");
      assertHealth(await response.json(), sha);
      return;
    } catch {
      if (i === attempts - 1)
        throw new Error("Staging did not become healthy for expected full SHA");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
const GET_BACKOFF_MS = [500, 1000];
const TRANSIENT_CODES = new Set([
  "ETIMEDOUT",
  "ENETUNREACH",
  "EHOSTUNREACH",
  "ECONNRESET",
  "ECONNREFUSED",
  "EPIPE",
  "EAI_AGAIN",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_SOCKET",
]);
const TLS_CODES = new Set([
  "TLS_ERROR",
  "CERT_HAS_EXPIRED",
  "CERT_NOT_YET_VALID",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "ERR_TLS_CERT_SIGNATURE_ALGORITHM_UNSUPPORTED",
  "ERR_SSL_WRONG_VERSION_NUMBER",
  "EPROTO",
]);
class ApiFailure extends Error {
  constructor(stage, code, { codes = [], status, retryable = false } = {}) {
    super(
      `${stage} / ${code}${codes.length ? " / " + codes.join(",") : ""}${status ? " / HTTP_" + status : ""}`,
    );
    this.retryable = retryable;
  }
}
// Only allowlisted transport codes survive. Never carry raw error messages, causes,
// headers, response bodies, or credentials into errors printed by the CLI.
function transportFailure(stage, error) {
  const codes = new Set();
  let timedOut = false;
  const seen = new WeakSet();
  let remaining = 32;
  const read = (entry, key) => {
    try {
      return entry[key];
    } catch {
      return undefined;
    }
  };
  const visit = (entry, depth = 0) => {
    if (!entry || typeof entry !== "object" || depth > 4 || seen.has(entry) || remaining-- <= 0)
      return;
    seen.add(entry);
    const name = read(entry, "name");
    const code = read(entry, "code");
    if (name === "TimeoutError" || name === "AbortError") timedOut = true;
    if (TRANSIENT_CODES.has(code) || TLS_CODES.has(code) || code === "ENOTFOUND") codes.add(code);
    else if (
      typeof code === "string" &&
      (code.startsWith("ERR_TLS_") || code.startsWith("ERR_SSL_"))
    )
      codes.add("TLS_ERROR");
    visit(read(entry, "cause"), depth + 1);
    const errors = read(entry, "errors");
    if (Array.isArray(errors)) for (let i = 0; i < 8; i++) visit(read(errors, i), depth + 1);
  };
  visit(error);
  const safeCodes = [...codes].sort();
  if (safeCodes.some((code) => TLS_CODES.has(code)))
    return new ApiFailure(stage, "TLS_FAILED", { codes: safeCodes });
  if (codes.has("ENOTFOUND")) return new ApiFailure(stage, "DNS_NOT_FOUND", { codes: safeCodes });
  return new ApiFailure(stage, timedOut ? "TIMEOUT" : "TRANSPORT_FAILED", {
    codes: safeCodes,
    retryable: timedOut || safeCodes.some((code) => TRANSIENT_CODES.has(code)),
  });
}
async function apiRequest(method, url, headers, fetcher) {
  const stage = method === "GET" ? "API_SITE_GET" : "API_RESTART_POST";
  const controller = new AbortController();
  let timer;
  // The deadline covers both response headers and the GET body, including a body
  // that stalls after headers. Abort the request as well as rejecting the wait.
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ApiFailure(stage, "TIMEOUT", { retryable: true }));
    }, 15000);
  });
  try {
    return await Promise.race([
      deadline,
      (async () => {
        let response;
        try {
          response = await fetcher(url, {
            method,
            headers,
            redirect: "error",
            signal: controller.signal,
          });
        } catch (error) {
          throw transportFailure(stage, error);
        }
        const status =
          Number.isInteger(response.status) && response.status >= 100 && response.status <= 599
            ? response.status
            : null;
        if (!response.ok) {
          // Discard a response body without ever reading or logging its contents.
          void response.body?.cancel().catch(() => {});
          throw new ApiFailure(stage, "HTTP_FAILED", {
            status,
            retryable: [502, 503, 504].includes(status),
          });
        }
        if (method === "GET") {
          let site;
          try {
            site = await response.json();
          } catch (error) {
            if (error instanceof SyntaxError) throw new ApiFailure(stage, "JSON_INVALID");
            throw transportFailure(stage, error);
          }
          try {
            assertSite(site);
          } catch {
            throw new ApiFailure(stage, "SITE_IDENTITY_INVALID");
          }
        } else {
          void response.body?.cancel().catch(() => {});
        }
        return status;
      })(),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
export function formatSiteFailure(error) {
  return error instanceof ApiFailure ? error.message : "STAGING_ACTION_FAILED";
}
export async function siteAction(
  action,
  {
    fetcher = globalThis.fetch,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = {},
) {
  if (!["inspect", "restart"].includes(action))
    throw new ApiFailure("API_CONFIG", "ACTION_INVALID");
  const token = process.env.ALWAYSDATA_API_TOKEN;
  if (!token) throw new ApiFailure("API_CONFIG", "TOKEN_MISSING");
  const headers = {
    Authorization: "Basic " + Buffer.from(token + " account=congofoot:").toString("base64"),
  };
  const base = "https://api.alwaysdata.com/v1/site/" + SITE_ID + "/";
  let inspection;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      inspection = {
        http_status: await apiRequest("GET", base, headers, fetcher),
        attempts: attempt + 1,
      };
      break;
    } catch (error) {
      const failure =
        error instanceof ApiFailure ? error : new ApiFailure("API_SITE_GET", "TRANSPORT_FAILED");
      if (!failure.retryable || attempt === 2) throw failure;
      await sleep(GET_BACKOFF_MS[attempt]);
    }
  }
  if (action === "inspect") return inspection;
  if (action === "restart") {
    try {
      await apiRequest("POST", base + "restart/", headers, fetcher);
    } catch (error) {
      // A lost response cannot tell us whether the restart happened. Never retry
      // this POST or perform recovery here; the owner must first inspect state.
      throw new ApiFailure(
        "API_RESTART_POST",
        "RESTART_NOT_CONFIRMED / READ_ONLY_INSPECTION_REQUIRED / " + formatSiteFailure(error),
      );
    }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [action, sha] = process.argv.slice(2);
    if (!["inspect", "restart", "health"].includes(action))
      throw new Error("Explicit site action required");
    if (action === "health") {
      if (!/^[a-f0-9]{40}$/.test(sha ?? "")) throw new Error("Full SHA required");
      await waitHealth(sha);
    } else await siteAction(action);
    console.log("PASS: staging " + action);
  } catch (error) {
    console.error("FAIL: " + formatSiteFailure(error));
    process.exitCode = 1;
  }
}
