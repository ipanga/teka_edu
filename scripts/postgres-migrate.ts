import { writeFileSync } from "node:fs";
import { connectionFor } from "@/lib/postgres/target";
import { Session } from "@/lib/postgres/session";
import { loadMigrations } from "@/lib/postgres/migrations";
import {
  initialize,
  list,
  preflight,
  apply,
  verify,
  assertStagingGates,
  assertProductionGates,
} from "@/lib/postgres/runner";

async function main() {
  const args = process.argv.slice(2);
  const value = (name: string) => {
    const index = args.indexOf(name);
    return index < 0 ? undefined : args[index + 1];
  };
  const command = args[0];
  if (!command || !["list", "preflight", "apply", "verify"].includes(command))
    throw new Error(
      "Usage: db:migrate -- list|preflight|apply|verify --target local|staging|production",
    );
  const target = value("--target") ?? "";
  const releaseSha = value("--release-sha") ?? "";
  if (
    target === "production" &&
    (!args.includes("--production-approved") || !/^[a-f0-9]{40}$/.test(releaseSha))
  )
    throw new Error(
      "Every production command requires --production-approved and a full --release-sha",
    );
  if (args.includes("--password") && target !== "production")
    throw new Error(
      "Private Terminal password prompting is supported only for the explicit production target",
    );
  const connection = connectionFor(target, {
    ...process.env,
    TEKA_PRODUCTION_MIGRATIONS_APPROVED: args.includes("--production-approved") ? "true" : "false",
    TEKA_POSTGRES_PASSWORD_PROMPT: args.includes("--password") ? "true" : "false",
  });
  const migrations = loadMigrations();
  if (command === "apply" && connection.target === "staging")
    assertStagingGates(
      migrations,
      value("--replay-evidence"),
      value("--rollback-record"),
      args.includes("--rollback-approved"),
      value("--release-sha"),
    );
  const productionApproval = {
    approved: args.includes("--production-approved"),
    replayPath: value("--replay-evidence"),
    rollbackPath: value("--rollback-record"),
    recoveryPath: value("--source-recovery-record"),
  };
  if (connection.target === "production" && (command === "apply" || command === "verify"))
    assertProductionGates(migrations, productionApproval, releaseSha);
  const session = new Session(connection);
  try {
    await initialize(session, connection);
    const result =
      command === "list"
        ? await list(session, migrations, connection)
        : command === "preflight"
          ? await preflight(session, migrations, connection)
          : command === "apply"
            ? await apply(session, connection, migrations, releaseSha, productionApproval)
            : await verify(session, connection, migrations, releaseSha, productionApproval);
    // Production emits aggregate evidence only; ACL/object inventories remain private.
    const reported =
      connection.target === "production"
        ? command === "verify" && "canonical" in result && "recovery" in result
          ? {
              status: "PASS",
              release_sha: releaseSha,
              identity: result.identity,
              history: result.history,
              pending: result.pending,
              canonical: {
                tables: result.canonical.tables,
                rows: result.canonical.rows,
                exact: true,
              },
              schema_baseline_comparison: true,
              gates: { access: true, integrity: true, idempotency: true },
              recovery: result.recovery,
            }
          : {
              status: "PASS",
              release_sha: releaseSha,
              ...("identity" in result ? { identity: result.identity } : {}),
              ...("applied" in result ? { applied: result.applied } : {}),
              ...("pending" in result ? { pending: result.pending } : {}),
              ...("canonical" in result
                ? {
                    canonical: {
                      tables: result.canonical.tables,
                      rows: result.canonical.rows,
                      exact: true,
                    },
                  }
                : {}),
            }
        : result;
    const text =
      JSON.stringify(
        { recorded_at: new Date().toISOString(), target: connection.target, command, ...reported },
        null,
        2,
      ) + "\n";
    const output = value("--output");
    if (output)
      writeFileSync(
        output,
        text,
        connection.target === "production" ? { mode: 0o600, flag: "wx" } : undefined,
      );
    else console.log(text);
  } finally {
    session.close();
  }
}
main().catch((error: unknown) => {
  console.error(
    process.argv.includes("production")
      ? "Production command failed; no reset or retry was attempted"
      : error instanceof Error
        ? error.message
        : "Migration command failed",
  );
  process.exitCode = 1;
});
