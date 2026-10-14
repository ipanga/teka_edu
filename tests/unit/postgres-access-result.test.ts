import { describe, it, expect, vi } from "vitest";
import {
  ACCESS_FIELDS,
  AccessValidationError,
  sanitizedAccessFailure,
  validateAccessResult,
} from "@/lib/postgres/access-result";
import { PostgresJsonResultError, type Session } from "@/lib/postgres/session";
import { verifyAccess } from "@/lib/postgres/verify";
const good = () => Object.fromEntries(ACCESS_FIELDS.map((field) => [field, true]));
const check = (value: unknown) => {
  try {
    validateAccessResult(value);
    return null;
  } catch (error) {
    return sanitizedAccessFailure(error);
  }
};
describe("exact access result contract", () => {
  it("accepts exactly eight genuine true booleans", () => expect(check(good())).toBeNull());
  it.each(ACCESS_FIELDS)("rejects false %s and preserves only its approved name", (field) => {
    expect(check({ ...good(), [field]: false })).toEqual({
      classification: "ACCESS_ASSERTION_FAILED",
      failed_fields: [field],
    });
  });
  it.each(ACCESS_FIELDS)("rejects missing %s", (field) => {
    const value = good();
    delete value[field];
    expect(check(value)).toEqual({ classification: "ACCESS_RESULT_SHAPE", failed_fields: [] });
  });
  it.each([null, undefined, [], {}, true, false, 1, "sensitive object name"])(
    "rejects non-object/incomplete result %j",
    (value) => {
      expect(check(value)?.classification).toBe("ACCESS_RESULT_SHAPE");
    },
  );
  it.each([null, 1, 0, "false", "true", [], {}, undefined])("rejects nonboolean %j", (value) => {
    expect(check({ ...good(), rls: value })?.classification).toBe("ACCESS_RESULT_SHAPE");
  });
  it("rejects extra keys without exposing them", () => {
    expect(check({ ...good(), "private-role-token": true })).toEqual({
      classification: "ACCESS_RESULT_SHAPE",
      failed_fields: [],
    });
  });
  it("rejects inherited fields, hidden keys, symbols and accessors without invoking getters", () => {
    const getter = vi.fn(() => true);
    const accessor = Object.defineProperty(good(), "rls", { get: getter, enumerable: true });
    for (const value of [
      Object.assign(Object.create({ rls: true }), good()),
      Object.assign(Object.create(null), good()),
      Object.defineProperty(good(), "hidden", { value: true }),
      { ...good(), [Symbol("secret")]: true },
      accessor,
    ])
      expect(check(value)?.classification).toBe("ACCESS_RESULT_SHAPE");
    expect(getter).not.toHaveBeenCalled();
  });
  it("does not serialize arbitrary or forged exceptions", () => {
    for (const error of [
      new Error("secret"),
      { classification: "ACCESS_ASSERTION_FAILED", failed_fields: ["secret"] },
      Object.create(AccessValidationError.prototype),
    ])
      expect(sanitizedAccessFailure(error)).toBeNull();
    const error = new AccessValidationError("ACCESS_ASSERTION_FAILED", ["rls", "secret" as never]);
    error.message = "secret";
    error.sanitized = () => ({
      classification: "ACCESS_ASSERTION_FAILED",
      failed_fields: ["secret" as never],
    });
    expect(sanitizedAccessFailure(error)).toEqual({
      classification: "ACCESS_ASSERTION_FAILED",
      failed_fields: ["rls"],
    });
  });
});
describe("access failure categories", () => {
  it("classifies parsing without converting execution errors", async () => {
    const json = vi.fn().mockRejectedValue(new PostgresJsonResultError());
    await expect(verifyAccess({ json } as unknown as Session, true, true)).rejects.toSatisfy(
      (error: unknown) => sanitizedAccessFailure(error)?.classification === "ACCESS_RESULT_PARSE",
    );
    const execution = new Error("synthetic SQLSTATE diagnostic");
    json.mockRejectedValue(execution);
    await expect(verifyAccess({ json } as unknown as Session, true, true)).rejects.toBe(execution);
  });
  it("stops before inventory for invalid security results", async () => {
    const json = vi.fn().mockResolvedValue({ ...good(), schema_privileges: false });
    await expect(verifyAccess({ json } as unknown as Session, true, true)).rejects.toBeInstanceOf(
      AccessValidationError,
    );
    expect(json).toHaveBeenCalledTimes(1);
  });
});
