/**
 * Environment variable schemas and validation.
 *
 * This module is pure (it never reads `process.env` itself) so it can be unit-tested and
 * shared by the public and server accessors:
 *   - lib/env/public.ts  → browser-safe NEXT_PUBLIC_* values (usable anywhere)
 *   - lib/env/server.ts  → server-only secrets (guarded by `server-only`)
 *
 * Error messages name the variable and the problem but never include its value.
 * The authoritative inventory is docs/ENVIRONMENT_VARIABLES.md.
 */
import { z } from "zod";
import { SUPABASE_PROJECT_REFS } from "./supabase-projects";

export const APP_ENVIRONMENTS = ["local", "staging", "production"] as const;
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];
type HostedEnvironment = Exclude<AppEnvironment, "local">;

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "host.docker.internal"]);

type RawEnv = Record<string, string | undefined>;

export class EnvValidationError extends Error {
  constructor(scope: "public" | "server", problems: readonly string[]) {
    super(
      `Invalid ${scope} environment configuration:\n${problems.map((p) => `  - ${p}`).join("\n")}`,
    );
    this.name = "EnvValidationError";
  }
}

// Empty values (`KEY=` in an .env file) are treated as unset.
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const fromEnv = <T extends z.ZodType>(schema: T) => z.preprocess(blankToUndefined, schema);

const flag = (defaultValue: boolean) =>
  fromEnv(z.stringbool({ truthy: ["true"], falsy: ["false"] }).default(defaultValue));

const httpUrl = z.url({ protocol: /^https?$/, message: "must be an http(s) URL" });

const postgresUrl = z.string().refine(
  (value) => {
    if (!/^postgres(ql)?:\/\//.test(value)) return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  {
    message:
      "must be a postgres:// or postgresql:// connection URL (percent-encode special characters in the password)",
  },
);

const isLocalHost = (url: string) => LOCAL_HOSTNAMES.has(new URL(url).hostname);

export type ProjectRefs = Readonly<Record<HostedEnvironment, string | null>>;

/** Returns the hosted environment whose known Supabase project ref appears in `value`. */
function knownProjectEnvironmentIn(
  value: string,
  refs: ProjectRefs,
): HostedEnvironment | undefined {
  const entries = Object.entries(refs) as [HostedEnvironment, string | null][];
  return entries.find(([, ref]) => ref !== null && value.includes(ref))?.[0];
}

type Issue = { path: string; message: string };

/** Rules shared by browser and server URLs: environments must not cross. */
function checkEnvironmentIsolation(
  appEnv: AppEnvironment,
  name: string,
  url: string,
  refs: ProjectRefs,
  issues: Issue[],
) {
  if (appEnv === "local") {
    if (!isLocalHost(url)) {
      issues.push({
        path: name,
        message:
          "must point at the local Supabase stack when NEXT_PUBLIC_APP_ENV=local (hosted projects are never used from local)",
      });
    }
    return;
  }
  if (isLocalHost(url)) {
    issues.push({
      path: name,
      message: `must not point at a local host when NEXT_PUBLIC_APP_ENV=${appEnv}`,
    });
  }
  const owner = knownProjectEnvironmentIn(url, refs);
  const expectedRef = refs[appEnv];
  if (owner !== undefined && owner !== appEnv) {
    issues.push({
      path: name,
      message: `points at the ${owner} Supabase project but NEXT_PUBLIC_APP_ENV=${appEnv}`,
    });
  } else if (expectedRef !== null && !url.includes(expectedRef)) {
    // Allowlist, not just denylist: once an environment's project is known, nothing else
    // (for example a third, unrelated project) is accepted.
    issues.push({
      path: name,
      message: `must use the ${appEnv} Supabase project (${expectedRef})`,
    });
  }
}

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: fromEnv(z.string().default("Teka Edu")),
  NEXT_PUBLIC_DEFAULT_LOCALE: fromEnv(z.enum(["fr", "en"]).default("fr")),
  NEXT_PUBLIC_DEFAULT_COUNTRY: fromEnv(
    z
      .string()
      .regex(/^[A-Z]{2}$/, { message: "must be an ISO 3166-1 alpha-2 country code" })
      .default("CD"),
  ),
  NEXT_PUBLIC_APP_ENV: fromEnv(z.enum(APP_ENVIRONMENTS).default("local")),
  NEXT_PUBLIC_APP_URL: fromEnv(httpUrl.default("http://localhost:3000")),
  NEXT_PUBLIC_SUPABASE_URL: fromEnv(httpUrl.optional()),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: fromEnv(z.string().optional()),
  NEXT_PUBLIC_ENABLE_ENGLISH_SCAFFOLDING: flag(true),
  NEXT_PUBLIC_ENABLE_CLOUD_SYNC: flag(false),
  NEXT_PUBLIC_GIT_SHA: fromEnv(
    z
      .string()
      .regex(/^[0-9a-f]{7,40}$/, { message: "must be a git commit SHA" })
      .optional(),
  ),
});

