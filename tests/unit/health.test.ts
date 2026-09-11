import { describe, expect, it } from "vitest";
import { GET, supabaseProjectRef } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("reports ok with non-sensitive metadata only", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");

    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(Object.keys(body).sort()).toEqual([
      "commit",
      "environment",
      "status",
      "supabaseProjectRef",
      "version",
    ]);
    // No Supabase configured in unit tests.
    expect(body.supabaseProjectRef).toBeNull();
  });
});

describe("supabaseProjectRef", () => {
  it("extracts the public project ref from a hosted Supabase URL", () => {
    expect(supabaseProjectRef("https://quyhkkizsmosybavoewd.supabase.co")).toBe(
      "quyhkkizsmosybavoewd",
    );
  });

  it("returns null for local stacks and missing values", () => {
    expect(supabaseProjectRef("http://127.0.0.1:54321")).toBeNull();
    expect(supabaseProjectRef(undefined)).toBeNull();
  });
});
