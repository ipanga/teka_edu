import type {
  AgeBand,
  Competency,
  Curriculum,
  CurriculumSubdomain,
  DomainSyllabus,
  LearningObjective,
  SuccessExample,
} from "./types";

/**
 * Queries and rules over the official objectives of a curriculum version
 * (docs/CURRICULUM.md). Everything here is pure: the data comes from content/.
 */

export type Syllabus = {
  curriculumId: string;
  subdomains: readonly CurriculumSubdomain[];
  competencies: readonly Competency[];
  objectives: readonly LearningObjective[];
  successExamples: readonly SuccessExample[];
};

export function mergeSyllabi(curriculumId: string, domains: readonly DomainSyllabus[]): Syllabus {
  const mine = domains.filter((domain) => domain.curriculumId === curriculumId);
  return {
    curriculumId,
    subdomains: mine.flatMap((domain) => domain.subdomains),
    competencies: mine.flatMap((domain) => domain.competencies),
    objectives: mine.flatMap((domain) => domain.objectives),
    successExamples: mine.flatMap((domain) => domain.successExamples),
  };
}

/** The age band a level follows in a curriculum version (a Teka Edu mapping). */
export function ageBandOfLevel(curriculum: Curriculum, levelId: string): AgeBand | undefined {
  const mapping = curriculum.levels.find((level) => level.levelId === levelId);
  return curriculum.ageBands.find((band) => band.code === mapping?.ageBandCode);
}

/**
 * The objectives a level works on.
 *
 * The programme states objectives by age band and expects earlier learning to be reinvested
 * at each age, so by default this returns the level's own band **and every earlier band**.
 * Pass `ownBandOnly` to get just the band's new objectives.
 */
export function objectivesForLevel(
  syllabus: Syllabus,
  curriculum: Curriculum,
  levelId: string,
  options: { ownBandOnly?: boolean } = {},
): LearningObjective[] {
  const band = ageBandOfLevel(curriculum, levelId);
  if (band === undefined) return [];
  const bands = curriculum.ageBands
    .filter((other) =>
      options.ownBandOnly ? other.code === band.code : other.position <= band.position,
    )
    .map((other) => other.code);
  return syllabus.objectives.filter((objective) =>
    objective.ageBandCodes.some((code) => bands.includes(code)),
  );
}

export function objectivesOfDomain(syllabus: Syllabus, domainCode: string): LearningObjective[] {
  const subdomainCodes = new Set(
    syllabus.subdomains.filter((s) => s.domainCode === domainCode).map((s) => s.code),
  );
  const competencyCodes = new Set(
    syllabus.competencies.filter((c) => subdomainCodes.has(c.subdomainCode)).map((c) => c.code),
  );
  return syllabus.objectives.filter((objective) => competencyCodes.has(objective.competencyCode));
}

export function findObjective(syllabus: Syllabus, code: string): LearningObjective | undefined {
  return syllabus.objectives.find((objective) => objective.code === code);
}

export function domainOfObjective(
  syllabus: Syllabus,
  objective: LearningObjective,
): string | undefined {
  const competency = syllabus.competencies.find((c) => c.code === objective.competencyCode);
  const subdomain = syllabus.subdomains.find((s) => s.code === competency?.subdomainCode);
  return subdomain?.domainCode;
}

/**
 * Observable evidence of progress: the official success examples of the objective's competency
 * for a given age band. The official tables list them per competency and age band, not per
 * objective, so they are returned at that level.
 */
export function successExamplesFor(
  syllabus: Syllabus,
  objective: LearningObjective,
  ageBandCode: string,
): SuccessExample[] {
  return syllabus.successExamples.filter(
    (example) =>
      example.competencyCode === objective.competencyCode &&
      example.ageBandCode === ageBandCode &&
      (objective.group === null || example.group === null || example.group === objective.group),
  );
}

/** Structure and reference rules for imported official objectives. */
export function checkSyllabus(
  syllabus: DomainSyllabus,
  curricula: readonly Curriculum[],
): string[] {
  const problems: string[] = [];
  const at = `objectives of ${syllabus.domainCode}`;
  const curriculum = curricula.find((c) => c.id === syllabus.curriculumId);
  if (curriculum === undefined) {
    return [`${at}: unknown curriculum "${syllabus.curriculumId}"`];
  }
  if (!curriculum.domains.some((domain) => domain.code === syllabus.domainCode)) {
    problems.push(`${at}: unknown domain "${syllabus.domainCode}"`);
  }
  const source = curriculum.sources.find((s) => s.id === syllabus.sourceId);
  if (source === undefined) {
    problems.push(`${at}: unknown source "${syllabus.sourceId}"`);
  } else if (!source.covers.includes(syllabus.domainCode)) {
    problems.push(`${at}: source "${syllabus.sourceId}" does not cover ${syllabus.domainCode}`);
  }
  const bandCodes = new Set(curriculum.ageBands.map((band) => band.code));

  const subdomainCodes = new Set<string>();
  for (const [index, subdomain] of syllabus.subdomains.entries()) {
    if (subdomainCodes.has(subdomain.code))
      problems.push(`${at}: duplicate part "${subdomain.code}"`);
    subdomainCodes.add(subdomain.code);
    if (subdomain.position !== index + 1) problems.push(`${at}: parts must be numbered 1…n`);
    if (!subdomain.code.startsWith(`${syllabus.domainCode}-S`)) {
      problems.push(
        `${at}: part code "${subdomain.code}" must start with ${syllabus.domainCode}-S`,
      );
    }
  }
  const competencyCodes = new Set<string>();
  for (const competency of syllabus.competencies) {
    if (competencyCodes.has(competency.code)) {
      problems.push(`${at}: duplicate competency "${competency.code}"`);
    }
    competencyCodes.add(competency.code);
    if (!subdomainCodes.has(competency.subdomainCode)) {
      problems.push(`${at}: competency "${competency.code}" has no part`);
    }
    if (!competency.code.startsWith(`${competency.subdomainCode}-C`)) {
      problems.push(`${at}: competency code "${competency.code}" must extend its part's code`);
    }
  }
  const objectiveCodes = new Set<string>();
  for (const objective of syllabus.objectives) {
    const where = `${at}, objective "${objective.code}"`;
    if (objectiveCodes.has(objective.code)) problems.push(`${where}: code is used twice`);
    objectiveCodes.add(objective.code);
    if (!competencyCodes.has(objective.competencyCode)) {
      problems.push(`${where}: unknown competency "${objective.competencyCode}"`);
    }
    if (!objective.code.startsWith(`${objective.competencyCode}-O`)) {
      problems.push(`${where}: code must extend its competency's code`);
    }
    if (objective.ageBandCodes.length === 0) problems.push(`${where}: needs at least one age band`);
    for (const band of objective.ageBandCodes) {
      if (!bandCodes.has(band)) problems.push(`${where}: unknown age band "${band}"`);
    }
    // Imported objectives are official text; they must name the document they come from.
    if (objective.origin === "official" && !objective.sourceId) {
      problems.push(`${where}: official wording must cite its source`);
    }
  }
  for (const example of syllabus.successExamples) {
    if (!competencyCodes.has(example.competencyCode)) {
      problems.push(`${at}: a success example has unknown competency "${example.competencyCode}"`);
    }
    if (!bandCodes.has(example.ageBandCode)) {
      problems.push(`${at}: a success example has unknown age band "${example.ageBandCode}"`);
    }
  }
  return problems;
}
