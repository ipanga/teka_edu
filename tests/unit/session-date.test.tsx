// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LevelHomePage from "@/app/maternelle/[niveau]/page";
import { todaysSession, authoredDays, sessionForDay } from "@/lib/programme/session-view";

afterEach(() => vi.useRealTimers());
describe("honest offered session dates", () => {
  const latest = sessionForDay("maternelle-3", authoredDays("maternelle-3").at(-1)!)!.date;
  it.each([
    ["2026-09-01", true, "2026-09-01"],
    ["2026-10-12", true, "2026-10-12"],
    ["2026-09-05", false, "2026-09-04"],
    ["2026-08-31", false, "2026-09-01"],
    ["2026-11-01", false, latest],
  ])("offers the truthful date on %s", async (date, current, offered) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${date}T10:00:00Z`));
    const view = todaysSession("maternelle-3");
    expect(view.today).toBe(date);
    expect(view.isCurrentSession).toBe(current);
    expect(view.session?.date).toBe(offered);
    render(
      await LevelHomePage({
        params: Promise.resolve({ niveau: "3" }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(screen.queryByRole("heading", { name: "Aujourd’hui" }) !== null).toBe(current);
    expect(screen.queryByRole("heading", { name: "Leçon du jour" }) !== null).toBe(current);
    if (!current) {
      expect(
        screen.getByRole("heading", { name: `Séance du ${view.session!.dateLabel}` }),
      ).toBeInTheDocument();
      expect(view.reason).toBeTruthy();
    }
  });
});
