import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { PostgresClientError, Session } from "@/lib/postgres/session";
import { connectionFor } from "@/lib/postgres/target";
import { initialize } from "@/lib/postgres/runner";
import { toolingDigest } from "@/lib/postgres/migrations";

const digest = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");

/** CI/synthetic loopback fixture only. Never admits a hosted DB or credentials. */
function fixtureConnection() {
  if ("PGPASSWORD" in process.env || "PGSERVICE" in process.env || "PGSERVICEFILE" in process.env)
    throw new Error("Benchmark credential/service overrides are forbidden");
  const c = connectionFor("local", process.env);
  assert.equal(
    c.env.PGSSLMODE,
    "disable",
    "Protocol measurement requires isolated non-TLS loopback",
  );
  c.env.PGPASSFILE = "/dev/null";
  return c;
}

/** Adds a fixed delay per frontend Query, counting only message types and hashes.
 * No SQL/results/credentials are logged; both sockets are bounded and loopback-only.
 */
async function proxy(port: number, delayMs: number) {
  let count = 0;
  const hashes: string[] = [];
  const sockets = new Set<net.Socket>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let failure = false;
  const server = net.createServer((front) => {
    sockets.add(front);
    const back = net.createConnection({ host: "127.0.0.1", port });
    sockets.add(back);
    let buffer = Buffer.alloc(0);
    let startup = true;
    const abort = () => {
      failure = true;
      front.destroy();
      back.destroy();
    };
    front.on("error", abort);
    back.on("error", abort);
    front.on("close", () => {
      sockets.delete(front);
      back.destroy();
    });
    back.on("close", () => {
      sockets.delete(back);
      front.end();
    });
    back.on("data", (bytes) => {
      if (!front.write(bytes)) back.pause();
    });
    front.on("drain", () => back.resume());
    back.on("drain", () => front.resume());
    front.on("data", (bytes) => {
      buffer = Buffer.concat([buffer, bytes]);
      if (buffer.length > 8 * 1024 * 1024) {
        abort();
        return;
      }
      while (buffer.length >= (startup ? 4 : 5)) {
        const offset = startup ? 0 : 1;
        const length = buffer.readUInt32BE(offset);
        if (length < 4 || length > 8 * 1024 * 1024) {
          abort();
          return;
        }
        const total = length + offset;
        if (buffer.length < total) return;
        const frame = buffer.subarray(0, total);
        buffer = buffer.subarray(total);
        if (startup) {
          if (length < 8 || frame.readUInt32BE(4) !== 196608) {
            abort();
            return;
          }
          startup = false;
        } else if (frame[0] === 81) {
          count++;
          if (hashes.length >= 1024) {
            abort();
            return;
          }
          hashes.push(digest(frame.subarray(5, -1).toString("utf8").trim()));
        }
        const query = offset === 1 && frame[0] === 81;
        const forward = () => {
          if (!back.destroyed && !back.write(frame)) front.pause();
        };
        if (query && delayMs) {
          front.pause();
          const timer = setTimeout(() => {
            timers.delete(timer);
            forward();
            if (!back.writableNeedDrain) front.resume();
          }, delayMs);
          timers.add(timer);
        } else forward();
      }
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert(address && typeof address === "object");
  return {
    port: address.port,
    stats: () => ({ query_messages: count, hashes: [...hashes], protocol_failure: failure }),
    async close() {
      for (const timer of timers) clearTimeout(timer);
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

const setup = `create temporary table teka_transport_values(id integer primary key, value text not null);
create temporary table teka_transport_history(version text primary key);`;
const migration = `/* nested ; /* inner ; */ safe */
create function pg_temp.teka_transport_function() returns text language plpgsql as $body$
begin return 'quoted;function'; end;
$body$;
do $body$ begin if pg_temp.teka_transport_function() <> 'quoted;function' then raise exception 'fixture failure'; end if; end; $body$;
${Array.from({ length: 100 }, (_, i) => `insert into pg_temp.teka_transport_values values (${i + 1},'é;🥭');`).join("\n")}
insert into pg_temp.teka_transport_values values (101,E'escape\\\';value'),(102,U&'d\\0061;ta'),(103,$tag$literal; :var \\echo$tag$);
insert into pg_temp.teka_transport_history values ('20260101000000');`;
const signature = `select jsonb_build_object('rows',count(*),'sum',sum(id),'hash',md5(string_agg(value,'|' order by id)),
'history',(select count(*) from pg_temp.teka_transport_history)) from pg_temp.teka_transport_values;`;

async function runCase(mode: "previous-stdin" | "migration-batched", delayMs: number) {
  const upstream = fixtureConnection();
  const transport = await proxy(Number(upstream.env.PGPORT), delayMs);
  const c = connectionFor("local", { ...upstream.env, PGPORT: String(transport.port) });
  const session = new Session(c, { deadlineMs: 15000 });
  try {
    const identity = await initialize(session, c);
    await session.query("begin;");
    await session.query(setup);
    const initial = transport.stats().query_messages;
    const started = performance.now();
    // The raw QUERY path is the previous stdin framing, admitted only in this local benchmark.
    if (mode === "previous-stdin") await session.query(migration);
    else await session.query(migration, "MIGRATION", "20260101000000");
    const duration = performance.now() - started;
    const messages = transport.stats().query_messages - initial;
    const fingerprint = await session.json<{
      rows: number;
      sum: number;
      hash: string;
      history: number;
    }>(signature);
    assert.equal(fingerprint.rows, 103);
    assert.equal(fingerprint.history, 1);
    await session.query("rollback;");
    assert.equal(
      await session.json<boolean>(
        "select to_jsonb(to_regclass('pg_temp.teka_transport_values') is null and to_regclass('pg_temp.teka_transport_history') is null);",
      ),
      true,
    );
    const closed = await session.close();
    assert.equal(closed.client_exit.code, 0);
    assert.equal(closed.failure, null);
    assert.equal(closed.transaction.commit_sent, 0);
    assert.equal(closed.transaction.rollback_acknowledged, 1);
    const stats = transport.stats();
    assert.equal(stats.protocol_failure, false);
    if (mode === "migration-batched") {
      assert.equal(messages, 1, "Whole migration must be one observable frontend Query");
      assert.equal(
        stats.hashes.filter((hash) => hash === digest(migration.trim())).length,
        1,
        "Server Query must preserve original migration SQL exactly after psql escape handling",
      );
      assert.equal(closed.migration_batches[0]?.write_completed_ms !== null, true);
      assert.equal(closed.migration_batches[0]?.acknowledgement_ms !== null, true);
    } else
      assert.equal(messages, 104, "Baseline must preserve previous per-statement request behavior");
    return {
      mode,
      simulated_delay_per_query_ms: delayMs,
      migration_query_messages: messages,
      migration_elapsed_ms: Math.round(duration * 100) / 100,
      fingerprint,
      server_version: identity.version,
      rollback_acknowledged: true,
      client_exit: 0,
      server_SQL_hash_exact: mode === "migration-batched",
    };
  } finally {
    await session.close();
    await transport.close();
  }
}

async function nativeLargeAndLexicalRegression() {
  const c = fixtureConnection();
  const session = new Session(c, { deadlineMs: 10000 });
  try {
    await initialize(session, c);
    await session.query("begin;");
    const value = "x".repeat(1024 * 1024);
    await session.query(
      String.raw`create temporary table teka_transport_large("semi;colon" text);
insert into pg_temp.teka_transport_large values ('${value}');
do $🥭$ begin perform U&'d\0061;ta'; perform E'it\'s;ok'; end; $🥭$;`,
      "MIGRATION",
      "20260101000002",
    );
    assert.deepEqual(
      await session.json(
        "select jsonb_build_object('bytes',octet_length(\"semi;colon\"),'hash',md5(\"semi;colon\")) from pg_temp.teka_transport_large;",
      ),
      { bytes: value.length, hash: createHash("md5").update(value).digest("hex") },
    );
    const timing = session.diagnostics().migration_batches[0]!;
    assert.equal(timing.backpressure, true);
    assert(
      timing.write_completed_ms !== null &&
        timing.drain_completed_ms !== null &&
        timing.acknowledgement_ms !== null,
    );
    await session.query("rollback;");
    const closed = await session.close();
    assert.equal(closed.client_exit.code, 0);
    assert.equal(closed.failure, null);
    assert.equal(closed.transaction.rollback_acknowledged, 1);
  } finally {
    await session.close();
  }
}

async function failureRegression() {
  const c = fixtureConnection();
  const session = new Session(c, { deadlineMs: 10000 });
  try {
    await initialize(session, c);
    await session.query("begin;");
    const failedInput = `create table public.teka_transport_failure(id int);
insert into public.teka_transport_failure values (1);
do $test$ begin raise exception 'private fixture diagnostic'; end; $test$;
${Array.from({ length: 20 }, () => `select '${"x".repeat(65536)}';`).join("\n")}`;
    let rejected: unknown;
    try {
      await session.query(failedInput, "MIGRATION", "20260101000001");
    } catch (error) {
      rejected = error;
    }
    assert(
      rejected instanceof PostgresClientError,
      "Server failure must remain structured and sanitized",
    );
    // A partial large write may reject before final stderr. Inspect the final sanitized
    // state after observed close instead of matching an early exception-message snapshot.
    const closed = await session.close();
    assert.equal(closed.failure?.classification, "SQLSTATE_ERROR");
    assert.equal(closed.failure.sqlstate, "P0001");
    assert.equal(closed.failure.phase, "DURING_TRANSACTION");
    assert.equal(closed.client_exit.observed, true);
    assert.equal(closed.client_exit.code, 3);
    assert.equal(closed.client_exit.signal, null);
    assert.equal(session.diagnostics().transaction.commit_sent, 0);
    assert.equal(session.diagnostics().migration_batches[0]?.acknowledgement_ms, null);
    assert.equal(session.diagnostics().failure?.phase, "DURING_TRANSACTION");
    await session.close();
  } finally {
    await session.close();
  }
  // A distinct synthetic fixture connection proves no enduring public objects were created.
  const check = new Session(c, { deadlineMs: 10000 });
  try {
    await initialize(check, c);
    assert.equal(
      await check.json<boolean>(
        "select to_jsonb(not exists(select 1 from pg_namespace n join pg_class c on c.relnamespace=n.oid where n.nspname='public' and c.relname='teka_transport_failure'));",
      ),
      true,
    );
  } finally {
    await check.close();
  }
}

async function main() {
  const index = process.argv.indexOf("--output-dir");
  assert(index >= 0 && process.argv[index + 1], "Explicit benchmark output directory required");
  const directory = path.resolve(process.argv[index + 1]!);
  const results = [];
  for (const delay of [0, 25])
    for (let repeat = 0; repeat < 3; repeat++) {
      const before = await runCase("previous-stdin", delay);
      const after = await runCase("migration-batched", delay);
      assert.deepEqual(before.fingerprint, after.fingerprint);
      if (delay)
        assert(
          before.migration_elapsed_ms > after.migration_elapsed_ms * 5,
          "Controlled-latency batching must reduce elapsed time by at least fivefold",
        );
      results.push({ repeat, before, after });
    }
  await nativeLargeAndLexicalRegression();
  await failureRegression();
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  writeFileSync(
    path.join(directory, "transport-benchmark.json"),
    JSON.stringify(
      {
        status: "PASS",
        release_sha: spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim(),
        source_clean:
          spawnSync("git", ["status", "--porcelain"], { encoding: "utf8" }).stdout.trim() === "",
        recorded_at: new Date().toISOString(),
        tooling_sha256: toolingDigest(),
        environment: {
          node: process.version,
          platform: process.platform,
          architecture: process.arch,
          database: "isolated teka_portability loopback fixture",
          tls: false,
          latency_model:
            "25ms forwarding delay on every frontend Query message; not bandwidth/loss/server-load simulation",
        },
        request_count_measurement: "PostgreSQL frontend Q frames observed by bounded local proxy",
        results,
        native_parser_and_fingerprint_equivalence: true,
        native_large_write_backpressure: true,
        negative_P0001_and_atomic_failure: true,
        limitation:
          "Synthetic 104-statement sample and local fixtures; no guarantee of hosted performance; full frozen-chain schema/data equivalence requires exact-release replay",
      },
      null,
      2,
    ) + "\n",
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "PASS: native parser/transaction/negative tests; 104 -> 1 migration requests; controlled-latency benchmark.",
  );
}
main().catch(() => {
  console.error("TRANSPORT_BENCHMARK_FAILED; private diagnostics withheld; no retry");
  process.exitCode = 1;
});
