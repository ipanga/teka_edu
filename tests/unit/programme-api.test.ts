import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/programme/[schoolYear]/[level]/[day]/route";

const call = (schoolYear: string, level: string, day: string) =>
  GET(new Request(`http://localhost/api/programme/${schoolYear}/${level}/${day}`), {
    params: Promise.resolve({ schoolYear, level, day }),
  });

describe("GET /api/programme/[schoolYear]/[level]/[day]", () => {
  it("returns the daily programme of an instructional day", async () => {
    const response = await call("2026-2027", "maternelle-3", "1");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      schoolYear: { id: "2026-2027" },
      level: { id: "maternelle-3", name: "3ème maternelle" },
      curriculum: { id: "maternelle-cycle1-cd-2026", version: "2026" },
      ageBand: { code: "from-5" },
      date: "2026-09-01",
      instructionalDay: 1,
      rhythmDay: 1,
      status: "complete",
      totalMinutes: 41,
    });
    expect(body.sessions).toHaveLength(4);
    const first = body.sessions[0];
    expect(first.domainCode).toBe("LANG");
    expect(first.lesson.origin).toBe("teka-edu-created");
    expect(first.lesson.activities[0].childInstruction).toContain("Bonjour");
    expect(first.lesson.activities[0].scaffolds[0].language).toBe("en");
  });

  it("says which official objectives the day works on, with their source and evidence", async () => {
    const body = await (await call("2026-2027", "maternelle-3", "2")).json();
    const objectives = body.sessions.flatMap(
      (session: { lesson: { objectives: unknown[] } }) => session.lesson.objectives,
    );
    expect(objectives.length).toBeGreaterThan(3);
    for (const objective of objectives) {
      expect(objective.origin).toBe("official");
      expect(objective.source).toMatch(/^programme-/);
      expect(typeof objective.statement).toBe("string");
      // The official tables attach success examples to a competency and an age band, so the
      // field says so rather than implying they belong to this single objective.
      expect(objective.competency.code).toMatch(/^[A-Z][A-Z0-9-]*-S\d{2}-C\d{2}$/);
      expect(typeof objective.competency.title).toBe("string");
      expect(Array.isArray(objective.competencySuccessExamples)).toBe(true);
      expect(objective).not.toHaveProperty("successExamples");
    }
  });

  it("accepts a date as well as an instructional day", async () => {
    const byDate = await (await call("2026-2027", "maternelle-3", "2026-09-15")).json();
    const byNumber = await (await call("2026-2027", "maternelle-3", "11")).json();
    expect(byDate).toEqual(byNumber);
  });

  it("returns no programme for a day that is not instructional", async () => {
    const body = await (await call("2026-2027", "maternelle-3", "2026-12-25")).json();
    expect(body.status).toBe("not-instructional");
    expect(body.sessions).toEqual([]);
    expect(body.reasons.map((r: { code: string }) => r.code)).toContain("public-holiday");
  });

  it("reports a day whose content is not written yet without inventing one", async () => {
    const body = await (await call("2026-2027", "maternelle-3", "6")).json();
    expect(body.status).toBe("no-content");
    expect(body.sessions.every((s: { lesson: unknown }) => s.lesson === null)).toBe(true);
  });

  it("rejects unknown years, levels and malformed days", async () => {
    expect((await call("2030-2031", "maternelle-3", "1")).status).toBe(404);
    expect((await call("2026-2027", "maternelle-1", "1")).status).toBe(404);
    expect((await call("2026-2027", "maternelle-3", "999")).status).toBe(404);
    const bad = await call("2026-2027", "maternelle-3", "lundi");
    expect(bad.status).toBe(400);
    expect(bad.headers.get("Cache-Control")).toBe("no-store");
  });

  it("exposes no secret or internal detail", async () => {
    const body = await (await call("2026-2027", "maternelle-3", "1")).text();
    expect(body).not.toMatch(/supabase|postgres|sb_secret|sb_publishable|DATABASE_URL/i);
  });
});
