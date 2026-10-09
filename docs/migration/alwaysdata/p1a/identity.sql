-- P1-A PROPOSAL ONLY. Not executed; separate PROD connection authorization required.
-- This candidate binds the proposed dedicated audit name. An existing approved login
-- requires a reviewed literal substitution and a new file digest before execution.
-- Run this ONE statement first; do not concatenate/auto-run the catalog/data files.
-- Never use staging credentials. Client verify-full must be proved outside SQL.
SELECT
  pg_catalog.current_database() AS database_name,
  SESSION_USER AS authenticated_login,
  CURRENT_USER AS effective_login,
  pg_catalog.current_setting('server_version') AS server_version,
  pg_catalog.current_setting('server_version_num')::integer AS server_version_num,
  pg_catalog.current_setting('transaction_read_only') AS transaction_read_only,
  pg_catalog.current_setting('default_transaction_read_only') AS default_transaction_read_only,
  pg_catalog.current_setting('row_security') AS row_security,
  pg_catalog.current_setting('search_path') AS search_path,
  pg_catalog.current_setting('statement_timeout') AS statement_timeout,
  pg_catalog.current_setting('lock_timeout') AS lock_timeout,
  pg_catalog.inet_server_port() AS server_port,
  r.rolsuper, r.rolcreatedb, r.rolcreaterole, r.rolreplication, r.rolbypassrls,
  r.rolcanlogin,
  ssl.ssl AS session_tls, ssl.version AS tls_protocol, ssl.cipher AS tls_cipher,
  (
    pg_catalog.current_database() = 'congofoot_teka_edu_prod'
    AND SESSION_USER = 'congofoot_user_teka_edu_prod_audit'
    AND CURRENT_USER = SESSION_USER
    AND pg_catalog.current_setting('server_version_num')::integer BETWEEN 160000 AND 169999
    AND pg_catalog.current_setting('transaction_read_only') = 'on'
    AND pg_catalog.current_setting('default_transaction_read_only') = 'on'
    AND pg_catalog.current_setting('row_security') = 'off'
    AND pg_catalog.current_setting('search_path') = 'pg_catalog'
    AND pg_catalog.current_setting('statement_timeout') = '15s'
    AND pg_catalog.current_setting('lock_timeout') = '2s'
    AND pg_catalog.inet_server_port() = 5432
    AND NOT r.rolsuper AND NOT r.rolcreatedb AND NOT r.rolcreaterole
    AND NOT r.rolreplication AND NOT r.rolbypassrls AND r.rolcanlogin
    AND ssl.ssl
  ) IS TRUE AS server_side_identity_guard
FROM pg_catalog.pg_roles AS r
LEFT JOIN pg_catalog.pg_stat_ssl AS ssl ON ssl.pid = pg_catalog.pg_backend_pid()
WHERE r.rolname = SESSION_USER;
