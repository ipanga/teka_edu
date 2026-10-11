-- PREPARATION ONLY: owner approval is required before this file is run.
-- Direct PROD inspection. No credentials, raw rows, routine bodies or ACLs output.
\set ON_ERROR_STOP on
\set ECHO none
\set QUIET on
\set VERBOSITY terse
\pset format unaligned
\pset tuples_only on
\pset pager off
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path=pg_catalog;
SET LOCAL standard_conforming_strings=on;
SET LOCAL statement_timeout='15s';
SET LOCAL lock_timeout='2s';
SET LOCAL row_security=off;
SET LOCAL enable_indexscan=off;
SET LOCAL enable_indexonlyscan=off;
SET LOCAL enable_bitmapscan=off;
SET LOCAL enable_seqscan=on;
SET LOCAL max_parallel_workers_per_gather=0;
SET LOCAL jit=off;
SET LOCAL datestyle='ISO, YMD';
SET LOCAL timezone='UTC';
SET LOCAL client_min_messages=warning;
-- Acquire approved relation locks before the first snapshot/SELECT.
LOCK TABLE ONLY "public"."education_stages",
  ONLY "public"."school_levels",
  ONLY "public"."school_years",
  ONLY "public"."school_periods",
  ONLY "public"."public_holidays",
  ONLY "public"."calendar_exceptions",
  ONLY "public"."curricula",
  ONLY "public"."curriculum_age_bands",
  ONLY "public"."curriculum_levels",
  ONLY "public"."curriculum_domains",
  ONLY "public"."curriculum_sources",
  ONLY "public"."curriculum_source_domains",
  ONLY "public"."curriculum_subdomains",
  ONLY "public"."curriculum_competencies",
  ONLY "public"."learning_objectives",
  ONLY "public"."learning_objective_age_bands",
  ONLY "public"."success_examples",
  ONLY "public"."materials",
  ONLY "public"."activity_types",
  ONLY "public"."lessons",
  ONLY "public"."lesson_levels",
  ONLY "public"."lesson_objectives",
  ONLY "public"."activities",
  ONLY "public"."media_assets",
  ONLY "public"."media_asset_tags",
  ONLY "public"."activity_media",
  ONLY "public"."activity_objectives",
  ONLY "public"."activity_materials",
  ONLY "public"."activity_vocabulary",
  ONLY "public"."activity_scaffolds",
  ONLY "public"."teaching_texts",
  ONLY "public"."teaching_text_lines",
  ONLY "public"."annual_plans",
  ONLY "public"."annual_plan_phases",
  ONLY "public"."annual_plan_entries",
  ONLY "public"."school_year_curricula",
  ONLY "supabase_migrations"."schema_migrations",
  ONLY "auth"."users",
  ONLY "auth"."identities",
  ONLY "storage"."buckets",
  ONLY "storage"."objects" IN ACCESS SHARE MODE;
SELECT pg_catalog.jsonb_build_object('gate','identity_tls_session','pass',1 / CASE WHEN (
  pg_catalog.current_database()='postgres' AND session_user::pg_catalog.text='postgres'
  AND current_user::pg_catalog.text='postgres'
  AND pg_catalog.current_setting('server_version_num')::pg_catalog.int4>=170000
  AND pg_catalog.current_setting('server_version_num')::pg_catalog.int4<180000
  AND pg_catalog.current_setting('transaction_read_only')='on'
  AND pg_catalog.current_setting('default_transaction_read_only')='on'
  AND pg_catalog.current_setting('transaction_isolation')='repeatable read'
  AND pg_catalog.current_setting('search_path')='pg_catalog'
  AND pg_catalog.current_setting('row_security')='off'
  AND pg_catalog.current_setting('statement_timeout')='15s'
  AND pg_catalog.current_setting('lock_timeout')='2s'
  AND pg_catalog.current_setting('enable_indexscan')='off'
  AND pg_catalog.current_setting('enable_indexonlyscan')='off'
  AND pg_catalog.current_setting('enable_bitmapscan')='off'
  AND pg_catalog.current_setting('enable_seqscan')='on'
  AND (SELECT ssl AND version IN ('TLSv1.2','TLSv1.3') FROM pg_catalog.pg_stat_ssl
       WHERE pid=pg_catalog.pg_backend_pid())
  AND EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=current_user)) IS TRUE THEN 1 ELSE 0 END);
SELECT pg_catalog.jsonb_build_object('observation','identity_and_existing_capabilities',
  'database',pg_catalog.current_database(),'session_login',session_user::pg_catalog.text,
  'current_login',current_user::pg_catalog.text,'server_version',pg_catalog.current_setting('server_version'),
  'read_only',pg_catalog.current_setting('transaction_read_only'),'row_security',pg_catalog.current_setting('row_security'),
  'tls_version',(SELECT version FROM pg_catalog.pg_stat_ssl WHERE pid=pg_catalog.pg_backend_pid()),
  'superuser',r.rolsuper,'bypassrls',r.rolbypassrls,'createdb',r.rolcreatedb,
  'createrole',r.rolcreaterole,'replication',r.rolreplication,'inherit',r.rolinherit,
  'database_create',pg_catalog.has_database_privilege(pg_catalog.current_database(),'CREATE'),
  'public_create',pg_catalog.has_schema_privilege('public','CREATE'),
  'private_create',pg_catalog.has_schema_privilege('private','CREATE'),
  'predefined_role_usage',pg_catalog.jsonb_build_object(
    'read_all_data',pg_catalog.pg_has_role(current_user,'pg_read_all_data','USAGE'),
    'write_all_data',pg_catalog.pg_has_role(current_user,'pg_write_all_data','USAGE'),
    'read_server_files',pg_catalog.pg_has_role(current_user,'pg_read_server_files','USAGE'),
    'write_server_files',pg_catalog.pg_has_role(current_user,'pg_write_server_files','USAGE'),
    'execute_server_program',pg_catalog.pg_has_role(current_user,'pg_execute_server_program','USAGE'),
    'monitor',pg_catalog.pg_has_role(current_user,'pg_monitor','USAGE')))
