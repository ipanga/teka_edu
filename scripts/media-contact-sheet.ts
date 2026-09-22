/**
 * A before/after contact sheet of every picture that changed since a Git revision.
 *
 *   npm run media:sheet                                  # since develop, to docs/review/media/
 *   npm run media:sheet -- --since=develop --out=docs/review/media/septembre-avant-apres.png
 *   npm run media:sheet -- --ids=comptine-mains,corps-main   # only these, whatever changed
 *
 * The sheet is what a reviewer judges when a picture is redrawn (ADR-048): the old drawing, the
 * new one at the three sizes the product uses — 72 px in a counting row, 128 px on a word card,
 * 256 px as a story picture — and the description a screen reader gives. It is rendered from the
 * SVGs by the same Chromium the E2E tests use, so what the reviewer sees is what a browser draws.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

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

type Asset = { id: string; kind: string; file: string; alt: string; contentHash: string };
const now = JSON.parse(readFileSync(path.join(ROOT, "content/media/registry.json"), "utf8"))
  .assets as Asset[];
const before = JSON.parse(
  execFileSync("git", ["show", `${since}:content/media/registry.json`], {
    cwd: ROOT,
    encoding: "utf8",
  }),
).assets as Asset[];
const svgBefore = (file: string): string | null => {
  try {
    return execFileSync("git", ["show", `${since}:public/media/${file}`], {
      cwd: ROOT,
      encoding: "utf8",
    });
  } catch {
    return null;
  }
};

const changed = now.filter((asset) => {
  if (only !== undefined) return only.includes(asset.id);
  const old = before.find((b) => b.id === asset.id);
  return old === undefined || old.contentHash !== asset.contentHash || old.alt !== asset.alt;
});
if (changed.length === 0) {
  console.log(`no picture changed since ${since}; nothing to render`);
  process.exit(0);
}

const dataUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
const escape = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const rows = changed
  .map((asset) => {
    const old = before.find((b) => b.id === asset.id);
    const oldSvg = svgBefore(asset.file);
    const newSvg = readFileSync(path.join(ROOT, "public/media", asset.file), "utf8");
    const cell = (svg: string, px: number) =>
      `<span class="stage" style="width:${px + 24}px;height:${px + 24}px"><img src="${dataUri(svg)}" width="${px}" height="${px}" alt=""></span>`;
    return `
      <tr>
        <td class="id"><code>${asset.id}</code><br><small>${asset.kind}</small></td>
        <td class="before">${oldSvg === null ? "<em>nouveau</em>" : cell(oldSvg, 128)}<br><small>${escape(old?.alt ?? "—")}</small></td>
        <td class="after">${cell(newSvg, 72)} ${cell(newSvg, 128)} ${cell(newSvg, 256)}<br><small>${escape(asset.alt)}</small></td>
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
