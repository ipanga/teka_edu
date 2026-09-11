/**
 * Generates SQL for the database mirror of the canonical reference data (ADR-028).
 *
 *   referenceSyncSql(data)  — idempotent statements that make the reference tables equal
 *                             to content/: upsert every row, delete rows no longer in
 *                             content. Written into new migrations by `npm run db:reference`.
 *   referenceTestSql(data)  — a pgTAP test asserting the migrated database equals content/,
 *                             then re-applying the sync and asserting nothing changed.
 *
 * Pure and deterministic (rows sorted by key). Used by scripts and tests only; never
 * bundled into the application.
 */
import type { ReferenceData } from "@/lib/content/reference-data";

type SqlType = "text" | "smallint" | "boolean" | "date" | "smallint[]";
type SqlValue = string | number | boolean | null | readonly number[];
type Column = { name: string; type: SqlType };
type TableData = {
  table: string;
  key: readonly string[];
  columns: readonly Column[];
  rows: readonly Record<string, SqlValue>[];
};

const col = (name: string, type: SqlType): Column => ({ name, type });

function literal(value: SqlValue, type: SqlType): string {
  if (value === null) return `null::${type}`;
  switch (type) {
    case "text":
    case "date":
      if (typeof value !== "string") throw new TypeError(`expected a string for ${type}`);
      return `'${value.replaceAll("'", "''")}'::${type}`;
    case "smallint":
      if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new TypeError("expected an integer for smallint");
      }
      return `${value}::smallint`;
    case "boolean":
      if (typeof value !== "boolean") throw new TypeError("expected a boolean");
      return value ? "true" : "false";
    case "smallint[]":
      if (!Array.isArray(value)) throw new TypeError("expected an array for smallint[]");
      return `'{${value.join(",")}}'::smallint[]`;
  }
}