/** Cross-variable rules, evaluated together so every problem is reported at once. */
function checkPublicEnv(env: PublicEnv, refs: ProjectRefs): Issue[] {
  const issues: Issue[] = [];
  const appEnv = env.NEXT_PUBLIC_APP_ENV;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (key !== undefined) {
    if (key.startsWith("sb_secret_")) {
      issues.push({
        path: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        message:
          "contains a Supabase SECRET key. NEXT_PUBLIC_* values are sent to browsers: remove it and rotate the key.",
      });
    } else if (!key.startsWith("sb_publishable_")) {
      issues.push({
        path: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        message: "must be a Supabase publishable key (sb_publishable_…)",
      });
    }
  }

  if (env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC || url !== undefined || key !== undefined) {
    const reason = env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC
      ? "is required when NEXT_PUBLIC_ENABLE_CLOUD_SYNC=true"
      : "is required when the other Supabase browser variable is set";
    if (url === undefined) issues.push({ path: "NEXT_PUBLIC_SUPABASE_URL", message: reason });
    if (key === undefined) {
      issues.push({ path: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", message: reason });
    }
  }

  if (url !== undefined) {
    checkEnvironmentIsolation(appEnv, "NEXT_PUBLIC_SUPABASE_URL", url, refs, issues);
    if (appEnv !== "local" && !url.startsWith("https://")) {
      issues.push({ path: "NEXT_PUBLIC_SUPABASE_URL", message: "must use https outside local" });
    }
  }

  if (appEnv !== "local" && isLocalHost(env.NEXT_PUBLIC_APP_URL)) {
    issues.push({
      path: "NEXT_PUBLIC_APP_URL",
      message: `must be the public URL of the ${appEnv} deployment, not a local host`,
    });
  }

  return issues;
}

const serverEnvSchema = z.object({
  SUPABASE_SECRET_KEY: fromEnv(
    z
      .string()
      .startsWith("sb_secret_", { message: "must be a Supabase secret key (sb_secret_…)" })
      .optional(),
  ),
  DATABASE_URL: fromEnv(postgresUrl.optional()),
  DIRECT_DATABASE_URL: fromEnv(postgresUrl.optional()),
  AI_ENABLED: flag(false).refine((enabled) => !enabled, {
    message: "must be false: V1 has no runtime AI features (ADR-002)",
  }),
});

export type PublicEnv = z.output<typeof publicEnvSchema>;
export type ServerEnv = z.output<typeof serverEnvSchema>;

function describeIssues(error: z.ZodError): string[] {
  // Only the path and our/Zod's message are reported: never the input value.
  return error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
}

function throwIfAny(scope: "public" | "server", issues: readonly Issue[]) {
  if (issues.length > 0) {
    throw new EnvValidationError(
      scope,
      issues.map((i) => `${i.path}: ${i.message}`),
    );
  }
}

export function parsePublicEnv(raw: RawEnv, refs: ProjectRefs = SUPABASE_PROJECT_REFS): PublicEnv {
  const result = publicEnvSchema.safeParse(raw);
  if (!result.success) throw new EnvValidationError("public", describeIssues(result.error));

  throwIfAny("public", checkPublicEnv(result.data, refs));
  return result.data;
}

export function parseServerEnv(
  raw: RawEnv,
  appEnv: AppEnvironment,
  refs: ProjectRefs = SUPABASE_PROJECT_REFS,
): ServerEnv {
  const result = serverEnvSchema.safeParse(raw);
  if (!result.success) throw new EnvValidationError("server", describeIssues(result.error));

  const issues: Issue[] = [];
  for (const name of ["DATABASE_URL", "DIRECT_DATABASE_URL"] as const) {
    const value = result.data[name];
    if (value !== undefined) checkEnvironmentIsolation(appEnv, name, value, refs, issues);
  }
  throwIfAny("server", issues);
  return result.data;
}
