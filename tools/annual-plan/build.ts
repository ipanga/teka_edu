/**
 * Builds the 3ème maternelle annual scope and sequence (ADR-040).
 *
 *   npx tsx tools/annual-plan/build.ts
 *
 * The output, content/programmes/<curriculum>/<level>-annual-plan.json, is canonical content:
 * it is committed, validated and tested like every other content file. This script exists so
 * the pacing can be regenerated and reviewed as a whole, not hand-maintained entry by entry —
 * 162 objectives is too many to keep coherent by hand.
 *
 * It reads the official objective files directly rather than the reference-data loader, because
 * the loader validates the plan this script is about to write.
 *
 * What the allocation encodes, in one place, so a reviewer can argue with it:
 *
 *  1. The year's teaching set is the objectives of the level's own age band (`from-5`).
 *     Earlier-band objectives are reinvested by lessons as supporting objectives; they are not
 *     scheduled, because this level is not introducing them.
 *  2. September (days 1-22) is allocated **by hand** below: the rentrée has to teach the things
 *     an after-school session can build on — greeting and naming, counting small collections,
 *     the date, the body, daily movement — not whatever came first in the official table.
 *  3. The remaining objectives are spread over the rest of the year in official order within a
 *     domain, which is the order the programme itself progresses in.
 *  4. Daily-cadence domains (language, mathematics, movement) get more revisits than the
 *     rotating ones, and an objective introduced late in the year gets fewer: there is less
 *     year left to revisit it in.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { generateSchoolDays } from "../../domain/calendar/school-days";
import type { PublicHoliday, SchoolCalendar } from "../../domain/calendar/types";
import type {
  AnnualPhase,
  AnnualPlan,
  AnnualPlanEntry,
  HomeFeasibility,
  ObjectiveCadence,
} from "../../domain/programme/annual-plan";

const ROOT = path.resolve(import.meta.dirname, "../..");
const CURRICULUM = "maternelle-cycle1-cd-2026";
const LEVEL = "maternelle-3";
const SCHOOL_YEAR = "2026-2027";
const AGE_BAND = "from-5";
/** The month authored in full by Phase 3A; everything after it is pacing only. */
const FIRST_MONTH = "2026-09";
const DOMAINS = ["LANG", "MATH", "PHYS", "TIME-SPACE", "WORLD", "ART"] as const;

const read = (relative: string): unknown =>
  JSON.parse(readFileSync(path.join(ROOT, relative), "utf8"));

/** Instructional days, and the day number each school period starts and ends on. */
function calendarShape() {
  const calendar = read(`content/calendars/cd/${SCHOOL_YEAR}.json`) as SchoolCalendar;
  const national = read("content/calendars/cd/national.json") as {
    publicHolidays: PublicHoliday[];
  };
  const days = generateSchoolDays(calendar, national.publicHolidays);
  const instructional = days.filter((day) => day.instructional);
  const phases: AnnualPhase[] = calendar.periods.map((period, index) => {
    const inPeriod = instructional.filter(
      (day) => day.date >= period.startsOn && day.date <= period.endsOn,
    );
    const first = inPeriod[0];
    const last = inPeriod[inPeriod.length - 1];
    if (first?.instructionalDay == null || last?.instructionalDay == null) {
      throw new Error(`period ${index + 1} has no instructional day`);
    }
    return {
      code: `P${index + 1}`,
      name: `Période ${period.position} (trimestre ${period.term})`,
      fromDay: first.instructionalDay,
      toDay: last.instructionalDay,
      focus: PHASE_FOCUS[index] ?? "Poursuite du programme.",
    };
  });
  // The phases must tile the year: give the last one every remaining day (a day between two
  // periods still gets taught, because the programme follows instructional days, not dates).
  for (let i = 0; i < phases.length - 1; i++) phases[i]!.toDay = phases[i + 1]!.fromDay - 1;
  phases[0]!.fromDay = 1;
  phases[phases.length - 1]!.toDay = instructional.length;
  // The first month is authored day by day, so the plan must know where it ends. Derived from
  // the calendar, never hard-coded: a closure in September moves this on its own.
  const septemberDays = instructional.filter((day) => day.date.startsWith(`${FIRST_MONTH}-`));
  const lastSeptemberDay = septemberDays[septemberDays.length - 1]?.instructionalDay;
  if (lastSeptemberDay == null) throw new Error(`no instructional day in ${FIRST_MONTH}`);
  return { instructionalDays: instructional.length, phases, lastSeptemberDay };
}

const PHASE_FOCUS = [
  "Rentrée : entrer dans le français parlé, compter de petites collections, installer le rituel quotidien.",
  "Consolider l’oral et les premières quantités ; entrer dans la conscience des syllabes.",
  "Rimes, phonèmes et premières lettres ; problèmes de parties et de tout.",
  "Écriture des chiffres et des lettres ; comparer longueurs et masses.",
  "Principe alphabétique et premiers écrits ; motifs et repères dans l’année.",
  "Consolidation de l’année et préparation de l’entrée en primaire.",
];

