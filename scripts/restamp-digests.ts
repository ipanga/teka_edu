/**
 * Re-stamps approval digests after the digest *definition* changed — and only then.
 *
 *   npx tsx scripts/restamp-digests.ts [--dry-run=true]
 *
 * ISSUE-026 made `lessonDigest` cover the words of the story a lesson reads, not just its id.
 * Every approved lesson that reads one then failed its own approval check. That is the
 * protection working: the digest it was stamped with is not the digest its content produces.
 *
 * The honest question is which of the two changed — the definition, or the content. This script
 * answers it per lesson, from the repository, and re-stamps **only** where the content is proven
 * to be exactly what the reviewer read:
 *
 *   - it finds the commit that wrote the lesson's stored digest, which is the revision the
 *     reviewer's decision was recorded against;
 *   - it compares every approval-relevant field at that revision with the content now — title,
 *     summary, guidance, objectives, every activity field, materials, vocabulary, scaffolds,
 *     payloads — plus the kind, description and bytes of every picture, plus the kind, title and
 *     lines of every story or rhyme the lesson reads;
 *   - if anything differs, it leaves the lesson alone and reports it. A difference means the
 *     content moved under a standing approval, and that goes back to a reviewer, not to a
 *     rubber stamp.
 *
 * It never copies a digest forward and never writes one it did not compute. The pedagogical
 * decision — who reviewed, what they concluded, when — is carried over untouched, because no new
 * reading happened: only the definition of what an approval covers got stronger.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { lessonDigest } from "@/domain/lessons/review";
import { mediaDigestSource } from "@/domain/media/types";

const ROOT = path.resolve(import.meta.dirname, "..");
const dryRun = process.argv.includes("--dry-run=true");
const DOMAINS = ["lang", "math", "phys", "art", "time-space", "world"];
const LEVELS = ["maternelle-1", "maternelle-3"];
const git = (args: string[]) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 128 << 20 });

type Raw = Record<string, unknown> & {
  id: string;
  status: string;
  review: { reviewedDigest: string; notes: string | null } | null;
  activities: (Record<string, unknown> & { id: string; payload: Record<string, unknown> })[];
};

/** Everything an approval covers, as a canonical string. Status and the review record are not. */
const approvalView = (l: Raw): string =>
  JSON.stringify([
    l["id"],
    l["curriculumId"],
    [...(l["levelIds"] as string[])].sort(),
    l["domainCode"],
    l["title"],
    l["summary"],
    [...(l["objectiveCodes"] as string[])].sort(),
    [...(l["supportingObjectiveCodes"] as string[])].sort(),
    l["stage"],
    l["difficulty"],
    l["themeId"],
    l["parentGuidance"],
    l.activities
      .map((a) => [
        a["id"],
        a["position"],
        a["type"],
        a["title"],
        a["childInstruction"],
        a["adultGuidance"],
        a["minutes"],
        a["mode"],
        a["role"],
        [...(a["mediaIds"] as string[])].sort(),
        [...(a["objectiveCodes"] as string[])].sort(),
        [...(a["materialCodes"] as string[])].sort(),
        (a["vocabulary"] as { fr: string; en: string }[]).map((v) => [v.fr, v.en]),
        (a["scaffolds"] as { language: string; childInstruction: string }[]).map((s) => [
          s.language,
          s.childInstruction,
        ]),
        JSON.stringify(a.payload, Object.keys(a.payload).sort()),
      ])
      .sort((x, y) => (String(x[0]) < String(y[0]) ? -1 : 1)),
  ]);

const readJson = (p: string) => JSON.parse(readFileSync(path.join(ROOT, p), "utf8"));
const showJson = (commit: string, p: string) => {
  try {
    return JSON.parse(git(["show", `${commit}:${p}`]));
  } catch {
    return null;
  }
};

const registryNow = readJson("content/media/registry.json").assets as {
  id: string;
  kind: string;
  alt: string;
  contentHash: string;
}[];
const textsNow = Object.fromEntries(
  LEVELS.map((lv) => [lv, readJson(`content/texts/${lv}.json`).texts as Record<string, unknown>[]]),
);
const media = mediaDigestSource(
  registryNow as never,
  LEVELS.flatMap((lv) => textsNow[lv]!) as never,
);
const canonText = (t: Record<string, unknown>) =>
  `${t["kind"]}|${t["title"]}|${(t["lines"] as string[]).join("␟")}`;

