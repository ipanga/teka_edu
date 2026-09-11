import { defineConfig, devices } from "@playwright/test";

/**
 * E2E / smoke tests.
 * - Default: a build must already exist (`npm run build`); Playwright starts the standalone
 *   server with `npm run start`.
 * - PLAYWRIGHT_BASE_URL set: tests run against that deployed URL (staging/production smoke),
 *   optionally through Vercel Deployment Protection via VERCEL_AUTOMATION_BYPASS_SECRET.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL;
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: baseURL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    extraHTTPHeaders: bypassSecret ? { "x-vercel-protection-bypass": bypassSecret } : undefined,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: baseURL
    ? undefined
    : {
        command: "npm run start",
        env: { HOSTNAME: "127.0.0.1", PORT: "3000" },
        url: "http://127.0.0.1:3000/api/health",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
