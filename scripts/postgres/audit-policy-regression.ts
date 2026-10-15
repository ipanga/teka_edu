import assert from "node:assert/strict";
import { Session } from "@/lib/postgres/session";
import { connectionFor, type Connection } from "@/lib/postgres/target";
import { verifyAccess } from "@/lib/postgres/verify";
import {
  ACCESS_FIELDS,
  sanitizedAccessFailure,
  type AccessField,
} from "@/lib/postgres/access-result";
import {
  PRODUCTION_AUDIT_ROLE as audit,
  restrictProductionAuditObjects,
} from "@/lib/postgres/audit-policy";

/** Only the exact full isolated PG16 replay fixture; never a hosted/session target. */
export async function auditPolicyRegression(connection: Connection) {
  assert.equal(connection.target, "local");
  connectionFor("local", connection.env);
  const fixture = new Session({
    ...connection,
    login: "postgres",
    env: { ...connection.env, PGUSER: "postgres", PGPASSWORD: undefined, PGPASSFILE: "/dev/null" },
  });
  const cases: { case: string; failed_fields: AccessField[] }[] = [];
  try {
    assert.equal(
      await fixture.json<boolean>(
        "select to_jsonb(current_database()='teka_portability' and current_user='postgres' and current_setting('server_version_num')::integer between 160000 and 169999);",
      ),
      true,
    );
    await fixture.query("begin; set local role teka_migrator;");
    await fixture.query(
      `alter default privileges grant select on tables to ${audit}; alter default privileges grant execute on functions to ${audit}; grant select on all tables in schema public to ${audit}; grant execute on function private.check_dated_row_within_school_year(),private.check_school_year_contains_dated_rows() to ${audit}; grant select on table teka_migrations.history to ${audit};`,
    );
    async function check(name: string, failed: AccessField[]) {
      if (failed.length) {
        await assert.rejects(verifyAccess(fixture, true, true), (error: unknown) => {
          assert.deepEqual(sanitizedAccessFailure(error), {
            classification: "ACCESS_ASSERTION_FAILED",
            failed_fields: ACCESS_FIELDS.filter((field) => failed.includes(field)),
          });
          return true;
        });
      } else {
        const value = await verifyAccess(fixture, true, true);
        assert(ACCESS_FIELDS.every((field) => value[field] === true));
      }
      cases.push({ case: name, failed_fields: failed });
    }
    await check("inherited_function_and_history_access_rejected", [
      "function_privileges",
      "schema_privileges",
    ]);
    await restrictProductionAuditObjects(fixture);
    await check("named_SELECT_only_after_exact_object_restrictions", []);
    assert.equal(
      await fixture.json<boolean>(
        `select to_jsonb(not has_table_privilege('${audit}','teka_migrations.history','SELECT') and not has_function_privilege('${audit}','private.check_dated_row_within_school_year()','EXECUTE') and exists(select 1 from pg_default_acl d cross join lateral aclexplode(d.defaclacl) a where d.defaclrole=(select oid from pg_roles where rolname=current_user) and a.grantee=(select oid from pg_roles where rolname='${audit}') and d.defaclobjtype='f' and a.privilege_type='EXECUTE'));`,
      ),
      true,
      "object restrictions do not change provider defaults",
    );
    for (const [name, sql, failed, bootstrap] of [
      ...["INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"].map(
        (right) =>
          [
            right,
            `grant ${right} on public.education_stages to ${audit};`,
            ["table_privileges"],
            false,
          ] as const,
      ),
      [
        "SELECT_grant_option",
        `grant select on public.education_stages to ${audit} with grant option;`,
        ["table_privileges"],
        false,
      ],
      [
        "column_write",
        `grant update(name) on public.education_stages to ${audit};`,
        ["table_privileges"],
        false,
      ],
      [
        "PUBLIC_write",
        "grant insert on public.education_stages to public;",
        ["table_privileges"],
        false,
      ],
      [
        "other_recipient",
        "grant select on public.education_stages to teka_access_probe;",
        ["table_privileges"],
        false,
      ],
      [
        "history_column_read",
        `grant select(version) on teka_migrations.history to ${audit};`,
        ["schema_privileges"],
        false,
      ],
      [
        "column_SELECT_grant_option",
        `grant select(name) on public.education_stages to ${audit} with grant option;`,
        ["table_privileges"],
        false,
      ],
      [
        "PUBLIC_column_SELECT",
        "grant select(name) on public.education_stages to public;",
        ["table_privileges"],
        false,
      ],
      [
        "audit_private_USAGE",
        `grant usage on schema private to ${audit};`,
        ["table_privileges", "schema_privileges"],
        false,
      ],
      [
        "audit_ownership",
        `alter table public.education_stages owner to ${audit};`,
        ["table_privileges"],
        true,
      ],
      [
        "history_read",
        `grant select on teka_migrations.history to ${audit};`,
        ["schema_privileges"],
        false,
      ],
      [
        "private_EXECUTE",
        `grant execute on function private.check_dated_row_within_school_year() to ${audit};`,
        ["function_privileges"],
        false,
      ],
      [
        "future_table",
        "create table public.audit_unapproved_future(id integer); alter table public.audit_unapproved_future enable row level security;",
        ["table_privileges"],
        false,
      ],
      [
        "future_private_routine",
        "create function private.audit_unapproved_future() returns integer language sql as 'select 1'; revoke execute on function private.audit_unapproved_future() from public;",
        ["function_privileges"],
        false,
      ],
      [
        "SECURITY_DEFINER",
        "alter function private.check_dated_row_within_school_year() security definer;",
        ["function_privileges"],
        false,
      ],
      [
        "audit_DEV_CONNECT",
        `grant connect on database congofoot_teka_edu_dev to ${audit};`,
        ["table_privileges"],
        true,
      ],
      [
        "audit_schema_CREATE",
        `grant create on schema public to ${audit};`,
        ["table_privileges"],
        false,
      ],
      ["membership", `grant congofoot to ${audit};`, ["table_privileges"], true],
      ["BYPASSRLS", `alter role ${audit} bypassrls;`, ["table_privileges"], true],
      [
        "audit_role_missing",
        `alter role ${audit} rename to audit_missing_fixture;`,
        ["table_privileges"],
        true,
      ],
    ] as const) {
      await fixture.query("savepoint audit_probe;");
      try {
        if (bootstrap) await fixture.query("reset role;");
        await fixture.query(sql);
        if (bootstrap) await fixture.query("set local role teka_migrator;");
        await check(name, [...failed] as AccessField[]);
      } finally {
        await fixture.query("rollback to savepoint audit_probe; release savepoint audit_probe;");
      }
      await check(name + "_rollback_restores_policy", []);
    }
    await fixture.query("rollback;");
    const closed = await fixture.close();
    assert.equal(closed.transaction.rollback_acknowledged, 1);
    assert.equal(closed.client_exit.code, 0);
    assert.equal(closed.failure, null);
    return {
      status: "PASS",
      cases,
      provider_defaults_unchanged: true,
      rollback_acknowledged: true,
      automatic_retries: 0,
    };
  } finally {
    await fixture.close();
  }
}
