import type { Curriculum, LearningObjective, SchoolLevel } from "../curriculum/types";
import { checkLessonReview } from "../lessons/review";
import { type Lesson, type Material, lessonMinutes } from "../lessons/types";
import { planForInstructionalDay } from "./daily-plan";
import { type LevelProgramme, SESSION_MINUTES_POLICY } from "./types";

/**
 * Rules for authored content (docs/CONTENT_AUTHORING.md, docs/DAILY_PROGRAMME.md).
 * Each rule says where it comes from: OFFICIAL (a rule of the programme itself) or TEKA EDU
 * (a product decision). Returns problems; empty means valid.
 */

/** Lessons and activities: references, traceability and level/age-band fit. */
export function checkLessons(
  lessons: readonly Lesson[],
  curricula: readonly Curriculum[],
  objectives: readonly LearningObjective[],
  levels: readonly SchoolLevel[],
  materials: readonly Material[],
): string[] {
  const problems: string[] = [];
  const objectiveByCode = new Map(objectives.map((objective) => [objective.code, objective]));
  const materialCodes = new Set(materials.map((material) => material.code));
  const levelIds = new Set(levels.map((level) => level.id));
  const seenLessonIds = new Set<string>();
  const seenActivityIds = new Set<string>();

  for (const lesson of lessons) {
    const at = `lesson "${lesson.id}"`;
    if (seenLessonIds.has(lesson.id)) problems.push(`${at}: id is used twice`);
    seenLessonIds.add(lesson.id);
    // The quality gate: AI-drafted content never approves itself — an independent review does
    // (ADR-035, refined by ADR-047).
    problems.push(...checkLessonReview(lesson));

    const curriculum = curricula.find((c) => c.id === lesson.curriculumId);
    if (curriculum === undefined) {
      problems.push(`${at}: unknown curriculum "${lesson.curriculumId}"`);
      continue;
    }
    if (!curriculum.domains.some((domain) => domain.code === lesson.domainCode)) {
      problems.push(`${at}: unknown domain "${lesson.domainCode}"`);
    }
    if (lesson.origin !== "teka-edu-created") {
      problems.push(`${at}: lessons are authored by Teka Edu, origin must be teka-edu-created`);
    }

    // Every level the lesson claims must exist and be covered by its curriculum.
    const bandsOfLesson: string[] = [];
    for (const levelId of lesson.levelIds) {
      if (!levelIds.has(levelId)) {
        problems.push(`${at}: unknown level "${levelId}"`);
        continue;
      }
      const mapping = curriculum.levels.find((level) => level.levelId === levelId);
      if (mapping === undefined) {
        problems.push(`${at}: level "${levelId}" is not covered by ${curriculum.id}`);
      } else {
        bandsOfLesson.push(mapping.ageBandCode);
      }
    }

    for (const code of [...lesson.objectiveCodes, ...lesson.supportingObjectiveCodes]) {
      const objective = objectiveByCode.get(code);
      if (objective === undefined) {
        problems.push(`${at}: unknown objective "${code}"`);
        continue;
      }
      // OFFICIAL: each age reinvests what came before, so a lesson may work on an objective of
      // its own band or of an earlier one — never one of a later band.
      const bandOrder = curriculum.ageBands
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((band) => band.code);
      for (const band of bandsOfLesson) {
        const levelBand = bandOrder.indexOf(band);
        const earliest = Math.min(
          ...objective.ageBandCodes.map((objectiveBand) => bandOrder.indexOf(objectiveBand)),
        );
        if (earliest > levelBand) {
          problems.push(
            `${at}: objective "${code}" belongs to a later age band than the level it is written for`,
          );
        }
      }
    }

    const lessonObjectives = new Set([
      ...lesson.objectiveCodes,
      ...lesson.supportingObjectiveCodes,
    ]);
    for (const code of lesson.supportingObjectiveCodes) {
      if (lesson.objectiveCodes.includes(code)) {
        problems.push(`${at}: objective "${code}" is both taught and supporting`);
      }
    }
    /**
     * A lesson may not claim an objective none of its activities works.
     *
     * The other direction was already checked, and the gap let stale template metadata survive:
     * a day-2 lesson kept « acquérir les premiers repères temporels » in its revisited list long
     * after the activity that supposedly carried it had been corrected. A reviewer reads the
     * lesson header, so a claim there is a claim.
     */
    const worked = new Set(lesson.activities.flatMap((activity) => activity.objectiveCodes));
    for (const code of [...lesson.objectiveCodes, ...lesson.supportingObjectiveCodes]) {
      if (!worked.has(code)) {
        problems.push(
          `${at}: objective "${code}" is listed on the lesson but no activity works it`,
        );
      }
    }
    const positions = lesson.activities.map((activity) => activity.position).sort((a, b) => a - b);
    positions.forEach((position, index) => {
      if (position !== index + 1) problems.push(`${at}: activity positions must be 1…n`);
    });
    for (const activity of lesson.activities) {
      const where = `${at}, activity "${activity.id}"`;
      if (seenActivityIds.has(activity.id)) problems.push(`${where}: id is used twice`);
      seenActivityIds.add(activity.id);
      if (activity.objectiveCodes.length === 0) {
        problems.push(`${where}: every activity must serve at least one objective`);
      }
      for (const code of activity.objectiveCodes) {
        if (!lessonObjectives.has(code)) {
          problems.push(`${where}: objective "${code}" is not among the lesson's objectives`);
        }
      }
      for (const code of activity.materialCodes) {
        if (!materialCodes.has(code)) problems.push(`${where}: unknown material "${code}"`);
      }
      if (activity.materialCodes.length === 0) {
        problems.push(`${where}: list the materials, or "aucun" when none is needed`);
      }
      // TEKA EDU: English is scaffolding only; the French instruction is always the content.
      for (const scaffold of activity.scaffolds) {
        if (scaffold.language === "fr") {
          problems.push(`${where}: French is the instruction itself, not a scaffold`);
        }
      }
    }
  }
  return problems;
}

