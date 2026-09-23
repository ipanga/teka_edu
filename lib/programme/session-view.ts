import {
  type CalendarDate,
  calendarDateInTimeZone,
  formatFrenchDate,
} from "@/domain/calendar/date";
import { generateSchoolDays } from "@/domain/calendar/school-days";
import type { SchoolDay } from "@/domain/calendar/types";
import { ACTIVITY_RENDERERS, type RendererFamily } from "@/domain/lessons/renderers";
import { findText } from "@/domain/lessons/texts";
import type { Activity, Material } from "@/domain/lessons/types";
import {
  type AudioAsset,
  type MediaAsset,
  audioUrl,
  findAsset,
  findAudio,
  mediaUrl,
  pronunciationFor,
} from "@/domain/media/types";
import { generateDailyPlan } from "@/domain/programme/daily-plan";
import type { DailyPlan } from "@/domain/programme/types";
import { getProgramme, getReferenceData } from "@/lib/content/reference-data";

/**
 * Turns the canonical content into what the parent's screen needs, and nothing more.
 *
 * The lesson view deliberately leaves out objective codes, competency titles, success examples
 * and provenance: a parent running a session after school needs the instruction and the next
 * step, not the curriculum apparatus (docs/PARENT_SESSION.md). Those stay in the API, the review
 * packages and the reports.
 */

export const SCHOOL_YEAR_ID = "2026-2027";

/**
 * The classes Teka Edu knows about, in the order a parent reads them. The level is part of the
 * URL and of every lookup below (ADR-044): nothing assumes 3ème maternelle any more, so adding a
 * class — or a primary-school stage later — is content and a row here, not a rewrite.
 */
export const MATERNELLE_SLUGS = {
  "1": "maternelle-1",
  "2": "maternelle-2",
  "3": "maternelle-3",
} as const;
export type MaternelleSlug = keyof typeof MATERNELLE_SLUGS;

export function levelIdFromSlug(slug: string): string | undefined {
  return MATERNELLE_SLUGS[slug as MaternelleSlug];
}

export function slugFromLevelId(levelId: string): MaternelleSlug | undefined {
  const found = Object.entries(MATERNELLE_SLUGS).find(([, id]) => id === levelId);
  return found?.[0] as MaternelleSlug | undefined;
}

export type LevelAvailability = {
  levelId: string;
  slug: MaternelleSlug;
  /** "3ème maternelle", from the education model — never hard-coded in a component. */
  name: string;
  /** A class is available when it has a programme with at least one authored day. */
  available: boolean;
  /** How many instructional days are written, so the home screen can be honest. */
  authoredDays: number;
};

/**
 * What each class can actually offer today. A class with no content says so; it never falls back
 * to another class's lessons, which would show a five-year-old the wrong year's work.
 */
export function levelAvailability(): LevelAvailability[] {
  const data = getReferenceData();
  return Object.entries(MATERNELLE_SLUGS).flatMap(([slug, levelId]) => {
    const level = data.levels.find((candidate) => candidate.id === levelId);
    if (level === undefined) return [];
    const days = authoredDays(levelId);
    return [
      {
        levelId,
        slug: slug as MaternelleSlug,
        name: level.name,
        available: days.length > 0,
        authoredDays: days.length,
      },
    ];
  });
}

export type SessionAudio = {
  id: string;
  url: string;
  /** Exactly what is said, so a deaf child or a silent room loses nothing. */
  transcript: string;
  seconds: number;
};

export type SessionText = {
  title: string;
  kind: "story" | "rhyme";
  lines: readonly string[];
  /** A picture for the story itself, so the child has somewhere to rest their eyes. */
  illustration: SessionMedia | null;
  /** A recording of the text, when one exists. Null is normal: the parent reads (ADR-046). */
  audio: SessionAudio | null;
};

export type SessionMedia = {
  id: string;
  url: string;
  /** French description, read by assistive technology. */
  alt: string;
  /** The words a lesson uses for it, so a renderer can ask for "le carré" by name. */
  tags: readonly string[];
};

