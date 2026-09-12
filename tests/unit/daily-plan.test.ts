import { describe, expect, it } from "vitest";
import { parseCalendarDate as d } from "@/domain/calendar/date";
import { describeDate, generateSchoolDays } from "@/domain/calendar/school-days";
import type { SchoolDay } from "@/domain/calendar/types";
import { generateDailyPlan, planForInstructionalDay } from "@/domain/programme/daily-plan";
import { checkProgramme } from "@/domain/programme/validation";
import { getProgramme, getReferenceData } from "@/lib/content/reference-data";

const data = getReferenceData();
const calendar = data.calendars.find((c) => c.schoolYear.id === "2026-2027");
if (!calendar) throw new Error("no 2026-2027 calendar");
const programme = getProgramme("maternelle-3", "2026-2027", data);
if (!programme) throw new Error("no programme for maternelle-3");
const schoolDays = generateSchoolDays(calendar, data.publicHolidays);
const planOn = (date: string) =>
  generateDailyPlan(
    describeDate(d(date), data.calendars, data.publicHolidays),
    programme,
    data.lessons,
  );
const dayPlan = (day: number) => planForInstructionalDay(day, programme, data.lessons);

describe("daily programme generator", () => {
  it("is deterministic: the same day always gives the same plan", () => {
    expect(dayPlan(3)).toEqual(dayPlan(3));
    expect(planOn("2026-09-03")).toEqual(planOn("2026-09-03"));
  });

  it("follows the instructional sequence, not the calendar weekday", () => {
    expect(dayPlan(1).rhythmDay).toBe(1);
    expect(dayPlan(5).rhythmDay).toBe(5);
    expect(dayPlan(10).rhythmDay).toBe(10);
    expect(dayPlan(11).rhythmDay).toBe(1);
    expect(dayPlan(21).rhythmDay).toBe(1);
  });

  it("advances each track by one lesson every time the rhythm gives it a slot", () => {
    const langOf = (day: number) =>
      dayPlan(day).sessions.find((s) => s.domainCode === "LANG")?.lesson?.id;
    expect([1, 2, 3, 4, 5].map(langOf)).toEqual([
      "m3-lang-01",
      "m3-lang-02",
      "m3-lang-03",
      "m3-lang-04",
      "m3-lang-05",
    ]);
    // The arts track only runs on rhythm days 2 and 4, so it advances twice per cycle.
    const artOf = (day: number) =>
      dayPlan(day).sessions.find((s) => s.domainCode === "ART")?.lesson?.id;
    expect(artOf(2)).toBe("m3-art-01");
    expect(artOf(4)).toBe("m3-art-02");
  });

  it("never repeats a lesson, and reports days whose content is still to be written", () => {
    const used = [1, 2, 3, 4, 5].flatMap((day) =>
      dayPlan(day).sessions.flatMap((s) => (s.lesson ? [s.lesson.id] : [])),
    );
    expect(new Set(used).size).toBe(used.length);
    expect(used).toHaveLength(20);
    // September is authored; October is not written yet.
    expect(dayPlan(23).status).toBe("no-content");
    expect(dayPlan(23).sessions.every((s) => s.lesson === null)).toBe(true);
    expect(dayPlan(23).totalMinutes).toBe(0);
  });

  it("produces a balanced pilot week", () => {
    for (const day of [1, 2, 3, 4, 5]) {
      const plan = dayPlan(day);
      expect(plan.status, `day ${day}`).toBe("complete");
      expect(plan.sessions).toHaveLength(4);
      expect(plan.totalMinutes).toBeGreaterThanOrEqual(30);
      expect(plan.totalMinutes).toBeLessThanOrEqual(45);
      expect(plan.screenMinutes * 2).toBeLessThanOrEqual(plan.totalMinutes);
      // Official: language, mathematics and physical activity happen every day.
      expect(plan.sessions.map((s) => s.domainCode).slice(0, 3)).toEqual(["LANG", "MATH", "PHYS"]);
      expect(
        plan.sessions.some((s) => s.lesson?.activities.some((a) => a.type === "movement")),
      ).toBe(true);
    }
    // Every domain appears within the five-day cycle.
    const domains = [1, 2, 3, 4, 5].flatMap((day) =>
      dayPlan(day).sessions.map((s) => s.domainCode),
    );
    expect(new Set(domains)).toEqual(
      new Set(["LANG", "MATH", "PHYS", "ART", "WORLD", "TIME-SPACE"]),
    );
  });

  it("answers what a child does on instructional day 1", () => {
    const plan = dayPlan(1);
    expect(plan.sessions.map((s) => s.lesson?.title)).toEqual([
      "Bonjour ! Je me présente",
      "Je compte jusqu’à cinq",
      "Je cours, je m’arrête",
      "Mon corps bouge",
    ]);
    expect(plan.totalMinutes).toBe(35);
    expect(plan.objectiveCodes).toContain("LANG-S01-C04-O11");
    expect(plan.materialCodes).toContain("petits-objets");
  });

  it("maps instructional days to real dates through the calendar", () => {
    const first = planOn("2026-09-01");
    expect(first.instructionalDay).toBe(1);
    expect(first.date).toBe("2026-09-01");
    // 2026-09-15 is instructional day 11, which is day 1 of the third cycle.
    const later = planOn("2026-09-15");
    expect(later.instructionalDay).toBe(11);
    expect(later.rhythmDay).toBe(1);
  });

  it("gives no programme on a day that is not instructional", () => {
    for (const [date, reason] of [
      ["2026-09-05", "weekend"],
      ["2026-12-28", "school-vacation"],
      ["2027-05-17", "public-holiday"],
    ] as const) {
      const plan = planOn(date);
      expect(plan.status, date).toBe("not-instructional");
      expect(plan.sessions).toEqual([]);
      expect(plan.instructionalDay).toBeNull();
      expect(plan.totalMinutes).toBe(0);
      expect(plan.reasons[0]?.code).toBe(reason);
    }
    // A date outside every school year has no programme either.
    expect(planOn("2027-08-10").status).toBe("not-instructional");
  });

  it("refuses an impossible instructional day", () => {
    expect(() => planForInstructionalDay(0, programme, data.lessons)).toThrow(RangeError);
    expect(() => planForInstructionalDay(1.5, programme, data.lessons)).toThrow(RangeError);
  });

  it("keeps the plan of a school day and of its instructional day identical", () => {
    const schoolDay = schoolDays.find((day) => day.date === "2026-09-02") as SchoolDay;
    const fromCalendar = generateDailyPlan(schoolDay, programme, data.lessons);
    const fromNumber = planForInstructionalDay(2, programme, data.lessons, {
      date: schoolDay.date,
      schoolYearId: schoolDay.schoolYearId,
    });
    expect(fromCalendar).toEqual(fromNumber);
  });
});

