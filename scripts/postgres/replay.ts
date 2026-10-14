import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { connectionFor, type Connection } from "@/lib/postgres/target";
import { Session } from "@/lib/postgres/session";
import { renderMigrationBatch } from "@/lib/postgres/batch";
import { isManagedAssertionFailure } from "./replay-errors";
import { accessSecurityRegression } from "./access-regression";
import { ROOT, loadMigrations, sha256, toolingDigest } from "@/lib/postgres/migrations";
import {
  apply,
  verify,
  list,
  initialize,
  LOCK_KEY,
  metadata,
  assertProductionApplicationShape,
  assertProductionHistoryShape,
} from "@/lib/postgres/runner";

/** Real production catalog guards against this replay's isolated CI fixture only. */
async function productionCatalogShapeRegression(connection: Connection) {
  assert.equal(connection.target, "local");
  assert(["127.0.0.1", "localhost"].includes(connection.host));
  assert.equal(connection.env.PGPORT, "5432");
  assert.equal(connection.database, "teka_portability");
  // CI already uses this bootstrap role on the same loopback service. No password
  // or passfile is supplied; hosted identities never reach this fixture session.
  const fixture = new Session({
    ...connection,
    login: "postgres",
    env: { ...connection.env, PGUSER: "postgres", PGPASSWORD: undefined, PGPASSFILE: "/dev/null" },
  });
  try {
    assert.equal(
      await fixture.json<boolean>(`select pg_catalog.to_jsonb(current_database()='teka_portability' and current_user='postgres'
        and current_setting('server_version_num')::integer >= 160000
        and current_setting('server_version_num')::integer < 170000);`),
      true,
      "production shape regressions require the isolated PG16 bootstrap fixture",
    );
    await fixture.query("begin; set local statement_timeout='120s'; set local lock_timeout='5s';");
    // pgTAP is CI-only and owned by bootstrap. Hide it inside this transaction;
    // ROLLBACK restores it before the unchanged pgTAP suites run below.
    await fixture.query("drop extension pgtap;");
    assert.equal(
      await fixture.json<boolean>(`select pg_catalog.to_jsonb(
        (select a.attnum=8 from pg_catalog.pg_attribute a where a.attrelid='public.curriculum_sources'::regclass and a.attname='published_on')
        and (select a.attnum=11 from pg_catalog.pg_attribute a where a.attrelid='public.activities'::regclass and a.attname='payload')
        and (select a.attnum=12 from pg_catalog.pg_attribute a where a.attrelid='public.activities'::regclass and a.attname='role')
        and (select count(*)=2 from pg_catalog.pg_index i join pg_catalog.pg_class c on c.oid=i.indexrelid
          where i.indrelid='teka_migrations.history'::regclass and c.relname in ('history_pkey','history_filename_key')));`),
      true,
      "physical column ordering and normal history indexes must match the reviewed fixture",
    );
    await assertProductionHistoryShape(fixture);
    await assertProductionApplicationShape(fixture);
    const probes = [
      {
        name: "application view",
        sql: "create view public.teka_shape_view_probe as select 1 as id;",
        guard: assertProductionApplicationShape,
      },
      {
        name: "application schema with a pg prefix",
        sql: "create schema pgcustom;",
        guard: assertProductionApplicationShape,
      },
      {
        name: "non-built-in application column type",
        sql: "create domain teka_migrations.teka_shape_text_probe as text; alter table public.education_stages alter column name type teka_migrations.teka_shape_text_probe;",
        guard: assertProductionApplicationShape,
      },
      {
        name: "unreviewed history index",
        sql: "create index teka_shape_history_index_probe on teka_migrations.history(adapter_version);",
        guard: assertProductionApplicationShape,
      },
      {
        name: "non-built-in history column type",
        sql: "create domain teka_migrations.teka_shape_text_probe as text; alter table teka_migrations.history alter column adapter_version type teka_migrations.teka_shape_text_probe;",
        guard: assertProductionHistoryShape,
      },
    ];
    for (const probe of probes) {
      await fixture.query("savepoint teka_production_shape_probe;");
      try {
        await fixture.query(probe.sql);
        await assert.rejects(
          probe.guard(fixture),
          /Production application catalog shape\/routine baseline drift|Unreviewed production history relation/,
          `${probe.name} must fail before managed row/definition reads`,
        );
      } finally {
        await fixture.query(
          "rollback to savepoint teka_production_shape_probe; release savepoint teka_production_shape_probe;",
        );
      }
      await assertProductionHistoryShape(fixture);
      await assertProductionApplicationShape(fixture);
    }
  } finally {
    try {
      await fixture.query("rollback;");
    } finally {
      fixture.close();
    }
  }
}

