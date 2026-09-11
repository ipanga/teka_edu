import { afterEach, describe, expect, it } from "vitest";
import {
  addDays,
  calendarDate,
  calendarDateInTimeZone,
  datesBetween,
  fromDayNumber,
  isCalendarDate,
  isLeapYear,
  isoWeekday,
  parseCalendarDate,
  toDayNumber,
} from "@/domain/calendar/date";

const d = parseCalendarDate;

describe("calendar dates", () => {
  it("accepts only real YYYY-MM-DD dates", () => {
    expect(isCalendarDate("2026-09-01")).toBe(true);
    expect(isCalendarDate("2028-02-29")).toBe(true);
    expect(isCalendarDate("2027-02-29")).toBe(false);
    expect(isCalendarDate("2100-02-29")).toBe(false);
    expect(isCalendarDate("2000-02-29")).toBe(true);
    expect(isCalendarDate("2026-04-31")).toBe(false);
    expect(isCalendarDate("2026-9-1")).toBe(false);
    expect(isCalendarDate("2026-09-01T00:00:00Z")).toBe(false);
    expect(() => parseCalendarDate("2026-13-01")).toThrow(RangeError);
  });

  it("knows leap years", () => {
    expect([2024, 2028, 2000].map(isLeapYear)).toEqual([true, true, true]);
    expect([2026, 2027, 2100].map(isLeapYear)).toEqual([false, false, false]);
  });

  it("round-trips day numbers across many years", () => {
    expect(toDayNumber(d("1970-01-01"))).toBe(0);
    for (let n = toDayNumber(d("1999-12-01")); n <= toDayNumber(d("2032-03-31")); n++) {
      expect(toDayNumber(fromDayNumber(n))).toBe(n);
    }
  });

  it("computes ISO weekdays (Monday = 1)", () => {
    expect(isoWeekday(d("2026-09-01"))).toBe(2); // Tuesday: first day of 2026-2027
    expect(isoWeekday(d("2026-09-05"))).toBe(6); // Saturday
    expect(isoWeekday(d("2026-09-06"))).toBe(7); // Sunday
    expect(isoWeekday(d("2027-07-02"))).toBe(5); // Friday: last day of 2026-2027
    expect(isoWeekday(d("2028-02-29"))).toBe(2);
    expect(isoWeekday(d("1969-12-31"))).toBe(3);
  });

  it("crosses month, year and leap-day boundaries", () => {
    expect(addDays(d("2026-12-31"), 1)).toBe("2027-01-01");
    expect(addDays(d("2028-02-28"), 1)).toBe("2028-02-29");
    expect(addDays(d("2027-02-28"), 1)).toBe("2027-03-01");
    expect(addDays(d("2027-01-01"), -1)).toBe("2026-12-31");
    expect(datesBetween(d("2028-02-27"), d("2028-03-01"))).toEqual([
      "2028-02-27",
      "2028-02-28",
      "2028-02-29",
      "2028-03-01",
    ]);
    expect(datesBetween(d("2026-09-01"), d("2027-07-02"))).toHaveLength(305);
  });

  it("builds dates from parts and refuses impossible ones", () => {
    expect(calendarDate(2026, 9, 1)).toBe("2026-09-01");
    expect(() => calendarDate(2027, 2, 29)).toThrow(RangeError);
  });
});

describe("time zones", () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it("turns an instant into the local date of the given zone (the DRC has two)", () => {
    // 23:30 UTC on 31 August is already 1 September in Kinshasa (UTC+1) and Lubumbashi (UTC+2).
    const instant = new Date("2026-08-31T23:30:00Z");
    expect(calendarDateInTimeZone(instant, "Africa/Kinshasa")).toBe("2026-09-01");
    expect(calendarDateInTimeZone(instant, "Africa/Lubumbashi")).toBe("2026-09-01");
    expect(calendarDateInTimeZone(instant, "UTC")).toBe("2026-08-31");
    // 22:30 UTC: still 31 August in Kinshasa, already 1 September in Lubumbashi.
    const late = new Date("2026-08-31T22:30:00Z");
    expect(calendarDateInTimeZone(late, "Africa/Kinshasa")).toBe("2026-08-31");
    expect(calendarDateInTimeZone(late, "Africa/Lubumbashi")).toBe("2026-09-01");
  });

  it("gives identical date arithmetic whatever the host time zone", () => {
    const sample = () => ({
      weekday: isoWeekday(d("2026-09-01")),
      next: addDays(d("2027-03-27"), 2), // across the European DST change
      span: datesBetween(d("2026-10-24"), d("2026-10-26")),
    });
    process.env.TZ = "UTC";
    const reference = sample();
    for (const tz of [
      "Africa/Kinshasa",
      "Africa/Lubumbashi",
      "Pacific/Kiritimati",
      "Pacific/Pago_Pago",
      "Europe/Paris",
    ]) {
      process.env.TZ = tz;
      expect(sample()).toEqual(reference);
    }
  });
});
