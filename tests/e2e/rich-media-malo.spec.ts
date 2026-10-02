import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const evidence = path.resolve("private/astra-visual-evidence/histoire-malo-screens");
const viewports = [
  { name: "phone-320", width: 320, height: 740 },
  { name: "phone-360", width: 360, height: 800 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "phone-430", width: 430, height: 932 },
  { name: "tablet-portrait", width: 768, height: 1024 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "laptop-1280", width: 1280, height: 900 },
  { name: "macbook-1440", width: 1440, height: 900 },
];

async function reach(page: Page, route: string, title: string) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto(route);
  await page.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
  for (let step = 0; step < 20; step++) {
    if ((await page.locator("h2#activite").textContent()) === title) return;
    const resume = page.getByRole("button", { name: "Continuer", exact: true });
    if (await resume.isVisible()) await resume.click();
    else
      await page
        .getByRole("button", { name: /^(Suivant|Terminé)$/ })
        .first()
        .click();
  }
  throw new Error(`Activity not reached: ${route} / ${title}`);
}

for (const viewport of viewports) {
  test(`Malo canonical four-page order at ${viewport.name}`, async ({ page }) => {
    mkdirSync(evidence, { recursive: true });
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await reach(page, "/maternelle/3/seance/7", "Le temps de lecture");
    await page.getByRole("button", { name: "Montrer à l’enfant", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const starts = [
      "Le soir tombe. Malo, le petit chien, ne veut pas dormir.",
      "« Moi, dit le coq, je monte sur ma branche et je mets ma tête sous mon aile. »",
      "« Moi, dit le poisson, je dors dans l’eau, les yeux ouverts. »",
      "Il se couche en rond, le nez sur la queue.",
    ];
    for (let frame = 1; frame <= 4; frame++) {
      const picture = dialog.getByRole("img");
      await expect(picture).toHaveAttribute("src", new RegExp(`histoire-malo-0${frame}\\.webp$`));
      await expect(dialog.getByText(starts[frame - 1]!, { exact: true })).toBeVisible();
      await picture.evaluate((image: HTMLImageElement) => image.decode());
      const size = await picture.evaluate((image: HTMLImageElement) => {
        const box = image.getBoundingClientRect();
        return {
          width: image.naturalWidth,
          height: image.naturalHeight,
          ratio: box.width / box.height,
          left: box.left,
          right: box.right,
          fit: getComputedStyle(image).objectFit,
        };
      });
      expect(size.width).toBe(1200);
      expect(size.height).toBe(900);
      expect(size.ratio).toBeCloseTo(4 / 3, 1);
      expect(size.left).toBeGreaterThanOrEqual(0);
      expect(size.right).toBeLessThanOrEqual(viewport.width);
      expect(size.fit).not.toBe("cover");
      expect(
        await dialog.evaluate((node) => node.scrollWidth - node.clientWidth),
      ).toBeLessThanOrEqual(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: path.join(evidence, `${viewport.name}-page-${frame}.png`),
        fullPage: true,
      });
      const parentReturn = dialog.getByRole("button", {
        name: "Revenir au guide du parent",
        exact: true,
      });
      await parentReturn.scrollIntoViewIfNeeded();
      await expect(parentReturn).toBeInViewport();
      if (viewport.name === "phone-390" && frame === 2) {
        await page.screenshot({ path: path.join(evidence, "phone-390-page-2-return.png") });
      }
      if (frame < 4)
        await dialog.getByRole("button", { name: "Page suivante", exact: true }).click();
      else
        await expect(
          dialog.getByRole("button", { name: "Page suivante", exact: true }),
        ).toBeDisabled();
    }
  });
}
