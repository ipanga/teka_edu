-- P1-A PROPOSAL ONLY: direct catalog metadata; no definition/type deparsing.
-- Requires a separately authorized identity.sql PASS plus client TLS verify-full proof.
-- Guard mismatch returns one BLOCKED record, never an empty inventory interpreted as PASS.
-- One SELECT gives one MVCC catalog snapshot. Missing/denied catalogs mean NOT VERIFIED.
-- Role/database name scope excludes unrelated shared-cluster tenants.
-- Fixed guard retains reviewed pg_roles/pg_stat_ssl system metadata views only.
-- Expression bodies, raw node trees, routine source and definition hashes are not read out.
-- Object OIDs/presence/flags do not establish definition equality or schema equivalence.
WITH
guard AS MATERIALIZED (
  SELECT (
    pg_catalog.current_database() = 'congofoot_teka_edu_prod'
    AND SESSION_USER = 'congofoot_readonly_user_teka_edu_prod'
    AND CURRENT_USER = SESSION_USER
    AND pg_catalog.current_setting('server_version_num')::integer BETWEEN 160000 AND 169999
    AND pg_catalog.current_setting('transaction_read_only') = 'on'
    AND pg_catalog.current_setting('default_transaction_read_only') = 'on'
    AND pg_catalog.current_setting('row_security') = 'off'
    AND pg_catalog.current_setting('search_path') = 'pg_catalog'
    AND pg_catalog.current_setting('statement_timeout') = '15s'
    AND pg_catalog.current_setting('lock_timeout') = '2s'
    AND pg_catalog.inet_server_port() = 5432
    AND EXISTS (
      SELECT 1 FROM pg_catalog.pg_roles r
      WHERE r.rolname = SESSION_USER AND r.rolcanlogin
        AND NOT r.rolsuper AND NOT r.rolcreatedb AND NOT r.rolcreaterole
        AND NOT r.rolreplication AND NOT r.rolbypassrls
    )
    AND EXISTS (
      SELECT 1 FROM pg_catalog.pg_stat_ssl s
      WHERE s.pid = pg_catalog.pg_backend_pid() AND s.ssl
    )
  ) IS TRUE AS ok
),
roles AS MATERIALIZED (
  SELECT r.oid, r.rolname, r.rolcanlogin, r.rolsuper, r.rolcreatedb, r.rolcreaterole,
    r.rolreplication, r.rolbypassrls, r.rolinherit, r.rolconnlimit
  FROM pg_catalog.pg_roles r
  WHERE r.rolname IN (
    SESSION_USER, 'congofoot_user_teka_edu_prod', 'congofoot_user_teka_edu_dev'
  )
),
schemas AS MATERIALIZED (
  SELECT n.oid, n.nspname, n.nspowner, n.nspacl FROM pg_catalog.pg_namespace n
  WHERE n.nspname <> 'information_schema' AND n.nspname !~ '^pg_'
),
relations AS MATERIALIZED (
  SELECT c.oid, c.relname, c.relkind, c.relowner, c.relacl, c.relpersistence,
    c.relispartition, c.relrowsecurity, c.relforcerowsecurity, c.reltuples,
    n.nspname, am.amname
  FROM pg_catalog.pg_class c JOIN schemas n ON n.oid = c.relnamespace
  LEFT JOIN pg_catalog.pg_am am ON am.oid = c.relam
),
routines AS MATERIALIZED (
  SELECT p.oid, p.proname, p.proowner, p.prokind, p.prosecdef, p.provolatile,
    p.proacl, p.pronargs, p.pronargdefaults, p.proargtypes, p.proallargtypes,
    p.proargmodes, p.prorettype, p.provariadic,
    p.proconfig IS NOT NULL AS has_configuration,
    p.proargdefaults IS NOT NULL AS has_argument_defaults,
    p.prosqlbody IS NOT NULL AS has_sql_body, n.nspname, l.lanname
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_catalog.pg_language l ON l.oid = p.prolang
  WHERE n.oid IN (SELECT oid FROM schemas) OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_depend d
    WHERE d.classid='pg_catalog.pg_proc'::pg_catalog.regclass
      AND d.objid=p.oid AND d.deptype='e'
      AND d.refclassid='pg_catalog.pg_extension'::pg_catalog.regclass
  )
)
SELECT CASE WHEN NOT guard.ok THEN
  pg_catalog.jsonb_build_object('status', 'BLOCKED_IDENTITY_OR_SESSION_GUARD')
