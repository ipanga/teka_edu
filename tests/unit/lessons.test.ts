import { describe, expect, it } from "vitest";
import { findObjective } from "@/domain/curriculum/objectives";
import { lessonMinutes, lessonScreenMinutes } from "@/domain/lessons/types";
import type { Lesson } from "@/domain/lessons/types";
import { checkLessons } from "@/domain/programme/validation";
import { getReferenceData, getSyllabus } from "@/lib/content/reference-data";
import { lessonsFileSchema } from "@/lib/content/lesson-schemas";

const data = getReferenceData();
const syllabus = getSyllabus("maternelle-cycle1-cd-2026", data);
const objectives = data.syllabi.flatMap((s) => s.objectives);
const lesson = (id: string) => {
  const found = data.lessons.find((l) => l.id === id);
  if (!found) throw new Error(`no lesson ${id}`);
  return found;
};

describe("pilot lessons (3ème maternelle)", () => {
  it("has 20 lessons, all authored by Teka Edu and marked for review", () => {
    expect(data.lessons).toHaveLength(20);
    for (const l of data.lessons) {
      expect(l.origin).toBe("teka-edu-created");
      expect(l.status).toBe("review");
      expect(l.levelIds).toEqual(["maternelle-3"]);
      expect(l.curriculumId).toBe("maternelle-cycle1-cd-2026");
    }
  });

  it("traces every activity to an official objective of the curriculum", () => {
    const activities = data.lessons.flatMap((l) => l.activities);
    expect(activities.length).toBeGreaterThanOrEqual(20);
    for (const activity of activities) {
      expect(activity.objectiveCodes.length).toBeGreaterThan(0);
      for (const code of activity.objectiveCodes) {
        const objective = findObjective(syllabus, code);
        expect(objective, `${activity.id} → ${code}`).toBeDefined();
        expect(objective?.origin).toBe("official");
      }
    }
  });

  it("gives every activity a French instruction for the child and guidance for the adult", () => {
    for (const activity of data.lessons.flatMap((l) => l.activities)) {
      expect(activity.childInstruction.length).toBeGreaterThan(10);
      expect(activity.adultGuidance.length).toBeGreaterThan(20);
      expect(activity.childInstruction).not.toContain("'");
      expect(activity.minutes).toBeGreaterThanOrEqual(2);
      expect(activity.minutes).toBeLessThanOrEqual(20);
      expect(activity.materialCodes.length).toBeGreaterThan(0);
      for (const code of activity.materialCodes) {
        expect(
          data.materials.some((m) => m.code === code),
          code,
        ).toBe(true);
      }
    }
  });

  it("offers English only as a scaffold, never as a second curriculum", () => {
    const activities = data.lessons.flatMap((l) => l.activities);
    const scaffolded = activities.filter((a) => a.scaffolds.length > 0);
    expect(scaffolded.length).toBeGreaterThan(20);
    for (const activity of activities) {
      for (const scaffold of activity.scaffolds) {
        expect(scaffold.language).toBe("en");
        expect(scaffold.childInstruction).not.toBe(activity.childInstruction);
      }
      // Vocabulary is French first; the English word is optional help.
      for (const entry of activity.vocabulary) expect(entry.fr.length).toBeGreaterThan(1);
    }
  });

  it("keeps a session short: no lesson longer than 15 minutes", () => {
    for (const l of data.lessons) {
      expect(lessonMinutes(l), l.id).toBeLessThanOrEqual(15);
      expect(lessonScreenMinutes(l)).toBeLessThanOrEqual(lessonMinutes(l));
    }
  });

  it("includes the daily read-aloud the programme requires, without questions", () => {
    const language = data.lessons.filter((l) => l.domainCode === "LANG");
    expect(language).toHaveLength(5);
    for (const l of language) {
      const readAloud = l.activities.filter((a) => a.type === "read-aloud");
      expect(readAloud, l.id).toHaveLength(1);
      expect(readAloud[0]?.payload).not.toHaveProperty("questions");
    }
  });

  it("uses the DRC context in its vocabulary and examples", () => {
    const text = data.lessons
      .flatMap((l) => l.activities)
      .map((a) => `${a.childInstruction} ${a.adultGuidance} ${JSON.stringify(a.payload)}`)
      .join(" ");
    expect(text).toMatch(/cailloux|capsules|haricots/);
    expect(text).toMatch(/poule|chèvre|poussin/);
  });
});

describe("lesson validation", () => {
  const base = lesson("m3-math-01");
  const check = (l: Lesson) =>
    checkLessons([l], data.curricula, objectives, data.levels, data.materials);

  it("accepts the pilot lessons", () => {
    expect(
      checkLessons(data.lessons, data.curricula, objectives, data.levels, data.materials),
    ).toEqual([]);
  });

  it("rejects an activity objective that the lesson does not declare", () => {
    const broken: Lesson = {
      ...base,
      activities: [{ ...base.activities[0]!, objectiveCodes: ["MATH-S03-C01-O08"] }],
    };
    expect(check(broken)[0]).toMatch(/is not among the lesson's objectives/);
  });

  it("rejects an unknown objective, level or material", () => {
    expect(check({ ...base, objectiveCodes: ["MATH-S01-C01-O99"] })[0]).toMatch(
      /unknown objective/,
    );
    expect(check({ ...base, levelIds: ["maternelle-9"] })[0]).toMatch(/unknown level/);
    const material: Lesson = {
      ...base,
      activities: [{ ...base.activities[0]!, materialCodes: ["tableau-blanc"] }],
    };
    expect(check(material)[0]).toMatch(/unknown material/);
  });

  it("refuses an objective from a later age band than the level", () => {
    // A "from-5" objective cannot be taught to 1ère maternelle (before-4).
    const tooAdvanced: Lesson = { ...base, levelIds: ["maternelle-1"] };
    expect(check(tooAdvanced).some((p) => p.includes("later age band"))).toBe(true);
  });

  it("refuses to present a lesson as official text", () => {
    expect(check({ ...base, origin: "official" })[0]).toMatch(/authored by Teka Edu/);
  });

  it("refuses a payload that does not match the activity type", () => {
    const file = {
      curriculumId: "maternelle-cycle1-cd-2026",
      levelId: "maternelle-3",
      domainCode: "MATH",
      lessons: [
        {
          ...base,
          activities: [
            { ...base.activities[0]!, type: "counting", payload: { objects: "cailloux" } },
          ],
        },
      ],
    };
    const result = lessonsFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toMatch(/counting/);
  });
});
