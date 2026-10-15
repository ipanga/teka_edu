import { describe, expect, it, vi } from "vitest";
import {
  formatPasswordPrompt,
  passwordIdentityFor,
  preparePasswordPrompt,
} from "@/lib/postgres/password-prompt";
import { connectionFor } from "@/lib/postgres/target";

function connection(target: "production" | "staging") {
  const suffix = target === "production" ? "prod" : "dev";
  return connectionFor(target, {
    PATH: "/synthetic",
    PGHOST: "postgresql-congofoot.alwaysdata.net",
    PGPORT: "5432",
    PGDATABASE: `congofoot_teka_edu_${suffix}`,
    PGUSER: `congofoot_user_teka_edu_${suffix}`,
    PGSSLMODE: "verify-full",
    PGSSLROOTCERT: "/synthetic/ca",
    TEKA_PRODUCTION_MIGRATIONS_APPROVED: "true",
  });
}
describe("explicit private password identity", () => {
  it.each(["production", "staging"] as const)(
    "identifies %s before and immediately at its prompt",
    async (target) => {
      const display = vi.fn(),
        ready = vi.fn(async () => (target === "production" ? "READY PROD" : "READY DEV"));
      const callback = await preparePasswordPrompt(connection(target), "state-inspection", {
        display,
        ready,
      });
      const banner = display.mock.calls[0]![0] as string;
      expect(banner).toContain(
        target === "production"
          ? "ENVIRONMENT: ALWAYSDATA PRODUCTION (PROD)"
          : "ENVIRONMENT: ALWAYSDATA DEVELOPMENT (DEV)",
      );
      expect(banner).toContain(`Database: ${connection(target).database}`);
      expect(banner).toContain(`PostgreSQL user: ${connection(target).login}`);
      expect(banner).toContain("Host: postgresql-congofoot.alwaysdata.net");
      expect(banner).toContain(
        "Operation: Read-only identity, migration-history count and application-table count",
      );
      expect(banner).toContain(
        `Password required: Alwaysdata PostgreSQL ${target === "production" ? "PROD" : "DEV"} password`,
      );
      expect(display).toHaveBeenCalledTimes(1);
      callback();
      expect(display).toHaveBeenCalledTimes(2);
    },
  );
  it("does not accept a generic yes or echo a mistaken secret at readiness", async () => {
    const display = vi.fn();
    const secret = "synthetic-secret-not-to-log";
    await expect(
      preparePasswordPrompt(connection("production"), "apply", {
        display,
        ready: async () => secret,
      }),
    ).rejects.toThrow("not confirmed");
    expect(JSON.stringify(display.mock.calls)).not.toContain(secret);
  });
  it("rejects a mismatched connection identity", () => {
    expect(() =>
      passwordIdentityFor({ ...connection("production"), login: "congofoot_user_teka_edu_dev" }),
    ).toThrow("does not match");
    const actual = connection("production");
    for (const name of ["PGHOST", "PGDATABASE", "PGUSER"]) {
      expect(() =>
        passwordIdentityFor({ ...actual, env: { ...actual.env, [name]: "unexpected" } }),
      ).toThrow("does not match");
    }
  });
  it("labels Supabase separately using only explicitly confirmed values", () => {
    const text = formatPasswordPrompt(
      {
        provider: "supabase",
        environment: "production",
        ownerConfirmed: true,
        host: "aws-1-eu-west-3.pooler.supabase.com",
        port: 5432,
        database: "postgres",
        login: "postgres.eganrivpkjhozkkahyxy",
      },
      "state-inspection",
    );
    expect(text).toContain("ENVIRONMENT: SUPABASE PROD");
    expect(text).toContain("PostgreSQL user: postgres.eganrivpkjhozkkahyxy");
    expect(text).not.toContain("ALWAYSDATA");
  });
  it("does not infer Supabase DEV parameters or allow credential-bearing identities", () => {
    expect(() =>
      formatPasswordPrompt(
        {
          provider: "supabase",
          environment: "development",
          ownerConfirmed: true,
          host: "postgres://secret@host",
          port: 5432,
          database: "db",
          login: "user",
        },
        "backup",
      ),
    ).toThrow("Invalid");
  });
});
