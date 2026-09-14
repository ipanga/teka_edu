/**
 * Builds the human review package: a Markdown document a teacher can read without opening
 * JSON or the database (docs/PEDAGOGICAL_REVIEW.md, ADR-035).
 *
 * Pure and deterministic: generated from the canonical content, never hand-written, so it
 * cannot drift from what the application actually serves. `npm run review:package` writes it
 * and a unit test fails if the committed file is out of date.
 */
import { generateSchoolDays } from "@/domain/calendar/school-days";
import { findText } from "@/domain/lessons/texts";
import {
  ageBandOfLevel,
  findCompetency,
  findObjective,
  successExamplesFor,
} from "@/domain/curriculum/objectives";
import type { Syllabus } from "@/domain/curriculum/objectives";
import type { Curriculum } from "@/domain/curriculum/types";
import type { Activity, Lesson } from "@/domain/lessons/types";
import { generateDailyPlan } from "@/domain/programme/daily-plan";
import type { DailyPlan } from "@/domain/programme/types";
import { type ReferenceData, getProgramme, getSyllabus } from "./reference-data";

/** The checklist a reviewer fills in. Kept here so the document and the rubric stay in step. */
export const REVIEW_CHECKLIST: readonly { key: string; question: string }[] = [
  {
    key: "objective-alignment",
    question: "L’activité travaille-t-elle réellement l’objectif annoncé ?",
  },
  { key: "age", question: "Est-ce réaliste pour un enfant de 5 ans (3ème maternelle) ?" },
  { key: "clarity", question: "La consigne enfant et la guidance adulte sont-elles claires ?" },
  {
    key: "cognitive-load",
    question: "La difficulté est-elle juste (ni trop facile, ni trop complexe) ?",
  },
  { key: "duration", question: "La durée annoncée est-elle réaliste ?" },
  { key: "engagement", question: "L’enfant agit-il vraiment, au lieu de regarder ?" },
  { key: "language", question: "Le français proposé est-il accessible et utile à l’acquisition ?" },
  {
    key: "culture",
    question: "Les exemples sont-ils compréhensibles en RDC (ville comme village) ?",
  },
  { key: "materials", question: "Le matériel est-il trouvable à la maison, ou remplaçable ?" },
  { key: "safety", question: "L’activité est-elle sans risque pour un enfant de cet âge ?" },
];

/**
 * Official statements are quoted verbatim, and 43 of them are several lines: an opening line
 * such as « Utiliser : » followed by the bullets it introduces. Rendering only the first line
 * showed the reviewer a heading with nothing under it — which reads as missing curriculum text
 * rather than as a rendering fault. Every line is kept, indented so the Markdown bullet it sits
 * in stays intact.
 */
function officialText(statement: string | undefined, indent = ""): string {
  if (statement === undefined) return "?";
  return statement
    .split("\n")
    .map((line, index) => (index === 0 ? line : `${indent}  ${line}`))
    .join("\n");
}

const MODE_LABEL: Record<string, string> = {
  "off-screen": "sans écran",
  "on-screen": "à l’écran",
  mixed: "mixte (écran puis action)",
};

/**
 * The story, rhyme or song an activity names by id, quoted in full, plus the questions the child
 * will be asked. Without this the reviewer is asked to judge « L'histoire de Kumu » from its
 * title alone — and no one can approve a text they have not read. The text is Teka Edu's own
 * (`content/texts/`), so quoting it here reproduces nothing outside the project.
 */
function teachingTextBlock(activity: Activity, data: ReferenceData): string[] {
  const textId = activity.payload["textId"];
  if (typeof textId !== "string") return [];
  const text = findText(data.texts, textId);
  if (text === undefined) {
    // Failing generation is the point: a package that names a story it cannot quote asks a
    // reviewer to approve something they were never shown. That happened once already.
    throw new RangeError(
      `review package: activity "${activity.id}" uses text "${textId}", which is not in content/texts/`,
    );
  }
  const kind = text.kind === "story" ? "Histoire" : "Comptine";
  const lines = [
    `- **${kind} lue à l’enfant — « ${text.title} »** (${text.minutes} min, \`${text.id}\`) :`,
    "",
    ...text.lines.map((line) => `  > ${line}`),
    "",
    `  _${text.provenance}_`,
    "",
  ];
  const questions = activity.payload["questions"];
  if (Array.isArray(questions) && questions.length > 0) {
    lines.push(
      `- **Questions posées à l’enfant après l’écoute (${questions.length}) :**`,
      "",
      ...questions.map((question, index) => `  ${index + 1}. ${String(question)}`),
      "",
    );
  }
  return lines;
}

