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

test("school calendar ships with the release and answers date questions", async ({ request }) => {
  const firstDay = await (await request.get("/api/calendar/2026-09-01")).json();
  expect(firstDay).toMatchObject({
    schoolYear: { id: "2026-2027" },
    instructional: true,
    instructionalDay: 1,
  });

  const saturday = await (await request.get("/api/calendar/2026-09-05")).json();
  expect(saturday).toMatchObject({ instructional: false, reasons: [{ code: "weekend" }] });

  const holiday = await (await request.get("/api/calendar/2027-04-06")).json();
  expect(holiday.instructional).toBe(false);
  expect(holiday.reasons[0].code).toBe("public-holiday");

  expect((await request.get("/api/calendar/not-a-date")).status()).toBe(400);
});

test("daily programme ships with the release and is deterministic", async ({ request }) => {
  const first = await (await request.get("/api/programme/2026-2027/maternelle-3/1")).json();
  expect(first).toMatchObject({
    level: { id: "maternelle-3" },
    curriculum: { id: "maternelle-cycle1-cd-2026" },
    instructionalDay: 1,
    status: "complete",
  });
  expect(first.sessions.map((s: { domainCode: string }) => s.domainCode)).toEqual([
    "LANG",
    "MATH",
    "PHYS",
    "WORLD",
  ]);
  expect(first.sessions[0].lesson.objectives[0].origin).toBe("official");

  // The same request always returns the same plan.
  const again = await (await request.get("/api/programme/2026-2027/maternelle-3/1")).json();
  expect(again).toEqual(first);

  // A holiday has no programme, and says why.
  const holiday = await (
    await request.get("/api/programme/2026-2027/maternelle-3/2027-05-17")
  ).json();
  expect(holiday.status).toBe("not-instructional");
  expect(holiday.sessions).toEqual([]);
});

test("home page is served in French", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("heading", { name: "Teka Edu" })).toBeVisible();
});
