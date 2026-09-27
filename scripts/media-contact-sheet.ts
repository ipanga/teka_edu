/**
 * A before/after contact sheet of every picture that changed since a Git revision.
 *
 *   npm run media:sheet                                  # since develop, to docs/review/media/
 *   npm run media:sheet -- --since=develop --out=docs/review/media/septembre-avant-apres.png
 *   npm run media:sheet -- --ids=comptine-mains,corps-main   # only these, whatever changed
 *
 * The sheet is what a reviewer judges when a picture is redrawn (ADR-048): the old drawing, the
 * new one at the three sizes the product uses — 72 px in a counting row, 128 px on a word card,
 * 256 px as a story picture — and the description a screen reader gives. A story sequence adds
 * every frame, with the pages that show it and its own description. It is rendered from the SVG
 * and WebP files by the same Chromium the E2E tests use, so what the reviewer sees is what a
 * browser draws.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { assetFingerprint } from "@/domain/media/types";

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
const since = args.get("since") ?? "develop";
const out = args.get("out") ?? "docs/review/media/septembre-avant-apres.png";
const only = args.get("ids")?.split(",").filter(Boolean);
/** Render at 2× for close inspection; the reviewer sheet stays at 1×. */
const scale = Number(args.get("scale") ?? "1");

type Asset = {
  id: string;
  kind: string;
  file: string;
  alt: string;
  contentHash: string;
  sequence?: { frames: { file: string; alt: string; contentHash: string }[]; pageFrames: number[] };
};
const now = JSON.parse(readFileSync(path.join(ROOT, "content/media/registry.json"), "utf8"))
  .assets as Asset[];
type AuditAsset = {
  id: string;
  currentFormat: string;
  selectedFinalFormat: string;
  reason: string;
  usages: { lessonId: string; activityId: string; activityTitle: string }[];
  approvalImpact: { lessonCount: number };
};
const auditById = new Map<string, AuditAsset>(
  (
    JSON.parse(readFileSync(path.join(ROOT, "docs/september-rich-media-audit.json"), "utf8"))
      .assets as AuditAsset[]
  ).map((asset) => [asset.id, asset]),
);
const before = JSON.parse(
  execFileSync("git", ["show", `${since}:content/media/registry.json`], {
    cwd: ROOT,
    encoding: "utf8",
  }),
).assets as Asset[];
/** A file's bytes at the revision compared against — under the path it had then. */
const bytesBefore = (file: string): Buffer | null => {
  try {
    return execFileSync("git", ["show", `${since}:public/media/${file}`], { cwd: ROOT });
  } catch {
    return null;
  }
};

const changed = now.filter((asset) => {
  if (only !== undefined) return only.includes(asset.id);
  const old = before.find((b) => b.id === asset.id);
  // The whole fingerprint, so a redrawn frame of a story sequence is on the sheet too.
  return old === undefined || assetFingerprint(old) !== assetFingerprint(asset);
});
if (changed.length === 0) {
  console.log(`no picture changed since ${since}; nothing to render`);
  process.exit(0);
}

const dataUri = (file: string, bytes: Buffer) =>
  file.endsWith(".svg")
    ? `data:image/svg+xml;utf8,${encodeURIComponent(bytes.toString("utf8"))}`
    : `data:image/webp;base64,${bytes.toString("base64")}`;
const escape = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
// Painted art keeps its proportions inside the square stage, as the product shows it.
const cell = (uri: string, px: number) =>
  `<span class="stage" style="width:${px + 24}px;height:${px + 24}px"><img src="${uri}" style="max-width:${px}px;max-height:${px}px" alt=""></span>`;

const rows = changed
  .map((asset) => {
    const old = before.find((b) => b.id === asset.id);
    const audit = auditById.get(asset.id);
    const oldBytes = old === undefined ? null : bytesBefore(old.file);
    const nowUri = dataUri(asset.file, readFileSync(path.join(ROOT, "public/media", asset.file)));
    // A story sequence: every frame, with the pages it is shown on and its own description.
    const frames = (asset.sequence?.frames ?? []).map((frame, index) => {
      const pages = asset
        .sequence!.pageFrames.flatMap((f, page) => (f === index ? [page + 1] : []))
        .join(", ");
      const file = path.join(ROOT, "public/media", frame.file);
      const picture = existsSync(file)
        ? cell(dataUri(frame.file, readFileSync(file)), 128)
        : "<em>fichier manquant</em>";
      return `<div class="frame">${picture}<small>Page(s) ${pages} — ${escape(frame.alt)}</small></div>`;
    });
    const uses = audit?.usages
      .map((usage) => `${usage.lessonId}/${usage.activityId} — ${usage.activityTitle}`)
      .join(" · ");
    const review = audit
      ? `<div class="review"><b>Leçon / activité :</b> ${escape(uses || "—")}<br><b>Format :</b> ${audit.currentFormat.toUpperCase()} → ${audit.selectedFinalFormat.toUpperCase()}<br><b>Pourquoi :</b> ${escape(audit.reason)}<br><b>Approbation :</b> ${audit.approvalImpact.lessonCount} leçon(s) dépendante(s) repassent à « review ».</div>`
      : "";
    return `
      <tr>
        <td class="id"><code>${asset.id}</code><br><small>${asset.kind}</small></td>
        <td class="before">${oldBytes === null || old === undefined ? "<em>nouveau</em>" : cell(dataUri(old.file, oldBytes), 128)}<br><small>${escape(old?.alt ?? "—")}</small></td>
        <td class="after">${cell(nowUri, 72)} ${cell(nowUri, 128)} ${cell(nowUri, 256)}<br><small>${escape(asset.alt)}</small>${frames.join("")}${review}</td>
      </tr>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Images de septembre — avant / après</title>
<style>
  body { font-family: system-ui, sans-serif; background: #fffdf7; color: #1f2937; margin: 24px; width: 1180px; }
  h1 { font-size: 22px; margin: 0 0 4px; } p { margin: 0 0 16px; color: #57534e; }
  table { border-collapse: collapse; width: 100%; }
  th { text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #78716c; padding: 6px 8px; }
  td { vertical-align: top; padding: 10px 8px; border-top: 1px solid #e7e5e4; }
  td.id { width: 170px; } td.before { width: 200px; }
  .stage { display: inline-flex; align-items: center; justify-content: center; background: #f4efe4; border-radius: 20px; vertical-align: top; margin-right: 8px; }
  small { color: #57534e; display: block; margin-top: 6px; max-width: 560px; }
  code { font-size: 13px; }
  .frame { margin-top: 12px; }
  .review { margin-top: 12px; padding: 10px 12px; border-radius: 10px; background: #f8fafc; color: #334155; font-size: 12px; line-height: 1.55; }
</style></head><body>
<h1>Images de septembre — avant / après</h1>
<p>${changed.length} image(s) modifiée(s) depuis <code>${since}</code>. La colonne « après » montre chaque image aux trois tailles de l’application : 72 px (rangée à compter), 128 px (carte de mot), 256 px (image d’histoire). Chaque image est posée sur la scène teintée de l’application.</p>
<table><thead><tr><th>Image</th><th>Avant</th><th>Après — 72 · 128 · 256 px</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;

const target = path.isAbsolute(out) ? out : path.join(ROOT, out);
mkdirSync(path.dirname(target), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1240, height: 900 },
  deviceScaleFactor: scale,
});
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({ path: target, fullPage: true });
await browser.close();
console.log(`${out}: ${changed.length} picture(s) rendered (since ${since})`);
