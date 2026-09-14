// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";
import {
  authoredDays,
  levelAvailability,
  levelIdFromSlug,
  sessionForDay,
  slugFromLevelId,
} from "@/lib/programme/session-view";

describe("HomePage", () => {
  it("offers the three maternelle classes, in order", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Teka Edu" })).toBeInTheDocument();
    for (const name of ["1ère maternelle", "2ème maternelle", "3ème maternelle"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("links only the classes that have lessons, and says so for the others", () => {
    render(<HomePage />);
    expect(screen.getByRole("link", { name: /3ème maternelle/ })).toHaveAttribute(
      "href",
      "/maternelle/3",
    );
    expect(screen.getByRole("link", { name: /1ère maternelle/ })).toHaveAttribute(
      "href",
      "/maternelle/1",
    );
    // 2ème maternelle has no lessons written, so it is not a link and says why.
    expect(screen.queryByRole("link", { name: /2ème maternelle/ })).toBeNull();
    expect(screen.getAllByText(/en préparation/)).toHaveLength(1);
  });

  it("shows no curriculum apparatus on the front door", () => {
    const { container } = render(<HomePage />);
    expect(container.textContent).not.toMatch(/LANG-S\d{2}|MATH-S\d{2}|compétence/i);
  });
});

describe("levels", () => {
  it("maps slugs to level ids in both directions", () => {
    expect(levelIdFromSlug("3")).toBe("maternelle-3");
    expect(levelIdFromSlug("1")).toBe("maternelle-1");
    expect(levelIdFromSlug("7")).toBeUndefined();
    expect(slugFromLevelId("maternelle-2")).toBe("2");
    expect(slugFromLevelId("primaire-1")).toBeUndefined();
  });

  it("reports availability from the content, never from a hard-coded assumption", () => {
    const levels = levelAvailability();
    expect(levels.map((level) => level.slug)).toEqual(["1", "2", "3"]);
    // Writing September for 1ère maternelle turned its card on by itself: nothing was flipped.
    for (const slug of ["1", "3"]) {
      const level = levels.find((candidate) => candidate.slug === slug)!;
      expect(level.available, level.levelId).toBe(true);
      expect(level.authoredDays, level.levelId).toBe(22);
    }
    const second = levels.find((level) => level.slug === "2")!;
    expect(second.available).toBe(false);
    expect(second.authoredDays).toBe(0);
  });

  /**
   * Level isolation. A class must never serve another class's lessons: 1ère maternelle's
   * September and 3ème maternelle's September are different years of a child's life, and the
   * routing carries the level precisely so they cannot be confused.
   */
  it("keeps each class's lessons to that class", () => {
    for (const [slug, levelId] of [
      ["1", "maternelle-1"],
      ["3", "maternelle-3"],
    ] as const) {
      const days = authoredDays(levelId);
      expect(days.length, levelId).toBe(22);
      for (const day of days) {
        const session = sessionForDay(levelId, day);
        expect(session, `${levelId} day ${day}`).toBeDefined();
        expect(session!.levelId).toBe(levelId);
        for (const step of session!.steps) {
          for (const activity of step.activities) {
            expect(activity.id.startsWith(`m${slug}-`), `${activity.id} in ${levelId}`).toBe(true);
          }
        }
      }
    }
    expect(authoredDays("maternelle-2")).toEqual([]);
    expect(sessionForDay("maternelle-2", 1)).toBeUndefined();
  });
});
