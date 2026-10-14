import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectionFor } from "@/lib/postgres/target";
import { Session } from "@/lib/postgres/session";
import { preparePasswordPrompt, type PasswordOperation } from "@/lib/postgres/password-prompt";
import { loadMigrations } from "@/lib/postgres/migrations";
import { renderMigrationBatch } from "@/lib/postgres/batch";
import { sanitizedAccessFailure } from "@/lib/postgres/access-result";
import {
  initialize,
  list,
  preflight,
  apply,
  verify,
  assertStagingGates,
  assertProductionGates,
} from "@/lib/postgres/runner";

export async function main(args = process.argv.slice(2)): Promise<number> {
  let session: Session | undefined;
  let phase = "LOCAL_PREFLIGHT";
  let reportedTarget = "UNVERIFIED";
  let reportedCommand = "UNVERIFIED";
  let output: string | undefined;
  try {
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
    if (["local", "staging", "production"].includes(target)) reportedTarget = target;
    reportedCommand = command;
    if (target === "production" && command === "apply" && !args.includes("--initialization-only"))
      throw new Error("Initial production apply requires --initialization-only");
    const timeout = value("--execution-timeout-seconds");
    if (target === "production" && ["apply", "verify"].includes(command) && timeout === undefined)
      throw new Error("Production apply/verify require an explicit bounded client deadline");
    if (
      timeout !== undefined &&
      (target !== "production" ||
        !/^[0-9]+$/.test(timeout) ||
        Number(timeout) < 1 ||
        Number(timeout) > 3600)
    )
      throw new Error("Production client deadline must be 1–3600 seconds");
    const deadlineMs = timeout === undefined ? undefined : Number(timeout) * 1000;
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
      TEKA_PRODUCTION_MIGRATIONS_APPROVED: args.includes("--production-approved")
        ? "true"
        : "false",
      TEKA_POSTGRES_PASSWORD_PROMPT: args.includes("--password") ? "true" : "false",
    });
    const migrations = loadMigrations();
    if (command === "apply")
      for (const migration of migrations) renderMigrationBatch(migration.sql);
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
      initializationOnly: args.includes("--initialization-only"),
      replayPath: value("--replay-evidence"),
      rollbackPath: value("--rollback-record"),
      recoveryPath: value("--source-recovery-record"),
    };
    if (connection.target === "production" && (command === "apply" || command === "verify"))
      assertProductionGates(migrations, productionApproval, releaseSha);
    output = value("--output");
    phase = "PASSWORD_READINESS";
    const beforePasswordPrompt = args.includes("--password")
      ? await preparePasswordPrompt(connection, command as PasswordOperation)
      : undefined;
    phase = "CLIENT_START";
    session = new Session(connection, { beforePasswordPrompt, deadlineMs });
    phase = "INITIALIZE";
    await initialize(session, connection);
    phase = command.toUpperCase();
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
    phase = "CLIENT_CLOSE";
    const closed = await session.close();
    if (
      !closed.client_exit.observed ||
      closed.client_exit.code !== 0 ||
      closed.client_exit.signal !== null ||
      closed.failure !== null
    )
      throw new Error("Client did not close successfully");
    phase = "RESULT_WRITE";
    const text =
      JSON.stringify(
        {
          recorded_at: new Date().toISOString(),
          target: connection.target,
          command,
          ...reported,
          diagnostics: session.diagnostics(),
        },
        null,
        2,
      ) + "\n";
    if (output)
      writeFileSync(
        output,
        text,
        connection.target === "production" ? { mode: 0o600, flag: "wx" } : undefined,
      );
    else console.log(text);
    return 0;
  } catch (error: unknown) {
    // Never serialize Error.message, SQL, stderr, paths or credential-bearing arguments.
    if (session) {
      try {
        await session.close();
      } catch {
        /* Preserve the original stage and fixed diagnostics if cleanup fails. */
      }
    }
    const report = {
      recorded_at: new Date().toISOString(),
      status: "FAIL",
      target: reportedTarget,
      command: reportedCommand,
      failure_stage: phase,
      application_failure: sanitizedAccessFailure(error),
      diagnostics: session?.diagnostics() ?? null,
      automatic_retries: 0,
      reset_or_restore_attempted: false,
    };
    const text = JSON.stringify(report, null, 2) + "\n";
    if (output) {
      try {
        writeFileSync(output, text, { mode: 0o600, flag: "wx" });
      } catch {
        /* Keep prior evidence intact; stderr retains the same sanitized result. */
      }
    }
    console.error(text.trim());
    return 1;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch(() => {
      console.error("POSTGRES_COMMAND_FAILED; sanitized report unavailable; no retry attempted");
      process.exitCode = 1;
    });
}
