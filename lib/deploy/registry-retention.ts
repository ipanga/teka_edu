/**
 * Which container images may be deleted, and which may never be (ISSUE-011).
 *
 * Every staging deployment pushes one image (about 73 MB) into the Vercel container registry
 * repository `dockerfile`. Hobby allows 50 images per repository and deletes nothing by itself,
 * so the repository fills up and then the *push* fails — which blocks `develop` entirely, because
 * every following merge re-triggers the same failing deploy.
 *
 * PROJECT_STATUS.md carried the right advice ("prune around 40") for eight days and it never
 * happened, because advice is not a mechanism: nobody owned it, nothing measured the count, and
 * the repository went from 4 images to 50 without anyone looking. This module is the mechanism.
 * It is deliberately a pure function over data the caller fetched, so the dangerous part — which
 * images are chosen for deletion — is unit-testable without touching a real registry.
 *
 * The policy is conservative by construction. It refuses to act on an unknown active set, it
 * keeps a floor of recent images whatever else it is told, and the only images it will ever
 * propose are old ones that no live deployment refers to.
 */

/** One image as the Vercel CLI reports it (`vercel vcr image ls <repo> --json`). */
export type RegistryImage = {
  id: string;
  /** ISO-8601. An image whose date cannot be read is never a deletion candidate. */
  createdAt: string;
  /** Image tags. Teka Edu's deploy tags each image with the 12-character commit SHA. */
  tags: readonly string[];
};

export type RetentionPolicy = {
  /** Below this count the registry is left alone entirely. */
  pruneAbove: number;
  /** Prune down to at most this many images, so a run of merges cannot reach the cap. */
  targetCount: number;
  /** Never delete this many newest images, whatever the protected set says. */
  keepNewest: number;
  /** What the registry itself enforces; reaching it is what breaks the push. */
  hardCap: number;
};

/**
 * Vercel Hobby: 50 images per repository.
 *
 * Pruning starts at 41 and goes back to 35, which leaves 15 merges of headroom — about a week at
 * the rate September ran. The numbers are here rather than in the workflow so that the test suite
 * and the deploy read the same ones.
 */
export const HOBBY_REGISTRY_RETENTION: RetentionPolicy = {
  pruneAbove: 40,
  targetCount: 35,
  keepNewest: 20,
  hardCap: 50,
};

export type PrunePlan = {
  /** Oldest first: the images that may be deleted. */
  delete: readonly RegistryImage[];
  /** Why the plan is what it is, for the deploy log. */
  reason: string;
};

/** A commit SHA in any length, reduced to the 12 characters the registry tags with. */
const tagKey = (value: string) => value.trim().toLowerCase().slice(0, 12);

export class RegistryRetentionError extends Error {}

/**
 * Choose the images to delete before the next push.
 *
 * Throws rather than guessing whenever the inputs cannot support a safe decision: the deploy step
 * turns that into a failed run with the reason, which is the intended behaviour. A registry that
 * is merely full is *not* an error here — it is an error only if nothing in it may be deleted,
 * because then the push is going to fail no matter what this function returns.
 */
export function planRegistryPrune(input: {
  images: readonly RegistryImage[];
  /**
   * Commit SHAs that must survive: the one being deployed now, plus every deployment Vercel
   * still considers live. An empty set means the caller could not determine what is active, and
   * that is refused — pruning blind is how a live deployment loses its image.
   */
  protectedTags: readonly string[];
  policy?: RetentionPolicy;
}): PrunePlan {
  const { images, protectedTags } = input;
  const policy = input.policy ?? HOBBY_REGISTRY_RETENTION;

  if (protectedTags.length === 0) {
    throw new RegistryRetentionError(
      "refusing to prune: the set of active deployments is empty, so nothing can be proved unused",
    );
  }
  const protectedKeys = new Set(protectedTags.map(tagKey));

  const timeOf = (image: RegistryImage) => {
    const at = Date.parse(image.createdAt);
    if (Number.isNaN(at)) {
      throw new RegistryRetentionError(
        `refusing to prune: image ${image.id} has an unreadable createdAt "${image.createdAt}"`,
      );
    }
    return at;
  };

  // Newest first, with the id breaking ties so the plan is deterministic.
  const newestFirst = [...images].sort((a, b) => timeOf(b) - timeOf(a) || a.id.localeCompare(b.id));

  if (newestFirst.length <= policy.pruneAbove) {
    return {
      delete: [],
      reason: `${newestFirst.length} image(s), at or below the pruning threshold of ${policy.pruneAbove}`,
    };
  }

  const recent = new Set(newestFirst.slice(0, policy.keepNewest).map((image) => image.id));
  const isProtected = (image: RegistryImage) =>
    recent.has(image.id) || image.tags.some((tag) => protectedKeys.has(tagKey(tag)));

  // Oldest first: the oldest superseded image is always the one to go.
  const candidates = [...newestFirst].reverse().filter((image) => !isProtected(image));
  const over = newestFirst.length - policy.targetCount;
  const chosen = candidates.slice(0, Math.max(0, over));

  if (chosen.length === 0 && newestFirst.length >= policy.hardCap) {
    throw new RegistryRetentionError(
      `refusing to continue: the registry holds ${newestFirst.length} image(s), at the cap of ` +
        `${policy.hardCap}, and every one of them is either protected or among the ` +
        `${policy.keepNewest} newest. The next push will be rejected. Prune by hand after ` +
        "checking which deployments are still needed (docs/DEPLOYMENT.md, ISSUE-011).",
    );
  }

  return {
    delete: chosen,
    reason:
      `${newestFirst.length} image(s) above the threshold of ${policy.pruneAbove}: ` +
      `deleting ${chosen.length} to reach ${policy.targetCount}, keeping the ` +
      `${policy.keepNewest} newest and ${protectedKeys.size} active deployment tag(s)`,
  };
}
