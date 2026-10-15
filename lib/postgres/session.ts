import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomBytes } from "node:crypto";
import type { Connection } from "./target";
import { renderMigrationBatch } from "./batch";

const LABELS = [
  "QUERY",
  "IDENTITY",
  "HISTORY",
  "SCHEMA",
  "CANONICAL",
  "ACCESS",
  "INTEGRITY",
  "IDEMPOTENCY",
  "MIGRATION",
  "BOOTSTRAP",
  "ADVISORY_LOCK",
  "BEGIN",
  "BEGIN_READ_ONLY",
  "COMMIT",
  "ROLLBACK",
  "RECONCILIATION",
] as const;
export type OperationLabel = (typeof LABELS)[number];
type Operation = { ordinal: number; label: OperationLabel };
export type MigrationTiming = {
  ordinal: number;
  version: string;
  render_started_ms: number;
  render_completed_ms: number;
  submission_started_ms: number;
  input_bytes: number;
  expected_statement_count: number;
  write_completed_ms: number | null;
  backpressure: boolean;
  drain_completed_ms: number | null;
  acknowledgement_ms: number | null;
  elapsed_ms: number | null;
};
type Classification =
  | "AUTHENTICATION_REJECTED"
  | "TLS_CERTIFICATE"
  | "DNS"
  | "NETWORK_TRANSPORT"
  | "CONNECTION_TIMEOUT"
  | "CLIENT_DEADLINE"
  | "SQLSTATE_ERROR"
  | "CLIENT_WRITE_ERROR"
  | "CLIENT_PROCESS_ERROR"
  | "CLIENT_SIGNAL"
  | "CLIENT_EXIT"
  | "OUTPUT_LIMIT"
  | "PROTOCOL_ERROR"
  | "UNKNOWN";
export type SessionDiagnostics = {
  connection_acknowledged: boolean;
  invocations: number;
  retries: 0;
  last_sent: Operation | null;
  last_acknowledged: Operation | null;
  migration_batches: MigrationTiming[];
  client_timing: {
    deadline_ms: number | null;
    deadline_fired_ms: number | null;
    term_sent_ms: number | null;
    kill_sent_ms: number | null;
    exit_ms: number | null;
    cleanup_started_ms: number | null;
    cleanup_completed_ms: number | null;
  };
  transaction: {
    begin_sent: number;
    begin_acknowledged: number;
    commit_sent: number;
    commit_acknowledged: number;
    rollback_sent: number;
    rollback_acknowledged: number;
  };
  failure: { classification: Classification; sqlstate: string | null; phase: string } | null;
  client_exit: { observed: boolean; code: number | null; signal: string | null };
};

/** Structured, sanitized failure for callers that must not inspect server error text. */
export class PostgresClientError extends Error {
  readonly diagnostics: SessionDiagnostics;

  constructor(diagnostics: SessionDiagnostics) {
    const failure = diagnostics.failure;
    super(
      `PostgreSQL client failure: ${failure?.classification ?? "UNKNOWN"}; SQLSTATE=${failure?.sqlstate ?? "UNKNOWN"}; phase=${failure?.phase ?? "UNKNOWN"}`,
    );
    this.name = "PostgresClientError";
    this.diagnostics = structuredClone(diagnostics);
  }
}

/** Distinguish local JSON parsing from SQLSTATE/client failures without retaining output. */
export class PostgresJsonResultError extends Error {
  constructor() {
    super("PostgreSQL JSON result is invalid; contents withheld");
  }
}

