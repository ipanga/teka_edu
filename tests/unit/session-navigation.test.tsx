// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseCalendarDate } from "@/domain/calendar/date";
import { sessionCatalogue } from "@/lib/programme/session-catalogue";
import { getReferenceData } from "@/lib/content/reference-data";
import {
  recommendedSession,
  selectedMonth,
  sessionStatus,
  type NavigationState,
} from "@/lib/programme/navigation";
import { ClassOverview } from "@/components/session/ClassOverview";
import { SessionRunner } from "@/components/session/SessionRunner";
import { sessionForDay } from "@/lib/programme/session-view";
import {
  readSessionProgress,
  sessionStorageKey,
  writeSessionValue,
} from "@/lib/programme/session-storage";

const months = sessionCatalogue("maternelle-3", "2026-2027");
const sessions = months.flatMap((month) => month.sessions);
const empty: NavigationState = { progress: "not_started", position: null, updatedAt: 0 };
beforeEach(() => {
  localStorage.clear();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe("data-driven public month catalogue", () => {
  it("derives both months and exact session dates/counts from the programme", () => {
    expect(months.map((month) => [month.key, month.sessions.length])).toEqual([
      ["2026-09", 22],
      ["2026-10", 22],
    ]);
    expect(months[1]!.sessions[0]!.date).toBe(parseCalendarDate("2026-10-01"));
    expect(months[1]!.sessions.at(-1)!.instructionalDay).toBe(44);
    expect(sessionCatalogue("maternelle-1", "2026-2027")).toHaveLength(1);
    expect(sessionCatalogue("maternelle-2", "2026-2027")).toEqual([]);
    expect(sessionCatalogue("maternelle-3", "2030-2031")).toEqual([]);
  });
  it("discovers a synthetic future month without a navigation edit", () => {
    const data = structuredClone(getReferenceData());
    data.programmes = data.programmes.map((programme) =>
      programme.levelId !== "maternelle-3"
        ? programme
        : {
            ...programme,
            tracks: programme.tracks.map((track) => ({
              ...track,
              lessonIds: Array.from(
                { length: 80 },
                (_, index) => track.lessonIds[index % track.lessonIds.length]!,
              ),
            })),
          },
    );
    const expanded = sessionCatalogue("maternelle-3", "2026-2027", data);
    expect(expanded.find((month) => month.key === "2026-11")!.sessions.length).toBeGreaterThan(0);
    expect(selectedMonth(expanded, parseCalendarDate("2026-11-02"))?.key).toBe("2026-11");
    expect(sessionCatalogue("maternelle-1", "2026-2027", data)).toHaveLength(1);
  });
  it("does not advertise incomplete or unapproved days", () => {
    const data = structuredClone(getReferenceData());
    const firstId = data.programmes.find((p) => p.levelId === "maternelle-3")!.tracks[0]!
      .lessonIds[0];
    data.lessons = data.lessons.map((lesson) =>
      lesson.id === firstId ? { ...lesson, status: "review", review: null } : lesson,
    );
    expect(
      sessionCatalogue("maternelle-3", "2026-2027", data)[0]!.sessions[0]!.instructionalDay,
    ).toBe(2);
  });
  it("selects explicit/current/nearest available months without a fixed latest month", () => {
    expect(selectedMonth(months, parseCalendarDate("2026-10-04"))?.key).toBe("2026-10");
    expect(selectedMonth(months, parseCalendarDate("2026-10-04"), "2026-09")?.key).toBe("2026-09");
    expect(selectedMonth(months, parseCalendarDate("2026-08-01"))?.key).toBe("2026-09");
    expect(selectedMonth(months, parseCalendarDate("2027-03-01"))?.key).toBe("2026-10");
    expect(selectedMonth([], parseCalendarDate("2026-10-04"))).toBeUndefined();
  });
});

describe("honest recommendation hierarchy", () => {
  it("prioritizes valid most recently visited bookmarks including activity zero", () => {
    const states = sessions.map(() => ({ ...empty }));
    states[0] = { progress: "in_progress", position: 0, updatedAt: 20 };
    states[23] = { progress: "in_progress", position: 1, updatedAt: 10 };
    expect(
      recommendedSession(sessions, states, parseCalendarDate("2026-10-02"))?.session
        .instructionalDay,
    ).toBe(1);
  });
  it("ignores invalid/completed bookmarks and skips completed suggestions", () => {
    const states = sessions.map(() => ({ ...empty }));
    states[0] = { progress: "in_progress", position: null, updatedAt: 20 };
    states[23] = { progress: "completed", position: 1, updatedAt: 30 };
    const choice = recommendedSession(sessions, states, parseCalendarDate("2026-10-02"));
    expect(choice?.kind).toBe("catch-up");
    expect(choice?.session.date).toBe(parseCalendarDate("2026-10-01"));
  });
  it.each([
    [parseCalendarDate("2026-10-02"), "today", parseCalendarDate("2026-10-02")],
    [parseCalendarDate("2026-10-04"), "catch-up", parseCalendarDate("2026-10-02")],
    [parseCalendarDate("2026-08-01"), "upcoming", parseCalendarDate("2026-09-01")],
    [parseCalendarDate("2026-11-02"), "catch-up", parseCalendarDate("2026-10-30")],
  ] as const)("is honest on %s", (today, kind, date) => {
    const choice = recommendedSession(
      sessions,
      sessions.map(() => empty),
      today,
    );
    expect(choice?.kind).toBe(kind);
    expect(choice?.session.date).toBe(date);
  });
  it("offers only browsing once every available session is completed", () => {
    expect(
      recommendedSession(
        sessions,
        sessions.map(() => ({ ...empty, progress: "completed" })),
        parseCalendarDate("2026-10-04"),
      ),
    ).toBeNull();
  });
  it("uses completion before dates when displaying lesson states", () => {
    expect(
      sessionStatus(
        sessions[0]!,
        { ...empty, progress: "completed" },
        parseCalendarDate("2026-09-01"),
      ),
    ).toBe("Terminée");
    expect(sessionStatus(sessions[0]!, empty, parseCalendarDate("2026-09-01"))).toBe("Aujourd’hui");
    expect(sessionStatus(sessions[0]!, empty, parseCalendarDate("2026-08-01"))).toBe("À venir");
  });
});

describe("browser-local navigation", () => {
  it("shows resume on the class page without leaking class or school year", () => {
    writeSessionValue(sessions[0]!, "progress", "in_progress");
    writeSessionValue(sessions[0]!, "position", "0");
    const view = render(
      <ClassOverview
        months={months}
        levelSlug="3"
        today={parseCalendarDate("2026-10-04")}
        reason={null}
      />,
    );
    expect(screen.getByTestId("recommended-session")).toHaveTextContent("Reprendre la séance");
    view.unmount();
    render(
      <ClassOverview
        months={sessionCatalogue("maternelle-1", "2026-2027")}
        levelSlug="1"
        today={parseCalendarDate("2026-10-04")}
        reason={null}
      />,
    );
    expect(screen.getByTestId("recommended-session")).toHaveTextContent("Voir la préparation");
    expect(
      localStorage.getItem(
        sessionStorageKey({ ...sessions[0]!, schoolYearId: "2027-2028" }, "progress"),
      ),
    ).toBeNull();
  });
  it("reacts to same-tab progress writes", () => {
    render(
      <ClassOverview
        months={months}
        levelSlug="3"
        today={parseCalendarDate("2026-10-04")}
        reason={null}
      />,
    );
    // Exercise the public store notification inside React's event boundary.
    render(
      <button
        onClick={() => {
          writeSessionValue(sessions[0]!, "progress", "in_progress");
          writeSessionValue(sessions[0]!, "position", "1");
        }}
      >
        Save bookmark
      </button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save bookmark" }));
    expect(screen.getByTestId("recommended-session")).toHaveTextContent("Reprendre la séance");
  });
  it("requires deliberate replay and never erases completion merely by opening preparation", () => {
    const session = sessionForDay("maternelle-3", 23)!;
    writeSessionValue(session, "progress", "completed");
    render(<SessionRunner session={session} levelSlug="3" />);
    expect(screen.getByRole("heading", { name: "Séance terminée" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Commencer la séance" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Rejouer la séance" }));
    expect(readSessionProgress(session)).toBe("completed");
    fireEvent.click(screen.getByRole("button", { name: "Commencer la séance" }));
    expect(readSessionProgress(session)).toBe("in_progress");
    expect(screen.getByText(/^Activité 1 sur/)).toBeInTheDocument();
  });
  it("resumes the first activity and degrades safely when storage is blocked", () => {
    const session = sessionForDay("maternelle-3", 23)!;
    writeSessionValue(session, "progress", "in_progress");
    writeSessionValue(session, "position", "0");
    const view = render(<SessionRunner session={session} levelSlug="3" />);
    expect(screen.getByRole("button", { name: /Reprendre où.*activité 1/ })).toBeInTheDocument();
    view.unmount();
    const blocked = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(
      <ClassOverview
        months={months}
        levelSlug="3"
        today={parseCalendarDate("2026-10-04")}
        reason={null}
      />,
    );
    expect(screen.getByTestId("recommended-session")).toHaveTextContent("Voir la préparation");
    blocked.mockRestore();
  });
});
