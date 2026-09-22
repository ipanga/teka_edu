import { type CalendarDate, type IsoWeekday, datesBetween, isDateWithin, isoWeekday } from "./date";
import { expandPublicHolidays } from "./holidays";
import {
  type CalendarException,
  type NonInstructionalReason,
  type NonInstructionalReasonCode,
  type PublicHoliday,
  REASON_PRECEDENCE,
  type SchoolCalendar,
  type SchoolDay,
  type SchoolYear,
} from "./types";

const EXCEPTION_REASON: Partial<Record<CalendarException["kind"], NonInstructionalReasonCode>> = {
  "public-holiday": "public-holiday",
  "observed-holiday": "observed-holiday",
  "school-vacation": "school-vacation",
  "school-closure": "school-closure",
};

function byPrecedence(a: NonInstructionalReason, b: NonInstructionalReason): number {
  return REASON_PRECEDENCE.indexOf(a.code) - REASON_PRECEDENCE.indexOf(b.code);
}

/**
 * The instructional-day generator. Returns one entry for every date of the school year,
 * from its first to its last date, in order. Pure and deterministic: the same calendar and
 * holidays always give the same result, whatever the host time zone or the current date.
 *
 * Rules (docs/SCHOOL_CALENDAR.md):
 *   1. A date is non-instructional if it is not an instructional weekday, a public holiday
 *      (fixed-date, one-off or observed), or inside a school vacation or closure.
 *   2. An `instructional-day` exception makes the date instructional regardless of rule 1.
 *   3. Instructional days are numbered 1, 2, 3… without gaps; excluded dates use no number.
 */
export function generateSchoolDays(
  calendar: SchoolCalendar,
  holidays: readonly PublicHoliday[],
): SchoolDay[] {
  const { schoolYear, exceptions } = calendar;
  const holidaysByDate = new Map<CalendarDate, PublicHoliday[]>();
  for (const { date, holiday } of expandPublicHolidays(
    holidays,
    schoolYear.startsOn,
    schoolYear.endsOn,
  )) {
    holidaysByDate.set(date, [...(holidaysByDate.get(date) ?? []), holiday]);
  }

  let instructionalDay = 0;
  return datesBetween(schoolYear.startsOn, schoolYear.endsOn).map((date) => {
    const weekday = isoWeekday(date);
    const reasons: NonInstructionalReason[] = [];
    if (!schoolYear.instructionalWeekdays.includes(weekday)) {
      reasons.push({ code: "weekend", name: null, publicHolidayId: null, exceptionId: null });
    }
    for (const holiday of holidaysByDate.get(date) ?? []) {
      reasons.push({
        code: "public-holiday",
        name: holiday.name,
        publicHolidayId: holiday.id,
        exceptionId: null,
      });
    }
    let override: SchoolDay["override"] = null;
    for (const exception of exceptions) {
      if (!isDateWithin(date, exception.startsOn, exception.endsOn)) continue;
      const code = EXCEPTION_REASON[exception.kind];
      if (code === undefined) {
        override ??= { exceptionId: exception.id, name: exception.name };
      } else {
        reasons.push({
          code,
          name: exception.name,
          publicHolidayId: exception.publicHolidayId,
          exceptionId: exception.id,
        });
      }
    }
    reasons.sort(byPrecedence);

    const instructional = override !== null || reasons.length === 0;
    return {
      date,
      weekday,
      schoolYearId: schoolYear.id,
      period:
        calendar.periods.find((p) => isDateWithin(date, p.startsOn, p.endsOn))?.position ?? null,
      instructional,
      instructionalDay: instructional ? ++instructionalDay : null,
      reasons,
      override,
    };
  });
}

export function findSchoolYear(
  date: CalendarDate,
  schoolYears: readonly SchoolYear[],
): SchoolYear | undefined {
  return schoolYears.find((year) => isDateWithin(date, year.startsOn, year.endsOn));
}

