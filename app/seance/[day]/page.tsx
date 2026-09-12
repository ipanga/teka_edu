import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionRunner } from "@/components/session/SessionRunner";
import { authoredDays, sessionForDay } from "@/lib/programme/session-view";

// One instructional day's session. The day number is the instructional sequence, not the date,
// so a school closure never renumbers the programme (ADR-004).
export default async function SessionPage({ params }: PageProps<"/seance/[day]">) {
  const { day } = await params;
  if (!/^\d{1,3}$/.test(day)) notFound();
  const session = sessionForDay(Number(day));
  if (session === undefined) notFound();

  const days = authoredDays();
  const position = days.indexOf(session.instructionalDay);
  const previous = position > 0 ? days[position - 1] : undefined;
  const next = position >= 0 && position < days.length - 1 ? days[position + 1] : undefined;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex flex-col gap-1">
        <Link href="/" className="text-base font-medium text-emerald-800 underline">
          ← Retour
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{session.dateLabel}</h1>
        <p className="text-stone-600">
          {session.levelName} · séance {session.instructionalDay} · environ {session.totalMinutes}{" "}
          minutes
        </p>
      </header>

      <SessionRunner session={session} />

      <nav className="mt-4 flex justify-between gap-3 border-t border-stone-200 pt-4">
        {previous === undefined ? (
          <span />
        ) : (
          <Link
            href={`/seance/${previous}`}
            className="text-lg font-medium text-emerald-800 underline"
          >
            ← Séance précédente
          </Link>
        )}
        {next !== undefined && (
          <Link href={`/seance/${next}`} className="text-lg font-medium text-emerald-800 underline">
            Séance suivante →
          </Link>
        )}
      </nav>
    </main>
  );
}
