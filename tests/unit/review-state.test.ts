import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { weekReviewState } from "@/domain/lessons/review";
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
    // 3ème Week 1 has been read twice and accepted with modifications both times.
    expect(stateOf("maternelle-3", 1, ["m3-math-01"])).toBe("reviewed");
    // 3ème Weeks 2-5 carry only inherited corrections, so they have never been reviewed.
    for (const [week, id] of [
      [2, "m3-math-05"],
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
