import Link from "next/link";
import { notFound } from "next/navigation";
import { ObservationForm } from "@/components/session/ObservationForm";
import { ParentNavigation } from "@/components/session/ParentNavigation";
import { monthLabel } from "@/lib/programme/navigation";
import { levelIdFromSlug, sessionForDay } from "@/lib/programme/session-view";

// What happened when a real session was run (docs/REAL_SESSION_TESTING.md). Usability only: it
// records nothing about the child, and it is not pedagogical review.
export default async function ObservationPage({
  params,
}: PageProps<"/maternelle/[niveau]/seance/[day]/observation">) {
  const { niveau, day } = await params;
  const levelId = levelIdFromSlug(niveau);
  if (levelId === undefined || !/^\d{1,3}$/.test(day)) notFound();
  const session = sessionForDay(levelId, Number(day));
  if (session === undefined) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex flex-col gap-1">
        <ParentNavigation
          levelSlug={niveau}
          levelName={session.levelName}
          month={{ key: session.date.slice(0, 7), label: monthLabel(session.date.slice(0, 7)) }}
        />
        <Link
          href={`/maternelle/${niveau}/seance/${day}`}
          className="text-base font-medium text-emerald-800 underline"
        >
          ← Retour à la séance
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Comment ça s’est passé ?</h1>
        <p className="text-stone-600">
          {session.levelName} · {session.dateLabel} · séance {session.instructionalDay}
        </p>
      </header>

      <ObservationForm
        identity={session}
        dateLabel={session.dateLabel}
        plannedMinutes={session.totalMinutes}
      />
    </main>
  );
}
