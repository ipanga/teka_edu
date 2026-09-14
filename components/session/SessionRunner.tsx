"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { SessionDay } from "@/lib/programme/session-view";
import { ActivityRenderer } from "./ActivityRenderer";

/**
 * The parent runs the session from here: prepare, then one activity at a time, with a break when
 * the child needs one and an end (ADR-039, ADR-043).
 *
 * The screen has two zones, and they look different on purpose:
 *
 *  - **La part de l'enfant** — the sentence to read aloud, the picture, the thing to tap. Large,
 *    plain, and expandable to fill the phone with « Montrer à l'enfant ».
 *  - **Pour vous** — the guidance, the optional English, the controls. Quieter, and folded away
 *    until the parent asks.
 *
 * Progress is kept in the browser only, per day, and is a convenience — never a record about a
 * child. Nothing is sent anywhere (docs/PARENT_SESSION.md). Reading it can throw in a private
 * window, so every access is guarded.
 */

type Progress = "not_started" | "in_progress" | "completed";

const progressKey = (day: number) => `teka-edu.session.${day}`;
const positionKey = (day: number) => `teka-edu.session.${day}.position`;

function readProgress(day: number): Progress {
  try {
    const value = window.localStorage.getItem(progressKey(day));
    return value === "in_progress" || value === "completed" ? value : "not_started";
  } catch {
    return "not_started";
  }
}

function writeProgress(day: number, progress: Progress): void {
  try {
    window.localStorage.setItem(progressKey(day), progress);
  } catch {
    // A private window or blocked storage is not a reason to interrupt a lesson.
  }
}

/** Where the session had got to, so a refresh or a phone call does not send you back to the start. */
function readPosition(day: number): number | null {
  try {
    const raw = window.localStorage.getItem(positionKey(day));
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isInteger(value) ? value : null;
  } catch {
    return null;
  }
}

