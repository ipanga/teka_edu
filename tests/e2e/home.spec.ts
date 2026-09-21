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

  test("says it is a beta, to the adult and nowhere else", async ({ page }) => {
    // A tester who does not know they are testing gives no useful silence. One badge and one
    // sentence, on the front door — and nothing that collects anything.
    await page.goto("/");
    await expect(page.getByText("Beta", { exact: true })).toBeVisible();
    await expect(page.getByText(/Version d’essai/)).toBeVisible();
    // It invites a note and promises nothing is sent: that is the whole feedback mechanism.
    await expect(page.getByText(/Rien n’est envoyé automatiquement/)).toBeVisible();

    // The child's screen is the lesson and nothing else (ADR-043): no badge follows it there.
    await page.goto("/maternelle/3/seance/1");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    await expect(page.getByText("Beta", { exact: true })).toHaveCount(0);
  });

  test("only the classes that have lessons can be opened", async ({ page }) => {
    await page.goto("/");
    // 1ère and 3ème are authored; 2ème is honest about being unwritten.
    await expect(page.getByRole("link", { name: /1ère maternelle/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /3ème maternelle/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /2ème maternelle/ })).toHaveCount(0);
    await expect(page.getByText("Les leçons de cette classe sont en préparation.")).toHaveCount(1);

    await page.getByRole("link", { name: /3ème maternelle/ }).click();
    await expect(page).toHaveURL(/\/maternelle\/3$/);
    await expect(page.getByRole("heading", { name: "Aujourd’hui" })).toBeVisible();
  });

  test("the youngest class opens on its own September", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /1ère maternelle/ }).click();
    await expect(page).toHaveURL(/\/maternelle\/1$/);
    await expect(page.getByRole("heading", { name: "Aujourd’hui" })).toBeVisible();
    // Its own content, never 3ème's: the two months share no lesson.
    const body = (await page.locator("body").textContent()) ?? "";
    expect(body).not.toMatch(/Kumu|Nsimba|Bibi/);
  });

  test("an unwritten class never shows another class's lessons", async ({ page }) => {
    await page.goto("/maternelle/2");
    await expect(page.getByRole("heading", { name: "2ème maternelle" })).toBeVisible();
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
