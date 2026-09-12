/**
 * Zod schemas for the Phase 2 content: curriculum objectives (official), materials, lessons
 * and activities (authored by Teka Edu) and the daily-programme definitions.
 * Cross-file rules live in lib/content/reference-data.ts and domain/.
 */
import { z } from "zod";
import { CONTENT_ORIGINS } from "@/domain/curriculum/types";
import type {
  AgeBand,
  Competency,
  CurriculumSource,
  CurriculumSubdomain,
  LearningObjective,
  SuccessExample,
} from "@/domain/curriculum/types";
import { LESSON_STATUSES } from "@/domain/lessons/review";
import {
  ACTIVITY_MODES,
  ACTIVITY_TYPES,
  type Activity,
  type ActivityType,
  type Lesson,
  type Material,
  PROGRESSION_STAGES,
} from "@/domain/lessons/types";
import type { LevelProgramme } from "@/domain/programme/types";

const text = z.string().trim().min(1, { message: "must not be empty" });
const positiveInt = z.number().int().positive();
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: "must be a lower-case slug" });
const code = z
  .string()
  .regex(/^[A-Z][A-Z0-9]*(-[A-Z0-9]+)*$/, { message: "must be an upper-case code" });
/** Objective codes look like DOMAIN-Snn-Cnn-Onn. */
const objectiveCode = z
  .string()
  .regex(/^[A-Z][A-Z0-9-]*-S\d{2}-C\d{2}-O\d{2}$/, { message: "must be an objective code" });
const ageBandCode = z.enum(["before-4", "from-4", "from-5"]);

/** French content must use the typographic apostrophe, like the official texts. */
const french = text.refine((value) => !value.includes("'"), {
  message: "must use the typographic apostrophe (’), like the official texts",
});

// ---- content/curriculum/<curriculum>/objectives/<DOMAIN>.json -------------------------------

// Official wording is quoted verbatim, so it is NOT normalised: the ministry's own PDFs mix
// typographic and straight apostrophes, and correcting them would alter an official text.
const learningObjective = z.strictObject({
  code: objectiveCode,
  position: positiveInt,
  group: text.nullable(),
  statement: text,
  ageBands: z.array(ageBandCode).min(1),
  sourcePage: positiveInt.nullable(),
});

const successExample = z.strictObject({
  ageBand: ageBandCode,
  position: positiveInt,
  group: text.nullable(),
  statement: text,
  sourcePage: positiveInt.nullable(),
});

