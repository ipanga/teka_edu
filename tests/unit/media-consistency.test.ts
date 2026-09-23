import { describe, expect, it } from "vitest";
import { getReferenceData } from "@/lib/content/reference-data";
import { mediaContradictions, mediaFindings, stems } from "@/lib/content/media-consistency";

const data = getReferenceData();

/**
 * The picture a child sees must belong to what the activity asks (lib/content/media-consistency.ts).
 * Added after the 3ème visual reconfirmation found « Le bruit de la pluie » showing the counting
 * rhyme's three-finger hand.
 */
describe("every picture on screen belongs to its activity", () => {
  it("finds no picture that shares nothing with what the child is asked", () => {
    const found = mediaContradictions(data).map(
      (f) => `${f.activityId} « ${f.activityTitle} » shows ${f.pictureId} (${f.pictureAlt})`,
    );
    expect(found).toEqual([]);
  });

  it("audits every activity that shows a picture", () => {
    const shown = new Set(mediaFindings(data).map((f) => f.activityId));
    expect(shown.size).toBeGreaterThan(100);
  });

  it("catches a rhyme's picture leading a task the rhyme is only said over", () => {
    // The defect itself, rebuilt: making rain, with the month's counting rhyme said on top.
    const lesson = data.lessons.find((l) => l.id === "m3-art-04")!;
    const defective = {
      ...data,
      lessons: [
        {
          ...lesson,
          activities: lesson.activities.map((a) =>
            a.id === "m3-art-04-a1" ? { ...a, mediaIds: [] } : a,
          ),
        },
      ],
    };
    const found = mediaContradictions(defective);
    expect(found.map((f) => [f.activityId, f.pictureId])).toEqual([
      ["m3-art-04-a1", "comptine-compter"],
    ]);
  });

  it("does not confuse a rhyme with counting", () => {
    expect(stems("comptine")).not.toEqual(stems("compter"));
    expect([...stems("compte")]).toEqual([...stems("compter")]);
  });
});
