import { describe, expect, it } from "vitest";
import { generateSchoolDays } from "@/domain/calendar/school-days";
import { checkAnnualPlan, entriesDueBy, phaseOfDay } from "@/domain/programme/annual-plan";
import type { AnnualPlan } from "@/domain/programme/annual-plan";
import { getReferenceData } from "@/lib/content/reference-data";

const data = getReferenceData();
const plan = data.annualPlans.find((p) => p.levelId === "maternelle-3");
const objectives = data.syllabi.flatMap((s) => s.objectives);

describe("annual scope and sequence (ADR-040)", () => {
  it("exists for the level that is being authored", () => {
    expect(plan, "no annual plan for maternelle-3").toBeDefined();
    expect(plan?.schoolYearId).toBe("2026-2027");
    expect(plan?.curriculumId).toBe("maternelle-cycle1-cd-2026");
  });

  it("is structurally valid", () => {
    expect(checkAnnualPlan(plan!, objectives, data.curricula, data.levels)).toEqual([]);
  });

  it("counts its instructional days from the calendar, not from a constant", () => {
    const calendar = data.calendars.find((c) => c.schoolYear.id === "2026-2027")!;
    const instructional = generateSchoolDays(calendar, data.publicHolidays).filter(
      (day) => day.instructional,
    );
    expect(plan!.instructionalDays).toBe(instructional.length);
    expect(plan!.phases.at(-1)?.toDay).toBe(instructional.length);
  });

  it("schedules every objective of the level's own age band, exactly once", () => {
    const band = data.curricula
      .find((c) => c.id === "maternelle-cycle1-cd-2026")
      ?.levels.find((l) => l.levelId === "maternelle-3")?.ageBandCode;
    expect(band).toBe("from-5");
    const own = objectives.filter((o) => o.ageBandCodes.includes(band!));
    expect(plan!.entries).toHaveLength(own.length);
    expect(new Set(plan!.entries.map((e) => e.objectiveCode)).size).toBe(own.length);
    for (const objective of own) {
      expect(
        plan!.entries.some((e) => e.objectiveCode === objective.code),
        objective.code,
      ).toBe(true);
    }
  });

  it("introduces, then reinforces, then consolidates — never the other way round", () => {
    for (const entry of plan!.entries) {
      expect(entry.introduceFromDay, entry.objectiveCode).toBeLessThanOrEqual(entry.introduceByDay);
      expect(entry.introduceByDay, entry.objectiveCode).toBeLessThanOrEqual(
        entry.reinforceUntilDay,
      );
      expect(entry.reinforceUntilDay, entry.objectiveCode).toBeLessThanOrEqual(
        entry.consolidateByDay,
      );
      expect(entry.consolidateByDay, entry.objectiveCode).toBeLessThanOrEqual(
        plan!.instructionalDays,
      );
      // A reinforcement programme plans the revisits; it does not hope for them.
      expect(entry.plannedRevisits, entry.objectiveCode).toBeGreaterThanOrEqual(1);
    }
  });

  it("covers the whole year with phases that do not overlap", () => {
    let previous = 0;
    for (const phase of plan!.phases) {
      expect(phase.fromDay).toBe(previous + 1);
      expect(phase.toDay).toBeGreaterThanOrEqual(phase.fromDay);
      previous = phase.toDay;
    }
    expect(phaseOfDay(plan!, 1)?.code).toBe("P1");
    expect(phaseOfDay(plan!, plan!.instructionalDays)?.code).toBe(plan!.phases.at(-1)?.code);
    expect(phaseOfDay(plan!, plan!.instructionalDays + 1)).toBeUndefined();
  });

  it("says which objectives a home session can only partly carry, instead of pretending", () => {
    const limited = plan!.entries.filter((e) => e.homeFeasibility !== "full");
    // Swimming, meeting artists, singing in a group: a home cannot do all of it.
    expect(limited.length).toBeGreaterThan(0);
    expect(limited.map((e) => e.objectiveCode)).toContain("PHYS-S02-C01-O06");
    expect(plan!.entries.find((e) => e.objectiveCode === "PHYS-S02-C01-O06")?.homeFeasibility).toBe(
      "school-only",
    );
  });

  it("does not schedule anything the level is not meant to teach", () => {
    const broken: AnnualPlan = {
      ...plan!,
      entries: [
        {
          ...plan!.entries[0]!,
          objectiveCode: "LANG-S02-C01-O03", // an earlier age band: reinvested, never introduced
        },
      ],
    };
    const problems = checkAnnualPlan(broken, objectives, data.curricula, data.levels);
    expect(problems.some((p) => p.includes('is not a "from-5" objective'))).toBe(true);
  });

  it("keeps the last phase for consolidation, with no new objective introduced in it", () => {
    const last = plan!.phases.at(-1)!;
    const introducedThen = plan!.entries.filter((e) => e.introduceByDay >= last.fromDay);
    expect(introducedThen).toHaveLength(0);
  });
});

describe("what the plan expects by a given day", () => {
  it("grows as the year goes on", () => {
    const bySeptember = entriesDueBy(plan!, 22).length;
    const byNewYear = entriesDueBy(plan!, 80).length;
    expect(bySeptember).toBeGreaterThan(0);
    expect(byNewYear).toBeGreaterThan(bySeptember);
    expect(entriesDueBy(plan!, plan!.instructionalDays)).toHaveLength(plan!.entries.length);
  });
});
