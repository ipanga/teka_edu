# PROD access diagnostic proposal — not execution authorization

The prior operation-96 result and rejected field were not retained. The acknowledged rollback is accepted. This proposal cannot recover that historical result and does not authorize a migration retry, hosted connection, grants or permission changes.

Use one separately authorized native `psql -W` session as `congofoot_user_teka_edu_prod` against `postgresql-congofoot.alwaysdata.net:5432/congofoot_teka_edu_prod`, PostgreSQL 16, TLS `verify-full` with the reviewed CA. Private password entry, one invocation, zero retries. Proposed bounds: 10-second connection, 15-second statements, 2-second locks and 60-second supervised total deadline including password entry. These proposed limits and an exact final command require separate review and owner approval before execution.

Begin READ ONLY; restrict search_path to pg_catalog; set local statement/lock timeouts and row_security=off. ROLLBACK, successful client exit and a completion marker are required. No application data, routine body, definition deparser or application routine is read or executed. Do not create probe objects to discover default ACLs.

Only the following two metadata queries are proposed. Independently validate the first result before issuing the second. Any identity/TLS/read-only mismatch, query/visibility error, malformed output or timeout stops the session. Raw JSON, names, OIDs, ACLs and arbitrary diagnostics must not be logged or retained. Report only these fixed fields/counts.

## Query 1: exact target/session guard

```sql
SELECT pg_catalog.jsonb_build_object(
  'target_guard', pg_catalog.current_database()='congofoot_teka_edu_prod'
    AND current_user='congofoot_user_teka_edu_prod'
    AND session_user=current_user
    AND pg_catalog.current_setting('server_version_num')::integer BETWEEN 160000 AND 169999,
  'read_only', pg_catalog.current_setting('transaction_read_only')='on',
  'tls', COALESCE((SELECT ssl FROM pg_catalog.pg_stat_ssl
                  WHERE pid=pg_catalog.pg_backend_pid()),false)
);
```

Client configuration establishes verify-full hostname/CA validation; `pg_stat_ssl` independently establishes encryption. It does not itself prove verify-full. All three values must be genuine booleans equal to true.

## Query 2: narrowly scoped default-ACL and current envelope counts

```sql
WITH login AS (
  SELECT oid FROM pg_catalog.pg_roles WHERE rolname=current_user
), defaults AS (
  SELECT d.defaclobjtype, d.defaclnamespace, a.grantee,
         a.privilege_type, a.is_grantable
  FROM pg_catalog.pg_default_acl d
  JOIN login l ON l.oid=d.defaclrole
  CROSS JOIN LATERAL pg_catalog.aclexplode(d.defaclacl) a
  WHERE d.defaclobjtype IN ('r','f','n')
    AND (d.defaclnamespace=0 OR EXISTS (
      SELECT 1 FROM pg_catalog.pg_namespace n
      WHERE n.oid=d.defaclnamespace AND n.nspname IN
            ('public','private','teka_migrations','extensions')))
), disallowed AS (
  SELECT * FROM defaults d
  WHERE d.grantee<>0 AND NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles r
    WHERE r.oid=d.grantee AND r.rolname IN (current_user,'congofoot'))
)
SELECT pg_catalog.jsonb_build_object(
  'managed_owner_present', EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='congofoot'),
  'prod_to_dev_connect_denied', NOT pg_catalog.has_database_privilege(
       current_user,'congofoot_teka_edu_dev','CONNECT'),
  'explicit_default_acl_rows', (SELECT count(*) FROM defaults),
  'disallowed_table_default_rows', (SELECT count(*) FROM disallowed WHERE defaclobjtype='r'),
  'disallowed_function_default_rows', (SELECT count(*) FROM disallowed WHERE defaclobjtype='f'),
  'disallowed_schema_default_rows', (SELECT count(*) FROM disallowed WHERE defaclobjtype='n'),
  'disallowed_default_grant_options', (SELECT count(*) FROM disallowed WHERE is_grantable),
  'application_tables', (SELECT count(*) FROM pg_catalog.pg_class c
       JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='public' AND c.relkind IN ('r','p')),
  'history_relation_present', EXISTS (SELECT 1 FROM pg_catalog.pg_class c
       JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='teka_migrations' AND c.relname='history'),
  'public_create_denied', NOT EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n
       CROSS JOIN LATERAL pg_catalog.aclexplode(
          COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) a
       WHERE n.nspname='public' AND a.grantee=0 AND a.privilege_type='CREATE')
);
```

Catalog allowlist: `pg_roles`, `pg_stat_ssl`, `pg_default_acl`, `pg_namespace`, `pg_class`. Built-in allowlist: `current_database`, `current_setting`, `pg_backend_pid`, `jsonb_build_object`, `aclexplode`, `acldefault`, `has_database_privilege`, `count` and native boolean/comparison operations. No `pg_user_mapping`, application view, foreign table, user-defined type output or definition rendering is admitted.

This examines explicit defaults for objects created by the deployment login, both global and in relevant schemas. PUBLIC rows are excluded from the disallowed-default counts because the reviewed bootstrap/migrations explicitly revoke PUBLIC rights on the checked objects. No other recipient is newly approved. A nonzero count would establish a candidate default-ACL mismatch for those objects; global/local scope, object type and frozen CREATE/REVOKE statements must then be compared offline. Counts intentionally do not identify recipients or authorize remediation. Zero counts do not prove comprehensive privilege isolation or reconstruct operation 96. Other creators' defaults, membership paths and column ACLs are outside this minimal hypothesis test.

Since the migration was rolled back, no query can directly inspect its now-absent application object ACLs. This proposal distinguishes an existing default-ACL candidate from PUBLIC CREATE/isolation drift, but cannot establish the historical failed assertion conclusively. Unexpected application tables/history or failed visibility are discrepancies, never treated as an empty baseline. Any follow-up inspection, permission decision or initialization requires separate authorization.
