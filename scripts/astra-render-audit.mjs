/** Capture actual public activity states without mutating the service. Resume by existing files. */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
const { sessions } = JSON.parse(
  readFileSync("docs/review/media/astra-baseline/inventory.json", "utf8"),
);
const base = process.env.ASTRA_BASE_URL || "https://teka-edu.vercel.app";
const out = process.env.ASTRA_OUT || "private/astra-visual-evidence/baseline";
mkdirSync(out, { recursive: true });
const sizes = [
  ["small-phone", 320, 740],
  ["large-phone", 430, 932],
  ["tablet-portrait", 768, 1024],
  ["tablet-landscape", 1024, 768],
  ["desktop", 1440, 900],
  ["tv", 1920, 1080],
];
const browser = await chromium.launch();
const report = [];
for (const [name, width, height] of sizes) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  for (const { level, day, session } of sessions) {
    const activities = session.steps.flatMap((s) => s.activities);
    const marker = `${out}/${name}-${level}-${day}.json`;
    if (existsSync(marker)) {
      report.push(...JSON.parse(readFileSync(marker, "utf8")));
      continue;
    }
    await page.goto(`${base}/maternelle/${level}/seance/${day}`);
    await page.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
    const rows = [];
    for (const a of activities) {
      await page.getByRole("heading", { name: a.title, exact: true, level: 2 }).waitFor();
      const parent = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        images: [...document.images].map((i) => ({
          src: i.getAttribute("src"),
          width: i.getBoundingClientRect().width,
          broken: i.complete && i.naturalWidth === 0,
        })),
      }));
      await page.getByRole("button", { name: "Montrer à l’enfant", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      await page.evaluate(async () => {
        await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
      });
      const child = await dialog.evaluate((d) => ({
        overflow: d.scrollWidth > d.clientWidth,
        text: d.innerText,
        images: [...d.querySelectorAll("img")].map((i) => ({
          src: i.getAttribute("src"),
          width: i.getBoundingClientRect().width,
          broken: i.naturalWidth === 0,
        })),
      }));
      await page.screenshot({ path: `${out}/${name}-${a.id}.png` });
      rows.push({ activity: a.id, level, day, viewport: name, parent, child });
      await page.getByRole("button", { name: "Revenir au guide du parent", exact: true }).click();
      await page.getByRole("button", { name: /^(Suivant|Terminé|Terminer la séance)$/ }).click();
    }
    writeFileSync(marker, JSON.stringify(rows, null, 2) + "\n");
    report.push(...rows);
    console.log(`${name}: class ${level}, day ${day}, ${activities.length} initial child states`);
  }
  await context.close();
}
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2) + "\n");
await browser.close();
