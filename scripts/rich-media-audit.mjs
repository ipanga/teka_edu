import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baselineCommit = "cbc1cf3";
const registry = JSON.parse(await readFile(join(root, "content/media/registry.json"), "utf8"));
const baselineRegistry = JSON.parse(
  execFileSync("git", ["show", `${baselineCommit}:content/media/registry.json`], {
    cwd: root,
    encoding: "utf8",
  }),
);
const legacyState = JSON.parse(
  await readFile(join(root, "docs/september-illustration-state.json"), "utf8"),
);

const textFiles = ["maternelle-1.json", "maternelle-3.json"];
const texts = new Map();
for (const file of textFiles) {
  const data = JSON.parse(await readFile(join(root, "content/texts", file), "utf8"));
  for (const text of data.texts) texts.set(text.id, text);
}

const lessonRoot = join(root, "content/lessons/maternelle-cycle1-cd-2026");
const lessons = new Map();
const usages = new Map(registry.assets.map((asset) => [asset.id, []]));
for (const level of ["maternelle-1", "maternelle-3"]) {
  for (const file of (await readdir(join(lessonRoot, level))).filter((name) =>
    name.endsWith(".json"),
  )) {
    const data = JSON.parse(await readFile(join(lessonRoot, level, file), "utf8"));
    for (const lesson of data.lessons) {
      lessons.set(lesson.id, lesson);
      for (const activity of lesson.activities) {
        const ids = new Set(activity.mediaIds);
        const text = activity.payload?.textId ? texts.get(activity.payload.textId) : undefined;
        if (text?.illustrationId) ids.add(text.illustrationId);
        for (const id of ids) {
          usages.get(id)?.push({
            lessonId: lesson.id,
            activityId: activity.id,
            activityTitle: activity.title,
            activityType: activity.type,
            mode: activity.mode,
          });
        }
      }
    }
  }
}

const storyFrames = {
  "histoire-seau-lisa": 3,
  "histoire-tika": 3,
  "histoire-kumu": 4,
  "histoire-nsimba": 5,
  "histoire-mangue": 3,
  "histoire-bibi": 3,
  "histoire-marche": 3,
  "histoire-pluie": 3,
  "histoire-cailloux": 3,
  "histoire-malo": 4,
};

const webpSingle = new Set([
  "corps-main",
  "corps-pied",
  "corps-tete",
  "corps-ventre",
  "animal-poule",
  "animal-poussin",
  "animal-chevre",
  "comptine-bonjour",
  "comptine-mains",
  "comptine-cabri",
]);

const pilot = {
  "corps-tete": {
    master: "private/astra-visual-evidence/september-rich-benchmark-masters/corps-tete-master.png",
    source: [1254, 1254],
  },
  "animal-chevre": {
    master:
      "private/astra-visual-evidence/september-rich-benchmark-masters/bibi-character-master.png",
    source: [1254, 1254],
  },
  "comptine-bonjour": {
    master:
      "private/astra-visual-evidence/september-rich-benchmark-masters/comptine-bonjour-master.png",
    source: [1254, 1254],
  },
  "histoire-nsimba": {
    master: "private/astra-visual-evidence/september-rich-media-pilot-masters/",
    source: [1448, 1086],
  },
  "histoire-mangue": {
    master: "private/astra-visual-evidence/september-rich-media-pilot-masters/",
    source: [1448, 1086],
  },
};

const rolloutBatch1 = Object.fromEntries(
  ["corps-main", "corps-pied", "corps-ventre", "animal-poule", "animal-poussin"].map((id) => [
    id,
    {
      master: `private/astra-visual-evidence/september-rich-media-rollout-masters/${id}.png`,
      source: [1254, 1254],
    },
  ]),
);

const oldFileSize = (file) =>
  execFileSync("git", ["show", `${baselineCommit}:public/media/${file}`], { cwd: root }).length;
const delivery = async (asset) => {
  const files = asset.sequence?.frames.map((frame) => frame.file) ?? [asset.file];
  return Promise.all(
    files.map(async (file) => ({
      file: `public/media/${file}`,
      bytes: (await stat(join(root, "public/media", file))).size,
    })),
  );
};

