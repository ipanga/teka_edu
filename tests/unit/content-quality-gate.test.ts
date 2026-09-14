import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ACTIVITY_RENDERERS, RENDERER_FAMILIES, activityTypesOf } from "@/domain/lessons/renderers";
import { checkLessonReview, lessonDigest } from "@/domain/lessons/review";
import { ACTIVITY_TYPES, type Lesson } from "@/domain/lessons/types";
import { buildReviewPackage } from "@/lib/content/review-package";
import { REVIEW_PACKAGES, reviewPackagePath } from "@/lib/content/review-packages";
import { getReferenceData } from "@/lib/content/reference-data";

const ROOT = path.resolve(import.meta.dirname, "../..");
const data = getReferenceData();
const lesson = (id: string) => {
  const found = data.lessons.find((l) => l.id === id);
  if (!found) throw new Error(`no lesson ${id}`);
  return found;
};

describe("content quality gate (ADR-035)", () => {
  it("leaves every AI-assisted pilot lesson waiting for a human reviewer", () => {
    // This is the point of the gate: nothing written by Claude approves itself.
    for (const l of data.lessons) {
      expect(l.status, l.id).toBe("review");
      expect(l.review, l.id).toBeNull();
    }
  });

  it("accepts the pilot as it stands", () => {
    expect(data.lessons.flatMap(checkLessonReview)).toEqual([]);
  });

  it("refuses an approval with no reviewer", () => {
    const approved: Lesson = { ...lesson("m3-math-01"), status: "approved", review: null };
    expect(checkLessonReview(approved)[0]).toMatch(/must record who reviewed it/);
  });

  it("refuses a review record on content that is not approved", () => {
    const base = lesson("m3-math-01");
    const odd: Lesson = {
      ...base,
      status: "review",
      review: {
        reviewer: "A. Mbala",
        reviewerRole: "institutrice de 3ème maternelle",
        reviewedOn: "2026-09-20",
        reviewedDigest: lessonDigest(base),
        notes: null,
      },
    };
    expect(checkLessonReview(odd)[0]).toMatch(/only an approved lesson carries a review record/);
  });

  it("accepts an approval that names a reviewer and matches the reviewed text", () => {
    const base = lesson("m3-math-01");
    const approved: Lesson = {
      ...base,
      status: "approved",
      review: {
        reviewer: "A. Mbala",
        reviewerRole: "institutrice de 3ème maternelle",
        reviewedOn: "2026-09-20",
        reviewedDigest: lessonDigest(base),
        notes: "Bien pour des enfants de 5 ans.",
      },
    };
    expect(checkLessonReview(approved)).toEqual([]);
  });

  it("lapses the approval as soon as the reviewed text changes", () => {
    const base = lesson("m3-math-01");
    const approved: Lesson = {
      ...base,
      status: "approved",
      review: {
        reviewer: "A. Mbala",
        reviewerRole: "institutrice de 3ème maternelle",
        reviewedOn: "2026-09-20",
        reviewedDigest: lessonDigest(base),
        notes: null,
      },
    };
    // Someone edits a single word of the child instruction after approval…
    const edited: Lesson = {
      ...approved,
      activities: [
        { ...approved.activities[0]!, childInstruction: "Compte les capsules, une par une." },
        ...approved.activities.slice(1),
      ],
    };
    expect(checkLessonReview(edited)[0]).toMatch(/changed since it was approved/);
    // …and changing the objectives, the duration or the guidance lapses it too.
    expect(checkLessonReview({ ...approved, parentGuidance: "Autre conseil." })[0]).toMatch(
      /changed/,
    );
    expect(checkLessonReview({ ...approved, objectiveCodes: ["MATH-S01-C01-O20"] })[0]).toMatch(
      /changed/,
    );
  });

  it("gives a stable digest that ignores the order of lists", () => {
    const base = lesson("m3-world-01");
    expect(lessonDigest(base)).toBe(lessonDigest({ ...base }));
    expect(lessonDigest({ ...base, objectiveCodes: [...base.objectiveCodes].reverse() })).toBe(
      lessonDigest(base),
    );
    expect(lessonDigest(base)).toMatch(/^[0-9a-f]{16}$/);
    expect(lessonDigest(base)).not.toBe(lessonDigest(lesson("m3-world-02")));
  });
});

describe("materials: accessibility and safety", () => {
  it("says what to use instead of every material", () => {
    for (const material of data.materials) {
      if (material.code === "aucun") continue;
      expect(material.alternatives, material.code).toBeTruthy();
    }
  });

  it("warns the adult about small objects, furniture and open space", () => {
    for (const code of ["petits-objets", "objets-maison", "espace-degage"]) {
      expect(data.materials.find((m) => m.code === code)?.safetyNote, code).toBeTruthy();
    }
  });
});

