import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeLink } from "@/components/session/HomeLink";
import { levelAvailability, levelIdFromSlug, todaysSession } from "@/lib/programme/session-view";

// A class's own front page: today's date, whether it is a school day, and the session to run.
export default async function LevelHomePage({ params }: PageProps<"/maternelle/[niveau]">) {
  const { niveau } = await params;
  const levelId = levelIdFromSlug(niveau);
  if (levelId === undefined) notFound();

  const level = levelAvailability().find((candidate) => candidate.levelId === levelId);
  if (level === undefined) notFound();

  // A class with no lessons says so. It never shows another class's work.
  if (!level.available) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-10">
        <HomeLink />
        <h1 className="text-3xl font-bold">{level.name}</h1>
        <p className="rounded-2xl bg-white px-6 py-6 text-lg shadow-sm">
          Les leçons de cette classe sont en préparation. Elles arriveront après celles de 3ème
          maternelle.
        </p>
        <Link href="/" className="text-lg font-medium text-emerald-800 underline">
          Choisir une autre classe
        </Link>
      </main>
    );
  }

  const { todayLabel, isInstructional, reason, session } = todaysSession(levelId);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-8">
      <header className="flex flex-col gap-2">
        <HomeLink />
        <p className="text-sm font-semibold tracking-wide text-stone-500 uppercase">{level.name}</p>
        <h1 className="text-3xl font-bold">Aujourd’hui</h1>
        <p className="text-xl text-stone-700">{todayLabel}</p>
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
        <section className="teka-rise flex flex-col gap-4 rounded-3xl bg-white px-6 py-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold">
              {isInstructional ? "Leçon du jour" : `Séance du ${session.dateLabel}`}
            </h2>
            <p className="mt-1 text-stone-600">
              environ {session.totalMinutes} minutes
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
            href={`/maternelle/${niveau}/seance/${session.instructionalDay}`}
            className="rounded-2xl bg-emerald-700 px-6 py-4 text-center text-xl font-semibold text-white transition hover:bg-emerald-800"
          >
            Commencer la leçon
          </Link>
        </section>
      )}

      <Link
        href={`/maternelle/${niveau}/calendrier`}
        className="text-lg font-medium text-emerald-800 underline"
      >
        Voir toutes les séances de septembre
      </Link>
    </main>
  );
}
