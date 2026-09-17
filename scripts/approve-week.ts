/**
 * Promotes one reviewed week from `review` to `approved`, from canonical data.
 *
 *   npx tsx scripts/approve-week.ts --level=maternelle-3 --week=1
 *
 * The five weeks approved before this existed were promoted by hand, which is how an approval
 * came to be stamped on lessons whose reviewed text had since changed — twice. So this refuses
 * more than it does:
 *
 *   - it approves only a week whose recorded history holds a `full-review` that concluded
 *     `accepted`. A `consequence` entry — a correction inherited from another week's review —
 *     never qualifies, and neither does `accepted-with-modifications`;
 *   - it computes every `reviewedDigest` with `lessonDigest`, under the current definition and
 *     including the fingerprint of every picture the lesson shows. No digest is ever copied
 *     forward, and a lesson whose media cannot be fingerprinted throws rather than being skipped;
 *   - it refuses a week that is not entirely at `review`, so it cannot silently re-stamp.
 *
 * It writes nothing else: the review history is canonical content and is not touched here.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { generateSchoolDays } from "@/domain/calendar/school-days";
import { lessonDigest } from "@/domain/lessons/review";
import { generateDailyPlan } from "@/domain/programme/daily-plan";
import { mediaDigestSource } from "@/domain/media/types";
import { REVIEW_PACKAGES } from "@/lib/content/review-packages";
import { getProgramme, getReferenceData } from "@/lib/content/reference-data";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, value] = arg.replace(/^--/, "").split("=");
      return [key ?? "", value ?? "true"];
    }),
);
const levelId = args.get("level") ?? "maternelle-3";
const week = Number(args.get("week") ?? "1");
const dryRun = args.get("dry-run") === "true";

const data = getReferenceData();
const pack = REVIEW_PACKAGES.find((p) => p.levelId === levelId && p.week === week);
if (pack === undefined) throw new Error(`no review package for ${levelId} week ${week}`);

// The decision that authorises this promotion, and the only kind that does.
const accepted = data.reviewHistory
  .filter(
    (r) =>
      r.levelId === levelId &&
      r.week === week &&
      r.scope === "full-review" &&
      r.outcome === "accepted",
  )
  .at(-1);
if (accepted === undefined) {
  throw new Error(
    `${levelId} week ${week} has no full review that concluded "accepted". A change audit, a ` +
      `consequence entry, or an "accepted-with-modifications" pass does not approve a week.`,
  );
}

/** The lessons of this week, in the order the child meets them. */
const annual = data.annualPlans.find((p) => p.levelId === levelId);
const programme = annual && getProgramme(levelId, annual.schoolYearId, data);
const calendar = data.calendars.find((c) => c.schoolYear.id === annual?.schoolYearId);
if (annual === undefined || programme === undefined || calendar === undefined) {
  throw new Error(`no programme, annual plan or calendar for ${levelId}`);
}
const lessonIds: string[] = [];
for (const schoolDay of generateSchoolDays(calendar, data.publicHolidays)) {
  const day = schoolDay.instructionalDay;
  if (!schoolDay.instructional || day === null || day < pack.fromDay || day > pack.toDay) continue;
  const daily = generateDailyPlan(schoolDay, programme, data.lessons);
  if (daily.status === "no-content") continue;
  for (const session of daily.sessions) {
    if (session.lesson !== null) lessonIds.push(session.lesson.id);
  }
}

const media = mediaDigestSource(data.media, data.texts);
const notes =
  `Semaine ${week} : ` +
  data.reviewHistory
    .filter((r) => r.levelId === levelId && r.week === week)
    .map((r) =>
      r.scope === "consequence"
        ? `${r.reviewedOn} conséquence d’une autre relecture`
        : `${r.reviewedOn} ${r.outcome === "accepted" ? "acceptée" : "acceptée avec modifications"}`,
    )
    .join(", ") +
  `. Décision de relecture : ${accepted.reviewer}, indépendante de l’auteur du contenu. ` +
  `Relecture par une personne qui enseigne à cet âge : non faite (ISSUE-017).`;

const DOMAINS = ["lang", "math", "phys", "art", "time-space", "world"];
let approved = 0;
for (const domain of DOMAINS) {
  const file = `content/lessons/maternelle-cycle1-cd-2026/${levelId}/${domain}.json`;
  const parsed = JSON.parse(readFileSync(path.join(ROOT, file), "utf8"));
  let touched = false;
  for (const raw of parsed.lessons as { id: string; status: string; review: unknown }[]) {
    if (!lessonIds.includes(raw.id)) continue;
    if (raw.status !== "review") {
      throw new Error(`lesson "${raw.id}" is "${raw.status}", not "review": refusing to re-stamp`);
    }
    const lesson = data.lessons.find((l) => l.id === raw.id);
    if (lesson === undefined) throw new Error(`lesson "${raw.id}" is not in the reference data`);
    raw.status = "approved";
    raw.review = {
      reviewKind: accepted.reviewKind,
      outcome: accepted.outcome,
      reviewer: accepted.reviewer,
      reviewerRole:
        "relecture pédagogique indépendante assistée par IA, contre le programme officiel Cycle 1",
      reviewedOn: accepted.reviewedOn,
      // Computed here, never copied: the digest covers the words, the guidance, the objectives,
      // the durations, the materials and the bytes of every picture the lesson shows.
      reviewedDigest: lessonDigest(lesson, media),
      notes,
    };
    approved += 1;
    touched = true;
  }
  if (touched && !dryRun) {
    writeFileSync(path.join(ROOT, file), `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  }
}

if (approved !== lessonIds.length) {
  throw new Error(`expected to approve ${lessonIds.length} lessons, approved ${approved}`);
}
console.log(
  `${dryRun ? "[dry run] " : ""}${levelId} week ${week}: ${approved} lesson(s) approved ` +
    `(${accepted.reviewKind}, ${accepted.outcome}, ${accepted.reviewer}, ${accepted.reviewedOn}).`,
);
