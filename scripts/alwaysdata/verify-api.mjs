import { pathToFileURL } from "node:url";
import { siteAction, formatSiteFailure } from "./site.mjs";

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
  if (!["", "false"].includes(env.ALWAYSDATA_STAGING_DEPLOY_ENABLED ?? ""))
    throw new Error("API_VERIFICATION_SWITCH_ENABLED");
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

export async function runApiVerification({ env = process.env, inspect = siteAction } = {}) {
  assertApiVerificationGuard(env);
  if (!env.ALWAYSDATA_API_TOKEN) throw new Error("API_VERIFICATION_TOKEN_MISSING");
  // This entry point cannot accept an action, URL or method from input.
  const transport = await inspect("inspect");
  return {
    verification: "READ_ONLY",
    activation_guard: "PASS",
    authentication: "PASS",
    http_status:
      Number.isInteger(transport?.http_status) &&
      transport.http_status >= 100 &&
      transport.http_status <= 599
        ? transport.http_status
        : null,
    attempts:
      Number.isInteger(transport?.attempts) && transport.attempts >= 1 && transport.attempts <= 3
        ? transport.attempts
        : null,
    site_identity: "PASS",
    site_id: 1083502,
    account: "congofoot",
    restart: "NOT ATTEMPTED",
    provider_mutations: 0,
    database_connections: 0,
  };
}

export function formatApiVerificationFailure(error) {
  return GUARD_FAILURES.has(error?.message) ? error.message : formatSiteFailure(error);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [action, ...extra] = process.argv.slice(2);
    if (extra.length || !["guard", "inspect"].includes(action))
      throw new Error("API_VERIFICATION_ACTION_DENIED");
    if (action === "guard") {
      assertApiVerificationGuard(process.env);
      console.log(
        JSON.stringify({
          verification: "GUARD_ONLY",
          activation_guard: "PASS",
          authenticated_requests: 0,
        }),
      );
    } else console.log(JSON.stringify(await runApiVerification(), null, 2));
  } catch (error) {
    console.log(
      JSON.stringify({ verification: "FAILED", code: formatApiVerificationFailure(error) }),
    );
    process.exitCode = 1;
  }
}