ELSE pg_catalog.jsonb_build_object(
  'status', 'METADATA_ONLY_NOT_DATABASE_ACCEPTANCE',
  'captured_at', pg_catalog.statement_timestamp(),
  'roles', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid', r.oid, 'name', r.rolname, 'login', r.rolcanlogin, 'superuser', r.rolsuper,
    'createdb', r.rolcreatedb, 'createrole', r.rolcreaterole,
    'replication', r.rolreplication, 'bypassrls', r.rolbypassrls,
    'inherit', r.rolinherit, 'connection_limit', r.rolconnlimit,
    'catalog_only_not_authenticated', r.rolname <> SESSION_USER
  ) ORDER BY r.rolname) FROM roles r), '[]'::pg_catalog.jsonb),
  'reachable_roles', COALESCE((
    SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'from', a.rolname, 'role', b.rolname,
      'role_superuser', b.rolsuper, 'role_createdb', b.rolcreatedb,
      'role_createrole', b.rolcreaterole, 'role_replication', b.rolreplication,
      'role_bypassrls', b.rolbypassrls,
      'member', pg_catalog.pg_has_role(a.oid,b.oid,'MEMBER'),
      'inherited', pg_catalog.pg_has_role(a.oid,b.oid,'USAGE'),
      'can_set_role', pg_catalog.pg_has_role(a.oid,b.oid,'SET'),
      'admin', pg_catalog.pg_has_role(a.oid,b.oid,'MEMBER WITH ADMIN OPTION')
    ) ORDER BY a.rolname,b.rolname)
    FROM roles a CROSS JOIN pg_catalog.pg_roles b
    WHERE a.oid <> b.oid AND pg_catalog.pg_has_role(a.oid,b.oid,'MEMBER')
  ), '[]'::pg_catalog.jsonb),
  'databases', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid', d.oid, 'name', d.datname, 'owner_oid', d.datdba,
    'owner', pg_catalog.pg_get_userbyid(d.datdba),
    'allow_connections', d.datallowconn, 'acl', d.datacl,
    'effective_connect', pg_catalog.has_database_privilege(r.oid,d.oid,'CONNECT'),
    'effective_create', pg_catalog.has_database_privilege(r.oid,d.oid,'CREATE'),
    'effective_temp', pg_catalog.has_database_privilege(r.oid,d.oid,'TEMPORARY'),
    'role', r.rolname
  ) ORDER BY d.datname,r.rolname)
    FROM pg_catalog.pg_database d CROSS JOIN roles r
    WHERE d.datname ~ '^congofoot_' OR d.datname = pg_catalog.current_database()
  ), '[]'::pg_catalog.jsonb),
  'other_database_connect_counts', COALESCE((SELECT pg_catalog.jsonb_agg(
    pg_catalog.jsonb_build_object('role',r.rolname,'count',
      (SELECT pg_catalog.count(*) FROM pg_catalog.pg_database d
       WHERE d.datallowconn AND d.datname !~ '^congofoot_'
         AND pg_catalog.has_database_privilege(r.oid,d.oid,'CONNECT')))
    ORDER BY r.rolname) FROM roles r), '[]'::pg_catalog.jsonb),
  'schemas', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid', n.oid, 'name', n.nspname, 'owner_oid', n.nspowner,
    'owner', pg_catalog.pg_get_userbyid(n.nspowner),
    'acl', n.nspacl,
    'audit_usage', pg_catalog.has_schema_privilege(SESSION_USER,n.oid,'USAGE'),
    'audit_create', pg_catalog.has_schema_privilege(SESSION_USER,n.oid,'CREATE'),
    'audit_usage_grant_option', pg_catalog.has_schema_privilege(SESSION_USER,n.oid,'USAGE WITH GRANT OPTION'),
    'deployment_usage', (SELECT pg_catalog.has_schema_privilege(r.oid,n.oid,'USAGE')
      FROM roles r WHERE r.rolname='congofoot_user_teka_edu_prod'),
    'deployment_create', (SELECT pg_catalog.has_schema_privilege(r.oid,n.oid,'CREATE')
      FROM roles r WHERE r.rolname='congofoot_user_teka_edu_prod')
  ) ORDER BY n.nspname) FROM schemas n), '[]'::pg_catalog.jsonb),
  'relations', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid', c.oid, 'schema', c.nspname, 'name', c.relname, 'kind', c.relkind,
    'owner_oid', c.relowner, 'owner', pg_catalog.pg_get_userbyid(c.relowner), 'acl', c.relacl,
    'table_access_method', c.amname, 'persistence', c.relpersistence,
    'partition', c.relispartition, 'rls', c.relrowsecurity,
    'force_rls', c.relforcerowsecurity,
    'audit_rls_active', CASE WHEN c.relkind IN ('r','p')
      THEN pg_catalog.row_security_active(c.oid) ELSE NULL END,
    'row_estimate_NOT_EXACT', c.reltuples,
    'audit_select', CASE WHEN c.relkind IN ('r','p','v','m','f')
      THEN pg_catalog.has_table_privilege(SESSION_USER,c.oid,'SELECT') ELSE NULL END,
    'audit_select_grant_option', CASE WHEN c.relkind IN ('r','p','v','m','f') THEN
      pg_catalog.has_table_privilege(SESSION_USER,c.oid,'SELECT WITH GRANT OPTION')
      OR pg_catalog.has_any_column_privilege(SESSION_USER,c.oid,'SELECT WITH GRANT OPTION')
      ELSE NULL END,
    'audit_write', CASE WHEN c.relkind IN ('r','p','v','m','f') THEN
      pg_catalog.has_table_privilege(SESSION_USER,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      OR pg_catalog.has_any_column_privilege(SESSION_USER,c.oid,'INSERT,UPDATE,REFERENCES')
      ELSE NULL END,
    'audit_sequence_select', CASE WHEN c.relkind='S'
      THEN pg_catalog.has_sequence_privilege(SESSION_USER,c.oid,'SELECT') ELSE NULL END,
    'audit_sequence_select_grant_option', CASE WHEN c.relkind='S'
      THEN pg_catalog.has_sequence_privilege(SESSION_USER,c.oid,'SELECT WITH GRANT OPTION') ELSE NULL END,
    'audit_sequence_write', CASE WHEN c.relkind='S'
      THEN pg_catalog.has_sequence_privilege(SESSION_USER,c.oid,'USAGE,UPDATE') ELSE NULL END,
    'deployment_write', CASE WHEN c.relkind IN ('r','p','v','m','f') THEN
      (SELECT pg_catalog.has_table_privilege(r.oid,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        OR pg_catalog.has_any_column_privilege(r.oid,c.oid,'INSERT,UPDATE,REFERENCES')
       FROM roles r WHERE r.rolname='congofoot_user_teka_edu_prod') ELSE NULL END,
    'deployment_select', CASE WHEN c.relkind IN ('r','p','v','m','f') THEN
      (SELECT pg_catalog.has_table_privilege(r.oid,c.oid,'SELECT')
       FROM roles r WHERE r.rolname='congofoot_user_teka_edu_prod') ELSE NULL END
  ) ORDER BY c.nspname,c.relname) FROM relations c), '[]'::pg_catalog.jsonb),
  'columns', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'relation_oid', c.oid, 'schema', c.nspname, 'table', c.relname, 'name', a.attname,
    'number', a.attnum, 'type_oid', a.atttypid, 'type_modifier', a.atttypmod,
    'not_null', a.attnotnull, 'identity', a.attidentity, 'generated', a.attgenerated,
    'acl', a.attacl,
    'default_oid', d.oid, 'has_default_expression', d.adbin IS NOT NULL,
    'collation_oid', a.attcollation
  ) ORDER BY c.nspname,c.relname,a.attnum)
    FROM relations c JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid
    LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    WHERE a.attnum>0 AND NOT a.attisdropped
  ), '[]'::pg_catalog.jsonb),
  'types', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid', t.oid, 'schema', n.nspname, 'name', t.typname, 'kind', t.typtype,
    'owner_oid', t.typowner, 'owner', pg_catalog.pg_get_userbyid(t.typowner), 'acl', t.typacl,
    'base_type_oid', t.typbasetype, 'element_type_oid', t.typelem,
    'relation_oid', t.typrelid, 'collation_oid', t.typcollation,
    'input_function_oid', t.typinput::pg_catalog.oid,
    'output_function_oid', t.typoutput::pg_catalog.oid,
    'receive_function_oid', t.typreceive::pg_catalog.oid,
    'send_function_oid', t.typsend::pg_catalog.oid
  ) ORDER BY n.nspname,t.typname) FROM pg_catalog.pg_type t
    JOIN schemas n ON n.oid=t.typnamespace), '[]'::pg_catalog.jsonb),
  'constraints', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid', x.oid, 'schema', n.nspname, 'name', x.conname, 'kind', x.contype,
    'relation_oid', x.conrelid, 'domain_oid', x.contypid,
    'validated', x.convalidated, 'deferrable', x.condeferrable,
    'initially_deferred', x.condeferred, 'local', x.conislocal,
    'no_inherit', x.connoinherit, 'parent_constraint_oid', x.conparentid,
    'index_oid', x.conindid, 'referenced_relation_oid', x.confrelid,
    'column_numbers', x.conkey, 'referenced_column_numbers', x.confkey,
    'update_action', x.confupdtype, 'delete_action', x.confdeltype,
    'match_type', x.confmatchtype, 'pk_fk_operator_oids', x.conpfeqop,
    'pk_pk_operator_oids', x.conppeqop, 'fk_fk_operator_oids', x.conffeqop,
    'exclusion_operator_oids', x.conexclop, 'has_check_expression', x.conbin IS NOT NULL
  ) ORDER BY n.nspname,x.conname,x.oid) FROM pg_catalog.pg_constraint x
    JOIN schemas n ON n.oid=x.connamespace), '[]'::pg_catalog.jsonb),
  'triggers', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid', t.oid, 'relation_oid', t.tgrelid,
    'schema', c.nspname, 'table', c.relname, 'name', t.tgname,
    'enabled', t.tgenabled, 'function_oid', t.tgfoid,
    'type_bits', t.tgtype, 'parent_trigger_oid', t.tgparentid,
    'constraint_oid', t.tgconstraint, 'deferrable', t.tgdeferrable,
    'initially_deferred', t.tginitdeferred, 'argument_count', t.tgnargs,
    'column_numbers', t.tgattr, 'has_when_expression', t.tgqual IS NOT NULL,
    'has_old_transition_table', t.tgoldtable IS NOT NULL,
    'has_new_transition_table', t.tgnewtable IS NOT NULL
  ) ORDER BY c.nspname,c.relname,t.tgname) FROM pg_catalog.pg_trigger t
    JOIN relations c ON c.oid=t.tgrelid WHERE NOT t.tgisinternal), '[]'::pg_catalog.jsonb),
  'indexes', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid', i.indexrelid, 'schema', c.nspname, 'name', c.relname, 'table_oid', i.indrelid,
    'valid', i.indisvalid, 'ready', i.indisready,
    'live', i.indislive, 'unique', i.indisunique, 'primary', i.indisprimary,
    'exclusion', i.indisexclusion, 'nulls_not_distinct', i.indnullsnotdistinct,
    'immediate', i.indimmediate, 'replica_identity', i.indisreplident,
    'attribute_count', i.indnatts, 'key_attribute_count', i.indnkeyatts,
    'column_numbers', i.indkey, 'collation_oids', i.indcollation,
    'operator_class_oids', i.indclass, 'option_bits', i.indoption,
    'has_expressions', i.indexprs IS NOT NULL, 'has_predicate', i.indpred IS NOT NULL
  ) ORDER BY c.nspname,c.relname) FROM pg_catalog.pg_index i
    JOIN relations c ON c.oid=i.indexrelid), '[]'::pg_catalog.jsonb),
  'rewrite_rules', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid', x.oid, 'relation_oid', x.ev_class,
    'schema', c.nspname, 'relation', c.relname, 'name', x.rulename,
    'event_type', x.ev_type, 'enabled', x.ev_enabled, 'instead', x.is_instead,
    'has_qualification_tree', x.ev_qual IS NOT NULL,
    'has_action_tree', x.ev_action IS NOT NULL
  ) ORDER BY c.nspname,c.relname,x.rulename) FROM pg_catalog.pg_rewrite x
    JOIN relations c ON c.oid=x.ev_class), '[]'::pg_catalog.jsonb),
  'policies', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid', p.oid, 'relation_oid', p.polrelid,
    'schema', c.nspname, 'table', c.relname, 'name', p.polname,
    'command', p.polcmd, 'permissive', p.polpermissive,
    'role_oids', p.polroles,
    'roles', (SELECT pg_catalog.jsonb_agg(CASE WHEN x=0 THEN 'PUBLIC'
      ELSE pg_catalog.pg_get_userbyid(x)::pg_catalog.text END ORDER BY x)
      FROM pg_catalog.unnest(p.polroles) x),
    'has_using_expression', p.polqual IS NOT NULL,
    'has_check_expression', p.polwithcheck IS NOT NULL
  ) ORDER BY c.nspname,c.relname,p.polname)
    FROM pg_catalog.pg_policy p JOIN relations c ON c.oid=p.polrelid
  ), '[]'::pg_catalog.jsonb),
  'extensions', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid', e.oid, 'name', e.extname, 'version', e.extversion, 'schema', n.nspname,
    'owner_oid', e.extowner, 'owner', pg_catalog.pg_get_userbyid(e.extowner)
  ) ORDER BY e.extname) FROM pg_catalog.pg_extension e
    JOIN pg_catalog.pg_namespace n ON n.oid=e.extnamespace), '[]'::pg_catalog.jsonb),
  'routines', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid', p.oid, 'schema', p.nspname, 'name', p.proname,
    'input_argument_type_oids', p.proargtypes, 'all_argument_type_oids', p.proallargtypes,
    'argument_modes', p.proargmodes, 'input_argument_count', p.pronargs,
    'default_argument_count', p.pronargdefaults, 'return_type_oid', p.prorettype,
    'variadic_type_oid', p.provariadic, 'has_argument_defaults', p.has_argument_defaults,
    'has_sql_body', p.has_sql_body,
    'kind', p.prokind, 'language', p.lanname,
    'owner_oid', p.proowner, 'owner', pg_catalog.pg_get_userbyid(p.proowner), 'acl', p.proacl,
    'security_definer', p.prosecdef, 'volatility', p.provolatile,
    'audit_execute', pg_catalog.has_function_privilege(SESSION_USER,p.oid,'EXECUTE'),
    'audit_execute_grant_option', pg_catalog.has_function_privilege(SESSION_USER,p.oid,'EXECUTE WITH GRANT OPTION'),
    'has_configuration', p.has_configuration
  ) ORDER BY p.nspname,p.proname,p.oid) FROM routines p), '[]'::pg_catalog.jsonb),
  'default_acls', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'owner', pg_catalog.pg_get_userbyid(a.defaclrole),
    'schema', n.nspname, 'object_type', a.defaclobjtype, 'acl', a.defaclacl
  ) ORDER BY a.defaclrole,a.defaclnamespace,a.defaclobjtype)
    FROM pg_catalog.pg_default_acl a
    LEFT JOIN pg_catalog.pg_namespace n ON n.oid=a.defaclnamespace
  ), '[]'::pg_catalog.jsonb),
  'audit_ownership_dependency_count', (
    SELECT pg_catalog.count(*) FROM pg_catalog.pg_shdepend d
    JOIN pg_catalog.pg_database b ON b.oid=d.dbid
    JOIN roles r ON r.oid=d.refobjid
    WHERE b.datname=pg_catalog.current_database() AND d.deptype='o'
      AND d.refclassid='pg_catalog.pg_authid'::pg_catalog.regclass
      AND r.rolname=SESSION_USER
  ),
  'migration_relation_candidates', COALESCE((SELECT pg_catalog.jsonb_agg(
    pg_catalog.jsonb_build_object('schema', c.nspname,'name',c.relname,'kind',c.relkind)
    ORDER BY c.nspname,c.relname) FROM relations c
    WHERE c.nspname IN ('teka_migrations','supabase_migrations')
       OR c.relname ~* '(migrat|schema_version|flyway|alembic|knex|prisma|sequelize|drizzle)'
  ), '[]'::pg_catalog.jsonb),
  'foreign_server_count', (SELECT pg_catalog.count(*) FROM pg_catalog.pg_foreign_server),
  'publication_count', (SELECT pg_catalog.count(*) FROM pg_catalog.pg_publication),
  'user_mapping_metadata_count', (SELECT pg_catalog.count(*) FROM pg_catalog.pg_user_mapping),
  'large_object_metadata_count', (SELECT pg_catalog.count(*) FROM pg_catalog.pg_largeobject_metadata),
  'event_trigger_count', (SELECT pg_catalog.count(*) FROM pg_catalog.pg_event_trigger),
  'inheritance', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'child_oid', i.inhrelid, 'parent_oid', i.inhparent, 'sequence', i.inhseqno
  ) ORDER BY i.inhrelid,i.inhseqno) FROM pg_catalog.pg_inherits i
    WHERE i.inhrelid IN (SELECT oid FROM relations)), '[]'::pg_catalog.jsonb),
  'data_read', 'NOT_READ; estimates/permission denial/RLS zeros are never emptiness proof',
  'definition_fingerprints', 'NOT_COLLECTED; no deparsing, routine-body hashes or expression hashes',
  'schema_equivalence', 'NOT_VERIFIED; OIDs, structural metadata and expression-presence flags are not semantic definitions',
  'tls_verify_full', 'CLIENT_EVIDENCE_REQUIRED; pg_stat_ssl proves encryption only',
  'isolation', 'ACL_METADATA_ONLY; no DEV connection attempted',
  'missing_roles', (SELECT pg_catalog.jsonb_agg(w.name ORDER BY w.name)
    FROM (VALUES ('congofoot_user_teka_edu_prod'), ('congofoot_user_teka_edu_dev')) w(name)
    WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.rolname=w.name))
) END AS audit_metadata FROM guard;
