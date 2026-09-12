/** Which review packages exist, so the script and the freshness test agree (ADR-035). */
export type ReviewPackageOptions = {
  levelId: string;
  schoolYearId: string;
  /** School week number inside the year, 1-based: the unit a reviewer can actually read. */
  week: number;
  /** Instructional days covered, inclusive. */
  fromDay: number;
  toDay: number;
};

/**
 * September, one package per school week. A single file for the whole month would be a thousand
 * lines of reading before the first comment; a week is a unit a teacher can review in one sitting
 * and hand back.
 */
export const REVIEW_PACKAGES: readonly ReviewPackageOptions[] = [
  { levelId: "maternelle-3", schoolYearId: "2026-2027", week: 1, fromDay: 1, toDay: 4 },
  { levelId: "maternelle-3", schoolYearId: "2026-2027", week: 2, fromDay: 5, toDay: 9 },
  { levelId: "maternelle-3", schoolYearId: "2026-2027", week: 3, fromDay: 10, toDay: 14 },
  { levelId: "maternelle-3", schoolYearId: "2026-2027", week: 4, fromDay: 15, toDay: 19 },
  { levelId: "maternelle-3", schoolYearId: "2026-2027", week: 5, fromDay: 20, toDay: 22 },
];

export function reviewPackagePath({ levelId, schoolYearId, week }: ReviewPackageOptions): string {
  return `docs/review/${schoolYearId}-${levelId}-semaine-${week}.md`;
}
