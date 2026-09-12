import { type CalendarDate, formatFrenchDate, frenchWeekday } from "../calendar/date";
import type { Activity, Lesson } from "./types";

/**
 * Lesson text is written once and taught on a date the author does not know. Anything that
 * depends on the day is written as a placeholder and filled in when the daily plan is built:
 *
 *   "Aujourd’hui, nous sommes {{date}}."  ->  "Aujourd’hui, nous sommes mardi 8 septembre 2026."
 *
 * Spelling a date into the content itself would go stale the moment the calendar moves, which is
 * exactly the defect this replaces. A content test forbids written-out dates.
 */
export const TEMPLATE_TOKENS = ["date", "jour"] as const;
export type TemplateToken = (typeof TEMPLATE_TOKENS)[number];

const PATTERN = /\{\{\s*(date|jour)\s*\}\}/g;

export function resolveTemplate(text: string, date: CalendarDate | null): string {
  return text.replace(PATTERN, (match, token: TemplateToken) => {
    if (date === null) return match;
    return token === "date" ? formatFrenchDate(date) : frenchWeekday(date);
  });
}

/** True when the text still carries a placeholder (used by tests and the review package). */
export function hasTemplate(text: string): boolean {
  PATTERN.lastIndex = 0;
  return PATTERN.test(text);
}

function resolveActivity(activity: Activity, date: CalendarDate | null): Activity {
  const payload = Object.fromEntries(
    Object.entries(activity.payload).map(([key, value]) => [
      key,
      typeof value === "string"
        ? resolveTemplate(value, date)
        : Array.isArray(value)
          ? value.map((item) => (typeof item === "string" ? resolveTemplate(item, date) : item))
          : value,
    ]),
  );
  return {
    ...activity,
    childInstruction: resolveTemplate(activity.childInstruction, date),
    adultGuidance: resolveTemplate(activity.adultGuidance, date),
    payload,
  };
}

/** The lesson as it should be shown on a given date. */
export function resolveLesson(lesson: Lesson, date: CalendarDate | null): Lesson {
  return {
    ...lesson,
    parentGuidance: resolveTemplate(lesson.parentGuidance, date),
    activities: lesson.activities.map((activity) => resolveActivity(activity, date)),
  };
}
