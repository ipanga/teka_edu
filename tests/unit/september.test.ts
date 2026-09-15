import { describe, expect, it } from "vitest";
import { generateSchoolDays } from "@/domain/calendar/school-days";
import { hasTemplate, resolveTemplate } from "@/domain/lessons/template";
import { entriesDueBy } from "@/domain/programme/annual-plan";
import { generateDailyPlan } from "@/domain/programme/daily-plan";
import type { DailyPlan } from "@/domain/programme/types";
import { getProgramme, getReferenceData } from "@/lib/content/reference-data";

const data = getReferenceData();
const calendar = data.calendars.find((c) => c.schoolYear.id === "2026-2027")!;
const programme = getProgramme("maternelle-3", "2026-2027", data)!;
const plan = data.annualPlans.find((p) => p.levelId === "maternelle-3")!;
const days = generateSchoolDays(calendar, data.publicHolidays);

const september = days.filter((day) => day.date.startsWith("2026-09"));
const instructional = september.filter((day) => day.instructional);
const LAST_DAY = instructional.at(-1)?.instructionalDay ?? 0;
const plans: DailyPlan[] = instructional.map((day) =>
  generateDailyPlan(day, programme, data.lessons),
);

describe("September 2026 (3ème maternelle)", () => {
  it("takes its instructional days from the calendar", () => {
    expect(september).toHaveLength(30);
    expect(instructional).toHaveLength(22);
    expect(instructional[0]?.date).toBe("2026-09-01");
    expect(instructional.at(-1)?.date).toBe("2026-09-30");
    expect(LAST_DAY).toBe(22);
    // No holiday and no vacation falls in September 2026; the rest are weekends.
    expect(september.filter((d) => !d.instructional)).toHaveLength(8);
    for (const day of september.filter((d) => !d.instructional)) {
      expect(
        day.reasons.map((r) => r.code),
        day.date,
      ).toContain("weekend");
    }
  });

  it("has a complete programme on every instructional day, and none on the others", () => {
    for (const plan of plans) {
      expect(plan.status, `day ${plan.instructionalDay}`).toBe("complete");
      expect(plan.sessions.every((s) => s.lesson !== null)).toBe(true);
    }
    for (const day of september.filter((d) => !d.instructional)) {
      const empty = generateDailyPlan(day, programme, data.lessons);
      expect(empty.status).toBe("not-instructional");
      expect(empty.sessions).toEqual([]);
    }
  });

  it("keeps every day inside the 30 to 45 minute after-school target", () => {
    for (const plan of plans) {
      expect(plan.totalMinutes, `day ${plan.instructionalDay}`).toBeGreaterThanOrEqual(30);
      expect(plan.totalMinutes, `day ${plan.instructionalDay}`).toBeLessThanOrEqual(45);
      // Screen work stays a small minority of an after-school session for a five-year-old.
      expect(plan.screenMinutes * 2).toBeLessThanOrEqual(plan.totalMinutes);
    }
  });

  it("offers a pause point in the middle, never at the very end", () => {
    for (const plan of plans) {
      expect(plan.pauseAfterSession, `day ${plan.instructionalDay}`).not.toBeNull();
      expect(plan.pauseAfterSession!).toBeGreaterThanOrEqual(1);
      expect(plan.pauseAfterSession!).toBeLessThan(plan.sessions.length);
    }
  });

  it("teaches every objective the annual plan expects by the end of the month", () => {
    const taught = new Set(
      plans.flatMap((plan) =>
        plan.sessions.flatMap((s) => (s.lesson ? [...s.lesson.objectiveCodes] : [])),
      ),
    );
    // An embeddable objective — the date ritual, the safety rules — lives inside another
    // domain's lesson, which is exactly what `embeddable` means in the plan.
    const due = entriesDueBy(plan, LAST_DAY);
    expect(due.length).toBeGreaterThan(0);
    const missing = due.filter((entry) => !taught.has(entry.objectiveCode));
    expect(missing.map((m) => m.objectiveCode)).toEqual([]);
  });

  it("teaches each objective on or before the day the plan asks for it", () => {
    const firstPrimary = new Map<string, number>();
    const firstAnywhere = new Map<string, number>();
    for (const daily of plans) {
      for (const session of daily.sessions) {
        const lesson = session.lesson;
        if (!lesson) continue;
        for (const code of lesson.objectiveCodes) {
          if (!firstPrimary.has(code)) firstPrimary.set(code, daily.instructionalDay!);
        }
        for (const code of [...lesson.objectiveCodes, ...lesson.supportingObjectiveCodes]) {
          if (!firstAnywhere.has(code)) firstAnywhere.set(code, daily.instructionalDay!);
        }
      }
    }
    for (const entry of entriesDueBy(plan, LAST_DAY)) {
      // An embeddable objective may be carried by another domain's lesson (the date ritual
      // opens the language session); the others need a lesson of their own.
      const first = entry.embeddable
        ? firstAnywhere.get(entry.objectiveCode)
        : firstPrimary.get(entry.objectiveCode);
      expect(first, entry.objectiveCode).toBeLessThanOrEqual(entry.introduceByDay);
    }
  });

  it("revisits rather than touching an objective once and moving on", () => {
    const appearances = new Map<string, number>();
    for (const plan of plans) {
      for (const session of plan.sessions) {
        const lesson = session.lesson;
        if (!lesson) continue;
        for (const code of [...lesson.objectiveCodes, ...lesson.supportingObjectiveCodes]) {
          appearances.set(code, (appearances.get(code) ?? 0) + 1);
        }
      }
    }
    /**
     * Anything introduced in the first three weeks comes back at least once more in September.
     *
     * Two objectives do not, and they are named here rather than hidden. Until the lesson-level
     * objective lists were re-derived from the activities that actually work them, several
     * lessons claimed these two without any activity touching them, and this assertion passed on
     * that stale metadata. The content gap is real and belongs to 3ème maternelle's own
     * pedagogical review, which has not finished; this task was scoped not to author 3ème
     * content. Remove an entry from this list when the objective genuinely comes back.
     */
    /**
     * `ART-S02-C02-O08` — creating a soundscape to a simple instruction — is introduced on day 13
     * and is a `periodic` objective whose plan reinforces it until day 58. One appearance inside
     * September is what that pacing asks for; the revisits belong to October and November. A
     * second soundscape was **not** invented to make this number larger.
     *
     * `LANG-S02-C01-O13` was a real gap and is now genuinely revisited on day 21, where the
     * child already had to hold syllables across a pause and rebuild the word.
     */
    const plannedBeyondSeptember = new Set(["ART-S02-C02-O08"]);
    for (const entry of entriesDueBy(plan, 14)) {
      const seen = appearances.get(entry.objectiveCode) ?? 0;
      if (plannedBeyondSeptember.has(entry.objectiveCode)) {
        expect(seen, `${entry.objectiveCode} is paced beyond September`).toBe(1);
        continue;
      }
      expect(seen, entry.objectiveCode).toBeGreaterThan(1);
    }
  });

  it("brings something back every day, and closes each week by consolidating", () => {
    const roles = (plan: DailyPlan) =>
      plan.sessions.flatMap((s) => s.lesson?.activities.map((a) => a.role) ?? []);
    // Day 1 has nothing to bring back yet; every later day opens with a recall.
    for (const plan of plans.slice(1)) {
      expect(roles(plan), `day ${plan.instructionalDay}`).toContain(
        plan.instructionalDay !== null && [4, 9, 14, 19, 22].includes(plan.instructionalDay)
          ? "consolidation"
          : "retrieval",
      );
    }
    // The last instructional day of each September week consolidates.
    for (const day of [4, 9, 14, 19, 22]) {
      const plan = plans.find((p) => p.instructionalDay === day)!;
      expect(roles(plan), `day ${day}`).toContain("consolidation");
    }
  });

  it("does not author October: content stops where the month stops", () => {
    const october = generateDailyPlan(
      days.find((d) => d.instructionalDay === LAST_DAY + 1)!,
      programme,
      data.lessons,
    );
    expect(october.status).toBe("no-content");
  });
});