let restamped = 0;
const held: { id: string; why: string }[] = [];
const untouched: string[] = [];

for (const levelId of LEVELS) {
  for (const domain of DOMAINS) {
    const file = `content/lessons/maternelle-cycle1-cd-2026/${levelId}/${domain}.json`;
    const parsed = readJson(file);
    let touched = false;
    for (const lesson of parsed.lessons as Raw[]) {
      if (lesson.status !== "approved" || lesson.review === null) continue;
      const stored = lesson.review.reviewedDigest;
      const fresh = lessonDigest(lesson as never, media);
      if (fresh === stored) {
        untouched.push(lesson.id);
        continue;
      }

      const log = git(["log", "--format=%H", "-S", stored, "--", file]).trim();
      const commit = log ? log.split("\n").at(-1)! : null;
      if (commit === null) {
        held.push({ id: lesson.id, why: "no commit wrote this digest" });
        continue;
      }

      const thenFile = showJson(commit, file);
      const then = (thenFile?.lessons as Raw[] | undefined)?.find((l) => l.id === lesson.id);
      if (then === undefined) {
        held.push({ id: lesson.id, why: "absent at its approval commit" });
        continue;
      }
      if (approvalView(then) !== approvalView(lesson)) {
        held.push({ id: lesson.id, why: "a reviewed field differs from the approved revision" });
        continue;
      }

      // Pictures, and the words of every story the lesson reads, as they were when approved.
      const thenRegistry = (showJson(commit, "content/media/registry.json")?.assets ??
        []) as typeof registryNow;
      const thenTexts = (showJson(commit, `content/texts/${levelId}.json`)?.texts ?? []) as Record<
        string,
        unknown
      >[];
      const ids = new Set<string>();
      let differs: string | null = null;
      for (const a of lesson.activities) {
        for (const m of a["mediaIds"] as string[]) ids.add(m);
        const textId = a.payload["textId"];
        if (typeof textId !== "string") continue;
        const before = thenTexts.find((t) => t["id"] === textId);
        const now = textsNow[levelId]!.find((t) => t["id"] === textId);
        if (!before || !now) {
          differs = `text "${textId}" is missing`;
          break;
        }
        if (canonText(before) !== canonText(now)) {
          differs = `the story "${textId}" was rewritten`;
          break;
        }
        const illustration = now["illustrationId"];
        if (typeof illustration === "string") ids.add(illustration);
      }
      for (const mid of ids) {
        if (differs) break;
        const b = thenRegistry.find((x) => x.id === mid);
        const n = registryNow.find((x) => x.id === mid);
        if (!b || !n || b.kind !== n.kind || b.alt !== n.alt || b.contentHash !== n.contentHash) {
          differs = `the picture "${mid}" changed`;
        }
      }
      if (differs !== null) {
        held.push({ id: lesson.id, why: differs });
        continue;
      }

      lesson.review.reviewedDigest = fresh;
      const note =
        "Empreinte recalculée le 2026-09-18 pour ISSUE-026 : elle couvre désormais le texte de l’histoire ou de la comptine lue, et plus seulement son identifiant. Le contenu relu est identique à celui qui avait été approuvé, vérifié champ par champ contre la révision d’approbation. Aucune nouvelle relecture n’a eu lieu.";
      lesson.review.notes = lesson.review.notes === null ? note : `${lesson.review.notes} ${note}`;
      restamped += 1;
      touched = true;
    }
    if (touched && !dryRun) {
      writeFileSync(path.join(ROOT, file), `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
    }
  }
}

console.log(`${dryRun ? "[dry run] " : ""}approval digests`);
console.log(`  unaffected by the definition change : ${untouched.length}`);
console.log(`  re-stamped after proving the content identical : ${restamped}`);
console.log(`  held back for re-review : ${held.length}`);
for (const h of held) console.log(`    - ${h.id}: ${h.why}`);
