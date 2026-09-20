import { expect, test, type APIResponse, type Browser } from "@playwright/test";

/**
 * The public release check: Teka Edu as an ordinary person meets it.
 *
 * Every other suite runs against a Vercel deployment that is *protected*, and reaches it with
 * `VERCEL_AUTOMATION_BYPASS_SECRET` in `extraHTTPHeaders`. That is the right way to smoke-test
 * staging, and it is exactly why it cannot answer the question that matters on release day: a
 * protected production deployment would pass every one of those tests and still show a stranger
 * the Vercel login page.
 *
 * So this file throws all of that away. It opens its own browser context with no bypass header,
 * no protection cookie, no stored state and no credential of any kind, and it checks the things
 * a parent in Kinshasa would notice: the door opens, the two written classes are there, the
 * third says honestly that it is not ready, a session starts, the pictures arrive, and nothing
 * on the page mentions a development environment.
 *
 * It is **not** part of the deployment smoke test, because it can only pass once production is
 * both deployed and public. Point it at the production URL to run it:
 *
 *   PRODUCTION_PUBLIC_URL=https://teka-edu-teka10.vercel.app npm run test:e2e -- production-public
 *
 * Without that variable every test here skips, so it never turns the staging pipeline red for
 * being honest about a deployment that does not exist yet.
 */
const PRODUCTION_URL = process.env.PRODUCTION_PUBLIC_URL;

/** The Supabase project ref production must be wired to, when the runner is told which it is. */
const EXPECTED_PROD_REF = process.env.EXPECTED_PRODUCTION_SUPABASE_REF;

test.describe("Teka Edu in production, seen by someone with no account", () => {
  test.skip(
    PRODUCTION_URL === undefined || PRODUCTION_URL === "",
    "Set PRODUCTION_PUBLIC_URL to run the public release check.",
  );

  /**
   * A context with nothing in it. `storageState: undefined` and an explicit empty header map
   * override anything playwright.config.ts added for the protected deployments — if a future
   * change adds another credential there, this still opens the door empty-handed.
   */
  const anonymous = async (browser: Browser) =>
    browser.newContext({
      baseURL: PRODUCTION_URL,
      extraHTTPHeaders: {},
      storageState: undefined,
      bypassCSP: false,
    });

  const url = (path: string) => new URL(path, PRODUCTION_URL).toString();

  test("the front door opens without a login", async ({ browser }) => {
    const context = await anonymous(browser);
    const page = await context.newPage();
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });

    expect(response?.status(), "the home page must answer 200 to a stranger").toBe(200);
    // Vercel's protection answers with a redirect to its own login. Landing anywhere on
    // vercel.com is the failure this whole file exists to catch.
    expect(page.url(), "an anonymous visitor was sent to a login page").not.toMatch(
      /vercel\.com|\/sso|login/i,
    );
    await expect(page.getByRole("heading", { name: "Teka Edu" })).toBeVisible();
    await context.close();
  });

  test("shows the two written classes, and is honest about the third", async ({ browser }) => {
    const context = await anonymous(browser);
    const page = await context.newPage();
    await page.goto("/");

    await expect(page.getByRole("link", { name: /1ère maternelle/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /3ème maternelle/ })).toBeVisible();
    // 2ème maternelle has no lessons. It must say so rather than open onto someone else's.
    await expect(page.getByText("2ème maternelle", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /2ème maternelle/ })).toHaveCount(0);
    await expect(page.getByText("Les leçons de cette classe sont en préparation.")).toHaveCount(1);
    await context.close();
  });

  for (const [label, path, forbidden] of [
    ["1ère", "/maternelle/1", /Kumu|Nsimba|Bibi/],
    ["3ème", "/maternelle/3", /^$/],
  ] as const) {
    test(`a September session opens for ${label} maternelle`, async ({ browser }) => {
      const context = await anonymous(browser);
      const page = await context.newPage();
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });

      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { name: "Aujourd’hui" })).toBeVisible();
      if (label === "1ère") {
        // Its own month, never 3ème's characters.
        const body = (await page.locator("body").textContent()) ?? "";
        expect(body).not.toMatch(forbidden);
      }
      await context.close();
    });
  }

  test("the child's screen opens and shows the pictures the lesson promises", async ({
    browser,
  }) => {
    const context = await anonymous(browser);
    const page = await context.newPage();
    await page.goto("/maternelle/3/seance/3");

    // The pictures live inside the session, not on its cover: a parent presses start first.
    await page.getByRole("button", { name: "Commencer la leçon" }).click();
    await page
      .getByRole("button", { name: /Suivant|Terminé/ })
      .first()
      .click();

    // Day 3 reads Kumu, and the story carries its own illustration — the exact dependency that
    // made « Montre-moi Lisa » impossible once, so it is worth checking from the public side.
    await expect(page.getByText("Kumu, le petit poussin")).toBeVisible();
    await expect(page.getByRole("img", { name: /poussin/i }).first()).toBeVisible();

    // A broken asset still renders, at zero width. An approved illustration does not.
    const broken = await page.evaluate(
      () =>
        [...document.querySelectorAll("img")].filter((i) => i.complete && i.naturalWidth === 0)
          .length,
    );
    expect(broken, "an illustration failed to load").toBe(0);
    await context.close();
  });

  test("says nothing about a development environment anywhere a parent can see", async ({
    browser,
  }) => {
    const context = await anonymous(browser);
    const page = await context.newPage();
    for (const path of ["/", "/maternelle/1", "/maternelle/3"]) {
      await page.goto(path);
      const body = (await page.locator("body").textContent()) ?? "";
      expect(body, `${path} mentions a non-production environment`).not.toMatch(
        /\bstaging\b|\bpreview\b|\bdevelopment\b|teka-edu-dev|quyhkkiz/i,
      );
    }
    await context.close();
  });

  test("reports production, on the production database", async ({ browser }) => {
    const context = await anonymous(browser);
    const response: APIResponse = await context.request.get(url("/api/health"));

    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      status?: string;
      environment?: string;
      supabaseProjectRef?: string | null;
    };
    expect(body.status).toBe("ok");
    expect(body.environment, "production is serving a non-production configuration").toBe(
      "production",
    );
    // Never the development project, whatever else it is.
    expect(body.supabaseProjectRef ?? "").not.toBe("quyhkkizsmosybavoewd");
    if (EXPECTED_PROD_REF !== undefined && EXPECTED_PROD_REF !== "") {
      expect(body.supabaseProjectRef).toBe(EXPECTED_PROD_REF);
    }
    await context.close();
  });

  test("fits a phone without sideways scrolling", async ({ browser }) => {
    const context = await anonymous(browser);
    const page = await context.newPage();
    await page.setViewportSize({ width: 360, height: 740 });
    for (const path of ["/", "/maternelle/3", "/maternelle/3/seance/1"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} scrolls sideways on a 360px screen`).toBeLessThanOrEqual(1);
    }
    await context.close();
  });
});
