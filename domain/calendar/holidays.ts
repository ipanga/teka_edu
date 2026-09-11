import { type CalendarDate, calendarDate, dateParts, daysInMonth, isDateWithin } from "./date";
import type { PublicHoliday } from "./types";

export type HolidayOccurrence = { date: CalendarDate; holiday: PublicHoliday };

export function isHolidayValidOn(holiday: PublicHoliday, date: CalendarDate): boolean {
  return (
    (holiday.validFrom === null || date >= holiday.validFrom) &&
    (holiday.validUntil === null || date <= holiday.validUntil)
  );
}

/**
 * Dates on which fixed-date public holidays fall between `start` and `end` (inclusive),
 * sorted by date. A 29 February holiday only occurs in leap years. Holidays outside their
 * validity window are skipped. No substitution rule is applied here: substitute (observed)
 * days are explicit calendar exceptions, because observance can change from year to year.
 */
export function expandPublicHolidays(
  holidays: readonly PublicHoliday[],
  start: CalendarDate,
  end: CalendarDate,
): HolidayOccurrence[] {
  const occurrences: HolidayOccurrence[] = [];
  const firstYear = dateParts(start).year;
  const lastYear = dateParts(end).year;
  for (let year = firstYear; year <= lastYear; year++) {
    for (const holiday of holidays) {
      if (holiday.day > daysInMonth(year, holiday.month)) continue;
      const date = calendarDate(year, holiday.month, holiday.day);
      if (isDateWithin(date, start, end) && isHolidayValidOn(holiday, date)) {
        occurrences.push({ date, holiday });
      }
    }
  }
  // Plain code-unit comparison (not localeCompare): the order must not depend on the locale.
  const key = (o: HolidayOccurrence) => `${o.date} ${o.holiday.id}`;
  return occurrences.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}
