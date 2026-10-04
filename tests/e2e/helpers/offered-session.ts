import { expect, type Page } from "@playwright/test";
import { calendarDateInTimeZone, formatFrenchDate } from "../../../domain/calendar/date";

/** Check the offered route's actual date, rather than accepting a potentially misleading title. */
export async function expectHonestOfferedSession(page: Page) {
  const href = await page.getByTestId("recommended-session").getAttribute("href");
  expect(href).toMatch(/\/maternelle\/[13]\/seance\/\d+$/);
  const session = await page.context().newPage();
  await session.goto(href!);
  const dateLabel = await session.getByRole("heading", { level: 1 }).innerText();
  await session.close();
  const today = formatFrenchDate(calendarDateInTimeZone(new Date(), "Africa/Lubumbashi"));
  if (dateLabel === today) {
    await expect(page.getByRole("heading", { name: "Leçon du jour", exact: true })).toBeVisible();
  } else {
    await expect(
      page.getByRole("heading", { name: `Séance du ${dateLabel}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Leçon du jour", exact: true })).toHaveCount(0);
  }
}
