import { sessionStorageKey, type SessionIdentity } from "./session-storage";

/** Local file format; contains no general storage dump, origin, account or child identifier. */
export const TRANSFER_FORMAT = "teka-edu-local-progress";
export const TRANSFER_VERSION = 1;
export const MAX_TRANSFER_BYTES = 1_048_576;
export const MAX_TRANSFER_ENTRIES = 1_024;
export const MAX_OBSERVATION_BYTES = 16_384;
export const TRANSFER_FIELDS = ["progress", "position", "observation", "updatedAt"] as const;
type TransferField = (typeof TRANSFER_FIELDS)[number];
export type TransferSession = SessionIdentity & { activityCount: number };
export type TransferEntry = { key: string; value: string };
export type SessionTransfer = {
  format: typeof TRANSFER_FORMAT;
  version: typeof TRANSFER_VERSION;
  entries: TransferEntry[];
};
type LocalStorageAccess = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Validation =
  | { ok: true; transfer: SessionTransfer }
  | { ok: false; error: "size" | "format" | "entry" | "duplicate" };

const bytes = (value: string) => new TextEncoder().encode(value).byteLength;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const hasOnly = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const identityKey = (identity: SessionIdentity) => sessionStorageKey(identity, "progress");

function sessionIndex(sessions: readonly TransferSession[]) {
  return new Map(sessions.map((session) => [identityKey(session), session]));
}

function identifyEntry(key: string, sessions: Map<string, TransferSession>) {
  const match =
    /^teka-edu\.session\.v2\.([^.]+)\.([^.]+)\.([1-9]\d*)\.(progress|position|observation|updatedAt)$/.exec(
      key,
    );
  if (!match) return null;
  try {
    const identity = {
      schoolYearId: decodeURIComponent(match[1]!),
      levelId: decodeURIComponent(match[2]!),
      instructionalDay: Number(match[3]),
    };
    const field = match[4] as TransferField;
    const session = sessions.get(identityKey(identity));
    // Reject malformed percent escapes, aliases and identities absent from authored calendars.
    return session && key === sessionStorageKey(session, field) ? { session, field } : null;
  } catch {
    return null;
  }
}

function validValue(field: TransferField, value: string, activityCount: number) {
  switch (field) {
    case "progress":
      return ["not_started", "in_progress", "completed"].includes(value);
    case "position": {
      const position = Number(value);
      return (
        /^(0|[1-9]\d*)$/.test(value) && Number.isSafeInteger(position) && position < activityCount
      );
    }
    case "observation":
      return bytes(value) <= MAX_OBSERVATION_BYTES;
    case "updatedAt": {
      const timestamp = Number(value);
      return (
        /^[1-9]\d*$/.test(value) &&
        Number.isSafeInteger(timestamp) &&
        timestamp <= 8_640_000_000_000_000
      );
    }
  }
}

export function validateSessionTransfer(
  value: unknown,
  sessions: readonly TransferSession[],
): Validation {
  if (
    !isRecord(value) ||
    !hasOnly(value, ["format", "version", "entries"]) ||
    value.format !== TRANSFER_FORMAT ||
    value.version !== TRANSFER_VERSION ||
    !Array.isArray(value.entries)
  )
    return { ok: false, error: "format" };
  if (value.entries.length > MAX_TRANSFER_ENTRIES) return { ok: false, error: "size" };
  const index = sessionIndex(sessions);
  const seen = new Set<string>();
  const entries: TransferEntry[] = [];
  for (const entry of value.entries) {
    if (
      !isRecord(entry) ||
      !hasOnly(entry, ["key", "value"]) ||
      typeof entry.key !== "string" ||
      typeof entry.value !== "string"
    ) {
      return { ok: false, error: "entry" };
    }
    const identity = identifyEntry(entry.key, index);
    if (!identity || !validValue(identity.field, entry.value, identity.session.activityCount))
      return { ok: false, error: "entry" };
    if (seen.has(entry.key)) return { ok: false, error: "duplicate" };
    seen.add(entry.key);
    entries.push({ key: entry.key, value: entry.value });
  }
  const transfer: SessionTransfer = { format: TRANSFER_FORMAT, version: TRANSFER_VERSION, entries };
  return bytes(JSON.stringify(transfer)) > MAX_TRANSFER_BYTES
    ? { ok: false, error: "size" }
    : { ok: true, transfer };
}

