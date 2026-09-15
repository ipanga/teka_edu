import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ACTIVITY_RENDERERS, RENDERER_FAMILIES, activityTypesOf } from "@/domain/lessons/renderers";
import {
  REVIEW_KINDS,
  REVIEW_OUTCOMES,
  checkLessonReview,
  lessonDigest,
} from "@/domain/lessons/review";
import { ACTIVITY_TYPES, type Lesson } from "@/domain/lessons/types";
import { buildReviewPackage } from "@/lib/content/review-package";
import { REVIEW_PACKAGES, reviewPackagePath } from "@/lib/content/review-packages";
import { getReferenceData } from "@/lib/content/reference-data";
import { mediaDigestSource } from "@/domain/media/types";

const ROOT = path.resolve(import.meta.dirname, "../..");
const data = getReferenceData();
/** The real registry: a digest is only meaningful against the pictures actually shipped. */
const media = mediaDigestSource(data.media, data.texts);
const lesson = (id: string) => {
  const found = data.lessons.find((l) => l.id === id);
  if (!found) throw new Error(`no lesson ${id}`);
  return found;
};

describe("content quality gate (ADR-035, refined by ADR-047)", () => {
  /**
   * The invariant, not the count. Asserting "every lesson is `review`" made the gate untestable
   * the moment it was allowed to open — it would have failed on the first legitimate approval
   * and invited someone to delete the test. What must hold is that an approval is never
   * self-granted: it carries an independent review, and says which kind it was.
   */
  it("lets no lesson claim approval without a complete, attributable review", () => {
    for (const l of data.lessons) {
      if (l.status === "approved") {
        expect(l.review, `${l.id} is approved with no review record`).not.toBeNull();
        expect(REVIEW_KINDS, `${l.id}`).toContain(l.review!.reviewKind);
        expect(REVIEW_OUTCOMES, `${l.id}`).toContain(l.review!.outcome);
      } else {
        expect(l.review, `${l.id} is not approved but carries a review record`).toBeNull();
      }
    }
  });

  it("never records an AI-assisted review as a teacher's", () => {
    for (const l of data.lessons) {
      if (l.review?.reviewKind !== "human-teacher") continue;
      expect(l.review.reviewer, `${l.id}: a human-teacher review must name a person`).not.toMatch(
        /chatgpt|gpt|claude|gemini|\bia\b|\bai\b/i,
      );
    }
  });

  it("accepts the pilot as it stands", () => {
    expect(data.lessons.flatMap((l) => checkLessonReview(l, media))).toEqual([]);
  });

  it("refuses an approval with no reviewer", () => {
    const approved: Lesson = { ...lesson("m3-math-01"), status: "approved", review: null };
    expect(checkLessonReview(approved, media)[0]).toMatch(/must record who reviewed it/);
  });

  it("refuses a review record on content that is not approved", () => {
    const base = lesson("m3-math-01");
    const odd: Lesson = {
      ...base,
      status: "review",
      review: {
        reviewKind: "human-teacher",
        outcome: "accepted",
        reviewer: "A. Mbala",
        reviewerRole: "institutrice de 3ème maternelle",
        reviewedOn: "2026-09-20",
        reviewedDigest: lessonDigest(base, media),
        notes: null,
      },
    };
    expect(checkLessonReview(odd, media)[0]).toMatch(
      /only an approved lesson carries a review record/,
    );
  });

  it("accepts an approval that names a reviewer and matches the reviewed text", () => {
    const base = lesson("m3-math-01");
    const approved: Lesson = {
      ...base,
      status: "approved",
      review: {
        reviewKind: "human-teacher",
        outcome: "accepted",
        reviewer: "A. Mbala",
        reviewerRole: "institutrice de 3ème maternelle",
        reviewedOn: "2026-09-20",
        reviewedDigest: lessonDigest(base, media),
        notes: "Bien pour des enfants de 5 ans.",
      },
    };
    expect(checkLessonReview(approved, media)).toEqual([]);
  });

  /**
   * ADR-047: the active development gate is an AI-assisted review. `approved` therefore says
   * only that the gate was passed, and the record has to say which gate — otherwise a later
   * reader, a report or an interface could present an AI review as a teacher's.
   */
  it("accepts an AI-assisted approval, recorded as such", () => {
    const base = lesson("m3-math-01");
    const approved: Lesson = {
      ...base,
      status: "approved",
      review: {
        reviewKind: "ai-assisted",
        outcome: "accepted-with-modifications",
        reviewer: "ChatGPT",
        reviewerRole: "relecture pédagogique assistée par IA, contre le programme officiel",
        reviewedOn: "2026-09-14",
        reviewedDigest: lessonDigest(base, media),
        notes: "Corrections demandées appliquées.",
      },
    };
    expect(checkLessonReview(approved, media)).toEqual([]);
  });

  it("refuses to record an AI review as a human teacher's", () => {
    const base = lesson("m3-math-01");
    const mislabelled: Lesson = {
      ...base,
      status: "approved",
      review: {
        reviewKind: "human-teacher",
        outcome: "accepted",
        reviewer: "ChatGPT (GPT-5)",
        reviewerRole: "institutrice de 3ème maternelle",
        reviewedOn: "2026-09-14",
        reviewedDigest: lessonDigest(base, media),
        notes: null,
      },
    };
    expect(checkLessonReview(mislabelled, media)[0]).toMatch(/must use reviewKind "ai-assisted"/);
  });

  it("lapses the approval as soon as the reviewed text changes", () => {
    const base = lesson("m3-math-01");
    const approved: Lesson = {
      ...base,
      status: "approved",
      review: {
        reviewKind: "human-teacher",
        outcome: "accepted",
        reviewer: "A. Mbala",
        reviewerRole: "institutrice de 3ème maternelle",
        reviewedOn: "2026-09-20",
        reviewedDigest: lessonDigest(base, media),
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
    expect(checkLessonReview(edited, media)[0]).toMatch(/changed since it was approved/);
    // …and changing the objectives, the duration or the guidance lapses it too.
    expect(checkLessonReview({ ...approved, parentGuidance: "Autre conseil." }, media)[0]).toMatch(
      /changed/,
    );
    expect(
      checkLessonReview({ ...approved, objectiveCodes: ["MATH-S01-C01-O20"] }, media)[0],
    ).toMatch(/changed/);
  });

  it("gives a stable digest that ignores the order of lists", () => {
    const base = lesson("m3-world-01");
    expect(lessonDigest(base, media)).toBe(lessonDigest({ ...base }, media));
    expect(
      lessonDigest({ ...base, objectiveCodes: [...base.objectiveCodes].reverse() }, media),
    ).toBe(lessonDigest(base, media));
    expect(lessonDigest(base, media)).toMatch(/^[0-9a-f]{16}$/);
    expect(lessonDigest(base, media)).not.toBe(lessonDigest(lesson("m3-world-02"), media));
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

/**
 * An approval is a statement about what a child will see, so the digest has to move when the
 * picture does. `histoire-seau-lisa` kept its id while being redrawn to put Lisa in it — a real
 * pedagogical change that a digest hashing only the id would have missed entirely.
 */
describe("an approval covers the picture, not just its name", () => {
  const data = getReferenceData();
  const base = data.lessons.find((l) => l.id === "m1-lang-17")!;
  /** A source that can be perturbed one asset at a time. */
  const sourceWith = (overrides: Record<string, string | undefined> = {}) => ({
    fingerprint: (id: string) =>
      id in overrides ? overrides[id] : mediaDigestSource(data.media, data.texts).fingerprint(id),
    illustrationOf: (id: string) => mediaDigestSource(data.media, data.texts).illustrationOf(id),
  });

  it("is stable while the asset is unchanged", () => {
    expect(lessonDigest(base, sourceWith())).toBe(lessonDigest(base, sourceWith()));
  });

  it("changes when the bytes of a referenced picture change", () => {
    const before = lessonDigest(base, sourceWith());
    // Same lesson text, same media id, different asset content.
    const after = lessonDigest(
      base,
      sourceWith({ "histoire-seau-lisa": "illustration|Lisa…|sha256:" + "0".repeat(64) }),
    );
    expect(after).not.toBe(before);
  });

  it("changes when a referenced picture is relabelled", () => {
    const real = mediaDigestSource(data.media, data.texts).fingerprint("histoire-seau-lisa")!;
    const relabelled = real.replace("Lisa", "Un seau");
    expect(lessonDigest(base, sourceWith({ "histoire-seau-lisa": relabelled }))).not.toBe(
      lessonDigest(base, sourceWith()),
    );
  });

  it("changes when the lesson points at a different picture", () => {
    const swapped = {
      ...base,
      activities: base.activities.map((activity) =>
        activity.mediaIds.length > 0 ? { ...activity, mediaIds: ["objet-seau"] } : activity,
      ),
    };
    expect(lessonDigest(swapped, sourceWith())).not.toBe(lessonDigest(base, sourceWith()));
  });

  it("ignores a picture the lesson does not reference", () => {
    const before = lessonDigest(base, sourceWith());
    const after = lessonDigest(
      base,
      sourceWith({ "forme-triangle": "shape|autre chose|sha256:" + "1".repeat(64) }),
    );
    expect(after).toBe(before);
  });

  it("refuses to fingerprint a lesson whose picture is missing", () => {
    expect(() => lessonDigest(base, sourceWith({ "histoire-seau-lisa": undefined }))).toThrow(
      /cannot be fingerprinted/,
    );
  });

  it("covers the picture a story carries, not only the ones an activity names", () => {
    const story = data.lessons.find((l) => l.id === "m1-lang-09")!;
    const withStoryPicture = story.activities.some(
      (activity) => typeof activity.payload["textId"] === "string",
    );
    expect(withStoryPicture).toBe(true);
    const illustration = mediaDigestSource(data.media, data.texts).illustrationOf(
      "histoire-tika-se-leve",
    )!;
    expect(illustration).not.toBeNull();
    expect(
      lessonDigest(
        story,
        sourceWith({ [illustration]: "illustration|autre|sha256:" + "2".repeat(64) }),
      ),
    ).not.toBe(lessonDigest(story, sourceWith()));
  });
});

describe("human review package", () => {
  const options = REVIEW_PACKAGES[0]!;
  const committed = readFileSync(path.join(ROOT, reviewPackagePath(options)), "utf8");

  it("is up to date with the content (run `npm run review:package`)", () => {
    expect(committed).toBe(buildReviewPackage(data, options));
  });

  it("carries what a reviewer needs, and no approval", () => {
    expect(committed).toContain("ne sont approuvées par**");
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

  /**
   * The age question was the literal string « un enfant de 5 ans (3ème maternelle) » — true of
   * the only level that existed when it was written, and false the moment a second one did. It
   * asked a reviewer of 1ère maternelle, sixteen times in one week, whether the work suited a
   * five-year-old. The wording is now derived, and this test refuses to let it be pinned again.
   */
  it("asks the reviewer about the level in front of them, never another one", () => {
    const named: Record<string, { name: string; band: RegExp; foreign: RegExp }> = {
      "maternelle-1": {
        name: "1ère maternelle",
        band: /à aborder avant 4 ans/,
        foreign: /3ème maternelle|2ème maternelle|enfant de 5 ans/,
      },
      "maternelle-3": {
        name: "3ème maternelle",
        band: /à partir de 5 ans/,
        foreign: /1ère maternelle|2ème maternelle/,
      },
    };
    for (const week of REVIEW_PACKAGES) {
      const expected = named[week.levelId];
      if (expected === undefined) continue;
      const document = readFileSync(path.join(ROOT, reviewPackagePath(week)), "utf8");
      expect(document, `${week.levelId} s${week.week}`).toContain(expected.name);
      expect(document, `${week.levelId} s${week.week}: band wording`).toMatch(expected.band);
      // No other level's name, and no chronological age the programme itself does not pin.
      expect(document, `${week.levelId} s${week.week}: another level's wording`).not.toMatch(
        expected.foreign,
      );
    }
  });

  /**
   * A vocabulary activity's guidance must not name a word the activity does not teach. One did:
   * it told the parent to say « la porte » while the child was learning « la table ».
   */
  it("never names a vocabulary word an activity does not actually teach", () => {
    for (const lesson of data.lessons) {
      for (const activity of lesson.activities) {
        if (activity.type !== "vocabulary") continue;
        const taught = activity.vocabulary.map((entry) => entry.fr);
        const quoted = [...activity.adultGuidance.matchAll(/«\s*(l[ea’]\s?[^»]{2,20}?)\s*»/gi)].map(
          (match) => match[1]!.trim(),
        );
        for (const word of quoted) {
          const isTaught = taught.some(
            (candidate) => candidate.toLowerCase() === word.toLowerCase(),
          );
          expect(
            isTaught,
            `${activity.id}: guidance quotes « ${word} », which it does not teach`,
          ).toBe(true);
        }
      }
    }
  });

  /**
   * The official « réussites attendues » are the yardstick a reviewer judges against. They
   * vanished from weeks 4 and 5 once progression counted only first occurrences: those lessons
   * teach nothing new, so looking at the taught list alone found no competency. A package with
   * no official text is a package that cannot be reviewed.
   */
  /**
   * A reviewer judging « Montre-moi Lisa » has to know which drawing is on the screen. The id
   * alone means nothing to them, so the French alt text travels with it.
   */
  it("identifies every picture an image-dependent activity shows", () => {
    for (const week of REVIEW_PACKAGES) {
      const document = readFileSync(path.join(ROOT, reviewPackagePath(week)), "utf8");
      const shown = data.lessons
        .filter((lesson) => lesson.levelIds.includes(week.levelId))
        .flatMap((lesson) => lesson.activities)
        .filter((activity) => activity.mediaIds.length > 0);
      // Only assert for activities this package actually contains.
      for (const activity of shown) {
        if (!document.includes(activity.title)) continue;
        for (const id of activity.mediaIds) {
          if (!document.includes(`\`${id}\``)) continue;
          const asset = data.media.find((candidate) => candidate.id === id)!;
          expect(
            document,
            `${week.levelId} s${week.week}: ${id} shown without its description`,
          ).toContain(asset.alt);
        }
      }
    }
  });

  it("quotes the official expected outcomes in every package", () => {
    for (const week of REVIEW_PACKAGES) {
      const document = readFileSync(path.join(ROOT, reviewPackagePath(week)), "utf8");
      const blocks = document.match(/\*\*Réussites attendues — texte officiel/g) ?? [];
      expect(
        blocks.length,
        `${week.levelId} semaine ${week.week}: no official expected outcomes`,
      ).toBeGreaterThan(0);
    }
  });

  it("tells the reviewer whose screen time is being counted, and that 35 min is not a target", () => {
    // Two honest numbers rather than one flattering one: what the child does on the screen, and
    // what the child merely looks at on it. Reporting « 0 min » for a day that shows four
    // pictures was not true.
    expect(committed).toContain("Temps d’interaction de l’enfant avec l’écran");
    expect(committed).toContain("Temps où l’enfant regarde une image à l’écran");
    expect(committed).toContain("ne s’additionnent pas");
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
