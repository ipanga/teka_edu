"use client";

import { createContext, useContext, useRef, useState } from "react";
import { shownPictureIds } from "@/domain/lessons/pictures";
import type { RendererFamily } from "@/domain/lessons/renderers";
import type { SessionActivity, SessionAudio, SessionMedia } from "@/lib/programme/session-view";

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
 *
 * Visual patterns (docs/september-illustration-upgrade-plan.md): every picture sits on a tinted
 * **stage**, so a card with one picture is furnished rather than empty; lists of cards, lines and
 * steps arrive once, in sequence; a page turn rises once. All of it is off under
 * `prefers-reduced-motion` (ADR-045). A recording, where one exists, is offered behind a tap and
 * never plays on its own (ADR-046).
 */

// ---- shared pieces ---------------------------------------------------------------------------

/**
 * True inside « Montrer à l'enfant », where the device is the child's and pictures grow one step.
 * A context rather than a prop threaded through ten families: the size is a property of the
 * surface, not of any one activity.
 */
export const ChildViewContext = createContext(false);

type PictureSize = "sm" | "md" | "lg";

/** Pixel hints and the width classes that let a picture grow with the screen. */
const PICTURE: Record<PictureSize, { px: number; parent: string; child: string }> = {
  sm: { px: 80, parent: "max-w-20 sm:max-w-24", child: "max-w-24 sm:max-w-28 xl:max-w-36" },
  md: { px: 144, parent: "max-w-36 sm:max-w-44", child: "max-w-44 sm:max-w-52 xl:max-w-72" },
  // On a television the story picture is what the whole room looks at: it may take the width.
  lg: { px: 256, parent: "max-w-60 sm:max-w-72", child: "max-w-72 sm:max-w-96 xl:max-w-[30rem]" },
};

function Picture({ media, size = "md" }: { media: SessionMedia; size?: PictureSize }) {
  const childView = useContext(ChildViewContext);
  const { px, parent, child } = PICTURE[size];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG from public/, no optimisation needed
    <img
      src={media.url}
      alt={media.alt}
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      className={`h-auto w-full ${childView ? child : parent}`}
    />
  );
}

/**
 * The tinted panel a picture sits on. It takes the picture's width and adds a little air, so the
 * same component frames a 80 px counter and a 384 px story picture without knowing which.
 */
function Stage({
  children,
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  size?: PictureSize;
  className?: string;
}) {
  const padding = size === "lg" ? "p-5 sm:p-7" : size === "md" ? "p-4" : "p-2";
  return <div className={`teka-stage ${padding} ${className}`}>{children}</div>;
}

/** One picture, centred on a large stage: the story picture, the thing to look at. */
function Showcase({ media }: { media: SessionMedia }) {
  const childView = useContext(ChildViewContext);
  return (
    <div className="flex justify-center">
      <Stage size="lg" className={`w-full ${childView ? "max-w-md xl:max-w-2xl" : "max-w-md"}`}>
        <Picture media={media} size="lg" />
      </Stage>
    </div>
  );
}

/** Several pictures, each on its own small stage, arriving in sequence. */
function Gallery({ media, size = "md" }: { media: readonly SessionMedia[]; size?: PictureSize }) {
  return (
    <ul className="flex flex-wrap justify-center gap-3" aria-label="Images">
      {media.map((item, index) => (
        <li key={item.id} className="teka-stagger" style={{ "--i": index } as React.CSSProperties}>
          <Stage size={size}>
            <Picture media={item} size={size} />
          </Stage>
        </li>
      ))}
    </ul>
  );
}

