import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const evidence = path.resolve(
  process.cwd(),
  "private/astra-visual-evidence/september-rich-media-rollout-screens",
);

const viewports = [
  { name: "phone", width: 320, height: 740 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "tv", width: 1920, height: 1080 },
];

const cases = [
  {
    name: "body-references",
    path: "/maternelle/1/seance/18",
    activity: "Les quatre mots de mon corps",
    expected: ["corps-main.webp", "corps-pied.webp", "corps-ventre.webp"],
    nextExpected: [],
  },
  {
    name: "animal-references",
    path: "/maternelle/3/seance/15",
    activity: "Pareil ou différent ?",
    expected: ["animal-poule.webp", "animal-poussin.webp"],
    nextExpected: [],
  },
  {
    name: "hands-rhyme",
    path: "/maternelle/1/seance/2",
    activity: "Un, deux, trois, mes mains",
    expected: ["comptine-mains.webp"],
    nextExpected: [],
  },
  {
    name: "tika-story",
    path: "/maternelle/1/seance/9",
    activity: "Tika se lève",
    expected: ["histoire-tika-01.webp"],
    nextExpected: ["histoire-tika-02.webp"],
  },
  {
    name: "lisa-story",
    path: "/maternelle/1/seance/3",
    activity: "Le seau de Lisa",
    expected: ["histoire-seau-lisa-01.webp"],
    nextExpected: ["histoire-seau-lisa-02.webp", "histoire-seau-lisa-03.webp"],
  },
  {
    name: "kumu-story",
    path: "/maternelle/3/seance/3",
    activity: "L’histoire de Kumu",
    expected: ["histoire-kumu-01.webp"],
    nextExpected: ["histoire-kumu-02.webp", "histoire-kumu-03.webp", "histoire-kumu-04.webp"],
  },
  {
    name: "bibi-story",
    path: "/maternelle/3/seance/5",
    activity: "Le temps de lecture",
    expected: ["histoire-bibi-01.webp"],
    nextExpected: ["histoire-bibi-02.webp", "histoire-bibi-03.webp", "histoire-bibi-04.webp"],
  },
  {
    name: "bucket-rhyme",
    path: "/maternelle/1/seance/6",
    activity: "Le petit seau",
    expected: ["histoire-seau-lisa-02.webp"],
    nextExpected: [],
  },
] as const;

async function reachActivity(page: Page, item: (typeof cases)[number]) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto(item.path);
  await page.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
  for (let step = 0; step < 20; step++) {
    if ((await page.locator("h2#activite").textContent()) === item.activity) return;
    const resume = page.getByRole("button", { name: "Continuer", exact: true });
    if (await resume.isVisible()) await resume.click();
    else
      await page
        .getByRole("button", { name: /^(Suivant|Terminé)$/ })
        .first()
        .click();
  }
  throw new Error(`Activity not reached: ${item.path} / ${item.activity}`);
}

test("the controlled rollout renders its integrated references across target widths", async ({
  page,
}) => {
  test.setTimeout(120_000);
  mkdirSync(evidence, { recursive: true });
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const item of cases) {
      await reachActivity(page, item);
      await page.getByRole("button", { name: "Montrer à l’enfant", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      const images = await dialog.getByRole("img").all();
      const actual: string[] = [];
      for (const image of images) {
        await expect
          .poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth))
          .toBeGreaterThan(0);
        await image.evaluate((node: HTMLImageElement) => node.decode());
        actual.push(
          path.basename(new URL((await image.getAttribute("src"))!, "http://local").pathname),
        );
      }
      for (const expected of item.expected) expect(actual).toContain(expected);
      for (const expected of item.nextExpected) {
        await dialog.getByRole("button", { name: "Page suivante", exact: true }).click();
        const next = dialog.getByRole("img");
        await expect(next).toHaveAttribute("src", new RegExp(`${expected}$`));
        await expect
          .poll(() => next.evaluate((node: HTMLImageElement) => node.naturalWidth))
          .toBe(1200);
        await next.evaluate((node: HTMLImageElement) => node.decode());
      }
      const layout = await page.evaluate(() => {
        const modal = document.querySelector<HTMLElement>("dialog")!;
        return {
          documentOverflow:
            document.documentElement.scrollWidth - document.documentElement.clientWidth,
          dialogOverflow: modal.scrollWidth - modal.clientWidth,
          pictures: [...modal.querySelectorAll<HTMLImageElement>("img")].map((picture) => {
            const box = picture.getBoundingClientRect();
            return { left: box.left, right: box.right };
          }),
        };
      });
      expect(layout.documentOverflow).toBeLessThanOrEqual(1);
      expect(layout.dialogOverflow).toBeLessThanOrEqual(1);
      for (const picture of layout.pictures) {
        expect(picture.left).toBeGreaterThanOrEqual(0);
        expect(picture.right).toBeLessThanOrEqual(viewport.width);
      }
      await page.screenshot({
        path: path.join(evidence, `${viewport.name}-${item.name}.png`),
        fullPage: true,
      });
    }
  }
});
