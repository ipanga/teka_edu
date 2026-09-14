import type { HomeFeasibility, ObjectiveCadence } from "../../../domain/programme/annual-plan";

/**
 * Everything about a year plan that is a judgement rather than an algorithm.
 *
 * The allocation in `build.ts` is shared by every level; what differs between levels is
 * pedagogical and belongs here, in one readable file per level, so a reviewer can argue with the
 * decisions without reading the loop that applies them.
 */
export type LevelPlanConfig = {
  levelId: string;
  /** The band whose objectives this level introduces, as declared in the curriculum file. */
  ageBand: string;
  /** One line per school period, in order: what that period is for. */
  phaseFocus: readonly string[];
  /**
   * The first month, allocated by hand: objective code → the instructional day by which it must
   * have been taught. The rentrée has to teach what a home session can then build on, not
   * whatever came first in the official table.
   */
  september: Readonly<Record<string, number>>;
  /** How often a domain comes round. Daily domains carry more repetition. */
  cadence: Readonly<Record<string, ObjectiveCadence>>;
  /**
   * Objectives whose own rhythm differs from their domain's. Rare, and always the result of a
   * review: a daily domain can still contain something a child meets a handful of times a year.
   */
  cadenceOverrides?: Readonly<Record<string, ObjectiveCadence>>;
  /** Competencies that live inside other domains' lessons rather than needing one of their own. */
  embeddableCompetencies: ReadonlySet<string>;
  /** Objectives an after-school session at home cannot fully carry. */
  homeFeasibility: Readonly<Record<string, HomeFeasibility>>;
};
