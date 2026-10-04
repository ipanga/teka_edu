"use client";

import Link from "next/link";
import type { CalendarDate } from "@/domain/calendar/date";
import { recommendedSession, type SessionMonth } from "@/lib/programme/navigation";
import { useSessionNavigation } from "./useSessionNavigation";
import { MonthLinks } from "./MonthLinks";

export function ClassOverview({
  months,
  levelSlug,
  today,
  reason,
}: {
  months: SessionMonth[];
  levelSlug: string;
  today: CalendarDate;
  reason: string | null;
}) {
  const sessions = months.flatMap((month) => month.sessions);
  const states = useSessionNavigation(sessions);
  const suggestion = recommendedSession(sessions, states, today);
  const complete = states.filter((state) => state.progress === "completed").length;
  return (
    <>
      <section
        aria-labelledby="maintenant"
        className="flex flex-col gap-3 border-l-4 border-emerald-600 pl-4 sm:pl-6"
      >
        {suggestion ? (
          <>
            <p className="text-sm font-semibold text-emerald-800">
              {suggestion.kind === "resume"
                ? "Séance en cours"
                : suggestion.kind === "today"
                  ? "Aujourd’hui"
                  : suggestion.kind === "catch-up"
                    ? "À rattraper"
                    : "Prochaine séance disponible"}
            </p>
            <h2 id="maintenant" className="text-2xl font-bold">
              {suggestion.kind === "today"
                ? "Leçon du jour"
                : `Séance du ${suggestion.session.dateLabel}`}
            </h2>
            <p className="text-stone-600">environ {suggestion.session.totalMinutes} minutes</p>
            <Link
              data-testid="recommended-session"
              href={`/maternelle/${levelSlug}/seance/${suggestion.session.instructionalDay}`}
              className="w-fit rounded-lg bg-emerald-700 px-5 py-3 text-center text-lg font-semibold text-white hover:bg-emerald-800"
            >
              {suggestion.kind === "resume" ? "Reprendre la séance" : "Voir la préparation"}
            </Link>
            <p className="text-base leading-relaxed text-stone-600">
              {suggestion.session.titles.join(" · ")}
            </p>
          </>
        ) : (
          <>
            <h2 id="maintenant" className="text-2xl font-bold">
              Toutes les séances sont terminées
            </h2>
            <p>Vous pouvez choisir une séance à refaire dans les leçons.</p>
          </>
        )}
        {reason && <p className="text-sm text-stone-600">{reason}</p>}
      </section>
      <section aria-labelledby="mois" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="mois" className="text-xl font-bold">
            Les leçons
          </h2>
          <p className="text-sm text-stone-600">
            {complete} / {sessions.length} séances terminées
          </p>
        </div>
        <MonthLinks months={months} levelSlug={levelSlug} />
        <Link
          href={`/maternelle/${levelSlug}/lecons`}
          className="inline-flex min-h-11 w-fit items-center font-semibold text-emerald-800 underline"
        >
          Voir toutes les leçons
        </Link>
      </section>
    </>
  );
}
