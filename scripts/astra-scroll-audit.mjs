/** Capture actual scroll positions; never resize the dialog to disguise scrolling. */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
const { sessions } = JSON.parse(
  readFileSync("docs/review/media/astra-baseline/inventory.json", "utf8"),
);
const out = "private/astra-visual-evidence/scroll-audit";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const [name, width, height] of [
  ["phone", 320, 740],
  ["tv", 1920, 1080],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  for (const { level, day, session } of sessions) {
    const marker = `${out}/${name}-${level}-${day}.json`;
    if (existsSync(marker)) continue;
    const rows = [];
    await page.goto(`http://127.0.0.1:3000/maternelle/${level}/seance/${day}`);
    await page.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
    for (const activity of session.steps.flatMap((s) => s.activities)) {
      await page.getByRole("button", { name: "Montrer à l’enfant", exact: true }).click();
      const dialog = page.getByRole("dialog");
      const scroller = dialog.locator(":scope > div");
      await dialog.evaluate(async (d) =>
        Promise.all([...d.querySelectorAll("img")].map((i) => i.decode().catch(() => {}))),
      );
      const geometry = await scroller.evaluate((d) => ({
        scrollHeight: d.scrollHeight,
        clientHeight: d.clientHeight,
        horizontalOverflow: d.scrollWidth > d.clientWidth,
      }));
      const frames = [];
      if (geometry.scrollHeight > geometry.clientHeight + 1 || activity.id === "m3-lang-01-a3") {
        const max = geometry.scrollHeight - geometry.clientHeight;
        for (let offset = 0; ; offset = Math.min(max, offset + Math.floor(height * 0.8))) {
          await scroller.evaluate((d, top) => {
            d.scrollTop = top;
          }, offset);
          await page.evaluate(
            () =>
              new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
          );
          const file = `${name}-${activity.id}-scroll-${offset}.png`;
          await page.screenshot({ path: `${out}/${file}` });
          frames.push(file);
          if (offset >= max) break;
        }
      }
      const back = await dialog
        .getByRole("button", { name: "Revenir au guide du parent" })
        .boundingBox();
      rows.push({
        activity: activity.id,
        ...geometry,
        frames,
        returnVisibleAtEnd: back !== null && back.y >= 0 && back.y + back.height <= height + 1,
      });
      await dialog.getByRole("button", { name: "Revenir au guide du parent" }).click();
      await page.getByRole("button", { name: /^(Suivant|Terminé|Terminer la séance)$/ }).click();
    }
    writeFileSync(marker, JSON.stringify(rows, null, 2) + "\n");
    console.log(
      `${name} class ${level} day ${day}: ${rows.filter((r) => r.frames.length).length} captured activities`,
    );
  }
  await context.close();
}
await browser.close();
