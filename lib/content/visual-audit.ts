/**
 * The September visual audit: every activity of both classes, what it shows, what it could
 * sound like, how it could move, and where the upgrade stands (docs/september-illustration-*.md).
 *
 * Two inputs, one rule about them:
 *
 *  - **The content** decides the facts — which family renders an activity, whether it has a
 *    picture, whether a recording exists. Nothing here is typed in by hand.
 *  - **The state file** (`docs/september-illustration-state.json`) decides the judgments — is this
 *    asset good enough, what does this family need, which batch did the work — and records
 *    progress. Its `decisions` block is written by a person; its `derived` block is written here.
 *
 * The audit document is generated from both, so it cannot drift from the repository, and a unit
 * test fails when the committed copy is stale. That is what makes the task resumable: a fresh
 * session regenerates the audit and reads exactly where the previous one stopped.
 */
import { generateSchoolDays } from "@/domain/calendar/school-days";
import { ACTIVITY_RENDERERS, type RendererFamily } from "@/domain/lessons/renderers";
import type { Activity, Lesson } from "@/domain/lessons/types";
import { generateDailyPlan } from "@/domain/programme/daily-plan";
import type { ReferenceData } from "./reference-data";
import { getProgramme } from "./reference-data";

export const VISUAL_AUDIT_PATH = "docs/september-illustration-audit.md";
export const VISUAL_STATE_PATH = "docs/september-illustration-state.json";

export const AUDIT_STATUSES = [
  "not-reviewed",
  "reviewed-no-change",
  "needs-illustration-update",
  "needs-audio",
  "needs-animation",
  "needs-ux-adjustment",
  "implemented",
  "qa-passed",
] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export type AssetVerdict = "keep" | "refine" | "replace";
export type Priority = "P0" | "P1" | "P2" | "P3";
/**
 * How much a human recording would help (ADR-046). No class makes audio a requirement: every
 * word is on the page and the parent can say it. `important-for-pronunciation` marks the words
 * and sound models a child is expected to imitate, which is where a wrong model does harm.
 */
export const AUDIO_NEEDS = [
  "not-needed",
  "optional",
  "recommended",
  "important-for-pronunciation",
] as const;
export type AudioNeed = (typeof AUDIO_NEEDS)[number];
/** The classes that call for a recording to be made. */
export const WANTS_RECORDING = (need: AudioNeed) =>
  need === "recommended" || need === "important-for-pronunciation";

export type VisualState = {
  version: number;
  task: string;
  updatedOn: string;
  lastCompletedBatch: string | null;
  nextBatch: string | null;
  batches: readonly {
    id: string;
    title: string;
    branch: string;
    status: "pending" | "in-progress" | "done";
    scope: string;
  }[];
  decisions: {
    assets: Record<string, { verdict: AssetVerdict; priority: Priority; note: string }>;
    families: Record<string, { ux: string; animation: string; audio: string }>;
    activities: Record<string, { note: string }>;
    audio: { policy: string; recordingBrief: string };
    progress?: {
      /** Asset ids whose redraw or refinement has landed. */
      assetsDone?: readonly string[];
      /** Asset ids checked on screen after landing. */
      assetsQa?: readonly string[];
      /** Renderer families whose UX adjustments have landed. */
      uxFamiliesDone?: readonly string[];
      /** Renderer families whose motion has landed. */
      animationFamiliesDone?: readonly string[];
      /** Whether the pronunciation and rhyme listen controls exist in the renderer. */
      audioPlumbingDone?: boolean;
      /** Families checked on screen at phone, tablet and desktop widths. */
      qaFamiliesDone?: readonly string[];
      /** Every child-facing wording change, so none is silent. */
      wordingChanges?: readonly {
        activityId: string;
        before: string;
        after: string;
        why: string;
      }[];
    };
  };
  derived: unknown;
};