/** The daily programme of a level: references, rhythm, progression and daily balance. */
export function checkProgramme(
  programme: LevelProgramme,
  lessons: readonly Lesson[],
  curricula: readonly Curriculum[],
  schoolYearIds: readonly string[],
): string[] {
  const problems: string[] = [];
  const at = `programme "${programme.id}"`;
  const curriculum = curricula.find((c) => c.id === programme.curriculumId);
  if (curriculum === undefined) {
    return [`${at}: unknown curriculum "${programme.curriculumId}"`];
  }
  if (!curriculum.levels.some((level) => level.levelId === programme.levelId)) {
    problems.push(`${at}: level "${programme.levelId}" is not covered by ${curriculum.id}`);
  }
  for (const yearId of programme.schoolYearIds) {
    if (!schoolYearIds.includes(yearId)) problems.push(`${at}: unknown school year "${yearId}"`);
  }
  if (programme.sessionMinutes.min > programme.sessionMinutes.max) {
    problems.push(`${at}: sessionMinutes.min is greater than sessionMinutes.max`);
  }
  // TEKA EDU (ADR-039): a day is 30 to 45 minutes. A level may not quietly redefine what a
  // session is; departing from the policy has to be declared and is then visible in review.
  if ((programme.durationPolicy ?? "standard") === "standard") {
    if (
      programme.sessionMinutes.min < SESSION_MINUTES_POLICY.min ||
      programme.sessionMinutes.max > SESSION_MINUTES_POLICY.max
    ) {
      problems.push(
        `${at}: a session is ${SESSION_MINUTES_POLICY.min}-${SESSION_MINUTES_POLICY.max} min ` +
          `(ADR-039), but this programme declares ${programme.sessionMinutes.min}-` +
          `${programme.sessionMinutes.max}. Set durationPolicy: "exceptional" to depart from it.`,
      );
    }
  }

  const rhythmPositions = programme.rhythm.map((day) => day.position).sort((a, b) => a - b);
  rhythmPositions.forEach((position, index) => {
    if (position !== index + 1) problems.push(`${at}: rhythm days must be numbered 1…n`);
  });
  const trackIds = new Set(programme.tracks.map((track) => track.id));
  const usedTrackIds = new Set(programme.rhythm.flatMap((day) => day.slots.map((s) => s.trackId)));
  for (const day of programme.rhythm) {
    const slotPositions = day.slots.map((slot) => slot.position).sort((a, b) => a - b);
    slotPositions.forEach((position, index) => {
      if (position !== index + 1) problems.push(`${at}: slots of day ${day.position} must be 1…n`);
    });
    for (const slot of day.slots) {
      if (!trackIds.has(slot.trackId)) {
        problems.push(`${at}: rhythm day ${day.position} uses unknown track "${slot.trackId}"`);
      }
    }
  }
  for (const track of programme.tracks) {
    if (!usedTrackIds.has(track.id)) problems.push(`${at}: track "${track.id}" is never used`);
  }

  // TEKA EDU: every domain of the curriculum appears at least once in one rhythm cycle, so a
  // week never drops a domain (the programme states that each of the six matters).
  const domainsInRhythm = new Set(
    [...usedTrackIds].map((id) => programme.tracks.find((track) => track.id === id)?.domainCode),
  );
  for (const domain of curriculum.domains) {
    if (domain.kind === "learning-domain" && domain.active && !domainsInRhythm.has(domain.code)) {
      problems.push(`${at}: domain ${domain.code} never appears in the rhythm`);
    }
  }

  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const seen = new Set<string>();
  for (const track of programme.tracks) {
    for (const lessonId of track.lessonIds) {
      const lesson = byId.get(lessonId);
      if (lesson === undefined) {
        problems.push(`${at}: unknown lesson "${lessonId}"`);
        continue;
      }
      if (seen.has(lessonId)) problems.push(`${at}: lesson "${lessonId}" is scheduled twice`);
      seen.add(lessonId);
      if (lesson.curriculumId !== programme.curriculumId) {
        problems.push(`${at}: lesson "${lessonId}" belongs to another curriculum`);
      }
      if (!lesson.levelIds.includes(programme.levelId)) {
        problems.push(`${at}: lesson "${lessonId}" is not written for ${programme.levelId}`);
      }
      if (lesson.domainCode !== track.domainCode) {
        problems.push(
          `${at}: lesson "${lessonId}" is a ${lesson.domainCode} lesson in the ${track.domainCode} track "${track.id}"`,
        );
      }
    }
  }
  problems.push(...checkProgression(at, programme, byId));
  // The balance rules simulate real days, so they only run once every reference resolves.
  if (problems.length === 0) problems.push(...checkDailyBalance(programme, lessons));
  return problems;
}

