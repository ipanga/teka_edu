import { readFileSync } from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import { describe, expect, it } from "vitest";
import { getReferenceData } from "@/lib/content/reference-data";
import {
  AUDIT_STATUSES,
  VISUAL_AUDIT_PATH,
  VISUAL_STATE_PATH,
  audioNeedOf,
  buildAuditDocument,
  buildAuditRows,
  deriveState,
  type VisualState,
} from "@/lib/content/visual-audit";

const ROOT = path.resolve(import.meta.dirname, "../..");
const data = getReferenceData();
const state = JSON.parse(readFileSync(path.join(ROOT, VISUAL_STATE_PATH), "utf8")) as VisualState;

/**
 * The tracking system of the September visual upgrade (docs/september-illustration-*.md).
 *
 * The audit is generated, so the test that matters is freshness: the committed document and the
 * derived half of the state file must be exactly what the content and the decisions produce now.
 * A stale audit would tell the next session the wrong resume point.
 */
describe("the September visual audit", () => {
  it("is committed up to date", async () => {
    const auditPath = path.join(ROOT, VISUAL_AUDIT_PATH);
    const expected = await format(buildAuditDocument(data, state), {
      ...(await resolveConfig(auditPath)),
      filepath: auditPath,
    });
    expect(readFileSync(auditPath, "utf8")).toBe(expected);
  });

  it("keeps the derived state in step with the decisions", () => {
    const rows = buildAuditRows(data, state);
    const derived = deriveState(data, state, rows);
    expect(state.derived).toEqual(derived);
  });

  it("covers every activity of both classes exactly once", () => {
    const rows = buildAuditRows(data, state);
    const activities = data.lessons
      .filter((l) => l.levelIds.includes("maternelle-1") || l.levelIds.includes("maternelle-3"))
      .flatMap((l) => l.activities);
    expect(rows.length).toBe(activities.length);
    expect(new Set(rows.map((row) => row.activityId)).size).toBe(rows.length);
    for (const row of rows) {
      expect(AUDIT_STATUSES).toContain(row.status);
      expect(row.day, `${row.activityId} is not on any instructional day`).toBeGreaterThan(0);
      expect(row.route).toMatch(/^\/maternelle\/[13]\/seance\/\d+$/);
    }
  });

  it("gives every shipped asset a verdict, and names no asset that does not exist", () => {
    const ids = new Set(data.media.map((asset) => asset.id));
    for (const id of Object.keys(state.decisions.assets)) {
      expect(ids.has(id), `decision for unknown asset ${id}`).toBe(true);
    }
    for (const id of ids) {
      expect(state.decisions.assets[id], `no verdict for ${id}`).toBeDefined();
    }
  });

  it("never marks progress on an asset the registry does not ship", () => {
    const ids = new Set(data.media.map((asset) => asset.id));
    for (const id of [
      ...(state.decisions.progress?.assetsDone ?? []),
      ...(state.decisions.progress?.assetsQa ?? []),
    ]) {
      expect(ids.has(id), `progress on unknown asset ${id}`).toBe(true);
    }
  });

  it("requires audio nowhere, by decision (ADR-046)", () => {
    for (const lesson of data.lessons) {
      for (const activity of lesson.activities) {
        expect(audioNeedOf(activity).need).not.toBe("required");
      }
    }
  });

  it("names the batch to resume, and it is a batch that exists", () => {
    const ids = state.batches.map((batch) => batch.id);
    if (state.nextBatch !== null) expect(ids).toContain(state.nextBatch);
    if (state.lastCompletedBatch !== null) expect(ids).toContain(state.lastCompletedBatch);
    const inProgress = state.batches.filter((batch) => batch.status === "in-progress");
    expect(inProgress.length, "at most one batch is in progress").toBeLessThanOrEqual(1);
  });
});
