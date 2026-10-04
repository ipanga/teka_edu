/** Browser-local convenience state, never child records or a database dependency. */
export type SessionIdentity = {
  schoolYearId: string;
  levelId: string;
  instructionalDay: number;
};
export type SessionProgress = "not_started" | "in_progress" | "completed";

export function sessionStorageKey(
  identity: SessionIdentity,
  field: "progress" | "position" | "observation" | "updatedAt",
) {
  return `teka-edu.session.v2.${encodeURIComponent(identity.schoolYearId)}.${encodeURIComponent(identity.levelId)}.${identity.instructionalDay}.${field}`;
}

// Legacy day-only keys cannot be attributed to a class/year safely. Leave them untouched and
// ignore them rather than importing another class's completion, report or bookmark.
export function readSessionProgress(identity: SessionIdentity): SessionProgress {
  try {
    const value = window.localStorage.getItem(sessionStorageKey(identity, "progress"));
    return value === "in_progress" || value === "completed" ? value : "not_started";
  } catch {
    return "not_started";
  }
}

export function readSessionPosition(
  identity: SessionIdentity,
  activityCount: number,
): number | null {
  try {
    const raw = window.localStorage.getItem(sessionStorageKey(identity, "position"));
    if (raw === null || !/^\d+$/.test(raw)) return null;
    const position = Number(raw);
    return Number.isSafeInteger(position) && position >= 0 && position < activityCount
      ? position
      : null;
  } catch {
    return null;
  }
}

export function writeSessionValue(
  identity: SessionIdentity,
  field: "progress" | "position" | "observation" | "updatedAt",
  value: string,
): boolean {
  try {
    window.localStorage.setItem(sessionStorageKey(identity, field), value);
    if (field === "position" && /^\d+$/.test(value)) {
      window.localStorage.setItem(sessionStorageKey(identity, "updatedAt"), String(Date.now()));
    }
    window.dispatchEvent(new Event("teka-session-change"));
    return true;
  } catch {
    return false;
  }
}

export function subscribeToSessionStorage(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener("teka-session-change", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("teka-session-change", onChange);
    window.removeEventListener("focus", onChange);
  };
}

export function readSessionUpdatedAt(identity: SessionIdentity): number {
  try {
    const value = Number(window.localStorage.getItem(sessionStorageKey(identity, "updatedAt")));
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}