function activityBlock(activity: Activity, data: ReferenceData, syllabus: Syllabus): string[] {
  const used = activity.materialCodes.map((code) => data.materials.find((m) => m.code === code));
  const materials = activity.materialCodes
    .map((code, index) => used[index]?.name ?? code)
    .join(", ");
  const scaffold = activity.scaffolds.find((s) => s.language === "en");
  const lines = [
    `#### ${activity.position}. ${activity.title} — ${activity.minutes} min, ${MODE_LABEL[activity.mode] ?? activity.mode} (${activity.type})`,
    "",
    `- **Consigne à l’enfant :** « ${activity.childInstruction} »`,
    `- **Guidance adulte :** ${activity.adultGuidance}`,
    `- **Matériel :** ${materials}`,
  ];
  if (activity.vocabulary.length > 0) {
    lines.push(
      `- **Lexique visé :** ${activity.vocabulary.map((v) => (v.en ? `${v.fr} _(${v.en})_` : v.fr)).join(" · ")}`,
    );
  }
  for (const material of used) {
    if (material?.alternatives) lines.push(`- **À défaut :** ${material.alternatives}`);
    if (material?.safetyNote) lines.push(`- **⚠ Sécurité :** ${material.safetyNote}`);
  }
  if (scaffold)
    lines.push(`- **Aide en anglais (optionnelle) :** « ${scaffold.childInstruction} »`);
  const extension = activity.payload["extension"];
  if (typeof extension === "string") {
    lines.push(
      `- **Extension facultative (proposée seulement si l’enfant en redemande) :** ${extension}`,
    );
  }
  lines.push(
    `- **Objectifs travaillés :** ${activity.objectiveCodes
      .map((code) => `\`${code}\` ${officialText(findObjective(syllabus, code)?.statement, "  ")}`)
      .join(" ; ")}`,
  );
  lines.push("");
  lines.push(...teachingTextBlock(activity, data));
  return lines;
}

/**
 * Official evidence of progress. The programme lists its "exemples de réussite" per competency
 * and age band, never per objective, so they are shown once per competency and said to be such:
 * putting them beside one activity would suggest a link the official tables do not make.
 */
function successExampleBlock(
  lesson: Lesson,
  syllabus: Syllabus,
  bandCode: string | null,
): string[] {
  if (bandCode === null) return [];
  const competencyCodes = [
    ...new Set(
      [...lesson.objectiveCodes, ...lesson.supportingObjectiveCodes]
        .map((code) => findObjective(syllabus, code)?.competencyCode)
        .filter((code): code is string => code !== undefined),
    ),
  ];
  const lines: string[] = [];
  for (const code of competencyCodes) {
    const competency = findCompetency(syllabus, code);
    const objective = lesson.objectiveCodes
      .map((objectiveCode) => findObjective(syllabus, objectiveCode))
      .find((candidate) => candidate?.competencyCode === code);
    const examples = objective ? successExamplesFor(syllabus, objective, bandCode) : [];
    if (competency === undefined || examples.length === 0) continue;
    lines.push(
      `**Réussites attendues — texte officiel pour la compétence « ${competency.title} » (${bandCode}) :**`,
      "",
      ...examples.map((example) => `- ${officialText(example.statement, "")}`),
      "",
      "_Ces exemples illustrent toute la compétence, pas seulement cette leçon ; le programme précise qu’ils ne sont pas exhaustifs._",
      "",
    );
  }
  return lines;
}

function lessonBlock(
  lesson: Lesson,
  domainTitle: string,
  minutes: number,
  data: ReferenceData,
  syllabus: Syllabus,
  bandCode: string | null,
): string[] {
  const lines = [
    `### ${lesson.title} — ${domainTitle} (${minutes} min)`,
    "",
    `_${lesson.summary}_`,
    "",
    `- **Statut :** \`${lesson.status}\` · **origine :** ${lesson.origin} · **étape :** ${lesson.stage} · **difficulté :** ${lesson.difficulty}/3`,
    `- **Conseil au parent :** ${lesson.parentGuidance}`,
  ];
  const objectives = lesson.objectiveCodes.map((code) => {
    const objective = findObjective(syllabus, code);
    return `  - \`${code}\` — ${officialText(objective?.statement, "  ")} _(source : ${objective?.sourceId ?? "?"})_`;
  });
  lines.push("- **Objectifs enseignés :**", ...objectives);
  if (lesson.supportingObjectiveCodes.length > 0) {
    lines.push(
      "- **Objectifs repris (déjà vus) :**",
      ...lesson.supportingObjectiveCodes.map((code) => {
        const objective = findObjective(syllabus, code);
        return `  - \`${code}\` — ${officialText(objective?.statement, "  ")}`;
      }),
    );
  }
  lines.push("");
  for (const activity of lesson.activities) {
    lines.push(...activityBlock(activity, data, syllabus));
  }
  lines.push(...successExampleBlock(lesson, syllabus, bandCode));
  lines.push(
    "**Avis du relecteur / de la relectrice :**",
    "",
    "| Critère | OK / à revoir | Commentaire |",
    "| --- | --- | --- |",
    ...REVIEW_CHECKLIST.map((item) => `| ${item.question} |  |  |`),
    "",
    "> Décision : ☐ accepté ☐ accepté avec modifications ☐ à refaire — _à remplir par la personne qui relit_",
    "",
  );
  return lines;
}

