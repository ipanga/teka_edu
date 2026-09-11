/**
 * Who decided a reference fact, and whether it was checked. Kept on calendar and curriculum
 * data so that a Teka Edu assumption is never presented as a DRC legal requirement or an
 * official text (docs/SCHOOL_CALENDAR.md, docs/EDUCATIONAL_MODEL.md).
 *   law       — legislation (e.g. the DRC ordinance listing public holidays)
 *   ministry  — a ministry decision (e.g. the annual DRC school calendar)
 *   teka-edu  — a Teka Edu configuration choice or provisional assumption
 */
export const AUTHORITIES = ["law", "ministry", "teka-edu"] as const;
export type Authority = (typeof AUTHORITIES)[number];

/** Whether the fact was checked against the cited source. */
export const VERIFICATIONS = ["verified", "needs-verification"] as const;
export type Verification = (typeof VERIFICATIONS)[number];

export type Provenance = {
  authority: Authority;
  verification: Verification;
  /** Citation of the source (instrument, communiqué, URL). Required unless authority is teka-edu. */
  source: string | null;
  notes: string | null;
};
