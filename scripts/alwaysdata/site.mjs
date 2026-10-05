import { pathToFileURL } from "node:url";
export const SITE_ID = 1083502;
export const STAGING_URL = "https://staging-tekaedu.tootiye.com";
export const SITE_COMMAND = "/usr/alwaysdata/nodejs/22/bin/node current/runtime.mjs";
export function assertSite(site) {
  const directory = (site.working_directory ?? "")
    .replace(/^\/home\/congofoot\//, "")
    .replace(/^\//, "")
    .replace(/\/$/, "");
  if (
    site.id !== SITE_ID ||
    site.type !== "nodejs" ||
    directory !== "www/tekaedu-staging" ||
    site.command !== SITE_COMMAND ||
    String(site.nodejs_version) !== "22" ||
    !Array.isArray(site.addresses) ||
    site.addresses.length !== 1 ||
    site.addresses[0] !== "staging-tekaedu.tootiye.com"
  )
    throw new Error(
      "Expected staging site identity/runtime does not match; owner configuration required",
    );
  const environment = site.environment ?? "";
  if (
    /\b(PG\w*|DATABASE_URL|DIRECT_DATABASE_URL|SUPABASE_\w*|NEXT_PUBLIC_SUPABASE_\w*)\s*=/.test(
      environment,
    )
  )
    throw new Error("Site environment contains SQL/Supabase runtime configuration");
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
export async function siteAction(action) {
  const token = process.env.ALWAYSDATA_API_TOKEN;
  if (!token) throw new Error("Missing ALWAYSDATA_API_TOKEN");
  const headers = {
    Authorization: "Basic " + Buffer.from(token + " account=congofoot:").toString("base64"),
  };
  const base = "https://api.alwaysdata.com/v1/site/" + SITE_ID + "/";
  const response = await fetch(base, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Staging site identity request failed");
  assertSite(await response.json());
  if (action === "restart") {
    const restarted = await fetch(base + "restart/", {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(15000),
    });
    if (!restarted.ok) throw new Error("Staging restart request failed");
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [action, sha] = process.argv.slice(2);
  if (!["inspect", "restart", "health"].includes(action))
    throw new Error("Explicit site action required");
  if (action === "health") {
    if (!/^[a-f0-9]{40}$/.test(sha ?? "")) throw new Error("Full SHA required");
    await waitHealth(sha);
  } else await siteAction(action);
  console.log("PASS: staging " + action);
}
