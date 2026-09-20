import { describe, expect, it } from "vitest";
import {
  HOBBY_REGISTRY_RETENTION,
  planRegistryPrune,
  RegistryRetentionError,
  type RegistryImage,
} from "@/lib/deploy/registry-retention";

/**
 * ISSUE-011 fired on 2026-09-19: the container registry reached its 50-image Hobby cap and the
 * staging push was rejected, which blocked `develop` until 15 images were deleted by hand.
 *
 * These tests are the dry run for the automatic prune that replaces that manual recovery. The
 * deletion itself cannot be rehearsed against a real registry without deleting something, so the
 * decision is a pure function and this is where it is proved: what it keeps matters far more than
 * what it removes.
 */
const image = (n: number, tag: string, daysAgo: number): RegistryImage => ({
  id: `image_${String(n).padStart(3, "0")}`,
  createdAt: new Date(Date.UTC(2026, 8, 20) - daysAgo * 86_400_000).toISOString(),
  tags: [tag],
});

/** `count` images, newest first: index 0 is today, each following one a day older. */
const registry = (count: number): RegistryImage[] =>
  Array.from({ length: count }, (_, i) =>
    image(count - i, `c0mm1t${String(i).padStart(6, "0")}`, i),
  );

const ids = (plan: { delete: readonly RegistryImage[] }) => plan.delete.map((i) => i.id);

describe("pruning the container registry before the push (ISSUE-011)", () => {
  const active = ["c0mm1t000000"];

  it("leaves a registry below the threshold completely alone", () => {
    for (const count of [0, 1, 12, 39, 40]) {
      const plan = planRegistryPrune({ images: registry(count), protectedTags: active });
      expect(plan.delete, `${count} images`).toHaveLength(0);
    }
  });

  it("prunes back to the target as soon as the threshold is passed", () => {
    const plan = planRegistryPrune({ images: registry(41), protectedTags: active });
    expect(plan.delete).toHaveLength(41 - HOBBY_REGISTRY_RETENTION.targetCount);
  });

  it("frees enough room from a full registry that a run of merges cannot refill it", () => {
    // The real case: 50 images, the push about to be rejected.
    const plan = planRegistryPrune({ images: registry(50), protectedTags: active });
    expect(plan.delete).toHaveLength(15);
    expect(50 - plan.delete.length).toBe(HOBBY_REGISTRY_RETENTION.targetCount);
  });

  it("deletes the oldest images first, and only those", () => {
    const images = registry(50);
    const plan = planRegistryPrune({ images, protectedTags: active });
    // registry() numbers the newest 50 and the oldest 1, so the oldest 15 are image_001…image_015.
    expect(ids(plan)).toEqual(
      Array.from({ length: 15 }, (_, i) => `image_${String(i + 1).padStart(3, "0")}`),
    );
  });

  it("never deletes the commit being deployed, however old its image is", () => {
    const images = registry(50);
    const oldest = images[images.length - 1]!;
    const plan = planRegistryPrune({
      images,
      // A redeploy of an old commit: its tag is live even though its image is the oldest there is.
      protectedTags: [...active, oldest.tags[0]!],
    });
    expect(ids(plan)).not.toContain(oldest.id);
    expect(plan.delete).toHaveLength(15);
  });

  it("never deletes an image a live deployment still refers to", () => {
    const images = registry(50);
    const live = images.slice(-5).map((i) => i.tags[0]!); // the five oldest are all still aliased
    const plan = planRegistryPrune({ images, protectedTags: [...active, ...live] });
    for (const id of images.slice(-5).map((i) => i.id)) {
      expect(ids(plan), "a live deployment's image").not.toContain(id);
    }
  });

  it("keeps the newest images whatever the active set says", () => {
    const images = registry(50);
    const plan = planRegistryPrune({ images, protectedTags: active });
    const newest = images.slice(0, HOBBY_REGISTRY_RETENTION.keepNewest).map((i) => i.id);
    for (const id of newest) expect(ids(plan)).not.toContain(id);
  });

  it("matches a full commit SHA against the 12-character tag the registry carries", () => {
    const images = registry(50);
    const oldest = images[images.length - 1]!;
    const plan = planRegistryPrune({
      images,
      // What the workflow actually has to hand: GITHUB_SHA, 40 characters.
      protectedTags: [`${oldest.tags[0]!}aabbccddeeff00112233445566778899`.toUpperCase()],
    });
    expect(ids(plan)).not.toContain(oldest.id);
  });

  it("refuses to prune when the active set could not be determined", () => {
    // The whole point: an empty list is "I don't know", not "nothing is live".
    expect(() => planRegistryPrune({ images: registry(50), protectedTags: [] })).toThrow(
      RegistryRetentionError,
    );
    expect(() => planRegistryPrune({ images: registry(50), protectedTags: [] })).toThrow(
      /nothing can be proved unused/,
    );
  });

  it("refuses to prune on an unreadable date rather than guessing an order", () => {
    const images = [
      ...registry(50),
      { id: "image_bad", createdAt: "soon", tags: ["ffffffffffff"] },
    ];
    expect(() => planRegistryPrune({ images, protectedTags: active })).toThrow(
      /unreadable createdAt/,
    );
  });

  it("fails loudly when the registry is full and nothing in it may be deleted", () => {
    // Every image is live. There is no safe prune, and the next push is going to be rejected:
    // saying so is more useful than reporting "0 deleted" and letting the push fail later.
    const images = registry(50);
    expect(() =>
      planRegistryPrune({ images, protectedTags: images.map((i) => i.tags[0]!) }),
    ).toThrow(/the next push will be rejected/i);
  });

  it("stays quiet when a full registry is protected but still under the cap", () => {
    const images = registry(45);
    const plan = planRegistryPrune({ images, protectedTags: images.map((i) => i.tags[0]!) });
    expect(plan.delete).toHaveLength(0);
  });

  it("is deterministic: the same registry always yields the same plan", () => {
    const images = registry(50);
    const a = planRegistryPrune({ images, protectedTags: active });
    const b = planRegistryPrune({ images: [...images].reverse(), protectedTags: active });
    expect(ids(a)).toEqual(ids(b));
  });

  it("keeps the policy inside what the Hobby plan actually allows", () => {
    const p = HOBBY_REGISTRY_RETENTION;
    expect(p.targetCount).toBeLessThan(p.pruneAbove);
    expect(p.pruneAbove).toBeLessThan(p.hardCap);
    expect(p.keepNewest).toBeLessThanOrEqual(p.targetCount);
  });
});
