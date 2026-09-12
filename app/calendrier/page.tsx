import Link from "next/link";
import { formatFrenchDate } from "@/domain/calendar/date";
import { ProgressBadge } from "@/components/session/SessionRunner";
import { authoredDays, schoolDays } from "@/lib/programme/session-view";

// September, day by day, so a parent can catch up on a session they missed. School days without
// content, weekends and holidays are shown for what they are rather than hidden.
export default function CalendarPage() {
  const authored = new Set(authoredDays());
  const days = schoolDays().filter((day) => day.date.startsWith("2026-09"));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <header>
        <Link href="/" className="text-base font-medium text-emerald-800 underline">
          ← Retour
        </Link>
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
                  href={`/seance/${day.instructionalDay}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm hover:bg-emerald-50"
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
