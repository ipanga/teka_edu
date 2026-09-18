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
    // 3ème Week 2 has had its first full review, which accepted it with modifications: read,
    // and still not approved.
    expect(stateOf("maternelle-3", 2, ["m3-math-05"])).toBe("reviewed");
    // Weeks 3-5 carry only inherited corrections, so they have never been reviewed.
    for (const [week, id] of [
      [3, "m3-math-10"],
      [4, "m3-lang-16"],
      [5, "m3-lang-21"],
    ] as const) {
      expect(stateOf("maternelle-3", week, [id]), `week ${week}`).toBe("never-reviewed");
    }
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

  it("approved Week 1 and left Weeks 2-5 entirely unapproved", () => {
    expect(m3.filter((l) => l.status === "approved")).toHaveLength(16);
    expect(m3.filter((l) => l.status === "review")).toHaveLength(72);
  });

  it("holds a full review that concluded accepted for every approved lesson's week", () => {
    // Week 1 is the only 3ème week with one, and it is the only approved week.
    const accepted = (week: number) =>
      historyOf(week).some((r) => r.scope === "full-review" && r.outcome === "accepted");
    expect(accepted(1)).toBe(true);
    for (const week of [2, 3, 4, 5]) expect(accepted(week), `week ${week}`).toBe(false);
  });

  it("does not let an inherited correction stand in for a review", () => {
    // Weeks 3-5 carry consequence entries only. They are changes, not readings, and they must
    // not be enough to approve anything. Week 2 has since had a real first reading, so it is
    // excluded here and checked below instead.
    for (const week of [3, 4, 5]) {
      const entries = historyOf(week);
      expect(entries.length, `week ${week} has no recorded change`).toBeGreaterThan(0);
      expect(
        entries.every((r) => r.scope === "consequence"),
        `week ${week}`,
      ).toBe(true);
      expect(weekReviewState(["review"], entries), `week ${week}`).toBe("never-reviewed");
    }
  });

  it("leaves Week 2 read twice and still unapproved", () => {
    const entries = historyOf(2);
    const reads = entries.filter((r) => r.scope === "full-review");
    expect(reads).toHaveLength(2);
    for (const read of reads) {
      expect(read.outcome).toBe("accepted-with-modifications");
      expect(read.reviewKind).toBe("ai-assisted");
    }
    // Read twice is still not approved: nothing in Week 2 may carry an approval.
    expect(weekReviewState(["review"], entries)).toBe("reviewed");
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
    expect(approved).toHaveLength(16);
    const seen = new Set<string>();
    for (const lesson of approved) {
      expect(lessonDigest(lesson, media), lesson.id).toBe(lesson.review?.reviewedDigest);
      seen.add(lesson.review?.reviewedDigest ?? "");
    }
    // Sixteen different lessons, sixteen different digests: nothing was reused.
    expect(seen.size).toBe(16);
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
    const lesson = approved.find((l) => l.id === "m3-math-01")!;
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

  it("leaves every Week 2-5 lesson without a review record at all", () => {
    const unapproved = data.lessons.filter(
      (l) => l.levelIds.includes("maternelle-3") && l.status !== "approved",
    );
    expect(unapproved).toHaveLength(72);
    for (const lesson of unapproved) {
      expect(lesson.status, lesson.id).toBe("review");
      expect(lesson.review, lesson.id).toBeNull();
    }
  });
});
