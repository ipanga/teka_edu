import { isCalendarDate } from "@/domain/calendar/date";
import { describeDate } from "@/domain/calendar/school-days";
import { getReferenceData } from "@/lib/content/reference-data";

// Read-only school-calendar facts for one date: public, non-sensitive and computed from the
// reference content shipped with this release (no database, no configuration). Used by the
// deployment smoke tests to prove the calendar ships inside the container.
//   GET /api/calendar/2026-09-15 → { instructional: true, instructionalDay: 11, … }
export async function GET(_request: Request, { params }: RouteContext<"/api/calendar/[date]">) {
  const { date } = await params;
  if (!isCalendarDate(date)) {
    return Response.json(
      { error: "Expected a calendar date in YYYY-MM-DD format." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const data = getReferenceData();
  const day = describeDate(date, data.calendars, data.publicHolidays);
  const schoolYear = data.calendars.find((c) => c.schoolYear.id === day.schoolYearId)?.schoolYear;
  return Response.json(
    {
      date: day.date,
      weekday: day.weekday,
      schoolYear: schoolYear ? { id: schoolYear.id, label: schoolYear.label } : null,
      period: day.period,
      instructional: day.instructional,
      instructionalDay: day.instructionalDay,
      reasons: day.reasons.map(({ code, name }) => ({ code, name })),
      override: day.override ? { name: day.override.name } : null,
    },
    // Immutable for a given release; each deployment has its own CDN cache.
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=86400" } },
  );
}