export type SessionActivity = {
  id: string;
  position: number;
  title: string;
  childInstruction: string;
  adultGuidance: string;
  minutes: number;
  role: Activity["role"];
  /** off-screen activities tell the parent to put the screen down (ADR-039). */
  mode: Activity["mode"];
  renderer: RendererFamily;
  type: Activity["type"];
  /**
   * The taught words, each with its recording when one exists. Null is the normal case: the
   * parent says the word (ADR-046). The recording is found by transcript, never by an id in the
   * approved content.
   */
  vocabulary: readonly { fr: string; en: string | null; audio: SessionAudio | null }[];
  /** Optional English help. The interface keeps it hidden until the parent asks (ADR-001). */
  englishHelp: string | null;
  payload: Readonly<Record<string, unknown>>;
  text: SessionText | null;
  /** Pictures for this activity, already resolved: the client never sees a file path. */
  media: readonly SessionMedia[];
};

export type SessionStep = {
  position: number;
  domainCode: string;
  lessonTitle: string;
  lessonSummary: string;
  parentGuidance: string;
  activities: readonly SessionActivity[];
};

export type SessionDay = {
  instructionalDay: number;
  levelId: string;
  date: CalendarDate;
  dateLabel: string;
  levelName: string;
  totalMinutes: number;
  screenMinutes: number;
  pauseAfterSession: number | null;
  materials: readonly Material[];
  steps: readonly SessionStep[];
  status: DailyPlan["status"];
};

/** Resolves a media id to what the client needs, or null when there is none. */
function toMedia(id: string | null): SessionMedia | null {
  if (id === null) return null;
  const asset: MediaAsset | undefined = findAsset(getReferenceData().media, id);
  return asset === undefined
    ? null
    : { id: asset.id, url: mediaUrl(asset), alt: asset.alt, tags: asset.tags };
}

const toSessionAudio = (asset: AudioAsset): SessionAudio => ({
  id: asset.id,
  url: audioUrl(asset),
  transcript: asset.transcript,
  seconds: asset.seconds,
});

/** Resolves an audio id, or null when the text has no recording. */
function toAudio(id: string | null): SessionAudio | null {
  if (id === null) return null;
  const asset = findAudio(getReferenceData().audio, id);
  return asset === undefined ? null : toSessionAudio(asset);
}

/** The recording of a taught word, or null when nobody has recorded it yet. */
function toPronunciation(word: string): SessionAudio | null {
  const asset = pronunciationFor(word, getReferenceData().audio);
  return asset === undefined ? null : toSessionAudio(asset);
}

function toActivity(activity: Activity): SessionActivity {
  const textId = activity.payload["textId"];
  const text = typeof textId === "string" ? findText(getReferenceData().texts, textId) : undefined;
  return {
    id: activity.id,
    position: activity.position,
    title: activity.title,
    childInstruction: activity.childInstruction,
    adultGuidance: activity.adultGuidance,
    minutes: activity.minutes,
    role: activity.role,
    mode: activity.mode,
    renderer: ACTIVITY_RENDERERS[activity.type].family,
    type: activity.type,
    vocabulary: activity.vocabulary.map((entry) => ({
      fr: entry.fr,
      en: entry.en,
      audio: toPronunciation(entry.fr),
    })),
    englishHelp: activity.scaffolds.find((s) => s.language === "en")?.childInstruction ?? null,
    payload: activity.payload,
    text:
      text === undefined
        ? null
        : {
            title: text.title,
            kind: text.kind,
            lines: text.lines,
            illustration: toMedia(text.illustrationId),
            audio: toAudio(text.audioId),
          },
    media: activity.mediaIds.flatMap((id) => {
      const asset: MediaAsset | undefined = findAsset(getReferenceData().media, id);
      return asset === undefined
        ? []
        : [{ id: asset.id, url: mediaUrl(asset), alt: asset.alt, tags: asset.tags }];
    }),
  };
}

/** Every day of the school year, instructional or not, for the calendar page. */
export function schoolDays(): SchoolDay[] {
  const data = getReferenceData();
  const calendar = data.calendars.find((c) => c.schoolYear.id === SCHOOL_YEAR_ID);
  if (calendar === undefined) throw new Error(`no calendar for ${SCHOOL_YEAR_ID}`);
  return generateSchoolDays(calendar, data.publicHolidays);
}

