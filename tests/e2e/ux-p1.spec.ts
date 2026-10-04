import { expect, test, type Page } from "@playwright/test";
import { expectHonestOfferedSession } from "./helpers/offered-session";

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
const advance = (page: Page) =>
  page.getByRole("button", { name: "Activité terminée", exact: true }).click();
async function visibleInstruction(page: Page) {
  const heading = page.locator("#activite");
  await expect(heading).toBeFocused();
  await expect(heading).toBeInViewport();
  await expect(page.getByRole("blockquote")).toBeInViewport();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}

for (const device of devices) {
  test(`P1 parent journey / ${device.name}`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize(device);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("link", { name: /3ème maternelle/ }).click();
    await expectHonestOfferedSession(page);
    await page.getByRole("link", { name: "Septembre 2026", exact: true }).click();
    await page.getByRole("link", { name: /jeudi 3 septembre 2026/ }).click();
    await expect(page.getByRole("heading", { name: "À préparer" })).toBeVisible();
    await page.getByRole("button", { name: "Commencer la séance", exact: true }).click();
    await visibleInstruction(page);
    await advance(page);
    await visibleInstruction(page);
    await expect(page.getByText("1 / 4", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Page suivante", exact: true }).click();
    await page.getByRole("button", { name: "Montrer à l’enfant" }).click();
    const dialog = page.getByRole("dialog", { name: "Écran de l’enfant" });
    await expect(dialog.getByText("2 / 4", { exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath("story-handoff.png") });
    await page.getByRole("button", { name: "Revenir au guide du parent" }).click();
    await expect(page.getByText("2 / 4", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Mettre la séance en pause" }).click();
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await expect(page.getByText("2 / 4", { exact: true })).toBeVisible();
    for (let i = 0; i < 2; i++)
      await page.getByRole("button", { name: "Page suivante", exact: true }).click();
    await advance(page);
    await visibleInstruction(page);
    await expect(page.getByText("La pluie sur le toit", { exact: true })).toBeVisible();
    await expect(page.getByText("1 / 4", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Activité précédente", exact: true }).click();
    await expect(page.getByText("4 / 4", { exact: true })).toBeVisible();
    await advance(page);
    await expect(page.getByText("1 / 4", { exact: true })).toBeVisible();
    for (let i = 0; i < 5; i++) {
      await advance(page);
      await visibleInstruction(page);
    }
    await page.getByRole("button", { name: "Terminer la séance", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "C’est fini pour aujourd’hui !" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Retour aux leçons du mois" }).click();
    await expect(page.getByRole("link", { name: /jeudi 3 septembre 2026 Terminée/ })).toBeVisible();
    await page.goto("/maternelle/1/calendrier");
    await expect(page.getByRole("link", { name: /jeudi 3 septembre 2026/ })).not.toContainText(
      "Terminée",
    );
    await page.goto("/maternelle/1/seance/3");
    await expect(page.getByRole("button", { name: /Reprendre où/ })).toHaveCount(0);

    // Reproduce the audited phone scroll case and verify coherent game handoff/bookmark recovery.
    await page.goto("/maternelle/1/seance/2");
    await page.getByRole("button", { name: "Commencer la séance", exact: true }).click();
    await advance(page);
    await page.getByRole("button", { name: "Jouer : je montre le mot" }).click();
    await page.getByRole("button", { name: "Une table", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Bravo !");
    await page.getByRole("button", { name: "Montrer à l’enfant" }).click();
    await expect(page.getByRole("status")).toHaveText("Bravo !");
    await page.getByRole("button", { name: "Encore un autre" }).click();
    await page.getByRole("button", { name: "Une table", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Essaie encore");
    await page.getByRole("button", { name: "Revenir au guide du parent" }).click();
    await expect(page.getByText("Trouve l’image pour « la chaise ».")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Essaie encore");
    await page.getByRole("button", { name: "Mettre la séance en pause" }).click();
    await page.reload();
    await page
      .getByRole("button", {
        name: "Reprendre où nous nous étions arrêtés (activité 2)",
        exact: true,
      })
      .click();
    await visibleInstruction(page);
    await advance(page);
    await visibleInstruction(page);
    await expect(page.locator("#activite")).toHaveText("Un, deux, trois, mes mains");
    await page.screenshot({ path: info.outputPath("next-instruction.png") });
    await page.getByRole("button", { name: "Mettre la séance en pause" }).click();
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await expect(page.locator("#activite")).toHaveText("Un, deux, trois, mes mains");
    for (let i = 0; i < 3; i++) await advance(page);
    await page.getByRole("button", { name: "Terminer la séance", exact: true }).click();
    await page.getByRole("link", { name: "Retour aux leçons du mois" }).click();
    await expect(
      page.getByRole("link", { name: /mercredi 2 septembre 2026 Terminée/ }),
    ).toBeVisible();
    await page.getByRole("link", { name: "1ère maternelle", exact: true }).click();
    await expectHonestOfferedSession(page);
  });
}
