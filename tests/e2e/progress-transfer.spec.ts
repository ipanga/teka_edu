import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const prefix = "teka-edu.session.v2.2026-2027.maternelle-3.";
const fixture = {
  format: "teka-edu-local-progress",
  version: 1,
  entries: [
    { key: `${prefix}1.progress`, value: "completed" },
    { key: `${prefix}2.progress`, value: "in_progress" },
    { key: `${prefix}2.position`, value: "0" },
    {
      key: `${prefix}2.observation`,
      value: "<script>window.injected = true</script>\nObservation locale",
    },
  ],
};
const upload = (value: unknown) => ({
  name: "fixture.json",
  mimeType: "application/json",
  buffer: Buffer.from(JSON.stringify(value)),
});

for (const viewport of [
  { name: "phone", width: 320, height: 740 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop-MacBook", width: 1440, height: 900 },
]) {
  test(`offline local export/import preserves completion and resumes activity one / ${viewport.name}`, async ({
    page,
    context,
  }, info) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByRole("link", { name: "Transférer ma progression", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Transférer ma progression" })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    await page.evaluate((entries) => {
      for (const entry of entries) localStorage.setItem(entry.key, entry.value);
      localStorage.setItem("unrelated.fixture", "stay local");
      localStorage.setItem("teka-edu.session.v1.1.progress", "completed");
    }, fixture.entries);
    // Export and import are File/Blob/localStorage operations after the page is loaded.
    await context.setOffline(true);
    const downloaded = page.waitForEvent("download");
    await page.getByRole("button", { name: "Télécharger ma progression" }).click();
    const exported = await downloaded;
    expect(exported.suggestedFilename()).toBe("teka-edu-progression.json");
    const exportPath = await exported.path();
    expect(exportPath).not.toBeNull();
    const content = JSON.parse(await readFile(exportPath!, "utf8"));
    expect(content).toEqual(fixture);
    await page.evaluate((prefix) => {
      for (const field of ["progress", "position", "observation", "updatedAt"]) {
        localStorage.removeItem(`${prefix}1.${field}`);
        localStorage.removeItem(`${prefix}2.${field}`);
      }
    }, prefix);
    await page.getByLabel("Choisir un fichier de progression JSON").setInputFiles(upload(content));
    await expect(page.getByRole("status")).toContainText("Fichier validé");
    const backupDownloaded = page.waitForEvent("download");
    await page.getByRole("button", { name: "Sauvegarder et importer" }).click();
    const backup = await backupDownloaded;
    expect(backup.suggestedFilename()).toBe("teka-edu-avant-import.json");
    expect(JSON.parse(await readFile((await backup.path())!, "utf8")).entries).toEqual([]);
    await expect(page.getByRole("status")).toContainText("2 séances ajoutées");
    await page.screenshot({ path: info.outputPath("progress-transfer.png"), fullPage: true });
    expect(
      await page.evaluate(
        (prefix) => ({
          completed: localStorage.getItem(`${prefix}1.progress`),
          timestamp: localStorage.getItem(`${prefix}2.updatedAt`),
          unrelated: localStorage.getItem("unrelated.fixture"),
          injected: Object.hasOwn(window, "injected"),
        }),
        prefix,
      ),
    ).toEqual({
      completed: "completed",
      timestamp: null,
      unrelated: "stay local",
      injected: false,
    });
    await context.setOffline(false);
    await page.goto("/maternelle/3/seance/1");
    await expect(page.getByRole("heading", { name: "Séance terminée", exact: true })).toBeVisible();
    await page.goto("/maternelle/3/seance/2");
    await page.getByRole("button", { name: /Reprendre où.*activité 1/ }).click();
    await expect(page.getByText(/^Activité 1 sur/)).toBeVisible();
  });
}

test("conflicts and repeat imports preserve each existing session whole", async ({ page }) => {
  await page.goto("/progression");
  await page.evaluate((prefix) => localStorage.setItem(`${prefix}1.position`, "1"), prefix);
  await page.getByLabel("Choisir un fichier de progression JSON").setInputFiles(upload(fixture));
  for (const expected of ["1 séances ajoutées", "0 séances ajoutées"]) {
    const backup = page.waitForEvent("download");
    await page.getByRole("button", { name: "Sauvegarder et importer" }).click();
    await backup;
    await expect(page.getByRole("status")).toContainText(expected);
  }
  expect(
    await page.evaluate(
      (prefix) => [
        localStorage.getItem(`${prefix}1.progress`),
        localStorage.getItem(`${prefix}1.position`),
      ],
      prefix,
    ),
  ).toEqual([null, "1"]);
});

test("invalid and oversized files never enable import", async ({ page }) => {
  await page.goto("/progression");
  await page
    .getByLabel("Choisir un fichier de progression JSON")
    .setInputFiles(upload({ ...fixture, unknown: true }));
  await expect(page.getByRole("status")).toContainText("compatible et valide");
  await expect(page.getByRole("button", { name: "Sauvegarder et importer" })).toBeDisabled();
  await page.getByLabel("Choisir un fichier de progression JSON").setInputFiles({
    name: "big.json",
    mimeType: "application/json",
    buffer: Buffer.alloc(1_048_577, " "),
  });
  await expect(page.getByRole("status")).toContainText("limite de 1 Mo");
  await expect(page.getByRole("button", { name: "Sauvegarder et importer" })).toBeDisabled();
});

