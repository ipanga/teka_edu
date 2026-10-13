import { describe, expect, it } from "vitest";
import { renderMigrationBatch } from "@/lib/postgres/batch";
import { loadMigrations, executableSql } from "@/lib/postgres/migrations";

describe("PostgreSQL 16 SQL-aware stdin batching", () => {
  it.each([
    ["select 1; select 2;", "select 1\\; select 2\\;\n\\g\n", 2],
    ["select 'a;b', 'it''s;fine';", "select 'a;b', 'it''s;fine'\\;\n\\g\n", 1],
    [
      'select "semi;colon", "double"";quote";',
      'select "semi;colon", "double"";quote"\\;\n\\g\n',
      1,
    ],
    [
      "select E'it\\'s;fine', 'back\\slash;';",
      "select E'it\\'s;fine', 'back\\slash;'\\;\n\\g\n",
      1,
    ],
    [
      "select U&'d\\0061;ta', U&\"d\\0061;ta\";",
      "select U&'d\\0061;ta', U&\"d\\0061;ta\"\\;\n\\g\n",
      1,
    ],
    [
      "-- comment; \\! forbidden\nselect 1; -- trailing;",
      "-- comment; \\! forbidden\nselect 1\\; -- trailing;\n\\g\n",
      1,
    ],
    [
      "/* outer; /* nested; */ tail; */ select 1;",
      "/* outer; /* nested; */ tail; */ select 1\\;\n\\g\n",
      1,
    ],
    ["select $$literal; \\echo x$$;", "select $$literal; \\echo x$$\\;\n\\g\n", 1],
    [
      "select $étiquette$a;$other$;$étiquette$;",
      "select $étiquette$a;$other$;$étiquette$\\;\n\\g\n",
      1,
    ],
    ["select $🥭$literal;body$🥭$;", "select $🥭$literal;body$🥭$\\;\n\\g\n", 1],
    ["select 'é;🥭'::text;", "select 'é;🥭'::text\\;\n\\g\n", 1],
    ["select 'first;'\n 'continued;';", "select 'first;'\n 'continued;'\\;\n\\g\n", 1],
    [
      "create function pg_temp.f() returns void language plpgsql as $fn$ begin perform 'a;b'; end; $fn$; select 2;",
      "create function pg_temp.f() returns void language plpgsql as $fn$ begin perform 'a;b'; end; $fn$\\; select 2\\;\n\\g\n",
      2,
    ],
  ])("preserves lexical content in %s", (sql, expected, statements) => {
    expect(renderMigrationBatch(sql)).toEqual({ input: expected, statements });
  });
  it.each([
    "",
    "select 1",
    "select 1; select 2",
    "select 'unterminated;",
    'select "unterminated;',
    "select $tag$unterminated;",
    "/* outer /* inner */",
    "select E'dangling\\';",
    "select 1;\n\\! echo PRIVATE",
    "select :SECRET;",
    "select :'SECRET';",
    "begin; select 1;",
    "select 1; commit;",
    "rollback;",
    "abort;",
    "discard all;",
    "select '\ud800';",
    "vacuum;",
    "set standard_conforming_strings=off; select 1;",
    "reset all;",
    "copy t from stdin;",
    "select set_config('standard_conforming_strings','off',true);",
    "select '\0';",
  ])("fails closed on unsupported or incomplete input", (sql) => {
    expect(() => renderMigrationBatch(sql)).toThrow();
  });
  it("rejects oversized input without including its contents in errors", () => {
    expect(() => renderMigrationBatch("SECRET".repeat(1400000))).toThrow(/bound/);
  });
  it("renders every frozen file and history boundary without altering source or execution hashes", () => {
    for (const m of loadMigrations()) {
      const history = `\ninsert into teka_migrations.history values ('${m.version}');`;
      const batch = renderMigrationBatch(m.sql + history);
      expect(batch.statements).toBe((executableSql(m.sql).match(/;/g) ?? []).length + 1);
      // Structural escape positions come from the lexer, not literal semicolons.
      expect(batch.input.endsWith("\\;\n\\g\n")).toBe(true);
      expect(m.source_sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(m.execution_sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });
});
