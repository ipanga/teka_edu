"use client";

import { useSyncExternalStore } from "react";
import type { ListedSession, NavigationState } from "@/lib/programme/navigation";
import {
  readSessionPosition,
  readSessionProgress,
  readSessionUpdatedAt,
  subscribeToSessionStorage,
} from "@/lib/programme/session-storage";

export function useSessionNavigation(sessions: readonly ListedSession[]): NavigationState[] {
  const empty = JSON.stringify(
    sessions.map(() => ({ progress: "not_started", position: null, updatedAt: 0 })),
  );
  const snapshot = useSyncExternalStore(
    subscribeToSessionStorage,
    () =>
      JSON.stringify(
        sessions.map((session) => ({
          progress: readSessionProgress(session),
          position: readSessionPosition(session, session.activityCount),
          updatedAt: readSessionUpdatedAt(session),
        })),
      ),
    () => empty,
  );
  return JSON.parse(snapshot) as NavigationState[];
}
