import { expect, test } from "@playwright/test";

// The parent-led session (ADR-039): a parent opens Teka Edu after school and runs the day's
// lesson. These tests follow that path end to end, on a phone-sized screen and on a desktop one.
// They use no test data: everything comes from the content shipped with the release.

test.describe("parent session", () => {
  test("today's page says what to do and how long it takes", async ({ page }) => {
    await page.goto("/maternelle/3");
    await expect(page.getByRole("heading", { name: "Aujourd’hui" })).toBeVisible();
    // Either today's lesson or, outside school days, the most recent session.
    await expect(page.getByRole("link", { name: /Commencer la leçon/ })).toBeVisible();
    await expect(page.getByText(/3ème maternelle/)).toBeVisible();
    await expect(page.getByText(/environ \d+ minutes/)).toBeVisible();
  });

  test("the September calendar distinguishes sessions, weekends and catch-up", async ({ page }) => {
    await page.goto("/maternelle/3/calendrier");
    await expect(page.getByRole("heading", { name: "Septembre 2026" })).toBeVisible();
    await expect(page.getByText("22 séances", { exact: false })).toBeVisible();
    // Weekends are shown as such, never as a missing lesson.
    await expect(page.getByText("week-end").first()).toBeVisible();
    // An earlier session can be opened to catch up.
    await page.getByRole("link", { name: /mardi 1er septembre 2026/ }).click();
    await expect(page).toHaveURL(/\/maternelle\/3\/seance\/1$/);
  });

  test("a session runs from preparation to the end, one activity at a time", async ({ page }) => {
    await page.goto("/maternelle/3/seance/1");
    await expect(page.getByRole("heading", { name: "À préparer" })).toBeVisible();
    // The list is short and scannable; what to use instead waits until the parent asks, so the
    // preparation screen is a list to fetch rather than a page to read.
    await expect(page.getByText("À défaut :")).toHaveCount(0);
    await page.getByRole("button", { name: /Je n’ai pas tout/ }).click();
    await expect(page.getByText("À défaut :").first()).toBeVisible();

    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    await expect(page.getByText("Activité 1 sur")).toBeVisible();
    // The child's part and the parent's part are now distinct zones on the screen.
    await expect(page.getByText("La part de l’enfant")).toBeVisible();
    await expect(page.getByText("Pour vous")).toBeVisible();

    // Parent guidance is folded away until asked for.
    const guidance = page.getByRole("button", { name: "Afficher le conseil au parent" });
    await expect(guidance).toBeVisible();
    await guidance.click();
    await expect(page.getByRole("button", { name: "Masquer le conseil" })).toBeVisible();

    // Moving on folds it away again: each activity starts from the French instruction.
    await page
      .getByRole("button", { name: /Suivant|Terminé/ })
      .first()
      .click();
    await expect(page.getByText("Activité 2 sur")).toBeVisible();
    await expect(page.getByRole("button", { name: "Afficher le conseil au parent" })).toBeVisible();

    await page.getByRole("button", { name: "Précédent" }).click();
    await expect(page.getByText("Activité 1 sur")).toBeVisible();
  });

  test("English help stays hidden until the parent asks for it", async ({ page }) => {
    await page.goto("/maternelle/3/seance/1");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    const help = page.getByRole("button", { name: "Besoin d’aide en anglais ?" });
    await expect(help).toBeVisible();
    // The English sentence itself is not on the page yet.
    await expect(page.locator("[lang='en']")).toHaveCount(0);
    await help.click();
    await expect(page.locator("[lang='en']")).toBeVisible();
  });

  test("the session offers a pause and then an end", async ({ page }) => {
    await page.goto("/maternelle/3/seance/1");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();

    let sawPause = false;
    for (let step = 0; step < 12; step++) {
      if (await page.getByText("Bon moment pour faire une pause").isVisible()) sawPause = true;
      const next = page.getByRole("button", { name: /Suivant|Terminé|Terminer/ }).first();
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
    const response = await page.goto("/maternelle/3/seance/23");
    expect(response?.status()).toBe(404);
  });

  test("the session works on a phone and on a desktop", async ({ page }) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1280, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/maternelle/3/seance/6");
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
    await page.goto("/maternelle/3/seance/3");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    const body = (await page.locator("body").textContent()) ?? "";
    expect(body).not.toMatch(/LANG-S\d{2}|MATH-S\d{2}|exemples? de réussite/i);
  });

  test("the child is shown the shapes the lesson talks about, and can touch them", async ({
    page,
  }) => {
    // The defect this phase existed to fix: « Regarde les formes » with nothing on the screen.
    await page.goto("/maternelle/3/seance/3");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    for (let step = 0; step < 6; step++) {
      if (await page.getByText("Je nomme les formes").isVisible()) break;
      await page
        .getByRole("button", { name: /Suivant|Terminé/ })
        .first()
        .click();
    }
    await expect(page.getByText("Je nomme les formes")).toBeVisible();

    // Four shapes, each a real button with an accessible name.
    const shapes = page.getByRole("button", { name: /^Un (carré|rectangle|triangle|disque)/ });
    await expect(shapes).toHaveCount(4);
    await expect(page.getByText(/^Montre :/)).toBeVisible();

    // A wrong tap encourages another try; it never says the child is wrong.
    await page.getByRole("button", { name: "Un triangle" }).click();
    await expect(page.getByText(/Essaie encore/)).toBeVisible();
    const body = (await page.locator("body").textContent()) ?? "";
    expect(body).not.toMatch(/incorrect|faux|erreur/i);

    await page.getByRole("button", { name: "Un carré" }).click();
    await expect(page.getByText("Bravo !")).toBeVisible();
  });

  test("counting gives the child something to count", async ({ page }) => {
    await page.goto("/maternelle/3/seance/1");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    for (let step = 0; step < 8; step++) {
      if (await page.getByText(/Touche chaque objet/).isVisible()) break;
      await page
        .getByRole("button", { name: /Suivant|Terminé/ })
        .first()
        .click();
    }
    await expect(page.getByText(/Touche chaque objet/)).toBeVisible();
    const objects = page.getByRole("button", { name: /^Objet \d+$/ });
    await expect(objects.first()).toBeVisible();
    await objects.nth(2).click();
    await expect(page.getByRole("status")).toContainText("3");
  });

  test("an off-screen activity asks the parent to put the screen down", async ({ page }) => {
    await page.goto("/maternelle/3/seance/1");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    let sawOffScreen = false;
    for (let step = 0; step < 10; step++) {
      if (await page.getByText(/Posez l’écran/).isVisible()) {
        sawOffScreen = true;
        break;
      }
      const next = page.getByRole("button", { name: /Suivant|Terminé/ }).first();
      if (!(await next.isVisible())) break;
      await next.click();
    }
    expect(sawOffScreen).toBe(true);
  });

  test("a story is read page by page, not as one wall of text", async ({ page }) => {
    await page.goto("/maternelle/3/seance/3");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    await page
      .getByRole("button", { name: /Suivant|Terminé/ })
      .first()
      .click();
    await expect(page.getByText("Kumu, le petit poussin")).toBeVisible();
    await expect(page.getByRole("button", { name: "Page suivante" })).toBeVisible();
    // The comprehension questions wait until the end of the story.
    await expect(page.getByText("Questions, après la lecture")).toHaveCount(0);
  });

  test("the observation form records the session, never the child", async ({ page }) => {
    await page.goto("/maternelle/3/seance/1/observation");
    await expect(page.getByRole("heading", { name: /Comment ça s’est passé/ })).toBeVisible();
    await expect(page.getByText(/Aucune information sur l’enfant/)).toBeVisible();
    // It asks about the session, not about a person.
    const body = (await page.locator("body").textContent()) ?? "";
    expect(body).not.toMatch(/prénom de l’enfant|nom de l’enfant|date de naissance/i);
    await page.getByRole("button", { name: "Oui" }).first().click();
    await page.getByRole("button", { name: "Enregistrer dans ce navigateur" }).click();
    await expect(page.getByText("Enregistré.")).toBeVisible();
  });

  test("the parent can pause, stop early, and pick the session up again", async ({ page }) => {
    await page.goto("/maternelle/3/seance/4");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    await page
      .getByRole("button", { name: /Suivant|Terminé/ })
      .first()
      .click();

    // A break is one tap away, and coming back is not a restart.
    await page.getByRole("button", { name: "Faire une petite pause" }).click();
    await expect(page.getByRole("heading", { name: "Petite pause." })).toBeVisible();
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByText("Activité 2 sur")).toBeVisible();

    // Stopping early is offered as a normal thing to do, never as a failure.
    await page.getByRole("button", { name: "Terminer pour aujourd’hui" }).click();
    await expect(page.getByRole("heading", { name: /On s’arrête là/ })).toBeVisible();
    const body = (await page.locator("body").textContent()) ?? "";
    expect(body).not.toMatch(/échec|abandon|incomplet/i);

    // The browser remembers where we were, and offers to resume rather than deciding.
    await page.reload();
    await expect(
      page.getByRole("button", { name: /Reprendre où nous nous étions arrêtés/ }),
    ).toBeVisible();
  });

  test("the child's screen can fill the phone, with no parent chrome on it", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/maternelle/3/seance/3");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    await page.getByRole("button", { name: "Montrer à l’enfant" }).click();

    const childScreen = page.getByRole("dialog", { name: "Écran de l’enfant" });
    await expect(childScreen).toBeVisible();
    // Nothing of the parent's guidance is on the child's screen.
    await expect(page.getByRole("button", { name: "Afficher le conseil au parent" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("button", { name: "Besoin d’aide en anglais ?" })).toHaveCount(0);

    await page.getByRole("button", { name: "Revenir au guide du parent" }).click();
    await expect(page.getByRole("button", { name: "Afficher le conseil au parent" })).toBeVisible();
  });

  test("a story shows its own picture", async ({ page }) => {
    await page.goto("/maternelle/3/seance/3");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    await page
      .getByRole("button", { name: /Suivant|Terminé/ })
      .first()
      .click();
    await expect(page.getByText("Kumu, le petit poussin")).toBeVisible();
    await expect(page.getByRole("img", { name: /poussin/i }).first()).toBeVisible();
  });

  test("reduced motion leaves every activity fully usable", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/maternelle/3/seance/3");
    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    for (let step = 0; step < 6; step++) {
      if (await page.getByText("Je nomme les formes").isVisible()) break;
      await page
        .getByRole("button", { name: /Suivant|Terminé/ })
        .first()
        .click();
    }
    // The interaction works identically with motion off: nothing waits for an animation.
    await page.getByRole("button", { name: "Un carré" }).click();
    await expect(page.getByText("Bravo !")).toBeVisible();
    await context.close();
  });
});