/**
 * September, day by day. Hand-allocated: these are the objectives the first month introduces,
 * and the day by which each must have been taught. The September lessons in content/lessons/
 * are written against this list, and a test checks the two agree.
 */
const SEPTEMBER: Record<string, number> = {
  // Language: speaking to an adult, being understood, and hearing how words are made.
  "LANG-S01-C04-O11": 1,
  "LANG-S01-C01-O03": 1,
  "LANG-S01-C02-O01": 2,
  "LANG-S02-C03-O15": 3,
  "LANG-S02-C01-O13": 6,
  "LANG-S02-C03-O14": 9,
  "LANG-S01-C01-O02": 12,
  "LANG-S02-C01-O15": 16,
  // Mathematics: small quantities first, then shapes, then composing them.
  "MATH-S01-C01-O20": 1,
  "MATH-S01-C01-O21": 1,
  "MATH-S01-C01-O05": 2,
  "MATH-S03-C01-O08": 3,
  "MATH-S03-C01-O07": 3,
  "MATH-S01-C01-O26": 4,
  "MATH-S01-C01-O19": 7,
  "MATH-S01-C01-O22": 11,
  "MATH-S01-C01-O23": 11,
  "MATH-S01-C02-O06": 15,
  // Movement, every day, starting with the safety rules that make the rest possible.
  "PHYS-S02-C01-O07": 1,
  "PHYS-S01-C01-O10": 2,
  "PHYS-S03-C01-O09": 3,
  "PHYS-S01-C01-O09": 4,
  "PHYS-S02-C01-O05": 5,
  "PHYS-S04-C01-O09": 8,
  // Time and space: the daily date ritual, then the week, then where things are.
  "TIME-SPACE-S01-C01-O12": 1,
  "TIME-SPACE-S01-C01-O10": 3,
  "TIME-SPACE-S02-C01-O16": 10,
  "TIME-SPACE-S01-C02-O08": 18,
  // The world: one's own body first, then animals and plants.
  "WORLD-S01-C02-O08": 2,
  "WORLD-S01-C02-O09": 2,
  "WORLD-S01-C01-O08": 5,
  "WORLD-S01-C01-O10": 5,
  // Arts: the rhyme repertoire is built all year, so it starts in week 1.
  "ART-S02-C01-O09": 4,
  "ART-S01-C01-O05": 7,
  "ART-S02-C02-O08": 13,
  "ART-S01-C01-O06": 20,
};

/** Objectives an after-school session at home cannot fully carry. */
const HOME_FEASIBILITY: Record<string, HomeFeasibility> = {
  "PHYS-S02-C01-O06": "school-only", // swimming: needs a pool and qualified supervision
  "ART-S03-C02-O08": "school-only", // meeting artists and professionals
  "LANG-S01-C04-O09": "partial", // describing what another pupil did
  "PHYS-S01-C01-O13": "partial", // orienting in a less familiar place
  "PHYS-S04-C01-O08": "partial", // attacking and defending roles need a group
  "ART-S01-C01-O07": "partial", // collective artwork
  "ART-S02-C01-O08": "partial", // finding one's place in a singing group
  "ART-S02-C02-O09": "partial", // collective musical production
  "ART-S02-C03-O07": "partial", // listening to heritage works: needs media
  "ART-S02-C03-O08": "partial",
  "ART-S03-C01-O09": "partial", // collective staging
  "ART-S03-C02-O06": "partial",
  "ART-S03-C02-O07": "partial",
  "TIME-SPACE-S02-C03-O04": "partial", // the spaces around the school
  "TIME-SPACE-S02-C03-O05": "partial",
  "TIME-SPACE-S02-C03-O06": "partial",
};

/** Domains taught every day carry more repetition than the rotating ones. */
const CADENCE: Record<string, ObjectiveCadence> = {
  LANG: "daily",
  MATH: "daily",
  PHYS: "daily",
  "TIME-SPACE": "frequent",
  WORLD: "periodic",
  ART: "periodic",
};

/** Objectives that live inside other domains' lessons rather than needing one of their own. */
const EMBEDDABLE_COMPETENCIES = new Set([
  "LANG-S01-C01", // vocabulary is reinvested everywhere
  "LANG-S01-C02",
  "LANG-S01-C04",
  "TIME-SPACE-S01-C01", // the date ritual opens any lesson
  "TIME-SPACE-S01-C03",
  "PHYS-S02-C01", // safety rules ride along with every movement activity
]);

type ObjectiveRow = { code: string; competencyCode: string; domainCode: string; position: number };

function objectivesOfBand(): ObjectiveRow[] {
  const rows: ObjectiveRow[] = [];
  for (const domain of DOMAINS) {
    const file = read(`content/curriculum/${CURRICULUM}/objectives/${domain}.json`) as {
      subdomains: {
        competencies: { code: string; objectives: { code: string; ageBands: string[] }[] }[];
      }[];
    };
    let position = 0;
    for (const subdomain of file.subdomains) {
      for (const competency of subdomain.competencies) {
        for (const objective of competency.objectives) {
          if (!objective.ageBands.includes(AGE_BAND)) continue;
          rows.push({
            code: objective.code,
            competencyCode: competency.code,
            domainCode: domain,
            position: position++,
          });
        }
      }
    }
  }
  return rows;
}

