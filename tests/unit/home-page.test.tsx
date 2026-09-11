// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("greets the child in French", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Teka Edu" })).toBeInTheDocument();
    expect(screen.getByText(/ta leçon du jour/)).toBeInTheDocument();
  });
});