export type AuditRow = {
  levelId: string;
  levelName: string;
  day: number;
  route: string;
  lessonId: string;
  lessonTitle: string;
  domainCode: string;
  activityId: string;
  activityTitle: string;
  type: string;
  family: RendererFamily;
  /** The pictures the child sees: named directly or carried by the story it reads. */
  pictures: readonly string[];
  picture: string;
  audio: AudioNeed;
  audioNote: string;
  /** Whether every recording the activity could use exists in the registry. */
  recordingExists: boolean;
  animation: string;
  ux: string;
  action: string;
  priority: Priority | "—";
  status: AuditStatus;
  note: string;
};

/**
 * Would a human recording teach something the page cannot? Derived from the activity, never
 * typed in by hand, so the plan follows the content.
 */
export function audioNeedOf(activity: Activity): { need: AudioNeed; note: string } {
  const family = ACTIVITY_RENDERERS[activity.type].family;
  if (family === "word-cards" && activity.vocabulary.length > 0) {
    return { need: "important-for-pronunciation", note: "prononciation des mots enseignés" };
  }
  if (family === "sound-game") {
    return {
      need: "important-for-pronunciation",
      note: "un modèle sonore des syllabes ou des rimes",
    };
  }
  if (activity.type === "song-rhyme")
    return { need: "recommended", note: "le rythme de la comptine" };
  if (activity.type === "listening-story" || activity.type === "read-aloud") {
    return { need: "optional", note: "narration, pour un jour où l’adulte ne peut pas lire" };
  }
  return { need: "not-needed", note: "" };
}

/** The pictures an activity puts on screen, wherever they come from. */
export function picturesOf(activity: Activity, data: ReferenceData): string[] {
  const ids = [...activity.mediaIds];
  const textId = activity.payload["textId"];
  if (typeof textId === "string") {
    const illustration = data.texts.find((text) => text.id === textId)?.illustrationId;
    if (illustration) ids.push(illustration);
  }
  return [...new Set(ids)];
}

const PRIORITY_ORDER: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
const STATUS_ORDER: Record<AuditStatus, number> = {
  "not-reviewed": 0,
  "needs-illustration-update": 1,
  "needs-ux-adjustment": 2,
  "needs-animation": 3,
  "needs-audio": 4,
  implemented: 5,
  "qa-passed": 6,
  "reviewed-no-change": 7,
};

/** The instructional day each lesson is taught on, read from the generated daily plans. */
export function dayOfLessonMap(levelId: string, data: ReferenceData): Map<string, number> {
  const days = new Map<string, number>();
  const annual = data.annualPlans.find((plan) => plan.levelId === levelId);
  const programme = annual && getProgramme(levelId, annual.schoolYearId, data);
  const calendar = data.calendars.find((c) => c.schoolYear.id === annual?.schoolYearId);
  if (annual === undefined || programme === undefined || calendar === undefined) return days;
  for (const schoolDay of generateSchoolDays(calendar, data.publicHolidays)) {
    if (!schoolDay.instructional || schoolDay.instructionalDay === null) continue;
    const daily = generateDailyPlan(schoolDay, programme, data.lessons);
    if (daily.status === "no-content") continue;
    for (const session of daily.sessions) {
      if (session.lesson !== null) days.set(session.lesson.id, schoolDay.instructionalDay);
    }
  }
  return days;
}

const SLUG: Record<string, string> = {
  "maternelle-1": "1",
  "maternelle-2": "2",
  "maternelle-3": "3",
};

