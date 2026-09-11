import { calendarDate, dateParts, daysInMonth } from "./date";
import type { PublicHoliday, SchoolCalendar } from "./types";

/**
 * Business rules for calendar data, beyond the shape checks of the content schemas. The
 * database enforces the same rules with constraints (supabase/migrations), so data is
 * rejected whichever way it arrives. Returns human-readable problems; empty means valid.
 */

export function checkPublicHolidays(holidays: readonly PublicHoliday[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const holiday of holidays) {
    if (ids.has(holiday.id)) problems.push(`public holiday "${holiday.id}" is defined twice`);
    ids.add(holiday.id);
    // 2000 is a leap year, so 29 February is accepted (it then only occurs in leap years).
    if (holiday.month < 1 || holiday.month > 12 || holiday.day > daysInMonth(2000, holiday.month)) {
      problems.push(`public holiday "${holiday.id}" has no valid month/day`);
    }
    if (holiday.validFrom && holiday.validUntil && holiday.validUntil < holiday.validFrom) {
      problems.push(`public holiday "${holiday.id}" ends its validity before it starts`);
    }
    if (holiday.authority !== "teka-edu" && !holiday.source) {
      problems.push(`public holiday "${holiday.id}" needs a source`);
    }
  }
  return problems;
}

export function checkSchoolCalendar(
  calendar: SchoolCalendar,
  holidays: readonly PublicHoliday[],
): string[] {
  const { schoolYear: year, exceptions } = calendar;
  const problems: string[] = [];
  const at = `school year ${year.id}`;

  const match = /^(\d{4})-(\d{4})$/.exec(year.id);
  if (match === null || Number(match[2]) !== Number(match[1]) + 1) {
    problems.push(`${at}: id must be "YYYY-YYYY" with consecutive years`);
  } else if (dateParts(year.startsOn).year !== Number(match[1])) {
    problems.push(`${at}: must start in ${match[1]}`);
  }
  if (year.endsOn <= year.startsOn) problems.push(`${at}: must end after it starts`);
  const start = dateParts(year.startsOn);
  const oneYearLater = calendarDate(
    start.year + 1,
    start.month,
    Math.min(start.day, daysInMonth(start.year + 1, start.month)),
  );
  if (year.endsOn >= oneYearLater) problems.push(`${at}: must last less than a year`);
  if (year.instructionalWeekdays.length === 0) {
    problems.push(`${at}: needs at least one instructional weekday`);
  }
  if (new Set(year.instructionalWeekdays).size !== year.instructionalWeekdays.length) {
    problems.push(`${at}: instructional weekdays contain duplicates`);
  }
  if (year.authority !== "teka-edu" && !year.source) problems.push(`${at}: needs a source`);

  // Periods: numbered 1…n in date order, inside the year, not overlapping, terms ascending.
  const periods = [...calendar.periods].sort((a, b) => a.position - b.position);
  for (const [index, period] of periods.entries()) {
    const where = `${at}, period ${period.position}`;
    if (period.position !== index + 1) problems.push(`${where}: periods must be numbered 1…n`);
    if (period.endsOn < period.startsOn) problems.push(`${where}: ends before it starts`);
    if (period.startsOn < year.startsOn || period.endsOn > year.endsOn) {
      problems.push(`${where}: must lie within the school year`);
    }
    if (!Number.isInteger(period.term) || period.term < 1) {
      problems.push(`${where}: term must be a positive integer`);
    }
    const previous = periods[index - 1];
    if (previous !== undefined) {
      if (period.startsOn <= previous.endsOn) {
        problems.push(`${where}: must start after period ${previous.position} ends`);
      }
      if (period.term < previous.term) problems.push(`${where}: terms must not go backwards`);
    }
  }

  const holidayIds = new Set(holidays.map((h) => h.id));
  const exceptionIds = new Set<string>();
  for (const exception of exceptions) {
    const where = `${at}, exception "${exception.id}"`;
    if (exceptionIds.has(exception.id)) problems.push(`${where}: id is used twice`);
    exceptionIds.add(exception.id);
    if (exception.endsOn < exception.startsOn) problems.push(`${where}: ends before it starts`);
    if (exception.startsOn < year.startsOn || exception.endsOn > year.endsOn) {
      problems.push(`${where}: must lie within the school year`);
    }
    if (exception.kind === "observed-holiday") {
      if (exception.publicHolidayId === null || !holidayIds.has(exception.publicHolidayId)) {
        problems.push(`${where}: an observed holiday must reference a known public holiday`);
      }
    } else if (exception.publicHolidayId !== null) {
      problems.push(`${where}: only an observed holiday may reference a public holiday`);
    }
    if (exception.authority !== "teka-edu" && !exception.source) {
      problems.push(`${where}: needs a source`);
    }
  }

  // An instructional-day override may not contradict an exception of the same year (it may
  // override weekends and fixed-date holidays, which are rules, not exceptions).
  const overrides = exceptions.filter((e) => e.kind === "instructional-day");
  for (const override of overrides) {
    for (const other of exceptions) {
      if (other.kind === "instructional-day") continue;
      if (override.startsOn <= other.endsOn && other.startsOn <= override.endsOn) {
        problems.push(
          `${at}: instructional day "${override.id}" overlaps non-instructional exception "${other.id}"`,
        );
      }
    }
  }
  return problems;
}

/** School years must not overlap: every date belongs to at most one school year. */
export function checkSchoolYearsDoNotOverlap(calendars: readonly SchoolCalendar[]): string[] {
  const years = calendars
    .map((c) => c.schoolYear)
    .sort((a, b) => (a.startsOn < b.startsOn ? -1 : 1));
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const [index, year] of years.entries()) {
    if (ids.has(year.id)) problems.push(`school year ${year.id} is configured twice`);
    ids.add(year.id);
    const previous = years[index - 1];
    if (previous !== undefined && year.startsOn <= previous.endsOn) {
      problems.push(`school years ${previous.id} and ${year.id} overlap`);
    }
  }
  return problems;
}