/** The ten reference tables, parents before children. */
export function referenceTables(data: ReferenceData): TableData[] {
  const provenance = [
    col("authority", "text"),
    col("verification", "text"),
    col("source", "text"),
    col("notes", "text"),
  ];
  const tables: TableData[] = [
    {
      table: "education_stages",
      key: ["id"],
      columns: [col("id", "text"), col("position", "smallint"), col("name", "text")],
      rows: data.stages.map((s) => ({ id: s.id, position: s.position, name: s.name })),
    },
    {
      table: "school_levels",
      key: ["id"],
      columns: [
        col("id", "text"),
        col("stage_id", "text"),
        col("position", "smallint"),
        col("name", "text"),
      ],
      rows: data.levels.map((l) => ({
        id: l.id,
        stage_id: l.stageId,
        position: l.position,
        name: l.name,
      })),
    },
    {
      table: "school_years",
      key: ["id"],
      columns: [
        col("id", "text"),
        col("label", "text"),
        col("starts_on", "date"),
        col("ends_on", "date"),
        col("instructional_weekdays", "smallint[]"),
        ...provenance,
      ],
      rows: data.calendars.map(({ schoolYear: y }) => ({
        id: y.id,
        label: y.label,
        starts_on: y.startsOn,
        ends_on: y.endsOn,
        instructional_weekdays: [...y.instructionalWeekdays].sort((a, b) => a - b),
        authority: y.authority,
        verification: y.verification,
        source: y.source,
        notes: y.notes,
      })),
    },
    {
      table: "school_periods",
      key: ["school_year_id", "position"],
      columns: [
        col("school_year_id", "text"),
        col("position", "smallint"),
        col("term", "smallint"),
        col("starts_on", "date"),
        col("ends_on", "date"),
      ],
      rows: data.calendars.flatMap(({ schoolYear, periods }) =>
        periods.map((p) => ({
          school_year_id: schoolYear.id,
          position: p.position,
          term: p.term,
          starts_on: p.startsOn,
          ends_on: p.endsOn,
        })),
      ),
    },
    {
      table: "public_holidays",
      key: ["id"],
      columns: [
        col("id", "text"),
        col("name", "text"),
        col("month", "smallint"),
        col("day", "smallint"),
        col("valid_from", "date"),
        col("valid_until", "date"),
        ...provenance,
      ],
      rows: data.publicHolidays.map((h) => ({
        id: h.id,
        name: h.name,
        month: h.month,
        day: h.day,
        valid_from: h.validFrom,
        valid_until: h.validUntil,
        authority: h.authority,
        verification: h.verification,
        source: h.source,
        notes: h.notes,
      })),
    },
    {
      table: "calendar_exceptions",
      key: ["id"],
      columns: [
        col("id", "text"),
        col("school_year_id", "text"),
        col("kind", "text"),
        col("starts_on", "date"),
        col("ends_on", "date"),
        col("name", "text"),
        col("public_holiday_id", "text"),
        ...provenance,
      ],
      rows: data.calendars.flatMap(({ schoolYear, exceptions }) =>
        exceptions.map((e) => ({
          id: e.id,
          school_year_id: schoolYear.id,
          kind: e.kind,
          starts_on: e.startsOn,
          ends_on: e.endsOn,
          name: e.name,
          public_holiday_id: e.publicHolidayId,
          authority: e.authority,
          verification: e.verification,
          source: e.source,
          notes: e.notes,
        })),
      ),
    },
    {
      table: "curricula",
      key: ["id"],
      columns: [
        col("id", "text"),
        col("stage_id", "text"),
        col("name", "text"),
        col("version", "text"),
        col("status", "text"),
        col("reference_title", "text"),
        col("reference_publisher", "text"),
        col("reference_citation", "text"),
        col("reference_url", "text"),
        col("reference_verification", "text"),
        col("adaptation_note", "text"),
      ],
      rows: data.curricula.map((c) => ({
        id: c.id,
        stage_id: c.stageId,
        name: c.name,
        version: c.version,
        status: c.status,
        reference_title: c.reference.title,
        reference_publisher: c.reference.publisher,
        reference_citation: c.reference.citation,
        reference_url: c.reference.url,
        reference_verification: c.reference.verification,
        adaptation_note: c.adaptationNote,
      })),
    },
    {
      table: "curriculum_levels",
      key: ["curriculum_id", "level_id"],
      columns: [
        col("curriculum_id", "text"),
        col("level_id", "text"),
        col("stage_id", "text"),
        col("reference_section", "text"),
      ],
      rows: data.curricula.flatMap((c) =>
        c.levels.map((l) => ({
          curriculum_id: c.id,
          level_id: l.levelId,
          stage_id: c.stageId,
          reference_section: l.referenceSection,
        })),
      ),
    },
    {
      table: "curriculum_domains",
      key: ["curriculum_id", "code"],
      columns: [
        col("curriculum_id", "text"),
        col("code", "text"),
        col("kind", "text"),
        col("position", "smallint"),
        col("title", "text"),
        col("is_active", "boolean"),
      ],
      rows: data.curricula.flatMap((c) =>
        c.domains.map((d) => ({
          curriculum_id: c.id,
          code: d.code,
          kind: d.kind,
          position: d.position,
          title: d.title,
          is_active: d.active,
        })),
      ),
    },
    {
      table: "school_year_curricula",
      key: ["school_year_id", "stage_id"],
      columns: [
        col("school_year_id", "text"),
        col("stage_id", "text"),
        col("curriculum_id", "text"),
      ],
      rows: data.curricula.flatMap((c) =>
        c.schoolYearIds.map((yearId) => ({
          school_year_id: yearId,
          stage_id: c.stageId,
          curriculum_id: c.id,
        })),
      ),
    },
  ];
  return tables.map((t) => ({ ...t, rows: sortRows(t) }));
}

function sortRows({ key, rows }: TableData): Record<string, SqlValue>[] {
  const keyOf = (row: Record<string, SqlValue>) => key.map((k) => String(row[k])).join(" ");
  return [...rows].sort((a, b) => (keyOf(a) < keyOf(b) ? -1 : keyOf(a) > keyOf(b) ? 1 : 0));
}

