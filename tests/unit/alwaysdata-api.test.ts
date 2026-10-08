import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import {
  formatSiteFailure,
  siteAction,
  waitHealth,
  SITE_COMMAND,
  SITE_ID,
} from "../../scripts/alwaysdata/site.mjs";

const token = "unit-only-api-token-never-print";
const basic = Buffer.from(token + " account=congofoot:").toString("base64");
const site = {
  id: SITE_ID,
  type: "nodejs",
  nodejs_version: "22",
  addresses: ["staging-tekaedu.tootiye.com"],
  working_directory: "/home/congofoot/www/tekaedu-staging",
  command: SITE_COMMAND,
  environment: "",
};
const response = () => new Response(JSON.stringify(site));
const networkError = (...codes: string[]) =>
  new TypeError(token, {
    cause: new AggregateError(codes.map((code) => Object.assign(new Error(basic), { code }))),
  });
beforeEach(() => vi.stubEnv("ALWAYSDATA_API_TOKEN", token));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("bounded Alwaysdata site API transport", () => {
  it("validates the exact site using a verified HTTPS GET and rejects redirects", async () => {
    const fetcher = vi.fn().mockResolvedValue(response());
    const sleep = vi.fn();
    await expect(siteAction("inspect", { fetcher, sleep })).resolves.toEqual({
      http_status: 200,
      attempts: 1,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, options] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://api.alwaysdata.com/v1/site/1083502/");
    expect(options).toEqual({
      method: "GET",
      redirect: "error",
      headers: { Authorization: "Basic " + basic },
      signal: expect.any(AbortSignal),
    });
    expect(sleep).not.toHaveBeenCalled();
  });

  it("returns only a safe nullable status when a test double has no valid HTTP status", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => site, status: token });
    await expect(siteAction("inspect", { fetcher, sleep: vi.fn() })).resolves.toEqual({
      http_status: null,
      attempts: 1,
    });
  });

  it.each(["ETIMEDOUT", "EAI_AGAIN", "UND_ERR_CONNECT_TIMEOUT", "ECONNRESET"])(
    "retries transient %s once before successful identity validation",
    async (code) => {
      const fetcher = vi
        .fn()
        .mockRejectedValueOnce(networkError(code))
        .mockResolvedValueOnce(response());
      const sleep = vi.fn();
      await expect(siteAction("inspect", { fetcher, sleep })).resolves.toEqual({
        http_status: 200,
        attempts: 2,
      });
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(sleep.mock.calls).toEqual([[500]]);
      expect(fetcher.mock.calls.every(([, init]) => init.method === "GET")).toBe(true);
    },
  );

  it("exhausts exactly three IPv4/IPv6 failures and never sends a POST", async () => {
    const fetcher = vi.fn().mockRejectedValue(networkError("ETIMEDOUT", "ENETUNREACH"));
    const sleep = vi.fn();
    await expect(siteAction("restart", { fetcher, sleep })).rejects.toThrow(
      "API_SITE_GET / TRANSPORT_FAILED / ENETUNREACH,ETIMEDOUT",
    );
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[500], [1000]]);
    expect(fetcher.mock.calls.every(([, init]) => init.method === "GET")).toBe(true);
  });

  it.each([
    "ENOTFOUND",
    "CERT_HAS_EXPIRED",
    "ERR_TLS_CERT_ALTNAME_INVALID",
    "DEPTH_ZERO_SELF_SIGNED_CERT",
  ])("fails terminal %s without retry, insecure fallback or POST", async (code) => {
    const fetcher = vi.fn().mockRejectedValue(networkError(code));
    const sleep = vi.fn();
    await expect(siteAction("restart", { fetcher, sleep })).rejects.toThrow(code);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(fetcher.mock.calls[0]![1]).not.toHaveProperty("dispatcher");
    expect(fetcher.mock.calls[0]![1]).not.toHaveProperty("rejectUnauthorized");
  });

  it("does not retry a mixed aggregate containing a certificate failure", async () => {
    const fetcher = vi.fn().mockRejectedValue(networkError("ETIMEDOUT", "CERT_HAS_EXPIRED"));
    const sleep = vi.fn();
    await expect(siteAction("restart", { fetcher, sleep })).rejects.toThrow("TLS_FAILED");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it.each([502, 503, 504])("retries idempotent GET HTTP %s before success", async (status) => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(token, { status }))
      .mockResolvedValueOnce(response());
    const sleep = vi.fn();
    await siteAction("inspect", { fetcher, sleep });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(sleep.mock.calls).toEqual([[500]]);
  });

  it.each([301, 401, 403, 404, 429, 500])(
    "does not retry terminal HTTP %s or issue POST",
    async (status) => {
      const fetcher = vi.fn().mockResolvedValue(new Response(token, { status }));
      const sleep = vi.fn();
      await expect(siteAction("restart", { fetcher, sleep })).rejects.toThrow("HTTP_" + status);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(sleep).not.toHaveBeenCalled();
    },
  );

  it("stops when transport succeeds but site identity is wrong", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ...site, id: 1083500, environment: token })),
      );
    const sleep = vi.fn();
    await expect(siteAction("restart", { fetcher, sleep })).rejects.toThrow(
      "SITE_IDENTITY_INVALID",
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("does not retry or print a malformed JSON response", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(token));
    const sleep = vi.fn();
    await expect(siteAction("restart", { fetcher, sleep })).rejects.toThrow("JSON_INVALID");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("caps each entire attempt at 15 seconds even after response headers arrive", async () => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    const fetcher = vi.fn<typeof fetch>(async (_url, init) => {
      signals.push(init!.signal!);
      const result = response();
      vi.spyOn(result, "json").mockImplementation(() => new Promise(() => {}));
      return result;
    });
    const sleep = vi.fn();
    const check = expect(siteAction("restart", { fetcher, sleep })).rejects.toThrow(
      "API_SITE_GET / TIMEOUT",
    );
    await vi.advanceTimersByTimeAsync(45000);
    await check;
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expect(sleep.mock.calls).toEqual([[500], [1000]]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds a stalled fetch separately from the body and clears successful timers", async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockResolvedValueOnce(response());
    const sleep = vi.fn();
    const check = siteAction("inspect", { fetcher, sleep });
    await vi.advanceTimersByTimeAsync(15000);
    await check;
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0]![1].signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("issues precisely one restart POST after valid GET", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response())
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const sleep = vi.fn();
    await siteAction("restart", { fetcher, sleep });
    expect(fetcher.mock.calls.map(([url, init]) => [url, init.method, init.redirect])).toEqual([
      ["https://api.alwaysdata.com/v1/site/1083502/", "GET", "error"],
      ["https://api.alwaysdata.com/v1/site/1083502/restart/", "POST", "error"],
    ]);
    expect(sleep).not.toHaveBeenCalled();
  });

  it.each(["network", "http"])(
    "leaves a failed POST response %s unconfirmed and never repeats it",
    async (failure) => {
      const fetcher = vi.fn().mockResolvedValueOnce(response());
      if (failure === "network") fetcher.mockRejectedValueOnce(networkError("ECONNRESET"));
      else fetcher.mockResolvedValueOnce(new Response(token, { status: 503 }));
      const sleep = vi.fn();
      await expect(siteAction("restart", { fetcher, sleep })).rejects.toThrow(
        "RESTART_NOT_CONFIRMED / READ_ONLY_INSPECTION_REQUIRED",
      );
      expect(fetcher.mock.calls.map(([, init]) => init.method)).toEqual(["GET", "POST"]);
      expect(sleep).not.toHaveBeenCalled();
    },
  );

  it("reports POST timeout as unconfirmed without retry or automatic recovery", async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response())
      .mockImplementationOnce(() => new Promise(() => {}));
    const sleep = vi.fn();
    const check = expect(siteAction("restart", { fetcher, sleep })).rejects.toThrow(
      "RESTART_NOT_CONFIRMED",
    );
    await vi.advanceTimersByTimeAsync(15000);
    await check;
    expect(fetcher.mock.calls.map(([, init]) => init.method)).toEqual(["GET", "POST"]);
    expect(fetcher.mock.calls[1]![1].signal.aborted).toBe(true);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("bounds cyclic causes and ignores hostile getters without exposing their errors", async () => {
    const error = Object.assign(new Error(token), { code: "ETIMEDOUT", cause: null as unknown });
    error.cause = error;
    Object.defineProperty(error, "errors", {
      get() {
        throw new Error(basic);
      },
    });
    const fetcher = vi.fn().mockRejectedValue(error);
    const sleep = vi.fn();
    await expect(siteAction("restart", { fetcher, sleep })).rejects.toThrow(
      "API_SITE_GET / TRANSPORT_FAILED / ETIMEDOUT",
    );
    expect(fetcher).toHaveBeenCalledTimes(3);
    const hostile = Object.create(null);
    for (const key of ["name", "code", "cause", "errors"])
      Object.defineProperty(hostile, key, {
        get() {
          throw new Error(token);
        },
      });
    const hostileFetch = vi.fn().mockRejectedValue(hostile);
    await expect(siteAction("restart", { fetcher: hostileFetch, sleep })).rejects.toThrow(
      "API_SITE_GET / TRANSPORT_FAILED",
    );
    expect(hostileFetch).toHaveBeenCalledTimes(1);
  });

  it.each(["http", "identity"])(
    "keeps application health failure separate from API transport (%s)",
    async (failure) => {
      const fetcher = vi.fn().mockResolvedValue(
        failure === "http"
          ? new Response(token, { status: 503 })
          : new Response(
              JSON.stringify({
                status: "ok",
                environment: "staging",
                commit: "b".repeat(40),
                supabaseProjectRef: null,
              }),
            ),
      );
      vi.stubGlobal("fetch", fetcher);
      const error = await waitHealth("a".repeat(40), 1).catch((error) => error);
      expect(formatSiteFailure(error)).toBe("APPLICATION_HEALTH / EXPECTED_RELEASE_NOT_HEALTHY");
      expect(fetcher).toHaveBeenCalledOnce();
      expect(fetcher.mock.calls[0]![0]).toBe(
        "https://staging-tekaedu.tootiye.com/api/health?release=" + "a".repeat(40),
      );
      expect(fetcher.mock.calls[0]![1]).not.toHaveProperty("headers");
      expect(String(error)).not.toContain(token);
      expect(String(error)).not.toContain(basic);
    },
  );

  it("redacts nested messages, unknown codes, token, Basic encoding and raw CLI stack", async () => {
    const fetcher = vi.fn().mockRejectedValue(
      Object.assign(networkError("CERT_HAS_EXPIRED"), {
        code: token,
        headers: { Authorization: basic },
      }),
    );
    try {
      await siteAction("restart", { fetcher, sleep: vi.fn() });
      expect.fail("transport must fail");
    } catch (error) {
      const output = formatSiteFailure(error);
      expect(output).toBe("API_SITE_GET / TLS_FAILED / CERT_HAS_EXPIRED");
      expect(String(error)).not.toContain(token);
      expect(String(error)).not.toContain(basic);
      expect(error).not.toHaveProperty("cause");
    }
    expect(formatSiteFailure(new Error(token))).toBe("STAGING_ACTION_FAILED");
    const script = resolve("scripts/alwaysdata/site.mjs");
    const child = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `
      globalThis.fetch = async () => { throw Object.assign(new Error(process.env.ALWAYSDATA_API_TOKEN), { code: "ENOTFOUND" }); };
      process.argv = [process.execPath, ${JSON.stringify(script)}, "restart"];
      await import(${JSON.stringify(pathToFileURL(script).href)});
    `,
      ],
      { encoding: "utf8", env: { ...process.env, ALWAYSDATA_API_TOKEN: token } },
    );
    expect(child.status).toBe(1);
    expect(child.stdout).toBe("");
    expect(child.stderr).toBe("FAIL: API_SITE_GET / DNS_NOT_FOUND / ENOTFOUND\n");
    expect(child.stderr).not.toContain(token);
    expect(child.stderr).not.toContain(basic);
  });
});