/** No SQL text, stderr, host/user strings or query results enter the diagnostic record. */
export class Session {
  private child: ChildProcessWithoutNullStreams;
  private startedAt = performance.now();
  private readonly drainListeners = new Set<() => void>();
  private buffer = "";
  private output = "";
  private stderrTail = "";
  private stderrClass: Classification | null = null;
  private sqlstate: string | null = null;
  private readonly nonce = randomBytes(24).toString("hex");
  private readonly connectedMarker = `__TEKA_${this.nonce}_CONNECTED__`;
  private latestTransactionEvent:
    | "begin_sent"
    | "begin_acknowledged"
    | "commit_sent"
    | "commit_acknowledged"
    | "rollback_sent"
    | "rollback_acknowledged"
    | null = null;
  private closed = false;
  private closing?: Promise<SessionDiagnostics>;
  private deadline?: ReturnType<typeof setTimeout>;
  private deadlineKill?: ReturnType<typeof setTimeout>;
  private exitResolve!: () => void;
  private readonly exited = new Promise<void>((resolve) => {
    this.exitResolve = resolve;
  });
  private state: SessionDiagnostics = {
    connection_acknowledged: false,
    invocations: 1,
    retries: 0,
    last_sent: null,
    last_acknowledged: null,
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
    transaction: {
      begin_sent: 0,
      begin_acknowledged: 0,
      commit_sent: 0,
      commit_acknowledged: 0,
      rollback_sent: 0,
      rollback_acknowledged: 0,
    },
    failure: null,
    client_exit: { observed: false, code: null, signal: null },
  };
  private pending?: {
    marker: string;
    operation: Operation;
    transaction: "begin" | "commit" | "rollback" | null;
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  };

  constructor(
    connection: Connection,
    options?: { beforePasswordPrompt?: () => void; deadlineMs?: number },
  ) {
    if (
      options?.deadlineMs !== undefined &&
      (!Number.isSafeInteger(options.deadlineMs) ||
        options.deadlineMs < 1000 ||
        options.deadlineMs > 3600000)
    )
      throw new Error("Invalid bounded PostgreSQL client deadline");
    const interactive = connection.env.TEKA_POSTGRES_PASSWORD_PROMPT === "true";
    if (interactive) {
      if (!options?.beforePasswordPrompt)
        throw new Error(
          "Private PostgreSQL prompting requires explicit target and operation identification",
        );
      options.beforePasswordPrompt();
    }
    try {
      this.child = spawn(
        "psql",
        [
          "-X",
          "-qAt",
          interactive ? "--password" : "--no-password",
          "-v",
          "ON_ERROR_STOP=1",
          "-v",
          "VERBOSITY=sqlstate",
        ],
        {
          env: {
            ...connection.env,
            PGCLIENTENCODING: "UTF8",
            PGOPTIONS: "-c standard_conforming_strings=on",
          },
        },
      );
    } catch {
      throw new Error("PostgreSQL client could not start; private diagnostics withheld");
    }
    this.startedAt = performance.now();
    this.state.client_timing.deadline_ms = options?.deadlineMs ?? null;
    this.child.stderr.on("data", (chunk: Buffer) => this.classifyStderr(chunk));
    this.child.stdout.on("data", (chunk: Buffer) => this.receive(chunk));
    this.child.on("error", () => this.fail("CLIENT_PROCESS_ERROR"));
    this.child.stdin.on("error", () => this.fail("CLIENT_PROCESS_ERROR"));
    this.child.on("close", (code: number | null, signal: NodeJS.Signals | null) => {
      this.clearDeadline();
      this.clearDrains();
      this.state.client_timing.exit_ms = this.elapsed();
      this.closed = true;
      this.state.client_exit = { observed: true, code, signal };
      if (this.pending || code !== 0 || signal)
        this.fail(signal ? "CLIENT_SIGNAL" : code ? "CLIENT_EXIT" : "UNKNOWN");
      this.stderrTail = "";
      this.buffer = "";
      this.output = "";
      this.exitResolve();
    });
    // psql -W asks privately using its controlling terminal. This client-only marker can only
    // be processed after connect succeeds; it proves neither server identity nor SQL success.
    try {
      this.child.stdin.write(`\\echo ${this.connectedMarker}\n`);
    } catch {
      this.fail("CLIENT_PROCESS_ERROR");
    }
    if (options?.deadlineMs !== undefined) {
      this.deadline = setTimeout(() => {
        this.state.client_timing.deadline_fired_ms = this.elapsed();
        this.fail("CLIENT_DEADLINE");
        this.terminate("SIGTERM");
        if (!this.closed)
          this.deadlineKill = setTimeout(() => {
            if (!this.closed) this.terminate("SIGKILL");
          }, 250);
      }, options.deadlineMs);
    }
  }

