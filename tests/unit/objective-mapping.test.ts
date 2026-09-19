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
    //
    // The test is on the task, not on the declared type. A ritual that really does clap the
    // syllables of a name is doing phonological work while staying a `conversation`, and an
    // earlier version of this rule — "the type must be `phonology`" — would have refused it and
    // pushed the objective off an activity that genuinely earns it.
    const phonologicalTask = /\b(syllabes?|morceaux?|rime|riment|rimes)\b/i;
    const phonological = activities.filter((a) =>
      claims(a, /\b(syllabes?|rimes?|assonances?|mémoire auditive)\b/i),
    );
    expect(phonological.length).toBeGreaterThan(0);
    for (const activity of phonological) {
      const works =
        activity.type === "phonology" || phonologicalTask.test(activity.childInstruction);
      expect(works, `${activity.id}: claims phonology but asks for none`).toBe(true);
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

describe("who moves the furniture", () => {
  /**
   * A movement lesson has to clear a space first, and that preparation is genuinely part of the
   * activity — but the adult is the one who moves it.
   *
   * Two activities told the adult « c'est lui qui écarte la chaise » and « c'est lui qui écarte
   * ce qui gêne ». A chair is light in one home and heavy or unstable in another, and « ce qui
   * gêne » is whatever happens to be there. A product used in homes it cannot see does not hand
   * a five-year-old an object of unknown weight.
   */
  const HEAVY = /(chaise|chaises|table|tables|meuble|meubles|banc|armoire|ce qui gêne|obstacle)/i;
  /** « c'est lui/elle qui … » — the guidance assigning the job to the child. */
  const CHILD_DOES = /c’est (lui|elle)\s+qui\s+(écarte|déplace|pousse|enlève|range|bouge)/i;

  it("never tells the child to move furniture or an unnamed obstacle", () => {
    const guidance = lessons.flatMap((lesson) => [
      { id: lesson.id, text: lesson.parentGuidance },
      ...lesson.activities.map((a) => ({ id: a.id, text: a.adultGuidance })),
      ...lesson.activities.map((a) => ({ id: a.id, text: a.childInstruction })),
    ]);
    expect(guidance.length).toBeGreaterThan(0);
    for (const { id, text } of guidance) {
      const assigned = CHILD_DOES.exec(text);
      if (assigned === null) continue;
      // Whatever the child is given to move must be named, and must not be furniture.
      const after = text.slice(assigned.index, assigned.index + 160);
      expect(HEAVY.test(after), `${id}: the child is told to move « ${after.slice(0, 80)}… »`).toBe(
        false,
      );
    }
  });

  it("says who clears the space wherever a movement lesson asks for one", () => {
    const clearing = lessons.flatMap((lesson) =>
      lesson.activities
        .filter((a) => /dégagez l’espace|espace dégagé/i.test(a.adultGuidance))
        .map((a) => ({ id: a.id, text: a.adultGuidance })),
    );
    expect(clearing.length).toBeGreaterThan(0);
    for (const { id, text } of clearing) {
      // The adult moves the furniture, and the child's share is named and light.
      expect(text, `${id}: does not say the adult moves the furniture`).toMatch(
        /c’est vous qui déplacez/i,
      );
      expect(text, `${id}: does not name what the child may carry`).toMatch(
        /coussin|pagne|tissu|jouet/i,
      );
    }
  });
});

describe("an activity does not inherit what its sibling works", () => {
  /**
   * The defect this describes is one lesson, two activities, and an objective list copied across
   * both: the morphology activity claiming the biological-needs objective, the needs activity
   * claiming morphology, a recap ritual claiming the comprehension objective the story activity
   * earns. Each activity has to stand on its own text.
   */
  const text = (a: Activity) => `${a.childInstruction} ${a.adultGuidance}`;
  const namesParts =
    /\b(partie|parties|tête|patte|pattes|queue|plume|plumes|poil|feuille|tige|racine|fleur)\b/i;
  const asksAboutNeeds =
    /\b(besoin|besoins|pour vivre|il lui faut|arros|mange|boit|nourriture)\w*/i;

  it("keeps morphology and biological needs on the activity that does each", () => {
    // Scoped to the lessons that teach both, which is where the two can be confused.
    const both = lessons.filter((lesson) => {
      const all = [...lesson.objectiveCodes, ...lesson.supportingObjectiveCodes];
      return all.includes("WORLD-S01-C01-O08") && all.includes("WORLD-S01-C01-O10");
    });
    expect(both.length).toBeGreaterThan(0);
    for (const lesson of both) {
      for (const activity of lesson.activities) {
        const codes = activity.objectiveCodes;
        expect(
          codes.includes("WORLD-S01-C01-O08") && codes.includes("WORLD-S01-C01-O10"),
          `${activity.id}: claims morphology and needs at once`,
        ).toBe(false);
        if (codes.includes("WORLD-S01-C01-O08")) {
          expect(namesParts.test(text(activity)), `${activity.id}: claims morphology`).toBe(true);
        }
        if (codes.includes("WORLD-S01-C01-O10")) {
          expect(asksAboutNeeds.test(text(activity)), `${activity.id}: claims needs`).toBe(true);
        }
      }
    }
  });

  it("only claims the comprehension-of-feelings objective where a feeling is asked about", () => {
    // « Dis la date, puis raconte-moi ce que nous avons appris » interprets nobody's emotions.
    const feelings = /\b(sent|ressent|sentiment|émotion|content|triste|fâché|peur|gêné)\w*/i;
    const claiming = activities.filter((a) => a.objectiveCodes.includes("LANG-S02-C03-O14"));
    expect(claiming.length).toBeGreaterThan(0);
    for (const activity of claiming) {
      expect(feelings.test(text(activity)), `${activity.id}: claims feelings, asks none`).toBe(
        true,
      );
    }
  });

  it("claims the comparison objective wherever two collections are compared", () => {
    // « Fais un tas qui a plus d'objets que le mien » and « Comparez les deux nombres » are
    // comparison work, and both had been filed as counting or as constituting a collection.
    const comparesTwoCollections = /que (le mien|les miens|la mienne)|compar\w+ les deux/i;
    const comparing = activities.filter((a) => comparesTwoCollections.test(text(a)));
    expect(comparing.length).toBeGreaterThan(0);
    for (const activity of comparing) {
      expect(
        activity.objectiveCodes.includes("MATH-S01-C01-O05"),
        `${activity.id}: compares two collections without claiming it`,
      ).toBe(true);
    }
  });
});

describe("a home movement course stays soft and at floor level", () => {
  it("never asks the child to pass under or climb household furniture", () => {
    const course = lessons.flatMap((l) => l.activities).filter((a) => a.type === "movement");
    expect(course.length).toBeGreaterThan(0);
    const underFurniture = /\b(sous|sur) (la chaise|la table|le meuble|le banc|le lit)\b/i;
    const climbs = /\b(monte|grimpe|escalade)\b/i;
    for (const activity of course) {
      // The child's own instruction, not the adult's: an adult may legitimately drum « sur la
      // table » to give a rhythm, which is not the child going on or under the furniture.
      const t = activity.childInstruction;
      expect(underFurniture.test(t), `${activity.id}: sends the child under furniture`).toBe(false);
      expect(climbs.test(t), `${activity.id}: asks the child to climb`).toBe(false);
    }
  });

  it("does not ask a balance activity to bring out furniture it never uses", () => {
    // « Sur une ligne » needs a line on the floor, and declared the household-objects box —
    // which is where the chairs and the stick live.
    const line = lessons
      .flatMap((l) => l.activities)
      .filter((a) => /marche sur la ligne|sur une ligne/i.test(a.childInstruction));
    expect(line.length).toBeGreaterThan(0);
    for (const activity of line) {
      expect(activity.materialCodes, activity.id).toContain("repere-sol");
      expect(activity.materialCodes, activity.id).not.toContain("objets-maison");
    }
  });
});

describe("the child is told to look, not to touch what may be hot or sharp", () => {
  it("never sends the child to touch a window, a pot or an unnamed surface", () => {
    const risky = /va toucher (la fenêtre|la marmite|le verre|la vitre)/i;
    for (const lesson of lessons) {
      for (const activity of lesson.activities) {
        const t = `${activity.childInstruction} ${activity.adultGuidance}`;
        expect(risky.test(t), `${activity.id}: sends the child to touch it`).toBe(false);
      }
    }
  });
});

describe("a read-aloud does not smuggle in a later objective", () => {
  it("states no formal arithmetic in a story a language lesson reads", () => {
    // « Trois cailloux, moins un, ça fait deux » is an addition and a subtraction stated as
    // operations, in a listening activity whose work is comprehension.
    const formal = /\bmoins un, ça fait\b|\bplus un, ça (re)?fait\b|\bégale\b/i;
    for (const story of data.texts) {
      const joined = story.lines.join(" ");
      expect(formal.test(joined), `${story.id}: states a formal operation`).toBe(false);
    }
  });
});

describe("a ritual claims the date, and only what else it really does", () => {
  const text = (a: Activity) => `${a.childInstruction} ${a.adultGuidance}`;
  /** Stating today's date, however the instruction words it. */
  const asksTheDate =
    /la date|quel jour (sommes-nous|nous sommes|c’est)|jour d’aujourd’hui|aujourd’hui, nous sommes/i;

  it("ties « énoncer la date » to the activities that ask for it, both ways", () => {
    const claiming = activities.filter((a) => a.objectiveCodes.includes("TIME-SPACE-S01-C01-O12"));
    expect(claiming.length).toBeGreaterThan(0);
    for (const activity of claiming) {
      expect(asksTheDate.test(text(activity)), `${activity.id}: claims the date, asks none`).toBe(
        true,
      );
    }
    // And the other direction: an activity that does ask for the date must say so.
    for (const activity of activities) {
      if (!asksTheDate.test(activity.childInstruction)) continue;
      expect(
        activity.objectiveCodes.includes("TIME-SPACE-S01-C01-O12"),
        `${activity.id}: asks for the date without claiming it`,
      ).toBe(true);
    }
  });

  it("claims « décrire et nommer » wherever the child names a shape", () => {
    const namesAShape = /dis son nom|nomme-les|nomme la forme|nomme les formes/i;
    const naming = activities.filter(
      (a) => namesAShape.test(a.childInstruction) && /forme/i.test(text(a)),
    );
    expect(naming.length).toBeGreaterThan(0);
    for (const activity of naming) {
      expect(
        activity.objectiveCodes.includes("MATH-S03-C01-O08"),
        `${activity.id}: the child says the shape's name without the naming objective`,
      ).toBe(true);
    }
  });

  /**
   * Pinned rather than stated as a rule, deliberately.
   *
   * « Participer à une conversation … et reformuler son propos s'il n'a pas été compris » is real
   * work in a describing game and in talking about what a character feels, and it is not real
   * work in « dis la date, puis nomme un animal ». No keyword separates those reliably: every
   * predicate tried either cleared the ritual or condemned four legitimate activities. So this
   * one stays a targeted check on the case a reviewer actually found.
   */
  it("does not let the day-5 recap ritual claim an extended conversation", () => {
    const ritual = activities.find((a) => a.id === "m3-lang-05-a1")!;
    expect(ritual.objectiveCodes).not.toContain("LANG-S01-C04-O11");
    // It stays where the child really tells a story about their day.
    const telling = activities.find((a) => a.id === "m3-lang-05-a2")!;
    expect(telling.objectiveCodes).toContain("LANG-S01-C04-O11");
  });
});

describe("a movement objective describes the movement that happens", () => {
  const text = (a: Activity) => `${a.childInstruction} ${a.adultGuidance}`;

  it("only claims « lancer » where something is actually sent", () => {
    // « Saute la rivière » claimed « lancer loin et avec précision différents objets ». Nobody
    // throws anything in it: the child jumps over a cloth on the floor.
    const throwing = /\b(lanc\w*|vise\w*|jett\w*|envoi\w*|passes?)\b/i;
    const claiming = activities.filter((a) => a.objectiveCodes.includes("PHYS-S01-C01-O09"));
    expect(claiming.length).toBeGreaterThan(0);
    for (const activity of claiming) {
      expect(throwing.test(text(activity)), `${activity.id}: claims throwing, throws nothing`).toBe(
        true,
      );
    }
  });

  it("claims a jumping objective wherever the child jumps over something", () => {
    const jumps = /\bsaut\w*\b.{0,40}\b(par-dessus|obstacle|rivière)\b/i;
    const jumping = activities.filter((a) => jumps.test(a.childInstruction));
    expect(jumping.length).toBeGreaterThan(0);
    for (const activity of jumping) {
      const claimsJump = activity.objectiveCodes.some((code) =>
        /^Sauter sans élan|sauter haut ou loin/i.test(statementOf(code)),
      );
      expect(claimsJump, `${activity.id}: the child jumps an obstacle without claiming it`).toBe(
        true,
      );
    }
  });
});

describe("a spatial objective names the frame it is judged against", () => {
  const text = (a: Activity) => `${a.childInstruction} ${a.adultGuidance}`;

  it("only claims « par rapport à soi » where the child's body is the reference", () => {
    // Two activities situated objects against landmarks — « derrière la chaise », « près de la
    // porte » — while claiming the objective about building an oriented image of one's own body.
    const ownBody =
      /\btoi\b|\bmoi\b|ton corps|devant (lui|elle)|derrière (lui|elle)|à côté de (lui|elle)|par rapport à (toi|lui|elle|soi)/i;
    const claiming = activities.filter((a) => a.objectiveCodes.includes("TIME-SPACE-S02-C01-O16"));
    expect(claiming.length).toBeGreaterThan(0);
    for (const activity of claiming) {
      expect(ownBody.test(text(activity)), `${activity.id}: claims « par rapport à soi »`).toBe(
        true,
      );
    }
  });
});

describe("a recap ritual claims only what it asks for", () => {
  const text = (a: Activity) => `${a.childInstruction} ${a.adultGuidance}`;

  it("only claims « organiser les mots en catégorie » where words are grouped", () => {
    // Two rituals — « raconte-moi ce que nous avons appris cette semaine » — claimed the
    // categorisation objective that the sorting activity beside them earns.
    const groups = /catégorie|group\w*|\bensemble\b|\brange\b|\btri\w*|vont ensemble/i;
    const claiming = activities.filter((a) => a.objectiveCodes.includes("LANG-S01-C01-O02"));
    expect(claiming.length).toBeGreaterThan(0);
    for (const activity of claiming) {
      expect(
        groups.test(text(activity)),
        `${activity.id}: claims categorising, groups nothing`,
      ).toBe(true);
    }
  });

  it("only claims « diversifier les pronoms » where a pronoun is elicited", () => {
    const pronoun = /«\s*(il|elle|ils|elles)\s*»|\b(il|elle)\b\s*…/i;
    const claiming = activities.filter((a) => a.objectiveCodes.includes("LANG-S01-C02-O01"));
    expect(claiming.length).toBeGreaterThan(0);
    for (const activity of claiming) {
      expect(pronoun.test(text(activity)), `${activity.id}: claims pronouns, elicits none`).toBe(
        true,
      );
    }
  });
});

describe("the words a lesson uses match the work it sets", () => {
  it("never calls a semantic category a « famille de mots »", () => {
    // The activity content had been corrected to « catégorie » while the lesson summary and the
    // activity title still said « familles ». A word family is a morphological thing — chanter,
    // chanteur, chanson — and this task groups words by meaning.
    const wordFamily = /famille[s]?\s+de\s+mots|(?:par|en)\s+familles?\b/i;
    for (const lesson of lessons) {
      const sorts = lesson.activities.some(
        (a) => a.type === "sorting" || a.objectiveCodes.includes("LANG-S01-C01-O02"),
      );
      if (!sorts) continue;
      const surfaces = [
        lesson.summary,
        lesson.parentGuidance,
        ...lesson.activities.flatMap((a) => [
          a.title,
          a.childInstruction,
          a.adultGuidance,
          ...a.vocabulary.map((v) => v.fr),
        ]),
      ];
      for (const surface of surfaces) {
        expect(wordFamily.test(surface), `${lesson.id}: « ${surface.slice(0, 60)} »`).toBe(false);
      }
    }
  });
});

describe("what an activity declares is what it asks the adult to fetch", () => {
  it("declares tableware wherever the guidance asks for plates", () => {
    // « Mets la table » asked for unbreakable plates while declaring the household-objects box,
    // so the parent's preparation list offered cushions, a chair, a stick and a cloth.
    // Only where the child is told to *fetch or carry* tableware. Counting the plates already on
    // the shelf, or naming « l'assiette » as a word to sort, needs nothing brought out.
    const needsTableware = /assiette|gobelet|couvert|vaisselle/i;
    const carriesTableware =
      /\b(prends|pose|apporte|mets)\b[^.]{0,40}(assiette|gobelet|couvert|vaisselle)/i;
    const asking = lessons
      .flatMap((l) => l.activities)
      .filter((a) => carriesTableware.test(a.childInstruction));
    expect(asking.length).toBeGreaterThan(0);
    for (const activity of asking) {
      const declared = activity.materialCodes
        .map((code) => data.materials.find((m) => m.code === code))
        .filter((m) => m !== undefined);
      expect(
        declared.some((m) => needsTableware.test(`${m!.name} ${m!.alternatives}`)),
        `${activity.id}: asks for plates, declares ${activity.materialCodes.join(", ")}`,
      ).toBe(true);
    }
  });

  it("never sends a child to carry glass or a sharp utensil", () => {
    // The tableware class itself — not a counting box that happens to list a cup among its
    // suggestions, where nothing is carried to a table.
    for (const material of data.materials) {
      if (!/vaisselle/i.test(material.name)) continue;
      expect(material.name, material.code).not.toMatch(/verre|céramique|couteau/i);
      expect(material.safetyNote ?? "", material.code).toMatch(/verre|céramique|pointu/i);
    }
  });
});

describe("« lancer loin » is earned by distance, not by any throw", () => {
  it("makes every activity claiming it vary the distance", () => {
    // « Dix passes ensemble » passed a ball back and forth at one fixed distance and claimed
    // « lancer loin et avec précision ». Passing is throwing; it was not throwing *far*.
    const varies = /recul\w+|plus loin|le plus loin|d’un (petit )?pas|rapproch\w+/i;
    const claiming = activities.filter((a) => a.objectiveCodes.includes("PHYS-S01-C01-O09"));
    expect(claiming.length).toBeGreaterThan(0);
    for (const activity of claiming) {
      expect(
        varies.test(`${activity.childInstruction} ${activity.adultGuidance}`),
        `${activity.id}: claims throwing far, never changes the distance`,
      ).toBe(true);
    }
  });
});
