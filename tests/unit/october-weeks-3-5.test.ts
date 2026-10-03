import { describe, expect, it } from "vitest";
import { generateSchoolDays } from "@/domain/calendar/school-days";
import { generateDailyPlan } from "@/domain/programme/daily-plan";
import { entriesDueBy } from "@/domain/programme/annual-plan";
import { getProgramme, getReferenceData } from "@/lib/content/reference-data";
import { checkLessonReview } from "@/domain/lessons/review";
import { mediaDigestSource } from "@/domain/media/types";

const data = getReferenceData();
const programme = getProgramme("maternelle-3", "2026-2027", data)!;
const annual = data.annualPlans.find((p) => p.levelId === "maternelle-3")!;
const days = generateSchoolDays(
  data.calendars.find((c) => c.schoolYear.id === "2026-2027")!,
  data.publicHolidays,
);
const plans = days
  .filter(
    (d) => d.instructionalDay !== null && d.instructionalDay >= 30 && d.instructionalDay <= 44,
  )
  .map((d) => generateDailyPlan(d, programme, data.lessons));
const lessons = plans.flatMap((p) => p.sessions.flatMap((s) => (s.lesson ? [s.lesson] : [])));
const through44 = days
  .filter((d) => d.instructionalDay !== null && d.instructionalDay <= 44)
  .map((d) => generateDailyPlan(d, programme, data.lessons));

