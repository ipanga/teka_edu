import type { CalendarDate } from "@/domain/calendar/date";
import type { SessionIdentity, SessionProgress } from "./session-storage";

export type ListedSession = SessionIdentity & {
  date: CalendarDate;
  dateLabel: string;
  titles: string[];
  totalMinutes: number;
  activityCount: number;
};
export type SessionMonth = { key: string; label: string; sessions: ListedSession[] };
export type NavigationState = {
  progress: SessionProgress;
  position: number | null;
  updatedAt: number;
};

export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const label = new Intl.DateTimeFormat("fr", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year!, month! - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function selectedMonth(
  months: readonly SessionMonth[],
  today: CalendarDate,
  requested?: string,
) {
  return (
    months.find((month) => month.key === requested) ??
    months.find((month) => month.key === today.slice(0, 7)) ??
    months.filter((month) => month.key < today.slice(0, 7)).at(-1) ??
    months[0]
  );
}

export function sessionStatus(session: ListedSession, state: NavigationState, today: CalendarDate) {
  if (state.progress === "completed") return "Terminée";
  if (state.progress === "in_progress") return "En cours";
  if (session.date === today) return "Aujourd’hui";
  return session.date < today ? "À rattraper" : "À venir";
}

/** A valid bookmark wins; otherwise offer today, the latest unfinished past day, or the first future day. */
export function recommendedSession(
  sessions: readonly ListedSession[],
  states: readonly NavigationState[],
  today: CalendarDate,
) {
  const resumable = sessions
    .map((session, index) => ({ session, state: states[index]! }))
    .filter(({ state }) => state.progress === "in_progress" && state.position !== null)
    .sort(
      (a, b) =>
        b.state.updatedAt - a.state.updatedAt || b.session.date.localeCompare(a.session.date),
    )[0];
  if (resumable) return { session: resumable.session, kind: "resume" as const };
  const unfinished = sessions.filter((_, index) => states[index]?.progress !== "completed");
  const current = unfinished.find((session) => session.date === today);
  if (current) return { session: current, kind: "today" as const };
  const previous = unfinished.filter((session) => session.date < today).at(-1);
  if (previous) return { session: previous, kind: "catch-up" as const };
  const upcoming = unfinished.find((session) => session.date > today);
  return upcoming ? { session: upcoming, kind: "upcoming" as const } : null;
}
