import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
const out = "docs/review/media/astra-comparison";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const samples = [
  ["small-phone", "m1-lang-11-a2", "Body words · 320 px phone", 320, 740],
  ["tv", "m3-world-02-a1", "Animal choices · 1920 px TV", 1920, 1080],
  ["tv", "m1-lang-03-a2", "Lisa story · 1920 px TV", 1920, 1080],
  ["tv", "m1-lang-11-a2", "Body word labels · 1920 px TV", 1920, 1080],
];
for (const [viewport, activity, title, width, height] of samples) {
  const frames = ["baseline", "after"].map((version) => {
    const source = `private/astra-visual-evidence/${version === "after" ? "after-fourwords" : version}/${viewport}-${activity}.png`;
    cpSync(source, `${out}/${version}-${viewport}-${activity}.png`);
    return `<section><h2>${version === "baseline" ? "BEFORE · a0b743b" : "AFTER · local UI"}</h2><img width="${width}" height="${height}" src="data:image/png;base64,${readFileSync(source).toString("base64")}"></section>`;
  });
  const html = `<!doctype html><html lang="en"><style>body{font:20px system-ui;background:#e9e5df;color:#24303d;margin:24px}main{display:flex;gap:24px}section{background:white;padding:12px}h2{font-size:20px;margin:0 0 12px}img{display:block}p{max-width:1000px}</style><h1>${title}</h1><p>${activity} · The teaching text and illustration bytes are identical. This comparison covers layout only; no asset is re-approved.</p><main>${frames.join("")}</main></html>`;
  writeFileSync(`${out}/${viewport}-${activity}.html`, html);
  await page.setViewportSize({ width: width * 2 + 120, height: height + 210 });
  await page.setContent(html);
  await page.screenshot({ path: `${out}/${viewport}-${activity}.png`, fullPage: true });
}
const original = readFileSync("public/media/objects/corps-main.svg").toString("base64");
const candidate = readFileSync("docs/review/media/astra-drafts/corps-main-candidate.png").toString(
  "base64",
);
await page.setViewportSize({ width: 1250, height: 850 });
await page.setContent(
  `<html><style>body{font:20px system-ui;background:#fffdf7;margin:24px}main{display:flex;gap:32px}section{width:570px}img{object-fit:contain}p{max-width:1100px}</style><h1>corps-main · baseline / DRAFT candidate</h1><p>Recognition: “la main” · 1ère maternelle · 5 dependent lessons. Draft is outside the registry: 0 approval lapses. No child-facing text changed. Not accepted.</p><main><section><h2>Before</h2><img width="480" height="480" src="data:image/svg+xml;base64,${original}"><img width="128" height="128" src="data:image/svg+xml;base64,${original}"></section><section><h2>Candidate — NOT integrated</h2><img width="480" height="480" src="data:image/png;base64,${candidate}"><img width="128" height="128" src="data:image/png;base64,${candidate}"></section></main></html>`,
);
await page.screenshot({ path: `${out}/corps-main-draft.png`, fullPage: true });
await browser.close();