function dayBlock(
  plan: DailyPlan,
  data: ReferenceData,
  curriculum: Curriculum | undefined,
  syllabus: Syllabus,
  bandCode: string | null,
): string[] {
  const domainTitle = (code: string) =>
    curriculum?.domains.find((domain) => domain.code === code)?.title ?? code;
  const lines = [
    `## Jour ${plan.instructionalDay} — ${plan.date}`,
    "",
    `**Durée totale : ${plan.totalMinutes} min** · **temps d’écran actif de l’enfant : ${plan.screenMinutes} min** · ${plan.sessions.length} séances · jour ${plan.rhythmDay} du rythme`,
    "",
    "_L’adulte, lui, peut lire les consignes sur l’écran : le chiffre ci-dessus compte le temps",
    "pendant lequel **l’enfant** manipule ou regarde l’écran, pas le temps d’allumage de",
    "l’appareil._",
    "",
    `**Matériel à préparer :** ${plan.materialCodes
      .map((code) => data.materials.find((m) => m.code === code)?.name ?? code)
      .join(", ")}`,
    "",
  ];
  for (const session of plan.sessions) {
    if (session.lesson === null) {
      lines.push(`### (contenu à écrire) — ${domainTitle(session.domainCode)}`, "");
      continue;
    }
    lines.push(
      ...lessonBlock(
        session.lesson,
        domainTitle(session.domainCode),
        session.minutes,
        data,
        syllabus,
        bandCode,
      ),
    );
  }
  return lines;
}