describe("September content quality", () => {
  const lessons = data.lessons;
  const activities = lessons.flatMap((l) => l.activities);

  it("gives the parent something concrete to do and the child one thing at a time", () => {
    for (const activity of activities) {
      expect(activity.adultGuidance.length, activity.id).toBeGreaterThan(40);
      // One instruction, not a paragraph: a five-year-old cannot hold three tasks at once.
      expect(activity.childInstruction.length, activity.id).toBeLessThanOrEqual(160);
    }
  });

  it("never writes a calendar date into the content", () => {
    // The defect this replaces: a lesson taught on 3 September that said "mardi 1er septembre".
    const written =
      /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+\d|\b\d{1,2}(er)?\s+(janvier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|décembre)\b/i;
    for (const lesson of lessons) {
      for (const activity of lesson.activities) {
        const text = `${activity.childInstruction} ${activity.adultGuidance} ${JSON.stringify(activity.payload)}`;
        expect(text, activity.id).not.toMatch(written);
      }
    }
  });

  it("fills the date placeholder in from the day being taught", () => {
    const first = generateDailyPlan(
      days.find((d) => d.instructionalDay === 1)!,
      programme,
      data.lessons,
    );
    const ritual = first.sessions[0]?.lesson?.activities[0];
    expect(ritual?.adultGuidance).toContain("mardi 1er septembre 2026");
    expect(hasTemplate(ritual?.adultGuidance ?? "")).toBe(false);

    const sixth = generateDailyPlan(
      days.find((d) => d.instructionalDay === 6)!,
      programme,
      data.lessons,
    );
    expect(sixth.sessions[0]?.lesson?.activities[0]?.adultGuidance).toContain(
      "mardi 8 septembre 2026",
    );
    // The placeholder is left alone when there is no date to put in it.
    expect(resolveTemplate("le {{date}}", null)).toBe("le {{date}}");
  });

  it("supplies every story and rhyme it asks the parent to read", () => {
    const needing = activities.filter((a) =>
      ["read-aloud", "listening-story", "song-rhyme"].includes(a.type),
    );
    expect(needing.length).toBeGreaterThan(20);
    for (const activity of needing) {
      const textId = activity.payload["textId"];
      expect(typeof textId, activity.id).toBe("string");
      const text = data.texts.find((t) => t.id === textId);
      expect(text, `${activity.id} → ${String(textId)}`).toBeDefined();
      expect(text!.lines.length).toBeGreaterThan(3);
      // Everything Teka Edu supplies is its own: no third-party text without cleared rights.
      expect(text!.origin, text!.id).toBe("teka-edu-created");
      expect(text!.provenance.length).toBeGreaterThan(20);
    }
  });

  it("offers a material alternative for everything it asks a family to find", () => {
    const used = new Set(activities.flatMap((a) => a.materialCodes));
    for (const code of used) {
      if (code === "aucun") continue;
      const material = data.materials.find((m) => m.code === code);
      expect(material, code).toBeDefined();
      expect(material!.alternatives, code).toBeTruthy();
    }
  });

  /**
   * September is not yet through the pedagogical gate (ADR-047). This asserts that plainly
   * rather than asserting it can never change: when a batch passes review, this expectation is
   * updated in the same commit that records the approval, which is the point at which someone
   * should have to think about it.
   */
  /**
   * Everything outside the one reviewed week is still waiting, and nothing carries an
   * approval-shaped record without an approval.
   */
  it("leaves every unreviewed lesson at review, with no approval record", () => {
    for (const lesson of lessons) {
      if (lesson.status === "approved") {
        expect(lesson.review, lesson.id).not.toBeNull();
        continue;
      }
      expect(lesson.status, lesson.id).toBe("review");
      expect(lesson.review, lesson.id).toBeNull();
    }
  });

  /**
   * No week is approved at the moment. Week 1 had been, and its approval lapsed when the
   * progression correction changed the objective metadata the digest covers — which is exactly
   * what ADR-035 built the digest for. Re-stamping it silently is the one thing that mechanism
   * exists to prevent, so it went back to `review` and awaits a short re-confirmation.
   *
   * When a week is approved again, assert here that it is recorded as the review it actually
   * had: `ai-assisted`, with a reviewer no one could mistake for a teacher.
   */
  it("records any approval as the kind of review it actually was", () => {
    for (const lesson of data.lessons) {
      if (lesson.status !== "approved") continue;
      expect(lesson.review, lesson.id).not.toBeNull();
      expect(lesson.review!.reviewKind, lesson.id).toBe("ai-assisted");
      expect(lesson.review!.reviewer, lesson.id).not.toMatch(/institut|enseignant|professeur/i);
    }
  });
});