/**
 * Progression across the programme, in the order a child meets it.
 *
 * This used to run per track, which was wrong in a way the Week 1 review found: a rhyme sung in
 * the language lesson on day 1 was the child's first exposure to « dire ou chanter au moins cinq
 * comptines », but the arts track did not meet that objective until day 4 and so claimed to be
 * introducing it — while day 1 had listed it as already seen. A child does not experience tracks;
 * they experience days.
 *
 * So the sequence is the rhythm: day by day, and within a day slot by slot. An objective is
 * introduced exactly once, by whichever lesson reaches it first, and a lesson that practises or
 * consolidates must build on something an earlier lesson taught — in any track.
 */
function checkProgression(
  at: string,
  programme: LevelProgramme,
  byId: ReadonlyMap<string, Lesson>,
): string[] {
  const problems: string[] = [];
  const trackById = new Map(programme.tracks.map((track) => [track.id, track]));
  /** Each track's lessons are consumed in order as the rhythm calls for that track. */
  const nextIndex = new Map(programme.tracks.map((track) => [track.id, 0]));
  const introduced = new Set<string>();
  const taught = new Set<string>();

  // The rhythm is a repeating cycle, not one entry per day: day 11 of a ten-day rhythm is
  // rhythm day 1 again, with each track continuing through its own list. Walk real days until
  // every track's lessons are used, exactly as `generateDailyPlan` does.
  const cycle = [...programme.rhythm].sort((a, b) => a.position - b.position);
  const totalLessons = programme.tracks.reduce((sum, track) => sum + track.lessonIds.length, 0);
  let placed = 0;
  // Bounded on purpose: if a track holds lessons the rhythm never calls for, the walk would
  // otherwise never finish. One day per lesson is always enough, and the leftovers are reported.
  const maxDays = totalLessons + cycle.length;
  let dayNumber = 0;
  for (; cycle.length > 0 && placed < totalLessons && dayNumber < maxDays;) {
    dayNumber += 1;
    const day = cycle[(dayNumber - 1) % cycle.length]!;
    for (const slot of [...day.slots].sort((a, b) => a.position - b.position)) {
      const track = trackById.get(slot.trackId);
      if (track === undefined) continue;
      const index = nextIndex.get(slot.trackId) ?? 0;
      const lessonId = track.lessonIds[index];
      if (lessonId === undefined) continue;
      nextIndex.set(slot.trackId, index + 1);
      placed += 1;
      const lesson = byId.get(lessonId);
      if (lesson === undefined) continue;
      const where = `${at}, jour ${dayNumber}, "${lessonId}"`;

      if (lesson.stage !== "discovery") {
        const builds = [...lesson.objectiveCodes, ...lesson.supportingObjectiveCodes].some((code) =>
          taught.has(code),
        );
        if (!builds) {
          problems.push(
            `${where}: a ${lesson.stage} lesson must work on something taught on an earlier day`,
          );
        }
      }
      /**
       * The introduction point is wherever the child actually meets the objective first. So the
       * lesson that reaches it first must list it as taught; a lesson cannot describe as "already
       * seen" something no earlier day has taught. This is the defect the Week 1 review found:
       * day 1 sang a rhyme and filed the objective under « déjà vus », while day 4 claimed to
       * introduce it.
       */
      for (const code of lesson.supportingObjectiveCodes) {
        if (!taught.has(code)) {
          problems.push(
            `${where}: objective "${code}" is listed as already seen, but the child meets it here first — it belongs in the taught list`,
          );
        }
      }
      for (const code of lesson.objectiveCodes) {
        if (!taught.has(code)) introduced.add(code);
        taught.add(code);
      }
      for (const code of lesson.supportingObjectiveCodes) taught.add(code);
    }
  }
  if (placed < totalLessons) {
    problems.push(
      `${at}: ${totalLessons - placed} lesson(s) are listed in a track the rhythm never calls for`,
    );
  }
  return problems;
}