function Prompt({ children }: { children: React.ReactNode }) {
  const childView = useContext(ChildViewContext);
  return (
    <p
      className={
        childView
          ? "text-center text-xl font-medium text-stone-700 sm:text-2xl xl:text-3xl"
          : "text-lg font-medium text-stone-700"
      }
    >
      {children}
    </p>
  );
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
 * inside it, it is a single line rather than an empty box: an empty frame looks broken, and a
 * parent should not wonder whether something failed to load.
 *
 * When there *is* something inside — a picture to look at while the adult reads — the label says
 * so instead of telling the parent to put down a device it is about to ask them to hold up. The
 * activity is still off-screen in the sense that matters: the child does nothing on it.
 *
 * A soft, filled panel rather than a dashed outline: the dashes read as "failed to load".
 */
function OffScreen({
  children,
  withPicture = false,
}: {
  children?: React.ReactNode;
  /** The frame holds a picture to look at together, not just the parent's aide-mémoire. */
  withPicture?: boolean;
}) {
  const empty = children === null || children === undefined || children === false;
  const childView = useContext(ChildViewContext);
  const label = (
    <p
      className={
        // On the child's own screen an off-screen activity has nothing else to show: the line
        // becomes the screen, centred and large, rather than a caption lost in a corner.
        childView && empty
          ? "mx-auto mt-10 max-w-xl rounded-3xl bg-quiet px-8 py-10 text-center text-xl font-semibold tracking-wide text-stone-600 uppercase sm:text-2xl"
          : "text-sm font-semibold tracking-wide text-stone-500 uppercase"
      }
    >
      {withPicture && !empty
        ? "Regardez l’image ensemble ; l’enfant n’a rien à faire sur l’écran"
        : "Posez l’écran : cette activité se fait sans lui"}
    </p>
  );
  if (empty) return label;
  return (
    <div className="rounded-2xl bg-quiet px-5 py-4">
      <div className="mb-3">{label}</div>
      {children}
    </div>
  );
}

const asStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

/** A list of things to say or do, arriving one after another. */
const list = (items: readonly string[]) => (
  <ul className="flex flex-col gap-2">
    {items.map((item, index) => (
      <li
        key={item}
        className="teka-stagger rounded-xl bg-white px-4 py-3 text-lg shadow-sm"
        style={{ "--i": index } as React.CSSProperties}
      >
        {item}
      </li>
    ))}
  </ul>
);

/** The word a picture is for: the first tag a lesson would use, e.g. "carré". */
const labelOf = (media: SessionMedia) => media.tags[0] ?? media.alt;

/**
 * A recording, offered and never forced: it plays on a tap, never on arrival, and the words are
 * on the page anyway. Nothing here is the only route to the content (ADR-046). The control
 * exists only when the asset does, so there is never a button that does nothing.
 */
function Listen({
  audio,
  label,
  compact = false,
}: {
  audio: SessionAudio;
  /** What the button says: « Écouter l’histoire », « Écouter le mot »… */
  label: string;
  /** A small control beside a word, rather than a full-width one under a story. */
  compact?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const element = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
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
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        className={
          compact
            ? "rounded-full border-2 border-stone-300 px-3 py-1 text-sm font-medium text-stone-700"
            : "rounded-xl border-2 border-stone-300 px-4 py-2 text-base font-medium"
        }
      >
        {playing ? "Arrêter" : label}
      </button>
      {/* No autoplay, no loop: the parent decides when sound happens. */}
      <audio
        ref={element}
        src={audio.url}
        preload="none"
        onEnded={() => setPlaying(false)}
        aria-label={audio.transcript.slice(0, 80)}
      />
    </span>
  );
}

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

  /**
   * Two pictures can be the same thing: a square lying on its point is still a square, and
   * MATH-S03-C01-O07 asks the child to recognise that. Matching on the asset id would call the
   * tilted square a wrong answer and teach the prototype the objective exists to prevent, so the
   * comparison is on what the picture *is* — its first tag — and falls back to the id when a
   * picture has no tags.
   */
  const childView = useContext(ChildViewContext);
  const kindOf = (item: SessionMedia) => item.tags[0] ?? item.id;
  const isSameKind = (a: SessionMedia, b: SessionMedia) => kindOf(a) === kindOf(b);

  const choose = (chosen: SessionMedia) => {
    if (state === "done") return;
    if (isSameKind(chosen, wanted)) {
      setState("done");
      return;
    }
    setTries((n) => n + 1);
    setState("retry");
    if (tries + 1 >= 2) setRevealed(true);
  };

  /** Move on to a picture of a different thing, so the child is not asked the same one twice. */
  const next = () => {
    setTarget((current) => {
      for (let step = 1; step <= media.length; step++) {
        const candidate = (current + step) % media.length;
        if (!isSameKind(media[candidate]!, media[current]!)) return candidate;
      }
      return (current + 1) % media.length;
    });
    setTries(0);
    setState("idle");
    setRevealed(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <Prompt>Montre : {nameOf(wanted)}</Prompt>
      <div
        className={`teka-choice-grid ${childView ? "teka-choice-grid-child" : ""}`}
        style={{ "--choice-columns": Math.min(media.length, 4) } as React.CSSProperties}
      >
        {media.map((item, index) => {
          const isAnswer = isSameKind(item, wanted);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => choose(item)}
              aria-label={item.alt}
              style={{ "--i": index } as React.CSSProperties}
              className={`teka-stagger flex items-center justify-center rounded-3xl border-4 bg-stage p-3 transition ${
                childView ? "min-h-40 sm:min-h-52 xl:min-h-72" : "min-h-32 sm:min-h-40"
              } ${
                state === "done" && isAnswer
                  ? "teka-pop border-emerald-600"
                  : revealed && isAnswer
                    ? "teka-attention border-amber-500"
                    : "border-transparent hover:border-stone-300"
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
  const childView = useContext(ChildViewContext);
  const total = Math.min(Math.max(upTo, 1), 20);
  // On the child's own surface the tiles are the whole screen: bigger, and centred.
  const tile = childView ? "h-24 w-24 sm:h-32 sm:w-32" : "h-20 w-20 sm:h-24 sm:w-24";
  return (
    <div className={`flex flex-col gap-4 ${childView ? "items-center text-center" : ""}`}>
      <Prompt>Touche chaque objet en comptant à voix haute.</Prompt>
      <div
        className={`flex flex-wrap gap-2 rounded-3xl bg-stage p-3 ${childView ? "justify-center" : ""}`}
        aria-label={`${total} objets à compter`}
        role="group"
      >
        {Array.from({ length: total }, (_, index) => {
          const done = index < counted;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setCounted(index + 1)}
              aria-label={`Objet ${index + 1}`}
              style={{ "--i": index } as React.CSSProperties}
              className={`teka-stagger flex items-center justify-center rounded-2xl border-4 transition ${tile} ${
                done ? "teka-pop border-emerald-600 bg-emerald-50" : "border-transparent bg-white"
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
        className={`font-bold ${childView ? "text-5xl sm:text-6xl" : "text-4xl"} ${counted > 0 ? "teka-pop" : ""}`}
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
          {remaining.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPicked(item.id)}
              aria-label={item.alt}
              aria-pressed={picked === item.id}
              style={{ "--i": index } as React.CSSProperties}
              className={`teka-stagger rounded-2xl border-4 bg-stage p-2 ${
                picked === item.id ? "border-emerald-600" : "border-transparent"
              }`}
            >
              <Picture media={item} size="sm" />
            </button>
          ))}
        </div>
      ) : (
        <p role="status" className="teka-pop text-lg font-semibold">
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
              className="flex min-h-28 flex-col items-center justify-start gap-2 rounded-2xl border-2 border-stone-200 bg-quiet px-3 py-3 text-center transition enabled:hover:border-emerald-600 disabled:opacity-60"
            >
              <span className="text-base font-medium">{category}</span>
              <span className="flex flex-wrap justify-center gap-1">
                {inside.map((item) => (
                  <span key={item.id} className="teka-pop w-10">
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
  const childView = useContext(ChildViewContext);

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
          {media.length === 1 ? (
            <Showcase media={media[0]!} />
          ) : (
            media.length > 1 && <Gallery media={media} />
          )}
          {prompts.length > 0 && (
            <>
              <Prompt>À demander ensuite :</Prompt>
              {list(prompts)}
            </>
          )}
        </div>
      ) : null;
      return offScreen ? <OffScreen withPicture={media.length > 0}>{body}</OffScreen> : body;
    }

    case "word-cards":
      return <WordCards activity={activity} />;

    case "sound-game": {
      const words = asStrings(activity.payload["words"]);
      return (
        <OffScreen>
          <ul className="flex flex-wrap gap-2" aria-label="Mots à jouer">
            {words.map((word, index) => (
              <li
                key={word}
                className="teka-stagger rounded-xl bg-sky-100 px-4 py-3 text-xl font-medium"
                style={{ "--i": index } as React.CSSProperties}
              >
                {word}
              </li>
            ))}
          </ul>
        </OffScreen>
      );
    }

    case "quantity": {
      const upTo = activity.payload["upTo"];
      const objects = activity.payload["objects"];
      return (
        <div className={`flex flex-col gap-3 ${childView ? "items-center text-center" : ""}`}>
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
              {categories.map((category, index) => (
                <div
                  key={category}
                  className="teka-stagger rounded-2xl bg-white px-4 py-6 text-center text-lg shadow-sm"
                  style={{ "--i": index } as React.CSSProperties}
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
              <li
                key={index}
                className="teka-stagger rounded-xl bg-white px-4 py-3 text-lg shadow-sm"
                style={{ "--i": index } as React.CSSProperties}
              >
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
          {media[0] !== undefined && <Showcase media={media[0]} />}
          {typeof focus === "string" && <Prompt>À observer : {focus}</Prompt>}
        </div>
      );
    }

    case "trace-and-draw": {
      const subject = activity.payload["subject"] ?? activity.payload["pattern"];
      return (
        <OffScreen withPicture={media.length > 0}>
          <div className="flex flex-col gap-3">
            {media.length === 1 ? (
              <Showcase media={media[0]!} />
            ) : (
              media.length > 1 && <Gallery media={media} />
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
              <li
                key={move}
                className="teka-stagger flex items-center gap-3 text-lg"
                style={{ "--i": index } as React.CSSProperties}
              >
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
        <OffScreen withPicture={media.length > 0}>
          <div className="flex flex-col gap-3">
            {media.length > 0 && <Gallery media={media} size="sm" />}
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
 *
 * A word's recording, when someone has made one, sits beside the word as a small « Écouter »
 * (ADR-046). Until then the parent says the word, which is the design.
 */
function WordCards({ activity }: { activity: SessionActivity }) {
  const [playing, setPlaying] = useState(false);
  const childView = useContext(ChildViewContext);
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
      <ul
        className={
          // A two-word lesson on a television should not be two small cards in a corner.
          childView ? "teka-word-grid justify-center" : "grid grid-cols-2 gap-3 sm:grid-cols-3"
        }
        aria-label="Les mots"
        style={{ "--word-columns": Math.min(activity.vocabulary.length, 4) } as React.CSSProperties}
      >
        {activity.vocabulary.map((entry, index) => {
          const picture = media[index];
          return (
            <li
              key={entry.fr}
              className={`teka-stagger flex flex-col items-center gap-3 rounded-3xl bg-white shadow-sm ${childView ? "p-2 sm:p-3" : "p-3"}`}
              style={{ "--i": index } as React.CSSProperties}
            >
              {picture !== undefined ? (
                <Stage size={childView ? "sm" : "md"} className="w-full">
                  <Picture media={picture} />
                </Stage>
              ) : (
                <span aria-hidden="true" className="teka-stage h-6 w-full" />
              )}
              <span
                className={`text-center text-xl font-bold sm:text-2xl ${childView ? "xl:text-4xl" : ""}`}
              >
                {entry.fr}
              </span>
              {entry.audio !== null && (
                <Listen audio={entry.audio} label={`Écouter : ${entry.fr}`} compact />
              )}
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
 * A story or a rhyme, read by the parent, one page at a time rather than one long scroll. A rhyme
 * is one page, in a larger size, its lines arriving one after another so the eye follows the
 * beat. A story turns three lines at a time, and each page rises once.
 */
function Narrative({ activity }: { activity: SessionActivity }) {
  const childView = useContext(ChildViewContext);
  const text = activity.text;
  const questions = asStrings(activity.payload["questions"]);
  const [page, setPage] = useState(0);
  if (text === null) return null;

  const rhyme = text.kind === "rhyme";
  const perPage = rhyme ? text.lines.length : 3;
  const pages = Math.ceil(text.lines.length / perPage);
  const shown = text.lines.slice(page * perPage, page * perPage + perPage);
  const last = page >= pages - 1;
  // One rule for the whole product (domain/lessons/pictures.ts): a story's picture leads its
  // story; a rhyme said over another task shows that task's own picture when it names one.
  const [leadId] = shownPictureIds(
    { type: activity.type, mediaIds: activity.media.map((m) => m.id) },
    { kind: text.kind, illustrationId: text.illustration?.id ?? null },
  );
  const picture =
    [text.illustration, ...activity.media].find((m) => m !== null && m.id === leadId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <article className="rounded-3xl bg-white px-5 py-5 shadow-sm">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h4 className="text-xl font-semibold">{text.title}</h4>
          {pages > 1 && (
            <span className="text-sm text-stone-500">
              {page + 1} / {pages}
            </span>
          )}
        </div>
        <div className={childView && page === 0 && picture !== null ? "teka-narrative-layout" : ""}>
          {page === 0 && picture !== null && (
            <div className="mb-5">
              <Showcase media={picture} />
            </div>
          )}
          <div
            key={page}
            className={rhyme ? "teka-rise flex flex-col gap-2" : "teka-rise flex flex-col gap-3"}
          >
            {shown.map((line, index) => (
              <p
                key={index}
                className={
                  rhyme
                    ? `teka-stagger text-xl leading-relaxed font-medium sm:text-2xl ${childView ? "xl:text-3xl" : ""}`
                    : `text-lg leading-relaxed sm:text-xl ${childView ? "xl:text-3xl" : ""}`
                }
                style={rhyme ? ({ "--i": index } as React.CSSProperties) : undefined}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </article>

      {text.audio !== null && (
        <Listen audio={text.audio} label={rhyme ? "Écouter la comptine" : "Écouter l’histoire"} />
      )}

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
