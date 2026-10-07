import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import audit from "@/docs/migration/alwaysdata/migration-audit.json";
import rules from "./adapter-rules.json";

export const ADAPTER_VERSION = "postgres16-public-revocations-v1";
export const ROOT = path.resolve(
  process.env.TEKA_POSTGRES_ROOT ?? path.join(import.meta.dirname, "../.."),
);
export const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
/** Bind evidence to the actual runner, assertions, target guards and reviewed baseline. */
export function toolingDigest() {
  const files = [
    ...["lib/postgres", "scripts/postgres"].flatMap((directory) =>
      readdirSync(path.join(ROOT, directory))
        .sort()
        .map((name) => `${directory}/${name}`),
    ),
    "scripts/postgres-migrate.ts",
    "lib/content/reference-data.ts",
    "lib/supabase/reference-sql.ts",
    "docs/migration/alwaysdata/migration-audit.json",
    "docs/migration/alwaysdata/canonical-sha256.json",
    ...["educational_foundation", "curriculum_lessons", "reference_data"].map(
      (name) => `supabase/tests/database/${name}.test.sql`,
    ),
  ];
  return sha256(
    JSON.stringify(files.sort().map((file) => [file, sha256(readFileSync(path.join(ROOT, file)))])),
  );
}
export type Migration = {
  version: string;
  filename: string;
  source_sha256: string;
  execution_sha256: string;
  adapter_version: string;
  adapted: boolean;
  sql: string;
};
export type History = Omit<Migration, "sql" | "adapted"> & {
  target: string;
  release_sha: string;
};

/** Keep offsets while removing comments/quoted SQL from the safety scan. */
export function executableSql(sql: string): string {
  return sql.replace(
    /--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:""|[^"])*"|\$([a-z_][a-z_0-9]*|)\$[\s\S]*?\$\1\$/gi,
    (token) => " ".repeat(token.length),
  );
}

export function assertTransactional(sql: string) {
  const executable = executableSql(sql);
  if (
    /(^|;)\s*(begin|start\s+transaction|commit|end|rollback|vacuum|create\s+database|drop\s+database|alter\s+system|create\s+subscription)\b/i.test(
      executable,
    ) ||
    /\b(?:create|drop)\s+(?:unique\s+)?index\s+concurrently\b/i.test(executable) ||
    /(^|\n)\s*\\/.test(executable)
  ) {
    throw new Error(
      "Nontransactional or psql control SQL requires a separately reviewed runner version",
    );
  }
}

export function adaptMigration(filename: string, source: string): string {
  const transformations = (rules as Record<string, { from: string; to: string }[]>)[filename] ?? [];
  let execution = source;
  for (const rule of transformations) {
    if (execution.split(rule.from).length !== 2) {
      throw new Error(`Unexpected adapter shape: ${filename}`);
    }
    execution = execution.replace(rule.from, rule.to);
  }
  if (/\b(?:anon|authenticated)\b/i.test(executableSql(execution))) {
    throw new Error(`Unknown Supabase role construct: ${filename}`);
  }
  assertTransactional(execution);
  return execution;
}

/** This phase accepts exactly the frozen audited chain; new files require reconciliation. */
export function loadMigrations(directory = path.join(ROOT, "supabase/migrations")): Migration[] {
  const filenames = readdirSync(directory)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const expected = audit.migrations.map((migration) => migration.file).sort();
  if (JSON.stringify(filenames) !== JSON.stringify(expected)) {
    throw new Error("Historical migration registry changed; reconcile the frozen inventory first");
  }
  return filenames.map((filename) => {
    if (!/^\d{14}_[a-z0-9_]+\.sql$/.test(filename)) throw new Error("Invalid migration filename");
    const bytes = readFileSync(path.join(directory, filename));
    const sourceHash = sha256(bytes);
    if (sourceHash !== audit.migrations.find((migration) => migration.file === filename)?.sha256) {
      throw new Error(`Source checksum changed: ${filename}`);
    }
    const sql = adaptMigration(filename, bytes.toString("utf8"));
    return {
      version: filename.slice(0, 14),
      filename,
      source_sha256: sourceHash,
      execution_sha256: sha256(sql),
      adapter_version: ADAPTER_VERSION,
      adapted: sql !== bytes.toString("utf8"),
      sql,
    };
  });
}

export function pendingMigrations(migrations: Migration[], history: History[], target: string) {
  const seen = new Set<string>();
  let last = "";
  for (const entry of history) {
    const migration = migrations.find((item) => item.version === entry.version);
    if (!migration || seen.has(entry.version))
      throw new Error("Unknown or duplicate migration history version");
    seen.add(entry.version);
    for (const key of [
      "filename",
      "source_sha256",
      "execution_sha256",
      "adapter_version",
    ] as const) {
      if (entry[key] !== migration[key])
        throw new Error(`Applied migration checksum/metadata changed: ${migration.filename}`);
    }
    if (entry.target !== target || !/^[a-f0-9]{40}$/.test(entry.release_sha)) {
      throw new Error("Migration history target/release identity is corrupt");
    }
    if (entry.version <= last) throw new Error("Migration history ordering is corrupt");
    last = entry.version;
  }
  const pending = migrations.filter((migration) => !seen.has(migration.version));
  if (pending.some((migration) => migration.version <= last)) {
    throw new Error("Unapplied migration sorts before the latest applied migration");
  }
  return pending;
}
