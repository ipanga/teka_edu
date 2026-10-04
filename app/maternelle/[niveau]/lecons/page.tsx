import { notFound } from "next/navigation";
import { ParentNavigation } from "@/components/session/ParentNavigation";
import { MonthBrowser } from "@/components/session/MonthBrowser";
import { selectedMonth } from "@/lib/programme/navigation";
import { sessionCatalogue } from "@/lib/programme/session-catalogue";
import {
  levelAvailability,
  levelIdFromSlug,
  SCHOOL_YEAR_ID,
  todaysSession,
} from "@/lib/programme/session-view";

export default async function LessonsPage({
  params,
  searchParams,
}: PageProps<"/maternelle/[niveau]/lecons">) {
  const { niveau } = await params;
  const { mois } = await searchParams;
  const levelId = levelIdFromSlug(niveau);
  if (!levelId) notFound();
  const level = levelAvailability().find((item) => item.levelId === levelId);
  if (!level?.available) notFound();
  const months = sessionCatalogue(levelId, SCHOOL_YEAR_ID);
  const { today } = todaysSession(levelId);
  if (
    mois !== undefined &&
    (typeof mois !== "string" || !months.some((month) => month.key === mois))
  )
    notFound();
  const selected = selectedMonth(months, today, typeof mois === "string" ? mois : undefined)!;
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-5 py-6 sm:py-8">
      <header>
        <ParentNavigation levelSlug={niveau} levelName={level.name} />
        <h1 className="mt-3 text-3xl font-bold">{selected.label}</h1>
        <p className="mt-1 text-stone-600">
          {level.name} · {SCHOOL_YEAR_ID}
        </p>
      </header>
      <MonthBrowser months={months} selected={selected.key} levelSlug={niveau} today={today} />
    </main>
  );
}
