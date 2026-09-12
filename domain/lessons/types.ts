import type { ContentOrigin } from "../curriculum/types";
import type { LessonReview, LessonStatus } from "./review";

/**
 * Lessons and activities are **authored by Teka Edu** (`origin: "teka-edu-created"`). They are
 * never official text: they put the official learning objectives into practice in the DRC
 * context. Every activity traces back to at least one objective of the curriculum version
 * (docs/EDUCATIONAL_MODEL.md, docs/CONTENT_AUTHORING.md).
 */

/** Where a lesson sits in the progression of a learning objective. */
export const PROGRESSION_STAGES = ["discovery", "practice", "consolidation", "review"] as const;
export type ProgressionStage = (typeof PROGRESSION_STAGES)[number];

/**
 * What an activity is for inside the day. Teka Edu is an after-school reinforcement programme
 * (ADR-039), so revisiting is deliberate rather than accidental: every day carries a short
 * retrieval activity, and the last day of a week consolidates what the week covered.
 */
export const ACTIVITY_ROLES = ["teach", "retrieval", "consolidation"] as const;
export type ActivityRole = (typeof ACTIVITY_ROLES)[number];

/** How the child works: the daily programme keeps screen time short. */
export const ACTIVITY_MODES = ["off-screen", "on-screen", "mixed"] as const;
export type ActivityMode = (typeof ACTIVITY_MODES)[number];

/**
 * Activity kinds a future renderer can display. Adding a kind is a data + renderer change,
 * never a new table (ADR-032). `payload` carries the kind-specific data.
 */
export const ACTIVITY_TYPES = [
  "conversation",
  "vocabulary",
  "listening-story",
  "read-aloud",
  "song-rhyme",
  "phonology",
  "counting",
  "matching",
  "sorting",
  "observation",
  "drawing",
  "graphic-practice",
  "movement",
  "manipulation",
  "memory-game",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** A short French word or phrase the child should acquire; `en` is optional scaffolding only. */
export type VocabularyEntry = { fr: string; en: string | null };

/** Optional help for a child who does not yet understand French (ADR-001: never a second curriculum). */
export type ActivityScaffold = {
  /** Language of the help, e.g. "en". */
  language: string;
  /** The same instruction, in that language. */
  childInstruction: string;
};

export type Activity = {
  id: string;
  position: number;
  type: ActivityType;
  /** Short French title, for the adult. */
  title: string;
  /** What the child is asked to do, in French, in words a 3-to-5-year-old understands. */
  childInstruction: string;
  /** What the adult does: how to guide, what to watch for. */
  adultGuidance: string;
  minutes: number;
  mode: ActivityMode;
  /** Teaching, bringing something back (retrieval), or tying a week together (consolidation). */
  role: ActivityRole;
  /** Objectives this activity works on; each must be one of its lesson's objectives. */
  objectiveCodes: readonly string[];
  materialCodes: readonly string[];
  vocabulary: readonly VocabularyEntry[];
  scaffolds: readonly ActivityScaffold[];
  /**
   * Pictures the child looks at, by stable media id (ADR-042). Empty when the activity needs
   * none — movement, conversation and manipulation happen away from the screen.
   */
  mediaIds: readonly string[];
  /** Kind-specific data, validated per activity type by the content schemas. */
  payload: Readonly<Record<string, unknown>>;
};

export type Lesson = {
  id: string;
  curriculumId: string;
  /** Levels the lesson is written for. */
  levelIds: readonly string[];
  /** Primary curriculum domain. */
  domainCode: string;
  title: string;
  /** One line for the adult: what this lesson is about. */
  summary: string;
  /** The objectives the lesson teaches (at least one). Progression is tracked on these. */
  objectiveCodes: readonly string[];
  /**
   * Objectives the lesson reinvests without teaching them anew: earlier learning brought back,
   * or a daily ritual such as the read-aloud. Activities may serve these too.
   */
  supportingObjectiveCodes: readonly string[];
  stage: ProgressionStage;
  /** 1 to 3 within the level. */
  difficulty: number;
  /** Thematic unit, e.g. "la rentrée". */
  themeId: string | null;
  /** Guidance for the parent for the whole lesson. */
  parentGuidance: string;
  activities: readonly Activity[];
  origin: ContentOrigin;
  /** Where the lesson stands in the quality gate (ADR-035, domain/lessons/review.ts). */
  status: LessonStatus;
  /** Who approved this exact text, and when. Only an approved lesson has one. */
  review: LessonReview | null;
};

/** Something needed to run an activity (content/materials.json). */
export type Material = {
  code: string;
  name: string;
  /** none | screen | paper | writing | household | toy | outdoor */
  category: string;
  /**
   * What to use instead when a home does not have it. Homes in the DRC differ widely, so an
   * activity must never depend on one particular object (docs/CONTENT_AUTHORING.md).
   */
  alternatives: string | null;
  /** What the adult must watch for with a preschool child; null when there is nothing to add. */
  safetyNote: string | null;
};

export function lessonMinutes(lesson: Lesson): number {
  return lesson.activities.reduce((total, activity) => total + activity.minutes, 0);
}

export function lessonScreenMinutes(lesson: Lesson): number {
  return lesson.activities
    .filter((activity) => activity.mode !== "off-screen")
    .reduce((total, activity) => total + activity.minutes, 0);
}

export function lessonMaterialCodes(lesson: Lesson): string[] {
  return [...new Set(lesson.activities.flatMap((activity) => activity.materialCodes))].sort();
}
