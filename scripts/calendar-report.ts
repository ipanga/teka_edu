/**
 * Developer report of a generated school calendar (docs/SCHOOL_CALENDAR.md).
 *
 *   npm run calendar:report                 all configured school years
 *   npm run calendar:report -- 2026-2027    one school year
 *   npm run calendar:report -- 2026-2027 --days   plus every non-instructional weekday
 */
import { generateSchoolDays, summarizeSchoolDays } from "../domain/calendar/school-days";
import { getReferenceData } from "../lib/content/reference-data";

const WEEKDAYS = ["", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

const args = process.argv.slice(2);
const listDays = args.includes("--days");
const wanted = args.find((arg) => !arg.startsWith("--"));
const data = getReferenceData();
const calendars = data.calendars.filter((c) => wanted === undefined || c.schoolYear.id === wanted);
if (calendars.length === 0) {
  console.error(
    `Unknown school year "${wanted}". Configured: ${data.calendars.map((c) => c.schoolYear.id).join(", ")}`,
  );
  process.exit(1);
}

for (const calendar of calendars) {
  const days = generateSchoolDays(calendar, data.publicHolidays);
  const s = summarizeSchoolDays(days);
  const year = calendar.schoolYear;
  const rows: [string, string | number][] = [
    ["School year", `${year.label} (${year.id})`],
    ["Dates", `${s.startsOn} → ${s.endsOn}`],
    ["Source", `${year.authority}, ${year.verification}`],
    ["Total calendar dates", s.totalDates],
    ["Instructional days", s.instructionalDays],
    ["Non-instructional dates", s.nonInstructionalDays],
    ["  weekends", s.excludedByPrimaryReason.weekend],
    ["  school vacations", s.excludedByPrimaryReason["school-vacation"]],
    ["  public holidays", s.excludedByPrimaryReason["public-holiday"]],
    ["  observed (substitute) holidays", s.excludedByPrimaryReason["observed-holiday"]],
    ["  exceptional closures", s.excludedByPrimaryReason["school-closure"]],
    ["Exceptional instructional days", s.overriddenDates],
    ["First instructional day", s.firstInstructionalDate ?? "none"],
    ["Last instructional day", s.lastInstructionalDate ?? "none"],
  ];
  console.log();
  for (const [label, value] of rows) console.log(`${label.padEnd(34)} ${value}`);

  console.log("\nInstructional days per period:");
  for (const { period, instructionalDays } of s.instructionalDaysByPeriod) {
    const p = calendar.periods.find((x) => x.position === period);
    const label = p
      ? `  period ${p.position} (term ${p.term}) ${p.startsOn} → ${p.endsOn}`
      : "  outside periods";
    console.log(`${label.padEnd(50)} ${instructionalDays}`);
  }

  console.log("\nPublic holidays in the school year (primary reason counted once):");
  for (const h of s.holidays) {
    const effect = h.excludedAWeekday ? "removes a school day" : "no school that day anyway";
    console.log(`  ${h.date} ${WEEKDAYS[h.weekday]} ${h.name} — ${effect}`);
  }

  if (listDays) {
    console.log("\nNon-instructional weekdays:");
    for (const day of days.filter((d) => !d.instructional && d.reasons[0]?.code !== "weekend")) {
      const reasons = day.reasons.map((r) => (r.name ? `${r.code}: ${r.name}` : r.code)).join("; ");
      console.log(`  ${day.date} ${WEEKDAYS[day.weekday]} ${reasons}`);
    }
  }
}
