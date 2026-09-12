import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The resumable-work protocol (ADR-041, docs/RESUMABLE_WORKFLOW.md) is only worth anything if the
 * checkpoint is readable by a session that has no memory of writing it. These tests enforce the
 * shape and the vocabulary — never the content, which is the author's judgement.
 *
 * A protocol that lives only in a document rots. One a test reads does not.
 */

const ROOT = path.resolve(import.meta.dirname, "../..");
const ACTIVE_TASK = "docs/work/ACTIVE_TASK.md";
const ARCHIVE = "docs/work/archive";

const STATUSES = [
  "planned",
  "in_progress",
  "blocked",
  "awaiting_user",
  "awaiting_ci",
  "awaiting_review",
  "completed",
] as const;

const REQUIRED_SECTIONS = [
  "Task",
  "Objective",
  "Status",
  "Branch",
  "Base Branch",
  "Started",
  "Last Checkpoint",
  "Scope",
  "Out of Scope",
  "Product Decisions",
  "Completed",
  "In Progress",
  "Remaining",
  "Validation State",
  "Database State",
  "Deployment State",
  "Git State",
  "Blockers",
  "User Decisions Needed",
  "Exact Resume Point",
  "Resume Verification",
];

const VALIDATION_CHECKS = [
  "format",
  "lint",
  "typecheck",
  "unit tests",
  "content validation",
  "database tests",
  "build",
  "E2E",
  "Docker",
  "secret scans",
];

const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");
const sectionOf = (text: string, heading: string): string => {
  const start = text.indexOf(`## ${heading}\n`);
  if (start === -1) return "";
  const next = text.indexOf("\n## ", start + 1);
  return text.slice(start, next === -1 ? undefined : next);
};

describe("the active-task checkpoint", () => {
  const text = read(ACTIVE_TASK);

  it("exists, so a fresh session has somewhere to look", () => {
    expect(existsSync(path.join(ROOT, ACTIVE_TASK))).toBe(true);
  });

  it("carries every section a resuming session reads", () => {
    for (const heading of REQUIRED_SECTIONS) {
      expect(text, `missing section: ${heading}`).toContain(`## ${heading}\n`);
    }
  });

  it("declares one of the agreed statuses", () => {
    const status = sectionOf(text, "Status");
    const declared = STATUSES.filter((value) => status.includes(`\`${value}\``));
    expect(declared, `Status must name exactly one of ${STATUSES.join(", ")}`).toHaveLength(1);
  });

  it("says which branch the work is on, and what it is based on", () => {
    expect(sectionOf(text, "Branch")).toMatch(/`[^`]+`/);
    expect(sectionOf(text, "Base Branch")).toMatch(/`[^`]+`/);
  });

  it("records every check, using only the agreed freshness vocabulary", () => {
    const validation = sectionOf(text, "Validation State");
    for (const check of VALIDATION_CHECKS) {
      expect(validation.toLowerCase(), `no row for ${check}`).toContain(check.toLowerCase());
    }
    // Each row must carry a verdict. "PASS at <commit>" is the useful form, but the vocabulary
    // is what matters: a row with no verdict is a row nobody can trust.
    const rows = validation
      .split("\n")
      .filter(
        (line) => line.startsWith("|") && !line.includes("---") && !/\|\s*Check\s*\|/.test(line),
      );
    expect(rows.length).toBeGreaterThanOrEqual(VALIDATION_CHECKS.length);
    for (const row of rows) {
      expect(row, `no verdict in: ${row.trim()}`).toMatch(/PASS|FAIL|NOT RUN|STALE|N\/A/);
    }
  });

  it("never records a credential", () => {
    // Database and deployment state name files and environments, never secrets.
    expect(text).not.toMatch(/postgres(ql)?:\/\/|sb_secret_|sb_publishable_|ghp_|vercel_token/i);
  });

  it("ends with an actionable resume point, not a summary", () => {
    const resume = sectionOf(text, "Exact Resume Point")
      .replace("## Exact Resume Point", "")
      .trim();
    expect(resume.length, "the resume point must say what to do next").toBeGreaterThan(60);
  });

  it("tells the resuming session how to check the repository before trusting it", () => {
    const verification = sectionOf(text, "Resume Verification");
    expect(verification).toMatch(/git (status|log|branch)/);
  });
});

describe("the work archive", () => {
  it("keeps one summary per finished task", () => {
    const files = readdirSync(path.join(ROOT, ARCHIVE)).filter((file) => file.endsWith(".md"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      // <YYYY-MM>-<task>.md, so the archive stays sortable and findable.
      expect(file, `${file} should be named <YYYY-MM>-<task>.md`).toMatch(
        /^\d{4}-\d{2}-[a-z0-9-]+\.md$/,
      );
      const archived = read(path.join(ARCHIVE, file));
      expect(archived, `${file} must record its final status`).toContain("## Status");
      expect(archived).toContain("completed");
    }
  });

  it("documents the protocol it belongs to", () => {
    const workflow = read("docs/RESUMABLE_WORKFLOW.md");
    for (const heading of ["Checkpoint discipline", "Resuming", "Validation freshness"]) {
      expect(workflow).toContain(heading);
    }
    // CLAUDE.md must point at it: an instruction nobody reads at session start is no instruction.
    expect(read("CLAUDE.md")).toContain("docs/RESUMABLE_WORKFLOW.md");
  });
});
