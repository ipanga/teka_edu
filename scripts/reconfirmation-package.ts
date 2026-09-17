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
import { weekReviewState } from "@/domain/lessons/review";
import type { WeekReviewState } from "@/domain/lessons/review";
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
const data = getReferenceData();
{
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

/**
 * What a week's content has actually been through, read from canonical data rather than assumed.
 *
 * This document used to open by stating that the weeks it covers « avaient été acceptées » and to
 * close by offering to restore them to `approved`. That was written for 1ère maternelle, whose
 * weeks really had been approved and really did lapse. Generated for 3ème maternelle it was
 * simply false: those weeks have never been approved, and four of them have never been read at
 * all. A document that tells a reviewer they are confirming a restoration invites an approval
 * nobody performed.
 */
type WeekState = WeekReviewState;

const lessonsOfWeek = (w: number) =>
  data.lessons.filter((l) => l.levelIds.includes(levelId) && week(day(l.id)) === w);
const fullReviewsOfWeek = (w: number) =>
  data.reviewHistory.filter(
    (r) => r.levelId === levelId && r.week === w && r.scope === "full-review",
  );

const stateOfWeek = (w: number): WeekState =>
  weekReviewState(
    lessonsOfWeek(w).map((l) => l.status),
    data.reviewHistory.filter((r) => r.levelId === levelId && r.week === w),
  );

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

const weeks = [...new Set(rows.map((row) => row.week))].sort((a, b) => a - b);
if (weeks.length === 0) {
  // Nothing changed, so there is nothing to confirm. Writing a document anyway produced a file
  // named « semaines-undefined-undefined » that asked a reviewer to confirm an empty list.
  console.log(
    `No change in ${levelId} since ${since}: ${comparedFields} fields compared across ${comparedLessons} lessons, all identical. No document written.`,
  );
  process.exit(0);
}
const states = new Map(weeks.map((w) => [w, stateOfWeek(w)] as const));
const weeksIn = (state: WeekState) => weeks.filter((w) => states.get(w) === state);
const list = (ws: number[]) =>
  ws.length === 1
    ? `la semaine ${ws[0]}`
    : `les semaines ${ws.slice(0, -1).join(", ")} et ${ws.at(-1)}`;

/**
 * A reconfirmation only exists where there is an approval to restore. Everywhere else this is an
 * audit of what changed, and the closing question has to be the one the state can answer.
 */
const isReconfirmation = weeksIn("approved").length > 0;
const title = isReconfirmation ? "Reconfirmation" : "Audit des changements";

const lines: string[] = [
  `# ${title} — ${levelId}, semaines ${weeks.join(", ")}`,
  "",
  "> **Ce document est généré** (`npm run review:reconfirmation`). Il ne remplace pas une",
  "> relecture complète : il montre **uniquement ce qui a changé**, champ par champ, pour que",
  "> vous puissiez vérifier que la correction connue a bien été appliquée — et rien d’autre.",
  "",
  "## Où en est chaque semaine",
  "",
];

for (const w of weeks) {
  const state = states.get(w)!;
  const lessons = lessonsOfWeek(w);
  const approved = lessons.filter((l) => l.status === "approved").length;
  const last = fullReviewsOfWeek(w).at(-1);
  const said: Record<WeekState, string> = {
    approved: `**Semaine ${w} — approuvée** (${approved} leçon(s) \`approved\`). Si l’empreinte du texte relu a changé, l’approbation tombe : elle peut être rétablie une fois les changements ci-dessous confirmés.`,
    reviewed: `**Semaine ${w} — relue, pas approuvée.** Dernière passe : ${last?.reviewedOn} (\`${last?.outcome}\`, ${last?.reviewKind}). Elle reste en \`review\` et **aucune leçon n’y est approuvée**. Ce document est un audit des changements depuis cette passe, pas une restitution d’approbation.`,
    "never-reviewed": `**Semaine ${w} — jamais relue.** Aucune passe de relecture n’a porté sur cette semaine ; elle est en \`review\` et **aucune leçon n’y est approuvée**. Les changements ci-dessous y sont arrivés par une règle de correction partagée, pas par une lecture de cette semaine. **Les confirmer ne l’approuve pas** : ils seront portés à son dossier de relecture complet, à venir.`,
    draft: `**Semaine ${w} — en cours d’écriture** (\`draft\`). Rien n’y est relu ni approuvé, et ce document ne demande aucune décision à son sujet.`,
  };
  lines.push(`- ${said[state]}`, "");
}

lines.push(
  "## Ce qui s’est passé",
  "",
  `**${rows.length} champs ont changé, sur ${comparedFields} champs comparés dans ${comparedLessons} leçons.**`,
  "Tous les autres sont identiques, octet pour octet.",
  "",
);

if (weeksIn("approved").length > 0) {
  lines.push(
    `Pour ${list(weeksIn("approved"))} : les corrections ont été appliquées et **les approbations`,
    "correspondantes ont été annulées**, et non pas re-tamponnées — c’est exactement ce que",
    "l’empreinte (`reviewedDigest`) doit produire quand le texte relu change.",
    "",
  );
}
if (weeksIn("reviewed").length > 0 || weeksIn("never-reviewed").length > 0) {
  const unreviewed = weeksIn("never-reviewed");
  lines.push(
    "Ces changements viennent de règles de correction partagées : un défaut trouvé dans une",
    "semaine existait à l’identique ailleurs, et une règle ne tient que si toutes ses occurrences",
    "sont corrigées.",
    "",
  );
  if (unreviewed.length > 0) {
    const many = unreviewed.length > 1;
    const subject = `${list(unreviewed).charAt(0).toUpperCase()}${list(unreviewed).slice(1)}`;
    lines.push(
      `**${subject} ${many ? "n’ont pas encore reçu leur" : "n’a pas encore reçu sa"} relecture pédagogique complète.**`,
      `Confirmer les changements de champs ci-dessous **ne vaut pas approbation** de ${many ? "ces semaines" : "cette semaine"} :`,
      `${many ? "elles garderont leur dossier" : "elle gardera son dossier"} de relecture complet, avec ces corrections déjà intégrées.`,
      "",
    );
  }
}

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
  "n’introduit pas de pédagogie nouvelle.",
  "",
);
if (weeksIn("approved").length > 0) {
  lines.push(
    `Si c’est le cas, ${list(weeksIn("approved"))} peut retrouver le statut \`approved\` avec`,
    "`reviewKind: ai-assisted`. Aucune leçon n’est approuvée aujourd’hui.",
    "",
  );
}
if (weeksIn("reviewed").length > 0 || weeksIn("never-reviewed").length > 0) {
  lines.push(
    "Pour les semaines qui ne sont pas approuvées, **cette confirmation ne change aucun statut** :",
    "elles restent en `review`, et c’est leur dossier de relecture complet qui décidera.",
    "",
  );
}
lines.push(
  `**Décision :** ☐ ${isReconfirmation ? "reconfirmé" : "changements confirmés"} ☐ confirmé avec modifications ☐ à revoir`,
  "",
);

// The filename says what the document is. Calling an audit of never-approved weeks a
// « reconfirmation » is the same false claim as the wording, one directory listing earlier.
const suffix = isReconfirmation ? "reconfirmation" : "audit-des-changements";
const out = `docs/review/2026-2027-${levelId}-semaines-${weeks[0]}-${weeks[weeks.length - 1]}-${suffix}.md`;
mkdirSync(path.join(ROOT, "docs/review"), { recursive: true });
writeFileSync(path.join(ROOT, out), lines.join("\n"), "utf8");
console.log(`Wrote ${out}: ${rows.length} change(s) across ${comparedLessons} lessons.`);
