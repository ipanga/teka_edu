"""Offline PostgreSQL 16 parsing/safety regressions. Never connects or executes SQL.

Run with Python + pglast 6.16; no project or deployment dependency is added.
The fixed guard fingerprints require an explicit review when identities/settings change.
"""

import hashlib
import json
from pathlib import Path

import pglast
from pglast import parser

ROOT = Path(__file__).resolve().parents[4]
QUERY_DIR = ROOT / 'docs/migration/alwaysdata/p1a'
LOGIN = 'congofoot_readonly_user_teka_edu_prod'
DATABASE = 'congofoot_teka_edu_prod'
GUARD_HASHES = {
    'identity.sql': '0106203c9b724387af852f22302e1dfe6d80994f4fa06b3d6008a1133e80683a',
    'catalog.sql': '6450675a0db805f0b63ba2140efb12b91bfc35960e22ad492a586a1de04d38e9',
}
FUNCTIONS = {
    'current_database', 'current_setting', 'inet_server_port', 'pg_backend_pid',
    'jsonb_build_object', 'statement_timestamp', 'jsonb_agg', 'pg_has_role',
    'pg_get_userbyid', 'has_database_privilege', 'has_schema_privilege',
    'row_security_active', 'has_table_privilege', 'has_any_column_privilege',
    'has_sequence_privilege', 'md5', 'pg_get_expr', 'unnest',
    'pg_get_function_identity_arguments', 'has_function_privilege', 'split_part',
    'count', 'pg_get_constraintdef', 'pg_get_triggerdef', 'pg_get_indexdef',
    'pg_get_ruledef',
}
CATALOGS = {
    'pg_roles', 'pg_stat_ssl', 'pg_namespace', 'pg_class', 'pg_am', 'pg_proc',
    'pg_language', 'pg_depend', 'pg_database', 'pg_attribute', 'pg_attrdef',
    'pg_type', 'pg_constraint', 'pg_trigger', 'pg_index', 'pg_rewrite', 'pg_policy',
    'pg_extension', 'pg_default_acl', 'pg_shdepend', 'pg_foreign_server',
    'pg_publication', 'pg_user_mapping', 'pg_largeobject_metadata',
    'pg_event_trigger', 'pg_inherits',
}
TYPES = {'int4', 'jsonb', 'regclass', 'text'}
OPERATORS = {'=', '<>', '!~', '~', '~*', '>', 'BETWEEN'}
METADATA_KEYS = {
    'roles', 'reachable_roles', 'role_replication', 'databases',
    'effective_connect', 'effective_create', 'effective_temp',
    'other_database_connect_counts', 'schemas', 'audit_create',
    'audit_usage_grant_option', 'relations', 'audit_rls_active',
    'audit_select_grant_option', 'audit_write', 'audit_sequence_select',
    'audit_sequence_select_grant_option', 'audit_sequence_write',
    'columns', 'policies', 'routines', 'audit_execute',
    'audit_execute_grant_option', 'default_acls',
    'audit_ownership_dependency_count', 'missing_roles',
}


def require(ok, code):
    if not ok:
        raise ValueError(code)


def normalized(value):
    if isinstance(value, dict):
        return {k: normalized(v) for k, v in value.items()
                if k not in {'location', 'stmt_location', 'stmt_len'}}
    if isinstance(value, list):
        return [normalized(v) for v in value]
    return value


def guard_digest(select, name):
    if name == 'identity.sql':
        guards = [n['ResTarget']['val'] for n in select['targetList']
                  if n['ResTarget'].get('name') == 'server_side_identity_guard']
    else:
        guards = [n['CommonTableExpr']['ctequery']['SelectStmt']['targetList'][0]['ResTarget']['val']
                  for n in select.get('withClause', {}).get('ctes', [])
                  if n['CommonTableExpr']['ctename'] == 'guard']
    require(len(guards) == 1, 'GUARD_MISSING_OR_AMBIGUOUS')
    return hashlib.sha256(json.dumps(normalized(guards[0]), sort_keys=True,
                                    separators=(',', ':')).encode()).hexdigest()


