/** Which review packages exist, so the script and the freshness test agree (ADR-035). */
export type ReviewPackageOptions = { levelId: string; schoolYearId: string; days: number };

export const REVIEW_PACKAGES: readonly ReviewPackageOptions[] = [
  { levelId: "maternelle-3", schoolYearId: "2026-2027", days: 5 },
];

export function reviewPackagePath({ levelId, schoolYearId }: ReviewPackageOptions): string {
  return `docs/review/${schoolYearId}-${levelId}-semaine-1.md`;
}
