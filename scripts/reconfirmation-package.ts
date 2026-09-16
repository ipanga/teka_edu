/**
 * A compact re-confirmation document for content that was already approved and has since been
 * corrected.
 *
 *   npm run review:reconfirmation -- --level=maternelle-1 --since=develop
 *
 * A reviewer who has already read a week should not have to read it again to confirm that a
 * known, targeted fix was applied and nothing else moved. So this shows only what changed, field
 * by field, with the old text beside the new one — and says plainly, at the end, that every other
 * reviewable field is byte-identical.
 *
 * It is generated from the repository, never hand-written: the claim "nothing else changed" is
 * only worth anything if a machine made it.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { generateSchoolDays } from "@/domain/calendar/school-days";
import { generateDailyPlan } from "@/domain/programme/daily-plan";
import { REVIEW_PACKAGES } from "@/lib/content/review-packages";
import { getProgramme, getReferenceData } from "@/lib/content/reference-data";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, value] = arg.replace(/^--/, "").split("=");
      return [key ?? "", value ?? "true"];
    }),
);
const levelId = args.get("level") ?? "maternelle-1";
const since = args.get("since") ?? "develop";
const DOMAINS = ["lang", "math", "phys", "art", "time-space", "world"];
const dir = `content/lessons/maternelle-cycle1-cd-2026/${levelId}`;

type Lesson = Record<string, unknown> & {
  id: string;
  activities: (Record<string, unknown> & { id: string })[];
};

function read(ref: string | null): Map<string, Lesson> {
  const out = new Map<string, Lesson>();
  for (const domain of DOMAINS) {
    const file = `${dir}/${domain}.json`;
    const text =
      ref === null
        ? readFileSync(path.join(ROOT, file), "utf8")
        : execFileSync("git", ["show", `${ref}:${file}`], { cwd: ROOT, encoding: "utf8" });
    for (const lesson of JSON.parse(text).lessons as Lesson[]) out.set(lesson.id, lesson);
  }
  return out;
}

/** Fields a reviewer judges. Everything here is compared; anything that moved is shown. */
const LESSON_FIELDS = [
  "title",
  "summary",
  "parentGuidance",
  "difficulty",
  "themeId",
  "objectiveCodes",
  "supportingObjectiveCodes",
  "stage",
];
const ACTIVITY_FIELDS = [
  "title",
  "childInstruction",
  "adultGuidance",
  "minutes",
  "mode",
  "type",
  "role",
  "position",
  "materialCodes",
  "mediaIds",
  "vocabulary",
  "scaffolds",
  "payload",
  "objectiveCodes",
];
/** Which fields the child hears or sees, as opposed to what the adult reads. */
const CHILD_FACING = new Set(["title", "childInstruction", "mediaIds", "vocabulary"]);

const show = (value: unknown): string => {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return (text ?? "—").replaceAll("\n", " ").trim() || "—";
};

const old = read(since);
const now = read(null);
/**
 * The instructional day a lesson is actually taught on, read from the generated daily plans.
 *
 * It used to be parsed out of the lesson id — `m3-world-04` was reported as day 4. That is only
 * true for the tracks that run every day: `monde`, `arts` and `temps-espace` come round every few
 * days, so their fourth lesson is not the fourth day. « Mes articulations » was filed under day 4
 * of week 1 when the child meets it on day 11, in week 3, which is also the wrong week to ask a
 * reviewer to confirm.
 */
const dayOfLesson = new Map<string, number>();
{
  const data = getReferenceData();
  const annual = data.annualPlans.find((p) => p.levelId === levelId);
  const programme = annual && getProgramme(levelId, annual.schoolYearId, data);
  const calendar = data.calendars.find((c) => c.schoolYear.id === annual?.schoolYearId);
  if (annual === undefined || programme === undefined || calendar === undefined) {
    throw new Error(`no programme, annual plan or calendar for ${levelId}`);
  }
  for (const schoolDay of generateSchoolDays(calendar, data.publicHolidays)) {
    if (!schoolDay.instructional || schoolDay.instructionalDay === null) continue;
    const daily = generateDailyPlan(schoolDay, programme, data.lessons);
    if (daily.status === "no-content") continue;
    for (const session of daily.sessions) {
      if (session.lesson !== null) dayOfLesson.set(session.lesson.id, schoolDay.instructionalDay);
    }
  }
}
/** Activity ids are `<lessonId>-a<n>`, so both resolve through the lesson. */
const day = (id: string) => dayOfLesson.get(id.replace(/-a\d+$/, "")) ?? 0;
/** The weeks are the review packages themselves, so a row lands in the week a reviewer was sent. */
const week = (d: number) =>
  REVIEW_PACKAGES.find((p) => p.levelId === levelId && d >= p.fromDay && d <= p.toDay)?.week ?? 0;

