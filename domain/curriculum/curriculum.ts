import type { Curriculum, CurriculumDomain, EducationStage, SchoolLevel } from "./types";

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

/** Levels of one stage, in order (e.g. 1ère, 2ème, 3ème maternelle). */
export function levelsOfStage(levels: readonly SchoolLevel[], stageId: string): SchoolLevel[] {
  return levels.filter((level) => level.stageId === stageId).sort(byPosition);
}

/** The curriculum version that applies to a stage in a school year, if one is assigned. */
export function curriculumFor(
  curricula: readonly Curriculum[],
  schoolYearId: string,
  stageId: string,
): Curriculum | undefined {
  return curricula.find(
    (curriculum) =>
      curriculum.stageId === stageId && curriculum.schoolYearIds.includes(schoolYearId),
  );
}

/** Active learning domains (not transversal components), in the programme's order. */
export function learningDomains(curriculum: Curriculum): CurriculumDomain[] {
  return curriculum.domains
    .filter((domain) => domain.kind === "learning-domain" && domain.active)
    .sort(byPosition);
}

/**
 * Referential rules for the education structure and curricula. Returns problems; empty
 * means valid. The database enforces the same rules with keys and constraints.
 */
export function checkEducationStructure(
  stages: readonly EducationStage[],
  levels: readonly SchoolLevel[],
): string[] {
  const problems: string[] = [];
  problems.push(
    ...duplicates(
      stages.map((s) => s.id),
      "education stage",
    ),
  );
  problems.push(
    ...duplicates(
      stages.map((s) => String(s.position)),
      "education stage position",
    ),
  );
  problems.push(
    ...duplicates(
      levels.map((l) => l.id),
      "school level",
    ),
  );
  const stageIds = new Set(stages.map((s) => s.id));
  for (const level of levels) {
    if (!stageIds.has(level.stageId)) {
      problems.push(`school level "${level.id}" references unknown stage "${level.stageId}"`);
    }
  }
  for (const stage of stages) {
    const positions = levelsOfStage(levels, stage.id).map((l) => String(l.position));
    problems.push(...duplicates(positions, `level position in stage "${stage.id}"`));
  }
  return problems;
}

export function checkCurricula(
  curricula: readonly Curriculum[],
  stages: readonly EducationStage[],
  levels: readonly SchoolLevel[],
  schoolYearIds: readonly string[],
): string[] {
  const problems: string[] = [];
  problems.push(
    ...duplicates(
      curricula.map((c) => c.id),
      "curriculum",
    ),
  );
  problems.push(
    ...duplicates(
      curricula.map((c) => `${c.stageId} ${c.version}`),
      "curriculum version (stage + version)",
    ),
  );
  const stageIds = new Set(stages.map((s) => s.id));
  const knownYears = new Set(schoolYearIds);

  for (const curriculum of curricula) {
    const at = `curriculum "${curriculum.id}"`;
    if (!stageIds.has(curriculum.stageId)) {
      problems.push(`${at}: unknown stage "${curriculum.stageId}"`);
    }
    for (const { levelId } of curriculum.levels) {
      const level = levels.find((l) => l.id === levelId);
      if (level === undefined) problems.push(`${at}: unknown level "${levelId}"`);
      else if (level.stageId !== curriculum.stageId) {
        problems.push(`${at}: level "${levelId}" belongs to another stage`);
      }
    }
    problems.push(
      ...duplicates(
        curriculum.levels.map((l) => l.levelId),
        `${at} level`,
      ),
    );
    problems.push(
      ...duplicates(
        curriculum.domains.map((d) => d.code),
        `${at} domain code`,
      ),
    );
    problems.push(
      ...duplicates(
        curriculum.domains.map((d) => String(d.position)),
        `${at} domain position`,
      ),
    );
    for (const yearId of curriculum.schoolYearIds) {
      if (!knownYears.has(yearId)) problems.push(`${at}: unknown school year "${yearId}"`);
    }
    if (curriculum.status === "draft" && curriculum.schoolYearIds.length > 0) {
      problems.push(`${at}: a draft curriculum cannot be assigned to a school year`);
    }
  }

  // Exactly one curriculum per stage and school year, so "which curriculum applies?" has
  // a single answer.
  const assignments = curricula.flatMap((c) =>
    c.schoolYearIds.map((yearId) => `${yearId} / ${c.stageId}`),
  );
  problems.push(...duplicates(assignments, "curriculum assignment (school year / stage)"));
  return problems;
}

function duplicates(values: readonly string[], what: string): string[] {
  const seen = new Set<string>();
  const reported = new Set<string>();
  for (const value of values) {
    if (seen.has(value) && !reported.has(value)) reported.add(value);
    seen.add(value);
  }
  return [...reported].map((value) => `${what} "${value}" is defined more than once`);
}
