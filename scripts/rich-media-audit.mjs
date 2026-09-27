import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(await readFile(join(root, "content/media/registry.json"), "utf8"));
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
const usages = new Map(registry.assets.map((asset) => [asset.id, []]));
for (const level of ["maternelle-1", "maternelle-3"]) {
  for (const file of (await readdir(join(lessonRoot, level))).filter((name) =>
    name.endsWith(".json"),
  )) {
    const data = JSON.parse(await readFile(join(lessonRoot, level, file), "utf8"));
    for (const lesson of data.lessons) {
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
  "histoire-nsimba": 4,
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

const assets = registry.assets.map((asset) => {
  const decision = formatDecision(asset);
  const assetUsages = usages.get(asset.id) ?? [];
  const lessonIds = [...new Set(assetUsages.map((usage) => usage.lessonId))];
  const currentQa = legacyState.finalQa.assets[asset.id];
  return {
    id: asset.id,
    kind: asset.kind,
    pedagogicalRole: asset.alt,
    currentFile: `public/media/${asset.file}`,
    currentFormat: asset.file.split(".").at(-1),
    childActuallySeesIt: assetUsages.length > 0,
    usages: assetUsages,
    currentVisualStatus: currentQa?.status ?? "unknown",
    selectedFinalFormat: decision.finalFormat,
    decision: decision.decision,
    reason: decision.reason,
    presentation: decision.presentation,
    animationValue: decision.animation,
    audioUsefulness: decision.audio,
    implementationState: "pending-owner-style-decision",
    reviewState: "needs-review",
    approvalImpact:
      decision.decision === "audited-keep"
        ? { expected: "none", lessonCount: 0, lessonIds: [] }
        : {
            expected: "lapse-on-byte-or-association-change",
            lessonCount: lessonIds.length,
            lessonIds,
          },
    beforeHash: asset.contentHash,
    afterHash: null,
  };
});

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
  task: "September rich-media visual upgrade — Phase A",
  version: 1,
  generatedOn: "2026-09-27",
  baselineCommit: "51c83a229e1559e98dbf7127fb916c2c8d6a841b",
  scope: ["maternelle-1 September", "maternelle-3 September"],
  status: "phase-a-complete-phase-b-benchmark-awaiting-owner-direction",
  productionAssetsChanged: false,
  approvedContentChanged: false,
  counts,
  anticipatedApprovalImpact: {
    ifAllProposedWebpAssetsAreIntegrated: proposedAffectedLessons.length,
    maternelle1: proposedAffectedLessons.filter((id) => id.startsWith("m1-")).length,
    maternelle3: proposedAffectedLessons.filter((id) => id.startsWith("m3-")).length,
    currentImpact: 0,
  },
  notes: [
    "PNG has no selected delivery use; lossless PNG remains acceptable only as an untracked or archived generation master.",
    "A small story sequence is a presentation proposal tied to existing text pages. It must not alter story wording or progression.",
    "Any changed registered asset byte or media association must use the existing lapse and independent reconfirmation mechanism.",
  ],
  assets,
};

const json = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(join(root, "docs/september-rich-media-audit.json"), json);

const rows = assets
  .map((asset) => {
    const use = asset.usages.length
      ? asset.usages.map((item) => `${item.lessonId}/${item.activityId}`).join("<br>")
      : "—";
    return `| \`${asset.id}\` | ${asset.kind} | ${asset.currentFormat.toUpperCase()} | ${asset.selectedFinalFormat.toUpperCase()} | \`${asset.decision}\` | ${asset.presentation} | ${asset.approvalImpact.lessonCount} | ${use} |`;
  })
  .join("\n");

const digest = createHash("sha256").update(json).digest("hex");
const markdown = `# September rich-media audit — Phase A

Generated from the canonical media registry, approved September lessons and supplied texts. This is a proposed post-release format strategy; it changes no production asset or approval.

## Decision summary

- 51 registered visual assets audited.
- ${counts["audited-keep"]} retained as SVG without a planned redraw.
- ${counts["audited-refine"]} SVG assets require refinement; accepted schematic and isolated-object SVGs stay unchanged unless a later real defect is demonstrated.
- ${counts["audited-redraw"]} proposed for high-quality WebP delivery.
- Final formats: ${counts.svg} SVG and ${counts.webp} WebP; 0 PNG delivery exceptions.
- Proposed WebP rollout would lapse ${proposedAffectedLessons.length} unique lessons (${manifest.anticipatedApprovalImpact.maternelle1} in 1ère, ${manifest.anticipatedApprovalImpact.maternelle3} in 3ème); the current Phase A/B evidence lapses 0.
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
