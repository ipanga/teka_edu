with objects as (
  select 'schema' kind,n.nspname name,n.nspowner owner,n.nspacl acl,'n'::"char" aclkind
  from pg_namespace n where n.nspname in ('public','private','extensions','teka_migrations')
  union all
  select 'table',n.nspname || '.' || c.relname,c.relowner,c.relacl,'r'::"char"
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','teka_migrations') and c.relkind in ('r','p')
  union all
  select 'function',n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',p.proowner,p.proacl,'f'::"char"
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private'
)
select coalesce(jsonb_agg(jsonb_build_object(
  'kind',o.kind,'name',o.name,'owner',pg_get_userbyid(o.owner),
  'grants',(select coalesce(jsonb_agg(jsonb_build_object(
    'grantee',case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,
    'grantor',pg_get_userbyid(a.grantor),'privilege',a.privilege_type,'grantable',a.is_grantable
  ) order by a.grantee,a.privilege_type),'[]') from aclexplode(coalesce(o.acl,acldefault(o.aclkind,o.owner))) a)
) order by o.kind,o.name),'[]') from objects o;
