import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const script = readFileSync(
  new URL("../../scripts/postgres/production-state.psql", import.meta.url),
  "utf8",
);
const documentation = readFileSync(
  new URL("../../docs/migration/alwaysdata/PROD_STATE_INSPECTION.md", import.meta.url),
  "utf8",
);

/** Offline branch simulation only: no psql, SQL parser, process or connection. */
function simulate(options: {
  identity?: boolean;
  history?: boolean;
  shape?: boolean;
  countError?: boolean;
  catalogError?: boolean;
}) {
  const variables: Record<string, string> = {};
  const statements: string[] = [];
  const markers: string[] = [];
  const branches: { parent: boolean; condition: boolean; active: boolean }[] = [];
  let buffer = "";
  const active = () => branches.every((branch) => branch.active);
  function statement() {
    const sql = buffer.trim();
    buffer = "";
    if (!sql) return;
    statements.push(sql);
    if (sql.includes("AS identity_session_guard"))
      variables.identity_session_guard = String(options.identity ?? true);
    else if (sql.includes("AS history_exists"))
      variables.history_exists = String(options.history ?? false);
    else if (sql.includes("AS history_shape_guard"))
      variables.history_shape_guard = String(options.shape ?? true);
    else if (sql.includes("AS history_records FROM ONLY")) {
      if (options.countError) throw new Error("QUERY_FAILED");
      variables.history_records = "46";
    } else if (sql.startsWith("WITH namespaces") && options.catalogError)
      throw new Error("QUERY_FAILED");
    else if (/SELECT 1 \/ 0/.test(sql)) throw new Error("GUARD_REJECTED");
  }
  try {
    for (const rawLine of script.split("\n")) {
      const line = rawLine.replace(/--.*$/, "").trim();
      if (!line) continue;
      if (line.startsWith("\\if ")) {
        const variable = line.slice(5).trim();
        const condition = variables[variable] === "true";
        const parent = active();
        branches.push({ parent, condition, active: parent && condition });
      } else if (line === "\\else") {
        const branch = branches.at(-1)!;
        branch.active = branch.parent && !branch.condition;
      } else if (line === "\\endif") branches.pop();
      else if (!active()) continue;
      else if (line.startsWith("\\set ")) {
        const [, variable, value] = line.split(/\s+/);
        if (!variable || value === undefined) throw new Error("INVALID_SET");
        variables[variable] = value;
      } else if (line === "\\gset") statement();
      else if (line.startsWith("\\echo ")) markers.push(line.slice(6));
      else {
        buffer += (buffer ? "\n" : "") + line;
        if (line.endsWith(";")) statement();
      }
    }
    if (branches.length || buffer.trim()) throw new Error("INCOMPLETE_SCRIPT");
    return { status: "COMPLETE", statements, markers, variables };
  } catch (error) {
    return { status: (error as Error).message, statements, markers, variables };
  }
}

