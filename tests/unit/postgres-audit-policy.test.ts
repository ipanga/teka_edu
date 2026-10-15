import { describe, it, expect, vi } from "vitest";
import { PRODUCTION_AUDIT_ROLE, restrictProductionAuditObjects } from "@/lib/postgres/audit-policy";
import { sanitizedAccessFailure, ACCESS_FIELDS } from "@/lib/postgres/access-result";
import { verifyAccess, canonicalTables } from "@/lib/postgres/verify";
import type { Session } from "@/lib/postgres/session";

describe("PROD audit object restrictions", () => {
  it.each([false, null, undefined, "true", 1, {}, []])(
    "rejects nontrue guard %j before changing ACLs",
    async (value) => {
      const json = vi.fn().mockResolvedValue(value);
      const query = vi.fn();
      await expect(
        restrictProductionAuditObjects({ json, query } as unknown as Session),
      ).rejects.toSatisfy(
        (error: unknown) => sanitizedAccessFailure(error)?.classification === "ACCESS_AUDIT_GUARD",
      );
      expect(query).not.toHaveBeenCalled();
    },
  );
  it("removes only exact routine EXECUTE and history privileges after guard, without defaults", async () => {
    const json = vi.fn().mockResolvedValue(true);
    const query = vi.fn().mockResolvedValue("");
    await restrictProductionAuditObjects({ json, query } as unknown as Session);
    const sql = query.mock.calls[0]![0] as string;
    expect(sql).toContain(
      "private.check_dated_row_within_school_year(),private.check_school_year_contains_dated_rows()",
    );
    expect(sql).toContain(`from ${PRODUCTION_AUDIT_ROLE}`);
    expect(sql).toContain("revoke all privileges on table teka_migrations.history");
    expect(sql).not.toMatch(/alter default|all functions|grant |cascade/i);
    expect(json.mock.invocationCallOrder[0]!).toBeLessThan(query.mock.invocationCallOrder[0]!);
    expect(json.mock.calls[0]![0]).toContain("pg_current_xact_id_if_assigned() is not null");
  });
});

describe("source-bound SELECT audit exception", () => {
  const good = () => Object.fromEntries(ACCESS_FIELDS.map((key) => [key, true]));
  it("is PROD-only and requires exact source names, SELECT, no grant option, owners and effective denial", async () => {
    const json = vi.fn().mockResolvedValueOnce(good()).mockResolvedValueOnce([]);
    await verifyAccess({ json } as unknown as Session, true, true);
    const sql = json.mock.calls[0]![0] as string;
    expect(sql).toContain(`ar.rolname='${PRODUCTION_AUDIT_ROLE}'`);
    expect(sql).toContain("a.privilege_type='SELECT' and not a.is_grantable");
    for (const table of canonicalTables()) expect(sql).toContain(`'${table.table}'`);
    expect(sql).toContain("has_any_column_privilege");
    expect(sql).toContain("pg_auth_members");
    expect(sql).toContain("hn.nspname='teka_migrations' and hc.relname='history'");
    expect(sql).toContain("and not ar.rolbypassrls");
    expect(sql).toContain("p.prosecdef");
    expect(sql).not.toContain("alter default privileges");
    json.mockReset().mockResolvedValueOnce(good()).mockResolvedValueOnce([]);
    await verifyAccess({ json } as unknown as Session, true, false);
    expect(json.mock.calls[0]![0]).not.toContain(PRODUCTION_AUDIT_ROLE);
    expect(json.mock.calls[0]![0]).not.toContain("has_any_column_privilege");
  });
});
