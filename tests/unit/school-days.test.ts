import { describe, expect, it } from "vitest";
import { type CalendarDate, parseCalendarDate as d } from "@/domain/calendar/date";
import { expandPublicHolidays } from "@/domain/calendar/holidays";
import {
  currentOrNextSchoolYear,
  describeDate,
  findSchoolYear,
  generateSchoolDays,
  summarizeSchoolDays,
} from "@/domain/calendar/school-days";
import type {
  CalendarException,
  PublicHoliday,
  SchoolCalendar,
  SchoolYear,
} from "@/domain/calendar/types";
import { checkSchoolCalendar, checkSchoolYearsDoNotOverlap } from "@/domain/calendar/validation";
import { getReferenceData } from "@/lib/content/reference-data";

// ---- Synthetic fixtures (independent of the real DRC data) ---------------------------------

const teka = {
  authority: "teka-edu",
  verification: "needs-verification",
  source: null,
  notes: null,
} as const;

function holiday(
  id: string,
  month: number,
  day: number,
  extra: Partial<PublicHoliday> = {},
): PublicHoliday {
  return {
    id,
    name: `Holiday ${id}`,
    month,
    day,
    validFrom: null,
    validUntil: null,
    ...teka,
    ...extra,
  };
}

function year(id: string, startsOn: string, endsOn: string): SchoolYear {
  return {
    id,
    label: id,
    startsOn: d(startsOn),
    endsOn: d(endsOn),
    instructionalWeekdays: [1, 2, 3, 4, 5],
    ...teka,
  };
}

function exception(
  id: string,
  kind: CalendarException["kind"],
  startsOn: string,
  endsOn = startsOn,
  publicHolidayId: string | null = null,
): CalendarException {
  return {
    id,
    kind,
    startsOn: d(startsOn),
    endsOn: d(endsOn),
    name: `Exception ${id}`,
    publicHolidayId,
    ...teka,
  };
}

const HOLIDAYS = [holiday("xmas", 12, 25), holiday("new-year", 1, 1), holiday("leap", 2, 29)];

// 2027-2028 contains 29 February 2028.
const CALENDAR: SchoolCalendar = {
  schoolYear: year("2027-2028", "2027-09-01", "2028-07-01"),
  periods: [],
  exceptions: [
    exception("closure", "school-closure", "2027-10-11", "2027-10-12"),
    exception("vacation", "school-vacation", "2027-12-20", "2027-12-31"),
    exception("one-off", "public-holiday", "2027-11-15"),
    exception("observed", "observed-holiday", "2028-01-03", "2028-01-03", "new-year"),
    exception("makeup", "instructional-day", "2027-10-16"), // a Saturday
  ],
};

const days = generateSchoolDays(CALENDAR, HOLIDAYS);
const day = (date: string) => {
  const found = days.find((x) => x.date === date);
  if (!found) throw new Error(`no generated day for ${date}`);
  return found;
};

