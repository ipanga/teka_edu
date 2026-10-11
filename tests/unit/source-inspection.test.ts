import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import manifest from "@/docs/migration/alwaysdata/source-inspection-expected.json";
import { canonicalTables } from "@/lib/postgres/verify";
import { ROOT } from "@/lib/postgres/migrations";
const sql = readFileSync(path.join(ROOT, "scripts/postgres/source-inspection.sql"), "utf8");
const sha = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
function pgJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(pgJson).join(", ") + "]";
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort(
      (a, b) =>
        Buffer.byteLength(a) - Buffer.byteLength(b) ||
        Buffer.compare(Buffer.from(a), Buffer.from(b)),
    );
    return "{" + keys.map((k) => JSON.stringify(k) + ": " + pgJson(obj[k])).join(", ") + "}";
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isInteger(value))
  )
    return JSON.stringify(value);
  throw new Error("Unsupported baseline type");
}
describe("prepared read-only source inspection", () => {
  it("binds the exact reviewed SQL bytes and complete frozen scope", () => {
    expect(sha(sql)).toBe(manifest.source_query_sha256);
    expect(manifest.production_execution_authorized).toBe(false);
    expect(manifest.application_tables).toBe(36);
    expect(manifest.application_columns).toBe(213);
    expect(manifest.canonical_rows).toBe(6170);
    expect(manifest.migrations).toBe(46);
  });
  it("independently recomputes every canonical full-row multiset hash", () => {
    for (const t of canonicalTables()) {
      const expected = manifest.canonical_tables.find((e) => e.table === t.table)!;
      const rows = t.rows.map((row) => sha(pgJson(t.columns.map((c) => row[c.name])))).sort();
      expect(sha(rows.join(""))).toBe(expected.sha256);
      expect(rows.length).toBe(expected.rows);
      expect(t.columns.map((c) => c.name)).toEqual(expected.columns);
    }
  });
  it("fails closed with exact identity, visibility, heap, type, history and aggregate gates", () => {
    for (const required of [
      "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;",
      "LOCK TABLE ONLY",
      "current_user::pg_catalog.text='postgres'",
      "pg_catalog.row_security_active(c.oid)",
      "c.relkind<>'r' OR c.relam<>2",
      "'gate','exact_heap_type_visibility_scope'",
      "'gate','migration_history'",
      "auth_users=0 AND auth_identities=0 AND storage_buckets=0 AND storage_objects=0",
      "\\set ON_ERROR_STOP on",
      "1 / CASE WHEN",
    ])
      expect(sql).toContain(required);
    expect(sql.indexOf("LOCK TABLE ONLY")).toBeLessThan(
      sql.indexOf("SELECT pg_catalog.jsonb_build_object"),
    );
    expect(sql.indexOf("'gate','exact_heap_type_visibility_scope'")).toBeLessThan(
      sql.indexOf("FROM ONLY public."),
    );
    expect(sql.match(/'gate','canonical_content'/g)).toHaveLength(36);
    expect(sql).toContain("'inspection_scope','APPROVED_41_HEAP_RELATIONS_ONLY'");
    expect(sql).toContain("'rebuild_scope','NOT VERIFIED'");
    expect(sql.indexOf("ROLLBACK;")).toBeLessThan(sql.indexOf("'inspection_complete',true"));
  });
  it("does not include writes, deparsers, restricted user mappings or raw provider projections", () => {
    for (const forbidden of [
      /\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|GRANT|REVOKE|COPY|COMMIT)\s/i,
      /pg_get_/,
      /pg_user_mapping/,
      /\\(?:copy|gexec|!)/,
    ])
      expect(sql).not.toMatch(forbidden);
    for (const t of ["auth.users", "auth.identities", "storage.buckets", "storage.objects"])
      expect(sql.split("FROM ONLY " + t).length - 1).toBe(1);
    expect(sql).toContain("SET LOCAL enable_indexscan=off;");
    expect(sql).toContain("SET LOCAL enable_indexonlyscan=off;");
    expect(sql).toContain("SET LOCAL statement_timeout='15s';");
    expect(sql).toContain("SET LOCAL lock_timeout='2s';");
  });
});
