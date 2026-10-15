import { writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import type { Connection } from "./target";

export type PasswordOperation =
  | "list"
  | "preflight"
  | "apply"
  | "verify"
  | "state-inspection"
  | "canonical-comparison"
  | "backup";
const operations: Record<PasswordOperation, string> = {
  list: "Read migration history and pending migration count",
  preflight: "Read-only database migration preflight",
  apply: "Apply reviewed migrations and canonical data; commit if all gates pass",
  verify: "Managed verification including temporary behavioral/idempotency writes that roll back",
  "state-inspection": "Read-only identity, migration-history count and application-table count",
  "canonical-comparison": "Read-only canonical data and schema comparison",
  backup: "Create the separately authorized standard PostgreSQL recovery backup",
};
export type PasswordIdentity =
  | { provider: "alwaysdata"; environment: "production" | "development" }
  | {
      provider: "supabase";
      environment: "production" | "development";
      ownerConfirmed: true;
      host: string;
      port: number;
      database: string;
      login: string;
    };

export function formatPasswordPrompt(identity: PasswordIdentity, operation: PasswordOperation) {
  const prod = identity.environment === "production";
  if (!["production", "development"].includes(identity.environment) || !operations[operation])
    throw new Error("Unreviewed password operation/target");
  const suffix = prod ? "prod" : "dev";
  const target =
    identity.provider === "alwaysdata"
      ? {
          host: "postgresql-congofoot.alwaysdata.net",
          port: 5432,
          database: `congofoot_teka_edu_${suffix}`,
          login: `congofoot_user_teka_edu_${suffix}`,
        }
      : identity;
  if (
    identity.provider !== "alwaysdata" &&
    (identity.provider !== "supabase" || identity.ownerConfirmed !== true)
  )
    throw new Error("Supabase identity requires owner-confirmed parameters");
  if (
    ![target.host, target.database, target.login].every((value) =>
      /^[A-Za-z0-9_.-]+$/.test(value),
    ) ||
    !Number.isInteger(target.port) ||
    target.port < 1 ||
    target.port > 65535
  )
    throw new Error("Invalid non-secret connection identity");
  const environment =
    identity.provider === "alwaysdata"
      ? `ALWAYSDATA ${prod ? "PRODUCTION (PROD)" : "DEVELOPMENT (DEV)"}`
      : `SUPABASE ${prod ? "PROD" : "DEV"}`;
  return [
    `ENVIRONMENT: ${environment}`,
    `Database: ${target.database}`,
    `PostgreSQL user: ${target.login}`,
    `Host: ${target.host}`,
    `Port: ${target.port}`,
    `Operation: ${operations[operation]}`,
    `Password required: ${identity.provider === "alwaysdata" ? "Alwaysdata" : "Supabase"} PostgreSQL ${prod ? "PROD" : "DEV"} password`,
    "Enter the password only at the subsequent native psql password prompt. Never enter it in chat or at the readiness question.",
    "",
  ].join("\n");
}

export function passwordIdentityFor(connection: Connection): PasswordIdentity {
  if (connection.target !== "production" && connection.target !== "staging")
    throw new Error("No reviewed interactive password identity for this target");
  const suffix = connection.target === "production" ? "prod" : "dev";
  if (
    connection.host !== "postgresql-congofoot.alwaysdata.net" ||
    connection.database !== `congofoot_teka_edu_${suffix}` ||
    connection.login !== `congofoot_user_teka_edu_${suffix}` ||
    connection.env.PGHOST !== connection.host ||
    connection.env.PGDATABASE !== connection.database ||
    connection.env.PGUSER !== connection.login ||
    connection.env.PGPORT !== "5432"
  )
    throw new Error("Password identity does not match the exact connection");
  return {
    provider: "alwaysdata",
    environment: connection.target === "production" ? "production" : "development",
  };
}

type PromptIO = { display: (message: string) => void; ready: (prompt: string) => Promise<string> };
const nativeIO: PromptIO = {
  // Explicit /dev/tty keeps identification out of redirected JSON/report streams.
  display(message) {
    writeFileSync("/dev/tty", message);
  },
  async ready(prompt) {
    if (!process.stdin.isTTY)
      throw new Error("Private native Terminal readiness confirmation required");
    writeFileSync("/dev/tty", prompt);
    const readline = createInterface({ input: process.stdin });
    try {
      return await readline.question("");
    } finally {
      readline.close();
      process.stdin.pause();
    }
  },
};

/** Confirmation reads only READY PROD/DEV, never the later psql password input. */
export async function preparePasswordPrompt(
  connection: Connection,
  operation: PasswordOperation,
  io: PromptIO = nativeIO,
) {
  const identity = passwordIdentityFor(connection);
  const banner = formatPasswordPrompt(identity, operation);
  io.display(banner);
  const expected = connection.target === "production" ? "READY PROD" : "READY DEV";
  if (
    (await io.ready(`When ready, type ${expected} (not the password), then Enter: `)) !== expected
  )
    throw new Error("Password readiness was not confirmed; no connection started");
  // Session invokes this synchronously immediately before spawning psql -W.
  return () => io.display(banner);
}
