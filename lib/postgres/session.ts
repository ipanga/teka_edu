import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import type { Connection } from "./target";

/** A single psql process preserves transaction/advisory-lock identity across queries. */
export class Session {
  private child: ChildProcessWithoutNullStreams;
  private buffer = "";
  private diagnostic = "";
  private next = 0;
  private closed = false;
  private pending?: {
    marker: string;
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  };
  constructor(connection: Connection) {
    this.child = spawn("psql", ["-X", "-qAt", "--no-password", "-v", "ON_ERROR_STOP=1"], {
      env: connection.env,
    });
    this.child.stderr.on("data", (chunk: Buffer) => {
      this.diagnostic += chunk.toString();
    });
    this.child.stdout.on("data", (chunk: Buffer) => {
      this.buffer += chunk.toString();
      if (!this.pending) return;
      const index = this.buffer.indexOf(this.pending.marker + "\n");
      if (index === -1) return;
      const output = this.buffer.slice(0, index).trim();
      this.buffer = this.buffer.slice(index + this.pending.marker.length + 1);
      const pending = this.pending;
      this.pending = undefined;
      pending.resolve(output);
    });
    const fail = () => {
      this.closed = true;
      let message = this.diagnostic.trim() || "psql process failed or disconnected";
      if (connection.env.PGPASSWORD)
        message = message.replaceAll(connection.env.PGPASSWORD, "[redacted]");
      this.pending?.reject(new Error(message));
      this.pending = undefined;
    };
    this.child.on("error", fail);
    this.child.on("close", fail);
    this.child.stdin.on("error", fail);
  }
  query(sql: string): Promise<string> {
    if (this.closed) return Promise.reject(new Error("psql session is closed"));
    if (this.pending)
      return Promise.reject(new Error("Concurrent queries on one session are forbidden"));
    return new Promise((resolve, reject) => {
      const marker = `__TEKA_RESULT_${++this.next}__`;
      this.pending = { marker, resolve, reject };
      this.child.stdin.write(sql + `\n\\echo ${marker}\n`);
    });
  }
  async json<T>(sql: string): Promise<T> {
    return JSON.parse(await this.query(sql)) as T;
  }
  close() {
    this.child.stdin.end("\\q\n");
  }
}
export function literal(value: string) {
  return "'" + value.replaceAll("'", "''") + "'";
}
