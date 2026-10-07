// Site startup: release-derived public configuration, provider-supplied listener only.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const __dirname = import.meta.dirname;
const release = JSON.parse(fs.readFileSync(path.join(__dirname, "release.json"), "utf8"));
if (!/^[a-f0-9]{40}$/.test(release.sha) || Number(process.versions.node.split(".")[0]) !== 22)
  throw new Error("Reviewed full release SHA and Node22 required");
if (
  !process.env.IP ||
  !process.env.PORT ||
  !/^\d+$/.test(process.env.PORT) ||
  Number(process.env.PORT) < 1 ||
  Number(process.env.PORT) > 65535
)
  throw new Error("Alwaysdata IP/PORT required");
for (const name of Object.keys(process.env)) {
  if (
    /^(PG|SUPABASE_|DATABASE_URL$|DIRECT_DATABASE_URL$|NEXT_PUBLIC_SUPABASE_)/.test(name) &&
    process.env[name]
  )
    throw new Error("Database/Supabase runtime configuration must remain unset: " + name);
}
Object.assign(process.env, {
  NODE_ENV: "production",
  HOSTNAME: process.env.IP,
  NEXT_PUBLIC_APP_ENV: "staging",
  NEXT_PUBLIC_APP_URL: "https://staging-tekaedu.tootiye.com",
  NEXT_PUBLIC_DEFAULT_LOCALE: "fr",
  NEXT_PUBLIC_DEFAULT_COUNTRY: "CD",
  NEXT_PUBLIC_ENABLE_ENGLISH_SCAFFOLDING: "true",
  NEXT_PUBLIC_ENABLE_CLOUD_SYNC: "false",
  AI_ENABLED: "false",
  NEXT_PUBLIC_GIT_SHA: release.sha,
});
process.chdir(__dirname);
await import(pathToFileURL(path.join(__dirname, "server.js")).href);
