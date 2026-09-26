/** Local interaction review sheets. Capture generation never constitutes visual acceptance. */
import { chromium } from "@playwright/test";
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
const root = "private/astra-visual-evidence";
const source = `${root}/interactions-fourwords`;
const out = `${root}/interaction-sheets`;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const manifest = [];
for (const viewport of ["phone", "tv"]) {
  const tv = viewport === "tv";
  const width = tv ? 960 : 320;
  const height = tv ? 540 : 740;
  const columns = tv ? 2 : 4;
  const size = tv ? 4 : 8;
  const states = readdirSync(source)
    .filter((f) => f.startsWith(`${viewport}-`) && f.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .flatMap((f) => JSON.parse(readFileSync(`${source}/${f}`, "utf8")))
    .filter((s) => s.name !== "initial");
  const page = await browser.newPage({
    viewport: { width: columns * (width + 16) + 16, height: 1620 },
  });
  for (let start = 0; start < states.length; start += size) {
    const batch = states.slice(start, start + size);
    const sheet = `${viewport}-${String(start / size + 1).padStart(3, "0")}.png`;
    const cards = batch.map(
      (s) =>
        `<section><h2>${s.activity} · ${s.name}</h2><img width="${width}" height="${height}" src="data:image/png;base64,${readFileSync(`${source}/${s.filename}`).toString("base64")}"></section>`,
    );
    await page.setContent(
      `<html><style>body{font:16px system-ui;background:#dedad1;margin:16px}main{display:grid;grid-template-columns:repeat(${columns},${width}px);gap:16px}h1{font-size:22px}h2{font-size:15px;margin:4px}section{background:white}</style><h1>Interaction states · ${viewport} · ${sheet}</h1><main>${cards.join("")}</main></html>`,
    );
    await page.screenshot({ path: `${out}/${sheet}`, fullPage: true });
    manifest.push({
      viewport,
      sheet,
      states: batch.map(({ activity, name, filename }) => ({ activity, name, filename })),
      reviewed: false,
    });
  }
  await page.close();
}
writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
await browser.close();
console.log(`${manifest.length} review sheets generated; none marked reviewed.`);
