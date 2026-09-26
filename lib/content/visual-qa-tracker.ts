/**
 * The final September visual QA tracker (docs/work/SEPTEMBER_VISUAL_QA.md): one row per picture,
 * with the decision a person took and every fact the repository can state about it.
 *
 * Judgements (purpose, quality, importance, decision, reason) live in the `finalQa` block of
 * `docs/september-illustration-state.json`; facts (file, classes, lessons, hashes, approval
 * impact, status) are computed here from canonical content. The baseline hashes are the pictures
 * as `develop` holds them — the version the reviewer approved — recorded once in the state so the
 * tracker never needs Git to be rebuilt. A unit test fails if the committed tracker is stale, and,
 * once the set is frozen, if any picture's bytes move.
 */
import type { ReferenceData } from "./reference-data";
import { dayOfLessonMap, picturesOf } from "./visual-audit";

export const QA_TRACKER_PATH = "docs/work/SEPTEMBER_VISUAL_QA.md";
export const FREEZE_MARKER = "SEPTEMBER_VISUAL_ASSETS_FROZEN_FOR_RECONFIRMATION";
export const CONTACT_SHEET = "docs/review/media/septembre-avant-apres.png";

export type QaGroup = "A" | "B" | "C";
export type QaStatus =
  | "pending-review"
  | "accepted"
  | "needs-refinement"
  | "needs-redraw"
  | "redrawn"
  | "verified"
  | "reconfirmation-ready";

export type FinalQa = {
  pass: string;
  frozen: boolean;
  assets: Record<
    string,
    { group: QaGroup; purpose: string; quality: string; importance: string; reason: string }
  >;
  /** Seven answers per story or rhyme picture, in the order of STORY_QUESTIONS. */
  storyReview: Record<string, string[]>;
  baselineHashes: Record<string, string>;
  frozenHashes: Record<string, string>;
  resumePoint: string;
};

export const STORY_QUESTIONS = [
  "Que doit comprendre l’enfant ?",
  "Le personnage, l’objet ou l’action est-il évident ?",
  "Soutient-elle l’écoute sans la remplacer ?",
  "Information inutile ?",
  "Assez engageante ?",
  "Tient-elle sur une télévision ?",
  "Une image suffit-elle ?",
] as const;

const GROUP_LABEL: Record<QaGroup, string> = {
  A: "A — accepter tel quel",
  B: "B — affiner",
  C: "C — redessiner",
};

export type QaRow = {
  id: string;
  file: string;
  kind: string;
  classes: string[];
  lessons: string[];
  activities: string[];
  changed: boolean;
  baseline: string | null;
  current: string;
  lapsed: number;
  /** Approved lessons whose approval was granted on or after this pass (reconfirmed). */
  reconfirmed: number;
  /** Approved lessons whose approval predates this pass: must be 0 for a changed picture. */
  approved: number;
  status: QaStatus;
  group: QaGroup | null;
};

const short = (hash: string | null | undefined) => (hash ? hash.slice(7, 19) : "—");

export function buildQaRows(data: ReferenceData, qa: FinalQa): QaRow[] {
  const levelName = new Map(data.levels.map((l) => [l.id, l.name]));
  return data.media.map((asset): QaRow => {
    const users = data.lessons.filter((l) =>
      l.activities.some((a) => picturesOf(a, data).includes(asset.id)),
    );
    const activities = users.flatMap((l) =>
      l.activities.filter((a) => picturesOf(a, data).includes(asset.id)).map((a) => a.id),
    );
    const baseline = qa.baselineHashes[asset.id] ?? null;
    const changed = baseline !== asset.contentHash;
    const decision = qa.assets[asset.id];
    const frozenOk = qa.frozen && qa.frozenHashes[asset.id] === asset.contentHash;
    const status: QaStatus =
      decision === undefined
        ? "pending-review"
        : qa.frozen && !frozenOk
          ? decision.group === "C"
            ? "needs-redraw"
            : "needs-refinement"
          : frozenOk
            ? changed
              ? // Every lesson that shows it has been reconfirmed: the picture is settled.
                users.every((l) => l.status === "approved")
                ? "verified"
                : "reconfirmation-ready"
              : "accepted"
            : changed
              ? "verified"
              : "accepted";
    return {
      id: asset.id,
      file: `public/media/${asset.file}`,
      kind: asset.kind,
      classes: [
        ...new Set(users.flatMap((l) => l.levelIds.map((id) => levelName.get(id) ?? id))),
      ].sort(),
      lessons: users.map((l) => l.id).sort(),
      activities: activities.sort(),
      changed,
      baseline,
      current: asset.contentHash,
      lapsed: users.filter((l) => l.status === "review").length,
      reconfirmed: users.filter(
        (l) => l.status === "approved" && (l.review?.reviewedOn ?? "") >= qa.pass,
      ).length,
      approved: users.filter(
        (l) => l.status === "approved" && (l.review?.reviewedOn ?? "") < qa.pass,
      ).length,
      status,
      group: decision?.group ?? null,
    };
  });
}

const cell = (s: string) => s.replaceAll("|", "\\|").replaceAll("\n", " ");

