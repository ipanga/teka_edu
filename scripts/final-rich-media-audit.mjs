import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { format } from "prettier";
import { lessonDigest } from "../domain/lessons/review.ts";
import { mediaDigestSource } from "../domain/media/types.ts";

const root = path.resolve(import.meta.dirname, "..");
const reviewed = "1c3372298eaa9e3463aa7a889762bb9cc662db2b";
const frozen = "8b5a8655222e299fea90e7582906c3723b3eca79";
const rolloutBaseline = "cbc1cf3";
const restored = new Set(["m3-lang-07", "m3-lang-16", "m3-lang-20"]);
const json = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const oldBytes = (ref, file) => execFileSync("git", ["show", `${ref}:${file}`], { cwd: root });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
const tracked = new Set(
  execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).trim().split("\n"),
);
const registry = await json("content/media/registry.json");
check(
  (await readFile(path.join(root, "content/media/registry.json"))).equals(
    oldBytes(frozen, "content/media/registry.json"),
  ),
  "Accepted registry changed after freeze",
);
const texts = [];
let total = 0;
let unaffected = 0;
const currentDigests = new Set();
const restoration = [];
for (const level of ["maternelle-1", "maternelle-3"]) {
  const file = `content/texts/${level}.json`;
  check(
    (await readFile(path.join(root, file))).equals(oldBytes(rolloutBaseline, file)),
    `Canonical text changed: ${file}`,
  );
  texts.push(...(await json(file)).texts);
}
const media = mediaDigestSource(registry.assets, texts);
for (const level of ["maternelle-1", "maternelle-3"]) {
  const dir = `content/lessons/maternelle-cycle1-cd-2026/${level}`;
  for (const file of (await readdir(path.join(root, dir))).filter((file) =>
    file.endsWith(".json"),
  )) {
    const name = `${dir}/${file}`;
    const before = JSON.parse(oldBytes(reviewed, name)).lessons;
    const original = JSON.parse(oldBytes(rolloutBaseline, name)).lessons;
    const previousApproved = JSON.parse(oldBytes("cd4f39b", name)).lessons;
    for (const lesson of (await json(name)).lessons) {
      total++;
      const digest = lessonDigest(lesson, media);
      check(
        lesson.status === "approved" && lesson.review?.reviewedDigest === digest,
        `Missing/stale approval: ${lesson.id}`,
      );
      currentDigests.add(digest);
      const semantics = (item) => {
        const result = { ...item };
        delete result.status;
        delete result.review;
        return result;
      };
      check(
        same(semantics(lesson), semantics(original.find((item) => item.id === lesson.id))),
        `Teaching fields changed: ${lesson.id}`,
      );
      if (!restored.has(lesson.id)) {
        check(
          same(
            lesson,
            before.find((item) => item.id === lesson.id),
          ),
          `Unaffected record changed: ${lesson.id}`,
        );
        unaffected++;
      } else {
        const oldDigest = previousApproved.find((item) => item.id === lesson.id).review
          .reviewedDigest;
        check(oldDigest !== digest, `Old digest reused: ${lesson.id}`);
        restoration.push({
          id: lesson.id,
          currentDigest: digest,
          previousApprovedDigest: oldDigest,
        });
      }
    }
  }
}
check(
  total === 176 && currentDigests.size === total && unaffected === 173 && restoration.length === 3,
  "Approval totals mismatch",
);
for (const dir of ["content/programmes", "content/curriculum", "content/calendars"]) {
  execFileSync("git", ["diff", "--exit-code", rolloutBaseline, "--", dir], { cwd: root });
}
const history = (await json("content/reviews/history.json")).reviews;
const priorHistory = JSON.parse(oldBytes(reviewed, "content/reviews/history.json")).reviews;
check(
  history.length === priorHistory.length + 3 &&
    same(history.slice(0, priorHistory.length), priorHistory),
  "Historical reviews changed",
);
check(
  same(
    history.slice(-3).map((item) => item.week),
    [2, 4, 5],
  ) &&
    history
      .slice(-3)
      .every(
        (item) =>
          item.levelId === "maternelle-3" &&
          item.scope === "full-review" &&
          item.outcome === "accepted" &&
          item.summary.includes("histoire-malo"),
      ),
  "Malo acceptance history missing",
);
const audit = await json("docs/september-rich-media-audit.json");
const candidates = audit.assets.filter((item) => item.selectedFinalFormat === "webp");
check(
  candidates.length === 20 &&
    candidates.every(
      (item) =>
        item.implementationState.startsWith("integrated-local") &&
        item.reviewState === "independently-reconfirmed",
    ),
  "Incomplete candidate state",
);
const acceptedCandidates = candidates.map((item) => {
  const evidence = history.filter(
    (review) =>
      review.scope === "full-review" &&
      review.outcome === "accepted" &&
      JSON.stringify(review).includes(item.id),
  );
  check(evidence.length > 0, `No accepted full-review evidence: ${item.id}`);
  return { id: item.id, acceptedHistoryEntries: evidence.length, reviewState: item.reviewState };
});
check(
  audit.assets.every((item) => item.implementationState !== "deferred-pending-imagegen"),
  "Deferred candidate remains",
);
const files = new Map();
for (const asset of registry.assets) {
  for (const frame of [asset, ...(asset.sequence?.frames ?? [])]) {
    const file = `public/media/${frame.file}`;
    const bytes = await readFile(path.join(root, file));
    check(
      tracked.has(file) && bytes.equals(oldBytes(frozen, file)),
      `Untracked/changed accepted media: ${file}`,
    );
    check(frame.contentHash === `sha256:${hash(bytes)}`, `Media hash mismatch: ${file}`);
    if (file.endsWith(".webp")) {
      const metadata = await sharp(bytes).metadata();
      check(
        metadata.width === frame.width && metadata.height === frame.height,
        `Dimensions: ${file}`,
      );
      await sharp(bytes).raw().toBuffer();
    }
    files.set(file, { file, bytes: bytes.length, sha256: hash(bytes) });
  }
}
const packages = [];
for (const [candidate, verdictFile] of [
  ["histoire-pluie", "2026-09-30-pluie"],
  ["histoire-cailloux", "2026-09-30-cailloux"],
  ["histoire-malo", "2026-10-01-malo"],
]) {
  const dir = `docs/review/${candidate}`;
  const manifestFile = `${dir}/manifest.json`;
  const manifestBytes = await readFile(path.join(root, manifestFile));
  const manifest = JSON.parse(manifestBytes);
  const verdict = await json(`docs/review/verdicts/${verdictFile}.json`);
  check(
    verdict.verdict === "accepted" && verdict.manifestSha256 === hash(manifestBytes),
    `External verdict mismatch: ${candidate}`,
  );
  for (const item of [
    { file: "manifest.json", bytes: manifestBytes.length, sha256: hash(manifestBytes) },
    ...manifest.files,
  ]) {
    const file = `${dir}/${item.file}`;
    const bytes = await readFile(path.join(root, file));
    check(
      tracked.has(file) &&
        bytes.equals(oldBytes(frozen, file)) &&
        bytes.length === item.bytes &&
        hash(bytes) === item.sha256,
      `Frozen package integrity: ${file}`,
    );
  }
  packages.push({
    candidate,
    verdict: verdict.verdict,
    reviewedCheckpoint: verdict.reviewedCheckpoint,
    manifestSha256: hash(manifestBytes),
    verifiedFiles: manifest.files.length,
  });
}
const report = {
  generatedOn: "2026-10-01",
  status: "september-rich-media-complete",
  branch: execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim(),
  rolloutBaseline,
  reviewedDocumentation: reviewed,
  frozenImplementation: frozen,
  approvals: {
    total,
    approved: total,
    review: 0,
    distinctCurrentValidDigests: currentDigests.size,
    stale: 0,
    unexpectedLapses: 0,
    unaffectedRecordsUnchanged: unaffected,
    restoration,
  },
  richMedia: {
    candidateCount: candidates.length,
    integrated: acceptedCandidates.length,
    independentlyAccepted: acceptedCandidates.length,
    pending: 0,
    deferred: 0,
    registeredAssets: registry.assets.length,
    sequences: registry.assets.filter((item) => item.sequence).length,
    runtimeFiles: files.size,
    webpFiles: [...files.keys()].filter((file) => file.endsWith(".webp")).length,
    retainedSvgFiles: [...files.keys()].filter((file) => file.endsWith(".svg")).length,
    runtimeBytes: [...files.values()].reduce((sum, item) => sum + item.bytes, 0),
    allMediaTracked: true,
    acceptedMediaPreserved: true,
  },
  canonicalTeachingUnchanged: true,
  previousReviewHistoryPreserved: true,
  supportedDevices: ["phone", "tablet", "laptop/MacBook"],
  temporaryRecoveryPackageRequired: false,
  reviewEvidence:
    "Permanent tracked historical packages remain frozen/pending as originally submitted; separate verdict artifacts record acceptance. Ignored masters and chat history are not recovery dependencies.",
  acceptedCandidates,
  packages,
  runtimeFiles: [...files.values()].sort((a, b) => a.file.localeCompare(b.file)),
  deployment:
    "Feature branch only; no PR, merge, staging/production deployment or database operation performed by finalization.",
  nextAction:
    "STOP. Owner authorization required for PR/develop/staging and family testing; no October, 2eme maternelle, infrastructure or unrelated work.",
};
await writeFile(
  path.join(root, "docs/media/SEPTEMBER_RICH_MEDIA_FINAL_AUDIT.json"),
  await format(JSON.stringify(report), { parser: "json" }),
);
console.log(
  JSON.stringify({
    status: report.status,
    approvals: report.approvals,
    richMedia: report.richMedia,
    packages: packages.length,
  }),
);
