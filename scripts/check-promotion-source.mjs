// Production promotion gate: the "Promotion source" required check on `main` (ADR-022).
//
// A pull request into `main` is accepted only when its head is `develop` (normal promotion)
// or `hotfix/<name>` (emergency hotfix) AND the head branch lives in this same repository.
// Branch names alone are not trusted: a fork can name a branch `develop`. Repository identity
// comes from the `pull_request` event payload written by GitHub (GITHUB_EVENT_PATH), where
// `pull_request.head.repo` is the repository the head branch belongs to (null if deleted).
//
// Usage in CI: node scripts/check-promotion-source.mjs   (exit 1 = promotion refused)
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const PRODUCTION_BRANCH = "main";
const ALLOWED_HEAD = /^(develop|hotfix\/[A-Za-z0-9._\-/]+)$/;

/**
 * @param {any} event GitHub `pull_request` event payload
 * @returns {{ allowed: boolean, reason: string }}
 */
export function evaluatePromotion(event) {
  const pr = event?.pull_request;
  if (!pr) return { allowed: false, reason: "not a pull_request event" };

  const baseRef = pr.base?.ref;
  if (baseRef !== PRODUCTION_BRANCH) {
    return {
      allowed: true,
      reason: `base '${baseRef}' is not '${PRODUCTION_BRANCH}': no promotion rule applies`,
    };
  }

  const headRef = pr.head?.ref ?? "";
  const headRepo = pr.head?.repo;
  const baseRepo = pr.base?.repo ?? event.repository;

  if (!headRepo || !baseRepo) {
    return {
      allowed: false,
      reason: "head repository is unknown (deleted fork?): promotion refused",
    };
  }
  if (headRepo.id !== baseRepo.id) {
    return {
      allowed: false,
      reason: `head branch comes from '${headRepo.full_name}', not '${baseRepo.full_name}': only branches of this repository may be promoted to ${PRODUCTION_BRANCH}`,
    };
  }
  if (!ALLOWED_HEAD.test(headRef)) {
    return {
      allowed: false,
      reason: `'${headRef}' may not be merged into ${PRODUCTION_BRANCH}: only 'develop' (or 'hotfix/<name>') from this repository`,
    };
  }
  return {
    allowed: true,
    reason: `'${headRef}' from ${headRepo.full_name} may be promoted to ${PRODUCTION_BRANCH}`,
  };
}

function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    console.error(
      "::error::GITHUB_EVENT_PATH is not set (this script runs inside GitHub Actions).",
    );
    process.exit(1);
  }
  const { allowed, reason } = evaluatePromotion(JSON.parse(readFileSync(eventPath, "utf8")));
  if (!allowed) {
    console.error(`::error::Promotion refused: ${reason}`);
    process.exit(1);
  }
  console.log(`Promotion allowed: ${reason}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