  private classifyStderr(chunk: Buffer) {
    // Retain at most 8 KiB solely in memory, including split diagnostic lines. Never publish it.
    this.stderrTail = (this.stderrTail + chunk.toString()).slice(-8192);
    const value = this.stderrTail;
    const state = value.match(
      /(?:^|\n)(?:psql:[^\n]{0,256}:\s*)?(?:ERROR|FATAL|PANIC):\s+([0-9A-Z]{5})(?:\s|$)/,
    )?.[1];
    if (state && !this.sqlstate) {
      this.sqlstate = state;
      this.stderrClass = state.startsWith("28")
        ? "AUTHENTICATION_REJECTED"
        : state.startsWith("08")
          ? "NETWORK_TRANSPORT"
          : "SQLSTATE_ERROR";
    }
    if (!this.stderrClass) {
      if (
        /password authentication failed|authentication failed|no password supplied|no pg_hba.conf entry/i.test(
          value,
        )
      )
        this.stderrClass = "AUTHENTICATION_REJECTED";
      else if (
        /certificate verify failed|certificate verification failed|root certificate file|server certificate|SSL error|TLS error|server does not support SSL/i.test(
          value,
        )
      )
        this.stderrClass = "TLS_CERTIFICATE";
      else if (
        /could not translate host name|could not resolve hostname|name or service not known|nodename nor servname provided/i.test(
          value,
        )
      )
        this.stderrClass = "DNS";
      else if (
        !this.state.connection_acknowledged &&
        /timeout expired|connection timed out/i.test(value)
      )
        this.stderrClass = "CONNECTION_TIMEOUT";
      else if (
        /connection refused|network is unreachable|no route to host|connection reset|server closed the connection|connection to server was lost|SSL SYSCALL error|broken pipe|could not receive data|could not send data/i.test(
          value,
        )
      )
        this.stderrClass = "NETWORK_TRANSPORT";
    }
    // A pipe/process error can precede the child's final stderr. Enrich only an
    // unclassified fallback, retaining the first failure phase and acknowledgements.
    if (
      this.state.failure &&
      this.stderrClass &&
      [
        "CLIENT_PROCESS_ERROR",
        "CLIENT_WRITE_ERROR",
        "CLIENT_EXIT",
        "CLIENT_SIGNAL",
        "UNKNOWN",
      ].includes(this.state.failure.classification)
    ) {
      this.state.failure.classification = this.stderrClass;
      this.state.failure.sqlstate = this.sqlstate;
    }
    if (this.state.failure?.classification === this.stderrClass && !this.state.failure.sqlstate)
      this.state.failure.sqlstate = this.sqlstate;
  }

  private receive(chunk: Buffer) {
    if (this.closed || this.state.failure) return;
    if (this.buffer.length + this.output.length + chunk.length > 32 * 1024 * 1024) {
      this.fail("OUTPUT_LIMIT");
      this.terminate("SIGTERM");
      return;
    }
    this.buffer += chunk.toString();
    let index: number;
    while ((index = this.buffer.indexOf("\n")) !== -1) {
      const line = this.buffer.slice(0, index).replace(/\r$/, "");
      this.buffer = this.buffer.slice(index + 1);
      if (line === this.connectedMarker && !this.state.connection_acknowledged) {
        this.state.connection_acknowledged = true;
      } else if (this.pending && line === this.pending.marker) {
        if (!this.state.connection_acknowledged) {
          this.fail("PROTOCOL_ERROR");
          return;
        }
        const pending = this.pending;
        this.pending = undefined;
        this.state.last_acknowledged = pending.operation;
        const timing = this.state.migration_batches.find(
          (entry) => entry.ordinal === pending.operation.ordinal,
        );
        if (timing) {
          timing.acknowledgement_ms = this.elapsed();
          timing.elapsed_ms = timing.acknowledgement_ms - timing.render_started_ms;
        }
        if (pending.transaction) {
          this.state.transaction[`${pending.transaction}_acknowledged`]++;
          this.latestTransactionEvent = `${pending.transaction}_acknowledged`;
        }
        const output = this.output.trim();
        this.output = "";
        pending.resolve(output);
      } else {
        this.output += line + "\n";
      }
    }
  }

