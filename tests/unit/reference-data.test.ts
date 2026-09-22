import { describe, expect, it } from "vitest";
import { curriculumFor, learningDomains, levelsOfStage } from "@/domain/curriculum/curriculum";
import {
  REFERENCE_CONTENT_FILES,
  ReferenceDataError,
  getReferenceData,
  parseReferenceData,
} from "@/lib/content/reference-data";

const data = getReferenceData();

describe("canonical reference data (content/)", () => {
  it("parses and satisfies every rule", () => {
    expect(() => parseReferenceData(REFERENCE_CONTENT_FILES)).not.toThrow();
  });

  it("has the three preschool levels, identified by stable ids", () => {
    expect(levelsOfStage(data.levels, "maternelle").map((l) => [l.id, l.name])).toEqual([
      ["maternelle-1", "1ère maternelle"],
      ["maternelle-2", "2ème maternelle"],
      ["maternelle-3", "3ème maternelle"],
    ]);
  });

  it("assigns exactly one curriculum version to maternelle in 2026-2027", () => {
    const curriculum = curriculumFor(data.curricula, "2026-2027", "maternelle");
    expect(curriculum).toMatchObject({ id: "maternelle-cycle1-cd-2026", status: "active" });
    expect(curriculum?.reference.citation).toMatch(/NOR MENE2608627A/);
    expect(curriculumFor(data.curricula, "2027-2028", "maternelle")).toBeUndefined();
  });

  it("has the six Cycle 1 learning domains, in the official order and wording", () => {
    const curriculum = curriculumFor(data.curricula, "2026-2027", "maternelle");
    if (!curriculum) throw new Error("no curriculum for 2026-2027");
    expect(learningDomains(curriculum).map((d) => [d.code, d.title])).toEqual([
      ["LANG", "Le développement et la structuration du langage oral et écrit"],
      ["PHYS", "Agir, s’exprimer, comprendre à travers les activités physiques"],
      ["ART", "Agir, s’exprimer, comprendre à travers les activités artistiques"],
      ["MATH", "L’acquisition des premiers outils mathématiques"],
      ["TIME-SPACE", "Se repérer dans le temps et l’espace"],
      ["WORLD", "Découvrir le monde du vivant, de la matière et des objets"],
    ]);
  });

  it("lists the ten DRC legal holidays of Ordonnance n° 23/042, all sourced", () => {
    expect(data.publicHolidays.map((h) => `${h.month}-${h.day}`)).toEqual([
      "1-1",
      "1-4",
      "1-16",
      "1-17",
      "4-6",
      "5-1",
      "5-17",
      "6-30",
      "8-1",
      "12-25",
    ]);
    expect(
      data.publicHolidays.every((h) => h.authority === "law" && h.source?.includes("23/042")),
    ).toBe(true);
  });

  it("keeps French text in NFC form with typographic apostrophes", () => {
    const texts = [
      ...data.publicHolidays.map((h) => h.name),
      ...data.curricula.flatMap((c) => c.domains.map((d) => d.title)),
      ...data.levels.map((l) => l.name),
    ];
    for (const text of texts) {
      expect(text).toBe(text.normalize("NFC"));
      expect(text).not.toContain("'");
    }
  });
});

describe("reference data validation", () => {
  const withFile = (path: string, change: (json: Record<string, unknown>) => void) =>
    REFERENCE_CONTENT_FILES.map((file) => {
      if (file.path !== path) return file;
      const json = structuredClone(file.data) as Record<string, unknown>;
      change(json);
      return { ...file, data: json };
    });

  const problems = (files: typeof REFERENCE_CONTENT_FILES) => {
    try {
      parseReferenceData(files);
      return [];
    } catch (error) {
      if (error instanceof ReferenceDataError) return [...error.problems];
      throw error;
    }
  };

  it("rejects an unknown key (typo) and an invalid date", () => {
    const files = withFile("calendars/cd/2026-2027.json", (json) => {
      (json.schoolYear as Record<string, unknown>).endsOn = "2027-02-30";
      json.exeptions = [];
    });
    expect(problems(files).join("\n")).toMatch(/endsOn: must be a valid YYYY-MM-DD date/);
    expect(problems(files).join("\n")).toMatch(/exeptions/);
  });

  it("rejects duplicate level identifiers", () => {
    const files = withFile("education/levels.json", (json) => {
      (json.levels as unknown[]).push({
        id: "maternelle-1",
        stageId: "maternelle",
        position: 4,
        name: "x",
      });
    });
    expect(problems(files)).toContain('school level "maternelle-1" is defined more than once');
  });

  it("rejects duplicate domain codes and unknown levels in a curriculum", () => {
    const files = withFile("curriculum/maternelle-cycle1-cd-2026/curriculum.json", (json) => {
      (json.domains as unknown[]).push({
        code: "LANG",
        kind: "learning-domain",
        position: 7,
        title: "x",
        active: true,
      });
      (json.levels as unknown[]).push({
        levelId: "maternelle-9",
        referenceSection: null,
        ageBandCode: "from-5",
      });
    });
    const found = problems(files);
    expect(found).toContain(
      'curriculum "maternelle-cycle1-cd-2026" domain code "LANG" is defined more than once',
    );
    expect(found).toContain('curriculum "maternelle-cycle1-cd-2026": unknown level "maternelle-9"');
  });

  it("rejects a curriculum assigned to an unconfigured school year", () => {
    const files = withFile("curriculum/maternelle-cycle1-cd-2026/curriculum.json", (json) => {
      json.schoolYearIds = ["2026-2027", "2031-2032"];
    });
    expect(problems(files)).toContain(
      'curriculum "maternelle-cycle1-cd-2026": unknown school year "2031-2032"',
    );
  });
});
