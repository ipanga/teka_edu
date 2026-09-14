"use client";

import { useRef, useState } from "react";
import type { RendererFamily } from "@/domain/lessons/renderers";
import type { SessionActivity, SessionMedia, SessionText } from "@/lib/programme/session-view";

/**
 * One component per renderer family, not one per activity kind (ADR-036): fifteen kinds share ten
 * interactions. Only the families September uses are implemented; the rest arrive with the content
 * that needs them.
 *
 * Two rules shape everything here (ADR-039, ADR-042):
 *
 *  - **If the child is asked to look at something, it is on the screen.** A lesson that says
 *    « Regarde les formes » shows the shapes.
 *  - **If the child is asked to move, speak or handle something, the screen gets out of the way**
 *    and says so. An off-screen activity is not a smaller on-screen one.
 *
 * Interaction exists only where tapping genuinely teaches: choosing the named shape, showing a
 * quantity, pairing, sorting. Nothing here scores a child; a wrong tap invites another try.
 */

// ---- shared pieces ---------------------------------------------------------------------------

function Picture({ media, size = "md" }: { media: SessionMedia; size?: "sm" | "md" | "lg" }) {
  const px = size === "lg" ? 192 : size === "md" ? 128 : 72;
  // Grows with the screen: the same picture should be readable on a phone and across a room.
  const width =
    size === "lg" ? "max-w-48 sm:max-w-64" : size === "md" ? "max-w-32 sm:max-w-40" : "max-w-20";
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG from public/, no optimisation needed
    <img
      src={media.url}
      alt={media.alt}
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      className={`h-auto w-full ${width}`}
    />
  );
}

function Prompt({ children }: { children: React.ReactNode }) {
  return <p className="text-lg font-medium text-stone-700">{children}</p>;
}

/** Encouragement, never a verdict on the child. */
function Feedback({ state, hint }: { state: "idle" | "retry" | "done"; hint: string | null }) {
  if (state === "idle") return null;
  if (state === "done") {
    return (
      <p
        role="status"
        className="teka-pop rounded-2xl bg-emerald-100 px-5 py-3 text-lg font-semibold"
      >
        Bravo !
      </p>
    );
  }
  return (
    <p role="status" className="teka-nudge rounded-2xl bg-amber-50 px-5 py-3 text-lg">
      {hint ?? "Essaie encore. Regarde bien."}
    </p>
  );
}

/**
 * Says, plainly, that this activity happens away from the screen. When there is nothing to put
 * inside it, it is a single line rather than an empty dashed box: an empty frame looks broken,
 * and a parent should not wonder whether something failed to load.
 */
function OffScreen({ children }: { children?: React.ReactNode }) {
  const label = (
    <p className="text-sm font-semibold tracking-wide text-stone-500 uppercase">
      Posez l’écran : cette activité se fait sans lui
    </p>
  );
  if (children === null || children === undefined || children === false) return label;
  return (
    <div className="rounded-2xl border-2 border-dashed border-stone-300 px-5 py-4">
      <div className="mb-2">{label}</div>
      {children}
    </div>
  );
}

const asStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const list = (items: readonly string[]) => (
  <ul className="flex flex-col gap-2">
    {items.map((item) => (
      <li key={item} className="rounded-xl bg-white/70 px-4 py-3 text-lg shadow-sm">
        {item}
      </li>
    ))}
  </ul>
);

/** The word a picture is for: the first tag a lesson would use, e.g. "carré". */
const labelOf = (media: SessionMedia) => media.tags[0] ?? media.alt;

// ---- interactions ----------------------------------------------------------------------------

/**
 * "Montre le carré." The child taps the named picture. Three tries at most before the answer is
 * shown and the parent is asked to name it together — a five-year-old must not be left stuck.
 */
