/** Readable local sheets for manual review; generating a sheet does not mark it reviewed. */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const root = "private/astra-visual-evidence";
const out = `${root}/manual-sheets`;
mkdirSync(out, { recursive: true });
const { sessions } = JSON.parse(
  readFileSync("docs/review/media/astra-baseline/inventory.json", "utf8"),
);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1360, height: 1620 } });
const manifest = [];
for (const { level, day, session } of sessions) {
  const activities = session.steps.flatMap((s) => s.activities);
  const cards = activities.map((a) => {
    const file = `small-phone-${a.id}.png`;
    return `<section><h2>${a.id}</h2><img width="320" height="740" src="data:image/png;base64,${readFileSync(`${root}/after-fourwords/${file}`).toString("base64")}"></section>`;
  });
  await page.setContent(
    `<html><style>body{font:16px system-ui;background:#dedad1;margin:16px}main{display:grid;grid-template-columns:repeat(4,320px);gap:16px}h1{font-size:22px}h2{font-size:16px;margin:4px}section{background:white}</style><h1>Initial child screens · class ${level} · day ${day} · final layout</h1><main>${cards.join("")}</main></html>`,
  );
  await page.screenshot({ path: `${out}/phone-${level}-${day}.png`, fullPage: true });
  manifest.push({
    level,
    day,
    activities: activities.map((a) => a.id),
    sheet: `phone-${level}-${day}.png`,
    reviewed: false,
  });
}
writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
await browser.close();
