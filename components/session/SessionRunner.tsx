"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { SessionDay } from "@/lib/programme/session-view";
import { ActivityRenderer } from "./ActivityRenderer";

/**
 * The parent runs the session from here: prepare, then one activity at a time, with a suggested
 * pause halfway and an end (ADR-039).
 *
 * Progress is kept in the browser only, per day, and is a convenience — never a record about a
 * child. Nothing is sent anywhere, and the canonical programme does not depend on it
 * (docs/PARENT_SESSION.md). Reading it can throw in a private window, so every access is guarded.
 */

type Progress = "not_started" | "in_progress" | "completed";

const storageKey = (day: number) => `teka-edu.session.${day}`;

function readProgress(day: number): Progress {
  try {
    const value = window.localStorage.getItem(storageKey(day));
    return value === "in_progress" || value === "completed" ? value : "not_started";
  } catch {
    return "not_started";
  }
}

function writeProgress(day: number, progress: Progress): void {
  try {
    window.localStorage.setItem(storageKey(day), progress);
  } catch {
    // A private window or blocked storage is not a reason to interrupt a lesson.
  }
}

function subscribeToStorage(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const ROLE_LABEL: Record<string, string> = {
  retrieval: "Révision rapide",
  consolidation: "On reprend la semaine",
};

/** What the day's four parts are called for a parent, who does not think in domain codes. */
const DOMAIN_LABEL: Record<string, string> = {
  LANG: "Langage",
  MATH: "Mathématiques",
  PHYS: "Bouger",
  ART: "Arts",
  WORLD: "Découvrir le monde",
  "TIME-SPACE": "Temps et espace",
};

export function SessionRunner({ session }: { session: SessionDay }) {
  const activities = session.steps.flatMap((step) =>
    step.activities.map((activity) => ({ ...activity, step })),
  );
  // -1 is the preparation screen; activities.length is the end.
  const [index, setIndex] = useState(-1);
  const [showGuidance, setShowGuidance] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);

  // Moving to another activity folds the guidance and the English help away again: each
  // activity starts from the French instruction alone (ADR-001).
  const goTo = useCallback((next: number) => {
    setIndex(next);
    setShowGuidance(false);
    setShowEnglish(false);
  }, []);

  useEffect(() => {
    if (index >= 0 && index < activities.length)
      writeProgress(session.instructionalDay, "in_progress");
    if (index >= activities.length) writeProgress(session.instructionalDay, "completed");
  }, [index, activities.length, session.instructionalDay]);

  if (index === -1) {
    return (
      <section className="flex flex-col gap-6" aria-labelledby="preparation">
        <div>
          <h2 id="preparation" className="text-2xl font-bold">
            À préparer
          </h2>
          <p className="mt-1 text-stone-600">
            Environ {session.totalMinutes} minutes, en une fois ou en deux.
          </p>
        </div>
        {session.materials.length === 0 ? (
          <p className="text-lg">Rien à préparer : tout se fait avec ce que vous avez.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {session.materials.map((material) => (
              <li key={material.code} className="rounded-2xl bg-white px-5 py-4 shadow-sm">
                <p className="text-lg font-medium">{material.name}</p>
                {material.alternatives !== null && (
                  <p className="mt-1 text-stone-600">À défaut : {material.alternatives}</p>
                )}
                {material.safetyNote !== null && (
                  <p className="mt-1 font-medium text-amber-800">⚠ {material.safetyNote}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => goTo(0)}
          className="rounded-2xl bg-emerald-700 px-6 py-4 text-xl font-semibold text-white shadow-sm hover:bg-emerald-800"
        >
          Commencer la leçon
        </button>
      </section>
    );
  }

  if (index >= activities.length) {
    return (
      <section className="flex flex-col items-start gap-5" aria-labelledby="fin">
        <h2 id="fin" className="text-3xl font-bold">
          C’est fini pour aujourd’hui !
        </h2>
        <p className="text-lg">
          Vous avez fait les {activities.length} activités du jour, soit {session.totalMinutes}{" "}
          minutes. Dites à l’enfant ce qu’il a réussi aujourd’hui : c’est ce qu’il retiendra.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => goTo(-1)}
            className="rounded-2xl border-2 border-stone-300 px-5 py-3 text-lg font-medium"
          >
            Revoir la séance
          </button>
          <Link
            href={`/seance/${session.instructionalDay}/observation`}
            className="rounded-2xl border-2 border-stone-300 px-5 py-3 text-lg font-medium"
          >
            Noter comment ça s’est passé
          </Link>
          <Link
            href="/calendrier"
            className="rounded-2xl bg-emerald-700 px-5 py-3 text-lg font-semibold text-white"
          >
            Voir le calendrier
          </Link>
        </div>
      </section>
    );
  }

  const activity = activities[index]!;
  const pauseHere =
    session.pauseAfterSession !== null &&
    activity.step.position === session.pauseAfterSession &&
    activity.position === activity.step.activities.length;

  return (
    <section className="flex flex-col gap-5" aria-labelledby="activite">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm font-semibold tracking-wide text-stone-500 uppercase">
            Activité {index + 1} sur {activities.length}
          </p>
          <p className="text-sm text-stone-500">{activity.minutes} min</p>
        </div>
        {/* Which of the day's four parts we are in: the parent should never lose the thread. */}
        <div className="flex items-center gap-2" aria-label="Progression de la séance">
          {session.steps.map((step) => (
            <span
              key={step.position}
              title={step.lessonTitle}
              className={`h-1.5 flex-1 rounded-full ${
                step.position < activity.step.position
                  ? "bg-emerald-600"
                  : step.position === activity.step.position
                    ? "bg-emerald-400"
                    : "bg-stone-200"
              }`}
            />
          ))}
        </div>
        <p className="text-base text-stone-600">
          <span className="font-semibold">
            {DOMAIN_LABEL[activity.step.domainCode] ?? activity.step.domainCode}
          </span>{" "}
          · {activity.step.lessonTitle}
        </p>
      </div>

      {ROLE_LABEL[activity.role] !== undefined && (
        <p className="w-fit rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-900">
          {ROLE_LABEL[activity.role]}
        </p>
      )}

      <h2 id="activite" className="text-2xl font-bold">
        {activity.title}
      </h2>

      <blockquote className="rounded-2xl bg-emerald-50 px-5 py-4 text-xl leading-relaxed">
        <span className="mb-1 block text-sm font-semibold text-emerald-900 uppercase">
          À dire à l’enfant
        </span>
        « {activity.childInstruction} »
      </blockquote>

      <ActivityRenderer activity={activity} />

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowGuidance((shown) => !shown)}
          aria-expanded={showGuidance}
          className="w-fit rounded-xl border-2 border-stone-300 px-4 py-2 text-base font-medium"
        >
          {showGuidance ? "Masquer le conseil" : "Afficher le conseil au parent"}
        </button>
        {showGuidance && (
          <p className="rounded-2xl bg-white px-5 py-4 text-lg leading-relaxed shadow-sm">
            {activity.adultGuidance}
          </p>
        )}

        {activity.englishHelp !== null && (
          <>
            <button
              type="button"
              onClick={() => setShowEnglish((shown) => !shown)}
              aria-expanded={showEnglish}
              className="w-fit rounded-xl border-2 border-stone-300 px-4 py-2 text-base font-medium"
            >
              {showEnglish ? "Masquer l’aide en anglais" : "Besoin d’aide en anglais ?"}
            </button>
            {showEnglish && (
              <p lang="en" className="rounded-2xl bg-stone-100 px-5 py-4 text-lg">
                {activity.englishHelp}
              </p>
            )}
          </>
        )}
      </div>

      {pauseHere && (
        <p className="rounded-2xl bg-amber-50 px-5 py-4 text-lg">
          Bon moment pour faire une pause : vous pouvez reprendre la suite plus tard dans la soirée.
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          className="rounded-2xl border-2 border-stone-300 px-5 py-3 text-lg font-medium"
        >
          Précédent
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          className="rounded-2xl bg-emerald-700 px-6 py-3 text-lg font-semibold text-white hover:bg-emerald-800"
        >
          {index === activities.length - 1
            ? "Terminer la séance"
            : // The app cannot see a child run, speak or draw. For those, finishing is the
              // parent's word, and the button says so rather than implying a verdict.
              activity.mode === "off-screen"
              ? "Terminé"
              : "Suivant"}
        </button>
      </div>
    </section>
  );
}

/** Shows, on the calendar, what the browser remembers about a day. */
export function ProgressBadge({ day }: { day: number }) {
  // Browser-only state: the server renders nothing, and the client fills it in on hydration.
  const progress = useSyncExternalStore(
    subscribeToStorage,
    () => readProgress(day),
    () => "not_started" as Progress,
  );
  if (progress === "not_started") return null;
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
      {progress === "completed" ? "terminée" : "commencée"}
    </span>
  );
}