function main() {
  const { instructionalDays, phases, lastSeptemberDay } = calendarShape();
  const objectives = objectivesOfBand();
  const september = phases[0]!;
  const entries: AnnualPlanEntry[] = [];

  const plannedRevisits = (cadence: ObjectiveCadence, introducedBy: number): number => {
    const remaining = instructionalDays - introducedBy;
    const base = cadence === "daily" ? 12 : cadence === "frequent" ? 8 : 5;
    // An objective introduced with little of the year left cannot be revisited as often.
    return Math.max(1, Math.min(base, Math.round((remaining / instructionalDays) * base * 1.6)));
  };

  const push = (row: ObjectiveRow, phase: AnnualPhase, fromDay: number, byDay: number) => {
    const cadence = CADENCE[row.domainCode] ?? "periodic";
    const reinforceUntilDay = Math.min(instructionalDays, byDay + (cadence === "daily" ? 60 : 45));
    entries.push({
      objectiveCode: row.code,
      domainCode: row.domainCode,
      phase: phase.code,
      introduceFromDay: fromDay,
      introduceByDay: byDay,
      reinforceUntilDay,
      consolidateByDay: Math.min(
        instructionalDays,
        Math.max(reinforceUntilDay, byDay + (cadence === "daily" ? 90 : 70)),
      ),
      plannedRevisits: plannedRevisits(cadence, byDay),
      cadence,
      needsDedicatedLesson: !EMBEDDABLE_COMPETENCIES.has(row.competencyCode),
      embeddable: EMBEDDABLE_COMPETENCIES.has(row.competencyCode),
      homeFeasibility: HOME_FEASIBILITY[row.code] ?? "full",
    });
  };

  // 1. September, as allocated by hand above.
  const scheduled = new Set<string>();
  for (const row of objectives) {
    const byDay = SEPTEMBER[row.code];
    if (byDay === undefined) continue;
    push(row, september, 1, byDay);
    scheduled.add(row.code);
  }
  const unknown = Object.keys(SEPTEMBER).filter((code) => !scheduled.has(code));
  if (unknown.length > 0) {
    throw new Error(`SEPTEMBER lists objectives that are not "${AGE_BAND}": ${unknown.join(", ")}`);
  }

  // 2. The rest of the year: spread the remaining objectives over the days after September,
  //    keeping each domain in official order and interleaving the domains so that no phase is
  //    all mathematics or all arts.
  const remaining = objectives.filter((row) => !scheduled.has(row.code));
  const byDomain = new Map<string, ObjectiveRow[]>();
  for (const row of remaining) {
    byDomain.set(row.domainCode, [...(byDomain.get(row.domainCode) ?? []), row]);
  }
  const interleaved: ObjectiveRow[] = [];
  for (let index = 0; interleaved.length < remaining.length; index++) {
    for (const domain of DOMAINS) {
      const row = byDomain.get(domain)?.[index];
      if (row !== undefined) interleaved.push(row);
    }
  }

  const firstFreeDay = lastSeptemberDay + 1;
  const lastIntroductionDay = phases[phases.length - 1]!.fromDay - 1; // no new teaching in the last phase
  const span = lastIntroductionDay - firstFreeDay + 1;
  interleaved.forEach((row, index) => {
    const byDay = firstFreeDay + Math.floor(((index + 1) * span) / (interleaved.length + 1));
    const phase = phases.find((p) => byDay >= p.fromDay && byDay <= p.toDay);
    if (phase === undefined) throw new Error(`day ${byDay} belongs to no phase`);
    push(row, phase, Math.max(phase.fromDay, byDay - 10), byDay);
  });

  entries.sort((a, b) =>
    a.introduceByDay === b.introduceByDay
      ? a.objectiveCode.localeCompare(b.objectiveCode)
      : a.introduceByDay - b.introduceByDay,
  );

  const plan: AnnualPlan = {
    id: `${LEVEL}-${SCHOOL_YEAR}`,
    curriculumId: CURRICULUM,
    levelId: LEVEL,
    schoolYearId: SCHOOL_YEAR,
    instructionalDays,
    phases,
    entries,
  };
  const out = `content/programmes/${CURRICULUM}/${LEVEL}-annual-plan.json`;
  writeFileSync(path.join(ROOT, out), `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  console.log(
    `Wrote ${out}: ${entries.length} objectives over ${instructionalDays} instructional days, ` +
      `${entries.filter((e) => e.introduceByDay <= september.toDay).length} in period 1, ` +
      `${entries.filter((e) => e.introduceByDay <= lastSeptemberDay).length} by day ${lastSeptemberDay} (end of ${FIRST_MONTH}).`,
  );
}

main();
