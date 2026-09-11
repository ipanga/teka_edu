import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/calendar/[date]/route";

const call = (date: string) =>
  GET(new Request(`http://localhost/api/calendar/${date}`), { params: Promise.resolve({ date }) });

describe("GET /api/calendar/[date]", () => {
  it("answers whether a date is instructional, with its sequence number", async () => {
    const response = await call("2026-09-15");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      date: "2026-09-15",
      weekday: 2,
      schoolYear: { id: "2026-2027", label: "2026–2027" },
      period: 1,
      instructional: true,
      instructionalDay: 11,
      reasons: [],
      override: null,
    });
  });

  it("explains why a date is not instructional", async () => {
    const body = await (await call("2027-05-17")).json();
    expect(body).toMatchObject({
      instructional: false,
      instructionalDay: null,
      reasons: [{ code: "public-holiday", name: "Journée des Forces armées" }],
    });
  });

  it("reports dates outside every configured school year", async () => {
    const body = await (await call("2027-08-01")).json();
    expect(body).toMatchObject({ schoolYear: null, reasons: [{ code: "outside-school-year" }] });
  });

  it("rejects invalid dates without caching the error", async () => {
    const response = await call("2027-02-29");
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
