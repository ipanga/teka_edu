"use client";

import Link from "next/link";
import type { CalendarDate } from "@/domain/calendar/date";
import type { SchoolDay } from "@/domain/calendar/types";
import { formatFrenchDate } from "@/domain/calendar/date";
import { sessionStatus, type SessionMonth } from "@/lib/programme/navigation";
import { MonthLinks } from "./MonthLinks";
import { useSessionNavigation } from "./useSessionNavigation";

export function MonthBrowser({
  months,
  selected,
  levelSlug,
  today,
  calendarDays,
}: {
  months: SessionMonth[];
  selected: string;
  levelSlug: string;
  today: CalendarDate;
  calendarDays?: SchoolDay[];
}) {
  const month = months.find((item) => item.key === selected)!;
  const states = useSessionNavigation(month.sessions);
  const view = calendarDays ? "calendrier" : "lecons";
  const complete = states.filter((state) => state.progress === "completed").length;
  return (
    <>
      <MonthLinks months={months} levelSlug={levelSlug} selected={selected} view={view} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-stone-600">
          {month.sessions.length} séances · {complete} terminées
        </p>
        <Link
          className="inline-flex min-h-11 items-center font-medium text-emerald-800 underline"
          href={`/maternelle/${levelSlug}/${calendarDays ? "lecons" : "calendrier"}?mois=${selected}`}
        >
          {calendarDays ? "Liste des leçons" : "Voir le calendrier"}
        </Link>
      </div>
      <ul aria-label="Séances du mois" className="divide-y divide-stone-200">
        {(calendarDays ?? month.sessions).map((day) => {
          const index = month.sessions.findIndex((item) => item.date === day.date);
          const session = month.sessions[index];
          if (!session) {
            const reason = "reasons" in day ? day.reasons[0] : undefined;
            return (
              <li
                key={day.date}
                className="flex flex-wrap justify-between gap-2 py-3 text-sm text-stone-500"
              >
                <span>{formatFrenchDate(day.date)}</span>
                <span>
                  {reason?.code === "weekend"
                    ? "week-end"
                    : (reason?.name ?? "Pas de séance disponible")}
                </span>
              </li>
            );
          }
          const state = states[index]!;
          const status = sessionStatus(session, state, today);
          return (
            <li key={session.date}>
              <Link
                href={`/maternelle/${levelSlug}/seance/${session.instructionalDay}`}
                className="group flex min-h-24 flex-col gap-2 py-4 outline-offset-4 hover:bg-emerald-50 focus-visible:outline-2 sm:px-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="font-semibold">{session.dateLabel}</span>
                  <span
                    className={`text-sm font-semibold ${state.progress === "completed" ? "text-emerald-800" : state.progress === "in_progress" ? "text-sky-800" : "text-stone-600"}`}
                  >
                    {status}
                  </span>
                </div>
                <span className="text-sm text-stone-500">
                  séance {session.instructionalDay} · {session.totalMinutes} min
                </span>
                <span className="text-base leading-relaxed text-stone-700">
                  {session.titles.join(" · ")}
                </span>
                <span className="text-sm font-medium text-emerald-800 group-hover:underline">
                  {state.progress === "completed"
                    ? "Voir la séance terminée"
                    : state.progress === "in_progress" && state.position !== null
                      ? "Reprendre la séance"
                      : "Voir la préparation"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