describe("minimal native PROD state inspection (offline only)", () => {
  it("safely skips the missing history relation without parsing a row query or lock", () => {
    const result = simulate({ history: false });
    expect(result.status).toBe("COMPLETE");
    expect(result.variables.history_records).toBe("0");
    expect(result.statements.some((sql) => /LOCK TABLE|FROM ONLY/.test(sql))).toBe(false);
    expect(result.markers.at(-1)).toBe("TEKA_INSPECTION_COMPLETE");
  });

  it("checks history shape under ACCESS SHARE before one aggregate-only count", () => {
    const result = simulate({ history: true });
    expect(result.status).toBe("COMPLETE");
    expect(result.variables.history_records).toBe("46");
    const lock = result.statements.findIndex((sql) => sql.startsWith("LOCK TABLE ONLY"));
    const shape = result.statements.findIndex((sql) => sql.includes("AS history_shape_guard"));
    const count = result.statements.findIndex((sql) =>
      sql.includes("AS history_records FROM ONLY"),
    );
    expect(lock).toBeGreaterThan(0);
    expect(shape).toBeGreaterThan(lock);
    expect(count).toBeGreaterThan(shape);
    expect(
      result.statements.filter((sql) => sql.includes("AS history_records FROM ONLY")),
    ).toHaveLength(1);
  });

  it("stops on identity rejection before any object inspection", () => {
    const result = simulate({ identity: false, history: true });
    expect(result.status).toBe("GUARD_REJECTED");
    expect(result.markers).toContain("TEKA_FAILURE_IDENTITY_SESSION_TLS_GUARD");
    expect(result.statements.some((sql) => sql.includes("AS history_exists"))).toBe(false);
    expect(result.markers).not.toContain("TEKA_INSPECTION_COMPLETE");
  });

  it("never reads unsafe, RLS-filtered or inaccessible history as zero", () => {
    const result = simulate({ history: true, shape: false });
    expect(result.status).toBe("GUARD_REJECTED");
    expect(result.markers).toContain("TEKA_FAILURE_HISTORY_VISIBILITY_OR_SHAPE");
    expect(result.statements.some((sql) => sql.includes("AS history_records FROM ONLY"))).toBe(
      false,
    );
    expect(result.markers).not.toContain("TEKA_INSPECTION_COMPLETE");
  });

  it.each([{ countError: true }, { catalogError: true }])(
    "does not produce completion on a query error: %o",
    (failure) => {
      const result = simulate({ history: true, ...failure });
      expect(result.status).toBe("QUERY_FAILED");
      expect(result.markers).not.toContain("TEKA_PHASE_READ_ONLY_ROLLBACK_ACKNOWLEDGED");
      expect(result.markers).not.toContain("TEKA_INSPECTION_COMPLETE");
    },
  );

  it("contains only read-only controls, SELECTs and allowed psql control flow", () => {
    const paths = [simulate({ history: true }), simulate({ identity: false })];
    for (const result of paths)
      for (const sql of result.statements)
        expect(sql).toMatch(
          /^(BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY|SELECT\b|WITH namespaces\b|LOCK TABLE ONLY teka_migrations\.history IN ACCESS SHARE MODE|ROLLBACK;)/,
        );
    const meta = [...script.matchAll(/^\\(\w+)/gm)].map((match) => match[1]!);
    expect(
      meta.every((name) => ["set", "echo", "gset", "if", "else", "endif"].includes(name)),
    ).toBe(true);
    expect(script).not.toMatch(/\\(?:gexec|copy|connect|include|i|o|!)(?:\s|$)/m);
    expect(script).not.toMatch(
      /\b(?:INSERT INTO|UPDATE |DELETE FROM|CREATE |ALTER |DROP |CALL |DO \$|COMMIT;)/,
    );
    expect(script).not.toMatch(/pg_get_|pg_user_mapping|pg_authid|pg_read_file|pg_ls_dir/);
  });

  it("preserves exact identity and fail-closed session/TLS checks", () => {
    for (const required of [
      "current_database() = 'congofoot_teka_edu_prod'",
      "CURRENT_USER = 'congofoot_user_teka_edu_prod'",
      "SESSION_USER = 'congofoot_user_teka_edu_prod'",
      "current_setting('server_version_num')::integer = 160015",
      "current_setting('default_transaction_read_only') = 'on'",
      "current_setting('transaction_read_only') = 'on'",
      "current_setting('row_security') = 'off'",
      "current_setting('search_path') = 'pg_catalog'",
      "pg_catalog.pg_stat_ssl",
      "pg_catalog.pg_backend_pid()",
      "\\set ON_ERROR_STOP on",
      "\\set VERBOSITY sqlstate",
    ])
      expect(script).toContain(required);
  });

  it("gates relation/type/RLS/index paths before history access", () => {
    for (const required of [
      "c.relkind = 'r' AND c.relam = 2",
      "NOT c.relrowsecurity AND NOT c.relforcerowsecurity",
      "pg_catalog.has_table_privilege(c.oid, 'SELECT')",
      "pg_catalog.has_schema_privilege(n.oid, 'USAGE')",
      "pg_catalog.pg_inherits",
      "pg_catalog.pg_rewrite",
      "atttypid = 25",
      "atttypid = 1184",
      "ix.relam = 403",
      "i.indexprs IS NULL AND i.indpred IS NULL",
      "onsp.nspname = 'pg_catalog'",
      "oc.opcname = 'text_ops'",
    ])
      expect(script).toContain(required);
    expect(script).toContain("'history_exists', :'history_exists'::boolean");
  });

  it("prepares one pinned native invocation with unambiguous password identity", () => {
    const command = documentation.split("```sh\n")[1]?.split("\n```")[0];
    if (!command) throw new Error("Missing prepared native command");
    expect(command.match(/\/bin\/psql\b/g)).toHaveLength(1);
    for (const required of [
      "ENVIRONMENT: ALWAYSDATA PRODUCTION (PROD)",
      "Password required: Alwaysdata PostgreSQL PROD password",
      "/usr/bin/env -i",
      "PGHOST=postgresql-congofoot.alwaysdata.net PGPORT=5432",
      "PGDATABASE=congofoot_teka_edu_prod PGUSER=congofoot_user_teka_edu_prod",
      "PGSSLMODE=verify-full",
      "PGSSLROOTCERT=/opt/homebrew/etc/ca-certificates/cert.pem",
      "PGCONNECT_TIMEOUT=10 PGPASSFILE=/dev/null",
      "default_transaction_read_only=on",
      "statement_timeout=15s",
      "lock_timeout=2s",
      "-X -W -qAt -v ON_ERROR_STOP=1 -v VERBOSITY=sqlstate",
    ])
      expect(command).toContain(required);
    expect(command).not.toMatch(/PGPASSWORD|pg_dump|postgres-migrate|\b(?:tee|script)\b/);
    expect(documentation).toContain("fresh owner approval");
    expect(documentation).toContain("client exit 0");
    expect(documentation).toContain("TEKA_INSPECTION_COMPLETE");
  });
});