  private failurePhase() {
    if (!this.state.connection_acknowledged) return "BEFORE_CONNECTION_ACK";
    if (this.latestTransactionEvent === "commit_sent") return "AROUND_COMMIT";
    if (this.latestTransactionEvent === "commit_acknowledged") return "AFTER_COMMIT_ACK";
    if (this.latestTransactionEvent === "begin_sent") return "BEFORE_BEGIN_ACK";
    if (this.latestTransactionEvent === "rollback_sent") return "AROUND_ROLLBACK";
    if (this.latestTransactionEvent === "rollback_acknowledged") return "AFTER_ROLLBACK_ACK";
    return this.latestTransactionEvent === "begin_acknowledged"
      ? "DURING_TRANSACTION"
      : "AFTER_CONNECTION_ACK";
  }

  private fail(fallback: Classification) {
    // First failure remains authoritative even if cleanup/rollback/exit subsequently fails.
    if (!this.state.failure)
      this.state.failure = {
        classification: this.stderrClass ?? fallback,
        sqlstate: this.sqlstate,
        phase: this.failurePhase(),
      };
    this.pending?.reject(new PostgresClientError(this.state));
    this.pending = undefined;
    this.clearDrains();
    this.stderrTail = "";
    this.buffer = "";
    this.output = "";
  }

  query(sql: string, label?: OperationLabel, migrationVersion?: string): Promise<string> {
    if (this.closed || this.closing || this.state.failure)
      return Promise.reject(new Error("PostgreSQL session is unavailable; no retry attempted"));
    if (this.pending)
      return Promise.reject(new Error("Concurrent queries on one session are forbidden"));
    if (label !== undefined && !LABELS.includes(label))
      return Promise.reject(new Error("PostgreSQL operation label is not allowlisted"));
    const renderStarted = this.elapsed();
    let batch: ReturnType<typeof renderMigrationBatch> | undefined;
    if (label === "MIGRATION") {
      if (
        !migrationVersion ||
        !/^[0-9]{14}$/.test(migrationVersion) ||
        this.state.migration_batches.length >= 46
      )
        return Promise.reject(new Error("Migration timing requires a bounded reviewed version"));
      try {
        batch = renderMigrationBatch(sql);
      } catch {
        return Promise.reject(new Error("Migration batch rendering failed; SQL withheld"));
      }
    } else if (migrationVersion !== undefined) {
      return Promise.reject(new Error("Migration version is valid only for migration batches"));
    }
    const renderCompleted = this.elapsed();
    const normalized = sql.trim().toLowerCase();
    const transaction = /^begin(?:\s+read\s+only)?\s*;/.test(normalized)
      ? "begin"
      : /^commit\s*;$/.test(normalized)
        ? "commit"
        : /^rollback\s*;$/.test(normalized)
          ? "rollback"
          : null;
    const inferred =
      transaction === "begin"
        ? /^begin\s+read\s+only/.test(normalized)
          ? "BEGIN_READ_ONLY"
          : "BEGIN"
        : transaction === "commit"
          ? "COMMIT"
          : transaction === "rollback"
            ? "ROLLBACK"
            : "QUERY";
    const operation: Operation = {
      ordinal: (this.state.last_sent?.ordinal ?? 0) + 1,
      label: label ?? inferred,
    };
    return new Promise((resolve, reject) => {
      const marker = `__TEKA_${this.nonce}_RESULT_${operation.ordinal}__`;
      this.state.last_sent = operation;
      if (transaction) {
        this.state.transaction[`${transaction}_sent`]++;
        this.latestTransactionEvent = `${transaction}_sent`;
      }
      this.pending = { marker, operation, transaction, resolve, reject };
      const input = (batch?.input ?? sql + "\n") + `\\echo ${marker}\n`;
      const timing: MigrationTiming | undefined = batch
        ? {
            ordinal: operation.ordinal,
            version: migrationVersion!,
            render_started_ms: renderStarted,
            render_completed_ms: renderCompleted,
            submission_started_ms: this.elapsed(),
            input_bytes: Buffer.byteLength(input),
            expected_statement_count: batch.statements,
            write_completed_ms: null,
            backpressure: false,
            drain_completed_ms: null,
            acknowledgement_ms: null,
            elapsed_ms: null,
          }
        : undefined;
      if (timing) this.state.migration_batches.push(timing);
      try {
        // The callback proves only local Writable completion, never server receipt.
        const accepted = this.child.stdin.write(input, (error?: Error | null) => {
          if (error) {
            this.fail("CLIENT_WRITE_ERROR");
            return;
          }
          if (timing) timing.write_completed_ms = this.elapsed();
        });
        if (timing && accepted === false && !this.state.failure && !this.closed) {
          timing.backpressure = true;
          const drained = () => {
            this.drainListeners.delete(drained);
            timing.drain_completed_ms = this.elapsed();
          };
          this.drainListeners.add(drained);
          this.child.stdin.once("drain", drained);
        }
      } catch {
        this.fail("CLIENT_PROCESS_ERROR");
      }
    });
  }

