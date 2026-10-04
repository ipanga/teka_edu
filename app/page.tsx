import Link from "next/link";
import { BetaBadge, BetaNote } from "@/components/BetaBadge";
import { levelAvailability } from "@/lib/programme/session-view";

export default function HomePage() {
  const levels = levelAvailability();
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-5 py-6 sm:py-10">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-bold">Teka Edu</h1>
          <BetaBadge />
        </div>
        <p className="max-w-xl text-lg text-stone-600">
          Une séance d’apprentissage par jour d’école, à faire ensemble à la maison.
        </p>
      </header>
      <section aria-labelledby="classes" className="flex flex-col gap-4">
        <h2 id="classes" className="text-xl font-semibold">
          Choisissez la classe de votre enfant
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {levels.map((level) => {
            const content = (
              <>
                <span
                  aria-hidden="true"
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl font-bold ${level.available ? "bg-emerald-100 text-emerald-900" : "bg-stone-100 text-stone-500"}`}
                >
                  {level.slug}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-xl font-semibold">{level.name}</span>
                  <span className="text-sm text-stone-600">
                    {level.available
                      ? `${level.authoredDays} séances prêtes`
                      : "Les leçons de cette classe sont en préparation."}
                  </span>
                  <span
                    className={`text-base font-semibold ${level.available ? "text-emerald-800" : "text-stone-500"}`}
                  >
                    {level.available ? "Voir les leçons" : "Bientôt"}
                  </span>
                </span>
              </>
            );
            const shared =
              "flex h-full items-center gap-3 rounded-lg border border-stone-200 bg-white p-4 sm:flex-col sm:items-start sm:p-5";
            return (
              <li key={level.levelId}>
                {level.available ? (
                  <Link
                    href={`/maternelle/${level.slug}`}
                    className={`${shared} outline-offset-4 hover:border-emerald-700 focus-visible:outline-2`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className={shared} aria-label={`${level.name} : en préparation`}>
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
      <footer className="flex flex-col gap-3 border-t border-stone-200 pt-4">
        <p className="text-base text-stone-600">C’est vous qui menez la séance, avec l’enfant.</p>
        <details>
          <summary className="min-h-11 cursor-pointer py-3 text-base font-medium text-stone-600">
            À propos de cette version d’essai
          </summary>
          <BetaNote />
        </details>
      </footer>
    </main>
  );
}