function formatDecision(asset) {
  if (storyFrames[asset.id]) {
    return {
      decision: "audited-redraw",
      finalFormat: "webp",
      presentation: `${storyFrames[asset.id]}-image sequence aligned to existing story pages`,
      reason:
        "The current single schematic SVG cannot carry the character, action, emotion, and narrative progression required by the approved story.",
      animation: "page transition only; no movement inside the image",
      audio: "optional human narration",
    };
  }
  if (webpSingle.has(asset.id)) {
    const rhyme = asset.id.startsWith("comptine-");
    const body = asset.id.startsWith("corps-");
    return {
      decision: "audited-redraw",
      finalFormat: "webp",
      presentation: "single image",
      reason: body
        ? "A human body reference needs warmth and anatomical clarity; the current icon-like construction is visually weak at child-view scale."
        : rhyme
          ? "The rhyme benefits from a warm, expressive human or animal gesture rather than assembled vector primitives."
          : "An expressive animal character benefits from natural form, texture, and a stable identity across vocabulary and story scenes.",
      animation: rhyme ? "existing one-time frame entrance only" : "none",
      audio: rhyme
        ? "recommended human rhyme recording"
        : body
          ? "important for pronunciation in vocabulary uses"
          : "important for pronunciation in vocabulary uses; otherwise unnecessary",
    };
  }
  return {
    decision: "audited-keep",
    finalFormat: "svg",
    presentation: "single image",
    reason:
      asset.kind === "shape"
        ? "Exact geometry is the pedagogical content, so a compact deterministic SVG remains the best medium."
        : [
              "forme-maison-composee",
              "comptine-compter",
              "comptine-semaine",
              "comptine-formes",
              "plante-parties",
              "bonhomme-articule",
            ].includes(asset.id)
          ? "This is a schematic instructional model whose exact geometry, count, or construction is the pedagogical content; the accepted SVG is clear and has no demonstrated defect."
          : "This is a simple isolated vocabulary or counting object that must stay crisp and recognizable at small repeated sizes; SVG remains appropriate.",
    animation: "none",
    audio:
      asset.kind === "object" && !asset.id.startsWith("objet-caillou")
        ? "important for pronunciation when used as vocabulary; otherwise unnecessary"
        : "unnecessary",
  };
}

const assets = await Promise.all(
  registry.assets.map(async (asset) => {
    const decision = formatDecision(asset);
    const assetUsages = usages.get(asset.id) ?? [];
    const lessonIds = [...new Set(assetUsages.map((usage) => usage.lessonId))];
    const currentQa = legacyState.finalQa.assets[asset.id];
    const before = baselineRegistry.assets.find((candidate) => candidate.id === asset.id) ?? asset;
    const selected = pilot[asset.id] ?? rolloutBatch1[asset.id];
    const isPilot = pilot[asset.id] !== undefined;
    return {
      id: asset.id,
      kind: asset.kind,
      pedagogicalRole: asset.alt,
      currentFile: `public/media/${before.file}`,
      currentFormat: before.file.split(".").at(-1),
      childActuallySeesIt: assetUsages.length > 0,
      usages: assetUsages,
      currentVisualStatus: currentQa?.status ?? "unknown",
      selectedFinalFormat: decision.finalFormat,
      decision: decision.decision,
      reason: decision.reason,
      presentation: decision.presentation,
      animationValue: decision.animation,
      audioUsefulness: decision.audio,
      implementationState: selected
        ? isPilot
          ? "integrated-local-pilot"
          : "integrated-local-rollout"
        : "not-started",
      reviewState: selected ? "independently-reconfirmed" : "not-in-pilot",
      approvalImpact:
        decision.decision === "audited-keep"
          ? { expected: "none", lessonCount: 0, lessonIds: [] }
          : {
              expected: "lapse-on-byte-or-association-change",
              lessonCount: lessonIds.length,
              lessonIds,
            },
      beforeHash: before.contentHash,
      afterHash: selected ? asset.contentHash : null,
      ...(selected
        ? {
            proposedFile: `public/media/${asset.file}`,
            sourceMaster: selected.master,
            sourceDimensions: { width: selected.source[0], height: selected.source[1] },
            deliveredDimensions: { width: asset.width, height: asset.height },
            compression: { format: "WebP", quality: 88, smartSubsample: true },
            oldFileBytes: oldFileSize(before.file),
            deliveryFiles: await delivery(asset),
            currentDecision: "owner-accepted; independent-review-accepted",
          }
        : {}),
    };
  }),
);

const counts = assets.reduce(
  (result, asset) => {
    result[asset.decision] += 1;
    result[asset.selectedFinalFormat] += 1;
    return result;
  },
  { "audited-keep": 0, "audited-refine": 0, "audited-redraw": 0, svg: 0, webp: 0 },
);

const proposedAffectedLessons = [
  ...new Set(
    assets
      .filter((asset) => asset.decision === "audited-redraw")
      .flatMap((asset) => asset.approvalImpact.lessonIds),
  ),
];

