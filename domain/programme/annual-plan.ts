import type { Curriculum, LearningObjective, SchoolLevel } from "../curriculum/types";

/**
 * The year's scope and sequence for one level: which objectives the year introduces, when they
 * come back, and when they should be consolidated (ADR-040, docs/ANNUAL_PLAN.md).
 *
 * It exists so that a month of lessons can be authored without losing sight of the year, and so
 * that coverage can be *proved* rather than hoped for: at any instructional day, the plan says
 * what should have been taught by then, and a test compares that with the lessons that exist.
 *
 * The plan is pacing, not content. It never contains lesson text.
 */

/** How often an objective comes back once it has been introduced. */
export const OBJECTIVE_CADENCES = ["daily", "frequent", "periodic"] as const;
export type ObjectiveCadence = (typeof OBJECTIVE_CADENCES)[number];

/** A block of the year, aligned with the school periods of the calendar. */
export type AnnualPhase = {
  code: string;
  name: string;
  /** Instructional-day numbers, inclusive. */
  fromDay: number;
  toDay: number;
  /** What this block of the year is mainly for, in one line. */
  focus: string;
};

export type AnnualPlanEntry = {
  objectiveCode: string;
  domainCode: string;
  /** Phase in which the objective is introduced. */
  phase: string;
  /** The window in which the objective must be introduced, in instructional days. */
  introduceFromDay: number;
  introduceByDay: number;
  /** Last day of deliberate reinforcement. */
  reinforceUntilDay: number;
  /** By when the child should be able to do it without help. */
  consolidateByDay: number;
  /** How many times the year plans to come back to it, after the first teaching. */
  plannedRevisits: number;
  cadence: ObjectiveCadence;
  /** Whether it needs a lesson of its own, or can live inside another domain's lesson. */
  needsDedicatedLesson: boolean;
  /** Whether it can be reinvested in other domains (a vocabulary objective can; a motor one cannot). */
  embeddable: boolean;
  /**
   * How much of the objective an after-school session at home can actually carry. Some official
   * objectives assume a class, a stage or a swimming pool; Teka Edu reinforces what it can and
   * says so rather than pretending (docs/ANNUAL_PLAN.md).
   */
  homeFeasibility: HomeFeasibility;
};

/** full: a home session can do it · partial: partly · school-only: the school must do it. */
export const HOME_FEASIBILITIES = ["full", "partial", "school-only"] as const;
export type HomeFeasibility = (typeof HOME_FEASIBILITIES)[number];

export type AnnualPlan = {
  id: string;
  curriculumId: string;
  levelId: string;
  schoolYearId: string;
  /** Instructional days the school year has, from the calendar. Never hard-coded. */
  instructionalDays: number;
  phases: readonly AnnualPhase[];
  entries: readonly AnnualPlanEntry[];
};

/** Everything the plan says should have been introduced by the end of `day`. */
export function entriesDueBy(plan: AnnualPlan, day: number): AnnualPlanEntry[] {
  return plan.entries.filter((entry) => entry.introduceByDay <= day);
}

/** The phase an instructional day belongs to, if any. */
export function phaseOfDay(plan: AnnualPlan, day: number): AnnualPhase | undefined {
  return plan.phases.find((phase) => day >= phase.fromDay && day <= phase.toDay);
}

export type CoverageRow = {
  entry: AnnualPlanEntry;
  /** How many lessons up to the day teach it as a primary objective. */
  taught: number;
  /** How many reinvest it (supporting objectives). */
  reinvested: number;
};

/**
 * Compares the plan with the content that exists, up to an instructional day. `taughtCounts`
 * and `reinvestedCounts` come from the daily plans actually generated, so this function stays
 * free of scheduling logic.
 */
export function coverageUpTo(
  plan: AnnualPlan,
  day: number,
  taughtCounts: ReadonlyMap<string, number>,
  reinvestedCounts: ReadonlyMap<string, number>,
): { rows: CoverageRow[]; missing: AnnualPlanEntry[] } {
  const rows = entriesDueBy(plan, day).map((entry) => ({
    entry,
    taught: taughtCounts.get(entry.objectiveCode) ?? 0,
    reinvested: reinvestedCounts.get(entry.objectiveCode) ?? 0,
  }));
  return { rows, missing: rows.filter((row) => row.taught === 0).map((row) => row.entry) };
}

