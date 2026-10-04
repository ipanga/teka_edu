// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  readSessionPosition,
  readSessionProgress,
  sessionStorageKey,
  writeSessionValue,
} from "@/lib/programme/session-storage";

const identity = { schoolYearId: "2026-2027", levelId: "maternelle-3", instructionalDay: 1 };
beforeEach(() => localStorage.clear());

describe("session bookmark identity", () => {
  it("isolates progress, position and observations by year, class and day", () => {
    for (const field of ["progress", "position", "observation"] as const) {
      writeSessionValue(identity, field, field === "progress" ? "completed" : "3");
      for (const other of [
        { ...identity, levelId: "maternelle-1" },
        { ...identity, schoolYearId: "2027-2028" },
        { ...identity, instructionalDay: 2 },
      ])
        expect(localStorage.getItem(sessionStorageKey(other, field))).toBeNull();
    }
    expect(readSessionProgress(identity)).toBe("completed");
    expect(readSessionPosition(identity, 8)).toBe(3);
  });

  it("retains but ignores ambiguous legacy bookmarks and completion", () => {
    localStorage.setItem("teka-edu.session.1", "completed");
    localStorage.setItem("teka-edu.session.1.position", "5");
    localStorage.setItem("teka-edu.observation.1", "legacy report");
    expect(readSessionProgress(identity)).toBe("not_started");
    expect(readSessionPosition(identity, 8)).toBeNull();
    expect(localStorage.getItem("teka-edu.session.1")).toBe("completed");
    expect(localStorage.getItem("teka-edu.observation.1")).toBe("legacy report");
  });

  it.each(["", "-1", "6", "8", "99", "1.5", "NaN", "Infinity", "9007199254740992"])(
    "rejects invalid/out-of-range position %s",
    (value) => {
      writeSessionValue(identity, "position", value);
      expect(readSessionPosition(identity, 6)).toBeNull();
    },
  );

  it("does not use a position beyond a shorter activity list", () => {
    writeSessionValue(identity, "position", "7");
    expect(readSessionPosition(identity, 8)).toBe(7);
    expect(readSessionPosition(identity, 6)).toBeNull();
  });

  it("still works when browser storage is unavailable", () => {
    const read = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readSessionProgress(identity)).toBe("not_started");
    expect(readSessionPosition(identity, 8)).toBeNull();
    expect(writeSessionValue(identity, "progress", "in_progress")).toBe(false);
    read.mockRestore();
    write.mockRestore();
  });
});
