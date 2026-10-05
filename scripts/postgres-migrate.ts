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
} from "@/lib/postgres/runner";

async function main() {
  const args = process.argv.slice(2);
  const value = (name: string) => {
    const index = args.indexOf(name);
    return index < 0 ? undefined : args[index + 1];
  };
  const command = args[0];
  if (!command || !["list", "preflight", "apply", "verify"].includes(command))
    throw new Error("Usage: db:migrate -- list|preflight|apply|verify --target local|staging");
  const connection = connectionFor(value("--target") ?? "", process.env);
  const migrations = loadMigrations();
  if (command === "apply" && connection.target === "staging")
    assertStagingGates(
      migrations,
      value("--replay-evidence"),
      value("--rollback-record"),
      args.includes("--rollback-approved"),
      value("--release-sha"),
    );
  const session = new Session(connection);
  try {
    await initialize(session, connection);
    const result =
      command === "list"
        ? await list(session, migrations, connection)
        : command === "preflight"
          ? await preflight(session, migrations, connection)
          : command === "apply"
            ? await apply(session, connection, migrations, value("--release-sha") ?? "")
            : await verify(session, connection, migrations);
    const text =
      JSON.stringify(
        { recorded_at: new Date().toISOString(), target: connection.target, command, ...result },
        null,
        2,
      ) + "\n";
    const output = value("--output");
    if (output) writeFileSync(output, text);
    else console.log(text);
  } finally {
    session.close();
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Migration command failed");
  process.exitCode = 1;
});
