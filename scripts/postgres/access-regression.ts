import assert from "node:assert/strict";
import { connectionFor, type Connection } from "@/lib/postgres/target";
import { Session, PostgresJsonResultError } from "@/lib/postgres/session";
import {
  ACCESS_FIELDS,
  sanitizedAccessFailure,
  type AccessField,
} from "@/lib/postgres/access-result";
import { initialize } from "@/lib/postgres/runner";
import { verifyAccess } from "@/lib/postgres/verify";

/** Synthetic negative tests only; no hosted targets or DEV sessions are accepted. */
export async function accessSecurityRegression(connection: Connection) {
  assert.equal(connection.target, "local");
  connectionFor("local", connection.env);
  const fixture = new Session({
    ...connection,
    login: "postgres",
    env: { ...connection.env, PGUSER: "postgres", PGPASSWORD: undefined, PGPASSFILE: "/dev/null" },
  });
  const session = new Session(connection, { deadlineMs: 120000 });
  const results: { case: string; failed_fields: AccessField[] }[] = [];
  try {
    assert.equal(
      await fixture.json<boolean>(
        "select to_jsonb(current_database()='teka_portability' and current_user='postgres' and current_setting('server_version_num')::integer between 160000 and 169999);",
      ),
      true,
    );
    assert.equal(
      await fixture.json<boolean>(
        "select to_jsonb(not exists(select 1 from pg_roles where rolname in ('congofoot','teka_access_probe')) and not exists(select 1 from pg_database where datname='congofoot_teka_edu_dev'));",
      ),
      true,
      "fresh isolated security fixture required",
    );
    await fixture.query(
      "create role teka_access_probe nologin nosuperuser nocreatedb nocreaterole noreplication nobypassrls; create role congofoot_readonly_user_teka_edu_prod login nosuperuser nocreatedb nocreaterole noreplication nobypassrls;",
    );
    // Empty local permission-catalog stub. Never connect to the DEV-named database.
    await fixture.query("create database congofoot_teka_edu_dev owner teka_migrator;");
    await fixture.query(
      "revoke connect on database congofoot_teka_edu_dev from public,teka_migrator;",
    );
    await initialize(session, connection);
    await session.query("begin;");
    async function probe(name: string, sql: string | null, failed: AccessField[]) {
      await session.query("savepoint access_probe;");
      try {
        if (sql) await session.query(sql);
        if (failed.length) {
          await assert.rejects(verifyAccess(session, true, true), (error: unknown) => {
            assert.deepEqual(sanitizedAccessFailure(error), {
              classification: "ACCESS_ASSERTION_FAILED",
              failed_fields: ACCESS_FIELDS.filter((field) => failed.includes(field)),
            });
            return true;
          });
        } else {
          const result = await verifyAccess(session, true, true);
          assert(ACCESS_FIELDS.every((field) => result[field] === true));
        }
        results.push({ case: name, failed_fields: failed });
      } finally {
        await session.query("rollback to savepoint access_probe; release savepoint access_probe;");
      }
    }
    await probe("valid_missing_managed_owner", null, []);
    for (const [name, sql, field] of [
      [
        "table",
        "grant select on public.education_stages to teka_access_probe;",
        "table_privileges",
      ],
      [
        "function",
        "grant execute on all functions in schema private to teka_access_probe;",
        "function_privileges",
      ],
      ["schema", "grant usage on schema private to teka_access_probe;", "schema_privileges"],
    ] as const)
      await probe("missing_managed_owner_" + name, sql, [field]);
    await fixture.query(
      "create role congofoot nologin nosuperuser nocreatedb nocreaterole noreplication nobypassrls;",
    );
    await probe("valid_managed_owner", null, []);
    await probe(
      "approved_managed_recipient",
      "grant select on public.education_stages to congofoot;",
      [],
    );
    for (const [name, sql, field] of [
      ["rls", "alter table public.education_stages disable row level security;", "rls"],
      [
        "policies",
        "create policy access_probe on public.education_stages for select using (true);",
        "policies",
      ],
      [
        "table",
        "grant select on public.education_stages to teka_access_probe;",
        "table_privileges",
      ],
      [
        "function",
        "grant execute on all functions in schema private to teka_access_probe;",
        "function_privileges",
      ],
      ["schema", "grant usage on schema private to teka_access_probe;", "schema_privileges"],
      ["public_create", "grant create on schema public to public;", "public_schema_create"],
      [
        "dev_connect",
        "grant connect on database congofoot_teka_edu_dev to teka_migrator;",
        "cross_environment_isolation",
      ],
      ["extension", "drop extension btree_gist cascade;", "btree_gist"],
      [
        "security_definer",
        "alter function private.check_dated_row_within_school_year() security definer;",
        "function_privileges",
      ],
      [
        "future_default_acl",
        "alter default privileges in schema public grant select on tables to teka_access_probe; create table public.access_default_probe(id integer); alter table public.access_default_probe enable row level security;",
        "table_privileges",
      ],
    ] as const)
      // PUBLIC CREATE also reaches the auditor; the PROD role-profile guard rejects it.
      await probe(name, sql, name === "public_create" ? ["table_privileges", field] : [field]);
    await assert.rejects(session.json("select 'invalid JSON'::text;"), PostgresJsonResultError);
    assert.equal(
      session.diagnostics().failure,
      null,
      "parse failure must not be reported as a PostgreSQL error",
    );
    await session.query("rollback;");
    const closed = await session.close();
    assert.equal(closed.transaction.rollback_acknowledged, 1);
    assert.equal(closed.client_exit.code, 0);
    assert.equal(closed.failure, null);
    return {
      status: "PASS",
      cases: results,
      malformed_json_rejected: true,
      rollback_acknowledged: true,
      client_exit: 0,
      automatic_retries: 0,
    };
  } finally {
    await session.close();
    await fixture.close();
  }
}