/** The school year in progress on `date`, or else the next one to start (e.g. in July). */
export function currentOrNextSchoolYear(
  date: CalendarDate,
  schoolYears: readonly SchoolYear[],
): SchoolYear | undefined {
  return (
    findSchoolYear(date, schoolYears) ??
    [...schoolYears]
      .filter((year) => year.startsOn > date)
      .sort((a, b) => (a.startsOn < b.startsOn ? -1 : 1))[0]
  );
}

/**
 * Answers "is this date an instructional day, and if not, why?" for any date. Dates outside
 * every configured school year are non-instructional with reason `outside-school-year`.
 */
export function describeDate(
  date: CalendarDate,
  calendars: readonly SchoolCalendar[],
  holidays: readonly PublicHoliday[],
): SchoolDay {
  const calendar = calendars.find(({ schoolYear }) =>
    isDateWithin(date, schoolYear.startsOn, schoolYear.endsOn),
  );
  if (calendar !== undefined) {
    const day = generateSchoolDays(calendar, holidays).find((d) => d.date === date);
    if (day !== undefined) return day;
  }
  return {
    date,
    weekday: isoWeekday(date),
    schoolYearId: null,
    period: null,
    instructional: false,
    instructionalDay: null,
    reasons: [
      { code: "outside-school-year", name: null, publicHolidayId: null, exceptionId: null },
    ],
    override: null,
  };
}

export type SchoolCalendarSummary = {
  schoolYearId: string;
  startsOn: CalendarDate;
  endsOn: CalendarDate;
  totalDates: number;
  instructionalDays: number;
  nonInstructionalDays: number;
  /** Non-instructional dates counted once each, by primary reason (they add up). */
  excludedByPrimaryReason: Record<
    Exclude<NonInstructionalReasonCode, "outside-school-year">,
    number
  >;
  /** Dates made instructional by an `instructional-day` exception. */
  overriddenDates: number;
  firstInstructionalDate: CalendarDate | null;
  lastInstructionalDate: CalendarDate | null;
  /** Every public holiday (fixed, one-off or observed) falling inside the school year. */
  holidays: { date: CalendarDate; weekday: IsoWeekday; name: string; excludedAWeekday: boolean }[];
  /** Instructional days per school period, and those falling outside every period. */
  instructionalDaysByPeriod: { period: number | null; instructionalDays: number }[];
};

export function summarizeSchoolDays(days: readonly SchoolDay[]): SchoolCalendarSummary {
  const first = days[0];
  const last = days.at(-1);
  if (first === undefined || last === undefined || first.schoolYearId === null) {
    throw new RangeError("summarizeSchoolDays needs the generated days of one school year");
  }
  const excludedByPrimaryReason: SchoolCalendarSummary["excludedByPrimaryReason"] = {
    weekend: 0,
    "school-vacation": 0,
    "public-holiday": 0,
    "observed-holiday": 0,
    "school-closure": 0,
  };
  const instructional = days.filter((d) => d.instructional);
  for (const day of days) {
    const primary = day.reasons[0];
    if (!day.instructional && primary !== undefined && primary.code !== "outside-school-year") {
      excludedByPrimaryReason[primary.code] += 1;
    }
  }
  const holidays = days.flatMap((day) =>
    day.reasons
      .filter((r) => r.code === "public-holiday" || r.code === "observed-holiday")
      .map((r) => ({
        date: day.date,
        weekday: day.weekday,
        name: r.name ?? "",
        excludedAWeekday: !day.instructional && day.reasons[0] === r,
      })),
  );
  return {
    schoolYearId: first.schoolYearId,
    startsOn: first.date,
    endsOn: last.date,
    totalDates: days.length,
    instructionalDays: instructional.length,
    nonInstructionalDays: days.length - instructional.length,
    excludedByPrimaryReason,
    overriddenDates: days.filter((d) => d.override !== null && d.reasons.length > 0).length,
    firstInstructionalDate: instructional[0]?.date ?? null,
    lastInstructionalDate: instructional.at(-1)?.date ?? null,
    holidays,
    instructionalDaysByPeriod: [...new Set(days.map((d) => d.period))]
      .sort((a, b) => (a ?? Infinity) - (b ?? Infinity))
      .map((period) => ({
        period,
        instructionalDays: instructional.filter((d) => d.period === period).length,
      })),
  };
}