FROM pg_catalog.pg_roles r WHERE r.rolname=current_user;
-- Catalog-only gate before any application/provider rows are read.
-- Complete non-system namespace/relation aggregates, including unknown names.
-- Saved evidence is incomplete: no provider name is inferred from convention.
WITH namespaces AS MATERIALIZED (
  SELECT oid,nspname FROM pg_catalog.pg_namespace
  WHERE nspname NOT IN ('pg_catalog','information_schema')
    AND nspname !~ '^pg_(toast|temp)(_|$)'
), relations AS MATERIALIZED (
  SELECT c.oid,c.relnamespace,c.relname,c.relkind,c.relpersistence,c.relam,
    c.reltuples,c.relrowsecurity,c.relforcerowsecurity
  FROM pg_catalog.pg_class c JOIN namespaces n ON n.oid=c.relnamespace
), kinds AS (
  SELECT relnamespace,relkind,relpersistence,pg_catalog.count(*) AS relations
  FROM relations GROUP BY relnamespace,relkind,relpersistence
)
SELECT pg_catalog.jsonb_build_object('observation','non_system_namespace_relation_scope',
  'provider_allowlist_complete',false,'backup_scope','NOT VERIFIED','rebuild_scope','NOT VERIFIED',
  'namespace_count',(SELECT pg_catalog.count(*) FROM namespaces),
  'unknown_namespaces',(SELECT COALESCE(pg_catalog.jsonb_agg(nspname ORDER BY nspname COLLATE pg_catalog."C"),
    '[]'::pg_catalog.jsonb) FROM namespaces WHERE nspname NOT IN ('public','private','extensions','supabase_migrations','auth','storage')),
  'namespaces',(SELECT COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'schema',n.nspname,'namespace_oid',n.oid,'classification',
      CASE WHEN n.nspname IN ('public','private') THEN 'frozen_application'
        WHEN n.nspname IN ('public','private','extensions','supabase_migrations','auth','storage') THEN 'evidenced_provider_or_supporting'
        ELSE 'OWNER_CLASSIFICATION_REQUIRED' END,
    'relation_count',(SELECT pg_catalog.count(*) FROM relations c WHERE c.relnamespace=n.oid),
    'relation_kinds',(SELECT COALESCE(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'kind',k.relkind,'persistence',k.relpersistence,'count',k.relations)
      ORDER BY k.relkind,k.relpersistence),'[]'::pg_catalog.jsonb) FROM kinds k WHERE k.relnamespace=n.oid),
    'catalog_estimated_rows',(SELECT COALESCE(pg_catalog.sum(GREATEST(c.reltuples,0)::pg_catalog.numeric),0)
      FROM relations c WHERE c.relnamespace=n.oid AND c.relkind IN ('r','p','m','f')),
    'relations_with_unknown_row_estimates',(SELECT pg_catalog.count(*) FROM relations c
      WHERE c.relnamespace=n.oid AND c.relkind IN ('r','p','m','f') AND c.reltuples<0),
    'ordinary_heap_physical_bytes',(SELECT COALESCE(pg_catalog.sum(pg_catalog.pg_total_relation_size(c.oid)),0)
      FROM relations c WHERE c.relnamespace=n.oid AND c.relkind IN ('r','m') AND c.relam=2),
    'non_heap_storage_relation_count',(SELECT pg_catalog.count(*) FROM relations c
      WHERE c.relnamespace=n.oid AND c.relkind IN ('r','m') AND c.relam<>2),
    'routine_count',(SELECT pg_catalog.count(*) FROM pg_catalog.pg_proc p WHERE p.pronamespace=n.oid),
    'type_count',(SELECT pg_catalog.count(*) FROM pg_catalog.pg_type t WHERE t.typnamespace=n.oid),
    'relation_catalog_sha256',(SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(COALESCE(
      pg_catalog.string_agg(pg_catalog.jsonb_build_array(c.oid,c.relname,c.relkind,c.relpersistence,c.relam,
        c.reltuples,c.relrowsecurity,c.relforcerowsecurity)::pg_catalog.text,'' ORDER BY c.oid),''),'UTF8')),'hex')
      FROM relations c WHERE c.relnamespace=n.oid)) ORDER BY n.nspname COLLATE pg_catalog."C"),
    '[]'::pg_catalog.jsonb) FROM namespaces n));
-- Conservative planning heuristic only: neither archive size nor an upper bound.
WITH size AS MATERIALIZED (
  SELECT pg_catalog.pg_database_size(pg_catalog.current_database())::pg_catalog.numeric AS database_bytes
), planning AS (
  SELECT database_bytes,2*database_bytes+1073741824 AS estimated_single_backup_archive_bytes
  FROM size
)
SELECT pg_catalog.jsonb_build_object('observation','physical_size_and_backup_planning',
  'database_bytes',database_bytes,
  'estimated_single_backup_archive_bytes',estimated_single_backup_archive_bytes,
  'estimated_backup_working_capacity_bytes',3*estimated_single_backup_archive_bytes+2*database_bytes+8589934592,
  'estimate_basis','HEURISTIC: archive=2*database+1GiB; working=3*archive+2*database+8GiB',
  'archive_size_guaranteed',false,
  'approved_application_relation_bytes',(SELECT pg_catalog.sum(pg_catalog.pg_total_relation_size(c.oid))
    FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relam=2),
  'application_relation_sizes',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('table',c.relname,
    'heap_bytes',pg_catalog.pg_relation_size(c.oid),'total_bytes',pg_catalog.pg_total_relation_size(c.oid))
    ORDER BY c.relname COLLATE pg_catalog."C") FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relam=2))
