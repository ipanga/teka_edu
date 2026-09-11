/**
 * Browser-safe configuration, read on the SERVER at runtime (ADR-025).
 *
 * Values come from the running container's environment (Vercel project variables, `docker
 * run -e`, …), never from build-time inlining: Vercel's container builder passes no build
 * arguments, and runtime reading lets one image serve every environment. The NEXT_PUBLIC_
 * prefix still marks "safe for browsers", but browser code must receive values explicitly
 * from a Server Component: it cannot read them itself. Never access a NEXT_PUBLIC_ variable
 * as a literal member of process.env anywhere (Next.js would freeze it at build time); a
 * unit test (tests/unit/runtime-config.test.ts) enforces this.
 *
 * Validated on first use; instrumentation.ts also validates at server start (fail fast).
 */
import "server-only";
import { parsePublicEnv, type PublicEnv } from "./schema";

let cached: PublicEnv | undefined;

export function getPublicEnv(): PublicEnv {
  cached ??= parsePublicEnv(process.env);
  return cached;
}