/** Structural rules. Empty means the plan is internally valid. */
export function checkAnnualPlan(
  plan: AnnualPlan,
  objectives: readonly LearningObjective[],
  curricula: readonly Curriculum[],
  levels: readonly SchoolLevel[],
): string[] {
  const problems: string[] = [];
  const where = `annual plan "${plan.id}"`;

  const curriculum = curricula.find((c) => c.id === plan.curriculumId);
  if (curriculum === undefined) {
    problems.push(`${where}: unknown curriculum "${plan.curriculumId}"`);
    return problems;
  }
  if (!levels.some((level) => level.id === plan.levelId)) {
    problems.push(`${where}: unknown level "${plan.levelId}"`);
  }
  const levelEntry = curriculum.levels.find((l) => l.levelId === plan.levelId);
  if (levelEntry === undefined) {
    problems.push(`${where}: level "${plan.levelId}" is not part of the curriculum`);
  }
  if (!curriculum.schoolYearIds.includes(plan.schoolYearId)) {
    problems.push(`${where}: school year "${plan.schoolYearId}" is not covered by the curriculum`);
  }

  // Phases must tile the year, in order, without gaps or overlaps.
  let previousEnd = 0;
  for (const phase of plan.phases) {
    if (phase.fromDay !== previousEnd + 1) {
      problems.push(
        `${where}: phase ${phase.code} starts on day ${phase.fromDay}, expected ${previousEnd + 1}`,
      );
    }
    if (phase.toDay < phase.fromDay) {
      problems.push(`${where}: phase ${phase.code} ends before it starts`);
    }
    previousEnd = phase.toDay;
  }
  if (plan.phases.length > 0 && previousEnd !== plan.instructionalDays) {
    problems.push(
      `${where}: phases end on day ${previousEnd}, but the year has ${plan.instructionalDays} instructional days`,
    );
  }

  const byCode = new Map(objectives.map((objective) => [objective.code, objective]));
  const ageBandCode = levelEntry?.ageBandCode;
  const seen = new Set<string>();
  for (const entry of plan.entries) {
    const at = `${where}: ${entry.objectiveCode}`;
    if (seen.has(entry.objectiveCode)) problems.push(`${at}: scheduled more than once`);
    seen.add(entry.objectiveCode);

    const objective = byCode.get(entry.objectiveCode);
    if (objective === undefined) {
      problems.push(`${at}: unknown objective`);
      continue;
    }
    if (!objective.code.startsWith(`${entry.domainCode}-`)) {
      problems.push(`${at}: does not belong to domain ${entry.domainCode}`);
    }
    if (ageBandCode !== undefined && !objective.ageBandCodes.includes(ageBandCode)) {
      problems.push(
        `${at}: is not a "${ageBandCode}" objective, so it is not this level's to teach`,
      );
    }
    if (!plan.phases.some((phase) => phase.code === entry.phase)) {
      problems.push(`${at}: unknown phase "${entry.phase}"`);
    }
    const phase = plan.phases.find((p) => p.code === entry.phase);
    if (
      phase !== undefined &&
      (entry.introduceFromDay < phase.fromDay || entry.introduceByDay > phase.toDay)
    ) {
      problems.push(`${at}: introduction window falls outside phase ${entry.phase}`);
    }
    if (entry.introduceFromDay > entry.introduceByDay) {
      problems.push(`${at}: introduction window ends before it starts`);
    }
    if (entry.reinforceUntilDay < entry.introduceByDay) {
      problems.push(`${at}: reinforcement ends before the objective is introduced`);
    }
    if (entry.consolidateByDay < entry.reinforceUntilDay) {
      problems.push(`${at}: consolidation is planned before reinforcement ends`);
    }
    if (entry.consolidateByDay > plan.instructionalDays) {
      problems.push(`${at}: consolidation falls after the last instructional day`);
    }
    if (entry.plannedRevisits < 1) {
      problems.push(`${at}: a reinforcement programme must plan at least one revisit`);
    }
  }

  // Every objective of the level's own age band must be planned: that is what makes coverage
  // provable at the end of the year.
  if (ageBandCode !== undefined) {
    for (const objective of objectives) {
      if (objective.ageBandCodes.includes(ageBandCode) && !seen.has(objective.code)) {
        problems.push(`${where}: ${objective.code} is never scheduled`);
      }
    }
  }
  return problems;
}
