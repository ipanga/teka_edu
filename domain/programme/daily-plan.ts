import type { CalendarDate } from "../calendar/date";
import type { SchoolDay } from "../calendar/types";
import { resolveLesson } from "../lessons/template";
import { type Lesson, lessonMinutes, lessonScreenMinutes } from "../lessons/types";
import type {
  DailyPlan,
  DailyPlanSession,
  DailyPlanStatus,
  LevelProgramme,
  ProgrammeTrack,
} from "./types";

/**
 * The daily-programme generator (ADR-033, docs/DAILY_PROGRAMME.md).
 *
 * Inputs: the school day (from the calendar), the level's programme and its lessons.
 * It is a pure function of (programme, lessons, instructional day): the same inputs always
 * give the same plan, and no clock, database or random choice is involved.
 *
 * Rules:
 *   1. The day of the rhythm is `((instructionalDay - 1) mod R) + 1`, so the rhythm follows
 *      the instructional sequence. A holiday shifts dates, never the order of learning.
 *   2. Each slot takes the next lesson of its track: a track advances by one every time the
 *      rhythm gives it a slot, so nothing is taught twice and nothing is skipped.
 *   3. A slot whose track has no lesson left is reported as empty (content still to author),
 *      never filled with a repeat.
 *   4. A date that is not instructional has no programme at all.
 */
export function generateDailyPlan(
  schoolDay: SchoolDay,
  programme: LevelProgramme,
  lessons: readonly Lesson[],
): DailyPlan {
  if (schoolDay.instructional && schoolDay.instructionalDay !== null) {
    return planForInstructionalDay(schoolDay.instructionalDay, programme, lessons, {
      date: schoolDay.date,
      schoolYearId: schoolDay.schoolYearId,
    });
  }
  const empty = {
    levelId: programme.levelId,
    curriculumId: programme.curriculumId,
    sessions: [],
    totalMinutes: 0,
    screenMinutes: 0,
    pauseAfterSession: null,
    objectiveCodes: [],
    materialCodes: [],
  };
  return {
    ...empty,
    schoolYearId: schoolDay.schoolYearId,
    date: schoolDay.date,
    instructionalDay: null,
    rhythmDay: null,
    status: "not-instructional",
    reasons: schoolDay.reasons,
  };
}

/**
 * The plan of instructional day `day`, independent of any calendar. `generateDailyPlan` is the
 * usual entry point; this one is used to check a programme's balance before a year exists.
 */
export function planForInstructionalDay(
  day: number,
  programme: LevelProgramme,
  lessons: readonly Lesson[],
  context: { date: CalendarDate | null; schoolYearId: string | null } = {
    date: null,
    schoolYearId: null,
  },
): DailyPlan {
  if (!Number.isInteger(day) || day < 1) {
    throw new RangeError(`instructional day must be a positive integer, got ${day}`);
  }
  const rhythmLength = programme.rhythm.length;
  if (rhythmLength === 0) {
    throw new RangeError(`programme ${programme.id} has an empty rhythm`);
  }
  const rhythmDay = ((day - 1) % rhythmLength) + 1;
  const rhythm = programme.rhythm.find((r) => r.position === rhythmDay);
  if (rhythm === undefined) {
    throw new RangeError(`programme ${programme.id} has no rhythm day ${rhythmDay}`);
  }
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const trackById = new Map(programme.tracks.map((track) => [track.id, track]));

  // Slots taken in order; a track used twice in the same day advances twice.
  const usedToday = new Map<string, number>();
  const sessions: DailyPlanSession[] = [...rhythm.slots]
    .sort((a, b) => a.position - b.position)
    .map((slot, index) => {
      const track = trackById.get(slot.trackId);
      if (track === undefined) {
        throw new RangeError(`programme ${programme.id} has no track "${slot.trackId}"`);
      }
      const taken = usedToday.get(track.id) ?? 0;
      usedToday.set(track.id, taken + 1);
      const step = trackStepBefore(programme, track, day) + taken + 1;
      const lessonId = track.lessonIds[step - 1];
      const lesson = lessonId === undefined ? null : (byId.get(lessonId) ?? null);
      if (lessonId !== undefined && lesson === null) {
        throw new RangeError(`programme ${programme.id} refers to unknown lesson "${lessonId}"`);
      }
      return {
        position: index + 1,
        trackId: track.id,
        domainCode: track.domainCode,
        // Anything the lesson wrote as {{date}} becomes the real date of this day.
        lesson: lesson === null ? null : resolveLesson(lesson, context.date),
        trackStep: lesson === null ? null : step,
        minutes: lesson === null ? 0 : lessonMinutes(lesson),
      };
    });

  // Where to split the session if the child needs a break: after the session that first takes
  // the day past its halfway mark, never after the last one (a pause at the end is just an end).
  const totalWithLessons = sessions.reduce((total, session) => total + session.minutes, 0);
  let elapsed = 0;
  let pauseAfterSession: number | null = null;
  for (const session of sessions) {
    elapsed += session.minutes;
    if (pauseAfterSession === null && elapsed * 2 >= totalWithLessons && session.lesson !== null) {
      pauseAfterSession = session.position;
    }
  }
  if (pauseAfterSession === sessions.length) pauseAfterSession = sessions.length - 1;
  if (totalWithLessons === 0) pauseAfterSession = null;

  const withLesson = sessions.filter((session) => session.lesson !== null);
  const status: DailyPlanStatus =
    withLesson.length === sessions.length
      ? "complete"
      : withLesson.length === 0
        ? "no-content"
        : "partial";

  return {
    schoolYearId: context.schoolYearId,
    date: context.date,
    instructionalDay: day,
    rhythmDay,
    levelId: programme.levelId,
    curriculumId: programme.curriculumId,
    status,
    pauseAfterSession,
    sessions,
    totalMinutes: sessions.reduce((total, session) => total + session.minutes, 0),
    screenMinutes: withLesson.reduce(
      (total, session) => total + (session.lesson ? lessonScreenMinutes(session.lesson) : 0),
      0,
    ),
    objectiveCodes: unique(withLesson.flatMap((session) => session.lesson?.objectiveCodes ?? [])),
    materialCodes: unique(
      withLesson.flatMap((session) =>
        (session.lesson?.activities ?? []).flatMap((activity) => activity.materialCodes),
      ),
    ).sort(),
    reasons: [],
  };
}

/** How many lessons the track has already used before instructional day `day` (1-based). */
function trackStepBefore(programme: LevelProgramme, track: ProgrammeTrack, day: number): number {
  const rhythmLength = programme.rhythm.length;
  const slotDays = programme.rhythm.flatMap((r) =>
    r.slots.filter((slot) => slot.trackId === track.id).map(() => r.position),
  );
  const completeCycles = Math.floor((day - 1) / rhythmLength);
  const rhythmDay = ((day - 1) % rhythmLength) + 1;
  const earlierThisCycle = slotDays.filter((position) => position < rhythmDay).length;
  return completeCycles * slotDays.length + earlierThisCycle;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

/** Lessons of a programme's tracks, in teaching order, without duplicates. */
export function programmeLessonIds(programme: LevelProgramme): string[] {
  return unique(programme.tracks.flatMap((track) => track.lessonIds));
}