/** The session of one instructional day, or undefined when that day has no content yet. */
export function sessionForDay(levelId: string, day: number): SessionDay | undefined {
  const data = getReferenceData();
  const programme = getProgramme(levelId, SCHOOL_YEAR_ID, data);
  const schoolDay = schoolDays().find((d) => d.instructionalDay === day);
  if (programme === undefined || schoolDay === undefined || schoolDay.date === null)
    return undefined;

  const plan = generateDailyPlan(schoolDay, programme, data.lessons);
  if (plan.status === "no-content" || plan.status === "not-instructional") return undefined;

  return {
    instructionalDay: day,
    levelId,
    date: schoolDay.date,
    dateLabel: formatFrenchDate(schoolDay.date),
    levelName: data.levels.find((l) => l.id === levelId)?.name ?? levelId,
    totalMinutes: plan.totalMinutes,
    screenMinutes: plan.screenMinutes,
    pauseAfterSession: plan.pauseAfterSession,
    materials: plan.materialCodes.flatMap((code) => {
      const material = data.materials.find((m) => m.code === code);
      // "Aucun matériel" is not something to prepare, so the list never shows it.
      return material === undefined || material.code === "aucun" ? [] : [material];
    }),
    steps: plan.sessions.flatMap((session) =>
      session.lesson === null
        ? []
        : [
            {
              position: session.position,
              domainCode: session.domainCode,
              lessonTitle: session.lesson.title,
              lessonSummary: session.lesson.summary,
              parentGuidance: session.lesson.parentGuidance,
              activities: session.lesson.activities.map(toActivity),
            },
          ],
    ),
    status: plan.status,
  };
}

/** Instructional days that already have a session for this class, in order. */
export function authoredDays(levelId: string): number[] {
  const days: number[] = [];
  for (const day of schoolDays()) {
    if (
      day.instructionalDay !== null &&
      sessionForDay(levelId, day.instructionalDay) !== undefined
    ) {
      days.push(day.instructionalDay);
    }
  }
  return days;
}

/**
 * Today, in the school's time zone, and the session to offer. If today is not a school day — a
 * weekend, a holiday, or a date outside the authored month — the parent is offered the most
 * recent day that has one, and told why.
 */
export function todaysSession(levelId: string): {
  today: CalendarDate;
  todayLabel: string;
  isInstructional: boolean;
  reason: string | null;
  session: SessionDay | undefined;
} {
  const data = getReferenceData();
  const today = calendarDateInTimeZone(new Date(), data.defaultTimeZone);
  const day = schoolDays().find((d) => d.date === today);
  const authored = authoredDays(levelId);

  if (day?.instructional && day.instructionalDay !== null) {
    const session = sessionForDay(levelId, day.instructionalDay);
    if (session !== undefined) {
      return {
        today,
        todayLabel: formatFrenchDate(today),
        isInstructional: true,
        reason: null,
        session,
      };
    }
  }
  const reason =
    day === undefined
      ? "Cette date ne fait pas partie de l’année scolaire 2026-2027."
      : (day.reasons[0]?.name ??
        (day.reasons[0]?.code === "weekend"
          ? "C’est le week-end : il n’y a pas de séance aujourd’hui."
          : "Il n’y a pas de séance aujourd’hui."));
  // Not simply the last day written: on a Sunday a parent expects Friday's session, not the end
  // of the month. Offer the most recent instructional day that has already happened, and only
  // fall back to the first one before the year starts.
  const previous = schoolDays().filter(
    (candidate) =>
      candidate.date <= today &&
      candidate.instructionalDay !== null &&
      authored.includes(candidate.instructionalDay),
  );
  const fallback = previous.at(-1)?.instructionalDay ?? authored[0];
  return {
    today,
    todayLabel: formatFrenchDate(today),
    isInstructional: day?.instructional ?? false,
    reason,
    session: fallback === undefined ? undefined : sessionForDay(levelId, fallback),
  };
}
