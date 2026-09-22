/**
 * Server-only configuration (secrets). Importing this module from a Client Component is a
 * build error thanks to `server-only`, so secrets cannot reach browser bundles.
 *
 * Values are read at runtime (not build time) and validated once, on first use.
 * instrumentation.ts also validates them at server start so misconfiguration fails fast.
 */
import "server-only";
import { getPublicEnv } from "./public";
import { parseServerEnv, type ServerEnv } from "./schema";

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env, getPublicEnv().NEXT_PUBLIC_APP_ENV);
  return cached;
}
