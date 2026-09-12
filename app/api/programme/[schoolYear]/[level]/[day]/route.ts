import { type CalendarDate, isCalendarDate } from "@/domain/calendar/date";
import { describeDate, generateSchoolDays } from "@/domain/calendar/school-days";
import {
  ageBandOfLevel,
  findCompetency,
  findObjective,
  successExamplesFor,
} from "@/domain/curriculum/objectives";
import { generateDailyPlan } from "@/domain/programme/daily-plan";
import { getProgramme, getReferenceData, getSyllabus } from "@/lib/content/reference-data";

// The daily learning programme of one level, for one instructional day or one date.
//   GET /api/programme/2026-2027/maternelle-3/1            (instructional day 1)
//   GET /api/programme/2026-2027/maternelle-3/2026-09-15   (a calendar date)
//
// Everything is computed from the reference content shipped with this release: no database,
// no configuration, no clock. The same request always returns the same plan.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/programme/[schoolYear]/[level]/[day]">,
) {
  const { schoolYear, level, day } = await params;
  const noStore = { "Cache-Control": "no-store" };
  const data = getReferenceData();

  const calendar = data.calendars.find((c) => c.schoolYear.id === schoolYear);
  if (calendar === undefined) {
    return Response.json(
      { error: `Unknown school year "${schoolYear}".` },
      { status: 404, headers: noStore },
    );
  }
  const programme = getProgramme(level, schoolYear, data);
  if (programme === undefined) {
    return Response.json(
      { error: `No programme for level "${level}" in ${schoolYear}.` },
      { status: 404, headers: noStore },
    );
  }

  const schoolDays = generateSchoolDays(calendar, data.publicHolidays);
  let schoolDay;
  if (isCalendarDate(day)) {
    schoolDay = describeDate(day as CalendarDate, data.calendars, data.publicHolidays);
  } else if (/^\d{1,3}$/.test(day)) {
    schoolDay = schoolDays.find((d) => d.instructionalDay === Number(day));
    if (schoolDay === undefined) {
      return Response.json(
        { error: `School year ${schoolYear} has no instructional day ${day}.` },
        { status: 404, headers: noStore },
      );
    }
  } else {
    return Response.json(
      { error: "Expected an instructional day number or a YYYY-MM-DD date." },
      { status: 400, headers: noStore },
    );
  }

  const plan = generateDailyPlan(schoolDay, programme, data.lessons);
  const syllabus = getSyllabus(programme.curriculumId, data);
  const curriculum = data.curricula.find((c) => c.id === programme.curriculumId);
  const band = curriculum ? ageBandOfLevel(curriculum, level) : undefined;

  const objective = (code: string) => {
    const found = findObjective(syllabus, code);
    if (found === undefined) return { code, statement: null, origin: null, source: null };
    const competency = findCompetency(syllabus, found.competencyCode);
    return {
      code,
      statement: found.statement,
      // Official wording, quoted from the programme: never a Teka Edu formulation.
      origin: found.origin,
      source: found.sourceId,
      competency: competency ? { code: competency.code, title: competency.title } : null,
      // The programme lists its "exemples de réussite" per competency and age band, not per
      // objective, so they are returned under that name: they illustrate the whole competency.
      competencySuccessExamples: band
        ? successExamplesFor(syllabus, found, band.code).map((example) => example.statement)
        : [],
    };
  };

  return Response.json(
    {
      schoolYear: { id: calendar.schoolYear.id, label: calendar.schoolYear.label },
      level: { id: level, name: data.levels.find((l) => l.id === level)?.name ?? null },
      curriculum: { id: programme.curriculumId, version: curriculum?.version ?? null },
      ageBand: band ? { code: band.code, label: band.label } : null,
      date: plan.date,
      instructionalDay: plan.instructionalDay,
      rhythmDay: plan.rhythmDay,
      status: plan.status,
      reasons: plan.reasons.map(({ code, name }) => ({ code, name })),
      totalMinutes: plan.totalMinutes,
      screenMinutes: plan.screenMinutes,
      materials: plan.materialCodes.map((code) => ({
        code,
        name: data.materials.find((m) => m.code === code)?.name ?? null,
      })),
      sessions: plan.sessions.map((session) => ({
        position: session.position,
        domainCode: session.domainCode,
        trackId: session.trackId,
        trackStep: session.trackStep,
        minutes: session.minutes,
        lesson:
          session.lesson === null
            ? null
            : {
                id: session.lesson.id,
                title: session.lesson.title,
                summary: session.lesson.summary,
                stage: session.lesson.stage,
                difficulty: session.lesson.difficulty,
                themeId: session.lesson.themeId,
                parentGuidance: session.lesson.parentGuidance,
                // Lessons and activities are authored by Teka Edu, not official text.
                origin: session.lesson.origin,
                objectives: session.lesson.objectiveCodes.map(objective),
                supportingObjectives: session.lesson.supportingObjectiveCodes.map(objective),
                activities: session.lesson.activities.map((activity) => ({
                  id: activity.id,
                  position: activity.position,
                  type: activity.type,
                  title: activity.title,
                  childInstruction: activity.childInstruction,
                  adultGuidance: activity.adultGuidance,
                  minutes: activity.minutes,
                  mode: activity.mode,
                  objectiveCodes: activity.objectiveCodes,
                  materialCodes: activity.materialCodes,
                  vocabulary: activity.vocabulary,
                  scaffolds: activity.scaffolds,
                  payload: activity.payload,
                })),
              },
      })),
    },
    // Immutable for a given release; each deployment has its own CDN cache.
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=86400" } },
  );
}
