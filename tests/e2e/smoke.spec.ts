import { expect, test } from "@playwright/test";

// Smoke tests: run in CI against the local build and after each deployment against the
// deployed URL (PLAYWRIGHT_BASE_URL). Keep them fast and free of test data.

test("health endpoint reports ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe("ok");

  // Deployment workflows pass what they deployed: verify the environment is configured as
  // intended (a missing NEXT_PUBLIC_APP_ENV would silently fall back to "local")...
  const expectedEnvironment = process.env.EXPECTED_APP_ENV;
  if (expectedEnvironment) {
    expect(body.environment).toBe(expectedEnvironment);
  }
  // ...that it is wired to this environment's Supabase project (never the other one)...
  const expectedSupabaseRef = process.env.EXPECTED_SUPABASE_PROJECT_REF;
  if (expectedSupabaseRef) {
    expect(body.supabaseProjectRef).toBe(expectedSupabaseRef);
  }
  // ...and that this exact commit is live (skipped if the build did not receive the SHA).
  const expectedCommit = process.env.EXPECTED_GIT_SHA;
  if (expectedCommit && body.commit !== null) {
    expect(body.commit).toBe(expectedCommit);
  }
});

test("home page is served in French", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("heading", { name: "Teka Edu" })).toBeVisible();
});