/**
 * Safety rules for the youngest band, made mechanical after the 1ère maternelle Week 1 review.
 * Each one is here because it was actually written into the content and had to be corrected:
 * a three-year-old asked to push a chair, a child told to run at a wall, and small objects
 * offered as the default thing to count.
 */
describe("1ère maternelle safety (before-4)", () => {
  const data = getReferenceData();
  /**
   * The allowlist that used to live here is gone: every defect it tracked has been corrected,
   * and the approvals that covered the old text lapsed rather than being re-stamped. If one ever
   * needs to come back, it means a known defect is shipping — say so here, and let it shrink.
   */
  const lessons = data.lessons.filter((lesson) => lesson.levelIds.includes("maternelle-1"));
  const activities = lessons.flatMap((lesson) => lesson.activities);

  it("has content to check", () => {
    expect(activities.length).toBeGreaterThan(100);
  });

  /**
   * « Ma tête, mon ventre » asked the child to show their hand and their foot, and the English
   * scaffold said "head". The activity had been copied from the previous body-part lesson and
   * only its title updated. A title naming body parts is a promise about what the activity does.
   */
  /**
   * Screen time was reported as a single « 0 min » on days that show a child four pictures,
   * because only interactive activities counted. Two numbers now answer two questions, and the
   * looking one must never be zero on a day that actually shows something.
   */
  /**
   * Narrow on purpose. Closing the eyes is fine as an invitation and is genuinely useful for
   * listening; what is forbidden is *requiring* it, since neither the auditory nor the tactile
   * objective needs it. A global ban on the phrase would forbid offering it at all.
   */
  it("invites closing the eyes, never requires it", () => {
    for (const activity of activities) {
      if (!/ferme les yeux/i.test(activity.childInstruction)) continue;
      expect(
        /si tu veux|si tu le veux|tu peux/i.test(activity.childInstruction),
        `${activity.id}: « ferme les yeux » is an instruction, not an offer`,
      ).toBe(true);
    }
  });

  /**
   * A physical activity has a specific task; « Move with me. » tells an English-speaking parent
   * nothing about throwing a ball into a bucket.
   */
  it("gives a physical activity an English scaffold about its own task", () => {
    for (const activity of activities) {
      if (activity.type !== "movement") continue;
      const scaffold = activity.scaffolds.find((entry) => entry.language === "en");
      if (scaffold === undefined) continue;
      expect(
        scaffold.childInstruction,
        `${activity.id}: generic scaffold for « ${activity.childInstruction} »`,
      ).not.toBe("Move with me.");
    }
  });

  /**
   * « Regarde l'image. Montre-moi Lisa. » was shipped against a drawing of a bucket — the task
   * was impossible as authored, and nothing caught it until the review package began naming the
   * picture. A deterministic check on the canonical content is enough here.
   */
  it("shows a picture containing Lisa when the child is asked to find her", () => {
    const asking = activities.filter((activity) =>
      /montre-moi lisa/i.test(activity.childInstruction),
    );
    expect(asking.length, "no Lisa-identification activity found").toBeGreaterThan(0);
    for (const activity of asking) {
      expect(activity.mediaIds, `${activity.id}: shows no picture`).not.toHaveLength(0);
      for (const id of activity.mediaIds) {
        const asset = data.media.find((candidate) => candidate.id === id)!;
        expect(asset, `${activity.id}: ${id} is not in the registry`).toBeDefined();
        expect(
          asset.alt.toLowerCase(),
          `${activity.id}: shows « ${asset.alt} », which does not contain Lisa`,
        ).toContain("lisa");
      }
    }
  });

  it("says a fixed age nowhere the programme uses a developmental band", () => {
    for (const activity of activities) {
      expect(activity.adultGuidance, `${activity.id}`).not.toMatch(
        /à (deux|trois|quatre|cinq) ans/,
      );
    }
  });

  it("tells the adult that a gesture answers a comprehension question", () => {
    for (const activity of activities) {
      if (!Array.isArray(activity.payload["questions"])) continue;
      expect(activity.adultGuidance, `${activity.id}: no response rule`).toMatch(
        /doigt pointé|geste/,
      );
      // Either phrasing is fine; what must be there is the rule.
      expect(activity.adultGuidance, `${activity.id}: full sentence not excluded`).toMatch(
        /jamais une phrase entière|phrase entière n’est jamais demandée/,
      );
    }
  });

  /**
   * Saying « un, deux, trois, quatre, cinq, six » and counting six things are different
   * learnings, and September only does the first. An activity that works the oral sequence alone
   * must not be dressed as a collection: no six objects to enumerate, and no picture of one.
   */
  it("never turns the number rhyme into a six-object collection", () => {
    const oral = activities.filter(
      (activity) =>
        activity.objectiveCodes.includes("MATH-S01-C01-O09") &&
        !activity.objectiveCodes.some(
          (code) => code === "MATH-S01-C01-O03" || code === "MATH-S01-C01-O04",
        ),
    );
    expect(oral.length, "no pure oral-sequence activity found").toBeGreaterThan(0);
    for (const activity of oral) {
      const upTo = activity.payload["upTo"];
      if (typeof upTo === "number" && upTo > 3) {
        // Reciting to six is fine; needing six things in front of the child is not.
        expect(
          activity.materialCodes,
          `${activity.id}: asks for objects to recite to ${upTo}`,
        ).toEqual(["aucun"]);
        expect(
          activity.mediaIds,
          `${activity.id}: shows a collection for an oral task`,
        ).toHaveLength(0);
      }
    }
  });

  it("keeps concrete counting at three while the rhyme goes to six", () => {
    const maths = data.lessons.filter(
      (lesson) => lesson.levelIds.includes("maternelle-1") && lesson.domainCode === "MATH",
    );
    expect(maths.length).toBeGreaterThan(0);
    for (const lesson of maths) {
      expect(lesson.parentGuidance, `${lesson.id}`).toMatch(/jamais plus de trois objets/i);
      expect(lesson.parentGuidance, `${lesson.id}`).toMatch(/jusqu’à six/i);
    }
    // And no activity asks the child to hand over more than three.
    for (const activity of activities) {
      const asked = activity.childInstruction.match(/donne-moi (un|deux|trois|quatre|cinq|six)/i);
      if (asked === null) continue;
      expect(["un", "deux", "trois"], `${activity.id}: asks for ${asked[1]}`).toContain(
        asked[1]!.toLowerCase(),
      );
    }
  });

  it("never reports zero looking time on a day that shows the child a picture", () => {
    for (const plan of plans) {
      const shows = plan.sessions.some(
        (session) =>
          session.lesson?.activities.some(
            (activity) =>
              activity.mediaIds.length > 0 || typeof activity.payload["textId"] === "string",
          ) ?? false,
      );
      if (!shows) continue;
      expect(plan.pictureMinutes, `day ${plan.instructionalDay}`).toBeGreaterThan(0);
    }
  });

  it("teaches the body parts its title names", () => {
    const parts: Record<string, { media: string; french: string }> = {
      main: { media: "corps-main", french: "ta main" },
      pied: { media: "corps-pied", french: "ton pied" },
      tête: { media: "corps-tete", french: "ta tête" },
      ventre: { media: "corps-ventre", french: "ton ventre" },
    };
    for (const activity of activities) {
      if (!activity.mediaIds.some((id) => id.startsWith("corps-"))) continue;
      const named = Object.keys(parts).filter((part) =>
        activity.title.toLowerCase().includes(part),
      );
      if (named.length === 0) continue;
      for (const part of named) {
        expect(activity.mediaIds, `${activity.id}: title says ${part}`).toContain(
          parts[part]!.media,
        );
        const saysIt =
          activity.childInstruction.includes(parts[part]!.french) ||
          activity.vocabulary.some((entry) => entry.fr.includes(part));
        expect(saysIt, `${activity.id}: title says ${part}, the activity never does`).toBe(true);
      }
    }
  });

  it("never asks the youngest child to move furniture", () => {
    for (const activity of activities) {
      const text = `${activity.childInstruction} ${activity.adultGuidance}`;
      expect(text, `${activity.id}`).not.toMatch(
        /(?:c’est lui qui|l’enfant) (?:pousse|déplace|écarte)[^.]*(?:chaise|meuble|table)/i,
      );
    }
  });

  it("never sends a running child at a wall, a door or a tree", () => {
    for (const activity of activities) {
      if (activity.type !== "movement") continue;
      const text = `${activity.childInstruction} ${activity.adultGuidance}`;
      expect(text, `${activity.id}`).not.toMatch(/cours jusqu’(?:au mur|à la porte|à l’arbre)/i);
      expect(text, `${activity.id}`).not.toMatch(/but visible\s*:\s*le mur/i);
    }
  });

  it("counts with objects too big to swallow, and keeps small ones supervised", () => {
    const counting = activities.filter(
      (activity) => activity.type === "counting" || activity.type === "manipulation",
    );
    expect(counting.length).toBeGreaterThan(0);
    for (const activity of counting) {
      // `petits-objets` is cailloux/capsules/haricots: never the default for this band.
      expect(activity.materialCodes, `${activity.id}`).not.toContain("petits-objets");
      if (/cailloux|capsules|haricots/i.test(activity.adultGuidance)) {
        expect(activity.adultGuidance, `${activity.id}: small objects without supervision`).toMatch(
          /surveillance/i,
        );
      }
    }
  });
});

