import { expect, test } from "@playwright/test";

const devices = [
  { name: "phone-320", width: 320, height: 740 },
  { name: "phone-360", width: 360, height: 800 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "phone-430", width: 430, height: 932 },
  { name: "tablet-portrait", width: 768, height: 1024 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "laptop-1280", width: 1280, height: 900 },
  { name: "MacBook-1440", width: 1440, height: 900 },
];

for (const device of devices) {
  test(`October new authoring / ${device.name}`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize(device);
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Previously deferred day 30 is now an actual complete session.
    await page.goto("/maternelle/3/seance/30");
    await expect(page.getByRole("heading", { name: "À préparer" })).toBeVisible();
    await page.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
    await expect(page.getByRole("blockquote")).toContainText("Dis la date");
    await page.getByRole("button", { name: "Afficher le conseil au parent" }).click();
    const parentDate = page.getByText(/^Dites : « Aujourd’hui, nous sommes/);
    await expect(parentDate).toBeVisible();
    await expect(parentDate).toContainText("lundi 12 octobre 2026");
    await page.getByRole("button", { name: "Terminé", exact: true }).click();
    await expect(page.locator("#activite")).toBeFocused();
    await expect(page.getByRole("blockquote")).toBeInViewport();

    // New count-on remains a real-object handoff, with the correct supplied story sequence.
    await page.goto("/maternelle/3/seance/34");
    await page.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
    for (let i = 0; i < 2; i++)
      await page.getByRole("button", { name: "Terminé", exact: true }).click();
    await expect(page.getByText("1 / 4", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Page suivante", exact: true }).click();
    await page.getByRole("button", { name: "Montrer à l’enfant" }).click();
    const dialog = page.getByRole("dialog", { name: "Écran de l’enfant" });
    await expect(dialog.getByText("2 / 4", { exact: true })).toBeVisible();
    for (const img of await dialog.locator("img").all()) {
      await expect(img).toBeVisible();
      await expect(img).toHaveJSProperty("naturalWidth", 1200);
    }
    await page.screenshot({ path: info.outputPath("october-story.png") });
    await page.getByRole("button", { name: "Revenir au guide du parent" }).click();
    await page.getByRole("button", { name: "Terminé", exact: true }).click();
    await expect(page.locator("#activite")).toBeFocused();
    await expect(page.getByRole("blockquote")).toContainText("Il y en a quatre");
    await page.getByRole("button", { name: "Montrer à l’enfant" }).click();
    await expect(dialog.getByRole("button", { name: /Encore un|Recommencer/ })).toHaveCount(0);
    await page.screenshot({ path: info.outputPath("october-count-on.png") });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: "Revenir au guide du parent" }).click();
    await page.getByRole("button", { name: "Faire une petite pause" }).click();
    await page.reload();
    await page
      .getByRole("button", {
        name: "Reprendre où nous nous étions arrêtés (activité 4)",
        exact: true,
      })
      .click();
    await expect(page.locator("#activite")).toBeFocused();
    await expect(page.getByRole("blockquote")).toBeInViewport();

    // Technical-function evidence uses the accepted objects and remains ungraded observation.
    await page.goto("/maternelle/3/seance/41");
    await page.getByRole("button", { name: "Commencer la leçon", exact: true }).click();
    for (let i = 0; i < 6; i++)
      await page.getByRole("button", { name: "Terminé", exact: true }).click();
    await page.getByRole("button", { name: "Montrer à l’enfant" }).click();
    await expect(dialog.locator("img")).toHaveCount(2);
    for (const img of await dialog.locator("img").all()) {
      await expect(img).toBeVisible();
      await expect(img).toHaveJSProperty("naturalWidth", 200);
    }
    await page.screenshot({ path: info.outputPath("october-functions.png") });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  });
}
