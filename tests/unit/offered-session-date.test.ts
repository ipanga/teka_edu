import { describe, expect, it } from "vitest";
import { calendarDateInTimeZone, formatFrenchDate } from "../../domain/calendar/date";
import { offeredSessionTodayLabel } from "../e2e/helpers/offered-session";

describe("offered-session school-date assertion", () => {
  it.each([
    ["2026-10-07T21:59:59.999Z", "mercredi 7 octobre 2026"],
    ["2026-10-07T22:00:00.000Z", "mercredi 7 octobre 2026"],
    ["2026-10-07T22:30:00.000Z", "mercredi 7 octobre 2026"],
    ["2026-10-07T22:59:59.999Z", "mercredi 7 octobre 2026"],
    ["2026-10-07T23:00:00.000Z", "jeudi 8 octobre 2026"],
    ["2026-10-07T23:59:59.999Z", "jeudi 8 octobre 2026"],
  ])("uses the configured school date at %s", (instant, expected) => {
    expect(offeredSessionTodayLabel(new Date(instant))).toBe(expected);
  });

  it("does not mistake Lubumbashi midnight for the configured school's next day", () => {
    const instant = new Date("2026-10-07T22:30:00.000Z");
    const previousAssumption = formatFrenchDate(
      calendarDateInTimeZone(instant, "Africa/Lubumbashi"),
    );
    expect(previousAssumption).toBe("jeudi 8 octobre 2026");
    expect(offeredSessionTodayLabel(instant)).toBe("mercredi 7 octobre 2026");
    expect(offeredSessionTodayLabel(instant)).not.toBe(previousAssumption);
  });
});
