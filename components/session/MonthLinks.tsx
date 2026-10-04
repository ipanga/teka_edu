import Link from "next/link";
import type { SessionMonth } from "@/lib/programme/navigation";

export function MonthLinks({
  months,
  levelSlug,
  selected,
  view = "lecons",
}: {
  months: readonly SessionMonth[];
  levelSlug: string;
  selected?: string;
  view?: "lecons" | "calendrier";
}) {
  return (
    <nav
      aria-label="Mois disponibles"
      className="flex flex-wrap gap-x-5 gap-y-1 border-b border-stone-200"
    >
      {months.map((month) => (
        <Link
          key={month.key}
          href={`/maternelle/${levelSlug}/${view}?mois=${month.key}`}
          aria-current={month.key === selected ? "page" : undefined}
          className={`inline-flex min-h-12 items-center border-b-2 py-2 font-semibold ${month.key === selected ? "border-emerald-700 text-emerald-900" : "border-transparent text-stone-600 hover:text-emerald-800"}`}
        >
          {month.label}
        </Link>
      ))}
    </nav>
  );
}
