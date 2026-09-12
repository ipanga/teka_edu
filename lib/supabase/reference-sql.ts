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
import { ACTIVITY_TYPES } from "@/domain/lessons/types";
import type { ReferenceData } from "@/lib/content/reference-data";

type SqlType = "text" | "smallint" | "boolean" | "date" | "smallint[]" | "jsonb";
type SqlValue =
  string | number | boolean | null | readonly number[] | Readonly<Record<string, unknown>>;
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
    case "jsonb": {
      if (typeof value !== "object") throw new TypeError("expected an object for jsonb");
      // Stable key order, so the generated SQL does not depend on object iteration order.
      const stable = JSON.stringify(value, Object.keys(value as object).sort());
      return `'${stable.replaceAll("'", "''")}'::jsonb`;
    }
  }
}

/** Every reference table, parents before children. */
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
      table: "curriculum_age_bands",
      key: ["curriculum_id", "code"],
      columns: [
        col("curriculum_id", "text"),
        col("code", "text"),
        col("position", "smallint"),
        col("label", "text"),
      ],
      rows: data.curricula.flatMap((c) =>
        c.ageBands.map((band) => ({
          curriculum_id: c.id,
          code: band.code,
          position: band.position,
          label: band.label,
        })),
      ),
    },
    {
      table: "curriculum_levels",
      key: ["curriculum_id", "level_id"],
      columns: [
        col("curriculum_id", "text"),
        col("level_id", "text"),
        col("stage_id", "text"),
        col("reference_section", "text"),
        col("age_band_code", "text"),
      ],
      rows: data.curricula.flatMap((c) =>
        c.levels.map((l) => ({
          curriculum_id: c.id,
          level_id: l.levelId,
          stage_id: c.stageId,
          reference_section: l.referenceSection,
          age_band_code: l.ageBandCode,
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
      table: "curriculum_sources",
      key: ["curriculum_id", "code"],
      columns: [
        col("curriculum_id", "text"),
        col("code", "text"),
        col("title", "text"),
        col("citation", "text"),
        col("url", "text"),
        col("published_on", "date"),
        col("sha256", "text"),
        col("verification", "text"),
      ],
      rows: data.curricula.flatMap((c) =>
        c.sources.map((source) => ({
          curriculum_id: c.id,
          code: source.id,
          title: source.title,
          citation: source.citation,
          url: source.url,
          published_on: source.publishedOn,
          sha256: source.sha256,
          verification: source.verification,
        })),
      ),
    },
    {
      table: "curriculum_source_domains",
      key: ["curriculum_id", "source_code", "domain_code"],
      columns: [
        col("curriculum_id", "text"),
        col("source_code", "text"),
        col("domain_code", "text"),
      ],
      rows: data.curricula.flatMap((c) =>
        c.sources.flatMap((source) =>
          source.covers.map((domainCode) => ({
            curriculum_id: c.id,
            source_code: source.id,
            domain_code: domainCode,
          })),
        ),
      ),
    },
    {
      table: "curriculum_subdomains",
      key: ["curriculum_id", "code"],
      columns: [
        col("curriculum_id", "text"),
        col("code", "text"),
        col("domain_code", "text"),
        col("position", "smallint"),
        col("title", "text"),
      ],
      rows: data.syllabi.flatMap((syllabus) =>
        syllabus.subdomains.map((subdomain) => ({
          curriculum_id: syllabus.curriculumId,
          code: subdomain.code,
          domain_code: subdomain.domainCode,
          position: subdomain.position,
          title: subdomain.title,
        })),
      ),
    },
    {
      table: "curriculum_competencies",
      key: ["curriculum_id", "code"],
      columns: [
        col("curriculum_id", "text"),
        col("code", "text"),
        col("subdomain_code", "text"),
        col("position", "smallint"),
        col("title", "text"),
      ],
      rows: data.syllabi.flatMap((syllabus) =>
        syllabus.competencies.map((competency) => ({
          curriculum_id: syllabus.curriculumId,
          code: competency.code,
          subdomain_code: competency.subdomainCode,
          position: competency.position,
          title: competency.title,
        })),
      ),
    },
    {
      table: "learning_objectives",
      key: ["curriculum_id", "code"],
      columns: [
        col("curriculum_id", "text"),
        col("code", "text"),
        col("competency_code", "text"),
        col("position", "smallint"),
        col("statement", "text"),
        col("group_title", "text"),
        col("origin", "text"),
        col("source_code", "text"),
        col("source_page", "smallint"),
      ],
      rows: data.syllabi.flatMap((syllabus) =>
        syllabus.objectives.map((objective) => ({
          curriculum_id: syllabus.curriculumId,
          code: objective.code,
          competency_code: objective.competencyCode,
          position: objective.position,
          statement: objective.statement,
          group_title: objective.group,
          origin: objective.origin,
          source_code: objective.sourceId,
          source_page: objective.sourcePage,
        })),
      ),
    },
    {
      table: "learning_objective_age_bands",
      key: ["curriculum_id", "objective_code", "age_band_code"],
      columns: [
        col("curriculum_id", "text"),
        col("objective_code", "text"),
        col("age_band_code", "text"),
      ],
      rows: data.syllabi.flatMap((syllabus) =>
        syllabus.objectives.flatMap((objective) =>
          objective.ageBandCodes.map((band) => ({
            curriculum_id: syllabus.curriculumId,
            objective_code: objective.code,
            age_band_code: band,
          })),
        ),
      ),
    },
    {
      table: "success_examples",
      key: ["curriculum_id", "competency_code", "age_band_code", "position"],
      columns: [
        col("curriculum_id", "text"),
        col("competency_code", "text"),
        col("age_band_code", "text"),
        col("position", "smallint"),
        col("statement", "text"),
        col("group_title", "text"),
        col("source_code", "text"),
        col("source_page", "smallint"),
      ],
      rows: data.syllabi.flatMap((syllabus) =>
        syllabus.successExamples.map((example) => ({
          curriculum_id: syllabus.curriculumId,
          competency_code: example.competencyCode,
          age_band_code: example.ageBandCode,
          position: example.position,
          statement: example.statement,
          group_title: example.group,
          source_code: example.sourceId,
          source_page: example.sourcePage,
        })),
      ),
    },
    {
      table: "materials",
      key: ["code"],
      columns: [
        col("code", "text"),
        col("name", "text"),
        col("category", "text"),
        col("alternatives", "text"),
        col("safety_note", "text"),
      ],
      rows: data.materials.map((material) => ({
        code: material.code,
        name: material.name,
        category: material.category,
        alternatives: material.alternatives,
        safety_note: material.safetyNote,
      })),
    },
    {
      table: "activity_types",
      key: ["code"],
      columns: [col("code", "text")],
      rows: ACTIVITY_TYPES.map((type) => ({ code: type })),
    },
    {
      table: "lessons",
      key: ["id"],
      columns: [
        col("id", "text"),
        col("curriculum_id", "text"),
        col("domain_code", "text"),
        col("title", "text"),
        col("summary", "text"),
        col("stage", "text"),
        col("difficulty", "smallint"),
        col("theme_id", "text"),
        col("parent_guidance", "text"),
        col("origin", "text"),
        col("status", "text"),
        col("reviewer", "text"),
        col("reviewer_role", "text"),
        col("reviewed_on", "date"),
        col("reviewed_digest", "text"),
        col("review_notes", "text"),
      ],
      rows: data.lessons.map((lesson) => ({
        id: lesson.id,
        curriculum_id: lesson.curriculumId,
        domain_code: lesson.domainCode,
        title: lesson.title,
        summary: lesson.summary,
        stage: lesson.stage,
        difficulty: lesson.difficulty,
        theme_id: lesson.themeId,
        parent_guidance: lesson.parentGuidance,
        origin: lesson.origin,
        status: lesson.status,
        reviewer: lesson.review?.reviewer ?? null,
        reviewer_role: lesson.review?.reviewerRole ?? null,
        reviewed_on: lesson.review?.reviewedOn ?? null,
        reviewed_digest: lesson.review?.reviewedDigest ?? null,
        review_notes: lesson.review?.notes ?? null,
      })),
    },
    {
      table: "lesson_levels",
      key: ["lesson_id", "level_id"],
      columns: [col("lesson_id", "text"), col("level_id", "text")],
      rows: data.lessons.flatMap((lesson) =>
        lesson.levelIds.map((levelId) => ({ lesson_id: lesson.id, level_id: levelId })),
      ),
    },
    {
      table: "lesson_objectives",
      key: ["lesson_id", "objective_code"],
      columns: [
        col("lesson_id", "text"),
        col("curriculum_id", "text"),
        col("objective_code", "text"),
        col("role", "text"),
      ],
      rows: data.lessons.flatMap((lesson) => [
        ...lesson.objectiveCodes.map((code) => ({
          lesson_id: lesson.id,
          curriculum_id: lesson.curriculumId,
          objective_code: code,
          role: "taught",
        })),
        ...lesson.supportingObjectiveCodes.map((code) => ({
          lesson_id: lesson.id,
          curriculum_id: lesson.curriculumId,
          objective_code: code,
          role: "supporting",
        })),
      ]),
    },
    {
      table: "activities",
      key: ["id"],
      columns: [
        col("id", "text"),
        col("lesson_id", "text"),
        col("curriculum_id", "text"),
        col("position", "smallint"),
        col("type", "text"),
        col("title", "text"),
        col("child_instruction", "text"),
        col("adult_guidance", "text"),
        col("minutes", "smallint"),
        col("mode", "text"),
        col("role", "text"),
        col("payload", "jsonb"),
      ],
      rows: data.lessons.flatMap((lesson) =>
        lesson.activities.map((activity) => ({
          id: activity.id,
          lesson_id: lesson.id,
          curriculum_id: lesson.curriculumId,
          position: activity.position,
          type: activity.type,
          title: activity.title,
          child_instruction: activity.childInstruction,
          adult_guidance: activity.adultGuidance,
          minutes: activity.minutes,
          mode: activity.mode,
          role: activity.role,
          payload: activity.payload,
        })),
      ),
    },
    {
      table: "activity_objectives",
      key: ["activity_id", "objective_code"],
      columns: [
        col("activity_id", "text"),
        col("curriculum_id", "text"),
        col("objective_code", "text"),
      ],
      rows: data.lessons.flatMap((lesson) =>
        lesson.activities.flatMap((activity) =>
          activity.objectiveCodes.map((code) => ({
            activity_id: activity.id,
            curriculum_id: lesson.curriculumId,
            objective_code: code,
          })),
        ),
      ),
    },
    {
      table: "activity_materials",
      key: ["activity_id", "material_code"],
      columns: [col("activity_id", "text"), col("material_code", "text")],
      rows: data.lessons.flatMap((lesson) =>
        lesson.activities.flatMap((activity) =>
          activity.materialCodes.map((code) => ({ activity_id: activity.id, material_code: code })),
        ),
      ),
    },
    {
      table: "activity_vocabulary",
      key: ["activity_id", "position"],
      columns: [
        col("activity_id", "text"),
        col("position", "smallint"),
        col("french", "text"),
        col("english", "text"),
      ],
      rows: data.lessons.flatMap((lesson) =>
        lesson.activities.flatMap((activity) =>
          activity.vocabulary.map((entry, index) => ({
            activity_id: activity.id,
            position: index + 1,
            french: entry.fr,
            english: entry.en,
          })),
        ),
      ),
    },
    {
      table: "activity_scaffolds",
      key: ["activity_id", "language"],
      columns: [
        col("activity_id", "text"),
        col("language", "text"),
        col("child_instruction", "text"),
      ],
      rows: data.lessons.flatMap((lesson) =>
        lesson.activities.flatMap((activity) =>
          activity.scaffolds.map((scaffold) => ({
            activity_id: activity.id,
            language: scaffold.language,
            child_instruction: scaffold.childInstruction,
          })),
        ),
      ),
    },
    {
      table: "teaching_texts",
      key: ["id"],
      columns: [
        col("id", "text"),
        col("kind", "text"),
        col("title", "text"),
        col("minutes", "smallint"),
        col("origin", "text"),
        col("provenance", "text"),
      ],
      rows: data.texts.map((text) => ({
        id: text.id,
        kind: text.kind,
        title: text.title,
        minutes: text.minutes,
        origin: text.origin,
        provenance: text.provenance,
      })),
    },
    {
      table: "teaching_text_lines",
      key: ["text_id", "position"],
      columns: [col("text_id", "text"), col("position", "smallint"), col("line", "text")],
      rows: data.texts.flatMap((text) =>
        text.lines.map((line, index) => ({
          text_id: text.id,
          position: index + 1,
          line,
        })),
      ),
    },
    {
      table: "annual_plans",
      key: ["id"],
      columns: [
        col("id", "text"),
        col("curriculum_id", "text"),
        col("level_id", "text"),
        col("school_year_id", "text"),
        col("instructional_days", "smallint"),
      ],
      rows: data.annualPlans.map((plan) => ({
        id: plan.id,
        curriculum_id: plan.curriculumId,
        level_id: plan.levelId,
        school_year_id: plan.schoolYearId,
        instructional_days: plan.instructionalDays,
      })),
    },
    {
      table: "annual_plan_phases",
      key: ["plan_id", "code"],
      columns: [
        col("plan_id", "text"),
        col("code", "text"),
        col("name", "text"),
        col("from_day", "smallint"),
        col("to_day", "smallint"),
        col("focus", "text"),
      ],
      rows: data.annualPlans.flatMap((plan) =>
        plan.phases.map((phase) => ({
          plan_id: plan.id,
          code: phase.code,
          name: phase.name,
          from_day: phase.fromDay,
          to_day: phase.toDay,
          focus: phase.focus,
        })),
      ),
    },
    {
      table: "annual_plan_entries",
      key: ["plan_id", "objective_code"],
      columns: [
        col("plan_id", "text"),
        col("curriculum_id", "text"),
        col("objective_code", "text"),
        col("domain_code", "text"),
        col("phase", "text"),
        col("introduce_from_day", "smallint"),
        col("introduce_by_day", "smallint"),
        col("reinforce_until_day", "smallint"),
        col("consolidate_by_day", "smallint"),
        col("planned_revisits", "smallint"),
        col("cadence", "text"),
        col("needs_dedicated_lesson", "boolean"),
        col("embeddable", "boolean"),
        col("home_feasibility", "text"),
      ],
      rows: data.annualPlans.flatMap((plan) =>
        plan.entries.map((entry) => ({
          plan_id: plan.id,
          curriculum_id: plan.curriculumId,
          objective_code: entry.objectiveCode,
          domain_code: entry.domainCode,
          phase: entry.phase,
          introduce_from_day: entry.introduceFromDay,
          introduce_by_day: entry.introduceByDay,
          reinforce_until_day: entry.reinforceUntilDay,
          consolidate_by_day: entry.consolidateByDay,
          planned_revisits: entry.plannedRevisits,
          cadence: entry.cadence,
          needs_dedicated_lesson: entry.needsDedicatedLesson,
          embeddable: entry.embeddable,
          home_feasibility: entry.homeFeasibility,
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
