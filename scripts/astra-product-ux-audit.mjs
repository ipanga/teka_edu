import fs from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const outputRoot = path.resolve("private/astra-product-ux-audit");

const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "tv", width: 1920, height: 1080 },
];

async function inspectPage(page) {
  return page.evaluate(() => ({
    title: document.title,
    heading: document.querySelector("h1, h2")?.textContent?.trim() ?? null,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    brokenImages: [...document.images]
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src),
  }));
}

async function capture(page, viewport, state, manifest) {
  const file = `${viewport.name}-${state}.png`;
  await page.screenshot({
    path: path.join(outputRoot, file),
    fullPage: true,
    animations: "disabled",
  });
  manifest.push({ viewport, state, file, url: page.url(), ...(await inspectPage(page)) });
}

async function startDayOne(page) {
  await page.goto(`${baseURL}/maternelle/3/seance/1`);
  await page.getByRole("button", { name: "Commencer la leçon" }).click();
}

await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(outputRoot, { recursive: true });

const browser = await chromium.launch();
const manifest = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
      locale: "fr-FR",
    });
    const page = await context.newPage();

    await page.goto(`${baseURL}/`);
    await capture(page, viewport, "home", manifest);

    await page.goto(`${baseURL}/maternelle/1`);
    await capture(page, viewport, "class-1", manifest);

    await page.goto(`${baseURL}/maternelle/2`);
    await capture(page, viewport, "class-2-unavailable", manifest);

    await page.goto(`${baseURL}/maternelle/3`);
    await capture(page, viewport, "class-3", manifest);

    await page.goto(`${baseURL}/maternelle/3/calendrier`);
    await capture(page, viewport, "calendar", manifest);

    await page.goto(`${baseURL}/maternelle/3/seance/1`);
    await capture(page, viewport, "session-preparation", manifest);
    const alternatives = page.getByRole("button", { name: /Je n’ai pas tout/ });
    if (await alternatives.isVisible()) await alternatives.click();
    await capture(page, viewport, "session-preparation-alternatives", manifest);

    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    await capture(page, viewport, "activity-parent-folded", manifest);
    await page.getByRole("button", { name: "Afficher le conseil au parent" }).click();
    await capture(page, viewport, "activity-parent-guidance", manifest);
    await page.getByRole("button", { name: "Montrer à l’enfant" }).click();
    await capture(page, viewport, "activity-child", manifest);
    await page.getByRole("button", { name: "Revenir au guide du parent" }).click();
    await page.getByRole("button", { name: "Faire une petite pause" }).click();
    await capture(page, viewport, "session-pause", manifest);
    await page.getByRole("button", { name: "Terminer pour aujourd’hui" }).click();
    await capture(page, viewport, "session-stopped", manifest);

    await startDayOne(page);
    for (let guard = 0; guard < 20; guard += 1) {
      if (await page.getByRole("heading", { name: /C’est fini pour aujourd’hui/ }).isVisible()) {
        break;
      }
      await page
        .getByRole("button", { name: /Suivant|Terminé|Terminer la séance/ })
        .first()
        .click();
    }
    await capture(page, viewport, "session-complete", manifest);

    await page.goto(`${baseURL}/maternelle/3/seance/1/observation`);
    await capture(page, viewport, "observation", manifest);
    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(
  path.join(outputRoot, "manifest.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      baseURL,
      reducedMotion: true,
      captures: manifest,
    },
    null,
    2,
  )}\n`,
);

const horizontalOverflow = manifest.filter((entry) => entry.scrollWidth - entry.clientWidth > 1);
const brokenImages = manifest.filter((entry) => entry.brokenImages.length > 0);
console.log(
  JSON.stringify(
    {
      outputRoot,
      captures: manifest.length,
      horizontalOverflow: horizontalOverflow.length,
      brokenImages: brokenImages.length,
    },
    null,
    2,
  ),
);
