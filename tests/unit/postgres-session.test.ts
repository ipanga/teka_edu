import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostgresClientError, Session, type OperationLabel } from "@/lib/postgres/session";
import type { Connection } from "@/lib/postgres/target";

const mocks = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock("node:child_process", () => ({ spawn: mocks.spawn }));

function fakeChild() {
  return Object.assign(new EventEmitter(), {
    stdin: Object.assign(new EventEmitter(), { write: vi.fn(), end: vi.fn() }),
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    kill: vi.fn(),
  });
}
let child: ReturnType<typeof fakeChild>;
const connection: Connection = {
  target: "production",
  host: "approved.test",
  database: "approved_db",
  login: "approved_role",
  env: {
    NODE_ENV: "test",
    PGHOST: "approved.test",
    PGDATABASE: "approved_db",
    PGUSER: "approved_role",
  },
};
function markerAt(index: number) {
  const sent = child.stdin.write.mock.calls[index]?.[0] as string;
  return sent.match(/\\echo ([A-Za-z0-9_]+)\n$/)![1]!;
}
function connected() {
  child.stdout.emit("data", Buffer.from(markerAt(0) + "\n"));
}
function acknowledge(index: number, output = "") {
  child.stdout.emit("data", Buffer.from(output + (output ? "\n" : "") + markerAt(index) + "\n"));
}
function error(text: string, exit = 2) {
  child.stderr.emit("data", Buffer.from(text));
  child.emit("close", exit, null);
}
async function complete(session: Session, sql: string, label?: OperationLabel) {
  const promise = session.query(sql, label);
  acknowledge(child.stdin.write.mock.calls.length - 1);
  return promise;
}

beforeEach(() => {
  child = fakeChild();
  mocks.spawn.mockReset().mockReturnValue(child);
});
afterEach(() => {
  child.emit("close", 0, null);
  vi.useRealTimers();
});

