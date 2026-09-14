import { expect, test } from "@playwright/test";

// The front door (ADR-044): a parent picks the class, and a class with no lessons says so rather
// than borrowing another class's content.

test.describe("home and class selection", () => {
  test("offers the three maternelle classes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Teka Edu" })).toBeVisible();
    for (const name of ["1ère maternelle", "2ème maternelle", "3ème maternelle"]) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
  });

  test("only the class that has lessons can be opened", async ({ page }) => {
    await page.goto("/");
    // 3ème maternelle is authored; the other two are honest about being unwritten.
    await expect(page.getByRole("link", { name: /3ème maternelle/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /1ère maternelle/ })).toHaveCount(0);
    await expect(page.getByText("Les leçons de cette classe sont en préparation.")).toHaveCount(2);

    await page.getByRole("link", { name: /3ème maternelle/ }).click();
    await expect(page).toHaveURL(/\/maternelle\/3$/);
    await expect(page.getByRole("heading", { name: "Aujourd’hui" })).toBeVisible();
  });

  test("an unwritten class never shows another class's lessons", async ({ page }) => {
    await page.goto("/maternelle/1");
    await expect(page.getByRole("heading", { name: "1ère maternelle" })).toBeVisible();
    await expect(page.getByText(/en préparation/)).toBeVisible();
    // No fallback: nothing from 3ème maternelle leaks in.
    const body = (await page.locator("body").textContent()) ?? "";
    expect(body).not.toMatch(/Commencer la leçon|séance \d/);
    await expect(page.getByRole("link", { name: /Choisir une autre classe/ })).toBeVisible();
  });

  test("an unknown class is not invented", async ({ page }) => {
    const response = await page.goto("/maternelle/7");
    expect(response?.status()).toBe(404);
  });

  test("home is reachable from the session, but not from the child's screen", async ({ page }) => {
    await page.goto("/maternelle/3/seance/1");
    await expect(page.getByRole("link", { name: /Accueil/ })).toBeVisible();

    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    await page.getByRole("button", { name: "Montrer à l’enfant" }).click();
    await expect(page.getByRole("dialog", { name: "Écran de l’enfant" })).toBeVisible();

    // A mis-tap must not send a five-year-old out of the activity: the child's screen is a modal
    // dialog, so the header's home link is inert behind it and cannot be clicked at all.
    await expect(
      page.getByRole("link", { name: /Accueil/ }).click({ trial: true, timeout: 1500 }),
    ).rejects.toThrow();
    await expect(page).toHaveURL(/\/maternelle\/3\/seance\/1$/);
    await expect(page.getByRole("button", { name: "Revenir au guide du parent" })).toBeVisible();
  });

  test("the home screen works from a phone to a television", async ({ page }) => {
    for (const viewport of [
      { width: 360, height: 780 },
      { width: 768, height: 1024 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "Teka Edu" })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
    }
  });
});
