import { PostgresClientError } from "@/lib/postgres/session";

/** The reviewed pg_temp assertion helpers raise P0001, never raw server text. */
export function isManagedAssertionFailure(error: unknown): boolean {
  return (
    error instanceof PostgresClientError &&
    error.diagnostics.connection_acknowledged &&
    error.diagnostics.failure?.classification === "SQLSTATE_ERROR" &&
    error.diagnostics.failure.sqlstate === "P0001" &&
    error.diagnostics.failure.phase === "AFTER_CONNECTION_ACK"
  );
}
