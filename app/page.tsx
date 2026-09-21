import Link from "next/link";
import { BetaBadge, BetaNote } from "@/components/BetaBadge";
import { levelAvailability } from "@/lib/programme/session-view";

// The front door: a parent picks the class, and nothing else competes for attention (ADR-044).
// A class with no lessons says so rather than borrowing another class's content.
export default function HomePage() {
  const levels = levelAvailability();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-5 py-10">
      <header className="flex flex-col gap-2 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <h1 className="text-4xl font-bold sm:text-5xl">Teka Edu</h1>
          <BetaBadge />
        </div>
        <p className="text-xl text-stone-600">
          Une séance d’apprentissage par jour d’école, à faire ensemble à la maison.
        </p>
        <BetaNote />
      </header>

      <section className="flex flex-col gap-4" aria-labelledby="classes">
        <h2 id="classes" className="text-center text-2xl font-semibold">
          Choisissez la classe de votre enfant
        </h2>

        <ul className="grid gap-4 sm:grid-cols-3">
          {levels.map((level, index) => {
            const card = (
              <>
                <span
                  aria-hidden="true"
                  className={`flex h-24 w-24 items-center justify-center rounded-full text-4xl font-bold ${
                    level.available
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {level.slug}
                </span>
                <span className="text-2xl font-semibold">{level.name}</span>
                <span className={level.available ? "text-stone-600" : "text-stone-500"}>
                  {level.available
                    ? `${level.authoredDays} séances prêtes`
                    : "Les leçons de cette classe sont en préparation."}
                </span>
                <span
                  className={`mt-2 rounded-2xl px-5 py-3 text-lg font-semibold ${
                    level.available
                      ? "bg-emerald-700 text-white"
                      : "border-2 border-stone-300 text-stone-500"
                  }`}
                >
                  {level.available ? "Commencer" : "Bientôt"}
                </span>
              </>
            );

            const shared =
              "teka-rise flex h-full flex-col items-center gap-3 rounded-3xl bg-white px-6 py-8 text-center shadow-sm";

            return (
              <li key={level.levelId} style={{ animationDelay: `${index * 70}ms` }}>
                {level.available ? (
                  <Link
                    href={`/maternelle/${level.slug}`}
                    className={`${shared} outline-offset-4 transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-2`}
                  >
                    {card}
                  </Link>
                ) : (
                  <div
                    className={`${shared} opacity-80`}
                    aria-label={`${level.name} : en préparation`}
                  >
                    {card}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-center text-base text-stone-500">
        Teka Edu accompagne le parent : c’est vous qui menez la séance, avec l’enfant.
      </p>
    </main>
  );
}
