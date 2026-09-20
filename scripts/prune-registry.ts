/**
 * Prune the Vercel container registry before the next push, not after it fails (ISSUE-011).
 *
 *   npx tsx scripts/prune-registry.ts --dry-run
 *   npx tsx scripts/prune-registry.ts
 *
 * Hobby allows 50 images per repository and never deletes one. On 2026-09-19 the repository
 * reached 50 and the staging push was rejected, which blocks `develop`: every following merge
 * re-triggers the same failing deploy. The recovery was manual. This is the prevention.
 *
 * What it will not do:
 *   - touch anything while the count is at or below the threshold (it does not even look);
 *   - delete the commit being deployed, or the commit the staging alias is serving;
 *   - delete any of the newest images, whatever else it has been told;
 *   - guess. If it cannot establish what is live, it fails and says so.
 *
 * Which images may go is decided by lib/deploy/registry-retention.ts, a pure function with its
 * own tests — the deletion cannot be rehearsed against a real registry, so the decision is
 * proved away from one.
 *
 * Environment: VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_ORG_ID, GITHUB_SHA, and STAGING_URL
 * (with VERCEL_AUTOMATION_BYPASS_SECRET when the deployment is protection-gated).
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  HOBBY_REGISTRY_RETENTION,
  planRegistryPrune,
  type RegistryImage,
} from "../lib/deploy/registry-retention";

const run = promisify(execFile);

const REPOSITORY = "dockerfile";
const dryRun = process.argv.includes("--dry-run");

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    console.error(`::error::${name} is not set; cannot prune the container registry safely.`);
    process.exit(1);
  }
  return value;
}

const token = required("VERCEL_TOKEN");
const project = required("VERCEL_PROJECT_ID");
const commit = required("GITHUB_SHA");

/** The CLI writes progress to stderr and the JSON document to stdout. */
async function vercel(args: readonly string[]): Promise<string> {
  const { stdout } = await run("vercel", [...args, `--token=${token}`], {
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, VERCEL_TELEMETRY_DISABLED: "1" },
  });
  return stdout;
}

async function listImages(): Promise<RegistryImage[]> {
  const stdout = await vercel(["vcr", "image", "ls", REPOSITORY, "--project", project, "--json"]);
  const parsed: unknown = JSON.parse(stdout);
  const images = (parsed as { images?: unknown }).images;
  if (!Array.isArray(images)) {
    throw new Error(`unexpected output from \`vercel vcr image ls\`: no images array`);
  }
  return images.map((raw) => {
    const image = raw as { id?: unknown; createdAt?: unknown; tags?: unknown };
    if (typeof image.id !== "string" || typeof image.createdAt !== "string") {
      throw new Error(`unexpected image record: ${JSON.stringify(raw).slice(0, 200)}`);
    }
    return {
      id: image.id,
      createdAt: image.createdAt,
      tags: Array.isArray(image.tags) ? image.tags.filter((t) => typeof t === "string") : [],
    };
  });
}

/**
 * Which commit the staging alias is actually serving.
 *
 * `/api/health` reports it, so the running application is the source of truth rather than a
 * deployment field that a project without a Git connection does not fill in. Returns null when
 * it cannot be read: the caller decides whether that is fatal.
 */
async function liveCommit(): Promise<string | null> {
  const base = process.env.STAGING_URL;
  if (base === undefined || base === "") return null;
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  try {
    const response = await fetch(new URL("/api/health", base), {
      headers: bypass ? { "x-vercel-protection-bypass": bypass } : {},
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    const sha = (body as { commit?: unknown }).commit;
    return typeof sha === "string" && sha !== "" ? sha : null;
  } catch {
    return null;
  }
}

/**
 * A dry run may lower the threshold so the whole path — the live-commit probe included — can be
 * rehearsed on a registry that is nowhere near full. Only ever a *lower* threshold, and only
 * when nothing is going to be deleted.
 */
function rehearsalThreshold(): number | null {
  const flag = process.argv.find((a) => a.startsWith("--prune-above="));
  if (flag === undefined) return null;
  if (!dryRun) {
    console.error("::error::--prune-above is only allowed together with --dry-run.");
    process.exit(1);
  }
  const value = Number(flag.slice("--prune-above=".length));
  if (!Number.isInteger(value) || value < 0 || value >= HOBBY_REGISTRY_RETENTION.pruneAbove) {
    console.error(
      `::error::--prune-above must be an integer below ${HOBBY_REGISTRY_RETENTION.pruneAbove}.`,
    );
    process.exit(1);
  }
  return value;
}

const images = await listImages();
const rehearsal = rehearsalThreshold();
const policy =
  rehearsal === null
    ? HOBBY_REGISTRY_RETENTION
    : {
        ...HOBBY_REGISTRY_RETENTION,
        pruneAbove: rehearsal,
        targetCount: Math.min(HOBBY_REGISTRY_RETENTION.targetCount, rehearsal),
      };

console.log(
  `Container registry "${REPOSITORY}": ${images.length} image(s); ` +
    `threshold ${policy.pruneAbove}, target ${policy.targetCount}, cap ${policy.hardCap}.`,
);

// Below the threshold nothing is fetched and nothing is risked: the common case costs one call.
if (images.length <= policy.pruneAbove) {
  console.log("Nothing to prune.");
  process.exit(0);
}

const live = await liveCommit();
if (live === null) {
  console.error(
    "::error::The registry is above the pruning threshold but the commit currently served by " +
      "staging could not be read from /api/health, so no image can be proved unused. " +
      "Refusing to prune. Check the staging deployment, or prune by hand after confirming " +
      "which deployments are still needed (docs/DEPLOYMENT.md, ISSUE-011).",
  );
  process.exit(1);
}

const protectedTags = [commit, live];
console.log(`Protected commits: ${protectedTags.map((t) => t.slice(0, 12)).join(", ")}.`);

const plan = planRegistryPrune({ images, protectedTags, policy });
console.log(plan.reason);

if (plan.delete.length === 0) {
  console.log("Nothing to prune.");
  process.exit(0);
}

for (const image of plan.delete) {
  const label = `${image.id} (${image.tags.join(", ") || "untagged"}, ${image.createdAt})`;
  if (dryRun) {
    console.log(`would delete ${label}`);
    continue;
  }
  await vercel(["vcr", "image", "rm", REPOSITORY, image.id, "--project", project, "--yes"]);
  console.log(`deleted ${label}`);
}

console.log(
  `${dryRun ? "Would free" : "Freed"} ${plan.delete.length} slot(s); ` +
    `${images.length - plan.delete.length} image(s) remain.`,
);
