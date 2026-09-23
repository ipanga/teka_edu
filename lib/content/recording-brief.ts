/**
 * The September recording package: every sentence a human voice could record, generated from the
 * content so it can never drift from what a lesson teaches (ADR-046, docs/AUDIO_GUIDELINES.md).
 *
 * It lists **unique recordings** — « la main » is recorded once and lights up on every card that
 * teaches it — and then **where each one is used**, activity by activity, with the audio class
 * the visual audit gives that activity. Nothing here records anything: it is the script a
 * French-speaking adult reads from, and the registry rows to add afterwards.
 */
import type { Activity } from "@/domain/lessons/types";
import { ACTIVITY_RENDERERS } from "@/domain/lessons/renderers";
import type { ReferenceData } from "./reference-data";
import { type AudioNeed, audioNeedOf, dayOfLessonMap } from "./visual-audit";

export const RECORDING_BRIEF_PATH = "docs/audio/septembre-script-enregistrement.md";

type Recording = {
  id: string;
  kind: "pronunciation" | "narration";
  file: string;
  need: AudioNeed;
  purpose: string;
  transcript: string;
  tone: string;
  seconds: number;
  usedBy: string[];
};

const LEVELS = ["maternelle-1", "maternelle-3"] as const;

const slug = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const wordsIn = (text: string) => text.split(/\s+/).filter(Boolean).length;

function recordingsOf(activity: Activity, data: ReferenceData): Omit<Recording, "usedBy">[] {
  const { need } = audioNeedOf(activity);
  if (need === "not-needed") return [];
  const family = ACTIVITY_RENDERERS[activity.type].family;

  if (family === "word-cards") {
    return activity.vocabulary.map((entry) => ({
      id: `mot-${slug(entry.fr)}`,
      kind: "pronunciation" as const,
      file: `mots/mot-${slug(entry.fr)}.mp3`,
      need,
      purpose: "Modèle de prononciation d’un mot que l’enfant répète.",
      transcript: entry.fr,
      tone: "Voix parlée normale, lente et claire ; le mot entier, deux fois, avec un silence entre les deux.",
      seconds: 3,
    }));
  }
  if (family === "sound-game") {
    const words = Array.isArray(activity.payload["words"])
      ? (activity.payload["words"] as unknown[]).filter((w): w is string => typeof w === "string")
      : [];
    return [
      {
        id: `sons-${activity.id}`,
        kind: "pronunciation" as const,
        file: `sons/sons-${activity.id}.mp3`,
        need,
        purpose: words.some((w) => w.includes("-"))
          ? "Modèle sonore : chaque mot dit en frappant ses syllabes, là où le tiret les sépare."
          : "Modèle sonore : chaque mot dit clairement, pour entendre ce qui se ressemble à la fin.",
        transcript: words.join(" · "),
        tone: "Voix parlée, lente, une syllabe par battement ; une seconde de silence entre les mots.",
        seconds: Math.max(4, words.length * 2),
      },
    ];
  }
  const textId = activity.payload["textId"];
  const text = typeof textId === "string" ? data.texts.find((t) => t.id === textId) : undefined;
  if (text === undefined) return [];
  const body = text.lines.join(" / ");
  return [
    {
      id: /^(comptine|histoire)-/.test(text.id)
        ? text.id
        : `${text.kind === "rhyme" ? "comptine" : "histoire"}-${text.id}`,
      kind: "narration" as const,
      file: `${text.kind === "rhyme" ? "comptines" : "histoires"}/${text.id}.mp3`,
      need,
      purpose:
        text.kind === "rhyme"
          ? "Le rythme de la comptine, pour l’adulte qui ne le connaît pas."
          : "Lecture de l’histoire, pour un soir où l’adulte ne peut pas lire.",
      transcript: `${text.title}. ${body}`,
      tone:
        text.kind === "rhyme"
          ? "Rythmée, joyeuse, parlée plutôt que chantée ; le même tempo du début à la fin."
          : "Voix de lecture calme et chaleureuse, sans imiter de personnages.",
      seconds: Math.round(wordsIn(body) / (text.kind === "rhyme" ? 1.6 : 2.2)) + 2,
    },
  ];
}

