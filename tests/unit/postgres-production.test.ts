import { describe, expect, it, vi } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, readFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { connectionFor, assertIdentity } from "@/lib/postgres/target";
import { loadMigrations, ROOT, sha256, toolingDigest } from "@/lib/postgres/migrations";
import {
  apply,
  verify,
  assertProductionGates,
  assertProductionTargetState,
  assertProductionHistoryShape,
  assertProductionApplicationShape,
  metadata,
} from "@/lib/postgres/runner";
import { verifyAccess } from "@/lib/postgres/verify";
import type { Session } from "@/lib/postgres/session";

// Only this isolated test module simulates two devices. It never accesses VALERY.
const media = vi.hoisted(() => ({ independent: "" }));
vi.mock("node:fs", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:fs")>();
  return {
    ...original,
    statSync: (...args: Parameters<typeof original.statSync>) => {
      const value = original.statSync(...args);
      return value && String(args[0]) === media.independent
        ? { ...value, dev: Number(value.dev) + 1 }
        : value;
    },
  };
});

const release = "a".repeat(40);
const production = {
  PGHOST: "postgresql-congofoot.alwaysdata.net",
  PGPORT: "5432",
  PGDATABASE: "congofoot_teka_edu_prod",
  PGUSER: "congofoot_user_teka_edu_prod",
  PGSSLMODE: "verify-full",
  PGSSLROOTCERT: "/trusted/ca.pem",
  TEKA_PRODUCTION_MIGRATIONS_APPROVED: "true",
};
const migrations = loadMigrations();

