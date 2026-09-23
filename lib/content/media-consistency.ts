/**
 * Does the picture a child sees belong to what the activity asks? (the September media audit)
 *
 * The 3ème visual reconfirmation found « Le bruit de la pluie » showing a hand counting to three:
 * the activity said the month's counting rhyme on top of making rain, and the rhyme's picture led
 * the screen. A picture can be a well-drawn, well-described asset and still be the wrong picture
 * for the activity. This is the check that would have caught it.
 *
 * The rule is semantic, not an asset id: every picture actually shown (domain/lessons/pictures.ts)
 * must share a word with **what the child is asked about** — the lesson's and the activity's
 * titles, the sentence said to the child, its taught words and the things its payload names. The words of a story or
 * rhyme the activity reads count only when the activity is *about* that text (it names the text,
 * or asks the child to listen, say, sing or read it): a rhyme said over another task does not make
 * its picture relevant to the task.
 *
 * Words are compared on a folded stem (lower case, no accents, no plural, first six letters), so
 * « compte » meets « compter » and « formes » meets « forme », but « comptine » does not meet
 * « compter ». Trivial words are ignored, and so are the category words a picture's tags carry
 * (« histoire », « comptine »): they would link any story picture to any story. This
 * is a detector of obvious contradictions, not a judge of illustration quality.
 */
import { shownPictureIds } from "@/domain/lessons/pictures";
import type { Activity, Lesson } from "@/domain/lessons/types";
import type { ReferenceData } from "./reference-data";

const STOP = new Set(
  (
    "le la les un une des du de d l et ou au aux a en dans sur sous avec pour par ce cet cette ces " +
    "mon ma mes ton ta tes son sa ses il elle on nous vous ils elles je tu me te se lui y ne pas plus " +
    "puis qui que quoi est sont fait fais faire tout tous toute bien tres tres encore avant apres " +
    "moi toi dis dit montre regarde nomme touche choisis quand comme"
  ).split(" "),
);

function fold(word: string): string {
  return word.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** The comparable stems of a piece of French text. */
export function stems(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of fold(text).split(/[^a-z]+/)) {
    if (raw.length < 3 || STOP.has(raw)) continue;
    const singular = raw.length > 4 && raw.endsWith("s") ? raw.slice(0, -1) : raw;
    out.add(singular.slice(0, 6));
  }
  return out;
}

/** Does the activity ask the child to attend to the story or rhyme it reads? */
function isAboutItsText(activity: Activity, textTitle: string): boolean {
  const said = `${activity.title} ${activity.childInstruction}`;
  if (/comptine|histoire|lecture|écoute|chante|récite/i.test(said)) return true;
  const titleStems = stems(textTitle);
  return [...stems(said)].some((s) => titleStems.has(s));
}

/** Category words: true of every story or rhyme picture, so they prove nothing. */
const GENERIC = new Set(["histoi", "compti", "illust"]);

const payloadStrings = (payload: Readonly<Record<string, unknown>>): string[] => {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
  };
  for (const [key, value] of Object.entries(payload)) {
    if (key === "textId" || key === "questions" || key === "extension") continue;
    walk(value);
  }
  return out;
};

export type MediaFinding = {
  lessonId: string;
  activityId: string;
  activityTitle: string;
  pictureId: string;
  pictureAlt: string;
  /** Why the picture is on screen: named by the activity, or carried by the text it reads. */
  source: "activity" | "text";
  textId: string | null;
  /** Whether the text's own words were admitted as context. */
  textIsSubject: boolean;
  matched: string[];
};

export function mediaFindings(data: ReferenceData): MediaFinding[] {
  const assets = new Map(data.media.map((a) => [a.id, a]));
  const findings: MediaFinding[] = [];
  const lessons: readonly Lesson[] = data.lessons;
  for (const lesson of lessons) {
    for (const activity of lesson.activities) {
      const textId = activity.payload["textId"];
      const text =
        typeof textId === "string" ? (data.texts.find((t) => t.id === textId) ?? null) : null;
      const shown = shownPictureIds(
        activity,
        text === null ? null : { kind: text.kind, illustrationId: text.illustrationId },
      );
      if (shown.length === 0) continue;
      const textIsSubject = text !== null && isAboutItsText(activity, text.title);
      const context = stems(
        [
          lesson.title,
          activity.title,
          activity.childInstruction,
          ...activity.vocabulary.map((v) => v.fr),
          ...payloadStrings(activity.payload),
          ...(textIsSubject && text !== null ? [text.title, ...text.lines] : []),
        ].join(" "),
      );
      for (const id of shown) {
        const asset = assets.get(id);
        if (asset === undefined) continue;
        const own = new Set(
          [...stems([asset.alt, ...asset.tags].join(" "))].filter((s) => !GENERIC.has(s)),
        );
        findings.push({
          lessonId: lesson.id,
          activityId: activity.id,
          activityTitle: activity.title,
          pictureId: id,
          pictureAlt: asset.alt,
          source: activity.mediaIds.includes(id) ? "activity" : "text",
          textId: text?.id ?? null,
          textIsSubject,
          matched: [...own].filter((s) => context.has(s)).sort(),
        });
      }
    }
  }
  return findings;
}

/** The contradictions: a shown picture that shares no word with what the activity asks. */
export function mediaContradictions(data: ReferenceData): MediaFinding[] {
  return mediaFindings(data).filter((f) => f.matched.length === 0);
}
