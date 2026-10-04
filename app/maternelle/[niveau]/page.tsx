import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeLink } from "@/components/session/HomeLink";
import { ClassOverview } from "@/components/session/ClassOverview";
import { sessionCatalogue } from "@/lib/programme/session-catalogue";
import {
  levelAvailability,
  levelIdFromSlug,
  SCHOOL_YEAR_ID,
  todaysSession,
} from "@/lib/programme/session-view";

export default async function LevelHomePage({ params }: PageProps<"/maternelle/[niveau]">) {
  const { niveau } = await params;
  const levelId = levelIdFromSlug(niveau);
  if (!levelId) notFound();
  const level = levelAvailability().find((candidate) => candidate.levelId === levelId);
  if (!level) notFound();
  const { today, todayLabel, reason } = todaysSession(levelId);
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-6 sm:py-8">
      <header className="flex flex-col gap-2">
        <HomeLink />
        <h1 className="text-3xl font-bold">{level.name}</h1>
        <p className="text-base text-stone-600">
          {todayLabel} · {SCHOOL_YEAR_ID}
        </p>
      </header>
      {level.available ? (
        <ClassOverview
          months={sessionCatalogue(levelId, SCHOOL_YEAR_ID)}
          levelSlug={niveau}
          today={today}
          reason={reason}
        />
      ) : (
        <>
          <p className="text-lg">Les leçons de cette classe sont en préparation.</p>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-lg font-medium text-emerald-800 underline"
          >
            Choisir une autre classe
          </Link>
        </>
      )}
    </main>
  );
}