export function buildAuditRows(data: ReferenceData, state: VisualState): AuditRow[] {
  const progress = state.decisions.progress ?? {};
  const assetsDone = new Set(progress.assetsDone ?? []);
  const assetsQa = new Set(progress.assetsQa ?? []);
  const uxDone = new Set(progress.uxFamiliesDone ?? []);
  const motionDone = new Set(progress.animationFamiliesDone ?? []);
  const qaDone = new Set(progress.qaFamiliesDone ?? []);
  const recorded = new Set(data.audio.map((asset) => asset.transcript.trim().toLowerCase()));
  const narrated = new Set(data.texts.filter((t) => t.audioId !== null).map((t) => t.id));

  const rows: AuditRow[] = [];
  for (const levelId of ["maternelle-1", "maternelle-3"]) {
    const levelName = data.levels.find((level) => level.id === levelId)?.name ?? levelId;
    const days = dayOfLessonMap(levelId, data);
    const lessons = data.lessons
      .filter((lesson) => lesson.levelIds.includes(levelId))
      .sort((a, b) => (days.get(a.id) ?? 0) - (days.get(b.id) ?? 0) || a.id.localeCompare(b.id));
    for (const lesson of lessons) rows.push(...rowsOfLesson(lesson, levelId, levelName, days));
  }
  return rows;

  function rowsOfLesson(
    lesson: Lesson,
    levelId: string,
    levelName: string,
    days: Map<string, number>,
  ): AuditRow[] {
    const day = days.get(lesson.id) ?? 0;
    return lesson.activities.map((activity): AuditRow => {
      const family = ACTIVITY_RENDERERS[activity.type].family;
      const pictures = picturesOf(activity, data);
      const familyDecision = state.decisions.families[family];
      const { need, note: audioNote } = audioNeedOf(activity);

      // ---- the picture ----------------------------------------------------------------------
      const verdicts = pictures.map((id) => ({
        id,
        verdict: state.decisions.assets[id]?.verdict ?? "keep",
        priority: state.decisions.assets[id]?.priority ?? "P3",
      }));
      const toChange = verdicts.filter((v) => v.verdict !== "keep");
      let picture: string;
      if (pictures.length === 0) {
        picture =
          family === "quantity"
            ? "compteurs dessinés par l’écran"
            : family === "move" || family === "sound-game"
              ? "sans image, par choix (sans écran)"
              : "sans image — l’enfant regarde le réel (ISSUE-024)";
      } else {
        picture = verdicts
          .map(
            (v) =>
              `${v.id} (${v.verdict === "keep" ? "garder" : v.verdict === "refine" ? "affiner" : "redessiner"})`,
          )
          .join(", ");
      }

      // ---- the status, worst part first ------------------------------------------------------
      const parts: AuditStatus[] = [];
      if (toChange.length > 0) {
        if (toChange.every((v) => assetsQa.has(v.id))) parts.push("qa-passed");
        else if (toChange.every((v) => assetsDone.has(v.id))) parts.push("implemented");
        else parts.push("needs-illustration-update");
      }
      if (familyDecision !== undefined) {
        parts.push(
          qaDone.has(family)
            ? "qa-passed"
            : uxDone.has(family)
              ? "implemented"
              : "needs-ux-adjustment",
        );
        if (familyDecision.animation !== "none") {
          parts.push(
            qaDone.has(family)
              ? "qa-passed"
              : motionDone.has(family)
                ? "implemented"
                : "needs-animation",
          );
        }
      }
      const hasRecording =
        (family === "word-cards" &&
          activity.vocabulary.length > 0 &&
          activity.vocabulary.every((entry) => recorded.has(entry.fr.trim().toLowerCase()))) ||
        (typeof activity.payload["textId"] === "string" &&
          narrated.has(activity.payload["textId"]));
      if (WANTS_RECORDING(need) && !hasRecording) parts.push("needs-audio");

      const status: AuditStatus =
        parts.length === 0
          ? "reviewed-no-change"
          : parts.sort((a, b) => STATUS_ORDER[a] - STATUS_ORDER[b])[0]!;

      // ---- the action and the priority -------------------------------------------------------
      const actions: string[] = [];
      if (toChange.length > 0) {
        actions.push(
          `image : ${toChange.map((v) => `${v.verdict === "refine" ? "affiner" : "redessiner"} ${v.id}`).join(", ")}`,
        );
      }
      if (familyDecision !== undefined) actions.push(`écran : ${familyDecision.ux}`);
      if (familyDecision !== undefined && familyDecision.animation !== "none") {
        actions.push(`mouvement : ${familyDecision.animation}`);
      }
      if (WANTS_RECORDING(need))
        actions.push(`son : ${audioNote} (enregistrement humain, quand il existera)`);
      const priority: Priority | "—" =
        toChange.length > 0
          ? toChange
              .map((v) => v.priority)
              .sort((a, b) => PRIORITY_ORDER[a] - PRIORITY_ORDER[b])[0]!
          : pictures.length > 0 || family === "word-cards" || family === "audio-narrative"
            ? "P2"
            : "P3";

      return {
        levelId,
        levelName,
        day,
        route: `/maternelle/${SLUG[levelId] ?? "?"}/seance/${day}`,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        domainCode: lesson.domainCode,
        activityId: activity.id,
        activityTitle: activity.title,
        type: activity.type,
        family,
        pictures,
        picture,
        audio: need,
        audioNote,
        recordingExists: hasRecording,
        animation: familyDecision?.animation ?? "none",
        ux: familyDecision?.ux ?? "—",
        action: actions.length === 0 ? "aucune" : actions.join(" · "),
        priority,
        status,
        note: state.decisions.activities[activity.id]?.note ?? "",
      };
    });
  }
}

