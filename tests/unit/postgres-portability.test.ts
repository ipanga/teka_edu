import { describe, it, expect } from "vitest";
import {
  readFileSync,
  mkdtempSync,
  cpSync,
  appendFileSync,
  rmSync,
  writeFileSync,
  chmodSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  adaptMigration,
  loadMigrations,
  pendingMigrations,
  assertTransactional,
  ROOT,
  sha256,
  toolingDigest,
  type History,
} from "@/lib/postgres/migrations";
import { connectionFor, assertIdentity, STAGING_URL } from "@/lib/postgres/target";
import { canonicalTables, managedAssertionCopy } from "@/lib/postgres/verify";
import { assertStagingGates, metadata } from "@/lib/postgres/runner";

const migrations = loadMigrations();
const history = migrations.map((m) => ({
  version: m.version,
  filename: m.filename,
  source_sha256: m.source_sha256,
  execution_sha256: m.execution_sha256,
  adapter_version: m.adapter_version,
  target: "local",
  release_sha: "ac003f8580ca81dcfb426a70c45c02102b8e0551",
}));
const local = {
  PATH: process.env.PATH,
  PGHOST: "127.0.0.1",
  PGPORT: "5432",
  PGDATABASE: "teka_portability",
  PGUSER: "teka_migrator",
  PGSSLMODE: "disable",
};
const staging = {
  ...local,
  PGHOST: "postgresql-congofoot.alwaysdata.net",
  PGDATABASE: "congofoot_teka_edu_dev",
  PGUSER: "congofoot_user_teka_edu_dev",
  PGSSLMODE: "verify-full",
  PGSSLROOTCERT: "/trusted/provider-ca.pem",
};