function valuesList(t: TableData, columns: readonly Column[], indent: string): string {
  return t.rows
    .map(
      (row) => `${indent}(${columns.map((c) => literal(row[c.name] ?? null, c.type)).join(", ")})`,
    )
    .join(",\n");
}

function upsert(t: TableData): string {
  if (t.rows.length === 0) return `-- public.${t.table}: no rows in content/`;
  const names = t.columns.map((c) => c.name);
  const updatable = names.filter((n) => !t.key.includes(n));
  const target = `public.${t.table}`;
  const conflict =
    updatable.length === 0
      ? "do nothing"
      : [
          "do update set",
          updatable.map((n) => `  ${n} = excluded.${n}`).join(",\n"),
          `where (${updatable.map((n) => `${t.table}.${n}`).join(", ")})`,
          `  is distinct from (${updatable.map((n) => `excluded.${n}`).join(", ")})`,
        ].join("\n");
  return [
    `insert into ${target} (${names.join(", ")})`,
    "values",
    valuesList(t, t.columns, "  "),
    `on conflict (${t.key.join(", ")}) ${conflict};`,
  ].join("\n");
}

function deleteMissing(t: TableData): string {
  const target = `public.${t.table}`;
  if (t.rows.length === 0) return `delete from ${target};`;
  const keyColumns = t.columns.filter((c) => t.key.includes(c.name));
  return [
    `delete from ${target}`,
    `where (${t.key.join(", ")}) not in (`,
    "  values",
    `${valuesList(t, keyColumns, "    ")}`,
    ");",
  ].join("\n");
}

/** Idempotent statements that make the reference tables equal to `data`. */
export function referenceSyncSql(data: ReferenceData): string {
  const tables = referenceTables(data);
  return `${[
    "-- 1. Remove reference rows that are no longer in content/ (children first). A row still\n" +
      "--    referenced by other data makes this fail: nothing is deleted silently.",
    ...[...tables].reverse().map(deleteMissing),
    "-- 2. Insert or update every reference row (parents first). Unchanged rows are untouched.",
    ...tables.map(upsert),
  ].join("\n\n")}\n`;
}

function selectColumns(t: TableData): string {
  return `select ${t.columns.map((c) => c.name).join(", ")} from public.${t.table}`;
}

function expectedRows(t: TableData): string {
  if (t.rows.length === 0) {
    return `select ${t.columns.map((c) => literal(null, c.type)).join(", ")} where false`;
  }
  return `values\n${valuesList(t, t.columns, "  ")}`;
}

/** pgTAP test: the migrated database equals content/, and re-applying the sync changes nothing. */
export function referenceTestSql(data: ReferenceData): string {
  const tables = referenceTables(data);
  const sync = referenceSyncSql(data);
  const assertions = (suffix: string) =>
    tables.map((t) => {
      const actual = selectColumns(t);
      const expected = expectedRows(t);
      if (actual.includes("$$") || expected.includes("$$")) {
        throw new Error(`reference data for ${t.table} contains "$$", which the test cannot quote`);
      }
      return `select bag_eq(\n$$${actual}$$,\n$$${expected}$$,\n'public.${t.table} ${suffix}'\n);`;
    });
  return [
    "-- GENERATED by `npm run db:reference` from content/ (lib/supabase/reference-sql.ts).",
    "-- Do not edit: change content/, then regenerate. tests/unit/reference-sql.test.ts fails",
    "-- if this file is out of date; this test fails if the migrations do not produce content/.",
    "begin;",
    `select plan(${tables.length * 2});`,
    "",
    "-- The migrations produced exactly the canonical reference data.",
    ...assertions("matches content/"),
    "",
    "-- Re-applying the sync is idempotent: no duplicate, no change.",
    sync,
    ...assertions("is unchanged after re-applying the sync"),
    "",
    "select * from finish();",
    "rollback;",
    "",
  ].join("\n");
}
