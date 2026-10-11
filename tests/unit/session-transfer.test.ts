import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { format } from "prettier";
import { describe, expect, it, vi } from "vitest";
import { transferSessions } from "@/lib/programme/session-catalogue";
import { sessionStorageKey } from "@/lib/programme/session-storage";
import {
  localProgressBookmarkletPage,
  localProgressExportBookmarklet,
  localProgressExportConsole,
} from "@/lib/programme/session-transfer-console";
import {
  exportSessionTransfer,
  importSessionTransfer,
  parseSessionTransfer,
  validateSessionTransfer,
  MAX_OBSERVATION_BYTES,
  MAX_TRANSFER_BYTES,
  MAX_TRANSFER_ENTRIES,
  TRANSFER_FIELDS,
  TRANSFER_FORMAT,
  TRANSFER_VERSION,
  type SessionTransfer,
} from "@/lib/programme/session-transfer";

const catalogue = transferSessions();
const session = catalogue.find(
  (entry) => entry.levelId === "maternelle-3" && entry.instructionalDay === 1,
)!;
const second = catalogue.find(
  (entry) => entry.levelId === "maternelle-3" && entry.instructionalDay === 2,
)!;
const key = (field: (typeof TRANSFER_FIELDS)[number]) => sessionStorageKey(session, field);
const envelope = (entries = [{ key: key("progress"), value: "completed" }]): SessionTransfer => ({
  format: TRANSFER_FORMAT,
  version: TRANSFER_VERSION,
  entries,
});
function store(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
  };
}

describe("strict local progress envelope", () => {
  it("uses all and only approved authored calendar sessions and their activity bounds", () => {
    expect(catalogue).toHaveLength(66);
    expect(catalogue.filter((item) => item.levelId === "maternelle-1")).toHaveLength(22);
    expect(catalogue.filter((item) => item.levelId === "maternelle-3")).toHaveLength(44);
    expect(
      catalogue.every((item) => item.schoolYearId === "2026-2027" && item.activityCount > 0),
    ).toBe(true);
  });
  it("accepts completion, a zero bookmark, plain-text observations and a timestamp", () => {
    const transfer = envelope([
      { key: key("progress"), value: "in_progress" },
      { key: key("position"), value: "0" },
      { key: key("observation"), value: "<script>plain text</script>\nL’enfant a participé." },
      { key: key("updatedAt"), value: "1791712000000" },
    ]);
    expect(parseSessionTransfer(JSON.stringify(transfer), catalogue)).toEqual({
      ok: true,
      transfer,
    });
  });
  it.each([
    "{",
    "null",
    "[]",
    "{}",
    JSON.stringify({ ...envelope(), version: 2 }),
    JSON.stringify({ ...envelope(), format: "unknown" }),
    JSON.stringify({ ...envelope(), exportedAt: "today" }),
    JSON.stringify({ ...envelope(), entries: [{ ...envelope().entries[0], identity: "extra" }] }),
    JSON.stringify({ ...envelope(), entries: [{ key: key("progress"), value: 3 }] }),
  ])("rejects malformed and unknown format/fields: %s", (text) => {
    expect(parseSessionTransfer(text, catalogue).ok).toBe(false);
  });
  it.each([
    ["progress", "finished"],
    ["progress", ""],
    ["position", "-1"],
    ["position", "1.5"],
    ["position", "01"],
    ["position", "1e1"],
    ["position", String(session.activityCount)],
    ["position", "9007199254740992"],
    ["updatedAt", "0"],
    ["updatedAt", "-1"],
    ["updatedAt", "1.5"],
    ["updatedAt", "01"],
    ["updatedAt", "8640000000000001"],
  ] as const)("rejects invalid %s value %s", (field, value) => {
    expect(validateSessionTransfer(envelope([{ key: key(field), value }]), catalogue).ok).toBe(
      false,
    );
  });
  it.each([
    "teka-edu.session.v1.1.progress",
    "teka-edu.session.v2.2026-2027.maternelle-2.1.progress",
    "teka-edu.session.v2.2026-2027.maternelle-1.23.progress",
    "teka-edu.session.v2.2026-2027.maternelle-3.45.progress",
    "teka-edu.session.v2.2027-2028.maternelle-3.1.progress",
    "teka-edu.session.v2.2026-2027.maternelle-3.01.progress",
    "teka-edu.session.v2.2026-2027.maternelle-3.1.name",
    "teka-edu.session.v2.%GG.maternelle-3.1.progress",
    "teka-edu.session.v2.2026%2D2027.maternelle-3.1.progress",
    "other.secret",
  ])("rejects unknown, legacy and noncanonical key %s", (key) => {
    expect(validateSessionTransfer(envelope([{ key, value: "completed" }]), catalogue).ok).toBe(
      false,
    );
  });
  it("rejects duplicate entries even when their values agree", () => {
    const entry = { key: key("progress"), value: "completed" };
    expect(validateSessionTransfer(envelope([entry, entry]), catalogue)).toEqual({
      ok: false,
      error: "duplicate",
    });
  });
  it("bounds UTF-8 observation bytes, entry count and whole file bytes", () => {
    expect(
      validateSessionTransfer(
        envelope([{ key: key("observation"), value: "é".repeat(MAX_OBSERVATION_BYTES / 2) }]),
        catalogue,
      ).ok,
    ).toBe(true);
    expect(
      validateSessionTransfer(
        envelope([{ key: key("observation"), value: "é".repeat(MAX_OBSERVATION_BYTES / 2 + 1) }]),
        catalogue,
      ).ok,
    ).toBe(false);
    expect(
      validateSessionTransfer(
        envelope(Array.from({ length: MAX_TRANSFER_ENTRIES + 1 }, () => envelope().entries[0]!)),
        catalogue,
      ),
    ).toEqual({ ok: false, error: "size" });
    expect(parseSessionTransfer(" ".repeat(MAX_TRANSFER_BYTES + 1), catalogue)).toEqual({
      ok: false,
      error: "size",
    });
    expect(parseSessionTransfer("é".repeat(MAX_TRANSFER_BYTES / 2 + 1), catalogue)).toEqual({
      ok: false,
      error: "size",
    });
  });
});