/**
 * Consistency rules, each written after a real contradiction reached a reviewer. They are
 * deliberately general rather than keyed to lesson ids: the same copy-and-rename that produced
 * « Donne-moi trois » asking for two will happen again in October.
 */
describe("an activity must be what it says it is", () => {
  const data = getReferenceData();
  const activities = data.lessons.flatMap((lesson) =>
    lesson.activities.map((activity) => ({ lesson, activity })),
  );
  const NUMBERS: Record<string, number> = {
    un: 1,
    deux: 2,
    trois: 3,
    quatre: 4,
    cinq: 5,
    six: 6,
  };
  /** The largest number word in a piece of French text, or null. */
  const largest = (text: string): number | null => {
    const found = Object.entries(NUMBERS)
      .filter(([word]) => new RegExp(`\\b${word}\\b`, "i").test(text))
      .map(([, value]) => value);
    return found.length > 0 ? Math.max(...found) : null;
  };

  /**
   * Only where a quantity *is* the task. « Les quatre mots de la maison » counts the words
   * reviewed, not a collection to hand over, and the child is deliberately asked to say one or
   * two of them — the title is not lying there.
   */
  it("never promises a quantity in its title that the child is not asked for", () => {
    for (const { activity } of activities) {
      if (!/donne-moi/i.test(activity.childInstruction)) continue;
      const promised = largest(activity.title);
      if (promised === null) continue;
      const asked = largest(activity.childInstruction);
      if (asked === null) continue;
      expect(asked, `${activity.id}: titled « ${activity.title} » but asks for ${asked}`).toBe(
        promised,
      );
    }
  });

  it("makes the English scaffold ask for the same quantity as the French", () => {
    const EN: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
    for (const { activity } of activities) {
      const scaffold = activity.scaffolds.find((entry) => entry.language === "en");
      if (scaffold === undefined) continue;
      const french = largest(activity.childInstruction);
      const english = Object.entries(EN)
        .filter(([word]) => new RegExp(`\\b${word}\\b`, "i").test(scaffold.childInstruction))
        .map(([, value]) => value);
      if (french === null || english.length === 0) continue;
      expect(
        Math.max(...english),
        `${activity.id}: French asks ${french}, English asks ${Math.max(...english)}`,
      ).toBe(french);
    }
  });

  it("teaches body words on a body, not with household objects", () => {
    const BODY = new Set(["la main", "le pied", "la tête", "le ventre"]);
    for (const { activity } of activities) {
      if (activity.type !== "vocabulary") continue;
      const words = activity.vocabulary.map((entry) => entry.fr);
      if (words.length === 0 || !words.every((word) => BODY.has(word))) continue;
      expect(activity.materialCodes, `${activity.id}: body words need no objects`).toEqual([
        "aucun",
      ]);
      expect(activity.adultGuidance, `${activity.id}`).not.toMatch(/sinon l’image|la chose vraie/);
    }
  });

  /**
   * The real defect was copy-and-paste *inside a lesson*: « Ma tête, mon ventre » put its target
   * words on the greeting ritual and on a rhyme about hands and feet, neither of which teaches
   * them.
   *
   * Verbatim containment turned out to be the wrong test for this — a lexicon is a teaching
   * target, and « courir » legitimately appears in an instruction as « cours ». So the rule is
   * narrower and matches the fault: a sibling activity may not simply inherit the lesson's
   * vocabulary activity's word list.
   */
  it("does not copy one activity's target lexicon onto its siblings", () => {
    for (const lesson of data.lessons) {
      const teacher = lesson.activities.find((activity) => activity.type === "vocabulary");
      if (teacher === undefined || teacher.vocabulary.length === 0) continue;
      const taught = new Set(teacher.vocabulary.map((entry) => entry.fr));
      for (const activity of lesson.activities) {
        if (activity.id === teacher.id || activity.vocabulary.length === 0) continue;
        const inherited = activity.vocabulary.every((entry) => taught.has(entry.fr));
        if (!inherited) continue;
        // Inheriting is only honest when the sibling genuinely uses the words.
        const text = `${activity.childInstruction} ${activity.adultGuidance}`.toLowerCase();
        const uses = activity.vocabulary.some((entry) =>
          text.includes(entry.fr.replace(/^(le|la|les|l’|un|une|des)\s*/i, "").toLowerCase()),
        );
        expect(
          uses,
          `${activity.id}: carries « ${teacher.title} »'s lexicon but never uses it`,
        ).toBe(true);
      }
    }
  });

  it("exercises every spatial marker its title claims", () => {
    for (const { activity } of activities) {
      const markers = ["sur", "sous", "dans"].filter((word) =>
        new RegExp(`\\b${word}\\b`, "i").test(activity.title),
      );
      if (markers.length < 2) continue;
      for (const marker of markers) {
        expect(
          new RegExp(`\\b${marker}\\b`, "i").test(activity.childInstruction),
          `${activity.id}: titled « ${activity.title} » but the child never does « ${marker} »`,
        ).toBe(true);
      }
    }
  });

  it("never claims to need nothing while asking the child to handle something", () => {
    for (const { activity } of activities) {
      if (!activity.materialCodes.includes("aucun")) continue;
      expect(activity.materialCodes, `${activity.id}`).toEqual(["aucun"]);
      // "Touch", "give me", "put" all require an object in the child's hands.
      const needsObject = /\btouche\b|\bdonne-moi\b|\bmets\b/i.test(activity.childInstruction);
      const ownBody = /ta main|ton pied|ta tête|ton ventre|tes mains/i.test(
        activity.childInstruction,
      );
      expect(
        needsObject && !ownBody,
        `${activity.id}: says « aucun matériel » but asks the child to handle something`,
      ).toBe(false);
    }
  });
});