describe("programme validation", () => {
  const yearIds = data.calendars.map((c) => c.schoolYear.id);

  it("accepts the pilot programme", () => {
    expect(checkProgramme(programme, data.lessons, data.curricula, yearIds)).toEqual([]);
  });

  it("rejects a lesson scheduled in the wrong domain track", () => {
    const broken = {
      ...programme,
      tracks: programme.tracks.map((track) =>
        track.id === "arts" ? { ...track, lessonIds: ["m3-math-01"] } : track,
      ),
    };
    expect(checkProgramme(broken, data.lessons, data.curricula, yearIds).join("\n")).toMatch(
      /is a MATH lesson in the ART track/,
    );
  });

  it("rejects a lesson scheduled twice, and an unknown lesson", () => {
    const twice = {
      ...programme,
      tracks: programme.tracks.map((track) =>
        track.id === "monde" ? { ...track, lessonIds: ["m3-world-01", "m3-world-01"] } : track,
      ),
    };
    expect(checkProgramme(twice, data.lessons, data.curricula, yearIds).join()).toMatch(
      /scheduled twice/,
    );
    const unknown = {
      ...programme,
      tracks: programme.tracks.map((track) =>
        track.id === "monde" ? { ...track, lessonIds: ["m3-world-99"] } : track,
      ),
    };
    expect(checkProgramme(unknown, data.lessons, data.curricula, yearIds).join()).toMatch(
      /unknown lesson/,
    );
  });

  it("rejects a rhythm that drops a domain", () => {
    const broken = {
      ...programme,
      rhythm: programme.rhythm.map((day) => ({
        ...day,
        slots: day.slots.filter((slot) => slot.trackId !== "temps-espace"),
      })),
    };
    const problems = checkProgramme(broken, data.lessons, data.curricula, yearIds);
    expect(problems.join()).toMatch(/domain TIME-SPACE never appears/);
  });

  it("rejects a day that would be too long or all on screen", () => {
    const longLessons = data.lessons.map((lesson) =>
      lesson.domainCode === "LANG"
        ? {
            ...lesson,
            activities: lesson.activities.map((a) => ({
              ...a,
              minutes: 20,
              mode: "on-screen" as const,
            })),
          }
        : lesson,
    );
    const problems = checkProgramme(programme, longLessons, data.curricula, yearIds);
    expect(problems.join()).toMatch(/longer than the session maximum/);
    expect(problems.join()).toMatch(/on screen, more than half/);
  });
});
