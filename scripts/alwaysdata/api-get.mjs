// GET-only extraction of the transport reviewed at PR #112 head
// 838fd4ff9701cc04d75cb732baa445b305b9a0c0. Deployment site.mjs is unchanged.
import { validatePreflightSite } from "./preflight.mjs";
const API_SITE_URL = "https://api.alwaysdata.com/v1/site/1083502/";
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
    this.stage = stage;
    this.code = code;
    this.codes = codes;
    this.status = status ?? null;
    this.attempts = 0;
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

async function getSite(headers, fetcher) {
  const stage = "API_SITE_GET";
  const controller = new AbortController();
  let timer;
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
          response = await fetcher(API_SITE_URL, {
            method: "GET",
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
          void response.body?.cancel().catch(() => {});
          throw new ApiFailure(stage, "HTTP_FAILED", {
            status,
            retryable: [502, 503, 504].includes(status),
          });
        }
        if (status === null || status < 200 || status >= 300)
          throw new ApiFailure(stage, "HTTP_STATUS_INVALID");
        let site;
        try {
          site = await response.json();
        } catch (error) {
          if (error instanceof SyntaxError) throw new ApiFailure(stage, "JSON_INVALID", { status });
          throw transportFailure(stage, error);
        }
        try {
          validatePreflightSite(site);
        } catch {
          throw new ApiFailure(stage, "SITE_IDENTITY_INVALID", { status });
        }
        return status;
      })(),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
export async function inspectApiSite({
  token = "",
  fetcher = globalThis.fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  if (!token) throw new ApiFailure("API_CONFIG", "TOKEN_MISSING");
  // Alwaysdata's account selector scopes this authenticated fixed-site request.
  const headers = {
    Authorization: "Basic " + Buffer.from(token + " account=congofoot:").toString("base64"),
  };
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return { http_status: await getSite(headers, fetcher), attempts: attempt };
    } catch (error) {
      const failure =
        error instanceof ApiFailure ? error : new ApiFailure("API_SITE_GET", "TRANSPORT_FAILED");
      failure.attempts = attempt;
      if (!failure.retryable || attempt === 3) throw failure;
      await sleep(GET_BACKOFF_MS[attempt - 1]);
    }
  }
}
export function apiGetFailureDetails(error) {
  if (!(error instanceof ApiFailure))
    return {
      code: "API_VERIFICATION_FAILED",
      classification: "INTERNAL_FAILURE",
      attempts: null,
      http_status: null,
      tls_validation: "NOT PROVED",
      site_identity: "NOT VERIFIED",
    };
  const authRejected = error.code === "HTTP_FAILED" && [401, 403].includes(error.status);
  return {
    code: error.message,
    classification: authRejected
      ? "HTTP_AUTHORIZATION_REJECTED"
      : error.code === "HTTP_FAILED"
        ? "HTTP_FAILURE"
        : error.code === "TLS_FAILED"
          ? "TLS_FAILURE"
          : error.code === "SITE_IDENTITY_INVALID"
            ? "SITE_IDENTITY_REJECTED"
            : ["JSON_INVALID", "HTTP_STATUS_INVALID"].includes(error.code)
              ? "RESPONSE_INVALID"
              : error.code === "TOKEN_MISSING"
                ? "TOKEN_UNAVAILABLE"
                : "TRANSPORT_FAILURE",
    attempts: error.attempts,
    http_status: error.status,
    tls_validation: error.code === "TLS_FAILED" ? "FAIL" : error.status ? "PASS" : "NOT PROVED",
    site_identity: error.code === "SITE_IDENTITY_INVALID" ? "FAIL" : "NOT VERIFIED",
  };
}
