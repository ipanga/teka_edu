import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkLessonReview, lessonDigest, weekReviewState } from "@/domain/lessons/review";
import { mediaDigestSource } from "@/domain/media/types";
import { getReferenceData } from "@/lib/content/reference-data";

const ROOT = process.cwd();

/**
 * A generated document may only claim what the content's state supports.
 *
 * The change-audit document told a reviewer that five weeks « avaient été acceptées » and could
 * be restored to `approved` once the listed fields were confirmed. For 3ème maternelle that was
 * false twice over: no week had ever been approved, and four of them had never been read at all.
 * The wording was written for the one level it was first needed on, and then asserted for every
 * level. These tests pin the four states so it cannot happen again.
 */
const full = (outcome: string) => ({ scope: "full-review", outcome });
const consequence = (outcome: string) => ({ scope: "consequence", outcome });

describe("what a batch of content has actually been through", () => {
  it("calls an approved batch approved, so reconfirmation language is allowed", () => {
    expect(weekReviewState(["approved", "approved"], [full("accepted")])).toBe("approved");
  });

  it("still calls it approved once the digest changed and the approval lapsed", () => {
    // The lessons are back at `review`, but this batch was accepted outright and may be restored.
    expect(weekReviewState(["review", "review"], [full("accepted")])).toBe("approved");
  });

  it("calls a reviewed-but-not-approved batch reviewed, never approved", () => {
    const state = weekReviewState(["review"], [full("accepted-with-modifications")]);
    expect(state).toBe("reviewed");
    expect(state).not.toBe("approved");
  });

  it("calls a never-reviewed batch never-reviewed", () => {
    expect(weekReviewState(["review", "review"], [])).toBe("never-reviewed");
  });

  it("does not count a change inherited from another batch's review as a review", () => {
    // The whole defect: `consequence` entries made four unread weeks look reviewed.
    expect(weekReviewState(["review"], [consequence("accepted-with-modifications")])).toBe(
      "never-reviewed",
    );
    expect(weekReviewState(["review"], [consequence("accepted")])).toBe("never-reviewed");
  });

  it("calls a draft batch draft, so no approval language reaches it", () => {
    const state = weekReviewState(["draft", "draft"], []);
    expect(state).toBe("draft");
    expect(state).not.toBe("approved");
  });

  it("matches the canonical September state of both levels", () => {
    const data = getReferenceData();
    const stateOf = (levelId: string, week: number, lessonIds: readonly string[]) =>
      weekReviewState(
        lessonIds.map((id) => data.lessons.find((l) => l.id === id)!.status),
        data.reviewHistory.filter((r) => r.levelId === levelId && r.week === week),
      );
    // 1ère maternelle is approved; nothing here may quietly change that.
    expect(stateOf("maternelle-1", 1, ["m1-lang-01"])).toBe("approved");
    // 3ème Week 1 has now been read three times and finally accepted.
    expect(stateOf("maternelle-3", 1, ["m3-math-01"])).toBe("approved");
    // 3ème Week 2 is approved too, after four passes.
    expect(stateOf("maternelle-3", 2, ["m3-math-05"])).toBe("approved");
    // 3ème Week 3 is approved too, after three passes.
    expect(stateOf("maternelle-3", 3, ["m3-math-10"])).toBe("approved");
    // 3ème Week 4 is approved too, after three passes.
    expect(stateOf("maternelle-3", 4, ["m3-lang-16"])).toBe("approved");
    // 3ème Week 5 is approved too, after two passes. September is now complete for both
    // levels, so every week in this list is approved — which is exactly why the rules below
    // are stated as equivalences rather than as counts.
    expect(stateOf("maternelle-3", 5, ["m3-lang-21"])).toBe("approved");
  });
});

describe("the generated change audit says only what the state supports", () => {
  const audit = readFileSync(
    path.join(ROOT, "docs/review/2026-2027-maternelle-3-semaines-1-5-audit-des-changements.md"),
    "utf8",
  );

  it("never offers to restore an approval that never existed", () => {
    expect(audit).not.toMatch(/avaient été acceptées/);
    expect(audit).not.toMatch(/peuvent retrouver le statut/);
    expect(audit).not.toMatch(/approbations\s+correspondantes ont été annulées/);
  });

  it("says plainly that confirming these changes approves nothing", () => {
    expect(audit).toContain("n’ont pas encore reçu leur relecture pédagogique complète");
    expect(audit).toContain("ne vaut pas approbation");
    expect(audit).toContain("aucune leçon n’y est approuvée");
  });

  it("is named for what it is, not for a reconfirmation", () => {
    expect(audit.startsWith("# Audit des changements")).toBe(true);
  });
});

