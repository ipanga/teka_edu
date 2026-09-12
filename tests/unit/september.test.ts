import { describe, expect, it } from "vitest";
import { generateSchoolDays } from "@/domain/calendar/school-days";
import { hasTemplate, resolveTemplate } from "@/domain/lessons/template";
import { entriesDueBy } from "@/domain/programme/annual-plan";
import { generateDailyPlan } from "@/domain/programme/daily-plan";
import type { DailyPlan } from "@/domain/programme/types";
import { getProgramme, getReferenceData } from "@/lib/content/reference-data";

const data = getReferenceData();
const calendar = data.calendars.find((c) => c.schoolYear.id === "2026-2027")!;
const programme = getProgramme("maternelle-3", "2026-2027", data)!;
const plan = data.annualPlans.find((p) => p.levelId === "maternelle-3")!;
const days = generateSchoolDays(calendar, data.publicHolidays);

const september = days.filter((day) => day.date.startsWith("2026-09"));
const instructional = september.filter((day) => day.instructional);
const LAST_DAY = instructional.at(-1)?.instructionalDay ?? 0;
const plans: DailyPlan[] = instructional.map((day) =>
  generateDailyPlan(day, programme, data.lessons),
);

describe("September 2026 (3ème maternelle)", () => {
  it("takes its instructional days from the calendar", () => {
    expect(september).toHaveLength(30);
    expect(instructional).toHaveLength(22);
    expect(instructional[0]?.date).toBe("2026-09-01");
    expect(instructional.at(-1)?.date).toBe("2026-09-30");
    expect(LAST_DAY).toBe(22);
    // No holiday and no vacation falls in September 2026; the rest are weekends.
    expect(september.filter((d) => !d.instructional)).toHaveLength(8);
    for (const day of september.filter((d) => !d.instructional)) {
      expect(
        day.reasons.map((r) => r.code),
        day.date,
      ).toContain("weekend");
    }
  });

  it("has a complete programme on every instructional day, and none on the others", () => {
    for (const plan of plans) {
      expect(plan.status, `day ${plan.instructionalDay}`).toBe("complete");
      expect(plan.sessions.every((s) => s.lesson !== null)).toBe(true);
    }
    for (const day of september.filter((d) => !d.instructional)) {
      const empty = generateDailyPlan(day, programme, data.lessons);
      expect(empty.status).toBe("not-instructional");
      expect(empty.sessions).toEqual([]);
    }
  });

  it("keeps every day inside the 30 to 45 minute after-school target", () => {
    for (const plan of plans) {
      expect(plan.totalMinutes, `day ${plan.instructionalDay}`).toBeGreaterThanOrEqual(30);
      expect(plan.totalMinutes, `day ${plan.instructionalDay}`).toBeLessThanOrEqual(45);
      // Screen work stays a small minority of an after-school session for a five-year-old.
      expect(plan.screenMinutes * 2).toBeLessThanOrEqual(plan.totalMinutes);
    }
  });

  it("offers a pause point in the middle, never at the very end", () => {
    for (const plan of plans) {
      expect(plan.pauseAfterSession, `day ${plan.instructionalDay}`).not.toBeNull();
      expect(plan.pauseAfterSession!).toBeGreaterThanOrEqual(1);
      expect(plan.pauseAfterSession!).toBeLessThan(plan.sessions.length);
    }
  });

  it("teaches every objective the annual plan expects by the end of the month", () => {
    const taught = new Set(
      plans.flatMap((plan) =>
        plan.sessions.flatMap((s) => (s.lesson ? [...s.lesson.objectiveCodes] : [])),
      ),
    );
    // An embeddable objective — the date ritual, the safety rules — lives inside another
    // domain's lesson, which is exactly what `embeddable` means in the plan.
    const due = entriesDueBy(plan, LAST_DAY);
    expect(due.length).toBeGreaterThan(0);
    const missing = due.filter((entry) => !taught.has(entry.objectiveCode));
    expect(missing.map((m) => m.objectiveCode)).toEqual([]);
  });

  it("teaches each objective on or before the day the plan asks for it", () => {
    const firstPrimary = new Map<string, number>();
    const firstAnywhere = new Map<string, number>();
    for (const daily of plans) {
      for (const session of daily.sessions) {
        const lesson = session.lesson;
        if (!lesson) continue;
        for (const code of lesson.objectiveCodes) {
          if (!firstPrimary.has(code)) firstPrimary.set(code, daily.instructionalDay!);
        }
        for (const code of [...lesson.objectiveCodes, ...lesson.supportingObjectiveCodes]) {
          if (!firstAnywhere.has(code)) firstAnywhere.set(code, daily.instructionalDay!);
        }
      }
    }
    for (const entry of entriesDueBy(plan, LAST_DAY)) {
      // An embeddable objective may be carried by another domain's lesson (the date ritual
      // opens the language session); the others need a lesson of their own.
      const first = entry.embeddable
        ? firstAnywhere.get(entry.objectiveCode)
        : firstPrimary.get(entry.objectiveCode);
      expect(first, entry.objectiveCode).toBeLessThanOrEqual(entry.introduceByDay);
    }
  });

  it("revisits rather than touching an objective once and moving on", () => {
    const appearances = new Map<string, number>();
    for (const plan of plans) {
      for (const session of plan.sessions) {
        const lesson = session.lesson;
        if (!lesson) continue;
        for (const code of [...lesson.objectiveCodes, ...lesson.supportingObjectiveCodes]) {
          appearances.set(code, (appearances.get(code) ?? 0) + 1);
        }
      }
    }
    // Anything introduced in the first three weeks comes back at least once more in September.
    for (const entry of entriesDueBy(plan, 14)) {
      expect(appearances.get(entry.objectiveCode) ?? 0, entry.objectiveCode).toBeGreaterThan(1);
    }
  });

  it("brings something back every day, and closes each week by consolidating", () => {
    const roles = (plan: DailyPlan) =>
      plan.sessions.flatMap((s) => s.lesson?.activities.map((a) => a.role) ?? []);
    // Day 1 has nothing to bring back yet; every later day opens with a recall.
    for (const plan of plans.slice(1)) {
      expect(roles(plan), `day ${plan.instructionalDay}`).toContain(
        plan.instructionalDay !== null && [4, 9, 14, 19, 22].includes(plan.instructionalDay)
          ? "consolidation"
          : "retrieval",
      );
    }
    // The last instructional day of each September week consolidates.
    for (const day of [4, 9, 14, 19, 22]) {
      const plan = plans.find((p) => p.instructionalDay === day)!;
      expect(roles(plan), `day ${day}`).toContain("consolidation");
    }
  });

  it("does not author October: content stops where the month stops", () => {
    const october = generateDailyPlan(
      days.find((d) => d.instructionalDay === LAST_DAY + 1)!,
      programme,
      data.lessons,
    );
    expect(october.status).toBe("no-content");
  });
});