async function main() {
  const index = process.argv.indexOf("--output-dir");
  const directory = path.resolve(
    index < 0 ? path.join(ROOT, "test-results/postgres-portability") : process.argv[index + 1]!,
  );
  mkdirSync(directory, { recursive: true });
  const connection = connectionFor("local", process.env);
  const migrations = loadMigrations();
  for (const migration of migrations) renderMigrationBatch(migration.sql);
  const releaseSha = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  }).stdout.trim();
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
    await productionCatalogShapeRegression(connection);
    const securityRegression = await accessSecurityRegression(connection);

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
        "select to_jsonb(not exists(select 1 from pg_namespace where nspname='teka_rollback_probe'));",
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
        await assert.rejects(assertionProbe.query(sql), isManagedAssertionFailure);
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
    const migrationTimings = session.diagnostics().migration_batches;
    assert.equal(migrationTimings.length, 46);
    assert.deepEqual(
      migrationTimings.map((entry) => entry.version),
      migrations.map((entry) => entry.version),
    );
    assert(
      migrationTimings.every(
        (entry) => entry.write_completed_ms !== null && entry.acknowledgement_ms !== null,
      ),
    );
    const benchmarkBytes = readFileSync(path.join(directory, "transport-benchmark.json"));
    const benchmark = JSON.parse(benchmarkBytes.toString("utf8"));
    assert.equal(benchmark.status, "PASS");
    assert.equal(benchmark.release_sha, releaseSha);
    assert.equal(benchmark.source_clean, true);
    assert.equal(benchmark.tooling_sha256, toolingDigest());
    assert.equal(benchmark.native_parser_and_fingerprint_equivalence, true);
    assert.equal(benchmark.native_large_write_backpressure, true);
    assert.equal(benchmark.negative_P0001_and_atomic_failure, true);
    assert.equal(benchmark.results.length, 6);
    assert(
      benchmark.results.every(
        (result: {
          before: { migration_query_messages: number };
          after: { migration_query_messages: number };
        }) =>
          result.before.migration_query_messages === 104 &&
          result.after.migration_query_messages === 1,
      ),
    );
    const schemaText = JSON.stringify(replay.schema, null, 2) + "\n";
    writeFileSync(path.join(directory, "expected-schema.json"), schemaText);
    const evidence = {
      status: "PASS",
      recorded_at: new Date().toISOString(),
      transport_benchmark_sha256: sha256(benchmarkBytes),
      migration_transport: { mode: "psql-backslash-semicolon", batches: migrationTimings },
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
      access_security_regression: securityRegression,
      gates: {
        integrity: true,
        access: true,
        idempotency: true,
        pgtap: true,
        negative_tests: true,
        production_catalog_shapes: true,
        access_security_regressions: true,
        migration_batches: true,
        transport_benchmark: true,
      },
      negative_tests: {
        advisory_lock: true,
        recheck_after_lock: true,
        transaction_rollback: true,
        on_error_stop: true,
        unprivileged_read_denied: true,
        managed_assertion_failures: true,
        production_catalog_shape_rejections: true,
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
      "PASS: 46 migrations, 36 tables, 6170 rows; integrity/access/pgTAP/idempotency/production catalog shapes/negative tests.",
    );
  } finally {
    session.close();
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Clean replay failed");
  process.exitCode = 1;
});
