export const ACCESS_FIELDS = [
  "rls",
  "policies",
  "table_privileges",
  "function_privileges",
  "schema_privileges",
  "public_schema_create",
  "cross_environment_isolation",
  "btree_gist",
] as const;
export type AccessField = (typeof ACCESS_FIELDS)[number];
export type AccessClassification =
  | "ACCESS_RESULT_PARSE"
  | "ACCESS_RESULT_SHAPE"
  | "ACCESS_ASSERTION_FAILED"
  | "ACCESS_INVENTORY_READ";

/** Only fixed categories and approved assertion names can leave this error. */
export class AccessValidationError extends Error {
  readonly #classification: AccessClassification;
  readonly #failed: readonly AccessField[];
  constructor(classification: AccessClassification, failed: readonly AccessField[] = []) {
    super("Access validation failed; sensitive details withheld");
    this.#classification = [
      "ACCESS_RESULT_PARSE",
      "ACCESS_RESULT_SHAPE",
      "ACCESS_ASSERTION_FAILED",
      "ACCESS_INVENTORY_READ",
    ].includes(classification)
      ? classification
      : "ACCESS_RESULT_SHAPE";
    this.#failed =
      classification === "ACCESS_ASSERTION_FAILED" && Array.isArray(failed)
        ? ACCESS_FIELDS.filter((field) => failed.includes(field))
        : [];
  }
  sanitized() {
    return { classification: this.#classification, failed_fields: [...this.#failed] };
  }
}

export function sanitizedAccessFailure(error: unknown) {
  if (!(error instanceof AccessValidationError)) return null;
  try {
    return AccessValidationError.prototype.sanitized.call(error);
  } catch {
    return null;
  }
}

export function validateAccessResult(value: unknown): Record<AccessField, boolean> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype ||
    Reflect.ownKeys(value).length !== ACCESS_FIELDS.length ||
    !ACCESS_FIELDS.every((field) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, field);
      return (
        descriptor?.enumerable === true &&
        "value" in descriptor &&
        typeof descriptor.value === "boolean"
      );
    })
  )
    throw new AccessValidationError("ACCESS_RESULT_SHAPE");
  const result = value as Record<AccessField, boolean>;
  const failed = ACCESS_FIELDS.filter((field) => result[field] !== true);
  if (failed.length) throw new AccessValidationError("ACCESS_ASSERTION_FAILED", failed);
  return result;
}
