import {
  type CalendarDate,
  calendarDateInTimeZone,
  formatFrenchDate,
} from "@/domain/calendar/date";
import { generateSchoolDays } from "@/domain/calendar/school-days";
import type { SchoolDay } from "@/domain/calendar/types";
import { ACTIVITY_RENDERERS, type RendererFamily } from "@/domain/lessons/renderers";
import { findText } from "@/domain/lessons/texts";
import type { Activity, Material } from "@/domain/lessons/types";
import { type MediaAsset, findAsset, mediaUrl } from "@/domain/media/types";
import { generateDailyPlan } from "@/domain/programme/daily-plan";
import type { DailyPlan } from "@/domain/programme/types";
import { getProgramme, getReferenceData } from "@/lib/content/reference-data";

/**
 * Turns the canonical content into what the parent's screen needs, and nothing more.
 *
 * The lesson view deliberately leaves out objective codes, competency titles, success examples
 * and provenance: a parent running a session after school needs the instruction and the next
 * step, not the curriculum apparatus (docs/PARENT_SESSION.md). Those stay in the API, the review
 * packages and the reports.
 */

export const LEVEL_ID = "maternelle-3";
export const SCHOOL_YEAR_ID = "2026-2027";

export type SessionText = {
  title: string;
  kind: "story" | "rhyme";
  lines: readonly string[];
};

export type SessionMedia = {
  id: string;
  url: string;
  /** French description, read by assistive technology. */
  alt: string;
  /** The words a lesson uses for it, so a renderer can ask for "le carré" by name. */
  tags: readonly string[];
};

export type SessionActivity = {
  id: string;
  position: number;
  title: string;
  childInstruction: string;
  adultGuidance: string;
  minutes: number;
  role: Activity["role"];
  renderer: RendererFamily;
  type: Activity["type"];
  vocabulary: readonly { fr: string; en: string | null }[];
  /** Optional English help. The interface keeps it hidden until the parent asks (ADR-001). */
  englishHelp: string | null;
  payload: Readonly<Record<string, unknown>>;
  text: SessionText | null;
  /** Pictures for this activity, already resolved: the client never sees a file path. */
  media: readonly SessionMedia[];
};

export type SessionStep = {
  position: number;
  domainCode: string;
  lessonTitle: string;
  lessonSummary: string;
  parentGuidance: string;
  activities: readonly SessionActivity[];
};

export type SessionDay = {
  instructionalDay: number;
  date: CalendarDate;
  dateLabel: string;
  levelName: string;
  totalMinutes: number;
  screenMinutes: number;
  pauseAfterSession: number | null;
  materials: readonly Material[];
  steps: readonly SessionStep[];
  status: DailyPlan["status"];
};

function toActivity(activity: Activity): SessionActivity {
  const textId = activity.payload["textId"];
  const text = typeof textId === "string" ? findText(getReferenceData().texts, textId) : undefined;
  return {
    id: activity.id,
    position: activity.position,
    title: activity.title,
    childInstruction: activity.childInstruction,
    adultGuidance: activity.adultGuidance,
    minutes: activity.minutes,
    role: activity.role,
    renderer: ACTIVITY_RENDERERS[activity.type].family,
    type: activity.type,
    vocabulary: activity.vocabulary,
    englishHelp: activity.scaffolds.find((s) => s.language === "en")?.childInstruction ?? null,
    payload: activity.payload,
    text: text === undefined ? null : { title: text.title, kind: text.kind, lines: text.lines },
    media: activity.mediaIds.flatMap((id) => {
      const asset: MediaAsset | undefined = findAsset(getReferenceData().media, id);
      return asset === undefined
        ? []
        : [{ id: asset.id, url: mediaUrl(asset), alt: asset.alt, tags: asset.tags }];
    }),
  };
}

/** Every day of the school year, instructional or not, for the calendar page. */
export function schoolDays(): SchoolDay[] {
  const data = getReferenceData();
  const calendar = data.calendars.find((c) => c.schoolYear.id === SCHOOL_YEAR_ID);
  if (calendar === undefined) throw new Error(`no calendar for ${SCHOOL_YEAR_ID}`);
  return generateSchoolDays(calendar, data.publicHolidays);
}

/** The session of one instructional day, or undefined when that day has no content yet. */
export function sessionForDay(day: number): SessionDay | undefined {
  const data = getReferenceData();
  const programme = getProgramme(LEVEL_ID, SCHOOL_YEAR_ID, data);
  const schoolDay = schoolDays().find((d) => d.instructionalDay === day);
  if (programme === undefined || schoolDay === undefined || schoolDay.date === null)
    return undefined;

  const plan = generateDailyPlan(schoolDay, programme, data.lessons);
  if (plan.status === "no-content" || plan.status === "not-instructional") return undefined;

  return {
    instructionalDay: day,
    date: schoolDay.date,
    dateLabel: formatFrenchDate(schoolDay.date),
    levelName: data.levels.find((l) => l.id === LEVEL_ID)?.name ?? LEVEL_ID,
    totalMinutes: plan.totalMinutes,
    screenMinutes: plan.screenMinutes,
    pauseAfterSession: plan.pauseAfterSession,
    materials: plan.materialCodes.flatMap((code) => {
      const material = data.materials.find((m) => m.code === code);
      // "Aucun matériel" is not something to prepare, so the list never shows it.
      return material === undefined || material.code === "aucun" ? [] : [material];
    }),
    steps: plan.sessions.flatMap((session) =>
      session.lesson === null
        ? []
        : [
            {
              position: session.position,
              domainCode: session.domainCode,
              lessonTitle: session.lesson.title,
              lessonSummary: session.lesson.summary,
              parentGuidance: session.lesson.parentGuidance,
              activities: session.lesson.activities.map(toActivity),
            },
          ],
    ),
    status: plan.status,
  };
}

/** Instructional days that already have a session, in order. */
export function authoredDays(): number[] {
  const days: number[] = [];
  for (const day of schoolDays()) {
    if (day.instructionalDay !== null && sessionForDay(day.instructionalDay) !== undefined) {
      days.push(day.instructionalDay);
    }
  }
  return days;
}

/**
 * Today, in the school's time zone, and the session to offer. If today is not a school day — a
 * weekend, a holiday, or a date outside the authored month — the parent is offered the most
 * recent day that has one, and told why.
 */
export function todaysSession(): {
  today: CalendarDate;
  todayLabel: string;
  isInstructional: boolean;
  reason: string | null;
  session: SessionDay | undefined;
} {
  const data = getReferenceData();
  const today = calendarDateInTimeZone(new Date(), data.defaultTimeZone);
  const day = schoolDays().find((d) => d.date === today);
  const authored = authoredDays();

  if (day?.instructional && day.instructionalDay !== null) {
    const session = sessionForDay(day.instructionalDay);
    if (session !== undefined) {
      return {
        today,
        todayLabel: formatFrenchDate(today),
        isInstructional: true,
        reason: null,
        session,
      };
    }
  }
  const reason =
    day === undefined
      ? "Cette date ne fait pas partie de l’année scolaire 2026-2027."
      : (day.reasons[0]?.name ??
        (day.reasons[0]?.code === "weekend"
          ? "C’est le week-end : il n’y a pas de séance aujourd’hui."
          : "Il n’y a pas de séance aujourd’hui."));
  const fallback = authored.at(-1);
  return {
    today,
    todayLabel: formatFrenchDate(today),
    isInstructional: day?.instructional ?? false,
    reason,
    session: fallback === undefined ? undefined : sessionForDay(fallback),
  };
}