describe("October Weeks 3–5 authoring boundary", () => {
  it("authors exactly fifteen complete days and sixty independently approved lessons", () => {
    expect(plans).toHaveLength(15);
    expect(plans[0]?.date).toBe("2026-10-12");
    expect(plans.at(-1)?.date).toBe("2026-10-30");
    expect(lessons).toHaveLength(60);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(60);
    for (const p of plans) {
      expect(p.status).toBe("complete");
      expect(p.totalMinutes).toBe(35);
      expect(p.sessions.map((s) => s.domainCode).slice(0, 3)).toEqual(["LANG", "MATH", "PHYS"]);
      expect(
        p.sessions.map((s) => s.lesson?.activities.reduce((n, a) => n + a.minutes, 0)),
      ).toEqual([13, 9, 6, 7]);
    }
    for (const l of lessons) {
      expect(l.status, l.id).toBe("approved");
      expect(l.review?.outcome, l.id).toBe("accepted");
      const canonical = data.lessons.find((candidate) => candidate.id === l.id)!;
      expect(checkLessonReview(canonical, mediaDigestSource(data.media, data.texts))).toEqual([]);
    }
    const after = generateDailyPlan(
      days.find((d) => d.instructionalDay === 45)!,
      programme,
      data.lessons,
    );
    expect(after.status).toBe("no-content");
    expect(after.sessions.every((s) => s.lesson === null)).toBe(true);
  });

  it("opens with the resolved French date, retrieves, reads for pleasure and consolidates weekly", () => {
    for (const p of plans) {
      const language = p.sessions[0]!.lesson!;
      const ritual = language.activities[0]!;
      expect(ritual.childInstruction).toMatch(/^Dis la date\./);
      expect(ritual.adultGuidance).not.toContain("{{");
      expect(ritual.adultGuidance).toContain("octobre 2026");
      expect(ritual.minutes).toBe(3);
      expect(ritual.objectiveCodes).toContain("TIME-SPACE-S01-C01-O12");
      expect(ritual.role).toBe(
        [34, 39, 44].includes(p.instructionalDay!) ? "consolidation" : "retrieval",
      );
      const reading = language.activities.filter((a) => a.type === "read-aloud");
      expect(reading).toHaveLength(1);
      expect(reading[0]!.payload).not.toHaveProperty("questions");
      expect(data.texts.some((t) => t.id === reading[0]!.payload["textId"])).toBe(true);
    }
  });

  it("preserves the canonical rotating days and the full-month distribution", () => {
    expect(plans.map((p) => [p.instructionalDay, p.sessions[3]!.domainCode])).toEqual([
      [30, "TIME-SPACE"],
      [31, "WORLD"],
      [32, "ART"],
      [33, "TIME-SPACE"],
      [34, "ART"],
      [35, "WORLD"],
      [36, "TIME-SPACE"],
      [37, "ART"],
      [38, "TIME-SPACE"],
      [39, "WORLD"],
      [40, "TIME-SPACE"],
      [41, "WORLD"],
      [42, "ART"],
      [43, "TIME-SPACE"],
      [44, "ART"],
    ]);
    const count = (ps: typeof plans) =>
      Object.fromEntries(
        ["LANG", "MATH", "PHYS", "ART", "WORLD", "TIME-SPACE"].map((code) => [
          code,
          ps.flatMap((p) => p.sessions).filter((s) => s.domainCode === code).length,
        ]),
      );
    expect(count(plans)).toEqual({
      LANG: 15,
      MATH: 15,
      PHYS: 15,
      ART: 5,
      WORLD: 4,
      "TIME-SPACE": 6,
    });
    expect(count(through44.filter((p) => p.instructionalDay! >= 23))).toEqual({
      LANG: 22,
      MATH: 22,
      PHYS: 22,
      ART: 7,
      WORLD: 6,
      "TIME-SPACE": 9,
    });
  });

  it("meets due objectives within their actual introduction windows and repeats them", () => {
    const first = new Map<string, number>();
    const occurrences = new Map<string, number>();
    for (const p of through44)
      for (const s of p.sessions) {
        for (const code of s.lesson?.objectiveCodes ?? [])
          if (!first.has(code)) first.set(code, p.instructionalDay!);
        for (const code of [
          ...(s.lesson?.objectiveCodes ?? []),
          ...(s.lesson?.supportingObjectiveCodes ?? []),
        ])
          occurrences.set(code, (occurrences.get(code) ?? 0) + 1);
      }
    for (const entry of entriesDueBy(annual, 44)) {
      expect(first.has(entry.objectiveCode), entry.objectiveCode).toBe(true);
      expect(first.get(entry.objectiveCode)!, entry.objectiveCode).toBeLessThanOrEqual(
        entry.introduceByDay,
      );
      if (first.get(entry.objectiveCode)! >= 30) {
        expect(first.get(entry.objectiveCode)!, entry.objectiveCode).toBeGreaterThanOrEqual(
          entry.introduceFromDay,
        );
        // Day 41 is the final WORLD slot. Its technical-function revisit is due later,
        // not a reason to invent another WORLD day or overload another domain.
        const minimum = entry.objectiveCode === "WORLD-S02-C01-O09" ? 1 : 2;
        expect(occurrences.get(entry.objectiveCode)!, entry.objectiveCode).toBeGreaterThanOrEqual(
          minimum,
        );
      }
    }
  });

  it("introduces count-on only inside days 34–44 and keeps visible objects and recount support", () => {
    const code = "MATH-S01-C01-O24";
    const withCountOn = through44.filter((p) =>
      p.sessions.some((s) => s.lesson?.activities.some((a) => a.objectiveCodes.includes(code))),
    );
    expect(withCountOn[0]?.instructionalDay).toBe(34);
    for (const p of withCountOn) {
      expect(p.instructionalDay!).toBeGreaterThanOrEqual(34);
      expect(p.instructionalDay!).toBeLessThanOrEqual(44);
      const math = p.sessions.find((s) => s.domainCode === "MATH")!.lesson!;
      expect(math.parentGuidance).toContain("visibles");
      expect(math.parentGuidance).toContain("depuis un");
      expect(math.activities.every((a) => a.mode === "off-screen")).toBe(true);
    }
  });

  it("carries aquatic learning honestly as school-only and gives every movement an indoor version", () => {
    const aquatic = "PHYS-S02-C01-O06";
    expect(annual.entries.find((e) => e.objectiveCode === aquatic)?.homeFeasibility).toBe(
      "school-only",
    );
    for (const l of lessons.filter((l) => l.domainCode === "PHYS")) {
      expect(l.objectiveCodes).not.toContain(aquatic);
      expect(l.supportingObjectiveCodes).not.toContain(aquatic);
      expect(l.activities[0]!.adultGuidance).toMatch(/intérieur|maison/);
    }
    for (const day of [35, 39, 44]) {
      const lesson = data.lessons.find((l) => l.id === `m3-phys-${day}`)!;
      expect(lesson.activities[0]!.adultGuidance).toContain(aquatic);
      expect(lesson.activities[0]!.adultGuidance).toMatch(/scolaire|école/);
    }
  });
});
