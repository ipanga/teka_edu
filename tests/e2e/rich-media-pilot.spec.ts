import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

const evidence = path.resolve(
  process.cwd(),
  "private/astra-visual-evidence/september-rich-media-pilot-screens",
);

const viewports = [
  { name: "phone-320", width: 320, height: 740 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "phone-430", width: 430, height: 932 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-macbook-1280", width: 1280, height: 900 },
  { name: "laptop-macbook-1440", width: 1440, height: 900 },
];

const cases = [
  {
    name: "comptine-bonjour",
    path: "/maternelle/1/seance/1",
    activity: "Bonjour, petit",
    expected: ["comptine-bonjour.webp"],
  },
  {
    name: "corps-tete",
    path: "/maternelle/1/seance/13",
    activity: "Les mots de mon corps",
    expected: ["corps-tete.webp"],
  },
  {
    name: "animal-chevre",
    path: "/maternelle/3/seance/5",
    activity: "Les parties de l’animal",
    expected: ["animal-chevre.webp"],
  },
  {
    name: "histoire-nsimba",
    path: "/maternelle/3/seance/1",
    activity: "Le temps de lecture",
    expected: [
      "histoire-nsimba-00.webp",
      "histoire-nsimba-01.webp",
      "histoire-nsimba-02.webp",
      "histoire-nsimba-03.webp",
      "histoire-nsimba-04.webp",
    ],
  },
  {
    name: "histoire-mangue",
    path: "/maternelle/3/seance/2",
    activity: "Le temps de lecture",
    expected: [
      "histoire-mangue-01.webp",
      "histoire-mangue-02.webp",
      "histoire-mangue-03.webp",
      "histoire-mangue-03.webp",
    ],
  },
] as const;

async function reachActivity(page: Page, item: (typeof cases)[number]) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto(item.path);
  await page.getByRole("button", { name: "Commencer la séance", exact: true }).click();
  for (let step = 0; step < 20; step++) {
    if ((await page.locator("h2#activite").textContent()) === item.activity) return;
    const resume = page.getByRole("button", { name: "Continuer", exact: true });
    if (await resume.isVisible()) {
      await resume.click();
    } else {
      await page
        .getByRole("button", { name: /^(Activité suivante|Activité terminée)$/ })
        .first()
        .click();
    }
  }
  throw new Error(`Activity not reached: ${item.path} / ${item.activity}`);
}

async function assertImageLoaded(page: Page, image: Locator, expectedFile: string) {
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("src", new RegExp(`${expectedFile}$`));

  const source = (await image.getAttribute("src"))!;
  const url = new URL(source, page.url()).href;
  const response = await page.evaluate(async (href) => {
    const result = await fetch(href, { cache: "no-store" });
    return {
      contentType: result.headers.get("content-type"),
      ok: result.ok,
      status: result.status,
    };
  }, url);
  expect(response, `HTTP response for ${expectedFile}`).toMatchObject({
    ok: true,
    status: 200,
  });
  expect(response.contentType ?? "", `content type for ${expectedFile}`).toContain("image/");

  await expect
    .poll(
      () =>
        image.evaluate(async (element: HTMLImageElement) => {
          if (!element.complete || element.naturalWidth === 0) return 0;
          await element.decode();
          return element.naturalWidth;
        }),
      { message: `${expectedFile} should load and decode`, timeout: 15_000 },
    )
    .toBeGreaterThan(0);

  return path.basename(new URL(source, "http://local").pathname);
}

for (const viewport of viewports) {
  test(`the controlled rich-media pilot works on ${viewport.name}`, async ({ page }) => {
    mkdirSync(evidence, { recursive: true });
    const metrics: Record<string, unknown>[] = [];

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const item of cases) {
      await test.step(`${viewport.name} / ${item.name}`, async () => {
        await reachActivity(page, item);
        await page.getByRole("button", { name: "Montrer à l’enfant", exact: true }).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        const actual: string[] = [];
        if (item.expected.length === 1) {
          const images = await dialog.getByRole("img").all();
          for (const image of images) {
            const source = new URL((await image.getAttribute("src"))!, "http://local").pathname;
            const basename = path.basename(source);
            actual.push(basename);
            if (basename === item.expected[0])
              await assertImageLoaded(page, image, item.expected[0]);
          }
          expect(actual).toContain(item.expected[0]);
        } else {
          for (let storyPage = 0; storyPage < item.expected.length; storyPage++) {
            const image = dialog.getByRole("img").first();
            const expectedFile = item.expected[storyPage];
            if (!expectedFile) throw new Error(`Missing expected story asset for ${item.name}`);
            actual.push(await assertImageLoaded(page, image, expectedFile));
            if (storyPage >= item.expected.length - 1) continue;
            await dialog.getByRole("button", { name: "Page suivante", exact: true }).click();
          }
          expect(actual).toEqual(item.expected);
        }

        const layout = await page.evaluate(() => {
          const modal = document.querySelector<HTMLElement>("dialog")!;
          const pictures = [...modal.querySelectorAll<HTMLImageElement>("img")];
          return {
            documentOverflow:
              document.documentElement.scrollWidth - document.documentElement.clientWidth,
            dialogOverflow: modal.scrollWidth - modal.clientWidth,
            dialogScrollHeight: modal.scrollHeight,
            pictures: pictures.map((picture) => {
              const box = picture.getBoundingClientRect();
              return {
                naturalWidth: picture.naturalWidth,
                naturalHeight: picture.naturalHeight,
                renderedWidth: Math.round(box.width),
                renderedHeight: Math.round(box.height),
                left: Math.round(box.left),
                right: Math.round(box.right),
              };
            }),
          };
        });
        expect(layout.documentOverflow).toBeLessThanOrEqual(1);
        expect(layout.dialogOverflow).toBeLessThanOrEqual(1);
        for (const picture of layout.pictures) {
          expect(picture.left).toBeGreaterThanOrEqual(0);
          expect(picture.right).toBeLessThanOrEqual(viewport.width);
        }

        metrics.push({ viewport, asset: item.name, pages: actual, ...layout });
        if (viewport.width === 390 || viewport.width === 1440) {
          await page.screenshot({
            path: path.join(evidence, `${viewport.name}-${item.name}.png`),
            fullPage: true,
          });
        }
      });
    }

    writeFileSync(
      path.join(evidence, `${viewport.name}-metrics.json`),
      `${JSON.stringify({ generatedOn: "2026-09-27", metrics }, null, 2)}\n`,
    );
  });
}
