-- Session-local equivalents of the existing assertion semantics. No installed extension,
-- persistent test functions, global roles or committed test mutations are required.
drop table if exists pg_temp.teka_assertion_state;
create temporary table teka_assertion_state (expected integer, passed integer);
create or replace function pg_temp.plan(expected integer) returns text language plpgsql as $$
begin
  delete from pg_temp.teka_assertion_state;
  insert into pg_temp.teka_assertion_state values (expected,0);
  return '1..' || expected;
end $$;
create or replace function pg_temp.ok(condition boolean, description text) returns text language plpgsql as $$
begin
  if condition is distinct from true then raise exception 'Assertion failed: %', description; end if;
  update pg_temp.teka_assertion_state set passed = passed + 1;
  return 'ok: ' || description;
end $$;
create or replace function pg_temp.is(actual anyelement, expected anyelement, description text) returns text language plpgsql as $$
begin return pg_temp.ok(actual is not distinct from expected,description); end $$;
create or replace function pg_temp.throws_ok(statement text, expected_state text, expected_message text, description text)
returns text language plpgsql as $$
declare caught_state text; caught_message text;
begin
  begin execute statement;
  exception when others then caught_state := sqlstate; caught_message := sqlerrm;
  end;
  return pg_temp.ok(caught_state = expected_state and (expected_message is null or caught_message = expected_message), description);
end $$;
create or replace function pg_temp.lives_ok(statement text, description text) returns text language plpgsql as $$
declare succeeded boolean := true;
begin
  begin execute statement; exception when others then succeeded := false; end;
  return pg_temp.ok(succeeded,description);
end $$;
create or replace function pg_temp.results_eq(actual text, expected text, description text) returns text language plpgsql as $$
declare actual_rows text[]; expected_rows text[];
begin
  execute 'select coalesce(array_agg(row(t.*)::text),''{}''::text[]) from (' || actual || ') t' into actual_rows;
  execute 'select coalesce(array_agg(row(t.*)::text),''{}''::text[]) from (' || expected || ') t' into expected_rows;
  return pg_temp.ok(actual_rows is not distinct from expected_rows, description);
end $$;
create or replace function pg_temp.bag_eq(actual text, expected text, description text) returns text language plpgsql as $$
declare matches boolean;
begin
  execute 'select not exists (((' || actual || ') except all (' || expected || ')) union all ((' || expected || ') except all (' || actual || ')))' into matches;
  return pg_temp.ok(matches, description);
end $$;
create or replace function pg_temp.finish() returns setof text language plpgsql as $$
declare result record;
begin
  select * into result from pg_temp.teka_assertion_state;
  if result.passed is distinct from result.expected then raise exception 'Assertion count mismatch: % / %', result.passed,result.expected; end if;
  return next 'assertions passed: ' || result.passed;
end $$;