export type DerivedState = {
  generatedOn: string;
  counts: {
    lessons: number;
    activities: number;
    assets: number;
    byStatus: Record<AuditStatus, number>;
    byAudioNeed: Record<AudioNeed, number>;
    assetsByVerdict: Record<AssetVerdict, number>;
  };
  audited: { lessons: string[]; activities: number };
  implemented: { lessons: string[] };
  qaPassed: { lessons: string[] };
  pendingAudio: string[];
  pendingAnimation: string[];
  pendingIllustration: string[];
  assets: Record<
    string,
    { verdict: AssetVerdict; priority: Priority; status: AuditStatus; usedBy: string[] }
  >;
  lastCompletedBatch: string | null;
  nextBatch: string | null;
};

export function deriveState(
  data: ReferenceData,
  state: VisualState,
  rows: AuditRow[],
): DerivedState {
  const progress = state.decisions.progress ?? {};
  const assetsDone = new Set(progress.assetsDone ?? []);
  const assetsQa = new Set(progress.assetsQa ?? []);
  const byStatus = Object.fromEntries(AUDIT_STATUSES.map((s) => [s, 0])) as Record<
    AuditStatus,
    number
  >;
  const byAudioNeed: Record<AudioNeed, number> = {
    "not-needed": 0,
    optional: 0,
    recommended: 0,
    "important-for-pronunciation": 0,
  };
  for (const row of rows) {
    byStatus[row.status] += 1;
    byAudioNeed[row.audio] += 1;
  }
  const lessonStatus = new Map<string, AuditStatus[]>();
  for (const row of rows)
    lessonStatus.set(row.lessonId, [...(lessonStatus.get(row.lessonId) ?? []), row.status]);
  const lessonsWhere = (predicate: (statuses: AuditStatus[]) => boolean) =>
    [...lessonStatus].filter(([, statuses]) => predicate(statuses)).map(([id]) => id);
  const settled = (s: AuditStatus) =>
    s === "implemented" || s === "qa-passed" || s === "reviewed-no-change";

  const usedBy = new Map<string, Set<string>>();
  for (const row of rows) {
    for (const id of row.pictures)
      usedBy.set(id, new Set([...(usedBy.get(id) ?? []), row.lessonId]));
  }
  const assets: DerivedState["assets"] = {};
  const assetsByVerdict: Record<AssetVerdict, number> = { keep: 0, refine: 0, replace: 0 };
  for (const asset of data.media) {
    const decision = state.decisions.assets[asset.id];
    const verdict = decision?.verdict ?? "keep";
    assetsByVerdict[verdict] += 1;
    assets[asset.id] = {
      verdict,
      priority: decision?.priority ?? "P3",
      status:
        verdict === "keep"
          ? "reviewed-no-change"
          : assetsQa.has(asset.id)
            ? "qa-passed"
            : assetsDone.has(asset.id)
              ? "implemented"
              : "needs-illustration-update",
      usedBy: [...(usedBy.get(asset.id) ?? [])].sort(),
    };
  }

  return {
    generatedOn: state.updatedOn,
    counts: {
      lessons: lessonStatus.size,
      activities: rows.length,
      assets: data.media.length,
      byStatus,
      byAudioNeed,
      assetsByVerdict,
    },
    audited: { lessons: [...lessonStatus.keys()], activities: rows.length },
    implemented: { lessons: lessonsWhere((statuses) => statuses.every(settled)) },
    qaPassed: {
      lessons: lessonsWhere((statuses) =>
        statuses.every((s) => s === "qa-passed" || s === "reviewed-no-change"),
      ),
    },
    pendingAudio: rows
      .filter((row) => WANTS_RECORDING(row.audio) && !row.recordingExists)
      .map((row) => row.activityId),
    pendingAnimation: rows
      .filter(
        (row) =>
          row.animation !== "none" && !(progress.animationFamiliesDone ?? []).includes(row.family),
      )
      .map((row) => row.activityId),
    pendingIllustration: Object.entries(assets)
      .filter(([, asset]) => asset.status === "needs-illustration-update")
      .map(([id]) => id),
    assets,
    lastCompletedBatch: state.lastCompletedBatch,
    nextBatch: state.nextBatch,
  };
}

