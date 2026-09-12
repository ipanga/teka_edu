/**
 * Civil calendar dates ("2026-09-01"): a day on the calendar, with no time and no time zone.
 *
 * School calendars are about dates, not instants. A school day is the same date in Kinshasa
 * (UTC+1) and in Lubumbashi (UTC+2). All arithmetic here works on integer day numbers and
 * never uses `Date`, so the host's time zone can never move a date to the previous or next
 * day. The only place a time zone matters is turning an instant ("now") into a date:
 * `calendarDateInTimeZone` does that explicitly. See docs/SCHOOL_CALENDAR.md.
 */

declare const calendarDateBrand: unique symbol;

/** An ISO 8601 calendar date, `YYYY-MM-DD`, validated by `parseCalendarDate`. */
export type CalendarDate = string & { readonly [calendarDateBrand]: true };

/** ISO 8601 weekday: Monday = 1 … Sunday = 7. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const ISO_WEEKDAYS: readonly IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    year >= 1000 &&
    year <= 9999 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
}

export function isCalendarDate(value: unknown): value is CalendarDate {
  if (typeof value !== "string") return false;
  const match = ISO_DATE.exec(value);
  return match !== null && isValidDateParts(Number(match[1]), Number(match[2]), Number(match[3]));
}

/** Validates `YYYY-MM-DD` (including the real length of the month). Throws a RangeError. */
export function parseCalendarDate(value: string): CalendarDate {
  if (!isCalendarDate(value)) throw new RangeError(`Not a valid calendar date: "${value}"`);
  return value;
}

export function calendarDate(year: number, month: number, day: number): CalendarDate {
  if (!isValidDateParts(year, month, day)) {
    throw new RangeError(`Not a valid calendar date: ${year}-${month}-${day}`);
  }
  const pad = (n: number, width: number) => String(n).padStart(width, "0");
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}` as CalendarDate;
}

export function dateParts(date: CalendarDate): { year: number; month: number; day: number } {
  return {
    year: Number(date.slice(0, 4)),
    month: Number(date.slice(5, 7)),
    day: Number(date.slice(8, 10)),
  };
}

/** Days since 1970-01-01 (negative before). Proleptic Gregorian calendar. */
export function toDayNumber(date: CalendarDate): number {
  const { year, month, day } = dateParts(date);
  // Howard Hinnant's days_from_civil: exact integer arithmetic, no Date involved.
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const dayOfYear = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

export function fromDayNumber(dayNumber: number): CalendarDate {
  const z = dayNumber + 719468;
  const era = Math.floor(z / 146097);
  const dayOfEra = z - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365,
  );
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const mp = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  const year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0);
  return calendarDate(year, month, day);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromDayNumber(toDayNumber(date) + days);
}

export function isoWeekday(date: CalendarDate): IsoWeekday {
  // Day 0 (1970-01-01) was a Thursday (ISO 4).
  return (((((toDayNumber(date) + 3) % 7) + 7) % 7) + 1) as IsoWeekday;
}

const WEEKDAY_NAMES = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const MONTH_NAMES = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "aout",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/**
 * The date as a parent would say it: "mardi 8 septembre 2026". Built from the civil date, never
 * from a `Date`, so it is the same in every time zone (ADR-029). Lesson content must never spell
 * a date out: it writes {{date}} and this fills it in (docs/CONTENT_AUTHORING.md).
 */
export function formatFrenchDate(date: CalendarDate): string {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const weekday = WEEKDAY_NAMES[isoWeekday(date) - 1];
  const dayLabel = day === 1 ? "1er" : String(day);
  return `${weekday} ${dayLabel} ${MONTH_NAMES[month - 1]} ${year}`;
}

/** The weekday alone: "mardi". */
export function frenchWeekday(date: CalendarDate): string {
  return WEEKDAY_NAMES[isoWeekday(date) - 1] as string;
}

/** Negative, zero or positive, like a sort comparator. ISO dates sort lexicographically. */
export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Every date from `start` to `end`, both included. */
export function datesBetween(start: CalendarDate, end: CalendarDate): CalendarDate[] {
  const first = toDayNumber(start);
  const last = toDayNumber(end);
  const dates: CalendarDate[] = [];
  for (let n = first; n <= last; n++) dates.push(fromDayNumber(n));
  return dates;
}

export function isDateWithin(date: CalendarDate, start: CalendarDate, end: CalendarDate): boolean {
  return date >= start && date <= end;
}

/**
 * The calendar date at `instant` in an IANA time zone, e.g. "Africa/Kinshasa" (UTC+1) or
 * "Africa/Lubumbashi" (UTC+2). This is the only function that turns an instant into a date.
 */
export function calendarDateInTimeZone(instant: Date, timeZone: string): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return calendarDate(part("year"), part("month"), part("day"));
}
