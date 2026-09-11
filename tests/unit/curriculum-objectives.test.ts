import { describe, expect, it } from "vitest";
import { curriculumFor } from "@/domain/curriculum/curriculum";
import {
  ageBandOfLevel,
  checkSyllabus,
  findObjective,
  objectivesForLevel,
  objectivesOfDomain,
  successExamplesFor,
} from "@/domain/curriculum/objectives";
import type { DomainSyllabus } from "@/domain/curriculum/types";
import { getReferenceData, getSyllabus } from "@/lib/content/reference-data";

const data = getReferenceData();
const curriculum = curriculumFor(data.curricula, "2026-2027", "maternelle");
if (!curriculum) throw new Error("no curriculum for 2026-2027");
const syllabus = getSyllabus(curriculum.id, data);

describe("official curriculum objectives (imported from the programme)", () => {
  it("covers the six domains, with parts and competencies", () => {
    expect(new Set(syllabus.subdomains.map((s) => s.domainCode))).toEqual(
      new Set(["LANG", "PHYS", "ART", "MATH", "TIME-SPACE", "WORLD"]),
    );
    expect(syllabus.subdomains).toHaveLength(19);
    expect(syllabus.competencies).toHaveLength(38);
    expect(syllabus.objectives).toHaveLength(398);
    expect(syllabus.successExamples).toHaveLength(529);
  });

  it("quotes every objective from an official source, with its page", () => {
    for (const objective of syllabus.objectives) {
      expect(objective.origin).toBe("official");
      const source = curriculum.sources.find((s) => s.id === objective.sourceId);
      expect(source, objective.code).toBeDefined();
      expect(source?.verification).toBe("verified");
      expect(objective.sourcePage).toBeGreaterThan(0);
    }
  });

  it("takes language and mathematics from the 2024 annexes, the rest from the 2026 one", () => {
    const sourceOf = (domain: string) =>
      new Set(objectivesOfDomain(syllabus, domain).map((objective) => objective.sourceId));
    expect(sourceOf("LANG")).toEqual(new Set(["programme-2024-langage"]));
    expect(sourceOf("MATH")).toEqual(new Set(["programme-2024-mathematiques"]));
    expect(sourceOf("PHYS")).toEqual(new Set(["programme-2026"]));
    expect(sourceOf("WORLD")).toEqual(new Set(["programme-2026"]));
  });

  it("stores an objective once even when the programme repeats it in several age bands", () => {
    // "Scander les syllabes d’un mot." appears in two bands of the same competency.
    const objective = findObjective(syllabus, "LANG-S02-C01-O03");
    expect(objective?.statement).toBe("Scander les syllabes d’un mot.");
    expect(objective?.ageBandCodes).toEqual(["before-4", "from-4"]);
    const duplicates = syllabus.objectives.filter(
      (other) =>
        other.competencyCode === objective?.competencyCode &&
        other.statement === objective.statement,
    );
    expect(duplicates).toHaveLength(1);
  });

  it("keeps the official wording untouched, including its own apostrophes", () => {
    // The 2026 annex itself mixes ’ and ': an import must not normalise official text.
    const objective = findObjective(syllabus, "WORLD-S01-C01-O09");
    expect(objective?.statement).toBe(
      "Reconnaitre les étapes de la vie d'un animal ou d'une plante.",
    );
  });

  it("maps each level to an age band and answers what the level learns", () => {
    expect(ageBandOfLevel(curriculum, "maternelle-1")?.code).toBe("before-4");
    expect(ageBandOfLevel(curriculum, "maternelle-3")?.label).toBe(
      "À partir de 5 ans ou dès que les apprentissages précédents ont pu être observés",
    );
    // 3ème maternelle reinvests earlier bands, so it gets everything up to its own band…
    const all = objectivesForLevel(syllabus, curriculum, "maternelle-3");
    const own = objectivesForLevel(syllabus, curriculum, "maternelle-3", { ownBandOnly: true });
    expect(all.length).toBe(398);
    expect(own.length).toBeLessThan(all.length);
    expect(own.every((objective) => objective.ageBandCodes.includes("from-5"))).toBe(true);
    // …while 1ère maternelle only has the first band.
    const first = objectivesForLevel(syllabus, curriculum, "maternelle-1");
    expect(first.every((objective) => objective.ageBandCodes.includes("before-4"))).toBe(true);
    expect(first.length).toBeLessThan(own.length + first.length);
  });

  it("gives the official evidence of progress for an objective and age band", () => {
    const objective = findObjective(syllabus, "MATH-S01-C01-O20");
    if (!objective) throw new Error("missing objective");
    const examples = successExamplesFor(syllabus, objective, "from-5");
    expect(examples.length).toBeGreaterThan(0);
    expect(examples.every((example) => example.ageBandCode === "from-5")).toBe(true);
    expect(examples.map((example) => example.statement).join(" ")).toMatch(/dénombrer|collection/i);
  });
});

describe("syllabus validation", () => {
  const valid: DomainSyllabus = {
    curriculumId: curriculum.id,
    domainCode: "PHYS",
    sourceId: "programme-2026",
    subdomains: [{ code: "PHYS-S01", domainCode: "PHYS", position: 1, title: "Se déplacer" }],
    competencies: [
      { code: "PHYS-S01-C01", subdomainCode: "PHYS-S01", position: 1, title: "Courir" },
    ],
    objectives: [
      {
        code: "PHYS-S01-C01-O01",
        competencyCode: "PHYS-S01-C01",
        position: 1,
        statement: "Courir vite.",
        group: null,
        ageBandCodes: ["from-5"],
        origin: "official",
        sourceId: "programme-2026",
        sourcePage: 6,
      },
    ],
    successExamples: [],
  };

  it("accepts a well-formed domain", () => {
    expect(checkSyllabus(valid, data.curricula)).toEqual([]);
  });

  it("rejects a source that does not cover the domain", () => {
    const wrong = { ...valid, sourceId: "programme-2024-langage" };
    expect(checkSyllabus(wrong, data.curricula)).toContain(
      'objectives of PHYS: source "programme-2024-langage" does not cover PHYS',
    );
  });

  it("rejects codes that do not follow the hierarchy, and unknown age bands", () => {
    const broken: DomainSyllabus = {
      ...valid,
      objectives: [
        { ...valid.objectives[0]!, code: "MATH-S01-C01-O01" },
        { ...valid.objectives[0]!, code: "PHYS-S01-C01-O02", ageBandCodes: ["from-9"] },
      ],
    };
    const problems = checkSyllabus(broken, data.curricula);
    expect(problems.some((p) => p.includes("must extend its competency's code"))).toBe(true);
    expect(problems.some((p) => p.includes('unknown age band "from-9"'))).toBe(true);
  });
});
