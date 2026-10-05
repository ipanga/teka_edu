import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { connectionFor } from "@/lib/postgres/target";
import { Session } from "@/lib/postgres/session";
import { ROOT, loadMigrations, sha256, toolingDigest } from "@/lib/postgres/migrations";
import { apply, verify, list, initialize, LOCK_KEY, metadata } from "@/lib/postgres/runner";

async function main() {
  const index = process.argv.indexOf("--output-dir");
  const directory = path.resolve(
    index < 0 ? path.join(ROOT, "test-results/postgres-portability") : process.argv[index + 1]!,
  );
  mkdirSync(directory, { recursive: true });
  const connection = connectionFor("local", process.env);
  const migrations = loadMigrations();
  const releaseSha =
    process.env.GITHUB_SHA ??
    spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  const session = new Session(connection);
  try {
    const server = await initialize(session, connection);
    assert.equal(
      (await list(session, migrations, connection)).pending,
      46,
      "clean database required",
    );
    const replay = await apply(session, connection, migrations, releaseSha);
    assert.equal(replay.applied, 46);
    const checked = await verify(session, connection, migrations);
    assert.equal(checked.history, 46);
    assert.equal(checked.canonical.tables, 36);
    assert.equal(checked.canonical.rows, 6170);
    assert.equal(
      (await apply(session, connection, migrations, releaseSha)).applied,
      0,
      "second apply must be a no-op",
    );

    // Re-read-after-lock regression: an earlier listing is green, but another operator
    // corrupts history before the blocked application session obtains the lock.
    const blocker = new Session(connection);
    await initialize(blocker, connection);
    await blocker.query(`begin; select pg_advisory_xact_lock(${LOCK_KEY}::bigint);`);
    const waiting = new Session(connection);
    await initialize(waiting, connection);
    let settled = false;
    const blocked = apply(waiting, connection, migrations, releaseSha).then(
      () => {
        settled = true;
        return null;
      },
      (error: unknown) => {
        settled = true;
        return error;
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(settled, false, "concurrent apply must wait on lock");
    await blocker.query(
      `update teka_migrations.history set execution_sha256=repeat('0',64) where version='${migrations[0]!.version}'; commit;`,
    );
    const rejection = await blocked;
    assert(
      rejection instanceof Error && /checksum/.test(rejection.message),
      "history must be re-read after lock",
    );
    waiting.close();
    await blocker.query(
      `update teka_migrations.history set execution_sha256='${migrations[0]!.execution_sha256}' where version='${migrations[0]!.version}';`,
    );
    blocker.close();

    // ON_ERROR_STOP causes connection termination and PostgreSQL rolls back all pending DDL.
    const failing = new Session(connection);
    await initialize(failing, connection);
    await assert.rejects(
      failing.query(
        "begin; create schema teka_rollback_probe; create table teka_rollback_probe.x(id integer); select no_such_function(); commit;",
      ),
    );
    failing.close();
    assert.equal(
      await session.json<boolean>(
        "select not exists(select 1 from pg_namespace where nspname='teka_rollback_probe');",
      ),
      true,
    );
    const probe = spawnSync(
      "psql",
      [
        "-X",
        "-qAt",
        "--no-password",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        "select 1 from public.school_years;",
      ],
      { env: { ...connection.env, PGUSER: "teka_probe" }, encoding: "utf8" },
    );
    assert.notEqual(probe.status, 0);
    assert.match(probe.stderr, /permission denied/);

    // Managed equivalents must fail on semantic errors, not merely count SQL calls.
    for (const sql of [
      "select pg_temp.throws_ok('select 1','23514',null,'unexpected success');",
      "select pg_temp.throws_ok('select 1/0','23514',null,'wrong SQLSTATE');",
      "select pg_temp.lives_ok('select 1/0','failure');",
      "select pg_temp.results_eq('values (1),(2)','values (2),(1)','wrong order');",
      "select pg_temp.bag_eq('values (1),(1)','values (1)','missing duplicate');",
      "select * from pg_temp.finish();",
    ]) {
      const assertionProbe = new Session(connection);
      try {
        await initialize(assertionProbe, connection);
        await assertionProbe.query(
          readFileSync(path.join(ROOT, "scripts/postgres/assertions.sql"), "utf8"),
        );
        await assertionProbe.query("select pg_temp.plan(1);");
        await assert.rejects(assertionProbe.query(sql), /Assertion (failed|count mismatch)/);
      } finally {
        assertionProbe.close();
      }
    }

    const pgtap = spawnSync(
      "pg_prove",
      [
        "--verbose",
        ...[
          "educational_foundation.test.sql",
          "curriculum_lessons.test.sql",
          "reference_data.test.sql",
        ].map((name) => path.join(ROOT, "supabase/tests/database", name)),
        path.join(ROOT, "scripts/postgres/access.test.sql"),
      ],
      {
        env: { ...connection.env, PGOPTIONS: "-c search_path=public,extensions" },
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024,
      },
    );
    writeFileSync(path.join(directory, "pgtap.txt"), pgtap.stdout + pgtap.stderr);
    assert.equal(pgtap.status, 0, "portable pgTAP suites must pass; inspect pgtap.txt");
    await verify(session, connection, migrations);
    const schemaText = JSON.stringify(replay.schema, null, 2) + "\n";
    writeFileSync(path.join(directory, "expected-schema.json"), schemaText);
    const evidence = {
      status: "PASS",
      recorded_at: new Date().toISOString(),
      release_sha: releaseSha,
      tooling_sha256: toolingDigest(),
      server,
      migrations: metadata(migrations),
      canonical: checked.canonical,
      schema_sha256: sha256(JSON.stringify(replay.schema)),
      extensions: replay.schema.extensions,
      integrity: checked.integrity,
      access: checked.access,
      idempotency: checked.idempotency,
      gates: {
        integrity: true,
        access: true,
        idempotency: true,
        pgtap: true,
        negative_tests: true,
      },
      negative_tests: {
        advisory_lock: true,
        recheck_after_lock: true,
        transaction_rollback: true,
        on_error_stop: true,
        unprivileged_read_denied: true,
        managed_assertion_failures: true,
      },
      schema_baseline_comparison: existsSync(
        path.join(ROOT, "docs/migration/alwaysdata/expected-schema.json"),
      ),
    };
    writeFileSync(
      path.join(directory, "postgres16-replay.json"),
      JSON.stringify(evidence, null, 2) + "\n",
    );
    console.log(
      "PASS: 46 migrations, 36 tables, 6170 rows; integrity/access/pgTAP/idempotency/negative tests.",
    );
  } finally {
    session.close();
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Clean replay failed");
  process.exitCode = 1;
});
