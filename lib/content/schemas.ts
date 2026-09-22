/**
 * Zod schemas for the reference content files (content/). They check the shape of each
 * file; business and cross-file rules live in domain/ (checkSchoolCalendar, checkCurricula…)
 * and are applied by ./reference-data.ts. Objects are strict: an unknown key (usually a
 * typo) is an error.
 */
import { z } from "zod";
import {
  type CalendarDate,
  ISO_WEEKDAYS,
  type IsoWeekday,
  isCalendarDate,
} from "@/domain/calendar/date";
import {
  CALENDAR_EXCEPTION_KINDS,
  type CalendarException,
  type PublicHoliday,
  type SchoolCalendar,
  type SchoolPeriod,
  type SchoolYear,
} from "@/domain/calendar/types";
import type {
  Curriculum,
  CurriculumDomain,
  EducationStage,
  SchoolLevel,
} from "@/domain/curriculum/types";
import { AUTHORITIES, VERIFICATIONS } from "@/domain/provenance";

/** Lower-case slug: "maternelle-1", "nouvel-an". Stable identifiers, never displayed. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Upper-case code: "LANG", "TIME-SPACE". */
export const CODE_PATTERN = /^[A-Z][A-Z0-9]*(-[A-Z0-9]+)*$/;

const slug = z.string().regex(SLUG_PATTERN, { message: "must be a lower-case slug (a-z, 0-9, -)" });
const text = z.string().trim().min(1, { message: "must not be empty" });
const positiveInt = z.number().int().positive();

const calendarDate = z.custom<CalendarDate>(isCalendarDate, {
  message: "must be a valid YYYY-MM-DD date",
});
const isoWeekday = z.custom<IsoWeekday>((value) => ISO_WEEKDAYS.includes(value as IsoWeekday), {
  message: "must be an ISO weekday (Monday = 1 … Sunday = 7)",
});

const provenance = {
  authority: z.enum(AUTHORITIES),
  verification: z.enum(VERIFICATIONS),
  source: text.nullable(),
  notes: text.nullable(),
};

// ---- content/education/levels.json ---------------------------------------------------------

const educationStage = z.strictObject({
  id: slug,
  position: positiveInt,
  name: text,
}) satisfies z.ZodType<EducationStage>;

const schoolLevel = z.strictObject({
  id: slug,
  stageId: slug,
  position: positiveInt,
  name: text,
}) satisfies z.ZodType<SchoolLevel>;

export const educationLevelsFileSchema = z.strictObject({
  stages: z.array(educationStage).min(1),
  levels: z.array(schoolLevel).min(1),
});

// ---- content/curriculum/<id>/curriculum.json ------------------------------------------------

const curriculumDomain = z.strictObject({
  code: z.string().regex(CODE_PATTERN, { message: "must be an upper-case code (A-Z, 0-9, -)" }),
  kind: z.enum(["learning-domain", "transversal"]),
  position: positiveInt,
  title: text,
  active: z.boolean(),
}) satisfies z.ZodType<CurriculumDomain>;

export const curriculumFileSchema = z.strictObject({
  id: slug,
  stageId: slug,
  name: text,
  version: text,
  status: z.enum(["draft", "active", "retired"]),
  reference: z.strictObject({
    title: text,
    publisher: text,
    citation: text,
    url: z.url({ protocol: /^https$/ }).nullable(),
    verification: z.enum(VERIFICATIONS),
  }),
  sources: z
    .array(
      z.strictObject({
        id: slug,
        title: text,
        citation: text,
        url: z.url({ protocol: /^https$/ }).nullable(),
        publishedOn: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "must be a YYYY-MM-DD publication date" }),
        sha256: z
          .string()
          .regex(/^[0-9a-f]{64}$/, { message: "must be a SHA-256 hex digest" })
          .nullable(),
        covers: z.array(z.string()).min(1),
        verification: z.enum(VERIFICATIONS),
      }),
    )
    .min(1),
  ageBands: z.array(z.strictObject({ code: slug, position: positiveInt, label: text })).min(1),
  adaptationNote: text.nullable(),
  schoolYearIds: z.array(z.string()),
  levels: z
    .array(
      z.strictObject({
        levelId: slug,
        referenceSection: text.nullable(),
        ageBandCode: slug,
      }),
    )
    .min(1),
  domains: z.array(curriculumDomain).min(1),
}) satisfies z.ZodType<Curriculum>;

// ---- content/calendars/cd/national.json -----------------------------------------------------

const publicHoliday = z.strictObject({
  id: slug,
  name: text,
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  validFrom: calendarDate.nullable(),
  validUntil: calendarDate.nullable(),
  ...provenance,
}) satisfies z.ZodType<PublicHoliday>;

export const nationalCalendarFileSchema = z.strictObject({
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  /** IANA zone used when a server needs "today"; clients use the device's own zone. */
  defaultTimeZone: text,
  publicHolidays: z.array(publicHoliday),
});

// ---- content/calendars/cd/<YYYY-YYYY>.json --------------------------------------------------

const schoolYear = z.strictObject({
  id: z.string().regex(/^\d{4}-\d{4}$/),
  label: text,
  startsOn: calendarDate,
  endsOn: calendarDate,
  instructionalWeekdays: z.array(isoWeekday).min(1),
  ...provenance,
}) satisfies z.ZodType<SchoolYear>;

const schoolPeriod = z.strictObject({
  position: positiveInt,
  term: positiveInt,
  startsOn: calendarDate,
  endsOn: calendarDate,
}) satisfies z.ZodType<SchoolPeriod>;

const calendarException = z.strictObject({
  id: slug,
  kind: z.enum(CALENDAR_EXCEPTION_KINDS),
  startsOn: calendarDate,
  endsOn: calendarDate,
  name: text,
  publicHolidayId: slug.nullable(),
  ...provenance,
}) satisfies z.ZodType<CalendarException>;

export const schoolCalendarFileSchema = z.strictObject({
  schoolYear,
  periods: z.array(schoolPeriod),
  exceptions: z.array(calendarException),
}) satisfies z.ZodType<SchoolCalendar>;