def validate(sql, name):
    tree = json.loads(parser.parse_sql_json(sql))
    require(len(tree['stmts']) == 1, 'EXACTLY_ONE_SELECT_REQUIRED')
    require('SelectStmt' in tree['stmts'][0]['stmt'], 'SELECT_REQUIRED')
    select = tree['stmts'][0]['stmt']['SelectStmt']
    ctes = {n['CommonTableExpr']['ctename']
            for n in select.get('withClause', {}).get('ctes', [])}
    functions, relations = set(), set()

    def walk(value):
        if isinstance(value, list):
            for node in value:
                walk(node)
        elif isinstance(value, dict):
            for kind, node in value.items():
                if kind.endswith('Stmt'):
                    require(kind == 'SelectStmt', 'NON_SELECT_STATEMENT')
                if kind == 'SelectStmt':
                    require(not node.get('intoClause'), 'SELECT_INTO')
                    require(not node.get('lockingClause'), 'ROW_LOCKING')
                if kind == 'FuncCall':
                    parts = [n['String']['sval'] for n in node['funcname']]
                    require(len(parts) == 2 and parts[0] == 'pg_catalog'
                            and parts[1] in FUNCTIONS, 'UNREVIEWED_FUNCTION')
                    functions.add('.'.join(parts))
                if kind == 'RangeVar':
                    schema, relation = node.get('schemaname'), node['relname']
                    require((schema == 'pg_catalog' and relation in CATALOGS)
                            or (schema is None and relation in ctes), 'UNREVIEWED_RELATION')
                    relations.add((schema or 'CTE') + '.' + relation)
                if kind in {'TypeName', 'typeName'}:
                    parts = [n['String']['sval'] for n in node['names']]
                    require(len(parts) == 2 and parts[0] == 'pg_catalog'
                            and parts[1] in TYPES, 'UNREVIEWED_CAST')
                if kind == 'A_Expr' and node.get('name'):
                    parts = [n['String']['sval'] for n in node['name']]
                    require(len(parts) == 1 and parts[0] in OPERATORS, 'UNREVIEWED_OPERATOR')
                if kind == 'CollateClause':
                    require(False, 'UNREVIEWED_COLLATION')
                walk(node)

    walk(tree)
    require(guard_digest(select, name) == GUARD_HASHES[name], 'IDENTITY_OR_SESSION_GUARD_CHANGED')
    require("SESSION_USER = '" + LOGIN + "'" in sql, 'FIXED_LOGIN_REQUIRED')
    require("current_database() = '" + DATABASE + "'" in sql, 'FIXED_DATABASE_REQUIRED')
    if name == 'catalog.sql':
        require(all("'" + key + "'" in sql for key in METADATA_KEYS),
                'REQUIRED_PERMISSION_DIAGNOSTIC_MISSING')
    return {'statements': 1, 'guard_sha256': GUARD_HASHES[name],
            'functions': sorted(functions), 'relations': sorted(relations)}


