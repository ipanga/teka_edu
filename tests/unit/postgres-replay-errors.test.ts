import { describe, expect, it } from "vitest";
import { PostgresClientError, type SessionDiagnostics } from "@/lib/postgres/session";
import { isManagedAssertionFailure } from "@/scripts/postgres/replay-errors";

function failure(overrides: Partial<SessionDiagnostics["failure"]> = {}) {
  const diagnostics: SessionDiagnostics = {
    connection_acknowledged: true,
    invocations: 1,
    retries: 0,
    migration_batches: [],
    client_timing: {
      deadline_ms: null,
      deadline_fired_ms: null,
      term_sent_ms: null,
      kill_sent_ms: null,
      exit_ms: null,
      cleanup_started_ms: null,
      cleanup_completed_ms: null,
    },
    last_sent: { ordinal: 1, label: "QUERY" },
    last_acknowledged: null,
    transaction: {
      begin_sent: 0,
      begin_acknowledged: 0,
      commit_sent: 0,
      commit_acknowledged: 0,
      rollback_sent: 0,
      rollback_acknowledged: 0,
    },
    failure: {
      classification: "SQLSTATE_ERROR",
      sqlstate: "P0001",
      phase: "AFTER_CONNECTION_ACK",
      ...overrides,
    },
    client_exit: { observed: false, code: null, signal: null },
  };
  return new PostgresClientError(diagnostics);
}

describe("managed assertion negative-test contract", () => {
  it("requires structured P0001 after an acknowledged connection", () => {
    expect(isManagedAssertionFailure(failure())).toBe(true);
  });
  it.each(["23514", "42501", "57014", "08006", "28P01", null])(
    "rejects unrelated SQLSTATE %s",
    (sqlstate) => {
      expect(isManagedAssertionFailure(failure({ sqlstate }))).toBe(false);
    },
  );
  it.each(["NETWORK_TRANSPORT", "CLIENT_PROCESS_ERROR", "CLIENT_DEADLINE", "UNKNOWN"] as const)(
    "rejects non-SQL failure classification %s",
    (classification) => {
      expect(isManagedAssertionFailure(failure({ classification }))).toBe(false);
    },
  );
  it("rejects missing acknowledgement, wrong phase and message-only spoofing", () => {
    const error = failure();
    error.diagnostics.connection_acknowledged = false;
    expect(isManagedAssertionFailure(error)).toBe(false);
    expect(isManagedAssertionFailure(failure({ phase: "BEFORE_CONNECTION_ACK" }))).toBe(false);
    expect(isManagedAssertionFailure(failure({ phase: "AROUND_COMMIT" }))).toBe(false);
    expect(isManagedAssertionFailure(new Error("Assertion failed; SQLSTATE=P0001"))).toBe(false);
    expect(isManagedAssertionFailure(null)).toBe(false);
  });
});
