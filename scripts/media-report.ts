/**
 * What September shows the child, and what it still cannot.
 *
 *   npm run media:report
 *
 * Answers the question that decides where media effort goes next: which activities *need* a
 * picture, which merely benefit, which are better with no screen at all — and which of them are
 * still missing what they need.
 *
 * The classification is derived from the activity itself, never hand-maintained: an activity that
 * tells the child to look at something needs a picture, and one that tells them to run does not.
 */
import { ACTIVITY_RENDERERS } from "@/domain/lessons/renderers";
import type { Activity } from "@/domain/lessons/types";
import { getReferenceData } from "@/lib/content/reference-data";

type Need = "required" | "useful" | "not-needed";

/**
 * Does the child have to see something on the screen for this activity to work?
 *
 *  - **required**: the renderer is built around pictures — showing a named shape, sorting images,
 *    counting a collection. Counting is always covered: when a lesson names no picture, the
 *    renderer draws plain counters, which is exactly what a handful of cailloux does.
 *  - **useful**: a picture would help, but the activity stands without one.
 *  - **not-needed**: the work happens in the mouth, the ears, the hands or the legs — or the
 *    child is looking at the real thing, which beats any drawing. "Où est-ce que ça plie ?" wants
 *    the child's own elbow, not a picture of an elbow.
 */
function visualNeed(activity: Activity): Need {
  const family = ACTIVITY_RENDERERS[activity.type].family;
  if (family === "move" || family === "sound-game") return "not-needed";
  if (family === "quantity") return "required";
  const hasRealObjects = activity.materialCodes.some((code) => code !== "aucun");
  if (family === "look-and-name" || family === "group-and-match") {
    if (activity.mediaIds.length > 0) return "required";
    // Real objects in front of the child are better than a drawing of them.
    return hasRealObjects ? "not-needed" : "useful";
  }
  if (family === "word-cards") return "required";
  if (family === "audio-narrative" || family === "trace-and-draw" || family === "hands-on") {
    return "useful";
  }
  return "not-needed";
}

/**
 * Whether the screen actually has something to show. Counting always does: the renderer draws
 * counters when the lesson names no picture.
 */
function isCovered(activity: Activity): boolean {
  if (activity.mediaIds.length > 0) return true;
  return ACTIVITY_RENDERERS[activity.type].family === "quantity";
}

/** Would a recording help, beyond the parent reading aloud? Nothing requires it today. */
function audioNeed(activity: Activity): Need {
  const family = ACTIVITY_RENDERERS[activity.type].family;
  if (family === "sound-game" || family === "audio-narrative" || family === "word-cards") {
    return "useful";
  }
  return "not-needed";
}

/** Does the screen offer something to tap, in a way that teaches? */
function isInteractive(activity: Activity): boolean {
  const family = ACTIVITY_RENDERERS[activity.type].family;
  if (activity.mode === "off-screen" && family !== "quantity") {
    return family === "group-and-match" || family === "look-and-name"
      ? activity.mediaIds.length > 1
      : false;
  }
  return (
    family === "quantity" ||
    ((family === "group-and-match" || family === "look-and-name") && activity.mediaIds.length > 1)
  );
}

const data = getReferenceData();
const activities = data.lessons.flatMap((lesson) =>
  lesson.activities.map((activity) => ({ lesson, activity })),
);

const rows = activities.map(({ lesson, activity }) => ({
  lesson,
  activity,
  visual: visualNeed(activity),
  audio: audioNeed(activity),
  interactive: isInteractive(activity),
  hasMedia: activity.mediaIds.length > 0,
  covered: isCovered(activity),
  offScreen: activity.mode === "off-screen",
}));

const count = (predicate: (row: (typeof rows)[number]) => boolean) => rows.filter(predicate).length;
const pad = (value: string | number, width = 4) => String(value).padStart(width);
const line = "─".repeat(84);

console.log(line);
console.log(
  `Septembre 2026 · 3ème maternelle · ${data.lessons.length} leçons · ${rows.length} activités`,
);
console.log(line);

console.log("\nBesoin d’images");
for (const need of ["required", "useful", "not-needed"] as const) {
  const inNeed = rows.filter((row) => row.visual === need);
  const covered = inNeed.filter((row) => row.covered).length;
  console.log(
    `  ${need.padEnd(12)} ${pad(inNeed.length)} activités   ${pad(covered)} avec image   ` +
      `${pad(inNeed.length - covered)} sans`,
  );
}

const missing = rows.filter((row) => row.visual === "required" && !row.covered);
console.log(`\n  ✗ Écrans qui n’ont rien à montrer : ${missing.length}`);
for (const row of missing) {
  console.log(`      ${row.activity.id.padEnd(16)} ${row.activity.title}`);
}

const opportunities = rows.filter((row) => row.visual === "useful" && !row.covered);
console.log(`\n  ~ Images qui aideraient, pas encore faites : ${opportunities.length}`);
for (const row of opportunities.slice(0, 8)) {
  console.log(`      ${row.activity.id.padEnd(16)} ${row.activity.title}`);
}
if (opportunities.length > 8) console.log(`      … et ${opportunities.length - 8} autres`);

console.log("\nBesoin de son (aucun n’est bloquant : l’adulte lit)");
for (const need of ["useful", "not-needed"] as const) {
  console.log(`  ${need.padEnd(12)} ${pad(count((row) => row.audio === need))} activités`);
}
console.log(`  fichiers audio présents : 0`);

console.log("\nÉcran et interaction");
console.log(`  sans écran            ${pad(count((row) => row.offScreen))}`);
console.log(`  avec écran            ${pad(count((row) => !row.offScreen))}`);
console.log(`  interactives          ${pad(count((row) => row.interactive))}`);
console.log(`  images au total       ${pad(count((row) => row.hasMedia))}`);

console.log("\nBibliothèque");
const byKind = new Map<string, number>();
for (const asset of data.media) byKind.set(asset.kind, (byKind.get(asset.kind) ?? 0) + 1);
for (const [kind, total] of [...byKind].sort()) console.log(`  ${kind.padEnd(12)} ${pad(total)}`);
console.log(`  textes        ${pad(data.texts.length)} (histoires et comptines)`);

const unused = data.media.filter(
  (asset) => !rows.some((row) => row.activity.mediaIds.includes(asset.id)),
);
if (unused.length > 0) {
  console.log(`\n  Assets jamais utilisés : ${unused.map((asset) => asset.id).join(", ")}`);
}
console.log("");