describe("protected production runner preparation", () => {
  it("accepts only the explicitly approved production host/database/login/TLS allowlist", () => {
    expect(connectionFor("production", production).target).toBe("production");
    for (const patch of [
      { PGDATABASE: "congofoot_teka_edu_dev" },
      { PGUSER: "congofoot_readonly_user_teka_edu_prod" },
      { PGUSER: "congofoot" },
      { PGHOST: "127.0.0.1" },
      { PGPORT: "5433" },
      { PGSSLMODE: "require" },
      { TEKA_PRODUCTION_MIGRATIONS_APPROVED: "false" },
    ])
      expect(() => connectionFor("production", { ...production, ...patch })).toThrow();
  });
  it("rejects elevated or unverified deployment-role attributes", () => {
    const connection = connectionFor("production", production);
    const identity = {
      database: connection.database,
      login: connection.login,
      version: 160015,
      tls: true,
      superuser: false,
      create_database: true,
      create_public: true,
      create_role: false,
      replication: false,
      bypass_rls: false,
    };
    expect(() => assertIdentity(connection, identity)).not.toThrow();
    for (const patch of [
      { create_role: true },
      { replication: true },
      { bypass_rls: true },
      { bypass_rls: undefined },
      { version: 170011 },
      { tls: false },
    ])
      expect(() => assertIdentity(connection, { ...identity, ...patch })).toThrow();
  });
  it("keeps private prompting separate from password overrides", () => {
    const env = { ...production, TEKA_POSTGRES_PASSWORD_PROMPT: "true" };
    expect(connectionFor("production", env).env.TEKA_POSTGRES_PASSWORD_PROMPT).toBe("true");
    for (const patch of [{ PGPASSWORD: "synthetic-only" }, { PGPASSFILE: "/synthetic" }])
      expect(() => connectionFor("production", { ...env, ...patch })).toThrow(/overrides/);
  });
  it("blocks direct library apply and verify before any SQL without recovery approval", async () => {
    const query = vi.fn();
    const session = { query } as unknown as Session;
    const connection = connectionFor("production", production);
    await expect(apply(session, connection, migrations, release)).rejects.toThrow(
      /Production execution/,
    );
    await expect(verify(session, connection, migrations, release)).rejects.toThrow(
      /Production execution/,
    );
    expect(query).not.toHaveBeenCalled();
  });
  it("rejects absent recovery evidence and mismatched CI tooling before connecting", () => {
    expect(() => assertProductionGates(migrations, { approved: true }, release)).toThrow(
      /recovery/,
    );
    const dir = mkdtempSync(path.join(tmpdir(), "teka-prod-negative-"));
    try {
      const replayPath = path.join(dir, "replay.json");
      writeFileSync(
        replayPath,
        JSON.stringify({ status: "PASS", release_sha: release, tooling_sha256: "0".repeat(64) }),
      );
      expect(() =>
        assertProductionGates(
          migrations,
          { approved: true, replayPath, rollbackPath: "not-read", recoveryPath: "not-read" },
          release,
        ),
      ).toThrow(/CI clean replay/);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
  it("binds successful evidence to exact replay, snapshot, recoverable source and separate media", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "teka-prod-evidence-fixture-"));
    try {
      const source = path.join(dir, "source.fixture");
      const copy = path.join(dir, "independent.fixture");
      const snapshot = path.join(dir, "target.fixture");
      for (const filename of [source, copy, snapshot])
        writeFileSync(filename, "synthetic-only", { mode: 0o600 });
      const hash = sha256("synthetic-only");
      const replayPath = path.join(dir, "replay.json");
      const rollbackPath = path.join(dir, "rollback.json");
      const recoveryPath = path.join(dir, "recovery.json");
      const replay = {
        status: "PASS",
        release_sha: release,
        tooling_sha256: toolingDigest(),
        schema_baseline_comparison: true,
        server: { version: 160015 },
        migrations: metadata(migrations),
        canonical: { tables: 36, rows: 6170 },
        gates: {
          integrity: true,
          access: true,
          idempotency: true,
          pgtap: true,
          negative_tests: true,
          production_catalog_shapes: true,
        },
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
        database: production.PGDATABASE,
        login: production.PGUSER,
        release_sha: release,
        pre_migration_tables: 0,
        pre_migration_history: 0,
        pre_migration_application_objects: 0,
        dump_verified: true,
        coverage: "atomic-apply-and-protected-empty-prod-dump",
        dump_path: snapshot,
        dump_sha256: hash,
      };
      const recovery = {
        status: "PASS",
        project: "eganrivpkjhozkkahyxy",
        host: "db.eganrivpkjhozkkahyxy.supabase.co",
        database: "postgres",
        login: "postgres",
        server_major: 17,
        tls_verify_full: true,
        backup_scope_verified: true,
        auth_users: 0,
        auth_identities: 0,
        storage_buckets: 0,
        storage_objects: 0,
        canonical: { tables: 36, rows: 6170, exact: true },
        original_restore_verified: true,
        restored_archive_sha256: hash,
        archive_sha256: hash,
        independent_sha256: hash,
        source_frozen: true,
        archive_path: source,
        independent_path: copy,
        independent_physical_media_verified: true,
        independent_volume: "VALERY",
      };
      const save = () => {
        writeFileSync(replayPath, JSON.stringify(replay));
        writeFileSync(rollbackPath, JSON.stringify(rollback));
        writeFileSync(recoveryPath, JSON.stringify(recovery));
      };
      save();
      const approval = { approved: true, replayPath, rollbackPath, recoveryPath };
      expect(() => assertProductionGates(migrations, approval, release)).toThrow(
        /different filesystems/,
      );
      media.independent = copy;
      expect(assertProductionGates(migrations, approval, release).source_restore_verified).toBe(
        true,
      );
      writeFileSync(
        replayPath,
        JSON.stringify({ ...replay, gates: { ...replay.gates, production_catalog_shapes: false } }),
      );
      expect(() => assertProductionGates(migrations, approval, release)).toThrow(/catalog-shape/);
      save();
      for (const patch of [
        { auth_users: 1 },
        { auth_identities: 1 },
        { storage_buckets: 1 },
        { storage_objects: 1 },
        { backup_scope_verified: false },
        { original_restore_verified: false },
        { source_frozen: false },
        { independent_physical_media_verified: false },
        { independent_sha256: "0".repeat(64) },
      ]) {
        writeFileSync(recoveryPath, JSON.stringify({ ...recovery, ...patch }));
        expect(() => assertProductionGates(migrations, approval, release)).toThrow(
          /Source recovery/,
        );
      }
      save();
      chmodSync(snapshot, 0o644);
      expect(() => assertProductionGates(migrations, approval, release)).toThrow(/private regular/);
      chmodSync(snapshot, 0o600);
      writeFileSync(copy, "changed", { mode: 0o600 });
      expect(() => assertProductionGates(migrations, approval, release)).toThrow(/checksum/);
    } finally {
      media.independent = "";
      rmSync(dir, { recursive: true });
    }
  });
  it("checks both deployment roles' isolation through catalog privileges, with no DEV connection", async () => {
    const json = vi.fn().mockResolvedValue(true);
    await assertProductionTargetState({ json } as unknown as Session, true);
    expect(json.mock.calls[0]?.[0]).toContain("congofoot_user_teka_edu_dev");
    expect(json.mock.calls[0]?.[0]).toContain("congofoot_teka_edu_dev");
    expect(json.mock.calls[0]?.[0]).toContain("extname <> 'plpgsql'");
    expect(json.mock.calls[0]?.[0]).toContain("nspname !~ '^pg_'");
    expect(json.mock.calls[0]?.[0]).not.toContain("like 'pg_%'");
    for (const catalog of [
      "pg_type",
      "pg_collation",
      "pg_operator",
      "pg_foreign_server",
      "pg_largeobject_metadata",
      "pg_publication",
    ])
      expect(json.mock.calls[0]?.[0]).toContain(catalog);
    json.mockResolvedValue(false);
    await expect(
      assertProductionTargetState({ json } as unknown as Session, false),
    ).rejects.toThrow(/baseline/);
  });
  it("locks and validates a built-in heap history shape before any history read", async () => {
    const query = vi.fn().mockResolvedValue("");
    const json = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await expect(
      assertProductionHistoryShape({ query, json } as unknown as Session),
    ).rejects.toThrow(/no rows were read/);
    expect(query).toHaveBeenCalledExactlyOnceWith(
      "lock table only teka_migrations.history in access share mode;",
    );
    expect(json.mock.calls[1]?.[0]).toContain("c.relkind='r' and c.relam=2");
    expect(json.mock.calls[1]?.[0]).toContain("atttypid=1184");
    expect(
      json.mock.calls.every(([sql]) => !String(sql).includes("from teka_migrations.history")),
    ).toBe(true);
  });
  it("catalog-gates complete built-in row projections and routine bodies before data reads", async () => {
    const json = vi.fn().mockResolvedValue(false);
    await expect(assertProductionApplicationShape({ json } as unknown as Session)).rejects.toThrow(
      /data and definitions were not read/,
    );
    const sql = String(json.mock.calls[0]?.[0]);
    expect(sql).toContain("c.relkind='r' and a.attnum>0");
    expect(sql).toContain("'activities'");
    expect(sql).toContain("'school_year_curricula'");
    // Canonical data projections deliberately differ from physical DDL order.
    expect(sql).toContain("('curriculum_sources',8,'published_on',1082,false)");
    expect(sql).toContain("('activities',11,'payload',3802,true)");
    expect(sql).toContain("('activities',12,'role',25,true)");
    expect(sql).toContain("c.relname in ('history_pkey','history_filename_key')");
    expect(sql).toContain("i.indexprs is null and i.indpred is null");
    expect(sql).toContain("p.prosrc");
    expect(sql).not.toContain("pg_get_");
    expect(sql).not.toContain("from public.");
  });
  it("uses the PROD-to-DEV isolation check and managed owner allowance during verification", async () => {
    const json = vi
      .fn()
      .mockResolvedValueOnce({ cross_environment_isolation: true })
      .mockResolvedValueOnce([]);
    await verifyAccess({ json } as unknown as Session, true, true);
    expect(json.mock.calls[0]?.[0]).toContain("'congofoot_teka_edu_dev','CONNECT'");
    expect(json.mock.calls[0]?.[0]).toContain("rolname='congofoot'");
  });
});
