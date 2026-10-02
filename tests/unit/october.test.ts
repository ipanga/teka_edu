import { describe, expect, it } from "vitest";
import { generateSchoolDays } from "@/domain/calendar/school-days";
import { entriesDueBy } from "@/domain/programme/annual-plan";
import { generateDailyPlan } from "@/domain/programme/daily-plan";
import { getProgramme, getReferenceData } from "@/lib/content/reference-data";

const data = getReferenceData();
const calendar = data.calendars.find((c) => c.schoolYear.id === "2026-2027")!;
const programme = getProgramme("maternelle-3", "2026-2027", data)!;
const annualPlan = data.annualPlans.find((p) => p.levelId === "maternelle-3")!;
const days = generateSchoolDays(calendar, data.publicHolidays);
const october = days.filter((day) => day.date.startsWith("2026-10"));
const instructional = october.filter((day) => day.instructional);
const authoredBatch = instructional.filter(
  (day) =>
    day.instructionalDay !== null && day.instructionalDay >= 23 && day.instructionalDay <= 29,
);
const plans = authoredBatch.map((day) => generateDailyPlan(day, programme, data.lessons));

describe("October 2026 batch 1 (3ème maternelle)", () => {
  it("uses the configured DRC calendar and covers the first two October instructional weeks", () => {
    expect(instructional).toHaveLength(22);
    expect(instructional[0]?.date).toBe("2026-10-01");
    expect(instructional[0]?.instructionalDay).toBe(23);
    expect(instructional.at(-1)?.date).toBe("2026-10-30");
    expect(instructional.at(-1)?.instructionalDay).toBe(44);
    expect(
      october.filter((day) => !day.instructional && day.reasons.some((r) => r.code !== "weekend")),
    ).toEqual([]);
    expect(authoredBatch.map((day) => day.date)).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
    ]);
  });

  it("authored days 23-29 and leaves day 30 for a later batch", () => {
    for (const plan of plans) {
      expect(plan.status, `day ${plan.instructionalDay}`).toBe("complete");
      expect(plan.sessions).toHaveLength(4);
      expect(plan.totalMinutes).toBe(35);
      expect(plan.sessions.map((session) => session.domainCode).slice(0, 3)).toEqual([
        "LANG",
        "MATH",
        "PHYS",
      ]);
    }

    const day30 = generateDailyPlan(
      days.find((day) => day.instructionalDay === 30)!,
      programme,
      data.lessons,
    );
    expect(day30.status).toBe("no-content");
    expect(day30.sessions.every((session) => session.lesson === null)).toBe(true);
  });

  it("keeps new October lessons in review with no approval record", () => {
    const octoberLessons = plans.flatMap((plan) =>
      plan.sessions.flatMap((session) => (session.lesson ? [session.lesson] : [])),
    );
    expect(octoberLessons).toHaveLength(28);
    expect(new Set(octoberLessons.map((lesson) => lesson.id)).size).toBe(28);
    for (const lesson of octoberLessons) {
      expect(lesson.status, lesson.id).toBe("review");
      expect(lesson.review, lesson.id).toBeNull();
    }
  });

  it("covers every annual-plan objective due by instructional day 29", () => {
    const taught = new Set(
      plans.flatMap((plan) =>
        plan.sessions.flatMap((session) =>
          session.lesson ? [...session.lesson.objectiveCodes] : [],
        ),
      ),
    );
    const septemberTaught = new Set(
      Array.from({ length: 22 }, (_, index) => index + 1).flatMap((day) =>
        generateDailyPlan(
          days.find((schoolDay) => schoolDay.instructionalDay === day)!,
          programme,
          data.lessons,
        ).sessions.flatMap((session) => (session.lesson ? [...session.lesson.objectiveCodes] : [])),
      ),
    );
    for (const code of septemberTaught) taught.add(code);

    const missing = entriesDueBy(annualPlan, 29).filter(
      (entry) => !taught.has(entry.objectiveCode),
    );
    expect(missing.map((entry) => entry.objectiveCode)).toEqual([]);
  });
});
