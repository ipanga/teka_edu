import { describe, expect, it } from "vitest";
import { findObjective } from "@/domain/curriculum/objectives";
import type { Activity } from "@/domain/lessons/types";
import { findAsset } from "@/domain/media/types";
import { screenTimeLines } from "@/lib/content/review-package";
import { getReferenceData, getSyllabus } from "@/lib/content/reference-data";

/**
 * An activity may only claim what it actually makes the child do.
 *
 * Every rule here comes from a defect a pedagogical review found in a real lesson: the mapping
 * was plausible, the generated package repeated it, and nothing in the suite objected. The
 * validators already prove that a lesson's objectives and its activities' objectives are the same
 * set (domain/programme/validation.ts). What they cannot see is whether the objective describes
 * the task, and that is what these rules check.
 *
 * Each rule is written against the *official statement* rather than a hard-coded list of codes,
 * so it holds for every age band: « Constituer une collection … d'un cardinal donné » is O04
 * before 4, O14 from 4 and O21 from 5, and the rule should catch all three.
 */
const data = getReferenceData();
const syllabus = getSyllabus("maternelle-cycle1-cd-2026", data);
const lessons = data.lessons;
const activities: readonly (Activity & { lessonId: string })[] = lessons.flatMap((l) =>
  l.activities.map((a) => ({ ...a, lessonId: l.id })),
);

/** The official wording of an objective, or "" when the code is unknown to the syllabus. */
const statementOf = (code: string) => findObjective(syllabus, code)?.statement ?? "";
const claims = (activity: Activity, matcher: RegExp) =>
  activity.objectiveCodes.some((code) => matcher.test(statementOf(code)));

describe("an activity claims only the objectives it actually works", () => {
  it("only claims « constituer une collection » where the child is asked to build a stated number", () => {
    // « Je compte les objets » counted a set the adult had already laid out and claimed the
    // child had constituted a collection of a requested cardinal. Counting is not constituting.
    const asksForACardinal =
      /\b(donne-moi|donne-m’en|fais un tas de|prends|apporte)\s+(exactement\s+)?(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|vingt|trente)\b/i;
    const building = activities.filter((a) => asksForACardinal.test(a.childInstruction));
    expect(building.length).toBeGreaterThan(0);
    for (const activity of building) {
      expect(claims(activity, /^Constituer une collection/i), activity.id).toBe(true);
    }
  });

  it("only claims « se représenter avec un corps articulé » where the child draws", () => {
    // « Où est-ce que ça plie ? » has the child find and move their joints. That is identifying
    // them — the objective next to it, which asks for a representation, was not being worked.
    const representing = activities.filter((a) =>
      claims(a, /^Se représenter avec un corps articulé/i),
    );
    expect(representing.length).toBeGreaterThan(0);
    for (const activity of representing) {
      expect(activity.type, activity.id).toBe("drawing");
    }
  });

  it("makes every grouping activity claim the objective about sorting", () => {
    // « Je range les formes » is the activity where the classifying happens, and it was the one
    // activity in the lesson that did not claim it.
    //
    // The `sorting` type also carries ranking — « Range les trois tas, du plus petit au plus
    // grand » — where the categories are positions, not kinds. Putting things in order is a
    // different task from putting like with like, and it claims comparison objectives instead.
    const ranking = /\b(du plus|au plus|dans l’ordre)\b/i;
    const grouping = activities.filter(
      (a) => a.type === "sorting" && !ranking.test(a.childInstruction),
    );
    expect(grouping.length).toBeGreaterThan(0);
    for (const activity of grouping) {
      expect(claims(activity, /\b(trier|classer|catégorie)\b/i), activity.id).toBe(true);
    }
  });

  it("only claims a phonological-awareness objective where there is a phonological task", () => {
    // Six daily rituals — « Dis la date, puis raconte-moi ce que nous avons fait » — claimed
    // scanning syllables, producing rhymes, or auditory memory. None of them asks for any of it.
    const phonological = activities.filter((a) =>
      claims(a, /\b(syllabes?|rimes?|assonances?|mémoire auditive)\b/i),
    );
    expect(phonological.length).toBeGreaterThan(0);
    for (const activity of phonological) {
      expect(activity.type, activity.id).toBe("phonology");
    }
  });

  it("does not reduce building a pile of ten to reciting the number sequence", () => {
    // « Le tas de dix » claimed only « connaitre et utiliser la comptine numérique ». The child
    // also builds the collection and counts it, which is two further objectives, already met.
    const recitingOnly = activities.filter(
      (a) =>
        a.type === "manipulation" && claims(a, /^Connaitre et utiliser la comptine numérique/i),
    );
    expect(recitingOnly.length).toBeGreaterThan(0);
    for (const activity of recitingOnly) {
      expect(claims(activity, /^(Dénombrer|Constituer) une collection/i), activity.id).toBe(true);
    }
  });
});

describe("a lesson that claims classification shows more than one exemplar", () => {
  it("varies the shapes it sorts, because the objective says orientation must not matter", () => {
    // « Reconnaitre, trier et classer des formes géométriques planes, indépendamment d'autres
    // critères comme la couleur, la taille, l'orientation. » One drawing per category cannot
    // demonstrate that: it teaches the prototype instead.
    const invariance = /indépendamment d’autres critères/i;
    const sorting = activities.filter((a) => a.type === "sorting" && claims(a, invariance));
    expect(sorting.length).toBeGreaterThan(0);
    for (const activity of sorting) {
      const tagsOf = (id: string) => findAsset(data.media, id)?.tags ?? [];
      for (const shape of ["carré", "rectangle", "triangle", "disque"]) {
        const exemplars = activity.mediaIds.filter((id) => tagsOf(id).includes(shape));
        expect(exemplars.length, `${activity.id} → ${shape}`).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe("the review package explains the number it prints", () => {
  it("does not describe zero screen interaction as the child using the device", () => {
    const zero = screenTimeLines(0, 3).join("\n");
    expect(zero).toContain("aucune");
    expect(zero).not.toContain("l’enfant\n  touche, choisit, compte");
    expect(zero).toContain("ne demande à l’enfant de toucher, choisir ou compter");
  });

  it("still describes the interaction when there is some", () => {
    const some = screenTimeLines(4, 3).join("\n");
    expect(some).toContain("touche, choisit, compte sur l’appareil");
    expect(some).not.toContain("aucune activité");
  });

  it("does not describe zero picture time as the child looking at an illustration", () => {
    const none = screenTimeLines(0, 0).join("\n");
    expect(none).toContain("rien n’est");
    expect(none).not.toContain("il y regarde une illustration");
  });
});
