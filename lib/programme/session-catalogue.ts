import { formatFrenchDate } from "@/domain/calendar/date";
import { generateSchoolDays } from "@/domain/calendar/school-days";
import { generateDailyPlan } from "@/domain/programme/daily-plan";
import { getProgramme, getReferenceData, type ReferenceData } from "@/lib/content/reference-data";
import { monthLabel, type SessionMonth } from "./navigation";

/** Public navigation is a projection of complete, approved plans, never a hand-written month list. */
export function sessionCatalogue(
  levelId: string,
  schoolYearId: string,
  data: ReferenceData = getReferenceData(),
): SessionMonth[] {
  const calendar = data.calendars.find((item) => item.schoolYear.id === schoolYearId);
  const programme = getProgramme(levelId, schoolYearId, data);
  if (!calendar || !programme) return [];
  const months = new Map<string, SessionMonth>();
  for (const day of generateSchoolDays(calendar, data.publicHolidays)) {
    if (!day.instructional || day.instructionalDay === null) continue;
    const plan = generateDailyPlan(day, programme, data.lessons);
    if (
      plan.status !== "complete" ||
      plan.sessions.some((step) => step.lesson?.status !== "approved")
    )
      continue;
    const key = day.date.slice(0, 7);
    const month = months.get(key) ?? { key, label: monthLabel(key), sessions: [] };
    month.sessions.push({
      schoolYearId,
      levelId,
      instructionalDay: day.instructionalDay,
      date: day.date,
      dateLabel: formatFrenchDate(day.date),
      titles: plan.sessions.map((step) => step.lesson!.title),
      totalMinutes: plan.totalMinutes,
      activityCount: plan.sessions.reduce(
        (count, step) => count + step.lesson!.activities.length,
        0,
      ),
    });
    months.set(key, month);
  }
  return [...months.values()].sort((a, b) => a.key.localeCompare(b.key));
}
