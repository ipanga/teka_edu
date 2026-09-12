import type { RendererFamily } from "@/domain/lessons/renderers";
import type { SessionActivity } from "@/lib/programme/session-view";

/**
 * One component per renderer family, not one per activity kind (ADR-036): fifteen kinds share
 * ten interactions. Only the families September actually uses are implemented; the rest arrive
 * with the content that needs them.
 *
 * Every family here is presentational and off-screen-friendly: the screen carries the words the
 * parent says and the material the child looks at, then gets out of the way.
 */

const list = (items: readonly string[], className = "") => (
  <ul className={`flex flex-col gap-2 ${className}`}>
    {items.map((item) => (
      <li key={item} className="rounded-xl bg-white/70 px-4 py-3 text-lg shadow-sm">
        {item}
      </li>
    ))}
  </ul>
);

function asStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function Text({ activity }: { activity: SessionActivity }) {
  if (activity.text === null) return null;
  return (
    <article className="rounded-2xl bg-white px-5 py-4 shadow-sm">
      <h4 className="mb-3 text-xl font-semibold">{activity.text.title}</h4>
      <div
        className={activity.text.kind === "rhyme" ? "flex flex-col gap-1" : "flex flex-col gap-3"}
      >
        {activity.text.lines.map((line, index) => (
          <p key={index} className="text-lg leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </article>
  );
}

function Questions({ activity }: { activity: SessionActivity }) {
  const questions = asStrings(activity.payload["questions"]);
  if (questions.length === 0) return null;
  return (
    <section>
      <h4 className="mb-2 text-sm font-semibold tracking-wide text-stone-500 uppercase">
        Questions, après la lecture
      </h4>
      {list(questions)}
    </section>
  );
}

function Vocabulary({ activity }: { activity: SessionActivity }) {
  if (activity.vocabulary.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {activity.vocabulary.map((entry) => (
        <li key={entry.fr} className="rounded-full bg-amber-100 px-4 py-2 text-lg font-medium">
          {entry.fr}
        </li>
      ))}
    </ul>
  );
}

export function ActivityRenderer({ activity }: { activity: SessionActivity }) {
  const family: RendererFamily = activity.renderer;
  switch (family) {
    case "audio-narrative":
      return (
        <div className="flex flex-col gap-4">
          <Text activity={activity} />
          <Questions activity={activity} />
        </div>
      );
    case "oral-exchange":
      return list(asStrings(activity.payload["prompts"]));
    case "word-cards":
      return <Vocabulary activity={activity} />;
    case "sound-game":
      return (
        <div className="flex flex-wrap gap-2">
          {asStrings(activity.payload["words"]).map((word) => (
            <span key={word} className="rounded-xl bg-sky-100 px-4 py-3 text-xl font-medium">
              {word}
            </span>
          ))}
        </div>
      );
    case "quantity": {
      const upTo = activity.payload["upTo"];
      const objects = activity.payload["objects"];
      return (
        <div className="flex flex-col gap-3">
          {typeof objects === "string" && <p className="text-lg">Avec : {objects}</p>}
          {typeof upTo === "number" && (
            <div className="flex flex-wrap gap-2" aria-label={`compter jusqu’à ${upTo}`}>
              {Array.from({ length: upTo }, (_, index) => (
                <span
                  key={index}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold"
                >
                  {index + 1}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }
    case "group-and-match": {
      const categories = asStrings(activity.payload["categories"]);
      const pairs = Array.isArray(activity.payload["pairs"]) ? activity.payload["pairs"] : [];
      if (categories.length > 0) {
        return (
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
        );
      }
      return (
        <ul className="flex flex-col gap-2">
          {pairs.map((pair, index) => (
            <li key={index} className="rounded-xl bg-white/70 px-4 py-3 text-lg shadow-sm">
              {asStrings(pair).join("  →  ")}
            </li>
          ))}
        </ul>
      );
    }
    case "look-and-name": {
      const focus = activity.payload["focus"];
      return typeof focus === "string" ? (
        <p className="rounded-2xl bg-white/70 px-5 py-4 text-lg shadow-sm">À observer : {focus}</p>
      ) : null;
    }
    case "trace-and-draw": {
      const subject = activity.payload["subject"] ?? activity.payload["pattern"];
      return typeof subject === "string" ? (
        <p className="rounded-2xl bg-white/70 px-5 py-4 text-lg shadow-sm">
          À dessiner : {subject}
        </p>
      ) : null;
    }
    case "move":
      return (
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
      );
    case "hands-on": {
      const objects = activity.payload["objects"];
      return typeof objects === "string" ? (
        <p className="rounded-2xl bg-white/70 px-5 py-4 text-lg shadow-sm">Avec : {objects}</p>
      ) : null;
    }
  }
}
