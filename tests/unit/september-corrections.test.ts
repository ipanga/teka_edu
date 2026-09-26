import { describe, expect, it } from "vitest";
import { getReferenceData } from "@/lib/content/reference-data";

const data = getReferenceData();
const activity = (id: string) =>
  data.lessons
    .flatMap((candidate) => candidate.activities)
    .find((candidate) => candidate.id === id)!;

describe("the bounded September pedagogical and media corrections", () => {
  it("keeps the two open sorts limited to their approved rounds and squares", () => {
    for (const id of ["m1-math-16-a1", "m1-math-19-a1"]) {
      const corrected = activity(id);
      expect(corrected.mediaIds, id).not.toContain("forme-triangle");
      expect(corrected.mediaIds, id).toEqual(
        expect.arrayContaining(["forme-disque", "forme-carre"]),
      );
      expect(corrected.payload["categories"], id).toEqual(["les ronds", "les carrés"]);
    }
  });

  it("gives every 1ère movement screen steps for the movement the approved lesson asks for", () => {
    const movements = data.lessons
      .filter(
        (candidate) =>
          candidate.levelIds.includes("maternelle-1") && candidate.domainCode === "PHYS",
      )
      .flatMap((candidate) => candidate.activities);
    expect(movements).toHaveLength(22);

    for (const current of movements) {
      const moves = (current.payload["moves"] as string[]).join(" ");
      expect(moves, current.id).not.toBe("courir s’arrêter recommencer");
      if (/stop/i.test(current.childInstruction)) expect(moves, current.id).toMatch(/signal|stop/i);
      if (/cours|courir/i.test(current.childInstruction))
        expect(moves, current.id).toMatch(/repère.*marchant.*trois/i);
      if (/imite|mouvement/i.test(current.childInstruction))
        expect(moves, current.id).toMatch(/imiter.*inventer.*adulte/i);
      if (/lance|balle/i.test(current.childInstruction))
        expect(moves, current.id).toMatch(/seau.*lancer.*cinq/i);
      if (/ligne/i.test(current.childInstruction))
        expect(moves, current.id).toMatch(/ligne.*adulte.*seul.*envie/i);
      if (/jeu que tu préfères/i.test(current.childInstruction))
        expect(moves, current.id).toMatch(/choisir.*règle.*jouer/i);
    }
  });

  it("supplies two spoken words for each approved category in the language sort", () => {
    const corrected = activity("m3-lang-12-a2");
    expect(corrected.payload["categories"]).toEqual([
      "ce qui se mange",
      "ce qui sert à écrire",
      "ce qui se porte",
    ]);
    expect(corrected.payload["items"]).toEqual([
      "la banane",
      "le pain",
      "le crayon",
      "la craie",
      "la chemise",
      "la chaussure",
    ]);
  });

  it("pairs every market word with a picture, including a non-numeral money picture", () => {
    const corrected = activity("m3-lang-13-a2");
    expect(corrected.vocabulary.map((entry) => entry.fr)).toEqual([
      "la tomate",
      "la banane",
      "l’oignon",
      "le panier",
      "la monnaie",
    ]);
    expect(corrected.mediaIds).toEqual([
      "objet-tomate",
      "objet-banane",
      "objet-oignon",
      "objet-panier",
      "objet-monnaie",
    ]);
    const money = data.media.find((asset) => asset.id === "objet-monnaie")!;
    expect(money.alt).toMatch(/billets.*pièce/i);
    expect(money.alt).not.toMatch(/\d/);
  });

  it("uses only the composed square-wall and triangle-roof model for the house drawing", () => {
    const corrected = activity("m3-math-18-a2");
    expect(corrected.mediaIds).toEqual(["forme-maison-composee"]);
    const model = data.media.find((asset) => asset.id === "forme-maison-composee")!;
    expect(model.alt).toMatch(/carré pour le mur.*triangle pour le toit/i);
  });
});