export const domainObjectivesFileSchema = z.strictObject({
  curriculumId: slug,
  domainCode: code,
  sourceId: slug,
  subdomains: z
    .array(
      z.strictObject({
        code: code,
        position: positiveInt,
        title: text,
        competencies: z
          .array(
            z.strictObject({
              code: code,
              position: positiveInt,
              title: text,
              objectives: z.array(learningObjective),
              successExamples: z.array(successExample),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

// ---- content/materials.json ------------------------------------------------------------------

export const materialsFileSchema = z.strictObject({
  materials: z
    .array(
      z.strictObject({
        code: slug,
        name: french,
        category: z.enum(["none", "screen", "paper", "writing", "household", "toy", "outdoor"]),
        alternatives: french.nullable(),
        safetyNote: french.nullable(),
      }) satisfies z.ZodType<Material>,
    )
    .min(1),
});

// ---- content/lessons/<curriculum>/<level>/<domain>.json --------------------------------------

/**
 * Activity payloads by type: what a future renderer needs beyond the instruction. Every payload
 * is strict, so an unexpected field is an error rather than silently ignored data.
 */
const ACTIVITY_PAYLOADS: Record<ActivityType, z.ZodType> = {
  conversation: z.strictObject({ prompts: z.array(french).min(1) }),
  vocabulary: z.strictObject({ focus: french.optional() }),
  "listening-story": z.strictObject({ storyTitle: french, questions: z.array(french).min(1) }),
  // Daily reading time: the official text asks for it "sans questionnement", so it has no questions.
  "read-aloud": z.strictObject({ suggestion: french }),
  "song-rhyme": z.strictObject({ title: french, lines: z.array(french).min(1) }),
  phonology: z.strictObject({ focusSound: french.optional(), words: z.array(french).min(2) }),
  counting: z.strictObject({ upTo: z.number().int().min(1).max(30), objects: french }),
  matching: z.strictObject({ pairs: z.array(z.tuple([french, french])).min(2) }),
  sorting: z.strictObject({ categories: z.array(french).min(2) }),
  observation: z.strictObject({ focus: french }),
  drawing: z.strictObject({ subject: french }),
  "graphic-practice": z.strictObject({ pattern: french }),
  movement: z.strictObject({ moves: z.array(french).min(1) }),
  manipulation: z.strictObject({ objects: french }),
  "memory-game": z.strictObject({ items: z.array(french).min(3) }),
};

const activity = z
  .strictObject({
    id: slug,
    position: positiveInt,
    type: z.enum(ACTIVITY_TYPES),
    title: french,
    childInstruction: french,
    adultGuidance: french,
    minutes: z.number().int().min(2).max(20),
    mode: z.enum(ACTIVITY_MODES),
    objectiveCodes: z.array(objectiveCode).min(1),
    materialCodes: z.array(slug),
    vocabulary: z.array(z.strictObject({ fr: french, en: text.nullable() })),
    scaffolds: z.array(z.strictObject({ language: z.literal("en"), childInstruction: text })),
    payload: z.record(z.string(), z.unknown()),
  })
  .check((ctx) => {
    // The payload must match the activity type.
    const result = ACTIVITY_PAYLOADS[ctx.value.type].safeParse(ctx.value.payload);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value.payload,
          path: ["payload", ...issue.path],
          message: `${ctx.value.type}: ${issue.message}`,
        });
      }
    }
  }) satisfies z.ZodType<Activity>;

const lesson = z.strictObject({
  id: slug,
  curriculumId: slug,
  levelIds: z.array(slug).min(1),
  domainCode: code,
  title: french,
  summary: french,
  objectiveCodes: z.array(objectiveCode).min(1),
  supportingObjectiveCodes: z.array(objectiveCode),
  stage: z.enum(PROGRESSION_STAGES),
  difficulty: z.number().int().min(1).max(3),
  themeId: slug.nullable(),
  parentGuidance: french,
  activities: z.array(activity).min(1),
  origin: z.enum(CONTENT_ORIGINS),
  status: z.enum(LESSON_STATUSES),
  review: z
    .strictObject({
      reviewer: text,
      reviewerRole: text,
      reviewedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "must be a YYYY-MM-DD date" }),
      reviewedDigest: z.string().regex(/^[0-9a-f]{16}$/, { message: "must be a lesson digest" }),
      notes: text.nullable(),
    })
    .nullable(),
}) satisfies z.ZodType<Lesson>;

export const lessonsFileSchema = z.strictObject({
  curriculumId: slug,
  levelId: slug,
  domainCode: code,
  lessons: z.array(lesson).min(1),
});

// ---- content/programmes/<curriculum>/<level>.json ---------------------------------------------

export const programmeFileSchema = z.strictObject({
  id: slug,
  curriculumId: slug,
  levelId: slug,
  schoolYearIds: z.array(z.string()).min(1),
  sessionMinutes: z.strictObject({ min: positiveInt, max: positiveInt }),
  rhythm: z
    .array(
      z.strictObject({
        position: positiveInt,
        slots: z.array(z.strictObject({ position: positiveInt, trackId: slug })).min(1),
      }),
    )
    .min(1),
  tracks: z.array(z.strictObject({ id: slug, domainCode: code, lessonIds: z.array(slug) })).min(1),
}) satisfies z.ZodType<LevelProgramme>;

export type DomainObjectivesFile = z.output<typeof domainObjectivesFileSchema>;
export type MaterialsFile = z.output<typeof materialsFileSchema>;
export type LessonsFile = z.output<typeof lessonsFileSchema>;

/** Flattens a domain objectives file into the domain model's flat records. */
export function flattenObjectives(file: DomainObjectivesFile): {
  subdomains: CurriculumSubdomain[];
  competencies: Competency[];
  objectives: LearningObjective[];
  successExamples: SuccessExample[];
} {
  const subdomains: CurriculumSubdomain[] = [];
  const competencies: Competency[] = [];
  const objectives: LearningObjective[] = [];
  const successExamples: SuccessExample[] = [];
  for (const subdomain of file.subdomains) {
    subdomains.push({
      code: subdomain.code,
      domainCode: file.domainCode,
      position: subdomain.position,
      title: subdomain.title,
    });
    for (const competency of subdomain.competencies) {
      competencies.push({
        code: competency.code,
        subdomainCode: subdomain.code,
        position: competency.position,
        title: competency.title,
      });
      for (const objective of competency.objectives) {
        objectives.push({
          code: objective.code,
          competencyCode: competency.code,
          position: objective.position,
          statement: objective.statement,
          group: objective.group,
          ageBandCodes: objective.ageBands,
          origin: "official",
          sourceId: file.sourceId,
          sourcePage: objective.sourcePage,
        });
      }
      for (const example of competency.successExamples) {
        successExamples.push({
          competencyCode: competency.code,
          ageBandCode: example.ageBand,
          position: example.position,
          statement: example.statement,
          group: example.group,
          sourceId: file.sourceId,
          sourcePage: example.sourcePage,
        });
      }
    }
  }
  return { subdomains, competencies, objectives, successExamples };
}

export type { AgeBand, CurriculumSource };
