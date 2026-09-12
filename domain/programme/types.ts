import type { CalendarDate } from "../calendar/date";
import type { NonInstructionalReason } from "../calendar/types";
import type { Lesson } from "../lessons/types";

/**
 * A level's daily programme definition: which kind of learning happens on each day of a
 * repeating rhythm, and in which order the lessons of each track are taught. It is authored
 * content (content/programmes/), not an algorithm's output, so a reviewer can read the whole
 * year's shape (docs/DAILY_PROGRAMME.md, ADR-033).
 */

/** One slot of a day: a domain, served by one track of lessons. */
export type ProgrammeSlot = {
  position: number;
  trackId: string;
};

/** One day of the repeating rhythm (rhythm day 1, 2, … R). */
export type ProgrammeRhythmDay = {
  position: number;
  slots: readonly ProgrammeSlot[];
};

/** An ordered sequence of lessons for one domain; the daily plan advances through it. */
export type ProgrammeTrack = {
  id: string;
  domainCode: string;
  /** Lessons in teaching order. */
  lessonIds: readonly string[];
};

export type LevelProgramme = {
  id: string;
  curriculumId: string;
  levelId: string;
  /** School years this programme is written for. */
  schoolYearIds: readonly string[];
  /** Guided minutes a session should stay within, for this level. */
  sessionMinutes: { min: number; max: number };
  /** The repeating rhythm; its length is the rotation period in instructional days. */
  rhythm: readonly ProgrammeRhythmDay[];
  tracks: readonly ProgrammeTrack[];
};

export type DailyPlanSession = {
  position: number;
  trackId: string;
  domainCode: string;
  /** Null when the track has no lesson for this day yet (content still to be authored). */
  lesson: Lesson | null;
  /** Position of this lesson inside its track, 1-based; null when there is no lesson. */
  trackStep: number | null;
  minutes: number;
};

export type DailyPlanStatus =
  /** Every slot has a lesson. */
  | "complete"
  /** Some slots have a lesson, some are still to be authored. */
  | "partial"
  /** No slot has a lesson yet. */
  | "no-content"
  /** The date is not an instructional day: there is no school programme. */
  | "not-instructional";

export type DailyPlan = {
  schoolYearId: string | null;
  date: CalendarDate | null;
  /** Position in the instructional sequence (1 … n); null outside instructional days. */
  instructionalDay: number | null;
  /** Position in the repeating rhythm, 1-based; null outside instructional days. */
  rhythmDay: number | null;
  levelId: string;
  curriculumId: string;
  status: DailyPlanStatus;
  sessions: readonly DailyPlanSession[];
  totalMinutes: number;
  screenMinutes: number;
  /**
   * Position of the session after which the parent may stop and finish later (ADR-039). The
   * session is one block of 30 to 45 minutes, but a five-year-old coming home from school may
   * need it in two halves; this says where the seam is. Null when the day has no content.
   */
  pauseAfterSession: number | null;
  /** Every objective the day works on, in session order, without duplicates. */
  objectiveCodes: readonly string[];
  materialCodes: readonly string[];
  /** Why there is no programme, when the date is not instructional. */
  reasons: readonly NonInstructionalReason[];
};