export function parseSessionTransfer(
  text: string,
  sessions: readonly TransferSession[],
): Validation {
  if (text.length > MAX_TRANSFER_BYTES || bytes(text) > MAX_TRANSFER_BYTES)
    return { ok: false, error: "size" };
  try {
    return validateSessionTransfer(JSON.parse(text) as unknown, sessions);
  } catch {
    return { ok: false, error: "format" };
  }
}

export function exportSessionTransfer(
  storage: Pick<Storage, "getItem">,
  sessions: readonly TransferSession[],
) {
  const entries: TransferEntry[] = [];
  let excludedEntries = 0;
  try {
    // Look up known keys only. Never enumerate storage or copy unrelated/legacy keys.
    for (const session of sessions)
      for (const field of TRANSFER_FIELDS) {
        const key = sessionStorageKey(session, field);
        const value = storage.getItem(key);
        if (value === null) continue;
        if (validValue(field, value, session.activityCount)) entries.push({ key, value });
        else excludedEntries++;
      }
    const result = validateSessionTransfer(
      { format: TRANSFER_FORMAT, version: TRANSFER_VERSION, entries },
      sessions,
    );
    return result.ok
      ? { ok: true as const, transfer: result.transfer, excludedEntries }
      : { ok: false as const, error: result.error };
  } catch {
    return { ok: false as const, error: "storage" as const };
  }
}

export type ImportResult =
  | {
      status: "imported";
      importedEntries: number;
      importedSessions: number;
      skippedSessions: number;
    }
  | {
      status:
        "invalid" | "storage_unavailable" | "backup_failed" | "rolled_back" | "rollback_failed";
    };

/** Backup must be downloaded before any writes. Existing identities are always preserved whole. */
export function importSessionTransfer(
  value: unknown,
  sessions: readonly TransferSession[],
  storage: LocalStorageAccess,
  downloadBackup: (backup: SessionTransfer) => boolean,
): ImportResult {
  const validated = validateSessionTransfer(value, sessions);
  if (!validated.ok) return { status: "invalid" };
  const backup = exportSessionTransfer(storage, sessions);
  if (!backup.ok)
    return { status: backup.error === "storage" ? "storage_unavailable" : "backup_failed" };
  try {
    if (!downloadBackup(backup.transfer)) return { status: "backup_failed" };
  } catch {
    return { status: "backup_failed" };
  }
  const index = sessionIndex(sessions);
  const groups = new Map<string, { session: TransferSession; entries: TransferEntry[] }>();
  for (const entry of validated.transfer.entries) {
    const session = identifyEntry(entry.key, index)!.session;
    const id = identityKey(session);
    const group = groups.get(id) ?? { session, entries: [] };
    group.entries.push(entry);
    groups.set(id, group);
  }
  const written: TransferEntry[] = [];
  let importedSessions = 0;
  let skippedSessions = 0;
  try {
    for (const { session, entries } of groups.values()) {
      if (
        TRANSFER_FIELDS.some((field) => storage.getItem(sessionStorageKey(session, field)) !== null)
      ) {
        skippedSessions++;
        continue;
      }
      for (const entry of entries) {
        // Catch a changed key before writing. localStorage has no cross-tab transaction.
        if (storage.getItem(entry.key) !== null) throw new Error("destination changed");
        storage.setItem(entry.key, entry.value);
        written.push(entry);
      }
      importedSessions++;
    }
    return {
      status: "imported",
      importedEntries: written.length,
      importedSessions,
      skippedSessions,
    };
  } catch {
    let rollbackFailed = false;
    for (const entry of written.reverse()) {
      try {
        // Remove only values this import wrote; preserve any later change from another tab.
        if (storage.getItem(entry.key) === entry.value) storage.removeItem(entry.key);
      } catch {
        rollbackFailed = true;
      }
    }
    return {
      status:
        written.length === 0
          ? "storage_unavailable"
          : rollbackFailed
            ? "rollback_failed"
            : "rolled_back",
    };
  }
}
