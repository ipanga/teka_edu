/**
 * Developer report of a generated daily programme (docs/DAILY_PROGRAMME.md).
 *
 *   npm run programme:report -- --level=maternelle-3 --day=1
 *   npm run programme:report -- --level=maternelle-3 --day=1 --to=5      (a range of days)
 *   npm run programme:report -- --level=maternelle-3 --date=2026-09-15
 *   npm run programme:report -- --level=maternelle-3 --day=1 --year=2026-2027
 */
import { isCalendarDate } from "../domain/calendar/date";
import { describeDate, generateSchoolDays } from "../domain/calendar/school-days";
import { ageBandOfLevel, findObjective, successExamplesFor } from "../domain/curriculum/objectives";
import { generateDailyPlan } from "../domain/programme/daily-plan";
import type { DailyPlan } from "../domain/programme/types";
import { getProgramme, getReferenceData, getSyllabus } from "../lib/content/reference-data";

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, value] = arg.replace(/^--/, "").split("=");
      return [key ?? "", value ?? "true"];
    }),
);

const data = getReferenceData();
const levelId = args.get("level") ?? "maternelle-3";
const schoolYearId = args.get("year") ?? data.calendars[0]?.schoolYear.id ?? "";
const calendar = data.calendars.find((c) => c.schoolYear.id === schoolYearId);
if (calendar === undefined) {
  console.error(`Unknown school year "${schoolYearId}".`);
  process.exit(1);
}
const found = getProgramme(levelId, schoolYearId, data);
if (found === undefined) {
  console.error(
    `No programme for level "${levelId}" in ${schoolYearId}. Configured: ${data.programmes
      .map((p) => p.levelId)
      .join(", ")}`,
  );
  process.exit(1);
}
const programme = found;
const curriculum = data.curricula.find((c) => c.id === programme.curriculumId);
const syllabus = getSyllabus(programme.curriculumId, data);
const schoolDays = generateSchoolDays(calendar, data.publicHolidays);
const level = data.levels.find((l) => l.id === levelId);
const band = curriculum ? ageBandOfLevel(curriculum, levelId) : undefined;

function planFor(day: number): DailyPlan {
  const schoolDay = schoolDays.find((d) => d.instructionalDay === day);
  if (schoolDay === undefined) {
    console.error(`Instructional day ${day} does not exist in ${schoolYearId}.`);
    process.exit(1);
  }
  return generateDailyPlan(schoolDay, programme, data.lessons);
}

function print(plan: DailyPlan) {
  console.log("─".repeat(92));
  console.log(
    `${plan.date}  ·  jour d’instruction ${plan.instructionalDay ?? "—"}/${schoolDays.filter((d) => d.instructional).length}` +
      `  ·  jour ${plan.rhythmDay ?? "—"} du rythme  ·  ${plan.status}`,
  );
  console.log(
    `${level?.name ?? plan.levelId} (${plan.levelId})  ·  ${curriculum?.name ?? plan.curriculumId}` +
      `  ·  tranche d’âge : ${band?.label ?? "—"}`,
  );
  if (plan.status === "not-instructional") {
    console.log(`Pas de programme : ${plan.reasons.map((r) => r.name ?? r.code).join(", ")}`);
    return;
  }
  console.log(
    `Durée totale ${plan.totalMinutes} min (écran ${plan.screenMinutes} min)  ·  matériel : ${plan.materialCodes
      .map((code) => data.materials.find((m) => m.code === code)?.name ?? code)
      .join(", ")}`,
  );
  for (const session of plan.sessions) {
    const lesson = session.lesson;
    console.log();
    if (lesson === null) {
      console.log(`  ${session.position}. [${session.domainCode}] (contenu à écrire)`);
      continue;
    }
    console.log(
      `  ${session.position}. [${session.domainCode}] ${lesson.title} — ${session.minutes} min` +
        `  (${lesson.stage}, étape ${session.trackStep} de la progression « ${session.trackId} »)`,
    );
    for (const code of lesson.objectiveCodes) {
      const objective = findObjective(syllabus, code);
      console.log(`       objectif  ${code} — ${objective?.statement.split("\n")[0] ?? "?"}`);
    }
    for (const code of lesson.supportingObjectiveCodes) {
      const objective = findObjective(syllabus, code);
      console.log(`       repris    ${code} — ${objective?.statement.split("\n")[0] ?? "?"}`);
    }
    for (const activity of lesson.activities) {
      const scaffold = activity.scaffolds.find((s) => s.language === "en");
      console.log(
        `       · ${activity.type} (${activity.minutes} min, ${activity.mode}) « ${activity.childInstruction} »`,
      );
      if (activity.vocabulary.length > 0) {
        console.log(
          `         lexique : ${activity.vocabulary.map((v) => (v.en ? `${v.fr} [${v.en}]` : v.fr)).join(", ")}`,
        );
      }
      if (scaffold) console.log(`         anglais : « ${scaffold.childInstruction} »`);
    }
  }
  // Observable evidence for the first objective of the day, as the official text words it.
  const first = plan.sessions.find((s) => s.lesson !== null)?.lesson?.objectiveCodes[0];
  const objective = first === undefined ? undefined : findObjective(syllabus, first);
  if (objective && band) {
    const examples = successExamplesFor(syllabus, objective, band.code).slice(0, 2);
    if (examples.length > 0) {
      console.log(`\n  Réussites attendues (texte officiel) pour ${objective.code} :`);
      for (const example of examples) console.log(`       – ${example.statement.split("\n")[0]}`);
    }
  }
}

const dateArg = args.get("date");
if (dateArg !== undefined) {
  if (!isCalendarDate(dateArg)) {
    console.error(`"${dateArg}" is not a YYYY-MM-DD date.`);
    process.exit(1);
  }
  print(
    generateDailyPlan(
      describeDate(dateArg, data.calendars, data.publicHolidays),
      programme,
      data.lessons,
    ),
  );
} else {
  const from = Number(args.get("day") ?? 1);
  const to = Number(args.get("to") ?? from);
  if (!Number.isInteger(from) || from < 1 || !Number.isInteger(to) || to < from) {
    console.error("--day must be a positive integer and --to must be at least --day.");
    process.exit(1);
  }
  for (let day = from; day <= to; day++) print(planFor(day));
}
