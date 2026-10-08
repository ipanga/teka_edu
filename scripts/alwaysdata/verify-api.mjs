import { pathToFileURL } from "node:url";
import { inspectApiSite, apiGetFailureDetails } from "./api-get.mjs";

const GUARD_FAILURES = new Set([
  "API_VERIFICATION_REF_DENIED",
  "API_VERIFICATION_EVENT_DENIED",
  "API_VERIFICATION_SWITCH_ENABLED",
  "API_VERIFICATION_ACK_REQUIRED",
  "API_VERIFICATION_MODE_DENIED",
  "API_VERIFICATION_RUNTIME_OVERRIDE_DENIED",
  "API_VERIFICATION_TOKEN_MISSING",
  "API_VERIFICATION_ACTION_DENIED",
]);
export function assertApiVerificationGuard(env) {
  if (env.GITHUB_REF !== "refs/heads/develop") throw new Error("API_VERIFICATION_REF_DENIED");
  if (env.GITHUB_EVENT_NAME !== "workflow_dispatch")
    throw new Error("API_VERIFICATION_EVENT_DENIED");
  for (const name of [
    "ALWAYSDATA_STAGING_DEPLOY_ENABLED",
    "STAGING_DEPLOY_ENABLED",
    "PRODUCTION_DEPLOY_ENABLED",
  ])
    if (env[name] !== "false") throw new Error("API_VERIFICATION_SWITCH_ENABLED");
  if (env.API_VERIFICATION_READ_ONLY_ACK !== "true")
    throw new Error("API_VERIFICATION_ACK_REQUIRED");
  if (env.DIAGNOSTIC_READ_ONLY !== "true" || env.DIAGNOSTIC_ALLOW_DEPLOYMENT !== "false")
    throw new Error("API_VERIFICATION_MODE_DENIED");
  if (
    (env.NODE_TLS_REJECT_UNAUTHORIZED && env.NODE_TLS_REJECT_UNAUTHORIZED !== "1") ||
    env.NODE_OPTIONS
  )
    throw new Error("API_VERIFICATION_RUNTIME_OVERRIDE_DENIED");
}
const zeroMutations = {
  restart: "NOT ATTEMPTED",
  restart_post_requests: 0,
  provider_mutations: 0,
  database_connections: 0,
};
export async function runApiVerification({ env = process.env, inspect = inspectApiSite } = {}) {
  assertApiVerificationGuard(env);
  if (!env.ALWAYSDATA_API_TOKEN) throw new Error("API_VERIFICATION_TOKEN_MISSING");
  // No action, endpoint or method input can reach this GET-only inspector.
  const transport = await inspect({ token: env.ALWAYSDATA_API_TOKEN });
  if (
    !Number.isInteger(transport?.http_status) ||
    transport.http_status < 200 ||
    transport.http_status >= 300 ||
    !Number.isInteger(transport?.attempts) ||
    transport.attempts < 1 ||
    transport.attempts > 3
  )
    throw new Error("API_VERIFICATION_RESULT_INVALID");
  return {
    verification: "READ_ONLY",
    activation_guard: "PASS",
    token_access: "PASS",
    authentication: "PASS",
    http_status: transport.http_status,
    attempts: transport.attempts,
    retries: transport.attempts - 1,
    tls_validation: "PASS",
    site_identity: "PASS",
    site_id: 1083502,
    account: "congofoot",
    account_scope: "PASS",
    ...zeroMutations,
  };
}
export function apiVerificationFailure(error, { guardPassed = false, tokenPresent = false } = {}) {
  let message;
  try {
    message = error?.message;
  } catch {
    message = undefined;
  }
  const knownGuard = GUARD_FAILURES.has(message);
  const failure = knownGuard
    ? {
        code: message,
        classification:
          message === "API_VERIFICATION_TOKEN_MISSING" ? "TOKEN_UNAVAILABLE" : "GUARD_REJECTED",
        attempts: 0,
        http_status: null,
        tls_validation: "NOT PROVED",
        site_identity: "NOT VERIFIED",
      }
    : apiGetFailureDetails(error);
  return {
    verification: "FAILED",
    activation_guard: guardPassed ? "PASS" : "NOT PASSED",
    token_access: guardPassed ? (tokenPresent ? "PASS" : "FAIL") : "NOT ATTEMPTED",
    authentication:
      failure.classification === "HTTP_AUTHORIZATION_REJECTED"
        ? "FAIL"
        : failure.http_status >= 200 && failure.http_status < 300
          ? "PASS"
          : "NOT PROVED",
    ...failure,
    ...zeroMutations,
  };
}
export function formatApiVerificationFailure(error) {
  return apiVerificationFailure(error).code;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let guardPassed = false;
  try {
    const [action, ...extra] = process.argv.slice(2);
    if (extra.length || !["guard", "inspect"].includes(action))
      throw new Error("API_VERIFICATION_ACTION_DENIED");
    assertApiVerificationGuard(process.env);
    guardPassed = true;
    if (action === "guard")
      console.log(
        JSON.stringify({
          verification: "GUARD_ONLY",
          activation_guard: "PASS",
          authenticated_requests: 0,
        }),
      );
    else console.log(JSON.stringify(await runApiVerification(), null, 2));
  } catch (error) {
    console.log(
      JSON.stringify(
        apiVerificationFailure(error, {
          guardPassed,
          tokenPresent: guardPassed && !!process.env.ALWAYSDATA_API_TOKEN,
        }),
      ),
    );
    process.exitCode = 1;
  }
}