export function buildQaTracker(data: ReferenceData, qa: FinalQa): string {
  const rows = buildQaRows(data, qa);
  const count = (p: (r: QaRow) => boolean) => rows.filter(p).length;
  const lapsedLessons = new Set(
    data.lessons
      .filter((l) => l.status === "review")
      .filter((l) =>
        l.activities.some((a) =>
          picturesOf(a, data).some((id) => rows.find((r) => r.id === id)?.changed),
        ),
      )
      .map((l) => l.id),
  );
  const days = new Map<string, number>();
  for (const level of ["maternelle-1", "maternelle-3"]) {
    for (const [id, day] of dayOfLessonMap(level, data)) days.set(id, day);
  }

  const lines: string[] = [
    `# September visual QA — the ${rows.length} pictures`,
    "",
    "> **Generated** by `npm run visual:audit` from canonical content and the `finalQa` block of",
    "> `docs/september-illustration-state.json`. Do not edit by hand: change a decision in the state",
    "> file and regenerate. A unit test fails when this file is stale and, once frozen, when any",
    "> picture's bytes move.",
    "",
    qa.frozen
      ? `**\`${FREEZE_MARKER}\`** — the ${rows.length} pictures are frozen at the hashes below. Any change now means a new reconfirmation.`
      : "**Not frozen yet.** Pictures may still change; do not submit the reconfirmation packages.",
    "",
    "## Resume point",
    "",
    qa.resumePoint,
    "",
    "## Totals",
    "",
    "| Measure | Count |",
    "| --- | --- |",
    `| Assets reviewed in this pass (${qa.pass}) | ${count((r) => r.group !== null)} / ${rows.length} |`,
    `| A — accepted as-is | ${count((r) => r.group === "A")} |`,
    `| B — refined | ${count((r) => r.group === "B")} |`,
    `| C — redrawn | ${count((r) => r.group === "C")} |`,
    `| Changed since \`develop\` (what the reviewer approved) | ${count((r) => r.changed)} |`,
    `| Byte-identical to \`develop\` | ${count((r) => !r.changed)} |`,
    `| Lessons still awaiting reconfirmation for a changed picture | ${lapsedLessons.size} |`,
    `| Lessons re-approved after the visual reconfirmation | ${data.lessons.filter((l) => l.status === "approved" && (l.review?.reviewedOn ?? "") >= qa.pass).length} |`,
    `| Pictures still \`needs-refinement\` or \`needs-redraw\` | ${count((r) => r.status === "needs-refinement" || r.status === "needs-redraw")} |`,
    "",
    "Groups describe this final pass: A is right as it stands (it may have been redrawn in the first",
    "pass), B was refined here, C was redrawn here. The before/after sheet of every changed picture",
    `is \`${CONTACT_SHEET}\`.`,
    "",
    "## Every picture",
    "",
    "| Asset | File | Type | Classes | Lessons (activities) | Purpose | Quality before this pass | Importance | Decision | Reason | Before (`develop`) | After | Approval impact | Status |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of rows) {
    const d = qa.assets[r.id];
    const impact = !r.changed
      ? "none — bytes unchanged"
      : [
          r.lapsed > 0 ? `${r.lapsed} lapsed, awaiting reconfirmation` : "",
          r.reconfirmed > 0 ? `${r.reconfirmed} reconfirmed and re-approved` : "",
          r.approved > 0 ? `${r.approved} approved before this pass — ERROR` : "",
        ]
          .filter(Boolean)
          .join("; ");
    lines.push(
      `| \`${r.id}\` | \`${r.file}\` | ${r.kind} | ${r.classes.join(", ") || "none (no lesson reads it yet)"} | ${r.lessons.length} (${r.activities.length}) | ${cell(d?.purpose ?? "—")} | ${cell(d?.quality ?? "—")} | ${d?.importance ?? "—"} | ${d ? GROUP_LABEL[d.group] : "—"} | ${cell(d?.reason ?? "—")} | ${r.changed ? `\`${short(r.baseline)}\`` : "unchanged"} | ${r.changed ? `\`${short(r.current)}\`, sheet` : "—"} | ${impact} | \`${r.status}\` |`,
    );
  }

  lines.push(
    "",
    "## Story and rhyme pictures, one by one",
    "",
    `| Picture | ${STORY_QUESTIONS.join(" | ")} |`,
    `| --- | ${STORY_QUESTIONS.map(() => "---").join(" | ")} |`,
    ...Object.entries(qa.storyReview).map(
      ([id, answers]) => `| \`${id}\` | ${answers.map(cell).join(" | ")} |`,
    ),
    "",
    "One picture per story stays the rule: none of the answers above called for a second one, and a",
    "read-aloud is not a picture book (the child listens; the picture is where the eyes rest).",
    "",
    "## Lessons still awaiting reconfirmation, by class and day",
    "",
    "| Lesson | Day | Changed pictures it shows |",
    "| --- | --- | --- |",
    ...[...lapsedLessons]
      .sort((a, b) => a.localeCompare(b) || (days.get(a) ?? 0) - (days.get(b) ?? 0))
      .map((id) => {
        const lesson = data.lessons.find((l) => l.id === id)!;
        const pics = [
          ...new Set(
            lesson.activities.flatMap((a) =>
              picturesOf(a, data).filter((p) => rows.find((r) => r.id === p)?.changed),
            ),
          ),
        ];
        return `| \`${id}\` | ${days.get(id) ?? "—"} | ${pics.map((p) => `\`${p}\``).join(", ")} |`;
      }),
    "",
  );
  return lines.join("\n");
}