describe("September content quality", () => {
  const lessons = data.lessons;
  const activities = lessons.flatMap((l) => l.activities);

  it("gives the parent something concrete to do and the child one thing at a time", () => {
    for (const activity of activities) {
      expect(activity.adultGuidance.length, activity.id).toBeGreaterThan(40);
      // One instruction, not a paragraph: a five-year-old cannot hold three tasks at once.
      expect(activity.childInstruction.length, activity.id).toBeLessThanOrEqual(160);
    }
  });

  it("never writes a calendar date into the content", () => {
    // The defect this replaces: a lesson taught on 3 September that said "mardi 1er septembre".
    const written =
      /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+\d|\b\d{1,2}(er)?\s+(janvier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|décembre)\b/i;
    for (const lesson of lessons) {
      for (const activity of lesson.activities) {
        const text = `${activity.childInstruction} ${activity.adultGuidance} ${JSON.stringify(activity.payload)}`;
        expect(text, activity.id).not.toMatch(written);
      }
    }
  });

  it("fills the date placeholder in from the day being taught", () => {
    const first = generateDailyPlan(
      days.find((d) => d.instructionalDay === 1)!,
      programme,
      data.lessons,
    );
    const ritual = first.sessions[0]?.lesson?.activities[0];
    expect(ritual?.adultGuidance).toContain("mardi 1er septembre 2026");
    expect(hasTemplate(ritual?.adultGuidance ?? "")).toBe(false);

    const sixth = generateDailyPlan(
      days.find((d) => d.instructionalDay === 6)!,
      programme,
      data.lessons,
    );
    expect(sixth.sessions[0]?.lesson?.activities[0]?.adultGuidance).toContain(
      "mardi 8 septembre 2026",
    );
    // The placeholder is left alone when there is no date to put in it.
    expect(resolveTemplate("le {{date}}", null)).toBe("le {{date}}");
  });

  it("supplies every story and rhyme it asks the parent to read", () => {
    const needing = activities.filter((a) =>
      ["read-aloud", "listening-story", "song-rhyme"].includes(a.type),
    );
    expect(needing.length).toBeGreaterThan(20);
    for (const activity of needing) {
      const textId = activity.payload["textId"];
      expect(typeof textId, activity.id).toBe("string");
      const text = data.texts.find((t) => t.id === textId);
      expect(text, `${activity.id} → ${String(textId)}`).toBeDefined();
      expect(text!.lines.length).toBeGreaterThan(3);
      // Everything Teka Edu supplies is its own: no third-party text without cleared rights.
      expect(text!.origin, text!.id).toBe("teka-edu-created");
      expect(text!.provenance.length).toBeGreaterThan(20);
    }
  });

  it("offers a material alternative for everything it asks a family to find", () => {
    const used = new Set(activities.flatMap((a) => a.materialCodes));
    for (const code of used) {
      if (code === "aucun") continue;
      const material = data.materials.find((m) => m.code === code);
      expect(material, code).toBeDefined();
      expect(material!.alternatives, code).toBeTruthy();
    }
  });

  it("keeps every lesson waiting for a human reviewer", () => {
    for (const lesson of lessons) {
      expect(lesson.status, lesson.id).toBe("review");
      expect(lesson.review, lesson.id).toBeNull();
    }
  });
});