describe("an approval can only come from a full review that accepted the week", () => {
  const data = getReferenceData();
  const m3 = data.lessons.filter((l) => l.levelIds.includes("maternelle-3"));
  const historyOf = (week: number) =>
    data.reviewHistory.filter((r) => r.levelId === "maternelle-3" && r.week === week);
  /** Week 1 is days 1-4, then five days a week; lesson ids carry their track step, so map by id. */
  const WEEK_LESSONS: Record<number, string[]> = {
    1: ["m3-math-01", "m3-lang-01"],
    2: ["m3-math-05", "m3-lang-05"],
    3: ["m3-math-10", "m3-lang-10"],
    4: ["m3-lang-16", "m3-math-16"],
    5: ["m3-lang-21", "m3-math-21"],
  };
  const lessonsOfWeek = (week: number) =>
    WEEK_LESSONS[week]!.map((id) => m3.find((l) => l.id === id)!);

  it("splits every lesson between approved and review, and nothing else", () => {
    const approved = m3.filter((l) => l.status === "approved").length;
    const review = m3.filter((l) => l.status === "review").length;
    expect(approved).toBeGreaterThan(0);
    expect(approved + review).toBe(m3.length);
  });

  it("holds an accepted full review for exactly the weeks that are approved", () => {
    // Stated as an equivalence rather than a list of week numbers, so it keeps meaning as the
    // weeks are approved one by one.
    const accepted = (week: number) =>
      historyOf(week).some((r) => r.scope === "full-review" && r.outcome === "accepted");
    for (const week of [1, 2, 3, 4, 5]) {
      const lessons = lessonsOfWeek(week);
      expect(lessons.length, `week ${week} has no lessons`).toBeGreaterThan(0);
      const isApproved = lessons.some((l) => l.status === "approved");
      // No approval without an accepted full review, ever.
      if (isApproved) expect(accepted(week), `week ${week}`).toBe(true);
      // An accepted week whose lessons are back at `review` is a *lapse*, and a lapse is never
      // silent: a `consequence` entry dated on or after the accepting pass says what changed
      // (ADR-048: a redrawn picture lapses the approval of every lesson that shows it).
      if (accepted(week) && !isApproved) {
        const acceptedOn = historyOf(week)
          .filter((r) => r.scope === "full-review" && r.outcome === "accepted")
          .map((r) => r.reviewedOn)
          .sort()
          .at(-1)!;
        expect(
          historyOf(week).some((r) => r.scope === "consequence" && r.reviewedOn >= acceptedOn),
          `week ${week}: accepted, not approved, and no consequence entry explains the lapse`,
        ).toBe(true);
      }
    }
  });

  it("does not let an inherited correction stand in for a review", () => {
    // Every 3ème week has now been read at least once, so there is no week left whose history
    // is corrections alone. The rule is what mattered, not the example: stated against the
    // recorded consequence entries themselves, it keeps its meaning after the last week is
    // read, and after the next level starts producing them.
    const inherited = data.reviewHistory.filter((r) => r.scope === "consequence");
    expect(inherited.length, "no consequence entry recorded anywhere").toBeGreaterThan(0);
    for (const entry of inherited) {
      expect(
        weekReviewState(["review"], [entry]),
        `${entry.levelId} week ${entry.week}, ${entry.reviewedOn}`,
      ).toBe("never-reviewed");
    }
  });

  it("keeps the whole history of a week that took several passes to accept", () => {
    // Week 2 was read four times, Week 3 three times and Week 4 three times; each ended
    // `accepted` only at the last pass. The earlier passes are not rewritten to look cleaner
    // than they were, and Week 4's four inherited corrections stay labelled as corrections.
    for (const week of [2, 3, 4]) {
      const passes = historyOf(week).filter((r) => r.scope === "full-review");
      expect(
        passes.filter((r) => r.outcome === "accepted-with-modifications").length,
        `week ${week}`,
      ).toBeGreaterThan(0);
      // The pedagogical passes ended `accepted`, after at least one pass that asked for
      // modifications. A later pass may follow — the visual reconfirmation of 2026-09-23 came back
      // `accepted-with-modifications` for a picture — without rewriting what was accepted before.
      const lastAccepted = passes.map((r) => r.outcome).lastIndexOf("accepted");
      expect(lastAccepted, `week ${week} was never accepted`).toBeGreaterThan(0);
      expect(
        passes.slice(0, lastAccepted).some((r) => r.outcome === "accepted-with-modifications"),
        `week ${week}`,
      ).toBe(true);
    }
    const reads = historyOf(2).filter((r) => r.scope === "full-review");
    expect(reads.length).toBeGreaterThanOrEqual(2);
    expect(reads.filter((r) => r.outcome === "accepted-with-modifications").length).toBeGreaterThan(
      0,
    );
    expect(reads.some((r) => r.outcome === "accepted")).toBe(true);
    for (const read of reads) expect(read.reviewKind, read.reviewedOn).toBe("ai-assisted");
  });

  it("refuses to treat accepted-with-modifications as an approval", () => {
    expect(weekReviewState(["review"], [full("accepted-with-modifications")])).toBe("reviewed");
  });

  it("records every approval as AI-assisted, and never as a teacher's", () => {
    for (const l of m3.filter((x) => x.status === "approved")) {
      expect(l.review?.reviewKind, l.id).toBe("ai-assisted");
      expect(l.review?.reviewerRole ?? "", l.id).not.toMatch(/enseignant|professeur|teacher/i);
    }
  });
});

