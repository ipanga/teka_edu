import { describe, expect, it } from "vitest";
import { EnvValidationError, parsePublicEnv, parseServerEnv } from "@/lib/env/schema";

// Obviously fake, test-only values: they only need the right prefix/shape.
const PUBLISHABLE = "sb_publishable_test_only_value";
const SECRET = "sb_secret_test_only_value_do_not_leak";

function expectEnvError(fn: () => unknown, pattern: RegExp) {
  expect(fn).toThrow(EnvValidationError);
  expect(fn).toThrow(pattern);
}

describe("parsePublicEnv", () => {
  it("applies French-first defaults when nothing is configured", () => {
    const env = parsePublicEnv({});
    expect(env).toMatchObject({
      NEXT_PUBLIC_APP_NAME: "Teka Edu",
      NEXT_PUBLIC_DEFAULT_LOCALE: "fr",
      NEXT_PUBLIC_DEFAULT_COUNTRY: "CD",
      NEXT_PUBLIC_APP_ENV: "local",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_ENABLE_ENGLISH_SCAFFOLDING: true,
      NEXT_PUBLIC_ENABLE_CLOUD_SYNC: false,
    });
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
  });

  it("treats empty values as unset", () => {
    const env = parsePublicEnv({ NEXT_PUBLIC_APP_ENV: "", NEXT_PUBLIC_SUPABASE_URL: "  " });
    expect(env.NEXT_PUBLIC_APP_ENV).toBe("local");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
  });

  it("rejects unsupported environment names", () => {
    expectEnvError(() => parsePublicEnv({ NEXT_PUBLIC_APP_ENV: "prod" }), /NEXT_PUBLIC_APP_ENV/);
  });

  it("rejects malformed URLs and flags", () => {
    expectEnvError(() => parsePublicEnv({ NEXT_PUBLIC_APP_URL: "not a url" }), /APP_URL/);
    expectEnvError(
      () => parsePublicEnv({ NEXT_PUBLIC_ENABLE_CLOUD_SYNC: "yes" }),
      /ENABLE_CLOUD_SYNC/,
    );
  });

  it("accepts a valid local Supabase configuration", () => {
    const env = parsePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
    });
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("http://127.0.0.1:54321");
  });

  describe("context-aware requirements (no .env file needed for local/static use)", () => {
    const production = {
      NEXT_PUBLIC_APP_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://teka.example.org",
    };

    it("runs in production without any Supabase value while cloud sync is off", () => {
      const env = parsePublicEnv(production);
      expect(env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC).toBe(false);
      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    });

    it("requires both hosted Supabase browser values in production once cloud sync is on", () => {
      const run = () => parsePublicEnv({ ...production, NEXT_PUBLIC_ENABLE_CLOUD_SYNC: "true" });
      expectEnvError(run, /NEXT_PUBLIC_SUPABASE_URL: is required/);
      expectEnvError(run, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: is required/);
    });

    it("accepts production with cloud sync on and hosted Supabase values", () => {
      const env = parsePublicEnv({
        ...production,
        NEXT_PUBLIC_ENABLE_CLOUD_SYNC: "true",
        NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnop.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
      });
      expect(env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC).toBe(true);
    });
  });

  it("requires Supabase browser variables when cloud sync is enabled", () => {
    expectEnvError(
      () => parsePublicEnv({ NEXT_PUBLIC_ENABLE_CLOUD_SYNC: "true" }),
      /NEXT_PUBLIC_SUPABASE_URL: is required when NEXT_PUBLIC_ENABLE_CLOUD_SYNC=true/,
    );
  });

  it("refuses a secret key in a browser variable without echoing it", () => {
    let message = "";
    try {
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: SECRET,
      });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/SECRET key/);
    expect(message).not.toContain(SECRET);
  });

  it("refuses hosted Supabase projects from the local environment", () => {
    expectEnvError(
      () =>
        parsePublicEnv({
          NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnop.supabase.co",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
        }),
      /must point at the local Supabase stack/,
    );
  });

  it("refuses local hosts in hosted environments", () => {
    expectEnvError(
      () =>
        parsePublicEnv({
          NEXT_PUBLIC_APP_ENV: "staging",
          NEXT_PUBLIC_APP_URL: "https://staging.example.org",
          NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
        }),
      /must not point at a local host/,
    );
    expectEnvError(
      () => parsePublicEnv({ NEXT_PUBLIC_APP_ENV: "production" }),
      /NEXT_PUBLIC_APP_URL: must be the public URL/,
    );
  });

  describe("with known project refs", () => {
    const refs = { staging: "devrefdevrefdevref", production: "prodrefprodrefprod" };
    const staging = {
      NEXT_PUBLIC_APP_ENV: "staging",
      NEXT_PUBLIC_APP_URL: "https://staging.example.org",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
    };

    it("refuses a staging deployment pointing at the production project", () => {
      expectEnvError(
        () =>
          parsePublicEnv(
            { ...staging, NEXT_PUBLIC_SUPABASE_URL: "https://prodrefprodrefprod.supabase.co" },
            refs,
          ),
        /points at the production Supabase project but NEXT_PUBLIC_APP_ENV=staging/,
      );
    });

    it("accepts a staging deployment pointing at the DEV project", () => {
      const env = parsePublicEnv(
        { ...staging, NEXT_PUBLIC_SUPABASE_URL: "https://devrefdevrefdevref.supabase.co" },
        refs,
      );
      expect(env.NEXT_PUBLIC_APP_ENV).toBe("staging");
    });

    it("refuses a production server connecting to the DEV database", () => {
      expectEnvError(
        () =>
          parseServerEnv(
            {
              DATABASE_URL:
                "postgresql://postgres.devrefdevrefdevref:pw@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
            },
            "production",
            refs,
          ),
        /DATABASE_URL: points at the staging Supabase project/,
      );
    });
  });
});

describe("parseServerEnv", () => {
  it("accepts an empty server configuration (no server feature needs secrets yet)", () => {
    expect(parseServerEnv({}, "local")).toMatchObject({ AI_ENABLED: false });
  });

  it("validates the secret key shape without echoing it", () => {
    const wrong = "sb_publishable_wrong_place_value";
    let message = "";
    try {
      parseServerEnv({ SUPABASE_SECRET_KEY: wrong }, "local");
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/SUPABASE_SECRET_KEY: must be a Supabase secret key/);
    expect(message).not.toContain(wrong);
  });

  it("validates database URLs and never echoes the password", () => {
    const url = "postgresql://postgres:super-secret-pw@db.example.supabase.co:5432/postgres";
    let message = "";
    try {
      parseServerEnv({ DATABASE_URL: url }, "local");
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/DATABASE_URL: must point at the local Supabase stack/);
    expect(message).not.toContain("super-secret-pw");
    expectEnvError(() => parseServerEnv({ DATABASE_URL: "mysql://x" }, "local"), /postgres/);
  });

  it("keeps AI disabled in V1", () => {
    expectEnvError(() => parseServerEnv({ AI_ENABLED: "true" }, "local"), /ADR-002/);
  });
});
