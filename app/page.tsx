import Link from "next/link";
import { todaysSession } from "@/lib/programme/session-view";

// The parent's entry point: what to do with the child today, and how long it takes.
// Rendered per request because "today" depends on the clock (ADR-025).
export default function HomePage() {
  const { todayLabel, isInstructional, reason, session } = todaysSession();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm font-semibold tracking-wide text-stone-500 uppercase">Teka Edu</p>
        <h1 className="mt-1 text-3xl font-bold">Aujourd’hui</h1>
        <p className="mt-1 text-xl text-stone-700">{todayLabel}</p>
      </header>

      {!isInstructional && (
        <p className="rounded-2xl bg-amber-50 px-5 py-4 text-lg">
          {reason} {session !== undefined && "Vous pouvez tout de même reprendre une séance."}
        </p>
      )}

      {session === undefined ? (
        <p className="rounded-2xl bg-white px-5 py-4 text-lg shadow-sm">
          Aucune séance n’est encore écrite pour cette période.
        </p>
      ) : (
        <section className="flex flex-col gap-4 rounded-3xl bg-white px-6 py-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold">
              {isInstructional ? "Leçon du jour" : `Séance du ${session.dateLabel}`}
            </h2>
            <p className="mt-1 text-stone-600">
              {session.levelName} · environ {session.totalMinutes} minutes
              {session.screenMinutes === 0
                ? " · sans écran"
                : ` · dont ${session.screenMinutes} min à l’écran`}
            </p>
          </div>

          <ul className="flex flex-col gap-1 text-lg">
            {session.steps.map((step) => (
              <li key={step.position}>• {step.lessonTitle}</li>
            ))}
          </ul>

          <Link
            href={`/seance/${session.instructionalDay}`}
            className="rounded-2xl bg-emerald-700 px-6 py-4 text-center text-xl font-semibold text-white hover:bg-emerald-800"
          >
            Commencer la leçon
          </Link>
        </section>
      )}

      <Link href="/calendrier" className="text-lg font-medium text-emerald-800 underline">
        Voir toutes les séances de septembre
      </Link>
    </main>
  );
}