const manifest = {
  task: "September rich-media visual upgrade — controlled rollout",
  version: 2,
  generatedOn: "2026-09-27",
  productionCommit: "51c83a229e1559e98dbf7127fb916c2c8d6a841b",
  pilotBaselineCommit: baselineCommit,
  scope: ["maternelle-1 September", "maternelle-3 September"],
  status: "rollout-batch-1-reconfirmed-controlled-rollout-active",
  productionAssetsChanged: false,
  localPilotAssetsChanged: true,
  approvedLessonSemanticsChanged: false,
  counts,
  anticipatedApprovalImpact: {
    ifAllProposedWebpAssetsAreIntegrated: proposedAffectedLessons.length,
    maternelle1: proposedAffectedLessons.filter((id) => id.startsWith("m1-")).length,
    maternelle3: proposedAffectedLessons.filter((id) => id.startsWith("m3-")).length,
    currentImpact: [...lessons.values()].filter((lesson) => lesson.status === "review").length,
    currentApproved: [...lessons.values()].filter((lesson) => lesson.status === "approved").length,
    currentReview: [...lessons.values()].filter((lesson) => lesson.status === "review").length,
  },
  notes: [
    "PNG has no selected delivery use; lossless PNG remains acceptable only as an untracked or archived generation master.",
    "A small story sequence is a presentation proposal tied to existing text pages. It must not alter story wording or progression.",
    "The five pilot assets are integrated locally. Their 18 dependent lessons lapsed through the existing mechanism and remain at review.",
    "All 158 unaffected approvals remain byte-for-byte unchanged from the pilot baseline.",
    "Independent review accepted four asset families and requested two bounded Nsimba corrections: a dedicated page-1 walking scene and a visible Nsimba name card on page 3.",
    "Both corrections were integrated without changing canonical lesson text; the second independent pass accepted all five asset families and all 18 affected lessons.",
    "The standard lapsed-only workflow restored exactly 18 approvals with fresh digests; all 158 unaffected approval records remained byte-for-byte unchanged and zero stale approvals remain.",
    "Rollout batch 1 integrates corps-main, corps-pied, corps-ventre, animal-poule and animal-poussin. The first independent pass accepted four assets and requested a tighter belly crop; the corrected corps-ventre and all 10 dependent lessons were accepted on the second pass.",
    "The lapsed-only workflow restored exactly 10 Batch-1 approvals with fresh digests. All 166 unaffected approval records remained byte-for-byte unchanged and zero stale approvals remain.",
  ],
  assets,
};

const jsonPath = join(root, "docs/september-rich-media-audit.json");
const json = await format(JSON.stringify(manifest, null, 2), {
  ...(await resolveConfig(jsonPath)),
  filepath: jsonPath,
});
await writeFile(jsonPath, json);

const rows = assets
  .map((asset) => {
    const use = asset.usages.length
      ? asset.usages.map((item) => `${item.lessonId}/${item.activityId}`).join("<br>")
      : "—";
    return `| \`${asset.id}\` | ${asset.kind} | ${asset.currentFormat.toUpperCase()} | ${asset.selectedFinalFormat.toUpperCase()} | \`${asset.decision}\` | ${asset.presentation} | ${asset.approvalImpact.lessonCount} | ${use} |`;
  })
  .join("\n");

const digest = createHash("sha256").update(json).digest("hex");
const markdown = `# September rich-media audit — controlled rollout

Generated from the canonical media registry, September lessons and supplied texts. The owner accepted the five representative assets; two bounded Nsimba corrections were integrated and the final independent pass accepted all 18 affected lessons. Production remains unchanged.

## Decision summary

- 51 registered visual assets audited.
- ${counts["audited-keep"]} retained as SVG without a planned redraw.
- ${counts["audited-refine"]} SVG assets require refinement; accepted schematic and isolated-object SVGs stay unchanged unless a later real defect is demonstrated.
- ${counts["audited-redraw"]} proposed for high-quality WebP delivery.
- Final formats: ${counts.svg} SVG and ${counts.webp} WebP; 0 PNG delivery exceptions.
- The five-asset pilot affected 18 unique lessons: 8 in 1ère maternelle and 10 in 3ème maternelle. All 18 were independently reconfirmed and restored with fresh digests; September is 176/176 approved.
- Rollout batch 1 contains five single-image references and affects exactly 10 lessons. All five assets and all 10 lessons were independently reconfirmed and restored with fresh digests; the other 10 candidates remain unimplemented.
- Manifest SHA-256: \`${digest}\`.

The supplied screenshots validate the distinction: layout and scaling are sound, while the body, rhyme and story art remains visually schematic. Shapes, counting models and isolated objects do not share that defect.

## Complete decision matrix

| Asset | Role | Current | Proposed | Decision | Image/sequence | Lessons at risk | Exact uses |
| --- | --- | --- | --- | --- | --- | ---: | --- |
${rows}

## Guardrails

- No approved instruction, adult guidance, objective, duration, story, rhyme, calendar or safety text changes.
- Story sequences align only to existing renderer pages and existing text.
- Raster candidates require explicit dimensions, responsive rendering, accessible alt text and WebP optimization.
- Changed asset bytes or associations lapse only the exact affected lessons and require independent reconfirmation before approval restoration.
- Production remains unchanged until the normal protected release path is separately authorized.
`;
const markdownPath = join(root, "docs/september-rich-media-audit.md");
await writeFile(
  markdownPath,
  await format(markdown, { ...(await resolveConfig(markdownPath)), filepath: markdownPath }),
);

console.log(
  JSON.stringify({
    counts,
    manifest: relative(root, join(root, "docs/september-rich-media-audit.json")),
  }),
);
