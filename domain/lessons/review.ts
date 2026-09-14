import type { Lesson } from "./types";

/**
 * The content quality gate (ADR-035, refined by ADR-047; docs/CONTENT_QUALITY_GATE.md).
 *
 * Lessons and activities are written by Teka Edu, often with the help of a language model.
 * Nothing written that way may reach a child as "approved" on its own authority: an independent
 * review has to read it and say so. This module makes that rule mechanical.
 *
 * ADR-047 changed who that reviewer must be, and only that. No preschool teacher is available to
 * the project, so the active development gate is an AI-assisted review of a generated package
 * against the official programme; a review by a person who teaches this age remains a stronger
 * claim and optional future assurance. Because the two are not equivalent, an approval records
 * which one it was — see `REVIEW_KINDS` below.
 *
 *   draft    — being written; never scheduled for a child
 *   review   — finished, and not yet through the gate (where AI-drafted content stops)
 *   approved — an independent review accepted this exact text, on a date, and said which kind
 *   retired  — withdrawn; kept for history
 *
 * Approval is bound to the exact content through `reviewedDigest`. Editing an approved lesson
 * changes its digest, the check below fails, and the lesson has to go back to `review`. That is
 * what stops a silent edit from inheriting somebody else's approval.
 */

export const LESSON_STATUSES = ["draft", "review", "approved", "retired"] as const;

/**
 * Who performed a pedagogical review (ADR-047).
 *
 * `approved` on its own says only that the gate was passed, never by whom. Teka Edu's active
 * development gate is an AI-assisted review of a generated package against the official
 * programme; a review by a person who teaches this age is a different, stronger claim, and the
 * two must never be confused. So the record names the kind, and anything that repeats the claim
 * — the review package, a report, one day an interface — reads it rather than assuming.
 */
export const REVIEW_KINDS = ["ai-assisted", "human-teacher"] as const;
export type ReviewKind = (typeof REVIEW_KINDS)[number];

/**
 * What a pedagogical review concluded. `needs-revision` never accompanies an approval: content
 * that needs revision stays at `review`, which is what the status already means.
 */
export const REVIEW_OUTCOMES = ["accepted", "accepted-with-modifications"] as const;
export type ReviewOutcome = (typeof REVIEW_OUTCOMES)[number];
export type LessonStatus = (typeof LESSON_STATUSES)[number];

export type LessonReview = {
  /**
   * Whether a person who teaches this age read it, or an AI-assisted review did. Required, and
   * never inferred: an approval that cannot say which kind it was is not usable as either.
   */
  reviewKind: ReviewKind;
  /** What the review concluded. */
  outcome: ReviewOutcome;
  /** Who accepted it: a name or role, kept so the claim is attributable. */
  reviewer: string;
  /** What the reviewer does, e.g. "institutrice de 3ème maternelle". */
  reviewerRole: string;
  /** ISO date of the review. */
  reviewedOn: string;
  /** Digest of the content that was reviewed (see `lessonDigest`). */
  reviewedDigest: string;
  /** What the reviewer asked for or noted, in their words. */
  notes: string | null;
};

/**
 * A stable digest of everything a reviewer judges: the words a child hears, the guidance an
 * adult follows, the objectives claimed, the durations and the materials. Presentation-only
 * fields are deliberately included too — if the text changes at all, the approval lapses.
 *
 * FNV-1a over a canonical serialisation: short, dependency-free and stable across platforms.
 * It is a change detector, not a security measure.
 */
export function lessonDigest(lesson: Lesson): string {
  const canonical = JSON.stringify([
    lesson.id,
    lesson.curriculumId,
    [...lesson.levelIds].sort(),
    lesson.domainCode,
    lesson.title,
    lesson.summary,
    [...lesson.objectiveCodes].sort(),
    [...lesson.supportingObjectiveCodes].sort(),
    lesson.stage,
    lesson.difficulty,
    lesson.themeId,
    lesson.parentGuidance,
    lesson.activities
      .map((activity) => [
        activity.id,
        activity.position,
        activity.type,
        activity.title,
        activity.childInstruction,
        activity.adultGuidance,
        activity.minutes,
        activity.mode,
        [...activity.objectiveCodes].sort(),
        [...activity.materialCodes].sort(),
        activity.vocabulary.map((entry) => [entry.fr, entry.en]),
        activity.scaffolds.map((scaffold) => [scaffold.language, scaffold.childInstruction]),
        JSON.stringify(activity.payload, Object.keys(activity.payload).sort()),
      ])
      .sort((a, b) => (String(a[0]) < String(b[0]) ? -1 : 1)),
  ]);
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index++) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  // A second pass over the reversed string widens the digest and keeps collisions unlikely.
  let second = 0x811c9dc5;
  for (let index = canonical.length - 1; index >= 0; index--) {
    second ^= canonical.charCodeAt(index);
    second = Math.imul(second, 0x01000193) >>> 0;
  }
  return `${hash.toString(16).padStart(8, "0")}${second.toString(16).padStart(8, "0")}`;
}

/** May this lesson be given to a child? Only approved content reaches a daily plan. */
export function isTeachable(lesson: Lesson): boolean {
  return lesson.status === "approved";
}

/** The quality-gate rules. Returns problems; empty means the gate is satisfied. */
export function checkLessonReview(lesson: Lesson): string[] {
  const problems: string[] = [];
  const at = `lesson "${lesson.id}"`;
  const review = lesson.review;

  if (lesson.status === "approved") {
    if (review === null) {
      problems.push(`${at}: approved content must record who reviewed it and when`);
      return problems;
    }
    if (!review.reviewer.trim() || !review.reviewerRole.trim()) {
      problems.push(`${at}: an approval needs a named reviewer and their role`);
    }
    if (!REVIEW_KINDS.includes(review.reviewKind)) {
      problems.push(
        `${at}: an approval must say which kind of review it was (${REVIEW_KINDS.join(" | ")})`,
      );
    }
    // A human-teacher review is the stronger claim, so it must be a person, not a tool.
    if (
      review.reviewKind === "human-teacher" &&
      /\b(chatgpt|gpt|claude|gemini|llm|ia|ai)\b/i.test(review.reviewer)
    ) {
      problems.push(
        `${at}: "${review.reviewer}" is recorded as a human-teacher review. An AI-assisted review must use reviewKind "ai-assisted".`,
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedOn)) {
      problems.push(`${at}: the review date must be a YYYY-MM-DD date`);
    }
    const digest = lessonDigest(lesson);
    if (review.reviewedDigest !== digest) {
      problems.push(
        `${at}: the lesson changed since it was approved (reviewed ${review.reviewedDigest}, now ${digest}). Set the status back to "review".`,
      );
    }
  } else if (review !== null) {
    problems.push(`${at}: only an approved lesson carries a review record`);
  }
  return problems;
}
