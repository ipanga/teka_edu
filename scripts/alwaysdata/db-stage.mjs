import { writeFileSync } from "node:fs";
import path from "node:path";
import { connectionFor } from "../../lib/postgres/target.ts";
import { Session } from "../../lib/postgres/session.ts";
import { loadMigrations } from "../../lib/postgres/migrations.ts";
import {
  initialize,
  preflight,
  apply,
  verify,
  assertStagingGates,
} from "../../lib/postgres/runner.ts";
const root = process.env.TEKA_POSTGRES_ROOT;
const sha = process.env.TEKA_RELEASE_SHA;
if (!root || !/^[a-f0-9]{40}$/.test(sha ?? ""))
  throw new Error("Protected tool root and exact SHA required");
const connection = connectionFor("staging", process.env);
const migrations = loadMigrations();
assertStagingGates(
  migrations,
  path.join(root, "replay.json"),
  path.join(root, "rollback.json"),
  process.env.ALWAYSDATA_DEV_MIGRATIONS_APPROVED === "true",
  sha,
);
const session = new Session(connection);
try {
  await initialize(session, connection);
  const before = await preflight(session, migrations, connection);
  // First bootstrap was separately authorized and completed. CD may not reconstruct/reset it.
  if (before.applied !== 46 || before.pending !== 0)
    throw new Error(
      "CD requires reviewed46-migration DEV history with zero pending; stop for separate review",
    );
  const result = await apply(session, connection, migrations, sha);
  if (result.applied !== 0) throw new Error("Unexpected CD schema mutation");
  const checked = await verify(session, connection, migrations);
  writeFileSync(
    path.join(root, "managed-verification.json"),
    JSON.stringify({ status: "PASS", release_sha: sha, ...checked }, null, 2) + "\n",
  );
  console.log("PASS: DEV identity/history/integrity/access/idempotency; zero schema migrations");
} finally {
  session.close();
}