describe("the approvals granted to 3ème maternelle Week 1 are protected", () => {
  const data = getReferenceData();
  const media = mediaDigestSource(data.media, data.texts);
  const approved = data.lessons.filter(
    (l) => l.levelIds.includes("maternelle-3") && l.status === "approved",
  );

  it("recomputes every stored digest exactly, so none was copied or forged", () => {
    expect(approved.length).toBeGreaterThan(0);
    const seen = new Set<string>();
    for (const lesson of approved) {
      expect(lessonDigest(lesson, media), lesson.id).toBe(lesson.review?.reviewedDigest);
      seen.add(lesson.review?.reviewedDigest ?? "");
    }
    // One digest per lesson, all different: nothing was reused.
    expect(seen.size).toBe(approved.length);
  });

  it("lapses when adult guidance changes", () => {
    const lesson = approved.find((l) => l.id === "m3-phys-01")!;
    const before = lessonDigest(lesson, media);
    const edited = {
      ...lesson,
      activities: lesson.activities.map((a, i) =>
        i === 0 ? { ...a, adultGuidance: `${a.adultGuidance} Et déplacez la chaise.` } : a,
      ),
    };
    expect(lessonDigest(edited, media)).not.toBe(before);
    expect(checkLessonReview(edited, media).join("\n")).toMatch(/changed since it was approved/);
  });

  it("lapses when the child's own instruction changes", () => {
    // Any approved lesson will do: the one this test named first (m3-math-01) has since had its
    // approval lapse for a redrawn picture (ADR-048), which is the mechanism working, not a
    // reason to pin the test to a lesson that may lapse again.
    const lesson = approved.find((l) => l.activities.length > 0)!;
    const before = lessonDigest(lesson, media);
    const edited = {
      ...lesson,
      activities: lesson.activities.map((a, i) =>
        i === 0 ? { ...a, childInstruction: "Compte jusqu’à vingt." } : a,
      ),
    };
    expect(lessonDigest(edited, media)).not.toBe(before);
    expect(checkLessonReview(edited, media).join("\n")).toMatch(/changed since it was approved/);
  });

  it("lapses when the bytes of a picture the child is shown change", () => {
    // The geometry lesson's eight shape exemplars are the whole point of its correction.
    const lesson = approved.find((l) => l.id === "m3-math-03")!;
    const before = lessonDigest(lesson, media);
    const poisoned = {
      fingerprint: (id: string) =>
        id === "forme-carre-penche"
          ? `shape|Un carré|sha256:${"0".repeat(64)}`
          : media.fingerprint(id),
      illustrationOf: (id: string) => media.illustrationOf(id),
      textFingerprint: (id: string) => media.textFingerprint(id),
    };
    expect(lessonDigest(lesson, poisoned)).not.toBe(before);
  });

  it("gives a review record to approved lessons, and to nothing else", () => {
    // This used to be stated over the unapproved lessons, guarded by « there is at least one ».
    // September is now complete, so there are none left and that guard would have had to be
    // deleted — which would have left the rule passing over an empty list for the rest of the
    // year. Stated in both directions it holds on real data today, and it comes back to life
    // on its own as soon as October is authored.
    const lessons = data.lessons.filter((l) => l.levelIds.includes("maternelle-3"));
    expect(lessons.length).toBeGreaterThan(0);
    for (const lesson of lessons) {
      if (lesson.status === "approved") {
        expect(lesson.review, lesson.id).not.toBeNull();
      } else {
        expect(lesson.status, lesson.id).toBe("review");
        expect(lesson.review, lesson.id).toBeNull();
      }
    }
  });
});