FROM planning;
WITH expected_relations(schema_name,relation_name) AS (VALUES
  ('public','education_stages'),
  ('public','school_levels'),
  ('public','school_years'),
  ('public','school_periods'),
  ('public','public_holidays'),
  ('public','calendar_exceptions'),
  ('public','curricula'),
  ('public','curriculum_age_bands'),
  ('public','curriculum_levels'),
  ('public','curriculum_domains'),
  ('public','curriculum_sources'),
  ('public','curriculum_source_domains'),
  ('public','curriculum_subdomains'),
  ('public','curriculum_competencies'),
  ('public','learning_objectives'),
  ('public','learning_objective_age_bands'),
  ('public','success_examples'),
  ('public','materials'),
  ('public','activity_types'),
  ('public','lessons'),
  ('public','lesson_levels'),
  ('public','lesson_objectives'),
  ('public','activities'),
  ('public','media_assets'),
  ('public','media_asset_tags'),
  ('public','activity_media'),
  ('public','activity_objectives'),
  ('public','activity_materials'),
  ('public','activity_vocabulary'),
  ('public','activity_scaffolds'),
  ('public','teaching_texts'),
  ('public','teaching_text_lines'),
  ('public','annual_plans'),
  ('public','annual_plan_phases'),
  ('public','annual_plan_entries'),
  ('public','school_year_curricula'),
  ('supabase_migrations','schema_migrations'),
  ('auth','users'),
  ('auth','identities'),
  ('storage','buckets'),
  ('storage','objects')
), approved AS MATERIALIZED (
  SELECT c.*,n.nspname FROM expected_relations e
  JOIN pg_catalog.pg_namespace n ON n.nspname=e.schema_name
  JOIN pg_catalog.pg_class c ON c.relnamespace=n.oid AND c.relname=e.relation_name
), expected_columns(relation_name,ordinal,column_name,type_oid,not_null) AS (VALUES
  ('education_stages',1,'id',25,true),
  ('education_stages',2,'position',21,true),
  ('education_stages',3,'name',25,true),
  ('school_levels',1,'id',25,true),
  ('school_levels',2,'stage_id',25,true),
  ('school_levels',3,'position',21,true),
  ('school_levels',4,'name',25,true),
  ('school_years',1,'id',25,true),
  ('school_years',2,'label',25,true),
  ('school_years',3,'starts_on',1082,true),
  ('school_years',4,'ends_on',1082,true),
  ('school_years',5,'instructional_weekdays',1005,true),
  ('school_years',6,'authority',25,true),
  ('school_years',7,'verification',25,true),
  ('school_years',8,'source',25,false),
  ('school_years',9,'notes',25,false),
  ('school_periods',1,'school_year_id',25,true),
  ('school_periods',2,'position',21,true),
  ('school_periods',3,'term',21,true),
  ('school_periods',4,'starts_on',1082,true),
  ('school_periods',5,'ends_on',1082,true),
  ('public_holidays',1,'id',25,true),
  ('public_holidays',2,'name',25,true),
  ('public_holidays',3,'month',21,true),
  ('public_holidays',4,'day',21,true),
  ('public_holidays',5,'valid_from',1082,false),
  ('public_holidays',6,'valid_until',1082,false),
  ('public_holidays',7,'authority',25,true),
  ('public_holidays',8,'verification',25,true),
  ('public_holidays',9,'source',25,false),
  ('public_holidays',10,'notes',25,false),
  ('calendar_exceptions',1,'id',25,true),
  ('calendar_exceptions',2,'school_year_id',25,true),
  ('calendar_exceptions',3,'kind',25,true),
  ('calendar_exceptions',4,'starts_on',1082,true),
  ('calendar_exceptions',5,'ends_on',1082,true),
  ('calendar_exceptions',6,'name',25,true),
  ('calendar_exceptions',7,'public_holiday_id',25,false),
  ('calendar_exceptions',8,'authority',25,true),
  ('calendar_exceptions',9,'verification',25,true),
  ('calendar_exceptions',10,'source',25,false),
  ('calendar_exceptions',11,'notes',25,false),
  ('curricula',1,'id',25,true),
  ('curricula',2,'stage_id',25,true),
  ('curricula',3,'name',25,true),
  ('curricula',4,'version',25,true),
  ('curricula',5,'status',25,true),
  ('curricula',6,'reference_title',25,true),
  ('curricula',7,'reference_publisher',25,true),
  ('curricula',8,'reference_citation',25,true),
  ('curricula',9,'reference_url',25,false),
  ('curricula',10,'reference_verification',25,true),
  ('curricula',11,'adaptation_note',25,false),
  ('curriculum_age_bands',1,'curriculum_id',25,true),
  ('curriculum_age_bands',2,'code',25,true),
  ('curriculum_age_bands',3,'position',21,true),
  ('curriculum_age_bands',4,'label',25,true),
  ('curriculum_levels',1,'curriculum_id',25,true),
  ('curriculum_levels',2,'level_id',25,true),
  ('curriculum_levels',3,'stage_id',25,true),
  ('curriculum_levels',4,'reference_section',25,false),
  ('curriculum_levels',5,'age_band_code',25,false),
  ('curriculum_domains',1,'curriculum_id',25,true),
  ('curriculum_domains',2,'code',25,true),
  ('curriculum_domains',3,'kind',25,true),
  ('curriculum_domains',4,'position',21,true),
  ('curriculum_domains',5,'title',25,true),
  ('curriculum_domains',6,'is_active',16,true),
  ('curriculum_sources',1,'curriculum_id',25,true),
  ('curriculum_sources',2,'code',25,true),
  ('curriculum_sources',3,'title',25,true),
  ('curriculum_sources',4,'citation',25,true),
  ('curriculum_sources',5,'url',25,false),
  ('curriculum_sources',6,'sha256',25,false),
  ('curriculum_sources',7,'verification',25,true),
  ('curriculum_sources',8,'published_on',1082,false),
  ('curriculum_source_domains',1,'curriculum_id',25,true),
  ('curriculum_source_domains',2,'source_code',25,true),
  ('curriculum_source_domains',3,'domain_code',25,true),
  ('curriculum_subdomains',1,'curriculum_id',25,true),
  ('curriculum_subdomains',2,'code',25,true),
  ('curriculum_subdomains',3,'domain_code',25,true),
  ('curriculum_subdomains',4,'position',21,true),
  ('curriculum_subdomains',5,'title',25,true),
  ('curriculum_competencies',1,'curriculum_id',25,true),
  ('curriculum_competencies',2,'code',25,true),
  ('curriculum_competencies',3,'subdomain_code',25,true),
  ('curriculum_competencies',4,'position',21,true),
  ('curriculum_competencies',5,'title',25,true),
  ('learning_objectives',1,'curriculum_id',25,true),
  ('learning_objectives',2,'code',25,true),
  ('learning_objectives',3,'competency_code',25,true),
  ('learning_objectives',4,'position',21,true),
  ('learning_objectives',5,'statement',25,true),
  ('learning_objectives',6,'group_title',25,false),
  ('learning_objectives',7,'origin',25,true),
  ('learning_objectives',8,'source_code',25,false),
  ('learning_objectives',9,'source_page',21,false),
  ('learning_objective_age_bands',1,'curriculum_id',25,true),
  ('learning_objective_age_bands',2,'objective_code',25,true),
  ('learning_objective_age_bands',3,'age_band_code',25,true),
  ('success_examples',1,'curriculum_id',25,true),
  ('success_examples',2,'competency_code',25,true),
  ('success_examples',3,'age_band_code',25,true),
  ('success_examples',4,'position',21,true),
  ('success_examples',5,'statement',25,true),
  ('success_examples',6,'group_title',25,false),
  ('success_examples',7,'source_code',25,false),
  ('success_examples',8,'source_page',21,false),
  ('materials',1,'code',25,true),
  ('materials',2,'name',25,true),
  ('materials',3,'category',25,true),
  ('materials',4,'alternatives',25,false),
  ('materials',5,'safety_note',25,false),
  ('activity_types',1,'code',25,true),
  ('lessons',1,'id',25,true),
  ('lessons',2,'curriculum_id',25,true),
  ('lessons',3,'domain_code',25,true),
  ('lessons',4,'title',25,true),
  ('lessons',5,'summary',25,true),
  ('lessons',6,'stage',25,true),
  ('lessons',7,'difficulty',21,true),
  ('lessons',8,'theme_id',25,false),
  ('lessons',9,'parent_guidance',25,true),
  ('lessons',10,'origin',25,true),
  ('lessons',11,'status',25,true),
  ('lessons',12,'reviewer',25,false),
  ('lessons',13,'reviewer_role',25,false),
  ('lessons',14,'reviewed_on',1082,false),
  ('lessons',15,'reviewed_digest',25,false),
  ('lessons',16,'review_notes',25,false),
  ('lessons',17,'review_kind',25,false),
  ('lessons',18,'review_outcome',25,false),
  ('lesson_levels',1,'lesson_id',25,true),
  ('lesson_levels',2,'level_id',25,true),
  ('lesson_objectives',1,'lesson_id',25,true),
  ('lesson_objectives',2,'curriculum_id',25,true),
  ('lesson_objectives',3,'objective_code',25,true),
  ('lesson_objectives',4,'role',25,true),
  ('activities',1,'id',25,true),
  ('activities',2,'lesson_id',25,true),
  ('activities',3,'curriculum_id',25,true),
  ('activities',4,'position',21,true),
  ('activities',5,'type',25,true),
  ('activities',6,'title',25,true),
  ('activities',7,'child_instruction',25,true),
  ('activities',8,'adult_guidance',25,true),
  ('activities',9,'minutes',21,true),
  ('activities',10,'mode',25,true),
  ('activities',11,'payload',3802,true),
  ('activities',12,'role',25,true),
  ('media_assets',1,'id',25,true),
  ('media_assets',2,'kind',25,true),
  ('media_assets',3,'file',25,true),
  ('media_assets',4,'alt',25,true),
  ('media_assets',5,'origin',25,true),
  ('media_assets',6,'provenance',25,true),
  ('media_asset_tags',1,'media_id',25,true),
  ('media_asset_tags',2,'position',21,true),
  ('media_asset_tags',3,'tag',25,true),
  ('activity_media',1,'activity_id',25,true),
  ('activity_media',2,'position',21,true),
  ('activity_media',3,'media_id',25,true),
  ('activity_objectives',1,'activity_id',25,true),
  ('activity_objectives',2,'curriculum_id',25,true),
  ('activity_objectives',3,'objective_code',25,true),
  ('activity_materials',1,'activity_id',25,true),
  ('activity_materials',2,'material_code',25,true),
  ('activity_vocabulary',1,'activity_id',25,true),
  ('activity_vocabulary',2,'position',21,true),
  ('activity_vocabulary',3,'french',25,true),
  ('activity_vocabulary',4,'english',25,false),
  ('activity_scaffolds',1,'activity_id',25,true),
  ('activity_scaffolds',2,'language',25,true),
  ('activity_scaffolds',3,'child_instruction',25,true),
  ('teaching_texts',1,'id',25,true),
  ('teaching_texts',2,'kind',25,true),
  ('teaching_texts',3,'title',25,true),
  ('teaching_texts',4,'minutes',21,true),
  ('teaching_texts',5,'origin',25,true),
  ('teaching_texts',6,'provenance',25,true),
  ('teaching_texts',7,'illustration_id',25,false),
  ('teaching_text_lines',1,'text_id',25,true),
  ('teaching_text_lines',2,'position',21,true),
  ('teaching_text_lines',3,'line',25,true),
  ('annual_plans',1,'id',25,true),
  ('annual_plans',2,'curriculum_id',25,true),
  ('annual_plans',3,'level_id',25,true),
  ('annual_plans',4,'school_year_id',25,true),
  ('annual_plans',5,'instructional_days',21,true),
  ('annual_plan_phases',1,'plan_id',25,true),
  ('annual_plan_phases',2,'code',25,true),
  ('annual_plan_phases',3,'name',25,true),
  ('annual_plan_phases',4,'from_day',21,true),
  ('annual_plan_phases',5,'to_day',21,true),
  ('annual_plan_phases',6,'focus',25,true),
  ('annual_plan_entries',1,'plan_id',25,true),
  ('annual_plan_entries',2,'curriculum_id',25,true),
  ('annual_plan_entries',3,'objective_code',25,true),
  ('annual_plan_entries',4,'domain_code',25,true),
  ('annual_plan_entries',5,'phase',25,true),
  ('annual_plan_entries',6,'introduce_from_day',21,true),
  ('annual_plan_entries',7,'introduce_by_day',21,true),
  ('annual_plan_entries',8,'reinforce_until_day',21,true),
  ('annual_plan_entries',9,'consolidate_by_day',21,true),
  ('annual_plan_entries',10,'planned_revisits',21,true),
  ('annual_plan_entries',11,'cadence',25,true),
  ('annual_plan_entries',12,'needs_dedicated_lesson',16,true),
  ('annual_plan_entries',13,'embeddable',16,true),
  ('annual_plan_entries',14,'home_feasibility',25,true),
  ('school_year_curricula',1,'school_year_id',25,true),
  ('school_year_curricula',2,'stage_id',25,true),
  ('school_year_curricula',3,'curriculum_id',25,true)
), actual_columns AS MATERIALIZED (
  SELECT c.relname,a.attnum::pg_catalog.int4,a.attname,a.atttypid::pg_catalog.int4,a.attnotnull
  FROM approved c JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid
  WHERE c.nspname='public' AND a.attnum>0 AND NOT a.attisdropped
), checks AS (
  SELECT
    (SELECT pg_catalog.count(*) FROM approved)=41
    AND NOT EXISTS (SELECT 1 FROM approved c WHERE
      c.relkind<>'r' OR c.relam<>2 OR c.relpersistence<>'p' OR c.relispartition OR c.reloftype<>0
      OR NOT pg_catalog.has_schema_privilege(c.relnamespace,'USAGE')
      OR NOT pg_catalog.has_table_privilege(c.oid,'SELECT')
      OR pg_catalog.row_security_active(c.oid))
    AND EXISTS (SELECT 1 FROM pg_catalog.pg_am am JOIN pg_catalog.pg_proc p ON p.oid=am.amhandler
      JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
      WHERE am.oid=2 AND am.amname='heap' AND n.nspname='pg_catalog'
      AND p.proname='heap_tableam_handler' AND p.oid<16384)
    AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_inherits i
      WHERE i.inhparent IN (SELECT oid FROM approved) OR i.inhrelid IN (SELECT oid FROM approved))
    AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_rewrite r WHERE r.ev_class IN (SELECT oid FROM approved))
    AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_foreign_server)
    AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_largeobject_metadata)
    AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname IN ('public','private') AND c.relkind IN ('r','p','v','m','f','S')
      AND NOT EXISTS (SELECT 1 FROM approved a WHERE a.oid=c.oid))
    AND NOT EXISTS (SELECT 1 FROM approved c WHERE c.nspname='public' AND
      (NOT c.relrowsecurity OR c.relforcerowsecurity))
    AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policy p WHERE p.polrelid IN
      (SELECT oid FROM approved WHERE nspname='public'))
    AND NOT EXISTS (SELECT 1 FROM approved c JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid
      WHERE c.nspname IN ('public','supabase_migrations') AND a.attnum>0 AND a.attisdropped)
    AND NOT EXISTS ((SELECT * FROM actual_columns EXCEPT ALL SELECT * FROM expected_columns)
      UNION ALL (SELECT * FROM expected_columns EXCEPT ALL SELECT * FROM actual_columns))
    AND NOT EXISTS (SELECT 1 FROM approved c JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid
      LEFT JOIN pg_catalog.pg_type t ON t.oid=a.atttypid
      LEFT JOIN pg_catalog.pg_namespace tn ON tn.oid=t.typnamespace
      LEFT JOIN pg_catalog.pg_proc o ON o.oid=t.typoutput
      LEFT JOIN pg_catalog.pg_namespace onsp ON onsp.oid=o.pronamespace
      LEFT JOIN pg_catalog.pg_language ol ON ol.oid=o.prolang
      LEFT JOIN pg_catalog.pg_type et ON et.oid=t.typelem
      LEFT JOIN pg_catalog.pg_namespace en ON en.oid=et.typnamespace
      LEFT JOIN pg_catalog.pg_proc eo ON eo.oid=et.typoutput
      LEFT JOIN pg_catalog.pg_namespace eon ON eon.oid=eo.pronamespace
      LEFT JOIN pg_catalog.pg_language eol ON eol.oid=eo.prolang
      WHERE a.attnum>0 AND NOT a.attisdropped AND (
        (c.nspname IN ('public','supabase_migrations') AND (a.attgenerated<>'' OR a.attidentity<>''))
        OR t.oid IS NULL OR tn.nspname<>'pg_catalog' OR t.oid>=16384 OR t.typtype<>'b' OR t.typbasetype<>0
        OR onsp.nspname<>'pg_catalog' OR o.oid>=16384 OR ol.lanname<>'internal'
        OR (t.typcategory='A' AND (et.oid IS NULL OR en.nspname<>'pg_catalog' OR et.oid>=16384
          OR et.typtype<>'b' OR et.typcategory='A' OR et.typbasetype<>0 OR eon.nspname<>'pg_catalog'
          OR eo.oid>=16384 OR eol.lanname<>'internal'))))
    AND (SELECT pg_catalog.count(*) FROM approved c JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid
      WHERE c.nspname='supabase_migrations' AND a.attnum>0 AND NOT a.attisdropped)=3
    AND (SELECT pg_catalog.count(*) FROM approved c JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid
      WHERE c.nspname='supabase_migrations' AND a.attnum>0 AND NOT a.attisdropped
      AND ((a.attname IN ('version','name') AND a.atttypid=25)
           OR (a.attname='statements' AND a.atttypid=1009)))=3
    AS pass
)
SELECT pg_catalog.jsonb_build_object('gate','exact_heap_type_visibility_scope',
  'application_tables',36,'application_columns',213,'approved_heap_relations',41,
  'pass',1 / CASE WHEN checks.pass IS TRUE THEN 1 ELSE 0 END) FROM checks;