describe("frozen PostgreSQL execution copies", () => {
  it("keeps 46 source hashes, adapts exactly four files, and is deterministic", () => {
    expect(migrations).toHaveLength(46);
    expect(migrations.filter((m) => m.adapted)).toHaveLength(4);
    for (const m of migrations) {
      const source = readFileSync(path.join(ROOT, "supabase/migrations", m.filename), "utf8");
      expect(sha256(source)).toBe(m.source_sha256);
      expect(sha256(adaptMigration(m.filename, source))).toBe(m.execution_sha256);
      expect(m.sql.match(/enable row level security/g)?.length ?? 0).toBe(
        source.match(/enable row level security/g)?.length ?? 0,
      );
      expect(m.sql).not.toMatch(/from anon, authenticated;/);
    }
  });
  it("preserves private/function PUBLIC revocations and rejects changed block shapes", () => {
    const first = migrations[0]!;
    const source = readFileSync(path.join(ROOT, "supabase/migrations", first.filename), "utf8");
    expect(first.sql).toContain("revoke all on schema private from public;");
    expect(first.sql).toContain(
      "revoke all on function private.check_dated_row_within_school_year() from public;",
    );
    expect(() =>
      adaptMigration(
        first.filename,
        source.replace("public, anon, authenticated", "public, authenticated, anon"),
      ),
    ).toThrow(/shape/);
    expect(() =>
      adaptMigration("unknown.sql", "revoke select on public.lessons from anon;"),
    ).toThrow(/Unknown/);
  });
  it("rejects source mutation before adaptation", () => {
    const m = migrations[0]!;
    const directory = mkdtempSync(path.join(tmpdir(), "teka-source-mutation-"));
    try {
      cpSync(path.join(ROOT, "supabase/migrations"), directory, { recursive: true });
      appendFileSync(path.join(directory, m.filename), "\n-- changed\n");
      expect(() => loadMigrations(directory)).toThrow(/Source checksum changed/);
    } finally {
      rmSync(directory, { recursive: true });
    }
    const rows = structuredClone(history);
    rows[0]!.source_sha256 = "0".repeat(64);
    expect(() => pendingMigrations(migrations, rows, "local")).toThrow(/checksum/);
  });
  it.each([
    "commit;",
    "begin;",
    "vacuum;",
    "create index concurrently x on y(z);",
    "\\connect other",
  ])("refuses transaction/control operation %s", (sql) =>
    expect(() => assertTransactional(sql)).toThrow(),
  );
  it("ignores control words inside actual SQL strings/comments/functions", () =>
    expect(() =>
      assertTransactional(
        "-- commit\nselect 'rollback'; create function f() returns text as $$ begin return 'vacuum'; end; $$ language plpgsql;",
      ),
    ).not.toThrow());
});
describe("ordered protected history", () => {
  it("lists empty pending state and idempotent complete state", () => {
    expect(pendingMigrations(migrations, [], "local")).toHaveLength(46);
    expect(pendingMigrations(migrations, history, "local")).toEqual([]);
  });
  it("rejects unknown versions, duplicate entries, gaps and target/release corruption", () => {
    const corruptions: History[][] = [
      history.slice(1),
      [history[0]!, history[0]!],
      [{ ...history[0]!, version: "19000101000000" }],
      [{ ...history[0]!, target: "staging" }],
      [{ ...history[0]!, release_sha: "partial" }],
      [history[1]!, history[0]!],
    ];
    for (const rows of corruptions)
      expect(() => pendingMigrations(migrations, rows, "local")).toThrow();
  });
  it("rejects modified execution checksums and adapter versions", () => {
    for (const patch of [
      { execution_sha256: "0".repeat(64) },
      { adapter_version: "unknown" },
      { filename: "renamed.sql" },
    ])
      expect(() =>
        pendingMigrations(migrations, [{ ...history[0]!, ...patch }], "local"),
      ).toThrow();
  });
});
describe("target and server identity", () => {
  it("blocks every production command and incomplete targets", () => {
    expect(() => connectionFor("production", staging)).toThrow(/blocked/);
    expect(() => connectionFor("", local)).toThrow(/Explicit/);
  });
  it("rejects database/login/host crossover and weak TLS", () => {
    for (const patch of [
      { PGDATABASE: "congofoot_teka_edu_prod" },
      { PGUSER: "congofoot_user_teka_edu_prod" },
      { PGHOST: "unrelated" },
      { PGSSLMODE: "require" },
      { PGSSLROOTCERT: undefined },
    ])
      expect(() => connectionFor("staging", { ...staging, ...patch })).toThrow();
  });
  it("checks actual database, login, major version, superuser and TLS", () => {
    const connection = connectionFor("staging", staging);
    const identity = {
      database: connection.database,
      login: connection.login,
      version: 160015,
      tls: true,
      superuser: false,
      create_database: true,
      create_public: true,
    };
    expect(() => assertIdentity(connection, identity)).not.toThrow();
    for (const patch of [
      { database: "postgres" },
      { login: "congofoot" },
      { version: 170000 },
      { tls: false },
      { superuser: true },
    ])
      expect(() => assertIdentity(connection, { ...identity, ...patch })).toThrow();
  });
  it("does not inherit PGHOSTADDR/PGSERVICE/PGOPTIONS connection overrides", () => {
    const connection = connectionFor("local", {
      ...local,
      PGHOSTADDR: "evil",
      PGSERVICE: "prod",
      PGOPTIONS: "-c role=other",
    });
    expect(connection.env.PGHOSTADDR).toBeUndefined();
    expect(connection.env.PGSERVICE).toBeUndefined();
    expect(connection.env.PGOPTIONS).toBeUndefined();
  });
  it("uses the corrected staging hostname", () =>
    expect(STAGING_URL).toBe("https://staging-tekaedu.tootiye.com"));
  it("fails closed without operator-approved replay and rollback coverage", () =>
    expect(() => assertStagingGates(migrations, undefined, undefined, false)).toThrow(/operator/));
  it("binds approval to the tested tooling/SHA/baseline and an actual protected dump", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "teka-gate-fixtures-"));
    try {
      const dump = path.join(directory, "fixture.dump");
      const replayPath = path.join(directory, "replay.json");
      const rollbackPath = path.join(directory, "rollback.json");
      const release = history[0]!.release_sha;
      const bytes = "empty-dev-archive-fixture";
      writeFileSync(dump, bytes, { mode: 0o600 });
      const replay = {
        status: "PASS",
        release_sha: release,
        tooling_sha256: toolingDigest(),
        server: { version: 160015 },
        migrations: metadata(migrations),
        canonical: { tables: 36, rows: 6170 },
        gates: {
          integrity: true,
          access: true,
          idempotency: true,
          pgtap: true,
          negative_tests: true,
        },
        schema_baseline_comparison: true,
        schema_sha256: sha256(
          JSON.stringify(
            JSON.parse(
              readFileSync(
                path.join(ROOT, "docs/migration/alwaysdata/expected-schema.json"),
                "utf8",
              ),
            ),
          ),
        ),
      };
      const rollback = {
        database: staging.PGDATABASE,
        login: staging.PGUSER,
        pre_migration_tables: 0,
        dump_path: dump,
        dump_sha256: sha256(bytes),
        dump_verified: true,
        coverage: "atomic-apply-and-protected-empty-dev-dump",
        production_touched: false,
      };
      const check = () => assertStagingGates(migrations, replayPath, rollbackPath, true, release);
      writeFileSync(replayPath, JSON.stringify(replay));
      writeFileSync(rollbackPath, JSON.stringify(rollback));
      expect(check).not.toThrow();
      for (const patch of [
        { tooling_sha256: "0".repeat(64) },
        { release_sha: "0".repeat(40) },
        { schema_baseline_comparison: false },
        { schema_sha256: "0".repeat(64) },
      ]) {
        writeFileSync(replayPath, JSON.stringify({ ...replay, ...patch }));
        expect(check).toThrow();
      }
      writeFileSync(replayPath, JSON.stringify(replay));
      chmodSync(dump, 0o644);
      expect(check).toThrow(/readable by others/);
      chmodSync(dump, 0o600);
      appendFileSync(dump, "changed");
      expect(check).toThrow(/differs/);
    } finally {
      rmSync(directory, { recursive: true });
    }
  });
});
describe("canonical and managed assertion sources", () => {
  it("uses the audited canonical generator, 36 tables and 6170 rows", () => {
    const tables = canonicalTables();
    expect(tables).toHaveLength(36);
    expect(tables.reduce((n, t) => n + t.rows.length, 0)).toBe(6170);
  });
  it("only qualifies assertion calls, never quoted SQL content", () => {
    const sql =
      "select throws_ok($$ select is(x, y) $$, '23514', null, 'ok( is('); select is(1,1,'x');";
    expect(managedAssertionCopy(sql)).toBe(
      "select pg_temp.throws_ok($$ select is(x, y) $$, '23514', null, 'ok( is('); select pg_temp.is(1,1,'x');",
    );
  });
});
