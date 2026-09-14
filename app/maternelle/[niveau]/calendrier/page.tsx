import Link from "next/link";
import { notFound } from "next/navigation";
import { formatFrenchDate } from "@/domain/calendar/date";
import { HomeLink } from "@/components/session/HomeLink";
import { ProgressBadge } from "@/components/session/SessionRunner";
import {
  authoredDays,
  levelAvailability,
  levelIdFromSlug,
  schoolDays,
} from "@/lib/programme/session-view";

// September, day by day, so a parent can catch up on a session they missed. School days without
// content, weekends and holidays are shown for what they are rather than hidden.
export default async function CalendarPage({
  params,
}: PageProps<"/maternelle/[niveau]/calendrier">) {
  const { niveau } = await params;
  const levelId = levelIdFromSlug(niveau);
  if (levelId === undefined) notFound();
  const level = levelAvailability().find((candidate) => candidate.levelId === levelId);
  if (level === undefined || !level.available) notFound();

  const authored = new Set(authoredDays(levelId));
  const days = schoolDays().filter((day) => day.date.startsWith("2026-09"));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <HomeLink />
          <Link
            href={`/maternelle/${niveau}`}
            className="text-base font-medium text-emerald-800 underline"
          >
            {level.name}
          </Link>
        </div>
        <h1 className="mt-2 text-3xl font-bold">Septembre 2026</h1>
        <p className="mt-1 text-stone-600">
          {authored.size} séances. Vous pouvez ouvrir une séance précédente pour rattraper.
        </p>
      </header>

      <ul className="flex flex-col gap-2">
        {days.map((day) => {
          const hasSession = day.instructionalDay !== null && authored.has(day.instructionalDay);
          const reason = day.reasons[0];
          return (
            <li key={day.date}>
              {hasSession ? (
                <Link
                  href={`/maternelle/${niveau}/seance/${day.instructionalDay}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm transition hover:bg-emerald-50"
                >
                  <span className="text-lg">{formatFrenchDate(day.date)}</span>
                  <span className="flex items-center gap-2">
                    <ProgressBadge day={day.instructionalDay ?? 0} />
                    <span className="text-sm text-stone-500">séance {day.instructionalDay}</span>
                  </span>
                </Link>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-2xl px-5 py-3 text-stone-500">
                  <span>{formatFrenchDate(day.date)}</span>
                  <span className="text-sm">
                    {reason?.code === "weekend"
                      ? "week-end"
                      : (reason?.name ?? "pas de séance écrite")}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
