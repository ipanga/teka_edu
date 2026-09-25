import { expect, test } from "@playwright/test";

const viewports = [
  { name: "small phone", width: 320, height: 740 },
  { name: "large phone", width: 430, height: 932 },
  { name: "tablet portrait", width: 768, height: 1024 },
  { name: "tablet landscape", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "TV", width: 1920, height: 1080 },
];

test("four body words and the parent return control fit a TV screen", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/maternelle/1/seance/18");
  await page.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
  await page.getByRole("button", { name: "Terminé", exact: true }).click();
  await page.getByRole("button", { name: "Montrer à l’enfant", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const cards = dialog.getByRole("list", { name: "Les mots", exact: true }).locator(":scope > li");
  await expect(cards).toHaveCount(4);
  const boxes = await Promise.all((await cards.all()).map((card) => card.boundingBox()));
  for (const box of boxes) {
    expect(Math.abs(box!.y - boxes[0]!.y)).toBeLessThan(2);
  }
  const back = await dialog
    .getByRole("button", { name: "Revenir au guide du parent" })
    .boundingBox();
  expect(back!.y + back!.height).toBeLessThanOrEqual(1080);
});

for (const viewport of viewports) {
  test(`September word cards fit and remain interactive on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/maternelle/1/seance/11");
    await page.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
    await page.getByRole("button", { name: "Terminé", exact: true }).click();
    await page.getByRole("button", { name: "Montrer à l’enfant", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const cards = dialog
      .getByRole("list", { name: "Les mots", exact: true })
      .locator(":scope > li");
    await expect(cards).toHaveCount(2);
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs(first!.y - second!.y)).toBeLessThan(2);
    expect(second!.x + second!.width).toBeLessThanOrEqual(viewport.width);
    expect((await cards.first().getByRole("img").boundingBox())!.width).toBeGreaterThanOrEqual(100);
    await page.getByRole("button", { name: "Jouer : je montre le mot", exact: true }).click();
    await dialog.getByRole("button", { name: /Une main ouverte/ }).click();
    await expect(dialog.getByRole("status")).toHaveText("Bravo !");
    await expect(dialog.getByRole("button", { name: "Encore un autre" })).toBeVisible();
    await page.getByRole("button", { name: "Revenir au guide du parent" }).click();
    await expect(page.getByText("Pour vous", { exact: true })).toBeVisible();
  });
}

test("two TV choices fill the stage and the story keeps its text beside its picture", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/maternelle/3/seance/5");
  await page.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: /^(Suivant|Terminé)$/ }).click();
  }
  await page.getByRole("button", { name: "Montrer à l’enfant", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const pictures = dialog.getByRole("img");
  await expect(pictures).toHaveCount(2);
  for (const picture of await pictures.all()) {
    expect((await picture.boundingBox())!.width).toBeGreaterThanOrEqual(300);
  }
  await page.goto("/maternelle/1/seance/3");
  await page.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
  await page.getByRole("button", { name: "Terminé", exact: true }).click();
  await page.getByRole("button", { name: "Montrer à l’enfant", exact: true }).click();
  const image = await page.getByRole("dialog").getByRole("img").boundingBox();
  const text = await page
    .getByText("Lisa veut de l’eau. Elle cherche son seau.", { exact: true })
    .boundingBox();
  expect(text!.x).toBeGreaterThan(image!.x + image!.width);
  expect(text!.y).toBeLessThan(image!.y + image!.height);
  await page.getByRole("button", { name: "Page suivante", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("img")).toHaveCount(0);
  await page.getByRole("button", { name: "Page précédente", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("img")).toHaveCount(1);
});

test("counting again on a phone brings the child's instruction back into view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/maternelle/3/seance/10");
  await page.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
  // m3-math-10-a1, the fourth activity: twenty objects, far longer than a phone screen.
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: /^(Suivant|Terminé)$/ }).click();
  }
  await page.getByRole("button", { name: "Montrer à l’enfant", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const instruction = dialog.getByText(/^« .* »$/);
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    await dialog.getByRole("button", { name: `Objet ${n}`, exact: true }).click();
  }
  const reset = dialog.getByRole("button", { name: "Recommencer", exact: true });
  await reset.scrollIntoViewIfNeeded();
  await expect(instruction).not.toBeInViewport();
  await reset.click();
  await expect(dialog.getByRole("status")).toHaveText("…");
  await expect(reset).toHaveCount(0);
  await expect(instruction).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "Objet 1", exact: true })).toBeInViewport();
  await expect(instruction).toBeFocused();

  // In the parent's guide the page keeps its place: only the count goes back to zero.
  await dialog.getByRole("button", { name: "Revenir au guide du parent", exact: true }).click();
  for (const n of [1, 2, 3]) {
    await page.getByRole("button", { name: `Objet ${n}`, exact: true }).click();
  }
  const parentReset = page.getByRole("button", { name: "Recommencer", exact: true });
  await parentReset.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(0);
  await parentReset.click();
  await expect(page.getByRole("status")).toHaveText("…");
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
});

test("five TV word choices keep feedback and navigation on screen", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/maternelle/3/seance/2");
  await page.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
  await page.getByRole("button", { name: "Terminé", exact: true }).click();
  await page.getByRole("button", { name: "Montrer à l’enfant", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Jouer : je montre le mot", exact: true }).click();
  const choices = dialog.locator(".teka-choice-grid > button");
  await expect(choices).toHaveCount(5);
  const boxes = await Promise.all((await choices.all()).map((choice) => choice.boundingBox()));
  for (const box of boxes) expect(Math.abs(box!.y - boxes[0]!.y)).toBeLessThan(2);
  for (const state of ["retry", "revealed", "success"]) {
    await choices.nth(state === "success" ? 0 : 1).click();
    const feedback = dialog.getByRole("status");
    await expect(feedback).toBeVisible();
    expect(
      await feedback.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
    ).toBeGreaterThanOrEqual(30);
    for (const name of ["Revoir les mots", "Revenir au guide du parent"]) {
      const box = await dialog.getByRole("button", { name, exact: true }).boundingBox();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(1080);
    }
    if (state !== "retry") {
      const box = await dialog.getByRole("button", { name: "Encore un autre" }).boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(1080);
    }
  }
});
