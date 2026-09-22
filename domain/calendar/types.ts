import type { Provenance } from "../provenance";
import type { CalendarDate, IsoWeekday } from "./date";

export type SchoolYear = Provenance & {
  /** Stable identifier `YYYY-YYYY`, e.g. "2026-2027". */
  id: string;
  /** Display label, e.g. "2026–2027". */
  label: string;
  startsOn: CalendarDate;
  endsOn: CalendarDate;
  /** Weekdays that are normally instructional (Monday = 1). Mon–Fri for the DRC. */
  instructionalWeekdays: readonly IsoWeekday[];
};

/** A public holiday on a fixed date every year (all current DRC holidays are fixed-date). */
export type PublicHoliday = Provenance & {
  id: string;
  /** Official French name. */
  name: string;
  month: number;
  day: number;
  /** Optional validity window (a holiday created or abolished by a later text). */
  validFrom: CalendarDate | null;
  validUntil: CalendarDate | null;
};

/**
 * A dated, per-school-year adjustment to the generated calendar.
 *   public-holiday     — a one-off holiday (e.g. a day declared non-working by the government)
 *   observed-holiday   — a substitute day for a public holiday (e.g. one falling on a Sunday);
 *                        observance rules are data, never code
 *   school-vacation    — a planned vacation period of the school calendar
 *   school-closure     — an exceptional closure
 *   instructional-day  — an exceptional instructional day; overrides weekends, holidays and
 *                        vacations on that date
 */
export const CALENDAR_EXCEPTION_KINDS = [
  "public-holiday",
  "observed-holiday",
  "school-vacation",
  "school-closure",
  "instructional-day",
] as const;
export type CalendarExceptionKind = (typeof CALENDAR_EXCEPTION_KINDS)[number];

export type CalendarException = Provenance & {
  id: string;
  kind: CalendarExceptionKind;
  startsOn: CalendarDate;
  endsOn: CalendarDate;
  /** French name, e.g. "Congé de Noël". */
  name: string;
  /** Required for observed-holiday (the holiday being observed), null otherwise. */
  publicHolidayId: string | null;
};

/**
 * A teaching period of the official school calendar (the DRC calendar splits each
 * trimester into periods separated by short breaks). Periods are the future unit of
 * "period objectives"; they do not decide which dates are instructional.
 */
export type SchoolPeriod = {
  /** Order within the school year: 1, 2, 3… */
  position: number;
  /** The trimester (term) the period belongs to: 1, 2 or 3. */
  term: number;
  startsOn: CalendarDate;
  endsOn: CalendarDate;
};

/** One configured school year, its periods and its exceptions (content/calendars/cd/<year>.json). */
export type SchoolCalendar = {
  schoolYear: SchoolYear;
  periods: readonly SchoolPeriod[];
  exceptions: readonly CalendarException[];
};

/**
 * Why a date is not instructional, in order of precedence (the first one is the primary
 * reason; see docs/SCHOOL_CALENDAR.md). `outside-school-year` only appears for dates that
 * belong to no configured school year.
 */
export type NonInstructionalReasonCode =
  | "weekend"
  | "school-vacation"
  | "public-holiday"
  | "observed-holiday"
  | "school-closure"
  | "outside-school-year";

export const REASON_PRECEDENCE: readonly NonInstructionalReasonCode[] = [
  "outside-school-year",
  "weekend",
  "school-vacation",
  "public-holiday",
  "observed-holiday",
  "school-closure",
];

export type NonInstructionalReason = {
  code: NonInstructionalReasonCode;
  /** French name of the holiday or exception; null for weekends and outside-school-year. */
  name: string | null;
  publicHolidayId: string | null;
  exceptionId: string | null;
};

export type SchoolDay = {
  date: CalendarDate;
  weekday: IsoWeekday;
  schoolYearId: string | null;
  /** Position of the school period containing the date; null in breaks and vacations. */
  period: number | null;
  instructional: boolean;
  /** Position in the gap-free instructional sequence (day 1, day 2…); null if not instructional. */
  instructionalDay: number | null;
  /**
   * Every reason that would make this date non-instructional, primary reason first. Empty
   * for an ordinary instructional day. Not empty but overridden when `override` is set.
   */
  reasons: readonly NonInstructionalReason[];
  /** The instructional-day exception that makes this date instructional despite `reasons`. */
  override: { exceptionId: string; name: string } | null;
};