-- Read routine source only through its built-in catalog text type; output hashes only.
WITH expected(schema_name,routine_name,source_sha256) AS (VALUES
  ('private','check_dated_row_within_school_year','5186ad9ca2f61f205a36e07c3a50e723816d582aa6faa6d3f4620bf4151af87c'),
  ('private','check_school_year_contains_dated_rows','b9c97df375756016d15135b5f1a2264bc23c680471e8aebef7280e6e3707be05')
), actual AS (
  SELECT n.nspname::pg_catalog.text,p.proname::pg_catalog.text,
    pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') AS source_sha256
  FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('public','private')
), checks AS (
  SELECT NOT EXISTS ((SELECT * FROM actual EXCEPT ALL SELECT * FROM expected)
    UNION ALL (SELECT * FROM expected EXCEPT ALL SELECT * FROM actual))
  AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    JOIN pg_catalog.pg_language l ON l.oid=p.prolang WHERE n.nspname IN ('public','private')
    AND (p.prokind<>'f' OR p.pronargs<>0 OR p.prorettype<>2279 OR p.prosecdef OR l.lanname<>'plpgsql'
      OR p.proconfig IS DISTINCT FROM ARRAY['search_path=""']::pg_catalog.text[]))
  AND (SELECT pg_catalog.count(*) FROM pg_catalog.pg_extension e JOIN pg_catalog.pg_namespace n ON n.oid=e.extnamespace
    WHERE (e.extname='btree_gist' AND n.nspname='extensions') OR (e.extname='plpgsql' AND n.nspname='pg_catalog'))=2
  AS pass
)
SELECT pg_catalog.jsonb_build_object('gate','application_routines_and_required_extensions',
  'application_routines',2,'pass',1 / CASE WHEN checks.pass IS TRUE THEN 1 ELSE 0 END) FROM checks;
