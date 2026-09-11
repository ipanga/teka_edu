import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { evaluatePromotion } from "@/scripts/check-promotion-source.mjs";

// Repository identity as it appears in real `pull_request` payloads for this repository
// (captured from PR #1 via the GitHub API). The fork is a hypothetical third-party copy.
const REPO = { id: 1365797535, full_name: "ipanga/teka_edu", fork: false };
const FORK = { id: 987654321, full_name: "someone/teka_edu", fork: true };

type Repo = typeof REPO | null;

function pullRequestEvent(headRef: string, headRepo: Repo, baseRef = "main") {
  return {
    action: "opened",
    number: 42,
    pull_request: {
      base: { ref: baseRef, repo: REPO },
      head: { ref: headRef, repo: headRepo },
    },
    repository: REPO,
  };
}

describe("evaluatePromotion (Promotion source gate for main)", () => {
  it.each([
    ["same-repo develop → main", "develop", REPO, true],
    ["same-repo hotfix/x → main", "hotfix/fix-login", REPO, true],
    ["fork develop → main", "develop", FORK, false],
    ["fork hotfix/x → main", "hotfix/fix-login", FORK, false],
    ["same-repo feature/x → main", "feature/x", REPO, false],
    ["same-repo fix/x → main", "fix/x", REPO, false],
    ["same-repo chore/x → main", "chore/x", REPO, false],
    ["same-repo main → main", "main", REPO, false],
    ["same-repo 'hotfix' without a name → main", "hotfix", REPO, false],
    ["same-repo 'hotfix/' without a name → main", "hotfix/", REPO, false],
    ["same-repo 'develop-old' → main", "develop-old", REPO, false],
    ["deleted fork (head.repo null) → main", "develop", null, false],
  ] as const)("%s", (_label, headRef, headRepo, allowed) => {
    expect(evaluatePromotion(pullRequestEvent(headRef, headRepo)).allowed).toBe(allowed);
  });

  it("does not apply to pull requests into develop", () => {
    const result = evaluatePromotion(pullRequestEvent("feature/x", FORK, "develop"));
    expect(result.allowed).toBe(true);
    expect(result.reason).toMatch(/no promotion rule applies/);
  });

  it("refuses payloads that are not pull_request events", () => {
    expect(evaluatePromotion({ ref: "refs/heads/main" }).allowed).toBe(false);
  });

  it("explains a fork refusal by repository, not by branch name", () => {
    expect(evaluatePromotion(pullRequestEvent("develop", FORK)).reason).toMatch(
      /comes from 'someone\/teka_edu'/,
    );
  });
});

describe("check-promotion-source.mjs CLI (as run by the CI job)", () => {
  const script = path.resolve(import.meta.dirname, "../../scripts/check-promotion-source.mjs");

  function run(event: unknown) {
    const dir = mkdtempSync(path.join(tmpdir(), "teka-promotion-"));
    const eventPath = path.join(dir, "event.json");
    writeFileSync(eventPath, JSON.stringify(event));
    try {
      const stdout = execFileSync(process.execPath, [script], {
        env: { ...process.env, GITHUB_EVENT_PATH: eventPath },
        encoding: "utf8",
        stdio: "pipe",
      });
      return { code: 0, output: stdout };
    } catch (error) {
      const e = error as { status: number; stderr: string };
      return { code: e.status, output: e.stderr };
    }
  }

  it("exits 0 for same-repo develop → main", () => {
    expect(run(pullRequestEvent("develop", REPO))).toMatchObject({ code: 0 });
  });

  it("exits 1 with a GitHub error annotation for fork develop → main", () => {
    const result = run(pullRequestEvent("develop", FORK));
    expect(result.code).toBe(1);
    expect(result.output).toMatch(/^::error::Promotion refused/m);
  });
});
