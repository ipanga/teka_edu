/**
 * Canonical reference data (education levels, curricula, national holidays, school
 * calendars), loaded from content/ and validated. The JSON files are imported statically,
 * so they ship inside the application bundle and work offline (ADR-005, ADR-019).
 *
 * Adding a school year or a curriculum version = adding its JSON file and one entry in
 * REFERENCE_CONTENT_FILES. `npm run content:validate` fails if a file under content/ is not
 * registered here, and the database mirror is regenerated from this data
 * (`npm run db:reference`, docs/EDUCATIONAL_MODEL.md).
 */
import type { z } from "zod";
import calendar20262027 from "@/content/calendars/cd/2026-2027.json";
import nationalCalendar from "@/content/calendars/cd/national.json";
import curriculumMaternelle2026 from "@/content/curriculum/maternelle-cycle1-cd-2026/curriculum.json";
import educationLevels from "@/content/education/levels.json";
import type { PublicHoliday, SchoolCalendar } from "@/domain/calendar/types";
import {
  checkPublicHolidays,
  checkSchoolCalendar,
  checkSchoolYearsDoNotOverlap,
} from "@/domain/calendar/validation";
import { checkCurricula, checkEducationStructure } from "@/domain/curriculum/curriculum";
import type { Curriculum, EducationStage, SchoolLevel } from "@/domain/curriculum/types";
import {
  curriculumFileSchema,
  educationLevelsFileSchema,
  nationalCalendarFileSchema,
  schoolCalendarFileSchema,
} from "./schemas";

type ContentFile<K extends string, S extends z.ZodType> = {
  kind: K;
  /** Path relative to content/. */
  path: string;
  schema: S;
  data: unknown;
};

export type ReferenceContentFile =
  | ContentFile<"education-levels", typeof educationLevelsFileSchema>
  | ContentFile<"curriculum", typeof curriculumFileSchema>
  | ContentFile<"national-calendar", typeof nationalCalendarFileSchema>
  | ContentFile<"school-calendar", typeof schoolCalendarFileSchema>;

export const REFERENCE_CONTENT_FILES: readonly ReferenceContentFile[] = [
  {
    kind: "education-levels",
    path: "education/levels.json",
    schema: educationLevelsFileSchema,
    data: educationLevels,
  },
  {
    kind: "curriculum",
    path: "curriculum/maternelle-cycle1-cd-2026/curriculum.json",
    schema: curriculumFileSchema,
    data: curriculumMaternelle2026,
  },
  {
    kind: "national-calendar",
    path: "calendars/cd/national.json",
    schema: nationalCalendarFileSchema,
    data: nationalCalendar,
  },
  {
    kind: "school-calendar",
    path: "calendars/cd/2026-2027.json",
    schema: schoolCalendarFileSchema,
    data: calendar20262027,
  },
];

export type ReferenceData = {
  stages: readonly EducationStage[];
  levels: readonly SchoolLevel[];
  curricula: readonly Curriculum[];
  publicHolidays: readonly PublicHoliday[];
  /** IANA zone for server-side "today"; clients use the device's zone (docs/SCHOOL_CALENDAR.md). */
  defaultTimeZone: string;
  /** Sorted by start date. */
  calendars: readonly SchoolCalendar[];
};

export class ReferenceDataError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(`Invalid reference content:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.name = "ReferenceDataError";
  }
}

/** Every cross-file and business rule. Empty means the data is consistent. */
export function checkReferenceData(data: ReferenceData): string[] {
  return [
    ...checkEducationStructure(data.stages, data.levels),
    ...checkPublicHolidays(data.publicHolidays),
    ...data.calendars.flatMap((calendar) => checkSchoolCalendar(calendar, data.publicHolidays)),
    ...checkSchoolYearsDoNotOverlap(data.calendars),
    ...checkCurricula(
      data.curricula,
      data.stages,
      data.levels,
      data.calendars.map((c) => c.schoolYear.id),
    ),
  ];
}

/** Parses and checks the registered files. Throws a ReferenceDataError listing every problem. */
export function parseReferenceData(files: readonly ReferenceContentFile[]): ReferenceData {
  const problems: string[] = [];
  const parse = <S extends z.ZodType>(file: { path: string; schema: S; data: unknown }) => {
    const result = file.schema.safeParse(file.data);
    if (result.success) return result.data as z.output<S>;
    for (const issue of result.error.issues) {
      problems.push(`${file.path}: ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    return undefined;
  };

  const stages: EducationStage[] = [];
  const levels: SchoolLevel[] = [];
  const curricula: Curriculum[] = [];
  const calendars: SchoolCalendar[] = [];
  const nationals: z.output<typeof nationalCalendarFileSchema>[] = [];
  for (const file of files) {
    switch (file.kind) {
      case "education-levels": {
        const parsed = parse(file);
        if (parsed) {
          stages.push(...parsed.stages);
          levels.push(...parsed.levels);
        }
        break;
      }
      case "curriculum": {
        const parsed = parse(file);
        if (parsed) curricula.push(parsed);
        break;
      }
      case "national-calendar": {
        const parsed = parse(file);
        if (parsed) nationals.push(parsed);
        break;
      }
      case "school-calendar": {
        const parsed = parse(file);
        if (parsed) {
          calendars.push(parsed);
          const expected = `calendars/cd/${parsed.schoolYear.id}.json`;
          if (file.path !== expected) problems.push(`${file.path}: must be named ${expected}`);
        }
        break;
      }
    }
  }
  const [national, ...otherNationals] = nationals;
  if (national === undefined || otherNationals.length > 0) {
    problems.push("exactly one national calendar file is required");
  }
  if (problems.length > 0 || national === undefined) throw new ReferenceDataError(problems);

  const data: ReferenceData = {
    stages,
    levels,
    curricula,
    publicHolidays: national.publicHolidays,
    defaultTimeZone: national.defaultTimeZone,
    calendars: calendars.sort((a, b) => (a.schoolYear.startsOn < b.schoolYear.startsOn ? -1 : 1)),
  };
  const ruleProblems = checkReferenceData(data);
  if (ruleProblems.length > 0) throw new ReferenceDataError(ruleProblems);
  return data;
}

let cached: ReferenceData | undefined;

/** The validated reference data of this release (parsed once, then cached). */
export function getReferenceData(): ReferenceData {
  cached ??= parseReferenceData(REFERENCE_CONTENT_FILES);
  return cached;
}