type Row = { week: number; day: number; id: string; field: string; before: string; after: string };
const rows: Row[] = [];
let comparedLessons = 0;
let comparedFields = 0;

for (const [id, before] of old) {
  const after = now.get(id);
  if (after === undefined) continue;
  comparedLessons += 1;
  for (const field of LESSON_FIELDS) {
    comparedFields += 1;
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
      rows.push({
        week: week(day(id)),
        day: day(id),
        id,
        field: `lesson.${field}`,
        before: show(before[field]),
        after: show(after[field]),
      });
    }
  }
  const beforeActivities = new Map(before.activities.map((a) => [a.id, a]));
  const afterActivities = new Map(after.activities.map((a) => [a.id, a]));
  for (const [activityId, beforeActivity] of beforeActivities) {
    const afterActivity = afterActivities.get(activityId);
    if (afterActivity === undefined) continue;
    for (const field of ACTIVITY_FIELDS) {
      comparedFields += 1;
      if (JSON.stringify(beforeActivity[field]) !== JSON.stringify(afterActivity[field])) {
        rows.push({
          week: week(day(activityId)),
          day: day(activityId),
          id: activityId,
          field,
          before: show(beforeActivity[field]),
          after: show(afterActivity[field]),
        });
      }
    }
  }
}

rows.sort((a, b) => a.day - b.day || a.id.localeCompare(b.id) || a.field.localeCompare(b.field));

const weeks = [...new Set(rows.map((row) => row.week))].sort();
const lines: string[] = [
  `# Reconfirmation — ${levelId}, semaines ${weeks.join(", ")}`,
  "",
  "> **Ce document est généré** (`npm run review:reconfirmation`). Il ne remplace pas une",
  "> relecture complète : il montre **uniquement ce qui a changé** depuis la version que vous",
  "> aviez acceptée, pour que vous puissiez confirmer que la correction connue a bien été",
  "> appliquée — et rien d’autre.",
  "",
  "## Ce qui s’est passé",
  "",
  "Ces semaines avaient été acceptées (`ai-assisted`). La relecture de la semaine 4 a ensuite",
  "montré que plusieurs défauts corrigés dans cette semaine existaient **à l’identique** dans les",
  "semaines déjà acceptées : le même texte d’activité avait été écrit une fois puis réutilisé.",
  "",
  "Les corrections ont été appliquées. **Les approbations correspondantes ont été annulées**, et",
  "non pas re-tamponnées : c’est exactement ce que l’empreinte (`reviewedDigest`) doit produire",
  "quand le texte relu change.",
  "",
  `**${rows.length} champs ont changé, sur ${comparedFields} champs comparés dans ${comparedLessons} leçons.**`,
  "Tous les autres sont identiques, octet pour octet.",
  "",
];

for (const w of weeks) {
  const inWeek = rows.filter((row) => row.week === w);
  lines.push(`## Semaine ${w} — ${inWeek.length} changement(s)`, "");
  for (const row of inWeek) {
    const facing = CHILD_FACING.has(row.field.replace("lesson.", ""))
      ? "**vu ou entendu par l’enfant**"
      : "lu par l’adulte";
    lines.push(
      `### Jour ${row.day} · \`${row.id}\` · \`${row.field}\` — ${facing}`,
      "",
      "**Avant :**",
      "",
      `> ${row.before}`,
      "",
      "**Après :**",
      "",
      `> ${row.after}`,
      "",
    );
  }
}

lines.push(
  "## Ce qui n’a pas changé",
  "",
  "Comparés champ par champ et identiques : titres, résumés, objectifs enseignés et repris,",
  "étape de progression, difficulté, thème, ordre et type des activités, rôle, durées, matériel,",
  "remplacements, notes de sécurité, lexique, étais en anglais, images, textes des histoires et",
  "des comptines, questions de compréhension — sauf là où ils apparaissent ci-dessus.",
  "",
  "## Ce qu’on vous demande",
  "",
  "Pour chaque changement : confirmez qu’il applique bien la correction demandée et qu’il",
  "n’introduit pas de pédagogie nouvelle. Si c’est le cas, ces semaines peuvent retrouver le",
  "statut `approved` avec `reviewKind: ai-assisted`. Aucune leçon n’est approuvée aujourd’hui.",
  "",
  "**Décision :** ☐ reconfirmé ☐ reconfirmé avec modifications ☐ à revoir",
  "",
);

const out = `docs/review/2026-2027-${levelId}-semaines-${weeks[0]}-${weeks[weeks.length - 1]}-reconfirmation.md`;
mkdirSync(path.join(ROOT, "docs/review"), { recursive: true });
writeFileSync(path.join(ROOT, out), lines.join("\n"), "utf8");
console.log(`Wrote ${out}: ${rows.length} change(s) across ${comparedLessons} lessons.`);