describe("instructional-day generator (synthetic calendar)", () => {
  it("covers every date of the school year, first to last, once", () => {
    expect(days[0]?.date).toBe("2027-09-01");
    expect(days.at(-1)?.date).toBe("2028-07-01");
    expect(new Set(days.map((x) => x.date)).size).toBe(days.length);
    expect(days).toHaveLength(305);
  });

  it("makes an ordinary weekday instructional, starting at day 1", () => {
    expect(day("2027-09-01")).toMatchObject({
      weekday: 3,
      instructional: true,
      instructionalDay: 1,
      reasons: [],
    });
    expect(day("2027-09-02").instructionalDay).toBe(2);
  });

  it("excludes Saturdays and Sundays", () => {
    expect(day("2027-09-04")).toMatchObject({
      weekday: 6,
      instructional: false,
      instructionalDay: null,
    });
    expect(day("2027-09-04").reasons.map((r) => r.code)).toEqual(["weekend"]);
    expect(day("2027-09-05")).toMatchObject({ weekday: 7, instructional: false });
  });

  it("excludes a fixed-date public holiday on a weekday, with its name", () => {
    // 2028-01-01 is a Saturday; 2027-12-25 is a Saturday: pick the leap-day holiday instead.
    expect(day("2028-02-29")).toMatchObject({ weekday: 2, instructional: false });
    expect(day("2028-02-29").reasons[0]).toMatchObject({
      code: "public-holiday",
      publicHolidayId: "leap",
    });
  });

  it("excludes one-off holidays, observed (substitute) days and closures", () => {
    expect(day("2027-11-15").reasons[0]).toMatchObject({
      code: "public-holiday",
      exceptionId: "one-off",
    });
    expect(day("2028-01-03").reasons[0]).toMatchObject({
      code: "observed-holiday",
      exceptionId: "observed",
      publicHolidayId: "new-year",
    });
    expect(day("2027-10-11").reasons[0]).toMatchObject({
      code: "school-closure",
      exceptionId: "closure",
    });
    expect(day("2027-10-12").instructional).toBe(false);
  });

  it("excludes vacation days and reports every reason, primary first", () => {
    // 25 December 2027 is a Saturday inside the vacation and a holiday.
    expect(day("2027-12-25").reasons.map((r) => r.code)).toEqual([
      "weekend",
      "school-vacation",
      "public-holiday",
    ]);
    expect(day("2027-12-24").reasons.map((r) => r.code)).toEqual(["school-vacation"]);
  });

  it("applies an explicit instructional-day override, even on a Saturday", () => {
    expect(day("2027-10-16")).toMatchObject({
      weekday: 6,
      instructional: true,
      override: { exceptionId: "makeup" },
    });
    expect(day("2027-10-16").reasons.map((r) => r.code)).toEqual(["weekend"]);
  });

  it("numbers instructional days without gaps; excluded days consume no number", () => {
    const numbers = days.filter((x) => x.instructional).map((x) => x.instructionalDay);
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
    expect(days.filter((x) => !x.instructional).every((x) => x.instructionalDay === null)).toBe(
      true,
    );
    // The closure (Mon 11, Tue 12 Oct) does not consume numbers: Fri 8 Oct → Wed 13 Oct is +1.
    expect(day("2027-10-13").instructionalDay).toBe((day("2027-10-08").instructionalDay ?? 0) + 1);
  });

  it("handles the leap day: 29 February exists only in leap years", () => {
    expect(days.some((x) => x.date === "2028-02-29")).toBe(true);
    const occurrences = expandPublicHolidays(HOLIDAYS, d("2026-01-01"), d("2029-12-31"));
    expect(occurrences.filter((o) => o.holiday.id === "leap").map((o) => o.date)).toEqual([
      "2028-02-29",
    ]);
  });

  it("respects holiday validity windows", () => {
    const limited = holiday("limited", 3, 1, { validFrom: d("2028-01-01") });
    const expanded = expandPublicHolidays([limited], d("2027-01-01"), d("2028-12-31"));
    expect(expanded.map((o) => o.date)).toEqual(["2028-03-01"]);
  });

  it("is deterministic: regenerating gives an identical result", () => {
    expect(generateSchoolDays(CALENDAR, HOLIDAYS)).toEqual(days);
    // Order of the configuration does not change the result either.
    const shuffled = { ...CALENDAR, exceptions: [...CALENDAR.exceptions].reverse() };
    expect(generateSchoolDays(shuffled, [...HOLIDAYS].reverse())).toEqual(days);
  });

  it("summarises: counts by primary reason add up", () => {
    const summary = summarizeSchoolDays(days);
    const excluded = Object.values(summary.excludedByPrimaryReason).reduce((a, b) => a + b, 0);
    expect(summary.instructionalDays + excluded).toBe(summary.totalDates);
    expect(summary.overriddenDates).toBe(1);
    expect(summary.excludedByPrimaryReason["school-closure"]).toBe(2);
  });
});

describe("school-year lookup and date questions", () => {
  const other: SchoolCalendar = {
    schoolYear: year("2028-2029", "2028-09-01", "2029-07-01"),
    periods: [],
    exceptions: [],
  };
  const calendars = [CALENDAR, other];

  it("finds the active school year, or the next one between years", () => {
    const years = calendars.map((c) => c.schoolYear);
    expect(findSchoolYear(d("2027-09-01"), years)?.id).toBe("2027-2028");
    expect(findSchoolYear(d("2028-07-01"), years)?.id).toBe("2027-2028");
    expect(findSchoolYear(d("2028-08-15"), years)).toBeUndefined();
    expect(currentOrNextSchoolYear(d("2028-08-15"), years)?.id).toBe("2028-2029");
  });

  it("describes a date outside every school year", () => {
    expect(describeDate(d("2028-08-15"), calendars, HOLIDAYS)).toMatchObject({
      schoolYearId: null,
      instructional: false,
      reasons: [{ code: "outside-school-year" }],
    });
  });

  it("describes a date inside a school year exactly like the generator", () => {
    expect(describeDate(d("2027-10-16"), calendars, HOLIDAYS)).toEqual(day("2027-10-16"));
  });
});

