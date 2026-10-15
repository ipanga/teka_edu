/** PostgreSQL 16 stdin renderer, with standard_conforming_strings=on and UTF8 pinned.
 * Only structural semicolons gain a psql escape; server SQL/source hashes stay unchanged.
 * This recognizes lexical boundaries, not arbitrary PostgreSQL grammar. Unsupported
 * client controls, variable interpolation and unterminated input fail before submission.
 */
export function renderMigrationBatch(sql: string): { input: string; statements: number } {
  if (
    !sql ||
    !sql.isWellFormed() ||
    sql.includes("\0") ||
    Buffer.byteLength(sql, "utf8") > 8 * 1024 * 1024
  )
    throw new Error("Migration batch input is invalid or exceeds its bound");
  const parts: string[] = [];
  const code: string[] = [];
  let start = 0;
  let statements = 0;
  let codeStart = 0;
  const identifier = (c: string | undefined) => !!c && /[A-Za-z0-9_$\u0080-\uFFFF]/.test(c);
  const opaque = (end: number) => {
    code.push(sql.slice(codeStart, i), " ".repeat(end - i));
    i = end;
    codeStart = end;
  };
  let i = 0;
  while (i < sql.length) {
    if (sql.startsWith("--", i)) {
      let end = i + 2;
      while (end < sql.length && sql[end] !== "\n" && sql[end] !== "\r") end++;
      opaque(end);
    } else if (sql.startsWith("/*", i)) {
      let end = i + 2;
      let depth = 1;
      while (end < sql.length && depth) {
        if (sql.startsWith("/*", end)) {
          depth++;
          end += 2;
        } else if (sql.startsWith("*/", end)) {
          depth--;
          end += 2;
        } else end++;
      }
      if (depth) throw new Error("Migration batch has an unterminated comment");
      opaque(end);
    } else if (sql[i] === "'" || sql[i] === '"') {
      const quote = sql[i]!;
      const escaped = quote === "'" && /[eE]/.test(sql[i - 1] ?? "") && !identifier(sql[i - 2]);
      let end = i + 1;
      let closed = false;
      while (end < sql.length) {
        if (escaped && sql[end] === "\\") {
          end += 2;
        } else if (sql[end] === quote) {
          if (sql[end + 1] === quote) end += 2;
          else {
            end++;
            closed = true;
            break;
          }
        } else end++;
      }
      if (!closed) throw new Error("Migration batch has an unterminated quoted token");
      opaque(end);
    } else if (sql[i] === "$" && !identifier(sql[i - 1])) {
      const tag = sql
        .slice(i)
        .match(/^\$(?:[A-Za-z_\u0080-\uFFFF][A-Za-z0-9_\u0080-\uFFFF]*)?\$/)?.[0];
      if (!tag) {
        i++;
        continue;
      }
      const end = sql.indexOf(tag, i + tag.length);
      if (end < 0) throw new Error("Migration batch has an unterminated dollar body");
      opaque(end + tag.length);
    } else if (sql[i] === "\\") {
      throw new Error("Migration batch contains an unreviewed client control");
    } else if (sql[i] === ":") {
      if (sql[i + 1] !== ":")
        throw new Error("Migration batch contains unreviewed variable interpolation");
      i += 2;
    } else if (sql[i] === ";") {
      parts.push(sql.slice(start, i), "\\;");
      statements++;
      i++;
      start = i;
    } else {
      i++;
    }
  }
  code.push(sql.slice(codeStart));
  const executable = code.join("");
  if (
    /(^|;)\s*(?:begin|start\s+transaction|commit|end|rollback|abort|vacuum|discard|create\s+database|drop\s+database|alter\s+system|create\s+subscription)\b/i.test(
      executable,
    ) ||
    /\b(?:create|drop)\s+(?:unique\s+)?index\s+concurrently\b/i.test(executable)
  )
    throw new Error("Migration batch contains unsupported transaction controls");
  // These are absent from the frozen migrations. They could alter lexer assumptions
  // or switch psql into its separate COPY data protocol, and need a new design review.
  if (/(^|;)\s*(?:set|reset|copy)\b/i.test(executable) || /\bset_config\s*\(/i.test(executable))
    throw new Error("Migration batch contains unsupported session or COPY controls");
  if (!statements || !/;\s*$/.test(executable))
    throw new Error("Migration batch must end at a complete statement boundary");
  parts.push(sql.slice(start));
  // A fresh newline prevents a trailing line comment from swallowing our client command.
  return { input: parts.join("") + "\n\\g\n", statements };
}