export function buildRecordingBrief(data: ReferenceData): string {
  const unique = new Map<string, Recording>();
  const usage: {
    level: string;
    day: number;
    lesson: string;
    activity: string;
    title: string;
    need: AudioNeed;
    ids: string[];
  }[] = [];

  for (const levelId of LEVELS) {
    const levelName = data.levels.find((l) => l.id === levelId)?.name ?? levelId;
    const days = dayOfLessonMap(levelId, data);
    const lessons = data.lessons
      .filter((l) => l.levelIds.includes(levelId))
      .sort((a, b) => (days.get(a.id) ?? 0) - (days.get(b.id) ?? 0) || a.id.localeCompare(b.id));
    for (const lesson of lessons) {
      for (const activity of lesson.activities) {
        const { need } = audioNeedOf(activity);
        if (need === "not-needed") continue;
        const recs = recordingsOf(activity, data);
        for (const rec of recs) {
          const found = unique.get(rec.id);
          if (found === undefined) unique.set(rec.id, { ...rec, usedBy: [activity.id] });
          else found.usedBy.push(activity.id);
        }
        usage.push({
          level: levelName,
          day: days.get(lesson.id) ?? 0,
          lesson: `${lesson.id} ${lesson.title}`,
          activity: activity.id,
          title: activity.title,
          need,
          ids: recs.map((r) => r.id),
        });
      }
    }
  }

  const all = [...unique.values()];
  const order: AudioNeed[] = ["important-for-pronunciation", "recommended", "optional"];
  const minutes = (list: Recording[]) =>
    Math.ceil(list.reduce((sum, r) => sum + r.seconds, 0) / 60);
  const cell = (s: string) => s.replaceAll("|", "\\|");

  const lines: string[] = [
    "# Script d’enregistrement — septembre, 1ère et 3ème maternelle",
    "",
    "> **Ce document est généré** (`npm run audio:brief`) à partir des leçons et des textes. Il ne",
    "> contient aucun enregistrement : c’est ce qu’une personne qui parle français avec aisance lit",
    "> au micro. Aucune voix de synthèse, aucun service payant (ADR-046). Un test échoue si ce",
    "> document n’est plus à jour.",
    "",
    "## En bref",
    "",
    "| Priorité | Enregistrements | Durée approximative |",
    "| --- | --- | --- |",
    ...order.map((need) => {
      const list = all.filter((r) => r.need === need);
      return `| \`${need}\` | ${list.length} | ~${minutes(list)} min |`;
    }),
    "",
    "- **Qui enregistre** : un adulte qui parle français avec aisance, toujours la même personne,",
    "  nommée dans `provenance`.",
    "- **Où** : une pièce calme, un téléphone posé, sans musique ni effet ; un fichier par ligne.",
    "- **Répétable** : oui, tous. Rien ne se lance seul ; l’adulte touche « Écouter ».",
    "- **L’adulte peut-il remplacer l’enregistrement ?** Oui, partout : le mot ou le texte est",
    "  toujours écrit à l’écran. Pour les lignes `important-for-pronunciation`, l’enregistrement",
    "  aide surtout l’adulte qui n’est pas sûr de sa prononciation.",
    "",
    "Après l’enregistrement, chaque fichier va dans `public/audio/<fichier>` et reçoit une ligne",
    "dans le tableau `audio` de `content/media/registry.json` :",
    "",
    "```json",
    '{ "id": "mot-la-main", "kind": "pronunciation", "file": "mots/mot-la-main.mp3",',
    '  "transcript": "la main", "seconds": 3, "origin": "teka-edu-created",',
    '  "provenance": "Enregistré par <prénom, rôle> le <date>, pour Teka Edu." }',
    "```",
    "",
    "Un mot est retrouvé par son `transcript` : il doit être **exactement** le mot de la leçon",
    "(majuscules et espaces mis à part). Une comptine ou une histoire se relie par `audioId` sur le",
    "texte, dans `content/texts/<classe>.json`.",
    "",
  ];

  for (const need of order) {
    const list = all.filter((r) => r.need === need);
    if (list.length === 0) continue;
    lines.push(
      `## \`${need}\` — ${list.length} enregistrement(s)`,
      "",
      "| id | fichier | À dire, exactement | But | Ton | Durée | Activités |",
      "| --- | --- | --- | --- | --- | --- | --- |",
      ...list.map(
        (r) =>
          `| \`${r.id}\` | \`${r.file}\` | ${cell(r.transcript)} | ${cell(r.purpose)} | ${cell(r.tone)} | ~${r.seconds} s | ${r.usedBy.length} |`,
      ),
      "",
    );
  }

  lines.push(
    "## Où chaque enregistrement sert",
    "",
    "| Classe | Jour | Leçon | Activité | Besoin | Enregistrements |",
    "| --- | --- | --- | --- | --- | --- |",
    ...usage.map(
      (u) =>
        `| ${u.level} | ${u.day} | ${cell(u.lesson)} | \`${u.activity}\` ${cell(u.title)} | \`${u.need}\` | ${u.ids.map((id) => `\`${id}\``).join(", ") || "—"} |`,
    ),
    "",
  );
  return lines.join("\n");
}