function writePosition(day: number, index: number): void {
  try {
    window.localStorage.setItem(positionKey(day), String(index));
  } catch {
    // Same: losing the bookmark must never interrupt the session.
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

export function SessionRunner({ session, levelSlug }: { session: SessionDay; levelSlug: string }) {
  const activities = session.steps.flatMap((step) =>
    step.activities.map((activity) => ({ ...activity, step })),
  );
  // -1 is the preparation screen; activities.length is the end.
  const [index, setIndex] = useState(-1);
  const [showGuidance, setShowGuidance] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [childView, setChildView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [dismissedResume, setDismissedResume] = useState(false);

  // Where the browser remembers we were. Read through the store rather than in an effect: the
  // server renders nothing and the client fills it in on hydration.
  const savedPosition = useSyncExternalStore(
    subscribeToStorage,
    () => readPosition(session.instructionalDay),
    () => null,
  );
  // Offer to pick the session up where it stopped, rather than deciding for the parent.
  const resumable =
    !dismissedResume &&
    savedPosition !== null &&
    savedPosition > 0 &&
    savedPosition < activities.length
      ? savedPosition
      : null;

  const goTo = useCallback(
    (next: number) => {
      setIndex(next);
      setShowGuidance(false);
      setShowEnglish(false);
      setChildView(false);
      setDismissedResume(true);
      writePosition(session.instructionalDay, next);
    },
    [session.instructionalDay],
  );

  useEffect(() => {
    if (index >= 0 && index < activities.length) {
      writeProgress(session.instructionalDay, "in_progress");
    }
    if (index >= activities.length) writeProgress(session.instructionalDay, "completed");
  }, [index, activities.length, session.instructionalDay]);

  // ---- preparation ---------------------------------------------------------------------------
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
          <>
            {/* The short list first: a parent wants to know what to fetch, not to read a page. */}
            <ul className="flex flex-col gap-2">
              {session.materials.map((material) => (
                <li key={material.code} className="flex items-start gap-3 text-lg">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-600"
                  />
                  <span>
                    {material.name}
                    {material.safetyNote !== null && (
                      <span className="ml-2 font-medium text-amber-800">⚠</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setShowDetails((shown) => !shown)}
              aria-expanded={showDetails}
              className="w-fit rounded-xl border-2 border-stone-300 px-4 py-2 text-base font-medium"
            >
              {showDetails
                ? "Masquer les remplacements"
                : "Je n’ai pas tout : que puis-je utiliser ?"}
            </button>
            {showDetails && (
              <ul className="flex flex-col gap-3">
                {session.materials.map((material) => (
                  <li key={material.code} className="rounded-2xl bg-white px-5 py-4 shadow-sm">
                    <p className="font-medium">{material.name}</p>
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
          </>
        )}

        <button
          type="button"
          onClick={() => goTo(0)}
          className="rounded-2xl bg-emerald-700 px-6 py-4 text-xl font-semibold text-white shadow-sm hover:bg-emerald-800"
        >
          Commencer la leçon
        </button>

        {resumable !== null && (
          <button
            type="button"
            onClick={() => goTo(resumable)}
            className="rounded-2xl border-2 border-emerald-700 px-6 py-3 text-lg font-medium text-emerald-800"
          >
            Reprendre où nous nous étions arrêtés (activité {resumable + 1})
          </button>
        )}
      </section>
    );
  }

  // ---- stopped early -------------------------------------------------------------------------
  if (stopped) {
    return (
      <section className="flex flex-col items-start gap-5" aria-labelledby="arret">
        <h2 id="arret" className="text-3xl font-bold">
          On s’arrête là pour aujourd’hui.
        </h2>
        <p className="text-lg">
          C’est très bien ainsi : {index} activité{index > 1 ? "s" : ""} de faite
          {index > 1 ? "s" : ""}. Un enfant fatigué n’apprend plus, et la séance vous attendra.
          Dites-lui ce qu’il a réussi aujourd’hui.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setStopped(false)}
            className="rounded-2xl border-2 border-stone-300 px-5 py-3 text-lg font-medium"
          >
            Finalement, on continue
          </button>
          <Link
            href={`/maternelle/${levelSlug}/seance/${session.instructionalDay}/observation`}
            className="rounded-2xl bg-emerald-700 px-5 py-3 text-lg font-semibold text-white"
          >
            Noter comment ça s’est passé
          </Link>
        </div>
      </section>
    );
  }

  // ---- finished ------------------------------------------------------------------------------
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
            href={`/maternelle/${levelSlug}/seance/${session.instructionalDay}/observation`}
            className="rounded-2xl border-2 border-stone-300 px-5 py-3 text-lg font-medium"
          >
            Noter comment ça s’est passé
          </Link>
          <Link
            href={`/maternelle/${levelSlug}/calendrier`}
            className="rounded-2xl bg-emerald-700 px-5 py-3 text-lg font-semibold text-white"
          >
            Voir le calendrier
          </Link>
        </div>
      </section>
    );
  }

  const activity = activities[index]!;
  const atPausePoint =
    session.pauseAfterSession !== null &&
    activity.step.position === session.pauseAfterSession &&
    activity.position === activity.step.activities.length;

  // ---- a break -------------------------------------------------------------------------------
  if (paused) {
    return (
      <section className="flex flex-col items-start gap-5" aria-labelledby="pause">
        <h2 id="pause" className="text-3xl font-bold">
          Petite pause.
        </h2>
        <p className="text-lg">
          Buvez un peu d’eau, bougez, respirez. Vous reprendrez à l’activité {index + 1} quand
          l’enfant sera prêt — dans cinq minutes ou ce soir.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setPaused(false)}
            className="rounded-2xl bg-emerald-700 px-6 py-3 text-lg font-semibold text-white"
          >
            Continuer
          </button>
          <button
            type="button"
            onClick={() => {
              setPaused(false);
              setStopped(true);
            }}
            className="rounded-2xl border-2 border-stone-300 px-5 py-3 text-lg font-medium"
          >
            Terminer pour aujourd’hui
          </button>
        </div>
      </section>
    );
  }

  // ---- the child's screen ---------------------------------------------------------------------
  // A modal dialog, so the browser makes the rest of the page inert: the parent's navigation in
  // the page header is genuinely out of reach rather than merely covered. Nothing the parent
  // reads is rendered at all while it is open.
  if (childView) {
    return <ChildScreen open onClose={() => setChildView(false)} activity={activity} />;
  }

  // ---- the normal, two-zone screen -----------------------------------------------------------
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

      {/* ---- the child's part ---------------------------------------------------------------- */}
      <div className="teka-rise flex flex-col gap-4 rounded-3xl bg-white px-5 py-5 shadow-sm">
        <p className="text-sm font-semibold tracking-wide text-emerald-800 uppercase">
          La part de l’enfant
        </p>
        <blockquote className="text-xl leading-relaxed">« {activity.childInstruction} »</blockquote>
        <ActivityRenderer activity={activity} />
        <button
          type="button"
          onClick={() => setChildView(true)}
          className="w-fit rounded-xl border-2 border-emerald-700 px-4 py-2 text-base font-medium text-emerald-800"
        >
          Montrer à l’enfant
        </button>
      </div>

      {/* ---- the parent's part --------------------------------------------------------------- */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold tracking-wide text-stone-500 uppercase">Pour vous</p>
        <button
          type="button"
          onClick={() => setShowGuidance((shown) => !shown)}
          aria-expanded={showGuidance}
          className="w-fit rounded-xl border-2 border-stone-300 px-4 py-2 text-base font-medium"
        >
          {showGuidance ? "Masquer le conseil" : "Afficher le conseil au parent"}
        </button>
        {showGuidance && (
          <div className="flex flex-col gap-3">
            <p className="rounded-2xl bg-stone-100 px-5 py-4 text-lg leading-relaxed">
              {activity.adultGuidance}
            </p>
            {typeof activity.payload["extension"] === "string" && (
              <p className="rounded-2xl border-2 border-dashed border-stone-300 px-5 py-4 text-base leading-relaxed">
                <strong className="font-semibold">Si l’enfant en redemande :</strong>{" "}
                {activity.payload["extension"]}{" "}
                <span className="text-stone-600">
                  Ce n’est pas attendu ce mois-ci — n’insistez pas.
                </span>
              </p>
            )}
          </div>
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

      {atPausePoint && (
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

      {/* Stopping early is a normal thing to do with a tired five-year-old, not a failure. */}
      <div className="flex flex-wrap gap-3 border-t border-stone-200 pt-4">
        <button
          type="button"
          onClick={() => setPaused(true)}
          className="rounded-xl border-2 border-stone-300 px-4 py-2 text-base font-medium"
        >
          Faire une petite pause
        </button>
        <button
          type="button"
          onClick={() => setStopped(true)}
          className="rounded-xl border-2 border-stone-300 px-4 py-2 text-base font-medium"
        >
          Terminer pour aujourd’hui
        </button>
      </div>
    </section>
  );
}

/**
 * The child's surface, filling the device. No guidance, no English, no home control: the only way
 * out is one small deliberate button, because a mis-tap must not end a five-year-old's activity.
 */
function ChildScreen({
  open,
  onClose,
  activity,
}: {
  open: boolean;
  onClose: () => void;
  activity: SessionDay["steps"][number]["activities"][number];
}) {
  const dialog = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element === null) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-label="Écran de l’enfant"
      onCancel={(event) => {
        // Escape belongs to the parent, not to a child leaning on the keyboard.
        event.preventDefault();
      }}
      className="teka-rise h-full max-h-none w-full max-w-none bg-[var(--background)] p-0 backdrop:bg-stone-900/40"
    >
      <div className="flex h-full flex-col gap-6 overflow-y-auto px-5 py-6">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6">
          <p className="text-center text-2xl leading-relaxed font-semibold sm:text-3xl lg:text-4xl">
            « {activity.childInstruction} »
          </p>
          <div className="flex-1">{open && <ActivityRenderer activity={activity} />}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mx-auto rounded-xl border-2 border-stone-300 px-5 py-2 text-sm font-medium text-stone-500"
        >
          Revenir au guide du parent
        </button>
      </div>
    </dialog>
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