describe("renderer families (Phase 3 planning, ADR-036)", () => {
  it("plans a renderer for every activity kind", () => {
    for (const type of ACTIVITY_TYPES) {
      const plan = ACTIVITY_RENDERERS[type];
      expect(plan, type).toBeDefined();
      expect(RENDERER_FAMILIES).toContain(plan.family);
      expect(plan.interaction.length).toBeGreaterThan(20);
    }
  });

  it("shares families, so Phase 3 builds ten screens and not fifteen", () => {
    expect(RENDERER_FAMILIES.length).toBeLessThan(ACTIVITY_TYPES.length);
    expect(activityTypesOf("audio-narrative")).toEqual([
      "listening-story",
      "read-aloud",
      "song-rhyme",
    ]);
    expect(activityTypesOf("group-and-match")).toEqual(["matching", "sorting", "memory-game"]);
    for (const family of RENDERER_FAMILIES) {
      expect(activityTypesOf(family).length, family).toBeGreaterThan(0);
    }
  });

  it("keeps movement off the screen and every family offline-capable in principle", () => {
    expect(ACTIVITY_RENDERERS.movement.screen).toBe("none");
    expect(ACTIVITY_RENDERERS["read-aloud"].media).toEqual([]);
    for (const type of ACTIVITY_TYPES) {
      expect(["yes", "needs-audio", "needs-image"]).toContain(ACTIVITY_RENDERERS[type].offline);
    }
  });
});

describe("human review package", () => {
  const options = REVIEW_PACKAGES[0]!;
  const committed = readFileSync(path.join(ROOT, reviewPackagePath(options)), "utf8");

  it("is up to date with the content (run `npm run review:package`)", () => {
    expect(committed).toBe(buildReviewPackage(data, options));
  });

  it("carries what a reviewer needs, and no approval", () => {
    expect(committed).toContain("n’ont pas encore été relues");
    expect(committed).toContain("Consigne à l’enfant");
    expect(committed).toContain("Guidance adulte");
    expect(committed).toContain("Réussites attendues — texte officiel pour la compétence");
    expect(committed).toContain("Décision : ☐ accepté");
    expect(committed).toMatch(/⚠ Sécurité/);
    expect(committed).toMatch(/\*\*À défaut :\*\*/);
    // It must never claim a review that has not happened.
    expect(committed).not.toMatch(/validé par|approuvé par|certifié/i);
  });

  /**
   * The Week 1 review sent this back: the reviewer was asked to judge « L'histoire de Kumu »
   * and its three questions without being shown either. Nobody can approve a text they have
   * not read, so the text travels with the activity that uses it.
   */
  it("quotes in full every story and rhyme a reviewer is asked to judge", () => {
    for (const week of REVIEW_PACKAGES) {
      const document = readFileSync(path.join(ROOT, reviewPackagePath(week)), "utf8");
      const named = [...document.matchAll(/— « (.+?) »\*\* \(\d+ min, `([a-z0-9-]+)`\)/g)];
      expect(named.length, `${week.week}: no teaching text quoted`).toBeGreaterThan(0);
      for (const [, , id] of named) {
        const text = data.texts.find((candidate) => candidate.id === id);
        expect(text, `${id} is quoted but not in content/texts/`).toBeDefined();
        for (const line of text!.lines) {
          expect(document, `${id}: a line of the text is missing`).toContain(line);
        }
      }
    }
  });

  it("shows the comprehension questions the child will actually be asked", () => {
    const withQuestions = data.lessons
      .flatMap((lesson) => lesson.activities)
      .filter((activity) => Array.isArray(activity.payload["questions"]));
    expect(withQuestions.length).toBeGreaterThan(0);
    const everyWeek = REVIEW_PACKAGES.map((week) =>
      readFileSync(path.join(ROOT, reviewPackagePath(week)), "utf8"),
    ).join("\n");
    for (const activity of withQuestions) {
      for (const question of activity.payload["questions"] as string[]) {
        expect(everyWeek, `${activity.id}: question missing`).toContain(question);
      }
    }
  });

  /**
   * Official statements are quoted verbatim and 43 of them are several lines — an opening line
   * such as « Utiliser : » and the bullets under it. Rendering only the first line showed the
   * reviewer a heading with nothing beneath it, which reads as missing curriculum text.
   */
  it("never shows an official excerpt as a heading with nothing under it", () => {
    for (const week of REVIEW_PACKAGES) {
      const lines = readFileSync(path.join(ROOT, reviewPackagePath(week)), "utf8").split("\n");
      lines.forEach((line, index) => {
        if (!/^\s*[-*] .*:\s*$/.test(line)) return;
        let next = index + 1;
        while (next < lines.length && lines[next]!.trim() === "") next += 1;
        expect(
          next < lines.length && /^\s{2,}\S/.test(lines[next]!),
          `semaine ${week.week}, ligne ${index + 1}: « ${line.trim()} » n'introduit rien`,
        ).toBe(true);
      });
    }
  });

  it("tells the reviewer whose screen time is being counted, and that 35 min is not a target", () => {
    expect(committed).toContain("temps d’écran actif de l’enfant");
    expect(committed).toContain("Ce n’est pas un objectif à atteindre.");
    expect(committed).toContain("Une séance écourtée est une séance normale");
  });

  it("covers its own week, and the five packages together cover September", () => {
    for (let day = options.fromDay; day <= options.toDay; day++) {
      expect(committed).toContain(`## Jour ${day} —`);
    }
    const everyWeek = REVIEW_PACKAGES.map((week) =>
      readFileSync(path.join(ROOT, reviewPackagePath(week)), "utf8"),
    ).join("\n");
    for (const l of data.lessons) expect(everyWeek, l.id).toContain(l.title);
    expect(REVIEW_PACKAGES.at(-1)?.toDay).toBe(22);
  });
});