  async json<T>(sql: string, label?: OperationLabel): Promise<T> {
    const result = await this.query(sql, label);
    try {
      return JSON.parse(result) as T;
    } catch {
      throw new PostgresJsonResultError();
    }
  }

  diagnostics(): SessionDiagnostics {
    return structuredClone(this.state);
  }

  private elapsed() {
    return Math.round((performance.now() - this.startedAt) * 1000) / 1000;
  }

  private clearDrains() {
    for (const listener of this.drainListeners) this.child.stdin.removeListener("drain", listener);
    this.drainListeners.clear();
  }

  private terminate(signal: NodeJS.Signals) {
    if (signal === "SIGTERM") this.state.client_timing.term_sent_ms ??= this.elapsed();
    if (signal === "SIGKILL") this.state.client_timing.kill_sent_ms ??= this.elapsed();
    try {
      this.child.kill(signal);
    } catch {
      this.fail("CLIENT_PROCESS_ERROR");
    }
  }

  private clearDeadline() {
    if (this.deadline) clearTimeout(this.deadline);
    if (this.deadlineKill) clearTimeout(this.deadlineKill);
  }

  close(): Promise<SessionDiagnostics> {
    if (this.closing) return this.closing;
    this.state.client_timing.cleanup_started_ms = this.elapsed();
    // Stop a future deadline, but preserve an escalation already armed by an expired
    // deadline. The normal CLI catch calls close() immediately after query rejection.
    if (this.deadline) clearTimeout(this.deadline);
    this.closing = (async () => {
      if (!this.closed) {
        try {
          this.child.stdin.end("\\q\n");
        } catch {
          this.fail("CLIENT_PROCESS_ERROR");
        }
        const wait = async (ms: number) => {
          let timer: ReturnType<typeof setTimeout> | undefined;
          await Promise.race([
            this.exited,
            new Promise<void>((resolve) => {
              timer = setTimeout(resolve, ms);
            }),
          ]);
          if (timer) clearTimeout(timer);
        };
        if (this.deadlineKill) {
          // The watchdog owns TERM -> 250 ms -> KILL. Allow its remaining grace
          // and a bounded exit acknowledgement, without sending duplicate signals.
          await wait(500);
        } else {
          await wait(2000);
          if (!this.closed) {
            this.terminate("SIGTERM");
            await wait(250);
          }
          if (!this.closed) {
            this.terminate("SIGKILL");
            await wait(250);
          }
        }
        if (!this.closed) this.fail("UNKNOWN");
      }
      this.clearDrains();
      this.state.client_timing.cleanup_completed_ms = this.elapsed();
      return this.diagnostics();
    })();
    return this.closing;
  }
}

export function literal(value: string) {
  return "'" + value.replaceAll("'", "''") + "'";
}