def main():
    require(pglast.__version__.lstrip('v') == '6.16', 'REVIEWED_PARSER_VERSION_REQUIRED')
    require(parser.get_postgresql_version()[0] == 16, 'POSTGRESQL_16_GRAMMAR_REQUIRED')
    sqls = {name: (QUERY_DIR / name).read_text() for name in GUARD_HASHES}
    results = {name: {**validate(sql, name),
                      'sha256': hashlib.sha256((QUERY_DIR / name).read_bytes()).hexdigest()}
               for name, sql in sqls.items()}
    require(all(line.rstrip() == line for sql in sqls.values() for line in sql.splitlines()),
            'TRAILING_WHITESPACE')
    unsafe = {
        'select_into': 'SELECT 1 INTO made_table;',
        'write_cte': 'WITH w AS (DELETE FROM t RETURNING *) SELECT * FROM w;',
        'row_lock': 'SELECT * FROM pg_catalog.pg_class FOR UPDATE;',
        'application_function': 'SELECT public.side_effect();',
        'ddl': 'CREATE ROLE invalid;',
        'session_mutation': "SELECT pg_catalog.set_config('row_security','on',false);",
        'file_read': "SELECT pg_catalog.pg_read_file('/unapproved');",
        'unqualified_function': 'SELECT current_database();',
        'unqualified_relation': 'SELECT * FROM education_stages;',
        'application_relation': 'SELECT * FROM public.education_stages;',
        'password_catalog': 'SELECT * FROM pg_catalog.pg_authid;',
        'application_cast': sqls['identity.sql'].replace(
            'SELECT\n', "SELECT\n  'x'::public.unsafe_type AS injected,\n", 1),
        'sleep': 'SELECT pg_catalog.pg_sleep(1);',
        'multiple_statements': sqls['identity.sql'] + ' SELECT 1;',
    }
    identity = sqls['identity.sql']
    for label, old, new in [
        ('old_login', LOGIN, 'congofoot_user_teka_edu_prod_audit'),
        ('privileged_login', LOGIN, 'congofoot_user_teka_edu_prod'),
        ('dev_database', DATABASE, 'congofoot_teka_edu_dev'),
        ('version', 'BETWEEN 160000 AND 169999', 'BETWEEN 150000 AND 179999'),
        ('read_write', "transaction_read_only') = 'on'", "transaction_read_only') = 'off'"),
        ('rls_filtering', "row_security') = 'off'", "row_security') = 'on'"),
        ('search_path', "search_path') = 'pg_catalog'", "search_path') = 'public'"),
        ('timeout', "statement_timeout') = '15s'", "statement_timeout') = '0'"),
        ('lock_timeout', "lock_timeout') = '2s'", "lock_timeout') = '0'"),
        ('pooler', 'inet_server_port() = 5432', 'inet_server_port() = 5433'),
        ('tls', 'AND ssl.ssl', 'AND TRUE'),
        ('bypassrls', 'AND NOT r.rolbypassrls', 'AND TRUE'),
    ]:
        require(old in identity, 'FIXTURE_MATCH_REQUIRED')
        unsafe[label] = identity.replace(old, new)
    refused = {}
    for label, sql in unsafe.items():
        try:
            validate(sql, 'identity.sql')
        except (ValueError, parser.ParseError) as error:
            refused[label] = str(error).split('\n')[0] if isinstance(error, ValueError) else 'SQL_SYNTAX_REJECTED'
        else:
            raise ValueError('UNSAFE_FIXTURE_ACCEPTED:' + label)
    # The catalog's own guard must refuse the same privilege/settings downgrades.
    for label, old, new in [
        ('catalog_old_login', LOGIN, 'congofoot_user_teka_edu_prod_audit'),
        ('catalog_tls', 'AND s.ssl', 'AND TRUE'),
        ('catalog_bypassrls', 'AND NOT r.rolbypassrls', 'AND TRUE'),
        ('catalog_privileged_login', LOGIN, 'congofoot_user_teka_edu_prod'),
    ]:
        require(old in sqls['catalog.sql'], 'CATALOG_FIXTURE_MATCH_REQUIRED')
        try:
            validate(sqls['catalog.sql'].replace(old, new), 'catalog.sql')
        except ValueError as error:
            refused[label] = str(error)
        else:
            raise ValueError('CATALOG_UNSAFE_FIXTURE_ACCEPTED:' + label)
    for key in sorted(METADATA_KEYS):
        try:
            validate(sqls['catalog.sql'].replace("'" + key + "'", "'removed_diagnostic'"),
                     'catalog.sql')
        except ValueError as error:
            refused['missing_' + key] = str(error)
        else:
            raise ValueError('MISSING_DIAGNOSTIC_ACCEPTED:' + key)
    print(json.dumps({'syntax_and_select_ast': 'PASS', 'fixed_identity_session_guard': 'PASS',
                      'pglast_version': pglast.__version__,
                      'postgresql_parser_version': parser.get_postgresql_version(),
                      'unsafe_regressions_refused': len(refused), 'fixtures': refused,
                      'sql_execution': 'NOT RUN; OFFLINE ONLY', 'results': results}, indent=2))


if __name__ == '__main__':
    main()
