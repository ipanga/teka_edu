import { describe, expect, it } from "vitest";
import { shownPictureIds } from "@/domain/lessons/pictures";

describe("which pictures a child sees (domain/lessons/pictures.ts)", () => {
  const rhyme = { kind: "rhyme" as const, illustrationId: "comptine-compter" };
  const story = { kind: "story" as const, illustrationId: "histoire-kumu" };

  it("lets a story's picture lead its story", () => {
    expect(
      shownPictureIds({ type: "listening-story", mediaIds: ["animal-poussin"] }, story),
    ).toEqual(["histoire-kumu"]);
  });

  it("lets a task's own picture lead a rhyme said over it", () => {
    expect(shownPictureIds({ type: "song-rhyme", mediaIds: ["histoire-pluie"] }, rhyme)).toEqual([
      "histoire-pluie",
    ]);
  });

  it("falls back to the rhyme's picture when the task names none", () => {
    expect(shownPictureIds({ type: "song-rhyme", mediaIds: [] }, rhyme)).toEqual([
      "comptine-compter",
    ]);
  });

  it("never shows a text's picture outside a story or rhyme screen", () => {
    expect(shownPictureIds({ type: "drawing", mediaIds: [] }, rhyme)).toEqual([]);
    expect(
      shownPictureIds({ type: "vocabulary", mediaIds: ["objet-porte", "objet-seau"] }, null),
    ).toEqual(["objet-porte", "objet-seau"]);
  });
});
