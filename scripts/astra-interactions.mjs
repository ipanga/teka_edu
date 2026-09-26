/** Exercise reachable child renderer states in every September activity, locally only. */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
const { sessions } = JSON.parse(
  readFileSync("docs/review/media/astra-baseline/inventory.json", "utf8"),
);
const out = process.env.ASTRA_OUT || "private/astra-visual-evidence/interactions-final";
const baseUrl = process.env.ASTRA_BASE_URL || "http://127.0.0.1:3000";
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(baseUrl).hostname)) {
  throw new Error("Interaction audit requires a local preview URL");
}
const fullScroll = process.env.ASTRA_FULL_SCROLL === "1";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const [size, width, height] of [
  ["phone", 320, 740],
  ["tv", 1920, 1080],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  for (const { level, day, session } of sessions) {
    const marker = `${out}/${size}-${level}-${day}.json`;
    if (existsSync(marker)) continue;
    const states = [];
    await page.goto(`${baseUrl}/maternelle/${level}/seance/${day}`);
    await page.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
    for (const activity of session.steps.flatMap((s) => s.activities)) {
      const capture = async (name) => {
        const dialog = page.getByRole("dialog");
        await dialog.evaluate(async (d) =>
          Promise.all([...d.querySelectorAll("img")].map((i) => i.decode().catch(() => {}))),
        );
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
        const state = await dialog.evaluate((d) => ({
          text: d.innerText,
          overflow: d.scrollWidth > d.clientWidth,
          broken: [...d.querySelectorAll("img")].some((i) => i.naturalWidth === 0),
        }));
        const filename = `${size}-${activity.id}-${name}.png`;
        await page.screenshot({ path: `${out}/${filename}` });
        const frames = [];
        let scrollGeometry;
        let returnVisibleAtEnd;
        if (fullScroll) {
          const scroller = dialog.locator(":scope > div");
          scrollGeometry = await scroller.evaluate((d) => ({
            scrollTop: d.scrollTop,
            scrollHeight: d.scrollHeight,
            clientHeight: d.clientHeight,
            horizontalOverflow: d.scrollWidth > d.clientWidth,
          }));
          const max = scrollGeometry.scrollHeight - scrollGeometry.clientHeight;
          if (max > 1) {
            for (
              let top = 0;
              ;
              top = Math.min(max, top + Math.max(1, Math.floor(scrollGeometry.clientHeight * 0.8)))
            ) {
              await scroller.evaluate((d, y) => {
                d.scrollTop = y;
              }, top);
              await page.evaluate(
                () =>
                  new Promise((resolve) =>
                    requestAnimationFrame(() => requestAnimationFrame(resolve)),
                  ),
              );
              const frame = `${size}-${activity.id}-${name}-scroll-${top}.png`;
              await page.screenshot({ path: `${out}/${frame}` });
              frames.push(frame);
              if (top >= max) break;
            }
          }
          const back = await dialog
            .getByRole("button", { name: "Revenir au guide du parent", exact: true })
            .boundingBox();
          returnVisibleAtEnd = back !== null && back.y >= 0 && back.y + back.height <= height + 1;
          // Preserve the interaction's original scroll position before the next action.
          await scroller.evaluate((d, y) => {
            d.scrollTop = y;
          }, scrollGeometry.scrollTop);
        }
        states.push({
          activity: activity.id,
          name,
          filename,
          ...state,
          ...(fullScroll ? { scrollGeometry, frames, returnVisibleAtEnd } : {}),
        });
      };
      await page.getByRole("button", { name: "Montrer à l’enfant", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await capture("initial");
      const game = dialog.getByRole("button", { name: "Jouer : je montre le mot", exact: true });
      if (await game.count()) {
        await game.click();
        await capture("game");
      }
      const choiceGrid = dialog.locator(".teka-choice-grid");
      if (await choiceGrid.count()) {
        const options = choiceGrid.getByRole("button");
        if ((await options.count()) > 1) {
          // Pick an actually different kind: a rotated square is still a correct square.
          const firstKind = activity.media[0]?.tags[0];
          const wrong = activity.media.findIndex((m) => m.tags[0] !== firstKind);
          if (wrong >= 0) {
            await options.nth(wrong).click();
            await capture("retry");
            await options.nth(wrong).click();
            await capture("revealed");
          }
          await options.first().click();
          await capture("success");
          const next = dialog.getByRole("button", { name: "Encore un autre", exact: true });
          if (await next.count()) {
            await next.click();
            await capture("next-target");
          }
        }
      }
      const nextPage = dialog.getByRole("button", { name: "Page suivante", exact: true });
      let n = 1;
      while ((await nextPage.count()) && (await nextPage.isEnabled())) {
        await nextPage.click();
        await capture(`page-${++n}`);
      }
      const counters = dialog.getByRole("button", { name: /^Objet \d+$/ });
      const count = await counters.count();
      for (let i = 0; i < count; i++) {
        await counters.nth(i).click();
        await capture(`count-${i + 1}`);
      }
      const reset = dialog.getByRole("button", { name: "Recommencer", exact: true });
      if (await reset.count()) {
        await reset.click();
        await capture("reset");
      }
      const categories = activity.payload.categories;
      if (
        Array.isArray(categories) &&
        activity.media.length &&
        activity.renderer === "group-and-match"
      ) {
        for (let i = 0; i < activity.media.length; i++) {
          const item = activity.media[i];
          await dialog.getByRole("button", { name: item.alt, exact: true }).click();
          await capture(`sort-selected-${i + 1}`);
          await dialog
            .getByText(categories[i % categories.length], { exact: true })
            .locator("..")
            .click();
          await capture(`sort-placed-${i + 1}`);
        }
      }
      await page.getByRole("button", { name: "Revenir au guide du parent", exact: true }).click();
      await page.getByRole("button", { name: /^(Suivant|Terminé|Terminer la séance)$/ }).click();
    }
    writeFileSync(marker, JSON.stringify(states, null, 2) + "\n");
    console.log(`${size} class ${level} day ${day}: ${states.length} states`);
  }
  await context.close();
}
await browser.close();
