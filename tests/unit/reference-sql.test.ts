import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getReferenceData } from "@/lib/content/reference-data";
import { referenceSyncSql, referenceTables, referenceTestSql } from "@/lib/supabase/reference-sql";

const ROOT = path.resolve(import.meta.dirname, "../..");
const data = getReferenceData();

describe("database mirror of the reference data (ADR-028)", () => {
  it("the committed pgTAP reference test is up to date with content/ (run `npm run db:reference`)", () => {
    const committed = readFileSync(
      path.join(ROOT, "supabase/tests/database/reference_data.test.sql"),
      "utf8",
    );
    expect(committed).toBe(referenceTestSql(data));
  });

  it("is deterministic", () => {
    expect(referenceSyncSql(data)).toBe(referenceSyncSql(getReferenceData()));
  });

  it("upserts idempotently and never inserts a row twice", () => {
    const sql = referenceSyncSql(data);
    const inserts = sql.match(/^insert into /gm) ?? [];
    const conflicts = sql.match(/^on conflict \(/gm) ?? [];
    expect(inserts.length).toBe(referenceTables(data).filter((t) => t.rows.length > 0).length);
    expect(conflicts.length).toBe(inserts.length);
  });

  it("escapes quotes in text values", () => {
    // The school-year notes contain "children's".
    expect(referenceSyncSql(data)).toContain("children''s");
  });

  it("the reference data migrations contain no child or personal data tables", () => {
    const migrations = readdirSync(path.join(ROOT, "supabase/migrations")).filter((f) =>
      f.endsWith(".sql"),
    );
    for (const file of migrations) {
      const sql = readFileSync(path.join(ROOT, "supabase/migrations", file), "utf8");
      expect(sql).not.toMatch(/create table public\.(children|child|profiles|parents|users)\b/i);
    }
  });
});
