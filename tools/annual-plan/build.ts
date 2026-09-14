/**
 * Builds a level's annual scope and sequence (ADR-040).
 *
 *   npx tsx tools/annual-plan/build.ts --level=maternelle-3
 *   npx tsx tools/annual-plan/build.ts --level=maternelle-1
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
 *  1. The year's teaching set is the objectives of the level's own age band. Earlier-band
 *     objectives are reinvested by lessons as supporting objectives; they are not scheduled,
 *     because the level is not introducing them. (1ère maternelle sits on the earliest band, so
 *     for it there is nothing earlier to reinvest: everything it touches, it introduces.)
 *  2. September is allocated **by hand**, per level, in `levels/<level>.ts`: the rentrée has to
 *     teach the things an after-school session can build on, not whatever came first in the
 *     official table.
 *
 * Everything that is a pedagogical judgement lives in `levels/`; everything here is the
 * allocation that applies those judgements the same way for every level.
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
  ObjectiveCadence,
} from "../../domain/programme/annual-plan";
import { maternelle1 } from "./levels/maternelle-1";
import { maternelle3 } from "./levels/maternelle-3";
import type { LevelPlanConfig } from "./levels/types";

const ROOT = path.resolve(import.meta.dirname, "../..");
const CURRICULUM = "maternelle-cycle1-cd-2026";
const SCHOOL_YEAR = "2026-2027";

const LEVELS: Record<string, LevelPlanConfig> = {
  "maternelle-1": maternelle1,
  "maternelle-3": maternelle3,
};

const requested = process.argv.find((arg) => arg.startsWith("--level="))?.slice("--level=".length);
if (requested === undefined || LEVELS[requested] === undefined) {
  console.error(
    `Usage: npx tsx tools/annual-plan/build.ts --level=<${Object.keys(LEVELS).join(" | ")}>`,
  );
  process.exit(1);
}
const config = LEVELS[requested]!;
const LEVEL = config.levelId;
const AGE_BAND = config.ageBand;
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
      focus: config.phaseFocus[index] ?? "Poursuite du programme.",
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
    const cadence =
      config.cadenceOverrides?.[row.code] ?? config.cadence[row.domainCode] ?? "periodic";
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
      needsDedicatedLesson: !config.embeddableCompetencies.has(row.competencyCode),
      embeddable: config.embeddableCompetencies.has(row.competencyCode),
      homeFeasibility: config.homeFeasibility[row.code] ?? "full",
    });
  };

  // 1. September, as allocated by hand above.
  const scheduled = new Set<string>();
  for (const row of objectives) {
    const byDay = config.september[row.code];
    if (byDay === undefined) continue;
    push(row, september, 1, byDay);
    scheduled.add(row.code);
  }
  const unknown = Object.keys(config.september).filter((code) => !scheduled.has(code));
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
