import Link from "next/link";
import { HomeLink } from "./HomeLink";

export function ParentNavigation({
  levelSlug,
  levelName,
  month,
}: {
  levelSlug: string;
  levelName: string;
  month?: { key: string; label: string };
}) {
  return (
    <nav
      aria-label="Fil d’Ariane"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base"
    >
      <HomeLink />
      <Link
        href={`/maternelle/${levelSlug}`}
        className="inline-flex min-h-11 items-center font-medium text-emerald-800 underline"
      >
        {levelName}
      </Link>
      {month && (
        <Link
          href={`/maternelle/${levelSlug}/lecons?mois=${month.key}`}
          className="inline-flex min-h-11 items-center font-medium text-emerald-800 underline"
        >
          {month.label}
        </Link>
      )}
    </nav>
  );
}