-- Full canonical row multiset: public.education_stages; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("id","position","name")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."education_stages"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','education_stages',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=1 AND sha256='caffaf5579cfa73a5c000923baf2228278cb74df04860d5f7e7e21878ccf4431' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.school_levels; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("id","stage_id","position","name")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."school_levels"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','school_levels',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=3 AND sha256='afc88eb55760451fdcbabd990d18a8c8802d62f82a624fc0f52c7351f76aa273' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.school_years; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("id","label","starts_on","ends_on","instructional_weekdays","authority","verification","source","notes")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."school_years"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','school_years',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=1 AND sha256='2f219b27960d51898c4bb95f4ff234f3f4d0c18fb6d70a821c5f4c71c1e5def8' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.school_periods; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("school_year_id","position","term","starts_on","ends_on")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."school_periods"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','school_periods',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=6 AND sha256='daf2e82d0aac6d1735ab81e4812f893b35aff6b78c6a37aa6fe83e6eb4862230' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.public_holidays; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("id","name","month","day","valid_from","valid_until","authority","verification","source","notes")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."public_holidays"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','public_holidays',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=10 AND sha256='791d78381d28b1efc2ce2a9dc57ee727f96d4af58a08337c84b0410ee1b99675' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.calendar_exceptions; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("id","school_year_id","kind","starts_on","ends_on","name","public_holiday_id","authority","verification","source","notes")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."calendar_exceptions"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','calendar_exceptions',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=4 AND sha256='fa6e6fd9c1c27f23857ec54c6fc186eaa31691fa98fede890d17c4593409b758' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.curricula; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("id","stage_id","name","version","status","reference_title","reference_publisher","reference_citation","reference_url","reference_verification","adaptation_note")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."curricula"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','curricula',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=1 AND sha256='1dc4e627dcdc21bce711d13de62bfa26491513f47e0fa7c404251a7a51341cd8' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.curriculum_age_bands; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("curriculum_id","code","position","label")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."curriculum_age_bands"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','curriculum_age_bands',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=3 AND sha256='a145853a1cd711b0dfb1efa5cf409e2608b465da24b476c920073c0c62f588f1' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.curriculum_levels; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("curriculum_id","level_id","stage_id","reference_section","age_band_code")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."curriculum_levels"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','curriculum_levels',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=3 AND sha256='d1755088454920da79b7d052264a6cbf4656d63e1452b9563bd2214b4ebcae15' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.curriculum_domains; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("curriculum_id","code","kind","position","title","is_active")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."curriculum_domains"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','curriculum_domains',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=6 AND sha256='c5fd4c37608a6d3690f093d30a28d111ac37269a50b9acf8615f673a24e11531' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.curriculum_sources; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("curriculum_id","code","title","citation","url","published_on","sha256","verification")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."curriculum_sources"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','curriculum_sources',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=3 AND sha256='c108efe2c4be260615b38f1a2068c395773783704ba098bab0ec71bc40535950' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.curriculum_source_domains; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("curriculum_id","source_code","domain_code")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."curriculum_source_domains"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','curriculum_source_domains',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=6 AND sha256='86da9155159a97715fdea7eb88624f687781f7a3f9cefa03910467cb9de1dc5b' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.curriculum_subdomains; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("curriculum_id","code","domain_code","position","title")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."curriculum_subdomains"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','curriculum_subdomains',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=19 AND sha256='9c468e8e3aec24ca20bdc6f06787d3aa6e6b64358f47962afbec09589ce65635' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.curriculum_competencies; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("curriculum_id","code","subdomain_code","position","title")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."curriculum_competencies"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','curriculum_competencies',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=38 AND sha256='b96c32ddf20ed18e7c7f7a1d26d499321afda0ab6c5e07e8b1a231558346cfe1' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.learning_objectives; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("curriculum_id","code","competency_code","position","statement","group_title","origin","source_code","source_page")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."learning_objectives"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','learning_objectives',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=398 AND sha256='6475cb51575845f5aec56a7ad0916694677413d0e7416dede6da7b21f4eaf719' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.learning_objective_age_bands; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("curriculum_id","objective_code","age_band_code")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."learning_objective_age_bands"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','learning_objective_age_bands',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=417 AND sha256='70443d144c5d61393ec8c72e2ee346a438fcc97d19b8b72f60eb5ce695329c1a' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.success_examples; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("curriculum_id","competency_code","age_band_code","position","statement","group_title","source_code","source_page")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."success_examples"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','success_examples',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=529 AND sha256='aa686f5e2420d941b522ea8e61d67f6a271abb8ef46391698b5a675e463f3382' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.materials; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("code","name","category","alternatives","safety_note")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."materials"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','materials',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=19 AND sha256='e4fea9d5e8cd84bcf21b176d95e08baf10ac70753f44fc957f8854da21d055b6' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.activity_types; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("code")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."activity_types"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','activity_types',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=15 AND sha256='9425cf13859ef1dc0098bc93161975c7d35b4082c768bd04ce3f82ae4d48ae87' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.lessons; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("id","curriculum_id","domain_code","title","summary","stage","difficulty","theme_id","parent_guidance","origin","status","reviewer","reviewer_role","reviewed_on","reviewed_digest","review_notes","review_kind","review_outcome")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."lessons"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','lessons',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=264 AND sha256='6ffe7f6d83cd8ba5220c8f0f14e2333900b0786c7e68cdd2478bd00a78a20f20' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.lesson_levels; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("lesson_id","level_id")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."lesson_levels"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','lesson_levels',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=264 AND sha256='77d5ed3b0006d45a66f181c0f06fdc613d0693490fad386acec85c363bc1c778' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.lesson_objectives; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("lesson_id","curriculum_id","objective_code","role")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."lesson_objectives"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','lesson_objectives',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=620 AND sha256='4546bdac3518771b2c38ece22b591a34dfb47caa1775c534bcb8bf7138869373' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.activities; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("id","lesson_id","curriculum_id","position","type","title","child_instruction","adult_guidance","minutes","mode","role","payload")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."activities"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','activities',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=471 AND sha256='f4b7170459eca57e5dab1fc5d173198c00fd790a5e8eaf172cccc9cc5af747a3' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.media_assets; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("id","kind","file","alt","origin","provenance")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."media_assets"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','media_assets',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=54 AND sha256='e12d5c5d2de88653eb4088019e8e6658924b57adbf7f20999cd2e9ebb6a83c0b' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.media_asset_tags; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("media_id","position","tag")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."media_asset_tags"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','media_asset_tags',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=178 AND sha256='66daf53b9fd16772cd58b011a9114957edc63f9bb7d1afc0a00bedad90ebf0d2' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.activity_media; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("activity_id","position","media_id")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."activity_media"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','activity_media',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=140 AND sha256='7f29209082bd63d6b40fdd3317a913a62780c2547ca822d30b5ff56d408c440c' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.activity_objectives; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("activity_id","curriculum_id","objective_code")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."activity_objectives"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','activity_objectives',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=706 AND sha256='1fc3ec5a6943f0209300b9438fff81e3ef3ce932ba2c2afc1925dead50b916b4' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.activity_materials; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("activity_id","material_code")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."activity_materials"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','activity_materials',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=653 AND sha256='ce2382fc85ad55d99e6d7ff3572f52c7215e7a93bb205ec90cffa9677187b141' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.activity_vocabulary; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("activity_id","position","french","english")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."activity_vocabulary"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','activity_vocabulary',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=388 AND sha256='88099102febeb41d4ecc558dccb0fd871ec75d23130fe1be02b0b2cca894b548' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.activity_scaffolds; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("activity_id","language","child_instruction")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."activity_scaffolds"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','activity_scaffolds',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=463 AND sha256='d68b529c06f6fa7cf67e1c9911485af0e8e57f03b56af04edaf5b94df23b8a86' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.teaching_texts; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("id","kind","title","minutes","origin","provenance","illustration_id")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."teaching_texts"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','teaching_texts',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=21 AND sha256='3f5db4dfe43199b64216debc87ef030754160abf625184080788c5f4654fc4f5' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.teaching_text_lines; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("text_id","position","line")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."teaching_text_lines"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','teaching_text_lines',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=173 AND sha256='918b5fb3a7fd841e800db3a76b5a2fed1b012bd10ba1e338aeda95262ac1304f' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.annual_plans; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("id","curriculum_id","level_id","school_year_id","instructional_days")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."annual_plans"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','annual_plans',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=2 AND sha256='903179f8ca817e5915fb26673b11e6400d12d4093995a1306f59fdb21956ef8d' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.annual_plan_phases; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("plan_id","code","name","from_day","to_day","focus")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."annual_plan_phases"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','annual_plan_phases',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=12 AND sha256='78f8f1493147f9ffabdbc23e7266fbef63c99ab8410fc9019050a07f64431cc8' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.annual_plan_entries; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("plan_id","curriculum_id","objective_code","domain_code","phase","introduce_from_day","introduce_by_day","reinforce_until_day","consolidate_by_day","planned_revisits","cadence","needs_dedicated_lesson","embeddable","home_feasibility")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."annual_plan_entries"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','annual_plan_entries',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=278 AND sha256='bba45163f43bbecda238601833f06e324c0fe0e35373ee4b0492ec428d667f78' THEN 1 ELSE 0 END)
FROM actual;
-- Full canonical row multiset: public.school_year_curricula; every frozen column is projected.
WITH row_hashes AS MATERIALIZED (
  SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.jsonb_build_array("school_year_id","stage_id","curriculum_id")::pg_catalog.text,'UTF8')),'hex') AS h
  FROM ONLY public."school_year_curricula"
), actual AS (
  SELECT pg_catalog.count(*) AS rows,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(h,'' ORDER BY h COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS sha256
  FROM row_hashes
)
SELECT pg_catalog.jsonb_build_object('gate','canonical_content','table','school_year_curricula',
  'rows',rows,'sha256',sha256,'pass',1 / CASE WHEN rows=1 AND sha256='1ce5e96a21b0c2ab4ffe7e9c0931804d3605786fa55c8c427293aee448fff756' THEN 1 ELSE 0 END)
FROM actual;
-- Versions, names, statement boundaries and full stored statement arrays are hashed.
-- No statement bodies are returned or executed.
WITH expected(version,name,statement_count,joined_sha256,full_row_sha256) AS (VALUES
  ('20260911203000','educational_foundation',50,'40516e854fe448f3fb3566aa73f4074b695576940e977345e9ac78c4bafba6d4','54ec74b6049e83eace691749ec2563faedc4bcbba3b551b21c9fb7d733771dcd'),
  ('20260911204157','reference_data_2026_2027',20,'6ee50974277acfa479bc2a385b911670523e1af634d769e3f2502d65da4fe86b','609d7333762bfab61ff7a56b17be2571af689dd18ac4b43805954d0601aa587b'),
  ('20260911222600','curriculum_objectives_and_lessons',71,'ece9a506a0cd98ef2b78c5201d1c721388260d38e28729d36a6e2ef8720d71ec','7c8fb067a74b6c1b7ec2b253d9e31beb8599b3a0d6e8b9f4c838090c5e6bb50b'),
  ('20260911222858','curriculum_objectives_and_pilot_lessons',56,'599f46cdbcbe12bf0b9c453e4ff2b366613f3e77e39fdcb3dfde91e9ed1e225d','c3a9409a3ebfe27a2c871b5bc72f6695923d34665099dbe67ff26bd06c022450'),
  ('20260912002000','content_quality_gate',17,'da0e325c01673bad02339f9c1f3b80107bd1e144c8c9c155aa70826d379c0d50','87aeb87d1a46977d5beb088508ede56e328abfcff8133e8a617f80bedb1be41c'),
  ('20260912091922','content_quality_gate_data',56,'b2116711d73446c2139ee3aa86b2ab6c1f315ee36597df9bcae0405fcd8d4b1d','2c50103f5d92488ed8403b6f5017693d9b2f406dcebb48520efe63049ef05fe4'),
  ('20260912120000','september_programme',19,'c67baf691e6e7ebd5167e78e09f8368c2d1b0a729d721e6abc0902060dc0df45','57c87062eb6023bc569a9a68ef6f2ef7fa176f92d3f9481d6809ce7144a6352a'),
  ('20260912175902','september_programme_data',66,'8204cb54a3ba8e7985d5a3a8ceb03df17484c8a710969b8a2a8c31d3d884abe9','d0049ffddd3ec1f85a257a3105606bd750de10afafffb059de83dafa2c44196a'),
  ('20260912200000','media_assets',11,'73097d44551256de6144dd79102ca562942283d8e849b857ccdd06f6d9bfc343','af1585eb2f6e8c0081770b130d8ae801818e9bfcd7324130ffa4e461ea9868ad'),
  ('20260912202935','media_registry_data',72,'5a184e7ffd566cbaea7aec5cf1a5c91f93462db8f9a1f9c83ce1f69005b140de','b1be966f4030d51df3df678344c0ed95fe592c4c7b6302eb0063c9d6e609dfb9'),
  ('20260913060000','media_illustrations',4,'38df5ccb1aae884e649efe302284723c19ce50ad099075ba4e40d35d16090565','282a109f346812209a4048635b35477ce2bc493c0582df3f5b8956a3386947e5'),
  ('20260913065828','media_illustrations_data',72,'9b1d51aed7b0ac7920402fd52260d678fb356f1e5292b9d4c1927db317b848e7','4611a9f759bbb4993c2886b013b00bf190dcfa6230c2d04e4f30ca657bfcdd05'),
  ('20260914200033','week1_review_corrections',72,'a3316e3f4007ece055ac8fb130c979b037f886b4751e22035f4c722af05311ea','f69208140f6b163c9b6be9846bb37681d4ad8c6ffcb6abebdfb7faa01dbbc701'),
  ('20260915090000','review_kind',7,'f2f227b4d215c41f748640ccd33c1d7138b4f400b9de065ba73f805516fd9d40','7af7ad361c933c47555ecffacec99eb9a60674d6740b404c101e0e79dc9c8007'),
  ('20260915100000','maternelle_1_september',72,'26267605b6d613946694debaafe2d781e85c4b2cc4edae1609ac82b46a3a48b0','c3b0e42f77e979e08db44f2fd00d4067139fa1847840e3cc18824790c2261649'),
  ('20260915110000','maternelle_1_week_1_corrections',72,'942cec5b9c5f04541ea419839b79d7c558b5e849f957c8f727506cd2deaf5d3c','a1303c1a27b6231c0e1b4a671f7a41927e6dadec33ba4c9089ac15bccd18b3c8'),
  ('20260915120000','week_1_approved_and_progression',72,'6a269a96e29ceb7f01d9e59ab2a050782a920b174f0f7f63df669c08125fbeaa','76c3dbc62669b4e4f4d804d444d9da44a8ea3e0874c8130aae5fa7f6767f9689'),
  ('20260915130000','week_2_corrections',72,'abdc453077a5048ac6b600065191c8007f268eca7be2e4d25126605e8efb4fa7','ff651a4ddf94f44032a918d31e1a4dbd1c956bcc05496f60207c46dd89d1d97d'),
  ('20260915140000','weeks_1_2_approved',72,'d0f206ffa19c14fc7afd0b5e425e8720c339471c2108dd22fb99c15669069f0b','19074f28a0af057fcf304b813d4c01d85d08f64c28b90e720e8078f4e23d501f'),
  ('20260915150000','week_3_corrections',72,'ec8f4725c7a39f5792e6488288ed5f5e39929b0942cdda835334e75cd51ded35','faaff803e3a1fd2184d3d2ab832c34be739dcac174040914e87fdd4a62296a5d'),
  ('20260915160000','week_3_approved',72,'144ec126836967c199e4a7211f607153438bf151dcec380e9586a181604919bf','d7ec80ac998f342426f892b71e377f2b7ef13e06afb4281c04cdf22468fb775a'),
  ('20260915170000','week_4_corrections',72,'f434227654edc1638d7a9500de58a4a9f5d6fa5b164ea51300fa4c1737f1c7a5','576e18c2fe074cf1392716875919609b381c475c6d32f7623a088ebdb375ddd1'),
  ('20260915180000','lisa_visual_and_approved_debt',72,'fff5120a60caa5396b842f589c109b8a7dcca6d1403bac48b792bc310f3f8663','9307a137232b72c2f1a464cb681be9537b6bd7089d5c56425c576eedfaadf49f'),
  ('20260915190000','media_fingerprint_and_weeks_1_4',72,'4ed79511a327b12d6d1755a908e524e5604fe433d79fab5989bc50e8260392e0','58f2478c779d4402306aabe5da3b3a7de5156ac1ad302b621f9edb6d7c563d90'),
  ('20260915200000','week_5_corrections',72,'6bf17c0bf45f4cf5a8b7018d1adbb82bc9a0033211a68500884bd953287fc938','af06c18bc87c886e4826887bf0454daa4a4fdd9895bf13a2cc88c97a85bfa25f'),
  ('20260915210000','week_5_approved',72,'ef1cd7b85c8917220c3c8fcc58bf2b5c4e66e9d605718937ecb4526a1fb82baf','802099aca6b582266504bdcf50a1f0ec0680457916a5ee25ec42551c6d7fb555'),
  ('20260916183458','week1_review_corrections_m3',72,'7dfd88fccbf554e0ea4cf3cf40c6327fcd25e81b8c4f2f9b4873eccb251afdb7','6fdf6b53ef05f25ac85fa2cc6ad5012250c9e8dedb55f11285dc13e041cf9995'),
  ('20260917132516','week1_safety_and_review_scope',72,'59be92fe02aae375fdb475f89719c2e76b508d98712efa8a8645e4fd2ef0049c','c584fefe9b0cedc87d264c8a8e4154422bc159bea450f0f7f7c90503f1c0ec7d'),
  ('20260917185354','approve_maternelle_3_week_1',72,'739724d8b93198f0717287ea638f55df42344d744aa23314d5af0ea2e5815102','553dfa1d23b4cfb49b7c86a10f929752b5bd70993e4be1db6ea616353bd77f90'),
  ('20260917205257','week2_review_corrections',72,'dc6d43800953a833d2c97b84ac720bc8143cfb54fcb9a3dec38522c2c307da89','8e49db92c99c86b638b9f99aa334e918dfebeb5f3f40f406e96f54c5d99cee15'),
  ('20260918173226','week2_second_review_and_text_digest',72,'5cf28f82ea92e30b0807517f902d5917dee25eea485595a232ed3f2273e1c0b6','983c3ab8af27afb3933208fc3596aeb3d61a207dbe194a0847ccdb47ff556453'),
  ('20260919114821','week2_final_corrections',72,'0afa498fa34b7993124b82a7767ee28e35c0de061c619fa251d3d2b98242c423','faa75d167a50012e225b8b1689f1eed91bbcaed8e44b082bd72de81d184dabe5'),
  ('20260919122247','approve_maternelle_3_week_2',72,'03bce192ec0e06dea23819071f2b694e7c0f412b1003a7a4eb43961002870882','a89fadd64fd614e4a0d7cf6cb52b57cc60900f11d367e7ca855fc5c10161c5c9'),
  ('20260919130752','week3_review_corrections',72,'96c0783e36fbcf184e2dd09174d7a12d928078a220d4e28d773e97aed19a183d','34fd425e3733ed9e742512b50e02928922549bb1b89b561e7eff026fa7484072'),
  ('20260919174810','week3_second_review',72,'f77770150c52f8b4710c9fc7828b688202aec0a35871252037d9964961dcb1f4','6fc5ca46bd3da79712fbe9f1feb14ebbf8d7b972b30ef83352a1d8486f1e0969'),
  ('20260919182510','approve_maternelle_3_week_3',72,'5e42ec35b348570052e8511dc26102d023f8cd03f3abecad3dfb8b586fd574e5','fa81444f98b2be503f1f9767970eb1c62c3db6ffaef22da6ec51aab2d3f5ca63'),
  ('20260919194738','week4_review_corrections',72,'1e4f0d971aea65efc41e81aeb058d1b0154a1269b6b5b3e68fd61d4953340f32','f1792f93ec1c508cc404fe801ae7fcff9914836f6f4fc1939ab88c1f24396969'),
  ('20260920083109','week4_second_review_corrections',72,'caebc1429fdeb032332b54ce9f42b304169913d89a2b20ebfed431a1d283c6c3','75dba78e73eaa765ac601f7cd55431642089176f2a0f6aaa1fc70d0bb9cd4e13'),
  ('20260920134804','approve_maternelle_3_week_4',72,'780a9617c8df3ece374523ced51903716a7009484eba947d60d7a739c9cb0994','d6d2e5dfbea684678107c12579cd14952e2029fd0e8110db07726552de2228d7'),
  ('20260920200532','week5_review_corrections',72,'59aeb22e8699d4f024223732a4e9eff8b73755d0b3fc3459d3a1c31b099b5048','12dfeb35f19fcdeefda6520aa5cb47f931ddbf1c3c2c85f5c58bc7bae5a481ef'),
  ('20260920204404','approve_maternelle_3_week_5',72,'8f317b0fa1041f697b614dd2259e174235f285703f4dcf25d0023688e3f4cc1d','46f047b2302831ae4e1e81514488795ba40af7a5fb208c8fe1fa9738161fce20'),
  ('20260923192024','september_visual_upgrade',72,'5be43a8f87d0ec75eaea98dafe1f8e694f81397893913215849676c96c5c0360','21e02052370ca4f6d42c69584a075acd8c41feebe3780e1e60ad77cec69b83df'),
  ('20260926173653','september_reconfirmation',72,'66002f8a8773d8fbfa9a904d25ac78099ddca73e8c06e68d72fea5b6eb716c6b','02fe121548265071cd1d2884c1228bd3eabcc3427d81c5de005e81edf7024638'),
  ('20261001192741','media_asset_webp_paths',2,'1f96940291c0fe67425d67de67cac88549a61a5fd4fa335a2c0efff5ffae6487','4f91936d538a2bd13ecd389ee3eff1799eef5cec2dbdc481399c08e41bbd0834'),
  ('20261001192742','final_september_rich_media_reference',72,'4db799acc43c0090b28df1a7188d07b3df24a483f26eb0ff086e8c8ee1b14607','58587ad3df2c64bbbbffa513359f628324970be3ef3371aa9c327460e9bab274'),
  ('20261003195954','october_maternelle_3_approved',72,'fa6d93b038b540efd1649d9e87c97a6c7251addff01086cb5abaf4d067c75c1e','5536753989e779ddef29b5d980c94de35ee7a740f4ed406985ec12ef1e41b066')
), actual AS MATERIALIZED (
  SELECT version,name,pg_catalog.cardinality(statements) AS statement_count,
    pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.array_to_string(statements,E'\n'),'UTF8')),'hex') AS joined_sha256,
    pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_array(version,name,statements)::pg_catalog.text,'UTF8')),'hex') AS full_row_sha256,
    statements IS NOT NULL AND pg_catalog.array_ndims(statements)=1 AND pg_catalog.array_lower(statements,1)=1
    AND pg_catalog.array_position(statements,NULL) IS NULL AS valid_array
  FROM ONLY supabase_migrations.schema_migrations
), summary AS (
  SELECT pg_catalog.count(*) AS migrations,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    COALESCE(pg_catalog.string_agg(full_row_sha256,'' ORDER BY full_row_sha256 COLLATE pg_catalog."C"),''),'UTF8')),'hex') AS history_sha256
  FROM actual
), checks AS (
  SELECT NOT EXISTS ((SELECT version,name,statement_count,joined_sha256,full_row_sha256 FROM actual EXCEPT ALL SELECT * FROM expected)
    UNION ALL (SELECT * FROM expected EXCEPT ALL SELECT version,name,statement_count,joined_sha256,full_row_sha256 FROM actual))
    AND NOT EXISTS (SELECT 1 FROM actual WHERE valid_array IS NOT TRUE) AS pass
)
SELECT pg_catalog.jsonb_build_object('gate','migration_history','migrations',migrations,
  'versions_names',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_array(version,name)
    ORDER BY version COLLATE pg_catalog."C") FROM actual),
  'history_sha256',history_sha256,'pass',1 / CASE WHEN checks.pass IS TRUE AND migrations=46
    AND history_sha256='c0deeb4439a335b6ae73bb8b2d1df1212a895c43979d7fd642137528fed7d375' THEN 1 ELSE 0 END)
