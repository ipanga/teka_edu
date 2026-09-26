/** Local browser-only substitution: never changes registered media or approval digests. */
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const out = "docs/review/media/astra-comparison";
mkdirSync(out, { recursive: true });
const ids = ["corps-main", "corps-pied", "corps-tete", "corps-ventre"];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const rows = ids.map((id) => {
  const original = readFileSync(`public/media/objects/${id}.svg`).toString("base64");
  const candidate = readFileSync(`docs/review/media/astra-drafts/${id}-candidate.png`).toString(
    "base64",
  );
  return `<section><h2>${id}</h2>${[72, 128, 256].map((size) => `<div><p>${size}px · baseline / candidate</p><img width="${size}" height="${size}" src="data:image/svg+xml;base64,${original}"><img width="${size}" height="${size}" src="data:image/png;base64,${candidate}"></div>`).join("")}</section>`;
});
const html = `<html lang="en"><style>body{font:18px system-ui;background:#fffdf7;margin:24px}main{display:flex;gap:20px}section{width:340px}img{object-fit:contain}section div:last-child img{display:block}h1{font-size:28px}</style><h1>Body recognition · four DRAFT candidates · no registered asset changed</h1><main>${rows.join("")}</main></html>`;
writeFileSync(`${out}/body-candidates.html`, html);
await page.setContent(html);
await page.screenshot({ path: `${out}/body-candidates.png`, fullPage: true });
await page.close();
for (const [name, width, height] of [
  ["phone", 320, 740],
  ["tv", 1920, 1080],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  for (const id of ids) {
    await context.route(`**/media/objects/${id}.svg`, (route) =>
      route.fulfill({
        contentType: "image/png",
        body: readFileSync(`docs/review/media/astra-drafts/${id}-candidate.png`),
      }),
    );
  }
  const p = await context.newPage();
  await p.goto("http://127.0.0.1:3000/maternelle/1/seance/18");
  await p.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
  // Day 18 begins with oral retrieval; advance once to the four body words.
  await p.getByRole("button", { name: "Terminé", exact: true }).click();
  await p.getByRole("button", { name: "Montrer à l’enfant", exact: true }).click();
  await p
    .getByRole("dialog")
    .evaluate(async (d) => Promise.all([...d.querySelectorAll("img")].map((i) => i.decode())));
  await p.screenshot({ path: `${out}/body-candidates-${name}.png` });
  await context.close();
}
await browser.close();