test("blocked browser storage reports failure without crashing", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  await page.goto("/progression");
  await page.getByRole("button", { name: "Télécharger ma progression" }).click();
  await expect(page.getByRole("status")).toContainText(
    "stockage de ce navigateur est indisponible",
  );
  await page.getByLabel("Choisir un fichier de progression JSON").setInputFiles(upload(fixture));
  await expect(page.getByRole("status")).toContainText("Fichier validé");
  await page.getByRole("button", { name: "Sauvegarder et importer" }).click();
  await expect(page.getByRole("status")).toContainText("L’import n’a pas commencé");
});

test("quota failure rolls back imported values and preserves existing sessions", async ({
  page,
}) => {
  await page.addInitScript((prefix) => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === `${prefix}2.position`) throw new DOMException("quota", "QuotaExceededError");
      originalSetItem.call(this, key, value);
    };
  }, prefix);
  await page.goto("/progression");
  await page.evaluate((prefix) => localStorage.setItem(`${prefix}3.progress`, "completed"), prefix);
  await page.getByLabel("Choisir un fichier de progression JSON").setInputFiles(upload(fixture));
  await expect(page.getByRole("status")).toContainText("Fichier validé");
  const backup = page.waitForEvent("download");
  await page.getByRole("button", { name: "Sauvegarder et importer" }).click();
  await backup;
  await expect(page.getByRole("status")).toContainText("Les valeurs ajoutées ont été retirées");
  expect(
    await page.evaluate(
      (prefix) => [
        localStorage.getItem(`${prefix}1.progress`),
        localStorage.getItem(`${prefix}2.progress`),
        localStorage.getItem(`${prefix}3.progress`),
      ],
      prefix,
    ),
  ).toEqual([null, null, "completed"]);
});

test("owner-console export on local old-v2 fixture leaves source data unchanged", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate((entries) => {
    for (const entry of entries) localStorage.setItem(entry.key, entry.value);
    localStorage.setItem("unrelated.fixture", "keep");
  }, fixture.entries);
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  const code = await readFile(
    new URL("../../docs/progress-export-console.js", import.meta.url),
    "utf8",
  );
  const download = page.waitForEvent("download");
  const result = await page.evaluate(code);
  expect(result).toEqual({ downloadStarted: true, exportedValues: 4, excludedInvalidValues: 0 });
  const file = await download;
  expect(JSON.parse(await readFile((await file.path())!, "utf8"))).toEqual(fixture);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
});

test("JSON file crosses isolated synthetic origins without changing the source or overwriting destination progress", async ({
  page,
  context,
}) => {
  // The reserved .test origin is fulfilled locally; no old production page or data is accessed.
  const source = await context.newPage();
  await source.route("http://teka-progress-source.test/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Source fixture</title>",
    }),
  );
  await source.goto("http://teka-progress-source.test/");
  await source.evaluate((entries) => {
    for (const entry of entries) localStorage.setItem(entry.key, entry.value);
    localStorage.setItem("unrelated.fixture", "source only");
  }, fixture.entries);
  const sourceBefore = await source.evaluate(() => JSON.stringify(localStorage));
  await page.goto("/progression");
  expect(new URL(source.url()).origin).not.toBe(new URL(page.url()).origin);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.evaluate((prefix) => {
    localStorage.setItem(`${prefix}1.position`, "1");
    localStorage.setItem("unrelated.fixture", "destination only");
  }, prefix);

  await context.setOffline(true);
  const downloaded = source.waitForEvent("download");
  await source.evaluate(
    await readFile(new URL("../../docs/progress-export-console.js", import.meta.url), "utf8"),
  );
  const exported = await downloaded;
  await page
    .getByLabel("Choisir un fichier de progression JSON")
    .setInputFiles((await exported.path())!);
  await expect(page.getByRole("status")).toContainText("Fichier validé");
  const backupDownloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Sauvegarder et importer" }).click();
  const backup = await backupDownloaded;
  expect(JSON.parse(await readFile((await backup.path())!, "utf8")).entries).toEqual([
    { key: `${prefix}1.position`, value: "1" },
  ]);
  await expect(page.getByRole("status")).toContainText("1 séances ajoutées");
  expect(
    await page.evaluate(
      (prefix) => [
        localStorage.getItem(`${prefix}1.progress`),
        localStorage.getItem(`${prefix}1.position`),
        localStorage.getItem(`${prefix}2.progress`),
        localStorage.getItem(`${prefix}2.position`),
        localStorage.getItem("unrelated.fixture"),
      ],
      prefix,
    ),
  ).toEqual([null, "1", "in_progress", "0", "destination only"]);
  expect(await source.evaluate(() => JSON.stringify(localStorage))).toBe(sourceBefore);
});

for (const viewport of [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
]) {
  test(`owner bookmarklet runs local read-only exporter / ${viewport.name}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate((entries) => {
      for (const entry of entries) localStorage.setItem(entry.key, entry.value);
    }, fixture.entries);
    const before = await page.evaluate(() => JSON.stringify(localStorage));
    const bookmarklet = (
      await readFile(new URL("../../docs/progress-export-bookmarklet.txt", import.meta.url), "utf8")
    ).trim();
    const form = await readFile(
      new URL("../../docs/progress-export-bookmarklet.html", import.meta.url),
      "utf8",
    );
    // Render the standalone form on this synthetic local origin, where the test fixture lives.
    await page.setContent(form);
    await expect(page.getByLabel("Adresse complète du signet")).toHaveValue(bookmarklet);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    await page.screenshot({ path: info.outputPath("progress-bookmarklet.png"), fullPage: true });
    const download = page.waitForEvent("download");
    // Clicking a javascript URL exercises its browser decoding and execution on the local origin.
    await page.getByRole("link", { name: "Export Teka", exact: true }).click();
    const file = await download;
    expect(JSON.parse(await readFile((await file.path())!, "utf8"))).toEqual(fixture);
    expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
  });
}