function ChooseOne({
  media,
  labels,
}: {
  media: readonly SessionMedia[];
  /** What to call each picture, when the lesson's own word is better than the asset's tag. */
  labels?: readonly string[];
}) {
  const [target, setTarget] = useState(0);
  const [tries, setTries] = useState(0);
  const [state, setState] = useState<"idle" | "retry" | "done">("idle");
  const [revealed, setRevealed] = useState(false);
  const wanted = media[target]!;
  const nameOf = (item: SessionMedia) => {
    const at = media.indexOf(item);
    return labels?.[at] ?? labelOf(item);
  };

  const choose = (chosen: SessionMedia) => {
    if (state === "done") return;
    if (chosen.id === wanted.id) {
      setState("done");
      return;
    }
    setTries((n) => n + 1);
    setState("retry");
    if (tries + 1 >= 2) setRevealed(true);
  };

  const next = () => {
    setTarget((current) => (current + 1) % media.length);
    setTries(0);
    setState("idle");
    setRevealed(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <Prompt>Montre : {nameOf(wanted)}</Prompt>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {media.map((item) => {
          const isAnswer = item.id === wanted.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => choose(item)}
              aria-label={item.alt}
              className={`flex min-h-32 items-center justify-center rounded-2xl border-4 bg-white p-3 transition sm:min-h-40 ${
                state === "done" && isAnswer
                  ? "teka-pop border-emerald-600"
                  : revealed && isAnswer
                    ? "teka-attention border-amber-500"
                    : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <Picture media={item} />
            </button>
          );
        })}
      </div>
      <Feedback
        state={state}
        hint={
          revealed
            ? `C’est celui-ci : ${nameOf(wanted)}. Nommez-le ensemble, puis recommencez.`
            : "Essaie encore. Regarde bien la forme."
        }
      />
      {(state === "done" || revealed) && media.length > 1 && (
        <button
          type="button"
          onClick={next}
          className="w-fit rounded-xl border-2 border-stone-300 px-4 py-2 text-base font-medium"
        >
          Encore un autre
        </button>
      )}
    </div>
  );
}

/**
 * Counting, with something to count. The child taps objects one by one and the count is said back
 * — the screen does the same job as moving cailloux from one pile to another.
 */
function CountTogether({ upTo, media }: { upTo: number; media: SessionMedia | undefined }) {
  const [counted, setCounted] = useState(0);
  const total = Math.min(Math.max(upTo, 1), 20);
  return (
    <div className="flex flex-col gap-4">
      <Prompt>Touche chaque objet en comptant à voix haute.</Prompt>
      <div className="flex flex-wrap gap-2" aria-label={`${total} objets à compter`} role="group">
        {Array.from({ length: total }, (_, index) => {
          const done = index < counted;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setCounted(index + 1)}
              aria-label={`Objet ${index + 1}`}
              className={`flex h-20 w-20 items-center justify-center rounded-2xl border-4 transition sm:h-24 sm:w-24 ${
                done ? "teka-pop border-emerald-600 bg-emerald-50" : "border-stone-200 bg-white"
              }`}
            >
              {media ? (
                <span aria-hidden="true">
                  <Picture media={media} size="sm" />
                </span>
              ) : (
                <span aria-hidden="true" className="h-8 w-8 rounded-full bg-emerald-200" />
              )}
            </button>
          );
        })}
      </div>
      <p
        role="status"
        key={counted}
        className={`text-3xl font-bold ${counted > 0 ? "teka-pop" : ""}`}
      >
        {counted === 0 ? "…" : counted === total ? `${counted} en tout. Bravo !` : counted}
      </p>
      {counted > 0 && (
        <button
          type="button"
          onClick={() => setCounted(0)}
          className="w-fit rounded-xl border-2 border-stone-300 px-4 py-2 text-base font-medium"
        >
          Recommencer
        </button>
      )}
    </div>
  );
}

/** Tap a picture, then tap the group it belongs to. Tapping, never dragging: small fingers. */
function SortIntoGroups({
  categories,
  media,
}: {
  categories: readonly string[];
  media: readonly SessionMedia[];
}) {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const remaining = media.filter((item) => placed[item.id] === undefined);

  return (
    <div className="flex flex-col gap-4">
      <Prompt>
        {picked === null
          ? "Choisis une image, puis choisis son groupe."
          : "Maintenant, choisis son groupe."}
      </Prompt>
      {remaining.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {remaining.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPicked(item.id)}
              aria-label={item.alt}
              aria-pressed={picked === item.id}
              className={`rounded-2xl border-4 bg-white p-2 ${
                picked === item.id ? "border-emerald-600" : "border-stone-200"
              }`}
            >
              <Picture media={item} size="sm" />
            </button>
          ))}
        </div>
      ) : (
        <p role="status" className="text-lg font-semibold">
          Tout est rangé. Bravo !
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {categories.map((category) => {
          const inside = media.filter((item) => placed[item.id] === category);
          return (
            <button
              key={category}
              type="button"
              disabled={picked === null}
              onClick={() => {
                if (picked === null) return;
                setPlaced((current) => ({ ...current, [picked]: category }));
                setPicked(null);
              }}
              className="flex min-h-28 flex-col items-center justify-start gap-2 rounded-2xl border-2 border-dashed border-stone-300 px-3 py-3 text-center disabled:opacity-60"
            >
              <span className="text-base font-medium">{category}</span>
              <span className="flex flex-wrap justify-center gap-1">
                {inside.map((item) => (
                  <span key={item.id} className="w-10">
                    <Picture media={item} size="sm" />
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-base text-stone-600">
        Il n’y a pas de mauvaise réponse ici : demandez « pourquoi ? » à chaque fois.
      </p>
    </div>
  );
}

// ---- the families ----------------------------------------------------------------------------

export function ActivityRenderer({ activity }: { activity: SessionActivity }) {
  const family: RendererFamily = activity.renderer;
  const media = activity.media;
  const offScreen = activity.mode === "off-screen";

  switch (family) {
    case "audio-narrative":
      return <Narrative activity={activity} />;

    case "oral-exchange": {
      // The instruction is already shown above as "À dire à l'enfant"; only extra questions here.
      const prompts = asStrings(activity.payload["prompts"]).filter(
        (prompt) => !activity.childInstruction.includes(prompt),
      );
      const hasBody = media.length > 0 || prompts.length > 0;
      const body = hasBody ? (
        <div className="flex flex-col gap-3">
          {media.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {media.map((item) => (
                <Picture key={item.id} media={item} />
              ))}
            </div>
          )}
          {prompts.length > 0 && (
            <>
              <Prompt>À demander ensuite :</Prompt>
              {list(prompts)}
            </>
          )}
        </div>
      ) : null;
      return offScreen ? <OffScreen>{body}</OffScreen> : body;
    }

    case "word-cards":
      return <WordCards activity={activity} />;

    case "sound-game": {
      const words = asStrings(activity.payload["words"]);
      return (
        <OffScreen>
          <div className="flex flex-wrap gap-2">
            {words.map((word) => (
              <span key={word} className="rounded-xl bg-sky-100 px-4 py-3 text-xl font-medium">
                {word}
              </span>
            ))}
          </div>
        </OffScreen>
      );
    }

    case "quantity": {
      const upTo = activity.payload["upTo"];
      const objects = activity.payload["objects"];
      return (
        <div className="flex flex-col gap-3">
          {typeof objects === "string" && (
            <p className="text-base text-stone-600">Avec : {objects}</p>
          )}
          {typeof upTo === "number" ? <CountTogether upTo={upTo} media={media[0]} /> : null}
        </div>
      );
    }

    case "group-and-match": {
      const categories = asStrings(activity.payload["categories"]);
      const pairs = Array.isArray(activity.payload["pairs"]) ? activity.payload["pairs"] : [];
      if (categories.length > 0 && media.length > 0) {
        return <SortIntoGroups categories={categories} media={media} />;
      }
      if (media.length > 1) return <ChooseOne media={media} />;
      if (categories.length > 0) {
        return (
          <OffScreen>
            <div className="grid gap-2 sm:grid-cols-3">
              {categories.map((category) => (
                <div
                  key={category}
                  className="rounded-2xl border-2 border-dashed border-stone-300 px-4 py-6 text-center text-lg"
                >
                  {category}
                </div>
              ))}
            </div>
          </OffScreen>
        );
      }
      return (
        <OffScreen>
          <ul className="flex flex-col gap-2">
            {pairs.map((pair, index) => (
              <li key={index} className="rounded-xl bg-white/70 px-4 py-3 text-lg shadow-sm">
                {asStrings(pair).join("  →  ")}
              </li>
            ))}
          </ul>
        </OffScreen>
      );
    }

    case "look-and-name": {
      const focus = activity.payload["focus"];
      if (media.length > 1) return <ChooseOne media={media} />;
      return (
        <div className="flex flex-col gap-3">
          {media.map((item) => (
            <Picture key={item.id} media={item} size="lg" />
          ))}
          {typeof focus === "string" && <Prompt>À observer : {focus}</Prompt>}
        </div>
      );
    }

    case "trace-and-draw": {
      const subject = activity.payload["subject"] ?? activity.payload["pattern"];
      return (
        <OffScreen>
          <div className="flex flex-col gap-3">
            {media.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {media.map((item) => (
                  <Picture key={item.id} media={item} />
                ))}
              </div>
            )}
            {typeof subject === "string" && <Prompt>À dessiner : {subject}</Prompt>}
          </div>
        </OffScreen>
      );
    }

    case "move":
      return (
        <OffScreen>
          <ol className="flex flex-col gap-2">
            {asStrings(activity.payload["moves"]).map((move, index) => (
              <li key={move} className="flex items-center gap-3 text-lg">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 font-semibold">
                  {index + 1}
                </span>
                {move}
              </li>
            ))}
          </ol>
        </OffScreen>
      );

    case "hands-on": {
      const objects = activity.payload["objects"];
      return (
        <OffScreen>
          <div className="flex flex-col gap-3">
            {media.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {media.map((item) => (
                  <Picture key={item.id} media={item} size="sm" />
                ))}
              </div>
            )}
            {typeof objects === "string" && <Prompt>Avec : {objects}</Prompt>}
          </div>
        </OffScreen>
      );
    }
  }
}

/**
 * The taught words, each with its picture — then, once they have been seen, the same pictures
 * without their words so the child can be asked for one by name. Naming a picture is how a word
 * moves from heard to owned; the cards alone only show it.
 */
function WordCards({ activity }: { activity: SessionActivity }) {
  const [playing, setPlaying] = useState(false);
  const media = activity.media;
  const words = activity.vocabulary.map((entry) => entry.fr);

  if (playing && media.length > 1) {
    return (
      <div className="flex flex-col gap-4">
        <ChooseOne media={media} labels={words} />
        <button
          type="button"
          onClick={() => setPlaying(false)}
          className="w-fit rounded-xl border-2 border-stone-300 px-4 py-2 text-base font-medium"
        >
          Revoir les mots
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {activity.vocabulary.map((entry, index) => {
          const picture = media[index];
          return (
            <li
              key={entry.fr}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white px-3 py-4 shadow-sm"
            >
              {picture && <Picture media={picture} />}
              <span className="text-center text-lg font-semibold">{entry.fr}</span>
            </li>
          );
        })}
      </ul>
      {media.length > 1 && (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="w-fit rounded-xl border-2 border-emerald-700 px-4 py-2 text-base font-medium text-emerald-800"
        >
          Jouer : je montre le mot
        </button>
      )}
    </div>
  );
}

/**
 * A recording, offered and never forced: it plays on a tap, never on arrival, and the transcript
 * is on the page anyway. Nothing here is the only route to the content (ADR-046).
 */
function Listen({ audio }: { audio: NonNullable<SessionText["audio"]> }) {
  const [playing, setPlaying] = useState(false);
  const element = useRef<HTMLAudioElement | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          const player = element.current;
          if (player === null) return;
          if (playing) {
            player.pause();
            player.currentTime = 0;
            setPlaying(false);
            return;
          }
          void player.play().then(
            () => setPlaying(true),
            // A browser that refuses to play is not an error the child should see.
            () => setPlaying(false),
          );
        }}
        className="rounded-xl border-2 border-stone-300 px-4 py-2 text-base font-medium"
      >
        {playing ? "Arrêter" : "Écouter l’histoire"}
      </button>
      {/* No autoplay, no loop: the parent decides when sound happens. */}
      <audio
        ref={element}
        src={audio.url}
        preload="none"
        onEnded={() => setPlaying(false)}
        aria-label={audio.transcript.slice(0, 80)}
      />
    </div>
  );
}

/** A story or a rhyme, read by the parent, one page at a time rather than one long scroll. */
function Narrative({ activity }: { activity: SessionActivity }) {
  const text = activity.text;
  const questions = asStrings(activity.payload["questions"]);
  const [page, setPage] = useState(0);
  if (text === null) return null;

  const perPage = text.kind === "rhyme" ? text.lines.length : 3;
  const pages = Math.ceil(text.lines.length / perPage);
  const shown = text.lines.slice(page * perPage, page * perPage + perPage);
  const last = page >= pages - 1;

  return (
    <div className="flex flex-col gap-4">
      <article className="rounded-2xl bg-white px-5 py-5 shadow-sm">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h4 className="text-xl font-semibold">{text.title}</h4>
          {pages > 1 && (
            <span className="text-sm text-stone-500">
              {page + 1} / {pages}
            </span>
          )}
        </div>
        {page === 0 && (text.illustration !== null || activity.media.length > 0) && (
          <div className="mb-4 flex justify-center gap-3">
            {text.illustration !== null ? (
              <Picture media={text.illustration} size="lg" />
            ) : (
              activity.media.map((item) => <Picture key={item.id} media={item} size="lg" />)
            )}
          </div>
        )}
        <div className={text.kind === "rhyme" ? "flex flex-col gap-1" : "flex flex-col gap-3"}>
          {shown.map((line, index) => (
            <p key={index} className="text-lg leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </article>

      {text.audio !== null && <Listen audio={text.audio} />}

      {pages > 1 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0}
            className="rounded-xl border-2 border-stone-300 px-4 py-2 text-base font-medium disabled:opacity-40"
          >
            Page précédente
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pages - 1, current + 1))}
            disabled={last}
            className="rounded-xl border-2 border-stone-300 px-4 py-2 text-base font-medium disabled:opacity-40"
          >
            Page suivante
          </button>
        </div>
      )}

      {questions.length > 0 && last && (
        <section>
          <h4 className="mb-2 text-sm font-semibold tracking-wide text-stone-500 uppercase">
            Questions, après la lecture
          </h4>
          {list(questions)}
        </section>
      )}
    </div>
  );
}