describe("single-process sanitized PostgreSQL session diagnostics (no native processes)", () => {
  it("rejects invalid deadline values before spawning", () => {
    for (const deadlineMs of [0, 999, 3600001, NaN, Infinity])
      expect(() => new Session(connection, { deadlineMs })).toThrow("deadline");
    expect(mocks.spawn).not.toHaveBeenCalled();
  });
  it("bounds a stalled COMMIT without inventing rollback or reconnecting", async () => {
    vi.useFakeTimers();
    const session = new Session(connection, { deadlineMs: 1000 });
    connected();
    await complete(session, "begin;");
    const pending = session.query("commit;");
    const rejection = expect(pending).rejects.toThrow("CLIENT_DEADLINE");
    await vi.advanceTimersByTimeAsync(1000);
    await rejection;
    expect(session.diagnostics().failure).toMatchObject({
      classification: "CLIENT_DEADLINE",
      phase: "AROUND_COMMIT",
    });
    expect(session.diagnostics().transaction.commit_acknowledged).toBe(0);
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");
    await vi.advanceTimersByTimeAsync(250);
    expect(child.kill).toHaveBeenCalledWith("SIGKILL");
    expect(mocks.spawn).toHaveBeenCalledTimes(1);
  });
  it("clears the client deadline on observed normal close", async () => {
    vi.useFakeTimers();
    const session = new Session(connection, { deadlineMs: 1000 });
    child.emit("close", 0, null);
    await vi.advanceTimersByTimeAsync(2000);
    expect(child.kill).not.toHaveBeenCalled();
    expect(session.diagnostics().failure).toBeNull();
  });
  it("preserves acknowledged COMMIT if the later client deadline expires", async () => {
    vi.useFakeTimers();
    const session = new Session(connection, { deadlineMs: 1000 });
    connected();
    await complete(session, "begin;");
    await complete(session, "commit;");
    const pending = session.query("select 1;");
    const rejected = expect(pending).rejects.toThrow("CLIENT_DEADLINE");
    await vi.advanceTimersByTimeAsync(1000);
    await rejected;
    expect(session.diagnostics().failure?.phase).toBe("AFTER_COMMIT_ACK");
    expect(session.diagnostics().transaction.commit_acknowledged).toBe(1);
    expect(session.diagnostics().transaction.rollback_sent).toBe(0);
  });
  it("preserves 250 ms escalation through normal query catch and close", async () => {
    vi.useFakeTimers();
    const session = new Session(connection, { deadlineMs: 1000 });
    connected();
    await complete(session, "begin;");
    const completion = session.query("commit;").catch((error: unknown) => {
      expect(error).toBeInstanceOf(PostgresClientError);
      return session.close();
    });
    await vi.advanceTimersByTimeAsync(1000);
    expect(child.kill.mock.calls).toEqual([["SIGTERM"]]);
    await vi.advanceTimersByTimeAsync(249);
    expect(child.kill.mock.calls).toEqual([["SIGTERM"]]);
    await vi.advanceTimersByTimeAsync(1);
    expect(child.kill.mock.calls).toEqual([["SIGTERM"], ["SIGKILL"]]);
    child.emit("close", null, "SIGKILL");
    await expect(completion).resolves.toMatchObject({
      failure: { classification: "CLIENT_DEADLINE", phase: "AROUND_COMMIT" },
      client_exit: { observed: true, code: null, signal: "SIGKILL" },
      transaction: { commit_sent: 1, commit_acknowledged: 0, rollback_sent: 0 },
    });
    expect(mocks.spawn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(child.kill).toHaveBeenCalledTimes(2);
  });
  it("cancels escalation on observed TERM exit during deadline cleanup", async () => {
    vi.useFakeTimers();
    const session = new Session(connection, { deadlineMs: 1000 });
    connected();
    const completion = session.query("select 1;").catch(() => session.close());
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(100);
    child.emit("close", null, "SIGTERM");
    await expect(completion).resolves.toMatchObject({
      client_exit: { observed: true, code: null, signal: "SIGTERM" },
      failure: { classification: "CLIENT_DEADLINE" },
    });
    await vi.advanceTimersByTimeAsync(3000);
    expect(child.kill.mock.calls).toEqual([["SIGTERM"]]);
  });
  it("bounds deadline cleanup when even SIGKILL receives no exit acknowledgement", async () => {
    vi.useFakeTimers();
    const session = new Session(connection, { deadlineMs: 1000 });
    connected();
    const completion = session.query("commit;").catch(() => session.close());
    await vi.advanceTimersByTimeAsync(1500);
    await expect(completion).resolves.toMatchObject({
      client_exit: { observed: false, code: null, signal: null },
      failure: { classification: "CLIENT_DEADLINE", phase: "AROUND_COMMIT" },
      transaction: { commit_acknowledged: 0, rollback_acknowledged: 0 },
    });
    expect(child.kill.mock.calls).toEqual([["SIGTERM"], ["SIGKILL"]]);
    await vi.advanceTimersByTimeAsync(3000);
    expect(child.kill).toHaveBeenCalledTimes(2);
  });
  it("cancels a future deadline during ordinary clean shutdown", async () => {
    vi.useFakeTimers();
    const session = new Session(connection, { deadlineMs: 1000 });
    const closing = session.close();
    await vi.advanceTimersByTimeAsync(500);
    child.emit("close", 0, null);
    await expect(closing).resolves.toMatchObject({ client_exit: { observed: true, code: 0 } });
    await vi.advanceTimersByTimeAsync(3000);
    expect(child.kill).not.toHaveBeenCalled();
  });
  it("exports structured assertion SQLSTATE without server error contents", async () => {
    const session = new Session(connection);
    connected();
    const pending = session.query("select synthetic_assertion();");
    error("ERROR:  P0001\nSECRET_SENTINEL\n", 3);
    const failure = await pending.catch((value: unknown) => value);
    expect(failure).toBeInstanceOf(PostgresClientError);
    expect((failure as PostgresClientError).diagnostics.failure).toEqual({
      classification: "SQLSTATE_ERROR",
      sqlstate: "P0001",
      phase: "AFTER_CONNECTION_ACK",
    });
    expect(JSON.stringify(failure)).not.toContain("SECRET_SENTINEL");
    (failure as PostgresClientError).diagnostics.transaction.commit_acknowledged = 99;
    expect(session.diagnostics().transaction.commit_acknowledged).toBe(0);
  });
  it("spawns once with SQLSTATE-only server diagnostics and no shell", () => {
    new Session(connection);
    expect(mocks.spawn).toHaveBeenCalledTimes(1);
    expect(mocks.spawn).toHaveBeenCalledWith(
      "psql",
      ["-X", "-qAt", "--no-password", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=sqlstate"],
      { env: connection.env },
    );
    expect(child.stdin.write).toHaveBeenCalledTimes(1);
    expect(child.stdin.write.mock.calls[0]![0]).toMatch(
      /^\\echo __TEKA_[a-f0-9]{48}_CONNECTED__\n$/,
    );
  });
  it("fails before spawn without explicit interactive password identification", () => {
    expect(
      () =>
        new Session({
          ...connection,
          env: { NODE_ENV: "test", TEKA_POSTGRES_PASSWORD_PROMPT: "true" },
        }),
    ).toThrow(/identification/);
    expect(mocks.spawn).not.toHaveBeenCalled();
  });
  it("identifies an interactive target before spawning the password prompt", () => {
    const beforePasswordPrompt = vi.fn(() => expect(mocks.spawn).not.toHaveBeenCalled());
    new Session(
      { ...connection, env: { NODE_ENV: "test", TEKA_POSTGRES_PASSWORD_PROMPT: "true" } },
      { beforePasswordPrompt },
    );
    expect(beforePasswordPrompt).toHaveBeenCalledOnce();
    expect(mocks.spawn.mock.calls[0]![1]).toContain("--password");
  });
  it("acknowledges connection separately from BEGIN and tolerates split markers", async () => {
    const session = new Session(connection);
    const promise = session.query("begin read only;");
    const marker = markerAt(0);
    child.stdout.emit("data", Buffer.from(marker.slice(0, 9)));
    expect(session.diagnostics().connection_acknowledged).toBe(false);
    child.stdout.emit("data", Buffer.from(marker.slice(9) + "\n"));
    expect(session.diagnostics().connection_acknowledged).toBe(true);
    expect(session.diagnostics().transaction.begin_acknowledged).toBe(0);
    acknowledge(1);
    await promise;
    expect(session.diagnostics().last_acknowledged).toEqual({
      ordinal: 1,
      label: "BEGIN_READ_ONLY",
    });
  });
  it("does not accept guessed connection markers", () => {
    const session = new Session(connection);
    child.stdout.emit("data", Buffer.from("__TEKA_RESULT_1__\n__TEKA_fake_CONNECTED__\n"));
    expect(session.diagnostics().connection_acknowledged).toBe(false);
  });
  it("rejects result acknowledgement before the connection marker", async () => {
    const session = new Session(connection);
    const promise = session.query("select 1;");
    acknowledge(1);
    await expect(promise).rejects.toThrow("PROTOCOL_ERROR");
    expect(session.diagnostics().last_acknowledged).toBeNull();
  });
  it("requires exact whole-line markers and preserves a marker-like result", async () => {
    const session = new Session(connection);
    connected();
    const promise = session.query("select 'synthetic';");
    const marker = markerAt(1);
    child.stdout.emit("data", Buffer.from("prefix" + marker + "\n"));
    expect(session.diagnostics().last_acknowledged).toBeNull();
    acknowledge(1);
    await expect(promise).resolves.toBe("prefix" + marker);
  });
  it.each([
    ["FATAL:  28P01\n", "AUTHENTICATION_REJECTED", "28P01"],
    [
      'password authentication failed for user "SECRET_SENTINEL"\n',
      "AUTHENTICATION_REJECTED",
      null,
    ],
    ["SSL error: certificate verify failed SECRET_SENTINEL\n", "TLS_CERTIFICATE", null],
    ['could not translate host name "SECRET_SENTINEL" to address\n', "DNS", null],
    ["connection to server failed: timeout expired SECRET_SENTINEL\n", "CONNECTION_TIMEOUT", null],
    ["Connection refused SECRET_SENTINEL\n", "NETWORK_TRANSPORT", null],
    ["Network is unreachable SECRET_SENTINEL\n", "NETWORK_TRANSPORT", null],
    ["SSL SYSCALL error: EOF detected SECRET_SENTINEL\n", "NETWORK_TRANSPORT", null],
    ["ERROR:  42501\nSECRET_SENTINEL\n", "SQLSTATE_ERROR", "42501"],
    ["psql:/private/SECRET_SENTINEL:5: ERROR:  57014\n", "SQLSTATE_ERROR", "57014"],
    ["unrecognized SECRET_SENTINEL\n", "CLIENT_EXIT", null],
  ])(
    "classifies a safe category without retaining or publishing stderr (%s)",
    async (stderr, classification, sqlstate) => {
      const session = new Session(connection);
      const promise = session.query("begin read only;");
      error(stderr);
      await expect(promise).rejects.toThrow(classification);
      const diagnostics = session.diagnostics();
      expect(diagnostics.failure).toEqual({
        classification,
        sqlstate,
        phase: "BEFORE_CONNECTION_ACK",
      });
      expect(JSON.stringify(diagnostics)).not.toContain("SECRET_SENTINEL");
      expect((session as unknown as { stderrTail: string }).stderrTail).toBe("");
    },
  );
  it("classifies diagnostics split across stderr chunks", async () => {
    const session = new Session(connection);
    const promise = session.query("begin;");
    child.stderr.emit("data", Buffer.from("FATAL:  28"));
    child.stderr.emit("data", Buffer.from("P01\n"));
    child.emit("close", 2, null);
    await expect(promise).rejects.toThrow("28P01");
  });
  it("bounds retained stderr and never leaks it for local or staging targets either", async () => {
    const session = new Session({ ...connection, target: "local" });
    const promise = session.query("select 1;");
    child.stderr.emit("data", Buffer.from("SECRET_SENTINEL".repeat(10000)));
    expect((session as unknown as { stderrTail: string }).stderrTail.length).toBeLessThanOrEqual(
      8192,
    );
    child.emit("close", 2, null);
    await expect(promise).rejects.not.toThrow("SECRET_SENTINEL");
    expect(JSON.stringify(session.diagnostics())).not.toContain("SECRET_SENTINEL");
  });
  it("does not invent a cause for an unexplained client exit", async () => {
    const session = new Session(connection);
    const promise = session.query("begin read only;");
    child.emit("close", 2, null);
    await expect(promise).rejects.toThrow("CLIENT_EXIT");
    expect(session.diagnostics().failure?.sqlstate).toBeNull();
    expect(session.diagnostics().client_exit).toEqual({ observed: true, code: 2, signal: null });
  });
  it("distinguishes failure before BEGIN acknowledgement from preconnection failure", async () => {
    const session = new Session(connection);
    connected();
    const promise = session.query("begin read only;");
    error("server closed the connection unexpectedly");
    await expect(promise).rejects.toThrow("BEFORE_BEGIN_ACK");
    expect(session.diagnostics().transaction.begin_acknowledged).toBe(0);
  });
  it("retains last acknowledged operation without SQL text on migration failure", async () => {
    const session = new Session(connection);
    connected();
    await complete(session, "begin;");
    await complete(session, "select 1;", "IDENTITY");
    const promise = session.query("select SECRET_SENTINEL;", "MIGRATION");
    error("ERROR:  42501\n");
    await expect(promise).rejects.toThrow("DURING_TRANSACTION");
    expect(session.diagnostics().last_acknowledged).toEqual({ ordinal: 2, label: "IDENTITY" });
    expect(session.diagnostics().last_sent).toEqual({ ordinal: 3, label: "MIGRATION" });
    expect(JSON.stringify(session.diagnostics())).not.toContain("SECRET_SENTINEL");
  });
  it("never converts a class-08 lost COMMIT acknowledgement into rollback", async () => {
    const session = new Session(connection);
    connected();
    await complete(session, "begin;");
    const promise = session.query("commit;");
    error("ERROR:  08006\n");
    await expect(promise).rejects.toThrow("AROUND_COMMIT");
    await expect(session.query("rollback;")).rejects.toThrow("no retry attempted");
    expect(session.diagnostics().transaction).toMatchObject({
      commit_sent: 1,
      commit_acknowledged: 0,
      rollback_sent: 0,
      rollback_acknowledged: 0,
    });
    expect(mocks.spawn).toHaveBeenCalledTimes(1);
  });
  it("retains successful COMMIT acknowledgement despite a later transport/reporting failure", async () => {
    const session = new Session(connection);
    connected();
    await complete(session, "begin;");
    await complete(session, "commit;");
    error("server closed the connection unexpectedly");
    expect(session.diagnostics().transaction.commit_acknowledged).toBe(1);
    expect(session.diagnostics().failure?.phase).toBe("AFTER_COMMIT_ACK");
  });
  it("records explicit rollback acknowledgement", async () => {
    const session = new Session(connection);
    connected();
    await complete(session, "begin read only;");
    await complete(session, "rollback;");
    error("server closed the connection unexpectedly");
    expect(session.diagnostics().failure?.phase).toBe("AFTER_ROLLBACK_ACK");
    expect(session.diagnostics().transaction.rollback_acknowledged).toBe(1);
  });
  it("preserves the original SQLSTATE despite subsequent cleanup failures", async () => {
    const session = new Session(connection);
    connected();
    const promise = session.query("select 1;");
    error("ERROR:  42501\n");
    await expect(promise).rejects.toThrow("42501");
    await expect(session.query("rollback;")).rejects.toThrow();
    child.stdin.emit("error", new Error("SECRET_SENTINEL"));
    expect(session.diagnostics().failure).toMatchObject({
      classification: "SQLSTATE_ERROR",
      sqlstate: "42501",
    });
  });
  it("retains a SQLSTATE arriving after a pipe error without losing the first failure phase", async () => {
    const session = new Session(connection);
    connected();
    await complete(session, "begin;");
    const promise = session.query("commit;");
    child.stdin.emit("error", new Error("SECRET_SENTINEL"));
    await expect(promise).rejects.toThrow("CLIENT_PROCESS_ERROR");
    child.stderr.emit("data", Buffer.from("ERROR:  08006\nSECRET_SENTINEL\n"));
    child.emit("close", 2, null);
    expect(session.diagnostics().failure).toEqual({
      classification: "NETWORK_TRANSPORT",
      sqlstate: "08006",
      phase: "AROUND_COMMIT",
    });
    expect(session.diagnostics().transaction.commit_acknowledged).toBe(0);
    expect(JSON.stringify(session.diagnostics())).not.toContain("SECRET_SENTINEL");
    expect(mocks.spawn).toHaveBeenCalledTimes(1);
  });
  it("records client signal separately without assuming a database rollback", async () => {
    const session = new Session(connection);
    connected();
    const promise = session.query("begin;");
    child.emit("close", null, "SIGTERM");
    await expect(promise).rejects.toThrow("CLIENT_SIGNAL");
    expect(session.diagnostics().client_exit).toEqual({
      observed: true,
      code: null,
      signal: "SIGTERM",
    });
    expect(session.diagnostics().transaction.rollback_acknowledged).toBe(0);
  });
  it("sanitizes process and stdin errors and never reconnects", async () => {
    const session = new Session(connection);
    const promise = session.query("begin;");
    child.emit("error", new Error("SECRET_SENTINEL"));
    await expect(promise).rejects.toThrow("CLIENT_PROCESS_ERROR");
    await expect(session.query("begin;")).rejects.toThrow();
    child.stdin.emit("error", new Error("SECRET_SENTINEL"));
    expect(mocks.spawn).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(session.diagnostics())).not.toContain("SECRET_SENTINEL");
  });
  it("sanitizes JSON parsing failures that might otherwise echo a sensitive prefix", async () => {
    const session = new Session(connection);
    connected();
    const promise = session.json("select 'synthetic';");
    acknowledge(1, "SECRET_SENTINEL");
    await expect(promise).rejects.toThrow("contents withheld");
    expect(JSON.stringify(session.diagnostics())).not.toContain("SECRET_SENTINEL");
  });
  it("rejects untrusted labels and concurrent queries without extra writes", async () => {
    const session = new Session(connection);
    connected();
    await expect(session.query("select 1;", "SECRET_SENTINEL" as OperationLabel)).rejects.toThrow(
      "allowlisted",
    );
    const promise = session.query("select 1;");
    await expect(session.query("select 2;")).rejects.toThrow("Concurrent");
    acknowledge(1, "1");
    await expect(promise).resolves.toBe("1");
    expect(child.stdin.write).toHaveBeenCalledTimes(2);
  });
  it("returns a detached diagnostic snapshot", () => {
    const session = new Session(connection);
    session.diagnostics().transaction.commit_acknowledged = 99;
    expect(session.diagnostics().transaction.commit_acknowledged).toBe(0);
  });
  it("sanitizes synchronous spawn and initial stdin failures", async () => {
    mocks.spawn.mockImplementationOnce(() => {
      throw new Error("SECRET_SENTINEL");
    });
    expect(() => new Session(connection)).toThrow("private diagnostics withheld");
    child.stdin.write.mockImplementationOnce(() => {
      throw new Error("SECRET_SENTINEL");
    });
    const session = new Session(connection);
    await expect(session.query("begin;")).rejects.toThrow("no retry attempted");
    expect(session.diagnostics().failure?.classification).toBe("CLIENT_PROCESS_ERROR");
    expect(JSON.stringify(session.diagnostics())).not.toContain("SECRET_SENTINEL");
  });
  it("distinguishes a subsequent transaction from an earlier acknowledged commit", async () => {
    const session = new Session(connection);
    connected();
    await complete(session, "begin;");
    await complete(session, "commit;");
    const promise = session.query("begin;");
    error("server closed the connection unexpectedly");
    await expect(promise).rejects.toThrow("BEFORE_BEGIN_ACK");
    expect(session.diagnostics().transaction.commit_acknowledged).toBe(1);
  });
  it("does not report a lost rollback acknowledgement as completed rollback", async () => {
    const session = new Session(connection);
    connected();
    await complete(session, "begin read only;");
    const promise = session.query("rollback;");
    error("server closed the connection unexpectedly");
    await expect(promise).rejects.toThrow("AROUND_ROLLBACK");
    expect(session.diagnostics().transaction.rollback_acknowledged).toBe(0);
  });
  it("bounds an oversized synthetic result without retaining raw content in diagnostics", async () => {
    const session = new Session(connection);
    connected();
    const promise = session.query("select 'synthetic';");
    child.stdout.emit("data", Buffer.alloc(32 * 1024 * 1024 + 1, 65));
    await expect(promise).rejects.toThrow("OUTPUT_LIMIT");
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");
    expect(JSON.stringify(session.diagnostics())).not.toContain("AAAA");
  });
  it("awaits clean exit once and reports the observed code", async () => {
    const session = new Session(connection);
    connected();
    const closing = session.close();
    expect(session.close()).toBe(closing);
    expect(child.stdin.end).toHaveBeenCalledWith("\\q\n");
    child.emit("close", 0, null);
    await expect(closing).resolves.toMatchObject({
      client_exit: { observed: true, code: 0, signal: null },
    });
    expect(child.kill).not.toHaveBeenCalled();
  });
  it("bounds cleanup and does not claim an unobserved exit or rollback", async () => {
    vi.useFakeTimers();
    const session = new Session(connection);
    const closing = session.close();
    await vi.advanceTimersByTimeAsync(2500);
    expect(child.kill.mock.calls).toEqual([["SIGTERM"], ["SIGKILL"]]);
    await expect(closing).resolves.toMatchObject({
      client_exit: { observed: false },
      failure: { classification: "UNKNOWN" },
    });
  });
  it("retains successful commit state when forced termination is required during cleanup", async () => {
    vi.useFakeTimers();
    const session = new Session(connection);
    connected();
    await complete(session, "begin;");
    await complete(session, "commit;");
    child.kill.mockImplementation(() => {
      child.emit("close", null, "SIGTERM");
      return true;
    });
    const closing = session.close();
    await vi.advanceTimersByTimeAsync(2000);
    await expect(closing).resolves.toMatchObject({
      failure: { phase: "AFTER_COMMIT_ACK" },
      transaction: { commit_acknowledged: 1 },
    });
  });
});
