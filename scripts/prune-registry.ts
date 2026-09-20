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
import {
  HOBBY_REGISTRY_RETENTION,
  planRegistryPrune,
  type RegistryImage,
} from "../lib/deploy/registry-retention";

const REPOSITORY = "dockerfile";
const API = "https://api.vercel.com";
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
const team = required("VERCEL_ORG_ID");
const commit = required("GITHUB_SHA");

/**
 * The REST API, not the CLI.
 *
 * `vercel vcr …` also calls `/v2/user` and `/v1/teams` to resolve the scope, and the deploy token
 * is project-scoped: those user-level endpoints answer "User not found" and the command exits 1
 * before it ever reaches the registry. The rest of this workflow avoids `vercel inspect` and
 * `vercel alias` for exactly the same reason.
 *
 * The registry endpoint is addressed by `projectId` alone, which is enough to identify the
 * repository unambiguously. Adding `teamId` as well is what the CLI does and it answers
 * "VCR Repository not found" under the deploy token, so the team is named only as a fallback.
 */
const SCOPES = [
  `projectId=${encodeURIComponent(project)}`,
  `teamId=${encodeURIComponent(team)}&projectId=${encodeURIComponent(project)}`,
];
let scope = SCOPES[0]!;

async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(
      `${init.method ?? "GET"} ${path} -> ${response.status} ${await response.text()}`,
    );
  }
  return response;
}

/** Try each way of naming the repository, and remember the one that answered. */
async function listImagesResponse(): Promise<Response> {
  let last: unknown;
  for (const candidate of SCOPES) {
    try {
      const response = await api(`/v1/vcr/repository/${REPOSITORY}/images?${candidate}`);
      scope = candidate;
      return response;
    } catch (error) {
      last = error;
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

async function listImages(): Promise<RegistryImage[]> {
  const response = await listImagesResponse();
  const parsed: unknown = await response.json();
  const images = (parsed as { images?: unknown }).images;
  if (!Array.isArray(images)) {
    throw new Error("unexpected response from the registry API: no images array");
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

/**
 * Pruning is a *preventive* step. It must never delete unsafely — and it must never be the reason
 * a deploy that would otherwise succeed does not happen.
 *
 * The first two attempts at this step failed the whole staging job over the shape of an API call,
 * on a registry holding 37 of 50 images, with nothing to prune and nothing at risk. That is
 * strictly worse than not having the step at all. So everything below reports and stops rather
 * than fails: if the registry cannot be read, or the live commit cannot be established, no image
 * is touched, the reason is printed as a warning, and the deploy carries on. The backstop if the
 * registry really is full is the push itself, which fails with a clear message of its own.
 */
function giveUp(reason: string): never {
  console.log(`::warning::Container registry not pruned: ${reason}`);
  console.log(
    "No image was deleted. If the registry is at its cap the push below will fail; see " +
      "docs/DEPLOYMENT.md and ISSUE-011.",
  );
  process.exit(0);
}

const rehearsal = rehearsalThreshold();
let images: RegistryImage[];
try {
  images = await listImages();
} catch (error) {
  giveUp(`the registry could not be listed (${error instanceof Error ? error.message : error})`);
}
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
  // The refusal that matters: without the live commit nothing can be proved unused, so nothing
  // is deleted. Loud, and not fatal — a stale registry is a problem for a later deploy, not a
  // reason to abandon this one.
  giveUp(
    "the commit currently served by staging could not be read from /api/health, so no image " +
      "can be proved unused",
  );
}

const protectedTags = [commit, live];
console.log(`Protected commits: ${protectedTags.map((t) => t.slice(0, 12)).join(", ")}.`);

let plan;
try {
  plan = planRegistryPrune({ images, protectedTags, policy });
} catch (error) {
  giveUp(error instanceof Error ? error.message : String(error));
}
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
  try {
    await api(`/v1/vcr/repository/${REPOSITORY}/images/${encodeURIComponent(image.id)}?${scope}`, {
      method: "DELETE",
    });
  } catch (error) {
    giveUp(`${label} could not be deleted (${error instanceof Error ? error.message : error})`);
  }
  console.log(`deleted ${label}`);
}

console.log(
  `${dryRun ? "Would free" : "Freed"} ${plan.delete.length} slot(s); ` +
    `${images.length - plan.delete.length} image(s) remain.`,
);
