/** Read-only content snapshot for the independent September review. */
import { writeFileSync, readFileSync } from "node:fs";
import { getReferenceData } from "../lib/content/reference-data";
import { buildAuditRows, type VisualState } from "../lib/content/visual-audit";
import { sessionForDay } from "../lib/programme/session-view";
const data = getReferenceData();
const state = JSON.parse(
  readFileSync("docs/september-illustration-state.json", "utf8"),
) as VisualState;
const rows = buildAuditRows(data, state);
const sessions = [1, 3].flatMap((level) =>
  Array.from({ length: 22 }, (_, i) => ({
    level,
    day: i + 1,
    session: sessionForDay(`maternelle-${level}`, i + 1),
  })),
);
writeFileSync(
  "docs/review/media/astra-baseline/inventory.json",
  JSON.stringify(
    { baseline: "a0b743b997f1effc5f83981e0f32f19514c10251", rows, sessions },
    null,
    2,
  ) + "\n",
);
console.log({
  lessons: data.lessons.length,
  approved: data.lessons.filter((l) => l.status === "approved").length,
  activities: rows.length,
  assets: data.media.length,
  audio: rows.reduce(
    (a, r) => ({ ...a, [r.audio]: (a[r.audio] ?? 0) + 1 }),
    {} as Record<string, number>,
  ),
});
