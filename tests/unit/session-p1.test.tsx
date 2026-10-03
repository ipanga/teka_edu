// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionRunner, ProgressBadge } from "@/components/session/SessionRunner";
import { ObservationForm } from "@/components/session/ObservationForm";
import { sessionForDay, type SessionActivity, type SessionDay } from "@/lib/programme/session-view";
import { sessionStorageKey, writeSessionValue } from "@/lib/programme/session-storage";

const scroll = vi.fn();
beforeEach(() => {
  localStorage.clear();
  scroll.mockClear();
  HTMLElement.prototype.scrollIntoView = scroll;
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
});
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const original = sessionForDay("maternelle-3", 3)!;
function story(id: string, pages: number): SessionActivity {
  return {
    ...original.steps[0]!.activities[1]!,
    id,
    text: {
      title: id,
      kind: "story",
      lines: Array.from({ length: pages * 3 }, (_, i) => `${id} line ${i + 1}`),
      illustration: null,
      audio: null,
    },
  };
}
function twoStories(pages: number, nextPages: number): SessionDay {
  return {
    ...original,
    steps: [
      { ...original.steps[0]!, activities: [story("story-a", pages), story("story-b", nextPages)] },
    ],
  };
}

describe("P1 story state and handoff", () => {
  it.each([
    [4, 4],
    [5, 2],
    [2, 5],
  ])(
    "isolates consecutive stories (%i then %i pages), including previous/re-entry",
    (pages, nextPages) => {
      render(<SessionRunner session={twoStories(pages, nextPages)} levelSlug="3" />);
      click("Commencer la leçon");
      for (let i = 1; i < pages; i++) click("Page suivante");
      expect(screen.getByText(`${pages} / ${pages}`)).toBeInTheDocument();
      click("Terminé");
      expect(screen.getByText(`1 / ${nextPages}`)).toBeInTheDocument();
      expect(screen.getByText("story-b line 1")).toBeInTheDocument();
      click("Page suivante");
      click("Précédent");
      expect(screen.getByText(`${pages} / ${pages}`)).toBeInTheDocument();
      click("Terminé");
      expect(screen.getByText(`2 / ${nextPages}`)).toBeInTheDocument();
    },
  );

  it("keeps page 2 through parent/child return and pause/resume", () => {
    render(<SessionRunner session={twoStories(4, 4)} levelSlug="3" />);
    click("Commencer la leçon");
    click("Page suivante");
    click("Montrer à l’enfant");
    expect(screen.getByText("2 / 4")).toBeInTheDocument();
    click("Revenir au guide du parent");
    expect(screen.getByText("2 / 4")).toBeInTheDocument();
    click("Faire une petite pause");
    click("Continuer");
    expect(screen.getByText("2 / 4")).toBeInTheDocument();
  });

  it("preserves game target and feedback across handoff and pause", () => {
    render(<SessionRunner session={sessionForDay("maternelle-1", 1)!} levelSlug="1" />);
    click("Commencer la leçon");
    click("Terminé");
    click("Jouer : je montre le mot");
    click("Une porte");
    expect(screen.getByRole("status")).toHaveTextContent("Bravo");
    click("Montrer à l’enfant");
    expect(screen.getByRole("status")).toHaveTextContent("Bravo");
    click("Encore un autre");
    click("Une porte");
    expect(screen.getByRole("status")).toHaveTextContent("Essaie encore");
    click("Revenir au guide du parent");
    expect(screen.getByText("Trouve l’image pour « le seau ».")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Essaie encore");
    click("Faire une petite pause");
    click("Continuer");
    expect(screen.getByRole("status")).toHaveTextContent("Essaie encore");
    click("Un seau");
    expect(screen.getByRole("status")).toHaveTextContent("Bravo");
  });

  it("preserves a selected matching/sorting item and its placement across handoff", () => {
    const activity: SessionActivity = {
      ...original.steps[0]!.activities[0]!,
      id: "sort-a",
      renderer: "group-and-match",
      type: "sorting",
      mode: "on-screen",
      payload: { categories: ["Ronds", "Autres"] },
      media: [{ id: "disc", url: "/media/disc.svg", alt: "Un disque", tags: ["disque"] }],
    };
    const session = { ...original, steps: [{ ...original.steps[0]!, activities: [activity] }] };
    render(<SessionRunner session={session} levelSlug="3" />);
    click("Commencer la leçon");
    click("Un disque");
    click("Montrer à l’enfant");
    expect(screen.getByRole("button", { name: "Un disque" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    click("Ronds");
    expect(screen.getByRole("status")).toHaveTextContent("Tout est rangé");
    click("Revenir au guide du parent");
    expect(screen.getByRole("status")).toHaveTextContent("Tout est rangé");
    expect(screen.getByRole("button", { name: /^Ronds/ })).toContainElement(
      screen.getByAltText("Un disque"),
    );
  });

  it("reveals/focuses a new instruction, but does not scroll within the activity", () => {
    render(<SessionRunner session={twoStories(4, 4)} levelSlug="3" />);
    click("Commencer la leçon");
    expect(document.activeElement).toBe(document.querySelector("#activite"));
    expect(scroll).toHaveBeenLastCalledWith({ block: "start", behavior: "instant" });
    scroll.mockClear();
    click("Page suivante");
    expect(scroll).not.toHaveBeenCalled();
    click("Terminé");
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(document.querySelector("#activite"));
  });
});

describe("P1 isolated completion and observations", () => {
  it("completion in 3ème never marks 1ère complete", () => {
    const third = sessionForDay("maternelle-3", 1)!;
    const first = sessionForDay("maternelle-1", 1)!;
    const view = render(<SessionRunner session={twoStories(4, 4)} levelSlug="3" />);
    click("Commencer la leçon");
    click("Terminé");
    click("Terminer la séance");
    view.unmount();
    // Fixture was session 3; keep real calendar identity for this assertion.
    render(
      <>
        <ProgressBadge identity={original} />
        <ProgressBadge identity={{ ...original, levelId: first.levelId }} />
      </>,
    );
    expect(screen.getAllByText("terminée")).toHaveLength(1);
    expect(
      localStorage.getItem(sessionStorageKey({ ...original, levelId: third.levelId }, "progress")),
    ).toBe("completed");
  });

  it("ignores another class/year bookmark and an invalid current position", () => {
    const first = sessionForDay("maternelle-1", 1)!;
    writeSessionValue({ ...first, levelId: "maternelle-3" }, "position", "4");
    writeSessionValue({ ...first, schoolYearId: "2027-2028" }, "position", "4");
    writeSessionValue(first, "position", "99");
    render(<SessionRunner session={first} levelSlug="1" />);
    expect(screen.queryByRole("button", { name: /Reprendre où/ })).not.toBeInTheDocument();
    click("Commencer la leçon");
    expect(screen.getByText("Activité 1 sur 6")).toBeInTheDocument();
  });

  it("stores a session observation only under its full identity", () => {
    render(
      <ObservationForm identity={original} dateLabel={original.dateLabel} plannedMinutes={35} />,
    );
    click("Enregistrer dans ce navigateur");
    expect(localStorage.getItem(sessionStorageKey(original, "observation"))).toContain(
      "Séance testée",
    );
    expect(
      localStorage.getItem(
        sessionStorageKey({ ...original, levelId: "maternelle-1" }, "observation"),
      ),
    ).toBeNull();
    expect(localStorage.getItem("teka-edu.observation.3")).toBeNull();
  });
});
