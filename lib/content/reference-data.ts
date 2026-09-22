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
import objectivesArt from "@/content/curriculum/maternelle-cycle1-cd-2026/objectives/ART.json";
import objectivesLang from "@/content/curriculum/maternelle-cycle1-cd-2026/objectives/LANG.json";
import objectivesMath from "@/content/curriculum/maternelle-cycle1-cd-2026/objectives/MATH.json";
import objectivesPhys from "@/content/curriculum/maternelle-cycle1-cd-2026/objectives/PHYS.json";
import objectivesTimeSpace from "@/content/curriculum/maternelle-cycle1-cd-2026/objectives/TIME-SPACE.json";
import objectivesWorld from "@/content/curriculum/maternelle-cycle1-cd-2026/objectives/WORLD.json";
import lessons1Art from "@/content/lessons/maternelle-cycle1-cd-2026/maternelle-1/art.json";
import lessons1Lang from "@/content/lessons/maternelle-cycle1-cd-2026/maternelle-1/lang.json";
import lessons1Math from "@/content/lessons/maternelle-cycle1-cd-2026/maternelle-1/math.json";
import lessons1Phys from "@/content/lessons/maternelle-cycle1-cd-2026/maternelle-1/phys.json";
import lessons1TimeSpace from "@/content/lessons/maternelle-cycle1-cd-2026/maternelle-1/time-space.json";
import lessons1World from "@/content/lessons/maternelle-cycle1-cd-2026/maternelle-1/world.json";
import lessonsArt from "@/content/lessons/maternelle-cycle1-cd-2026/maternelle-3/art.json";
import lessonsLang from "@/content/lessons/maternelle-cycle1-cd-2026/maternelle-3/lang.json";
import lessonsMath from "@/content/lessons/maternelle-cycle1-cd-2026/maternelle-3/math.json";
import lessonsPhys from "@/content/lessons/maternelle-cycle1-cd-2026/maternelle-3/phys.json";
import lessonsTimeSpace from "@/content/lessons/maternelle-cycle1-cd-2026/maternelle-3/time-space.json";
import lessonsWorld from "@/content/lessons/maternelle-cycle1-cd-2026/maternelle-3/world.json";
import materialsFile from "@/content/materials.json";
import annualPlanMaternelle1 from "@/content/programmes/maternelle-cycle1-cd-2026/maternelle-1-annual-plan.json";
import annualPlanMaternelle3 from "@/content/programmes/maternelle-cycle1-cd-2026/maternelle-3-annual-plan.json";
import programmeMaternelle1 from "@/content/programmes/maternelle-cycle1-cd-2026/maternelle-1.json";
import programmeMaternelle3 from "@/content/programmes/maternelle-cycle1-cd-2026/maternelle-3.json";
import mediaRegistry from "@/content/media/registry.json";
import reviewHistory from "@/content/reviews/history.json";
import textsMaternelle1 from "@/content/texts/maternelle-1.json";
import textsMaternelle3 from "@/content/texts/maternelle-3.json";
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
import { checkSyllabus, mergeSyllabi } from "@/domain/curriculum/objectives";
import type {
  Curriculum,
  DomainSyllabus,
  EducationStage,
  SchoolLevel,
} from "@/domain/curriculum/types";
import { type TeachingText, checkTexts } from "@/domain/lessons/texts";
import {
  checkAudio,
  checkMedia,
  mediaDigestSource,
  type AudioAsset,
  type MediaAsset,
} from "@/domain/media/types";
import type { Lesson, Material } from "@/domain/lessons/types";
import { type AnnualPlan, checkAnnualPlan } from "@/domain/programme/annual-plan";
import { checkLessons, checkProgramme } from "@/domain/programme/validation";
import type { LevelProgramme } from "@/domain/programme/types";
import {
  annualPlanFileSchema,
  domainObjectivesFileSchema,
  flattenObjectives,
  lessonsFileSchema,
  materialsFileSchema,
  mediaRegistryFileSchema,
  programmeFileSchema,
  reviewHistoryFileSchema,
  teachingTextsFileSchema,
} from "./lesson-schemas";
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
  | ContentFile<"school-calendar", typeof schoolCalendarFileSchema>
  | ContentFile<"objectives", typeof domainObjectivesFileSchema>
  | ContentFile<"materials", typeof materialsFileSchema>
  | ContentFile<"lessons", typeof lessonsFileSchema>
  | ContentFile<"programme", typeof programmeFileSchema>
  | ContentFile<"annual-plan", typeof annualPlanFileSchema>
  | ContentFile<"texts", typeof teachingTextsFileSchema>
  | ContentFile<"review-history", typeof reviewHistoryFileSchema>
  | ContentFile<"media", typeof mediaRegistryFileSchema>;

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
  {
    kind: "objectives",
    path: "curriculum/maternelle-cycle1-cd-2026/objectives/ART.json",
    schema: domainObjectivesFileSchema,
    data: objectivesArt,
  },
  {
    kind: "objectives",
    path: "curriculum/maternelle-cycle1-cd-2026/objectives/LANG.json",
    schema: domainObjectivesFileSchema,
    data: objectivesLang,
  },
  {
    kind: "objectives",
    path: "curriculum/maternelle-cycle1-cd-2026/objectives/MATH.json",
    schema: domainObjectivesFileSchema,
    data: objectivesMath,
  },
  {
    kind: "objectives",
    path: "curriculum/maternelle-cycle1-cd-2026/objectives/PHYS.json",
    schema: domainObjectivesFileSchema,
    data: objectivesPhys,
  },
  {
    kind: "objectives",
    path: "curriculum/maternelle-cycle1-cd-2026/objectives/TIME-SPACE.json",
    schema: domainObjectivesFileSchema,
    data: objectivesTimeSpace,
  },
  {
    kind: "objectives",
    path: "curriculum/maternelle-cycle1-cd-2026/objectives/WORLD.json",
    schema: domainObjectivesFileSchema,
    data: objectivesWorld,
  },
  { kind: "materials", path: "materials.json", schema: materialsFileSchema, data: materialsFile },
  {
    kind: "lessons",
    path: "lessons/maternelle-cycle1-cd-2026/maternelle-3/art.json",
    schema: lessonsFileSchema,
    data: lessonsArt,
  },
  {
    kind: "lessons",
    path: "lessons/maternelle-cycle1-cd-2026/maternelle-3/lang.json",
    schema: lessonsFileSchema,
    data: lessonsLang,
  },
  {
    kind: "lessons",
    path: "lessons/maternelle-cycle1-cd-2026/maternelle-3/math.json",
    schema: lessonsFileSchema,
    data: lessonsMath,
  },
  {
    kind: "lessons",
    path: "lessons/maternelle-cycle1-cd-2026/maternelle-3/phys.json",
    schema: lessonsFileSchema,
    data: lessonsPhys,
  },
  {
    kind: "lessons",
    path: "lessons/maternelle-cycle1-cd-2026/maternelle-3/time-space.json",
    schema: lessonsFileSchema,
    data: lessonsTimeSpace,
  },
  {
    kind: "lessons",
    path: "lessons/maternelle-cycle1-cd-2026/maternelle-3/world.json",
    schema: lessonsFileSchema,
    data: lessonsWorld,
  },
  {
    kind: "lessons",
    path: "lessons/maternelle-cycle1-cd-2026/maternelle-1/art.json",
    schema: lessonsFileSchema,
    data: lessons1Art,
  },
  {
    kind: "lessons",
    path: "lessons/maternelle-cycle1-cd-2026/maternelle-1/lang.json",
    schema: lessonsFileSchema,
    data: lessons1Lang,
  },
  {
    kind: "lessons",
    path: "lessons/maternelle-cycle1-cd-2026/maternelle-1/math.json",
    schema: lessonsFileSchema,
    data: lessons1Math,
  },
  {
    kind: "lessons",
    path: "lessons/maternelle-cycle1-cd-2026/maternelle-1/phys.json",
    schema: lessonsFileSchema,
    data: lessons1Phys,
  },
  {
    kind: "lessons",
    path: "lessons/maternelle-cycle1-cd-2026/maternelle-1/time-space.json",
    schema: lessonsFileSchema,
    data: lessons1TimeSpace,
  },
  {
    kind: "lessons",
    path: "lessons/maternelle-cycle1-cd-2026/maternelle-1/world.json",
    schema: lessonsFileSchema,
    data: lessons1World,
  },
  {
    kind: "programme",
    path: "programmes/maternelle-cycle1-cd-2026/maternelle-1.json",
    schema: programmeFileSchema,
    data: programmeMaternelle1,
  },
  {
    kind: "programme",
    path: "programmes/maternelle-cycle1-cd-2026/maternelle-3.json",
    schema: programmeFileSchema,
    data: programmeMaternelle3,
  },
  {
    kind: "annual-plan",
    path: "programmes/maternelle-cycle1-cd-2026/maternelle-3-annual-plan.json",
    schema: annualPlanFileSchema,
    data: annualPlanMaternelle3,
  },
  {
    kind: "annual-plan",
    path: "programmes/maternelle-cycle1-cd-2026/maternelle-1-annual-plan.json",
    schema: annualPlanFileSchema,
    data: annualPlanMaternelle1,
  },
  {
    kind: "review-history",
    path: "reviews/history.json",
    schema: reviewHistoryFileSchema,
    data: reviewHistory,
  },
  {
    kind: "texts",
    path: "texts/maternelle-1.json",
    schema: teachingTextsFileSchema,
    data: textsMaternelle1,
  },
  {
    kind: "texts",
    path: "texts/maternelle-3.json",
    schema: teachingTextsFileSchema,
    data: textsMaternelle3,
  },
  {
    kind: "media",
    path: "media/registry.json",
    schema: mediaRegistryFileSchema,
    data: mediaRegistry,
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
  /** Official objectives and success examples, one entry per curriculum domain. */
  syllabi: readonly DomainSyllabus[];
  materials: readonly Material[];
  /** Lessons and activities authored by Teka Edu. */
  lessons: readonly Lesson[];
  /** Daily-programme definitions, one per level. */
  programmes: readonly LevelProgramme[];
  /** Which objectives the year introduces, reinforces and consolidates, per level. */
  annualPlans: readonly AnnualPlan[];
  /** Stories and rhymes the platform supplies, so a lesson needs no outside book. */
  texts: readonly TeachingText[];
  /** Pictures the child looks at, by stable id (ADR-042). */
  media: readonly MediaAsset[];
  /** Recordings, where sound itself is the point (ADR-046). Empty until a voice exists. */
  audio: readonly AudioAsset[];
  /** What each pedagogical review of a weekly batch decided, and what followed (ADR-047). */
  reviewHistory: readonly ReviewHistoryEntry[];
};