/** The whole review package for one level and school year. */
export function buildReviewPackage(
  data: ReferenceData,
  options: { levelId: string; schoolYearId: string; week: number; fromDay: number; toDay: number },
): string {
  const calendar = data.calendars.find((c) => c.schoolYear.id === options.schoolYearId);
  const programme = getProgramme(options.levelId, options.schoolYearId, data);
  if (calendar === undefined || programme === undefined) {
    throw new RangeError(`no programme for ${options.levelId} in ${options.schoolYearId}`);
  }
  const syllabus = getSyllabus(programme.curriculumId, data);
  const curriculum = data.curricula.find((c) => c.id === programme.curriculumId);
  const band = curriculum ? ageBandOfLevel(curriculum, options.levelId) : undefined;
  const level = data.levels.find((l) => l.id === options.levelId);
  const schoolDays = generateSchoolDays(calendar, data.publicHolidays);

  const plans: DailyPlan[] = [];
  for (let day = options.fromDay; day <= options.toDay; day++) {
    const schoolDay = schoolDays.find((d) => d.instructionalDay === day);
    if (schoolDay === undefined) break;
    plans.push(generateDailyPlan(schoolDay, programme, data.lessons));
  }

  const lessons = plans.flatMap((plan) =>
    plan.sessions.flatMap((session) => (session.lesson ? [session.lesson] : [])),
  );
  const activities = lessons.flatMap((lesson) => lesson.activities);

  const header = [
    `# Dossier de relecture pédagogique — ${level?.name ?? options.levelId}, ${calendar.schoolYear.label}`,
    "",
    `**Semaine ${options.week}** · jours d’instruction ${options.fromDay} à ${options.toDay}`,
    "",
    "> **Ce document est généré automatiquement** à partir du contenu du dépôt",
    "> (`npm run review:package`). Ne le modifiez pas à la main : corrigez le contenu, puis",
    "> régénérez-le. Les leçons sont **écrites par Teka Edu** et **ne sont approuvées par**",
    "> **personne** tant que cette relecture n’a pas conclu.",
    "",
    "## Ce qu’on vous demande",
    "",
    "Vous lisez ici la première semaine de programme telle qu’un parent la recevrait. Pour chaque",
    "leçon, dites si elle convient à un enfant de 5 ans en RDC, et signalez ce qui vous gêne :",
    "une consigne trop longue, une durée irréaliste, un matériel introuvable, un exemple mal choisi,",
    "un objectif qui ne correspond pas à l’activité. Les tableaux de relecture sont là pour cela.",
    "",
    "Une leçon ne pourra passer au statut « approuvé » qu’après votre accord explicite. Votre",
    "conclusion est enregistrée telle quelle — « accepté », « accepté avec modifications » ou",
    "« à revoir » — ainsi que la nature de la relecture : assistée par IA, ou faite par une",
    "personne qui enseigne à cet âge. Les deux ne sont pas présentées comme équivalentes.",
    "",
    "## Repères",
    "",
    `- **Niveau :** ${level?.name ?? options.levelId} · **tranche d’âge du programme :** ${band?.label ?? "—"}`,
    `- **Curriculum :** ${curriculum?.name ?? programme.curriculumId} (version ${curriculum?.version ?? "?"})`,
    `- **Référence officielle :** ${curriculum?.reference.citation ?? "—"}`,
    `- **Séance visée :** ${programme.sessionMinutes.min}–${programme.sessionMinutes.max} min par jour, à la maison, avec un adulte`,
    "- **Ce n’est pas un objectif à atteindre.** La séance peut être mise en pause, coupée en",
    "  deux moments plus courts, ou arrêtée avant la fin quand l’enfant fatigue. L’application",
    "  propose « Faire une petite pause » et « Terminer pour aujourd’hui » à chaque activité, et",
    "  reprend là où l’on s’était arrêté. Une séance écourtée est une séance normale : jugez les",
    "  activités, pas la capacité d’un enfant à tenir 35 minutes.",
    `- **Contenu relu ici :** ${plans.length} jours · ${lessons.length} leçons · ${activities.length} activités`,
    "",
    "Les objectifs et les « réussites attendues » sont cités mot pour mot du programme officiel ;",
    "les leçons, les consignes et les activités sont rédigées par Teka Edu.",
    "",
  ];

  const footer = [
    "## Avis d’ensemble",
    "",
    "| Question | Réponse |",
    "| --- | --- |",
    "| La semaine est-elle adaptée à des enfants de 5 ans en RDC ? |  |",
    "| Le rythme quotidien (langage, mathématiques, activité physique, domaine tournant) convient-il ? |  |",
    "| La durée quotidienne est-elle réaliste à la maison ? |  |",
    "| L’aide en anglais est-elle utile, et assez discrète ? |  |",
    "| Que faudrait-il ajouter ou retirer avant d’écrire la suite de l’année ? |  |",
    "",
    "**Relecteur / relectrice :** ______________________  **Rôle :** ______________________",
    "",
    "**Date :** ______________  **Décision globale :** ☐ semaine acceptée ☐ acceptée avec modifications ☐ à refaire",
    "",
  ];

  const body = plans.flatMap((plan) =>
    dayBlock(plan, data, curriculum, syllabus, band?.code ?? null),
  );
  const document = [...header, ...body, ...footer].join("\n");
  const missing = incompleteBullets(document);
  if (missing.length > 0) {
    throw new RangeError(
      `review package: ${missing.length} bullet(s) promise a list and deliver nothing — ${missing[0]}`,
    );
  }
  return document;
}

/**
 * A bullet whose text ends on a colon promises a list. If nothing indented follows, the reviewer
 * sees a heading with no content — which reads as missing curriculum rather than as a rendering
 * fault. Official statements are quoted verbatim and many are several lines, so this is exactly
 * how the truncation bug looked before it was found.
 */
export function incompleteBullets(document: string): string[] {
  const lines = document.split("\n");
  const problems: string[] = [];
  lines.forEach((line, index) => {
    if (!/^\s*[-*] .*:\s*$/.test(line)) return;
    let next = index + 1;
    while (next < lines.length && lines[next]!.trim() === "") next += 1;
    if (next >= lines.length || !/^\s{2,}\S/.test(lines[next]!)) {
      problems.push(`ligne ${index + 1}: « ${line.trim()} »`);
    }
  });
  return problems;
}
