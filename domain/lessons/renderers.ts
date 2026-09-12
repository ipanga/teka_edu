import { ACTIVITY_TYPES, type ActivityType } from "./types";

/**
 * Which kinds of activity a single screen can present (docs/PHASE3_RENDERER_PLAN.md).
 *
 * Phase 3 must not build fifteen unrelated screens. Several activity kinds share one
 * interaction, so they share one renderer family. This map is **planning data, not a
 * commitment to an implementation**: nothing renders yet. A test keeps it complete, so a new
 * activity kind cannot be added without deciding how it would be shown.
 */
export const RENDERER_FAMILIES = [
  "oral-exchange",
  "word-cards",
  "audio-narrative",
  "sound-game",
  "quantity",
  "group-and-match",
  "look-and-name",
  "trace-and-draw",
  "move",
  "hands-on",
] as const;
export type RendererFamily = (typeof RENDERER_FAMILIES)[number];

export type RendererPlan = {
  family: RendererFamily;
  /** What the child actually does. */
  interaction: string;
  /** What the screen shows, if anything. */
  screen: "none" | "prompt-only" | "content";
  /** Media the family will eventually need. None of it exists yet. */
  media: readonly ("image" | "audio")[];
  /** How a future progress feature could tell the activity happened. */
  evidence: "adult-confirms" | "child-taps" | "child-produces";
  /** Whether the family can work with no network once content is downloaded. */
  offline: "yes" | "needs-audio" | "needs-image";
};

export const ACTIVITY_RENDERERS: Readonly<Record<ActivityType, RendererPlan>> = {
  conversation: {
    family: "oral-exchange",
    interaction: "L’adulte pose les questions, l’enfant répond à l’oral.",
    screen: "prompt-only",
    media: [],
    evidence: "adult-confirms",
    offline: "yes",
  },
  vocabulary: {
    family: "word-cards",
    interaction: "L’enfant nomme, répète et réemploie des mots, objets réels à l’appui.",
    screen: "content",
    media: ["image", "audio"],
    evidence: "adult-confirms",
    offline: "needs-audio",
  },
  "listening-story": {
    family: "audio-narrative",
    interaction: "L’enfant écoute une histoire, puis répond à des questions de compréhension.",
    screen: "content",
    media: ["audio", "image"],
    evidence: "adult-confirms",
    offline: "needs-audio",
  },
  "read-aloud": {
    family: "audio-narrative",
    interaction: "L’adulte lit ou raconte ; l’enfant écoute, sans questions.",
    screen: "prompt-only",
    media: [],
    evidence: "adult-confirms",
    offline: "yes",
  },
  "song-rhyme": {
    family: "audio-narrative",
    interaction: "L’enfant écoute, répète et chante une comptine.",
    screen: "content",
    media: ["audio"],
    evidence: "adult-confirms",
    offline: "needs-audio",
  },
  phonology: {
    family: "sound-game",
    interaction: "Jeu d’oreille : frapper, enlever, retrouver des syllabes et des sons.",
    screen: "prompt-only",
    media: ["audio"],
    evidence: "adult-confirms",
    offline: "yes",
  },
  counting: {
    family: "quantity",
    interaction: "L’enfant compte, montre une quantité, vérifie en comptant.",
    screen: "content",
    media: ["image"],
    evidence: "child-taps",
    offline: "yes",
  },
  matching: {
    family: "group-and-match",
    interaction: "L’enfant associe deux à deux.",
    screen: "content",
    media: ["image"],
    evidence: "child-taps",
    offline: "needs-image",
  },
  sorting: {
    family: "group-and-match",
    interaction: "L’enfant range des objets en catégories et justifie son choix.",
    screen: "content",
    media: ["image"],
    evidence: "child-taps",
    offline: "needs-image",
  },
  "memory-game": {
    family: "group-and-match",
    interaction: "L’enfant retrouve des paires de mémoire.",
    screen: "content",
    media: ["image"],
    evidence: "child-taps",
    offline: "needs-image",
  },
  observation: {
    family: "look-and-name",
    interaction: "L’enfant observe le réel (ou une image), décrit et nomme.",
    screen: "content",
    media: ["image"],
    evidence: "adult-confirms",
    offline: "needs-image",
  },
  drawing: {
    family: "trace-and-draw",
    interaction: "L’enfant dessine sur papier, puis parle de son dessin.",
    screen: "prompt-only",
    media: [],
    evidence: "child-produces",
    offline: "yes",
  },
  "graphic-practice": {
    family: "trace-and-draw",
    interaction: "L’enfant s’entraîne au tracé, sur papier ou à l’écran.",
    screen: "content",
    media: ["image"],
    evidence: "child-produces",
    offline: "yes",
  },
  movement: {
    family: "move",
    interaction: "L’enfant bouge : courir, lancer, danser, franchir. L’écran s’efface.",
    screen: "none",
    media: [],
    evidence: "adult-confirms",
    offline: "yes",
  },
  manipulation: {
    family: "hands-on",
    interaction: "L’enfant manipule de vrais objets pour résoudre un petit problème.",
    screen: "prompt-only",
    media: [],
    evidence: "adult-confirms",
    offline: "yes",
  },
};

/** Activity kinds served by one renderer family. */
export function activityTypesOf(family: RendererFamily): ActivityType[] {
  return ACTIVITY_TYPES.filter((type) => ACTIVITY_RENDERERS[type].family === family);
}
