import { readFileSync } from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import { describe, expect, it } from "vitest";
import { getReferenceData } from "@/lib/content/reference-data";
import { VISUAL_STATE_PATH } from "@/lib/content/visual-audit";
import {
  type FinalQa,
  QA_TRACKER_PATH,
  STORY_QUESTIONS,
  buildQaRows,
  buildQaTracker,
} from "@/lib/content/visual-qa-tracker";

const ROOT = path.resolve(import.meta.dirname, "../..");
const data = getReferenceData();
const qa = (
  JSON.parse(readFileSync(path.join(ROOT, VISUAL_STATE_PATH), "utf8")) as { finalQa: FinalQa }
).finalQa;

describe("the final September visual QA tracker", () => {
  it("is committed up to date", async () => {
    const file = path.join(ROOT, QA_TRACKER_PATH);
    const expected = await format(buildQaTracker(data, qa), {
      ...(await resolveConfig(file)),
      filepath: file,
    });
    expect(readFileSync(file, "utf8")).toBe(expected);
  });

  it("gives every shipped picture exactly one decision, and none to a picture that does not exist", () => {
    const ids = new Set(data.media.map((a) => a.id));
    expect(Object.keys(qa.assets).sort()).toEqual([...ids].sort());
    expect(Object.keys(qa.baselineHashes).sort()).toEqual([...ids].sort());
  });

  it("answers the seven questions for every story and rhyme picture", () => {
    const pictures = new Set(
      data.texts.map((t) => t.illustrationId).filter((id): id is string => id !== null),
    );
    for (const id of pictures) expect(qa.storyReview[id]?.length, id).toBe(STORY_QUESTIONS.length);
  });

  it("never leaves a changed picture under an approval older than its reconfirmation", () => {
    // A lesson showing a redrawn picture is either still at `review`, or was re-approved on or
    // after the visual reconfirmation, with a digest computed on the frozen picture.
    for (const row of buildQaRows(data, qa)) {
      if (row.changed) expect(row.approved, `${row.id} changed under a standing approval`).toBe(0);
    }
  });

  it("keeps the shapes byte-identical to what the reviewer approved", () => {
    for (const row of buildQaRows(data, qa).filter((r) => r.kind === "shape")) {
      expect(row.changed, row.id).toBe(false);
    }
  });

  it("holds every picture at its frozen bytes once the set is frozen", () => {
    if (!qa.frozen) return;
    for (const asset of data.media) {
      expect(asset.contentHash, `${asset.id} moved after the freeze`).toBe(
        qa.frozenHashes[asset.id],
      );
    }
  });
});