describe("allowlisted export and preservation", () => {
  it("reads only relevant v2 keys, excludes invalid values and never invents a timestamp", () => {
    const storage = store({
      [key("progress")]: "completed",
      [key("position")]: "999",
      [key("observation")]: "Notes",
      "other.secret": "irrelevant",
      "teka-edu.session.v1.1.progress": "completed",
      "teka-edu.session.v2.2027-2028.maternelle-3.1.progress": "completed",
    });
    const exported = exportSessionTransfer(storage, catalogue);
    expect(exported).toEqual({
      ok: true,
      transfer: envelope([
        { key: key("progress"), value: "completed" },
        { key: key("observation"), value: "Notes" },
      ]),
      excludedEntries: 1,
    });
    expect(
      storage.getItem.mock.calls.every(([key]) => key.startsWith("teka-edu.session.v2.2026-2027.")),
    ).toBe(true);
    expect(storage.values.has(key("updatedAt"))).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it("makes a local backup before writing completion and resume states", () => {
    const storage = store();
    const incoming = envelope([
      { key: key("progress"), value: "completed" },
      { key: sessionStorageKey(second, "progress"), value: "in_progress" },
      { key: sessionStorageKey(second, "position"), value: "0" },
    ]);
    const backup = vi.fn((value: SessionTransfer) => {
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(value.entries).toEqual([]);
      return true;
    });
    expect(importSessionTransfer(incoming, catalogue, storage, backup)).toEqual({
      status: "imported",
      importedEntries: 3,
      importedSessions: 2,
      skippedSessions: 0,
    });
    expect(backup).toHaveBeenCalledOnce();
    expect(storage.values.get(key("progress"))).toBe("completed");
    expect(storage.values.get(sessionStorageKey(second, "position"))).toBe("0");
    expect(storage.values.has(key("updatedAt"))).toBe(false);
    expect(storage.values.has(sessionStorageKey(second, "updatedAt"))).toBe(false);
  });
  it.each(TRANSFER_FIELDS)(
    "preserves an entire identity with existing %s, including invalid destination data",
    (field) => {
      const storage = store({ [key(field)]: "existing local value" });
      expect(
        importSessionTransfer(
          envelope([
            { key: key("progress"), value: "completed" },
            { key: key("position"), value: "0" },
          ]),
          catalogue,
          storage,
          () => true,
        ),
      ).toEqual({
        status: "imported",
        importedEntries: 0,
        importedSessions: 0,
        skippedSessions: 1,
      });
      expect([...storage.values]).toEqual([[key(field), "existing local value"]]);
      expect(storage.setItem).not.toHaveBeenCalled();
    },
  );
  it("is idempotent and keeps unrelated data on repeated imports", () => {
    const storage = store({ "other.secret": "untouched" });
    expect(importSessionTransfer(envelope(), catalogue, storage, () => true).status).toBe(
      "imported",
    );
    expect(importSessionTransfer(envelope(), catalogue, storage, () => true)).toEqual({
      status: "imported",
      importedEntries: 0,
      importedSessions: 0,
      skippedSessions: 1,
    });
    expect(storage.values.get("other.secret")).toBe("untouched");
    expect(storage.setItem).toHaveBeenCalledOnce();
  });
  it("does not import invalid files or when backup download fails", () => {
    const storage = store();
    const backup = vi.fn(() => false);
    expect(
      importSessionTransfer({ ...envelope(), extra: true }, catalogue, storage, backup).status,
    ).toBe("invalid");
    expect(backup).not.toHaveBeenCalled();
    expect(importSessionTransfer(envelope(), catalogue, storage, backup).status).toBe(
      "backup_failed",
    );
    expect(
      importSessionTransfer(envelope(), catalogue, storage, () => {
        throw new Error("blocked");
      }).status,
    ).toBe("backup_failed");
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it("keeps a destination change made during backup instead of overwriting it", () => {
    const storage = store();
    const result = importSessionTransfer(envelope(), catalogue, storage, () => {
      storage.values.set(key("position"), "1");
      return true;
    });
    expect(result).toEqual({
      status: "imported",
      importedEntries: 0,
      importedSessions: 0,
      skippedSessions: 1,
    });
    expect(storage.values.get(key("position"))).toBe("1");
    expect(storage.values.has(key("progress"))).toBe(false);
  });
});

describe("unavailable storage and owned-write rollback", () => {
  const incoming = envelope([
    { key: key("progress"), value: "completed" },
    { key: key("position"), value: "0" },
  ]);
  it("fails closed when private/blocked storage cannot be read", () => {
    const storage = store();
    storage.getItem.mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(exportSessionTransfer(storage, catalogue)).toEqual({ ok: false, error: "storage" });
    const backup = vi.fn(() => true);
    expect(importSessionTransfer(incoming, catalogue, storage, backup).status).toBe(
      "storage_unavailable",
    );
    expect(backup).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it("removes only the import's own new keys after quota failure", () => {
    const storage = store({
      "other.secret": "untouched",
      [sessionStorageKey(second, "progress")]: "in_progress",
    });
    storage.setItem.mockImplementation((key, value) => {
      if (key.endsWith(".position")) throw new Error("quota");
      storage.values.set(key, value);
    });
    expect(importSessionTransfer(incoming, catalogue, storage, () => true).status).toBe(
      "rolled_back",
    );
    expect([...storage.values]).toEqual([
      ["other.secret", "untouched"],
      [sessionStorageKey(second, "progress"), "in_progress"],
    ]);
    expect(storage.removeItem).toHaveBeenCalledWith(key("progress"));
  });
  it("preserves a later concurrent change while rolling back", () => {
    const storage = store();
    storage.setItem.mockImplementation((entryKey, value) => {
      if (entryKey.endsWith(".position")) {
        storage.values.set(key("progress"), "in_progress");
        throw new Error("quota");
      }
      storage.values.set(entryKey, value);
    });
    expect(importSessionTransfer(incoming, catalogue, storage, () => true).status).toBe(
      "rolled_back",
    );
    expect(storage.values.get(key("progress"))).toBe("in_progress");
    expect(storage.removeItem).not.toHaveBeenCalled();
  });
  it("reports incomplete rollback when the browser refuses cleanup", () => {
    const storage = store();
    storage.setItem.mockImplementation((entryKey, value) => {
      if (entryKey.endsWith(".position")) throw new Error("quota");
      storage.values.set(entryKey, value);
    });
    storage.removeItem.mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(importSessionTransfer(incoming, catalogue, storage, () => true).status).toBe(
      "rollback_failed",
    );
    expect(storage.values.has(key("progress"))).toBe(true);
  });
  it("refuses import when a valid destination backup would exceed the file limit", () => {
    const storage = store(
      Object.fromEntries(
        catalogue.map((session) => [
          sessionStorageKey(session, "observation"),
          "x".repeat(MAX_OBSERVATION_BYTES),
        ]),
      ),
    );
    const backup = vi.fn(() => true);
    expect(importSessionTransfer(incoming, catalogue, storage, backup).status).toBe(
      "backup_failed",
    );
    expect(backup).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});

describe("owner-run old-origin console procedure", () => {
  it("keeps the committed console utility exactly in sync with the authored catalogue", async () => {
    expect(
      readFileSync(new URL("../../docs/progress-export-console.js", import.meta.url), "utf8"),
    ).toBe(
      await format(localProgressExportConsole(catalogue), { parser: "babel", printWidth: 100 }),
    );
  });
  it("stores precisely the same exporter in the generated bookmarklet address and form", async () => {
    const bookmarklet = localProgressExportBookmarklet(catalogue);
    expect(decodeURIComponent(bookmarklet.slice("javascript:".length))).toBe(
      localProgressExportConsole(catalogue),
    );
    expect(
      readFileSync(new URL("../../docs/progress-export-bookmarklet.txt", import.meta.url), "utf8"),
    ).toBe(`${bookmarklet}\n`);
    expect(
      readFileSync(new URL("../../docs/progress-export-bookmarklet.html", import.meta.url), "utf8"),
    ).toBe(
      await format(localProgressBookmarkletPage(catalogue), { parser: "html", printWidth: 100 }),
    );
  });
  it("downloads the same valid envelope from old v2 keys without any source write or fabricated timestamp", () => {
    const storage = store({
      [key("progress")]: "completed",
      [key("position")]: "0",
      [key("observation")]: "Local text",
      [sessionStorageKey(second, "position")]: "999",
      "other.secret": "untouched",
      "teka-edu.session.v1.1.progress": "completed",
    });
    let downloaded = "";
    const link = { click: vi.fn(), remove: vi.fn() };
    const result = runInNewContext(localProgressExportConsole(catalogue), {
      localStorage: storage,
      TextEncoder,
      Blob: class {
        constructor(parts: string[]) {
          downloaded = parts.join("");
        }
      },
      URL: { createObjectURL: vi.fn(() => "blob:fixture"), revokeObjectURL: vi.fn() },
      document: { createElement: vi.fn(() => link), body: { append: vi.fn() } },
      setTimeout: vi.fn(),
    });
    expect(result).toEqual({ downloadStarted: true, exportedValues: 3, excludedInvalidValues: 1 });
    expect(parseSessionTransfer(downloaded, catalogue)).toEqual({
      ok: true,
      transfer: envelope([
        { key: key("progress"), value: "completed" },
        { key: key("position"), value: "0" },
        { key: key("observation"), value: "Local text" },
      ]),
    });
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(link.click).toHaveBeenCalledOnce();
    expect(storage.values.has(key("updatedAt"))).toBe(false);
  });
});
