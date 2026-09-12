// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("tells the parent, in French, what today's session is and how long it takes", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Aujourd’hui" })).toBeInTheDocument();
    // Either today's lesson, or the most recent one when today is not a school day.
    expect(screen.getByRole("link", { name: /Commencer la leçon/ })).toBeInTheDocument();
    expect(screen.getByText(/environ \d+ minutes/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /séances de septembre/ })).toBeInTheDocument();
  });

  it("shows no curriculum apparatus on the parent's screen", () => {
    const { container } = render(<HomePage />);
    // Objective codes, competencies and success examples belong to the review documents.
    expect(container.textContent).not.toMatch(/LANG-S\d{2}|MATH-S\d{2}|compétence/i);
  });
});