// ---- the document ------------------------------------------------------------------------------

const cell = (value: string) => value.replaceAll("|", "\\|").replaceAll("\n", " ");

export function buildAuditDocument(data: ReferenceData, state: VisualState): string {
  const rows = buildAuditRows(data, state);
  const derived = deriveState(data, state, rows);
  const lines: string[] = [];
  const push = (...items: string[]) => lines.push(...items);

  push(
    "# Audit visuel de septembre — 1ère et 3ème maternelle",
    "",
    "> **Ce document est généré** (`npm run visual:audit`) à partir du contenu et de",
    "> `docs/september-illustration-state.json`. Les faits (famille d’écran, images, sons) viennent du",
    "> contenu ; les jugements (garder, affiner, redessiner ; priorité ; état) viennent du fichier",
    "> d’état. Ne le modifiez pas à la main : modifiez l’état, puis régénérez. Un test échoue si",
    "> la copie commise n’est plus à jour.",
    "",
    `Généré le ${derived.generatedOn} · dernier lot terminé : ${derived.lastCompletedBatch ?? "aucun"} · lot suivant : ${derived.nextBatch ?? "aucun"}`,
    "",
    "## Couverture",
    "",
    "| Mesure | Valeur |",
    "| --- | --- |",
    `| Leçons auditées | ${derived.counts.lessons} |`,
    `| Activités auditées | ${derived.counts.activities} |`,
    `| Images dans la bibliothèque | ${derived.counts.assets} (garder ${derived.counts.assetsByVerdict.keep}, affiner ${derived.counts.assetsByVerdict.refine}, redessiner ${derived.counts.assetsByVerdict.replace}) |`,
    `| Leçons dont tout est fait | ${derived.implemented.lessons.length} |`,
    `| Leçons passées en QA | ${derived.qaPassed.lessons.length} |`,
    "",
    "### Activités par état",
    "",
    "| État | Activités |",
    "| --- | --- |",
    ...AUDIT_STATUSES.map((s) => `| \`${s}\` | ${derived.counts.byStatus[s]} |`),
    "",
    "L’état d’une activité est le pire de ses parties : image, écran, mouvement, son. Une activité",
    "`reviewed-no-change` n’a rien à changer nulle part.",
    "",
    "### Son",
    "",
    "| Besoin | Activités |",
    "| --- | --- |",
    `| \`important-for-pronunciation\` | ${derived.counts.byAudioNeed["important-for-pronunciation"]} |`,
    `| \`recommended\` | ${derived.counts.byAudioNeed.recommended} |`,
    `| \`optional\` | ${derived.counts.byAudioNeed.optional} |`,
    `| \`not-needed\` | ${derived.counts.byAudioNeed["not-needed"]} |`,
    "",
    "Aucune activité n’exige un enregistrement : l’adulte peut toujours dire le mot (ADR-046).",
    "Le paquet d’enregistrement : `docs/audio/septembre-script-enregistrement.md`.",
    "",
    `Enregistrements disponibles : ${data.audio.length}. ${state.decisions.audio.policy}`,
    "",
    "## Les images, une par une",
    "",
    "| Image | Type | Verdict | Priorité | État | Utilisée par (leçons) | Pourquoi |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  );
  const assetsSorted = data.media
    .map((asset) => ({ asset, d: derived.assets[asset.id]! }))
    .sort(
      (a, b) =>
        PRIORITY_ORDER[a.d.priority] - PRIORITY_ORDER[b.d.priority] ||
        b.d.usedBy.length - a.d.usedBy.length ||
        a.asset.id.localeCompare(b.asset.id),
    );
  for (const { asset, d } of assetsSorted) {
    const note = state.decisions.assets[asset.id]?.note ?? "";
    push(
      `| \`${asset.id}\` | ${asset.kind} | ${d.verdict} | ${d.priority} | \`${d.status}\` | ${d.usedBy.length} | ${cell(note)} |`,
    );
  }

  push(
    "",
    "## Règles par famille d’écran",
    "",
    "| Famille | Écran | Mouvement | Son |",
    "| --- | --- | --- | --- |",
  );
  for (const [family, decision] of Object.entries(state.decisions.families)) {
    push(
      `| \`${family}\` | ${cell(decision.ux)} | ${cell(decision.animation)} | ${cell(decision.audio)} |`,
    );
  }

  for (const levelId of ["maternelle-1", "maternelle-3"]) {
    const ofLevel = rows.filter((row) => row.levelId === levelId);
    push(
      "",
      `## ${ofLevel[0]?.levelName ?? levelId} — ${ofLevel.length} activités`,
      "",
      "| Jour | Leçon | Activité | Famille | Image | Son | Mouvement | Action | Prio | État |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    );
    for (const row of ofLevel) {
      push(
        `| [${row.day}](${row.route}) | \`${row.lessonId}\` ${cell(row.lessonTitle)} | \`${row.activityId}\` ${cell(row.activityTitle)} | \`${row.family}\` | ${cell(row.picture)} | ${row.audio}${row.audioNote ? ` — ${cell(row.audioNote)}` : ""} | ${cell(row.animation)} | ${cell(row.action)}${row.note ? ` — _${cell(row.note)}_` : ""} | ${row.priority} | \`${row.status}\` |`,
      );
    }
  }

  push(
    "",
    "## Lecture",
    "",
    "- **Jour** est le jour d’instruction, et le lien ouvre la séance sur l’application.",
    "- **Image** dit ce que l’enfant voit, et le verdict porté sur chaque image (garder, affiner,",
    "  redessiner). « Sans image — l’enfant regarde le réel » reprend ISSUE-024 : ces écrans sont",
    "  mieux sans dessin.",
    "- **Son** est un besoin, jamais une exigence : aucune activité ne dépend d’un enregistrement.",
    "- **Action** est ce que le lot correspondant fait ; **État** est où il en est.",
    "",
  );
  return lines.join("\n");
}
