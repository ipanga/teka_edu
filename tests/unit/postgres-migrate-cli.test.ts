import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  spawn: vi.fn(),
  close: vi.fn(),
  diagnostics: vi.fn(),
  prompt: vi.fn(),
  initialize: vi.fn(),
  list: vi.fn(),
  preflight: vi.fn(),
  apply: vi.fn(),
  verify: vi.fn(),
  write: vi.fn(),
  gates: vi.fn(),
  events: [] as string[],
}));
vi.mock("node:fs", () => ({ writeFileSync: mocks.write }));
vi.mock("@/lib/postgres/target", () => ({
  connectionFor: () => ({ target: "production", env: {} }),
}));
vi.mock("@/lib/postgres/migrations", () => ({ loadMigrations: () => [] }));
vi.mock("@/lib/postgres/password-prompt", () => ({ preparePasswordPrompt: mocks.prompt }));
vi.mock("@/lib/postgres/runner", () => ({
  initialize: mocks.initialize,
  list: mocks.list,
  preflight: mocks.preflight,
  apply: mocks.apply,
  verify: mocks.verify,
  assertStagingGates: mocks.gates,
  assertProductionGates: mocks.gates,
}));
vi.mock("@/lib/postgres/session", () => ({
  Session: class {
    constructor(_connection: unknown, options: { beforePasswordPrompt?: () => void }) {
      options.beforePasswordPrompt?.();
      mocks.events.push("spawn");
      mocks.spawn();
    }
    close = mocks.close;
    diagnostics = mocks.diagnostics;
  },
}));
import { main } from "@/scripts/postgres-migrate";

const release = "a".repeat(40);
const args = (command = "list") => [
  command,
  "--target",
  "production",
  "--production-approved",
  "--release-sha",
  release,
  "--password",
  "--execution-timeout-seconds",
  "1800",
];
const successful = () => ({
  connection_acknowledged: true,
  invocations: 1,
  retries: 0,
  last_sent: { ordinal: 3, label: "COMMIT" },
  last_acknowledged: { ordinal: 3, label: "COMMIT" },
  transaction: {
    begin_sent: 1,
    begin_acknowledged: 1,
    commit_sent: 1,
    commit_acknowledged: 1,
    rollback_sent: 0,
    rollback_acknowledged: 0,
  },
  failure: null,
  client_exit: { observed: true, code: 0, signal: null },
});
let stderr: ReturnType<typeof vi.spyOn>;
let stdout: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.events.length = 0;
  stderr = vi.spyOn(console, "error").mockImplementation(() => {});
  stdout = vi.spyOn(console, "log").mockImplementation(() => {});
  mocks.prompt.mockImplementation(async () => {
    mocks.events.push("ready");
    return () => mocks.events.push("header");
  });
  mocks.list.mockResolvedValue({ applied: 46, pending: 0 });
  mocks.apply.mockResolvedValue({ applied: 46 });
  mocks.close.mockResolvedValue(successful());
  mocks.diagnostics.mockReturnValue(successful());
});
afterEach(() => vi.restoreAllMocks());
const failureReport = () => JSON.parse(String(stderr.mock.calls.at(-1)?.[0]));

