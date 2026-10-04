import { expect, test, type Page } from "@playwright/test";

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
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}
for (const device of devices) {
  test(`fresh parent month / resume / completion journey / ${device.name}`, async ({
    page,
  }, info) => {
    test.setTimeout(120_000);
    await page.setViewportSize(device);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const classLink = page.getByRole("link", { name: /3ème maternelle/ });
    await expect(classLink).toBeInViewport();
    await noOverflow(page);
    await page.screenshot({ path: info.outputPath("home.png") });
    await classLink.click();
    await expect(page.getByRole("heading", { name: "3ème maternelle", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Septembre 2026", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Octobre 2026", exact: true })).toBeVisible();
    await expect(page.getByTestId("recommended-session")).toHaveText("Voir la préparation");
    await page.screenshot({ path: info.outputPath("class.png") });
    await page.getByRole("link", { name: "Octobre 2026", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Octobre 2026", exact: true })).toBeVisible();
    const list = page.getByRole("list", { name: "Séances du mois" });
    await expect(list.getByRole("link")).toHaveCount(22);
    await expect(
      page
        .getByRole("navigation", { name: "Mois disponibles" })
        .getByRole("link", { name: "Octobre 2026" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(list.getByRole("link").first()).toContainText("jeudi 1er octobre 2026");
    await expect(list.getByRole("link").last()).toContainText("vendredi 30 octobre 2026");
    await noOverflow(page);
    await page.screenshot({ path: info.outputPath("october-lessons.png") });
    await page.getByRole("link", { name: "Septembre 2026", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Septembre 2026", exact: true })).toBeVisible();
    await expect(list.getByRole("link")).toHaveCount(22);
    await expect(list.getByRole("link").first()).toContainText("mardi 1er septembre 2026");
    await page.getByRole("link", { name: "Octobre 2026", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Octobre 2026", exact: true })).toBeVisible();
    await expect(list.getByRole("link").first()).toContainText("jeudi 1er octobre 2026");
    await list.getByRole("link").first().click();
    await expect(page.getByRole("heading", { name: "À préparer" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Au programme" })).toBeVisible();
    await expect(page.getByText(/les petits objets se portent à la bouche/i)).toBeVisible();
    await page.screenshot({ path: info.outputPath("preparation.png"), fullPage: true });
    await page.getByRole("button", { name: "Commencer la séance", exact: true }).click();
    await expect(page.locator("#activite")).toBeFocused();
    // A pause/reload on the very first activity is a valid bookmark, not a forced restart.
    await page.getByRole("button", { name: "Mettre la séance en pause" }).click();
    await expect(page.locator("#pause")).toBeFocused();
    await page.reload();
    await page.getByRole("button", { name: /Reprendre où.*activité 1/ }).click();
    await page.getByRole("button", { name: "Activité terminée", exact: true }).click();
    const heading = await page.locator("#activite").innerText();
    await page.getByRole("button", { name: "Montrer à l’enfant" }).click();
    const dialog = page.getByRole("dialog", { name: "Écran de l’enfant" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: /Accueil|Octobre/ })).toHaveCount(0);
    for (const img of await dialog.locator("img").all()) {
      await expect
        .poll(() =>
          img.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
        )
        .toBe(true);
      await expect(img).toHaveAttribute("alt", /.+/);
    }
    await page.screenshot({ path: info.outputPath("child-mode.png") });
    await page.getByRole("button", { name: "Revenir au guide du parent" }).click();
    await expect(page.locator("#activite")).toHaveText(heading);
    await page.getByRole("button", { name: "Mettre la séance en pause" }).click();
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await expect(page.locator("#activite")).toHaveText(heading);
    await page
      .getByRole("navigation", { name: "Fil d’Ariane" })
      .getByRole("link", { name: "Octobre 2026" })
      .click();
    await expect(list.getByRole("link").first()).toContainText("En cours");
    await page.getByRole("link", { name: "3ème maternelle", exact: true }).click();
    await expect(page.getByTestId("recommended-session")).toHaveText("Reprendre la séance");
    await expect(page.getByTestId("recommended-session")).toHaveAttribute(
      "href",
      "/maternelle/3/seance/23",
    );
    await page.getByTestId("recommended-session").click();
    await page.getByRole("button", { name: /Reprendre où.*activité 2/ }).click();
    const activityCount = Number(
      (await page.getByText(/^Activité 2 sur /).innerText()).match(/sur\s+(\d+)/i)![1],
    );
    for (let index = 1; index < activityCount; index++)
      await page
        .getByRole("button", { name: /^(Activité suivante|Activité terminée|Terminer la séance)$/ })
        .click();
    await expect(page.locator("#fin")).toBeFocused();
    await page.screenshot({ path: info.outputPath("completion.png") });
    await page.getByRole("link", { name: "Retour aux leçons du mois" }).click();
    await expect(page).toHaveURL(/lecons\?mois=2026-10$/);
    await expect(list.getByRole("link").first()).toContainText("Terminée");
    await list.getByRole("link").first().click();
    await expect(page.getByRole("heading", { name: "Séance terminée", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Commencer la séance" })).toHaveCount(0);
    await page.getByRole("button", { name: "Rejouer la séance" }).click();
    await expect(page.getByRole("button", { name: "Commencer la séance" })).toBeVisible();
    // Merely opening replay preparation must not erase the completed state.
    await page
      .getByRole("navigation", { name: "Fil d’Ariane" })
      .getByRole("link", { name: "Octobre 2026" })
      .click();
    await expect(list.getByRole("link").first()).toContainText("Terminée");
    await page.getByRole("link", { name: "Accueil", exact: true }).click();
    await page.getByRole("link", { name: /1ère maternelle/ }).click();
    await expect(page.getByRole("link", { name: "Octobre 2026", exact: true })).toHaveCount(0);
    await expect(page.getByTestId("recommended-session")).toHaveText("Voir la préparation");
    await page.getByRole("link", { name: "Septembre 2026", exact: true }).click();
    await expect(list.getByRole("link")).toHaveCount(22);
    await expect(list.getByRole("link").first()).not.toContainText("Terminée");
    await noOverflow(page);
  });
}

test("unavailable months/classes are not invented and keyboard month links work", async ({
  page,
}) => {
  for (const path of [
    "/maternelle/3/lecons?mois=2026-11",
    "/maternelle/1/lecons?mois=2026-10",
    "/maternelle/2/lecons",
    "/maternelle/3/lecons?mois=bad",
    "/maternelle/3/lecons?mois=2026-10&mois=2026-09",
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  }
  await page.goto("/maternelle/3/lecons?mois=2026-09");
  const october = page
    .getByRole("navigation", { name: "Mois disponibles" })
    .getByRole("link", { name: "Octobre 2026" });
  await october.focus();
  await expect(october).toBeFocused();
  await october.press("Enter");
  await expect(page.getByRole("heading", { name: "Octobre 2026" })).toBeVisible();
});
