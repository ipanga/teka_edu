import Link from "next/link";
import { notFound } from "next/navigation";
import { ObservationForm } from "@/components/session/ObservationForm";
import { sessionForDay } from "@/lib/programme/session-view";

// What happened when a real session was run (docs/REAL_SESSION_TESTING.md). Usability only: it
// records nothing about the child, and it is not pedagogical review.
export default async function ObservationPage({ params }: PageProps<"/seance/[day]/observation">) {
  const { day } = await params;
  if (!/^\d{1,3}$/.test(day)) notFound();
  const session = sessionForDay(Number(day));
  if (session === undefined) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex flex-col gap-1">
        <Link href={`/seance/${day}`} className="text-base font-medium text-emerald-800 underline">
          ← Retour à la séance
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Comment ça s’est passé ?</h1>
        <p className="text-stone-600">
          {session.dateLabel} · séance {session.instructionalDay}
        </p>
      </header>

      <ObservationForm
        day={session.instructionalDay}
        dateLabel={session.dateLabel}
        plannedMinutes={session.totalMinutes}
      />
    </main>
  );
}
