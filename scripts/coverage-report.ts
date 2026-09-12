/**
 * What the year plans, and what the content actually covers so far.
 *
 *   npm run coverage:report
 *   npm run coverage:report -- --level=maternelle-3 --day=22
 *
 * Answers the question a content phase has to answer before it scales: *is the programme on
 * track to cover the curriculum, and is anything being taught once and forgotten?*
 */
import { generateSchoolDays } from "@/domain/calendar/school-days";
import { coverageUpTo } from "@/domain/programme/annual-plan";
import { generateDailyPlan } from "@/domain/programme/daily-plan";
import { getProgramme, getReferenceData } from "@/lib/content/reference-data";

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, value] = arg.replace(/^--/, "").split("=");
      return [key ?? "", value ?? "true"];
    }),
);

const levelId = args.get("level") ?? "maternelle-3";
const data = getReferenceData();
const plan = data.annualPlans.find((p) => p.levelId === levelId);
if (plan === undefined) throw new Error(`no annual plan for ${levelId}`);
const programme = getProgramme(levelId, plan.schoolYearId, data);
if (programme === undefined) throw new Error(`no programme for ${levelId}`);
const calendar = data.calendars.find((c) => c.schoolYear.id === plan.schoolYearId);
if (calendar === undefined) throw new Error(`no calendar for ${plan.schoolYearId}`);

const schoolDays = generateSchoolDays(calendar, data.publicHolidays);
const authored: number[] = [];
const taught = new Map<string, number>();
const reinvested = new Map<string, number>();
const bump = (counts: Map<string, number>, code: string) =>
  counts.set(code, (counts.get(code) ?? 0) + 1);

for (const schoolDay of schoolDays) {
  if (!schoolDay.instructional || schoolDay.instructionalDay === null) continue;
  const daily = generateDailyPlan(schoolDay, programme, data.lessons);
  if (daily.status === "no-content") continue;
  authored.push(schoolDay.instructionalDay);
  for (const session of daily.sessions) {
    for (const code of session.lesson?.objectiveCodes ?? []) bump(taught, code);
    for (const code of session.lesson?.supportingObjectiveCodes ?? []) bump(reinvested, code);
  }
}

const upTo = Number(args.get("day") ?? authored.at(-1) ?? 0);
const { rows, missing } = coverageUpTo(plan, upTo, taught, reinvested);
const pad = (value: string | number, width: number) => String(value).padStart(width);
const line = "─".repeat(92);

console.log(line);
console.log(
  `${data.levels.find((l) => l.id === levelId)?.name ?? levelId}  ·  ${plan.schoolYearId}  ·  ` +
    `${plan.instructionalDays} jours d’instruction  ·  ${plan.entries.length} objectifs planifiés`,
);
console.log(
  `Contenu écrit : ${authored.length} jours (jusqu’au jour ${authored.at(-1) ?? 0})  ·  ` +
    `couverture évaluée au jour ${upTo}`,
);
console.log(line);

console.log("\nPar période");
for (const phase of plan.phases) {
  const entries = plan.entries.filter((entry) => entry.phase === phase.code);
  const done = entries.filter((entry) => (taught.get(entry.objectiveCode) ?? 0) > 0).length;
  console.log(
    `  ${phase.code}  jours ${pad(phase.fromDay, 3)}–${pad(phase.toDay, 3)}  ` +
      `${pad(entries.length, 3)} objectifs  ${pad(done, 3)} déjà enseignés   ${phase.focus}`,
  );
}

console.log("\nPar domaine (objectifs planifiés sur l’année / enseignés à ce jour)");
const domains = [...new Set(plan.entries.map((entry) => entry.domainCode))].sort();
for (const domain of domains) {
  const entries = plan.entries.filter((entry) => entry.domainCode === domain);
  const done = entries.filter((entry) => (taught.get(entry.objectiveCode) ?? 0) > 0).length;
  console.log(`  ${domain.padEnd(12)} ${pad(entries.length, 3)} / ${pad(done, 3)}`);
}

console.log(`\nAttendu au jour ${upTo} : ${rows.length} objectifs`);
console.log(`  enseignés          ${rows.length - missing.length}`);
console.log(`  manquants          ${missing.length}`);
for (const entry of missing) {
  console.log(`    ✗ ${entry.objectiveCode} (à introduire avant le jour ${entry.introduceByDay})`);
}

const revisits = rows.map((row) => row.taught + row.reinvested);
if (revisits.length > 0) {
  const once = rows.filter((row) => row.taught + row.reinvested <= 1);
  console.log(
    `  reprises           min ${Math.min(...revisits)}  ·  max ${Math.max(...revisits)}  ·  ` +
      `moyenne ${(revisits.reduce((a, b) => a + b, 0) / revisits.length).toFixed(1)}`,
  );
  if (once.length > 0) {
    console.log(`  vus une seule fois ${once.length}`);
    for (const row of once) console.log(`    · ${row.entry.objectiveCode}`);
  }
}

const limited = plan.entries.filter((entry) => entry.homeFeasibility !== "full");
console.log(
  `\nObjectifs qu’une séance à la maison ne peut pas porter entièrement : ${limited.length}`,
);
for (const entry of limited) {
  console.log(`  ${entry.homeFeasibility.padEnd(12)} ${entry.objectiveCode}`);
}
console.log("");
