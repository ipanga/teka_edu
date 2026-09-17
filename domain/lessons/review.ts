import type { Lesson } from "./types";

/**
 * What a digest needs to know about the pictures a lesson shows.
 *
 * It is an interface rather than the registry itself so the digest stays a pure function of
 * canonical content: a test can hand it two different fingerprints for the same id and prove the
 * digest moves, which is the whole point.
 */
export type MediaDigestSource = {
  /**
   * A canonical fingerprint of the asset — its kind, its French description and a hash of its
   * bytes. Returns `undefined` when the registry does not know the id, which the digest treats
   * as an error rather than as "no picture".
   */
  fingerprint(mediaId: string): string | undefined;
  /** The picture a teaching text carries, so a story's illustration is covered too. */
  illustrationOf(textId: string): string | null;
};

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

/**
 * Whether a recorded entry is a review of this week, or a change that reached it from somewhere
 * else.
 *
 * A `full-review` is a pass where a reviewer read this week's package and concluded something.
 * A `consequence` records a correction that arrived because another week was reviewed — the
 * change is real and must be declared, but nobody read this week to produce it.
 *
 * The difference used to live only in how the `reviewer` field was worded, so a generated
 * document had to guess at a string to answer "has this week been reviewed?". It answered wrong,
 * and told a reviewer that weeks which had never been read could be restored to `approved`.
 */
export const REVIEW_SCOPES = ["full-review", "consequence"] as const;
export type ReviewScope = (typeof REVIEW_SCOPES)[number];

/**
 * Where a batch of content stands, so a generated document can say the true thing about it.
 *
 * A change-audit document used to open by asserting that the weeks it covered « avaient été
 * acceptées » and close by offering to restore them to `approved`. That was written while
 * reconfirming 1ère maternelle, whose weeks really had been approved and really did lapse.
 * Generated for a level whose weeks had never been approved — four of them never even read — it
 * invited an approval nobody had performed. The wording has to be derived from the state, not
 * from the first case that needed it.
 */
export type WeekReviewState = "approved" | "reviewed" | "never-reviewed" | "draft";

export function weekReviewState(
  lessonStatuses: readonly LessonStatus[],
  reviews: readonly { scope: string; outcome: string }[],
): WeekReviewState {
  // Only a pass that read this batch counts. A `consequence` records a correction that arrived
  // because some other batch was reviewed, which is not the same as having been reviewed.
  const read = reviews.filter((r) => r.scope === "full-review");
  if (lessonStatuses.includes("approved")) return "approved";
  // An approval that has already lapsed leaves its lessons back at `review`, so the history is
  // what remembers that this batch was once accepted outright and may be restored.
  if (read.some((r) => r.outcome === "accepted")) return "approved";
  if (read.length > 0) return "reviewed";
  if (lessonStatuses.includes("draft")) return "draft";
  return "never-reviewed";
}
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
 * A stable digest of everything a reviewer judges: the words a child hears, the pictures they
 * are shown, the guidance an adult follows, the objectives claimed, the durations and the
 * materials. Presentation-only
 * fields are deliberately included too — if the text changes at all, the approval lapses.
 *
 * FNV-1a over a canonical serialisation: short, dependency-free and stable across platforms.
 * It is a change detector, not a security measure.
 */
export function lessonDigest(lesson: Lesson, media: MediaDigestSource): string {
  /**
   * Every picture this lesson puts in front of a child: the ones an activity names directly, and
   * the one that comes with a story or a rhyme. A missing fingerprint throws rather than being
   * skipped — a digest that silently ignores an unknown picture is worse than no digest.
   */
  const fingerprints = (activity: Lesson["activities"][number]): string[] => {
    const ids = [...activity.mediaIds];
    const textId = activity.payload["textId"];
    if (typeof textId === "string") {
      const illustration = media.illustrationOf(textId);
      if (illustration !== null) ids.push(illustration);
    }
    return [...new Set(ids)].sort().map((id) => {
      const fingerprint = media.fingerprint(id);
      if (fingerprint === undefined) {
        throw new RangeError(
          `lesson "${lesson.id}", activity "${activity.id}": media "${id}" cannot be fingerprinted`,
        );
      }
      return `${id}=${fingerprint}`;
    });
  };
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
        activity.role,
        // The picture a child is shown is something a reviewer judges — « Montre-moi Lisa »
        // depends entirely on it. It was missing here, so an approved lesson could have had its
        // illustration swapped without the approval lapsing. Found when exactly that happened.
        fingerprints(activity),
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
export function checkLessonReview(lesson: Lesson, media: MediaDigestSource): string[] {
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
    const digest = lessonDigest(lesson, media);
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
