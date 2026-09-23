/**
 * Regenerates the September visual audit and the derived half of its state file.
 *
 *   npm run visual:audit
 *
 * Reads docs/september-illustration-state.json (decisions, written by a person), the content and
 * the media registry; writes docs/september-illustration-audit.md and the `derived` block of the
 * state file. Deterministic: a unit test fails if either committed copy is out of date.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import { getReferenceData } from "@/lib/content/reference-data";
import {
  VISUAL_AUDIT_PATH,
  VISUAL_STATE_PATH,
  buildAuditDocument,
  buildAuditRows,
  deriveState,
  type VisualState,
} from "@/lib/content/visual-audit";
import { type FinalQa, QA_TRACKER_PATH, buildQaTracker } from "@/lib/content/visual-qa-tracker";

const ROOT = path.resolve(import.meta.dirname, "..");
const statePath = path.join(ROOT, VISUAL_STATE_PATH);
const auditPath = path.join(ROOT, VISUAL_AUDIT_PATH);

const data = getReferenceData();
const state = JSON.parse(readFileSync(statePath, "utf8")) as VisualState;
const rows = buildAuditRows(data, state);
const derived = deriveState(data, state, rows);

const nextState: VisualState = { ...state, derived };
/** Formatted with the repository's Prettier options, so `npm run format:check` stays green. */
const pretty = async (file: string, text: string) =>
  format(text, { ...(await resolveConfig(file)), filepath: file });
writeFileSync(statePath, await pretty(statePath, JSON.stringify(nextState, null, 2)), "utf8");
writeFileSync(auditPath, await pretty(auditPath, buildAuditDocument(data, nextState)), "utf8");
const finalQa = (state as VisualState & { finalQa?: FinalQa }).finalQa;
if (finalQa !== undefined) {
  const trackerPath = path.join(ROOT, QA_TRACKER_PATH);
  writeFileSync(trackerPath, await pretty(trackerPath, buildQaTracker(data, finalQa)), "utf8");
}

console.log(
  `${VISUAL_AUDIT_PATH}: ${derived.counts.lessons} lessons, ${derived.counts.activities} activities, ` +
    `${derived.counts.assets} assets · pending: ${derived.pendingIllustration.length} pictures, ` +
    `${derived.pendingAudio.length} recordings, ${derived.pendingAnimation.length} activities awaiting motion`,
);