/** Daily balance of the generated plans, while the tracks still have lessons. */
function checkDailyBalance(programme: LevelProgramme, lessons: readonly Lesson[]): string[] {
  const problems: string[] = [];
  const at = `programme "${programme.id}"`;
  const maxDays = programme.rhythm.length * 20;
  let previousLessonIds: string[] = [];
  for (let day = 1; day <= maxDays; day++) {
    const plan = planForInstructionalDay(day, programme, lessons);
    if (plan.status !== "complete") break;
    const where = `${at}, instructional day ${day}`;
    // TEKA EDU: a home session stays inside the level's declared range.
    if (plan.totalMinutes < programme.sessionMinutes.min) {
      problems.push(`${where}: ${plan.totalMinutes} min is shorter than the session minimum`);
    }
    if (plan.totalMinutes > programme.sessionMinutes.max) {
      problems.push(`${where}: ${plan.totalMinutes} min is longer than the session maximum`);
    }
    // TEKA EDU (from public-health guidance for 3-to-6-year-olds): screen work stays a minority
    // of the session and is always adult-accompanied.
    if (plan.screenMinutes * 2 > plan.totalMinutes) {
      problems.push(
        `${where}: ${plan.screenMinutes} of ${plan.totalMinutes} min are on screen, more than half`,
      );
    }
    // OFFICIAL (arrêté du 16 avril 2026): physical activity is daily.
    const hasMovement = plan.sessions.some((session) =>
      (session.lesson?.activities ?? []).some((activity) => activity.type === "movement"),
    );
    if (!hasMovement) problems.push(`${where}: no physical activity`);
    // TEKA EDU: never the same lesson on two days in a row.
    const lessonIds = plan.sessions.flatMap((session) =>
      session.lesson ? [session.lesson.id] : [],
    );
    for (const id of lessonIds) {
      if (previousLessonIds.includes(id))
        problems.push(`${where}: lesson "${id}" repeats the day before`);
    }
    previousLessonIds = lessonIds;
  }
  return problems;
}

/** Total guided minutes of a set of lessons, for reports. */
export function totalMinutes(lessons: readonly Lesson[]): number {
  return lessons.reduce((total, lesson) => total + lessonMinutes(lesson), 0);
}