/** One recorded pedagogical review of one weekly batch. */
export type ReviewHistoryEntry = {
  levelId: string;
  schoolYearId: string;
  week: number;
  reviewedOn: string;
  reviewKind: string;
  reviewer: string;
  /** `full-review` = this week was read. `consequence` = a change arrived from another week. */
  scope: string;
  outcome: string;
  summary: string;
  corrections: string;
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
    ...data.syllabi.flatMap((syllabus) => checkSyllabus(syllabus, data.curricula)),
    ...checkLessons(
      data.lessons,
      data.curricula,
      data.syllabi.flatMap((syllabus) => syllabus.objectives),
      data.levels,
      data.materials,
      mediaDigestSource(data.media, data.texts),
    ),
    ...data.programmes.flatMap((programme) =>
      checkProgramme(
        programme,
        data.lessons,
        data.curricula,
        data.calendars.map((c) => c.schoolYear.id),
      ),
    ),
    ...checkTexts(data.texts, data.lessons),
    ...checkMedia(data.media, data.lessons),
    ...checkAudio(data.audio, data.texts),
    ...data.annualPlans.flatMap((plan) =>
      checkAnnualPlan(
        plan,
        data.syllabi.flatMap((syllabus) => syllabus.objectives),
        data.curricula,
        data.levels,
      ),
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
  const syllabi: DomainSyllabus[] = [];
  const materials: Material[] = [];
  const lessons: Lesson[] = [];
  const programmes: LevelProgramme[] = [];
  const annualPlans: AnnualPlan[] = [];
  const texts: TeachingText[] = [];
  const reviewHistoryEntries: ReviewHistoryEntry[] = [];
  const media: MediaAsset[] = [];
  const audio: AudioAsset[] = [];
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
      case "objectives": {
        const parsed = parse(file);
        if (parsed) {
          const expected = `curriculum/${parsed.curriculumId}/objectives/${parsed.domainCode}.json`;
          if (file.path !== expected) problems.push(`${file.path}: must be named ${expected}`);
          syllabi.push({
            curriculumId: parsed.curriculumId,
            domainCode: parsed.domainCode,
            sourceId: parsed.sourceId,
            ...flattenObjectives(parsed),
          });
        }
        break;
      }
      case "materials": {
        const parsed = parse(file);
        if (parsed) materials.push(...parsed.materials);
        break;
      }
      case "lessons": {
        const parsed = parse(file);
        if (parsed) {
          const expected = `lessons/${parsed.curriculumId}/${parsed.levelId}/${parsed.domainCode.toLowerCase()}.json`;
          if (file.path !== expected) problems.push(`${file.path}: must be named ${expected}`);
          for (const lesson of parsed.lessons) {
            if (
              lesson.curriculumId !== parsed.curriculumId ||
              lesson.domainCode !== parsed.domainCode
            ) {
              problems.push(
                `${file.path}: lesson "${lesson.id}" does not match the file's curriculum/domain`,
              );
            }
            if (!lesson.levelIds.includes(parsed.levelId)) {
              problems.push(
                `${file.path}: lesson "${lesson.id}" is not written for ${parsed.levelId}`,
              );
            }
          }
          lessons.push(...parsed.lessons);
        }
        break;
      }
      case "programme": {
        const parsed = parse(file);
        if (parsed) {
          const expected = `programmes/${parsed.curriculumId}/${parsed.levelId}.json`;
          if (file.path !== expected) problems.push(`${file.path}: must be named ${expected}`);
          programmes.push(parsed);
        }
        break;
      }
      case "annual-plan": {
        const parsed = parse(file);
        if (parsed) {
          const expected = `programmes/${parsed.curriculumId}/${parsed.levelId}-annual-plan.json`;
          if (file.path !== expected) problems.push(`${file.path}: must be named ${expected}`);
          annualPlans.push(parsed);
        }
        break;
      }
      case "texts": {
        const parsed = parse(file);
        if (parsed) texts.push(...parsed.texts);
        break;
      }
      case "review-history": {
        const parsed = parse(file);
        if (parsed) reviewHistoryEntries.push(...parsed.reviews);
        break;
      }
      case "media": {
        const parsed = parse(file);
        if (parsed) {
          media.push(...parsed.assets);
          audio.push(...parsed.audio);
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
    syllabi,
    materials,
    lessons,
    programmes,
    annualPlans,
    texts,
    reviewHistory: reviewHistoryEntries,
    media,
    audio,
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

/** All official objectives of one curriculum version, across its domains. */
export function getSyllabus(curriculumId: string, data: ReferenceData = getReferenceData()) {
  return mergeSyllabi(curriculumId, data.syllabi);
}

/** The daily programme of a level, if one is configured. */
export function getProgramme(
  levelId: string,
  schoolYearId: string,
  data: ReferenceData = getReferenceData(),
): LevelProgramme | undefined {
  return data.programmes.find(
    (programme) => programme.levelId === levelId && programme.schoolYearIds.includes(schoolYearId),
  );
}
