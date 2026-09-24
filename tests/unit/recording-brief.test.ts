import { readFileSync } from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import { describe, expect, it } from "vitest";
import { getReferenceData } from "@/lib/content/reference-data";
import { RECORDING_BRIEF_PATH, buildRecordingBrief } from "@/lib/content/recording-brief";

const ROOT = path.resolve(import.meta.dirname, "../..");
const data = getReferenceData();

describe("the September recording package (ADR-046)", () => {
  it("is committed up to date", async () => {
    const file = path.join(ROOT, RECORDING_BRIEF_PATH);
    const expected = await format(buildRecordingBrief(data), {
      ...(await resolveConfig(file)),
      filepath: file,
    });
    expect(readFileSync(file, "utf8")).toBe(expected);
  });

  it("scripts every taught word exactly as the lesson writes it", () => {
    const brief = buildRecordingBrief(data);
    for (const lesson of data.lessons) {
      for (const activity of lesson.activities) {
        if (activity.type !== "vocabulary") continue;
        for (const entry of activity.vocabulary) expect(brief, entry.fr).toContain(entry.fr);
      }
    }
  });

  it("uses file names the registry schema accepts, and claims no recording exists", () => {
    const brief = buildRecordingBrief(data);
    for (const [, file] of brief.matchAll(/\| `([a-z0-9-]+\/[^`]+)` \|/g)) {
      expect(file).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+\.mp3$/);
    }
    expect(data.audio).toEqual([]);
  });
});
