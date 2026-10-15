import { expect, it, vi } from "vitest";
const fail = vi.hoisted(() => ({ read: false }));
vi.mock("node:fs", async (original) => {
  const actual = await original<typeof import("node:fs")>();
  return {
    ...actual,
    readFileSync: (...args: Parameters<typeof actual.readFileSync>) => {
      if (fail.read && String(args[0]).endsWith("scripts/postgres/access-inventory.sql"))
        throw new Error("private/path/credential");
      return actual.readFileSync(...args);
    },
  };
});
import { ACCESS_FIELDS, sanitizedAccessFailure } from "@/lib/postgres/access-result";
import { verifyAccess } from "@/lib/postgres/verify";
import type { Session } from "@/lib/postgres/session";
it("classifies local inventory reads separately, without a second request or raw error", async () => {
  fail.read = true;
  const json = vi
    .fn()
    .mockResolvedValue(Object.fromEntries(ACCESS_FIELDS.map((field) => [field, true])));
  try {
    await verifyAccess({ json } as unknown as Session, true, true);
    throw new Error("unexpected success");
  } catch (error) {
    expect(sanitizedAccessFailure(error)).toEqual({
      classification: "ACCESS_INVENTORY_READ",
      failed_fields: [],
    });
    expect(String(error)).not.toContain("credential");
  } finally {
    fail.read = false;
  }
  expect(json).toHaveBeenCalledTimes(1);
});
