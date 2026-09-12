import { expect, test } from "@playwright/test";

// The parent-led session (ADR-039): a parent opens Teka Edu after school and runs the day's
// lesson. These tests follow that path end to end, on a phone-sized screen and on a desktop one.
// They use no test data: everything comes from the content shipped with the release.

test.describe("parent session", () => {
  test("today's page says what to do and how long it takes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Aujourd’hui" })).toBeVisible();
    // Either today's lesson or, outside school days, the most recent session.
    await expect(page.getByRole("link", { name: /Commencer la leçon/ })).toBeVisible();
    await expect(page.getByText(/3ème maternelle/)).toBeVisible();
    await expect(page.getByText(/environ \d+ minutes/)).toBeVisible();
  });

  test("the September calendar distinguishes sessions, weekends and catch-up", async ({ page }) => {
    await page.goto("/calendrier");
    await expect(page.getByRole("heading", { name: "Septembre 2026" })).toBeVisible();
    await expect(page.getByText("22 séances", { exact: false })).toBeVisible();
    // Weekends are shown as such, never as a missing lesson.
    await expect(page.getByText("week-end").first()).toBeVisible();
    // An earlier session can be opened to catch up.
    await page.getByRole("link", { name: /mardi 1er septembre 2026/ }).click();
    await expect(page).toHaveURL(/\/seance\/1$/);
  });

  test("a session runs from preparation to the end, one activity at a time", async ({ page }) => {
    await page.goto("/seance/1");
    await expect(page.getByRole("heading", { name: "À préparer" })).toBeVisible();
    // Materials come with what to use instead, because homes differ.
    await expect(page.getByText("À défaut :").first()).toBeVisible();

    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    await expect(page.getByText("Activité 1 sur")).toBeVisible();
    await expect(page.getByText("À dire à l’enfant")).toBeVisible();

    // Parent guidance is folded away until asked for.
    const guidance = page.getByRole("button", { name: "Afficher le conseil au parent" });
    await expect(guidance).toBeVisible();
    await guidance.click();
    await expect(page.getByRole("button", { name: "Masquer le conseil" })).toBeVisible();

    // Moving on folds it away again: each activity starts from the French instruction.
    await page.getByRole("button", { name: "Suivant" }).click();
    await expect(page.getByText("Activité 2 sur")).toBeVisible();
    await expect(page.getByRole("button", { name: "Afficher le conseil au parent" })).toBeVisible();

    await page.getByRole("button", { name: "Précédent" }).click();
    await expect(page.getByText("Activité 1 sur")).toBeVisible();
  });

  test("English help stays hidden until the parent asks for it", async ({ page }) => {
    await page.goto("/seance/1");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    const help = page.getByRole("button", { name: "Besoin d’aide en anglais ?" });
    await expect(help).toBeVisible();
    // The English sentence itself is not on the page yet.
    await expect(page.locator("[lang='en']")).toHaveCount(0);
    await help.click();
    await expect(page.locator("[lang='en']")).toBeVisible();
  });

  test("the session offers a pause and then an end", async ({ page }) => {
    await page.goto("/seance/1");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();

    let sawPause = false;
    for (let step = 0; step < 12; step++) {
      if (await page.getByText("Bon moment pour faire une pause").isVisible()) sawPause = true;
      const next = page.getByRole("button", { name: /Suivant|Terminer/ });
      if (!(await next.isVisible())) break;
      await next.click();
      if (await page.getByRole("heading", { name: /C’est fini pour aujourd’hui/ }).isVisible()) {
        break;
      }
    }
    expect(sawPause).toBe(true);
    await expect(page.getByRole("heading", { name: /C’est fini pour aujourd’hui/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voir le calendrier" })).toBeVisible();
  });

  test("a day that has no session is not invented", async ({ page }) => {
    // Instructional day 23 is October: not authored yet.
    const response = await page.goto("/seance/23");
    expect(response?.status()).toBe(404);
  });

  test("the session works on a phone and on a desktop", async ({ page }) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1280, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/seance/6");
      await page.getByRole("button", { name: "Commencer la leçon" }).click();
      await expect(page.getByText("Activité 1 sur")).toBeVisible();
      // Nothing overflows sideways on a phone.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });

  test("the child's screen never shows curriculum codes", async ({ page }) => {
    await page.goto("/seance/3");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    const body = (await page.locator("body").textContent()) ?? "";
    expect(body).not.toMatch(/LANG-S\d{2}|MATH-S\d{2}|exemples? de réussite/i);
  });
});