FROM summary CROSS JOIN checks;
-- Four aggregate counts only; no Auth or Storage values are projected.
WITH counts AS MATERIALIZED (
  SELECT (SELECT pg_catalog.count(*) FROM ONLY auth.users) AS auth_users,
    (SELECT pg_catalog.count(*) FROM ONLY auth.identities) AS auth_identities,
    (SELECT pg_catalog.count(*) FROM ONLY storage.buckets) AS storage_buckets,
    (SELECT pg_catalog.count(*) FROM ONLY storage.objects) AS storage_objects
)
SELECT pg_catalog.jsonb_build_object('gate','auth_storage_empty','auth_users',auth_users,
  'auth_identities',auth_identities,'storage_buckets',storage_buckets,'storage_objects',storage_objects,
  'pass',1 / CASE WHEN auth_users=0 AND auth_identities=0 AND storage_buckets=0 AND storage_objects=0 THEN 1 ELSE 0 END)
FROM counts;
-- Catalog-only footprint. Catalog OID/node hashes detect drift on this source;
-- they are observations, not a portable schema-equivalence proof.
WITH routines AS MATERIALIZED (
  SELECT n.nspname,p.oid,p.proname,p.prolang,p.prorettype,p.proargtypes,p.prokind,p.prosecdef,p.provolatile,
    pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') AS source_sha256,
    pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(COALESCE(p.prosqlbody::pg_catalog.text,''),'UTF8')),'hex') AS sql_body_sha256,
    pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(COALESCE(p.probin,''),'UTF8')),'hex') AS binary_path_sha256,
    pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(COALESCE(p.proconfig::pg_catalog.text,''),'UTF8')),'hex') AS config_sha256
  FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname<>'pg_catalog' AND n.nspname<>'information_schema' AND n.nspname !~ '^pg_toast'
), dependency_rows AS MATERIALIZED (
  SELECT pg_catalog.jsonb_build_array(classid,objid,objsubid,refclassid,refobjid,refobjsubid,deptype)::pg_catalog.text AS row
  FROM pg_catalog.pg_depend
), definition_rows AS MATERIALIZED (
  SELECT 'default' AS kind,d.oid, d.adbin::pg_catalog.text AS node
  FROM pg_catalog.pg_attrdef d JOIN pg_catalog.pg_class c ON c.oid=d.adrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('public','private','supabase_migrations')
  UNION ALL SELECT 'constraint',x.oid,COALESCE(x.conbin::pg_catalog.text,'')
  FROM pg_catalog.pg_constraint x JOIN pg_catalog.pg_namespace n ON n.oid=x.connamespace
  WHERE n.nspname IN ('public','private','supabase_migrations')
  UNION ALL SELECT 'policy',p.oid,COALESCE(p.polqual::pg_catalog.text,'') || COALESCE(p.polwithcheck::pg_catalog.text,'')
  FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('public','private','supabase_migrations')
  UNION ALL SELECT 'index',i.indexrelid,COALESCE(i.indexprs::pg_catalog.text,'') || COALESCE(i.indpred::pg_catalog.text,'')
  FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class c ON c.oid=i.indrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('public','private','supabase_migrations')
)
SELECT pg_catalog.jsonb_build_object('observation','catalog_dependency_footprint',
  'extensions',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name',e.extname,'version',e.extversion,
    'schema',n.nspname,'configuration_relations',COALESCE(pg_catalog.cardinality(e.extconfig),0),
    'configuration_conditions_sha256',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(COALESCE(e.extcondition::pg_catalog.text,''),'UTF8')),'hex'))
    ORDER BY e.extname COLLATE pg_catalog."C") FROM pg_catalog.pg_extension e JOIN pg_catalog.pg_namespace n ON n.oid=e.extnamespace),
  'application_routines',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('schema',nspname,'name',proname,
    'security_definer',prosecdef,'source_sha256',source_sha256,'config_sha256',config_sha256)
    ORDER BY nspname COLLATE pg_catalog."C",proname COLLATE pg_catalog."C") FROM routines WHERE nspname IN ('public','private')),
  'non_system_routine_count',(SELECT pg_catalog.count(*) FROM routines),
  'non_system_routine_catalog_sha256',(SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(COALESCE(
    pg_catalog.string_agg(pg_catalog.jsonb_build_array(nspname,oid,proname,prolang,prorettype,proargtypes::pg_catalog.text,
      prokind,prosecdef,provolatile,source_sha256,sql_body_sha256,binary_path_sha256,config_sha256)::pg_catalog.text,'' ORDER BY oid),''),'UTF8')),'hex') FROM routines),
  'dependency_count',(SELECT pg_catalog.count(*) FROM dependency_rows),
  'dependency_sha256',(SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(COALESCE(
    pg_catalog.string_agg(row,'' ORDER BY row COLLATE pg_catalog."C"),''),'UTF8')),'hex') FROM dependency_rows),
  'definition_node_count',(SELECT pg_catalog.count(*) FROM definition_rows),
  'definition_node_sha256',(SELECT pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(COALESCE(
    pg_catalog.string_agg(pg_catalog.jsonb_build_array(kind,oid,pg_catalog.encode(pg_catalog.sha256(
      pg_catalog.convert_to(node,'UTF8')),'hex'))::pg_catalog.text,'' ORDER BY kind COLLATE pg_catalog."C",oid),''),'UTF8')),'hex') FROM definition_rows),
  'foreign_server_count',(SELECT pg_catalog.count(*) FROM pg_catalog.pg_foreign_server),
  'large_object_count',(SELECT pg_catalog.count(*) FROM pg_catalog.pg_largeobject_metadata));
SELECT pg_catalog.jsonb_build_object('gate','no_foreign_or_large_object_scope','pass',1 / CASE WHEN (
  NOT EXISTS (SELECT 1 FROM pg_catalog.pg_foreign_server)
  AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_largeobject_metadata)) IS TRUE THEN 1 ELSE 0 END);
ROLLBACK;
SELECT pg_catalog.jsonb_build_object('inspection_complete',true,'application_tables',36,
  'application_columns',213,'canonical_rows',6170,'migrations',46,'database_writes',0,
  'inspection_scope','APPROVED_41_HEAP_RELATIONS_ONLY',
  'backup_scope','NOT VERIFIED','rebuild_scope','NOT VERIFIED','provider_allowlist_complete',false,
  'owner_namespace_classification_required',true);