describe("calendar validation", () => {
  it("accepts the synthetic calendar", () => {
    expect(checkSchoolCalendar(CALENDAR, HOLIDAYS)).toEqual([]);
  });

  it("rejects duplicate exception ids (no duplicate entries)", () => {
    const duplicated = {
      ...CALENDAR,
      exceptions: [...CALENDAR.exceptions, exception("closure", "school-closure", "2027-11-01")],
    };
    expect(checkSchoolCalendar(duplicated, HOLIDAYS)).toContain(
      'school year 2027-2028, exception "closure": id is used twice',
    );
  });

  it("rejects exceptions outside the year, bad holiday references and contradictions", () => {
    const bad: SchoolCalendar = {
      ...CALENDAR,
      exceptions: [
        exception("outside", "school-closure", "2028-07-02"),
        exception("orphan", "observed-holiday", "2027-11-02", "2027-11-02", "unknown"),
        exception("vacation", "school-vacation", "2027-12-20", "2027-12-31"),
        exception("contradiction", "instructional-day", "2027-12-21"),
      ],
    };
    const problems = checkSchoolCalendar(bad, HOLIDAYS);
    expect(problems.some((p) => p.includes('"outside": must lie within'))).toBe(true);
    expect(problems.some((p) => p.includes('"orphan": an observed holiday must reference'))).toBe(
      true,
    );
    expect(problems.some((p) => p.includes('"contradiction" overlaps'))).toBe(true);
  });

  it("rejects malformed school years and overlapping years", () => {
    const longYear = { ...CALENDAR, schoolYear: year("2027-2028", "2027-09-01", "2028-09-01") };
    expect(checkSchoolCalendar(longYear, HOLIDAYS)).toContain(
      "school year 2027-2028: must last less than a year",
    );
    const wrongId = { ...CALENDAR, schoolYear: year("2027-2029", "2027-09-01", "2028-07-01") };
    expect(checkSchoolCalendar(wrongId, HOLIDAYS)[0]).toMatch(/consecutive years/);
    const overlap: SchoolCalendar = {
      schoolYear: year("2028-2029", "2028-06-01", "2029-05-31"),
      periods: [],
      exceptions: [],
    };
    expect(checkSchoolYearsDoNotOverlap([CALENDAR, overlap])).toEqual([
      "school years 2027-2028 and 2028-2029 overlap",
    ]);
  });
});

// ---- The configured DRC 2026-2027 school year ------------------------------------------------

describe("DRC school year 2026-2027 (content/calendars/cd/2026-2027.json)", () => {
  const data = getReferenceData();
  const calendar = data.calendars.find((c) => c.schoolYear.id === "2026-2027");
  if (!calendar) throw new Error("2026-2027 is not configured");
  const real = generateSchoolDays(calendar, data.publicHolidays);
  const on = (date: string) => real.find((x) => x.date === (date as CalendarDate));

  it("starts on 2026-09-01 as instructional day 1 and ends on 2027-07-02", () => {
    expect(on("2026-09-01")).toMatchObject({ instructional: true, instructionalDay: 1 });
    expect(real.at(-1)).toMatchObject({ date: "2027-07-02", instructional: true });
  });

  it("answers: is 15 September 2026 an instructional day? (yes, day 11)", () => {
    expect(on("2026-09-15")).toMatchObject({
      instructional: true,
      instructionalDay: 11,
      weekday: 2,
    });
  });

  it("excludes the legal holidays that fall on school weekdays", () => {
    for (const date of ["2027-04-06", "2027-05-17", "2027-06-30"]) {
      expect(on(date)?.reasons[0]?.code).toBe("public-holiday");
    }
    expect(on("2026-12-25")?.reasons.map((r) => r.code)).toEqual([
      "school-vacation",
      "public-holiday",
    ]);
  });

  it("matches the official calendar: vacations, periods and totals", () => {
    const summary = summarizeSchoolDays(real);
    expect(summary).toMatchObject({
      totalDates: 305,
      instructionalDays: 189,
      excludedByPrimaryReason: {
        weekend: 86,
        "school-vacation": 27,
        "public-holiday": 3,
        "observed-holiday": 0,
        "school-closure": 0,
      },
      firstInstructionalDate: "2026-09-01",
      lastInstructionalDate: "2027-07-02",
    });
    // Official maternelle counts per period minus the Saturdays the ministry counts (results
    // and report cards: 14 Nov, 27 Feb, 20 Mar, 29 May). Period 5: official 32, we count 33
    // (documented discrepancy, docs/SCHOOL_CALENDAR.md).
    expect(summary.instructionalDaysByPeriod).toEqual([
      { period: 1, instructionalDays: 47 },
      { period: 2, instructionalDays: 32 },
      { period: 3, instructionalDays: 28 },
      { period: 4, instructionalDays: 20 },
      { period: 5, instructionalDays: 33 },
      { period: 6, instructionalDays: 29 },
      { period: null, instructionalDays: 0 },
    ]);
  });
});
