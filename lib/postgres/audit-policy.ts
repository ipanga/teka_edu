import { Session } from "./session";
import { AccessValidationError } from "./access-result";

/** PROD consultation is distinct from the deployment login and managed owner. */
export const PRODUCTION_AUDIT_ROLE = "congofoot_readonly_user_teka_edu_prod";
export const PRIVATE_AUDIT_ROUTINES = [
  "check_dated_row_within_school_year",
  "check_school_year_contains_dated_rows",
] as const;

/** No elevated attributes, ownership, memberships, schema creation or DEV access. */
export function auditRoleGuardSql() {
  return `exists (select 1 from pg_catalog.pg_roles ar
    where ar.rolname='${PRODUCTION_AUDIT_ROLE}' and ar.rolcanlogin
      and not ar.rolsuper and not ar.rolcreatedb and not ar.rolcreaterole
      and not ar.rolreplication and not ar.rolbypassrls
      and not exists (select 1 from pg_catalog.pg_auth_members m where m.member=ar.oid)
      and exists (select 1 from pg_catalog.pg_database d where d.datname='congofoot_teka_edu_dev')
      and not pg_catalog.has_database_privilege(ar.oid,'congofoot_teka_edu_dev','CONNECT')
      and not pg_catalog.has_database_privilege(ar.oid,current_database(),'CREATE')
      and pg_catalog.has_database_privilege(ar.oid,current_database(),'CONNECT')
      and not exists (select 1 from pg_catalog.pg_database d where d.datname=current_database() and d.datdba=ar.oid)
      and not exists (select 1 from pg_catalog.pg_namespace n where n.nspname in ('public','private','extensions','teka_migrations')
        and (n.nspowner=ar.oid or pg_catalog.has_schema_privilege(ar.oid,n.oid,'CREATE')
          or (n.nspname<>'public' and pg_catalog.has_schema_privilege(ar.oid,n.oid,'USAGE'))))
      and not exists (select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
        where n.nspname in ('public','private','extensions','teka_migrations') and c.relowner=ar.oid)
      and not exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
        where n.nspname in ('public','private','extensions','teka_migrations') and p.proowner=ar.oid))`;
}

/** Only freshly initialized PROD calls this after exact source-shape validation.
 * No global defaults change; history consultation is deliberately not approved.
 * Assigned transaction ID requires prior writes in the still-open transaction.
 */
export async function restrictProductionAuditObjects(session: Session) {
  const guard = await session.json<unknown>(
    `select pg_catalog.to_jsonb(
    pg_catalog.pg_current_xact_id_if_assigned() is not null
    and pg_catalog.current_setting('transaction_read_only')='off'
    and ${auditRoleGuardSql()}
    and (select count(*)=2 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
      where n.nspname='private' and p.proname in ('${PRIVATE_AUDIT_ROUTINES.join("','")}')
        and p.pronargs=0 and p.prorettype=2279 and not p.prosecdef
        and p.proowner=(select oid from pg_catalog.pg_roles where rolname=current_user))
    and exists (select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='teka_migrations' and c.relname='history' and c.relkind='r'
        and c.relowner=(select oid from pg_catalog.pg_roles where rolname=current_user))
  );`,
    "ACCESS",
  );
  if (guard !== true) throw new AccessValidationError("ACCESS_AUDIT_GUARD");
  await session.query(
    `revoke execute on function ${PRIVATE_AUDIT_ROUTINES.map((name) => `private.${name}()`).join(",")} from ${PRODUCTION_AUDIT_ROLE};
     revoke all privileges on table teka_migrations.history from ${PRODUCTION_AUDIT_ROLE};`,
    "ACCESS",
  );
}
