import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("reports ok with non-sensitive metadata only", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");

    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(Object.keys(body).sort()).toEqual(["commit", "environment", "status", "version"]);
  });
});