describe("offline migration CLI diagnostics", () => {
  it("requires an explicit production apply deadline before any prompt or client", async () => {
    const unbounded = args("apply").slice(0, -2);
    expect(await main(unbounded)).toBe(1);
    expect(mocks.prompt).not.toHaveBeenCalled();
    expect(mocks.spawn).not.toHaveBeenCalled();
    expect(failureReport().failure_stage).toBe("LOCAL_PREFLIGHT");
  });
  it("does not open a client on module import", () => expect(mocks.spawn).not.toHaveBeenCalled());
  it("requires readiness and explicit identity immediately before spawn", async () => {
    expect(await main(args())).toBe(0);
    expect(mocks.events).toEqual(["ready", "header", "spawn"]);
    expect(mocks.prompt).toHaveBeenCalledWith(expect.anything(), "list");
    expect(mocks.spawn).toHaveBeenCalledTimes(1);
  });
  it("refuses unconfirmed readiness without creating a client or leaking exception text", async () => {
    mocks.prompt.mockRejectedValue(new Error("synthetic secret value"));
    expect(await main(args())).toBe(1);
    expect(mocks.spawn).not.toHaveBeenCalled();
    expect(failureReport().failure_stage).toBe("PASSWORD_READINESS");
    expect(JSON.stringify(stderr.mock.calls)).not.toContain("synthetic secret");
  });
  it("records initialization failure and sanitized client diagnostics without a retry", async () => {
    mocks.initialize.mockRejectedValue(new Error("private server object/password"));
    const d = {
      ...successful(),
      connection_acknowledged: false,
      failure: { classification: "DNS", sqlstate: null, phase: "BEFORE_CONNECTION_ACK" },
    };
    mocks.close.mockResolvedValue(d);
    mocks.diagnostics.mockReturnValue(d);
    expect(await main(args())).toBe(1);
    expect(failureReport()).toMatchObject({
      failure_stage: "INITIALIZE",
      diagnostics: d,
      automatic_retries: 0,
      reset_or_restore_attempted: false,
    });
    expect(mocks.spawn).toHaveBeenCalledTimes(1);
    expect(mocks.list).not.toHaveBeenCalled();
    expect(JSON.stringify(stderr.mock.calls)).not.toContain("private server");
  });
  it("preserves a lost COMMIT acknowledgement without retrying apply or claiming rollback", async () => {
    const d = successful();
    d.transaction.commit_acknowledged = 0;
    const ambiguous = {
      ...d,
      failure: { classification: "NETWORK_TRANSPORT", sqlstate: null, phase: "AROUND_COMMIT" },
      client_exit: { observed: true, code: 2, signal: null },
    };
    mocks.diagnostics.mockReturnValue(ambiguous);
    mocks.close.mockResolvedValue(ambiguous);
    mocks.apply.mockRejectedValue(new Error("private diagnostic"));
    expect(await main(args("apply"))).toBe(1);
    expect(failureReport().diagnostics).toEqual(ambiguous);
    expect(mocks.apply).toHaveBeenCalledTimes(1);
    expect(mocks.verify).not.toHaveBeenCalled();
  });
  it.each([
    { observed: false, code: null, signal: null },
    { observed: true, code: 2, signal: null },
    { observed: true, code: null, signal: "SIGTERM" },
  ])("does not publish PASS for an unclean client close: %j", async (exit) => {
    const d = { ...successful(), client_exit: exit };
    mocks.close.mockResolvedValue(d);
    mocks.diagnostics.mockReturnValue(d);
    expect(await main(args())).toBe(1);
    expect(stdout).not.toHaveBeenCalled();
    expect(failureReport().failure_stage).toBe("CLIENT_CLOSE");
  });
  it("retains confirmed COMMIT when private result writing fails, preserving prior files", async () => {
    mocks.write.mockImplementation(() => {
      throw new Error("secret/path");
    });
    expect(await main([...args("apply"), "--output", "/synthetic/prior-result"])).toBe(1);
    expect(failureReport()).toMatchObject({
      failure_stage: "RESULT_WRITE",
      diagnostics: { transaction: { commit_acknowledged: 1 } },
    });
    for (const call of mocks.write.mock.calls) expect(call[2]).toEqual({ mode: 0o600, flag: "wx" });
    expect(JSON.stringify(stderr.mock.calls)).not.toContain("secret/path");
  });
  it("preserves the original failure if cleanup itself rejects", async () => {
    mocks.initialize.mockRejectedValue(new Error("secret"));
    mocks.close.mockRejectedValue(new Error("cleanup secret"));
    expect(await main(args())).toBe(1);
    expect(failureReport().failure_stage).toBe("INITIALIZE");
    expect(JSON.stringify(stderr.mock.calls)).not.toContain("secret");
  });
});
