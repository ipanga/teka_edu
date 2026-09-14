// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";
import { levelAvailability, levelIdFromSlug, slugFromLevelId } from "@/lib/programme/session-view";

describe("HomePage", () => {
  it("offers the three maternelle classes, in order", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Teka Edu" })).toBeInTheDocument();
    for (const name of ["1ère maternelle", "2ème maternelle", "3ème maternelle"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("links only the class that has lessons, and says so for the others", () => {
    render(<HomePage />);
    expect(screen.getByRole("link", { name: /3ème maternelle/ })).toHaveAttribute(
      "href",
      "/maternelle/3",
    );
    expect(screen.queryByRole("link", { name: /1ère maternelle/ })).toBeNull();
    expect(screen.getAllByText(/en préparation/)).toHaveLength(2);
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
    const third = levels.find((level) => level.slug === "3")!;
    expect(third.available).toBe(true);
    expect(third.authoredDays).toBe(22);
    for (const level of levels.filter((candidate) => candidate.slug !== "3")) {
      expect(level.available, level.levelId).toBe(false);
      expect(level.authoredDays, level.levelId).toBe(0);
    }
  });
});
