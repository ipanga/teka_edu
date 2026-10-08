import { afterEach, describe, expect, it, vi } from "vitest";
import { inspectApiSite, apiGetFailureDetails } from "../../scripts/alwaysdata/api-get.mjs";
const token = "fake-unit-only-private-token";
const basic = Buffer.from(token + " account=congofoot:").toString("base64");
const site = {
  id: 1083502,
  type: "nodejs",
  nodejs_version: "22",
  addresses: ["staging-tekaedu.tootiye.com/"],
  working_directory: "/home/congofoot/www/tekaedu-staging",
  command: "/usr/alwaysdata/nodejs/22/bin/node current/runtime.mjs",
  environment: "",
};
const ok = () => new Response(JSON.stringify(site));
const networkError = (...codes: string[]) =>
  new TypeError(token, {
    cause: new AggregateError(codes.map((code) => Object.assign(new Error(basic), { code }))),
  });
afterEach(() => vi.useRealTimers());
describe("isolated GET-only Alwaysdata transport", () => {
  it("scopes exactly one verified HTTPS GET to congofoot/site1083502", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok());
    expect(await inspectApiSite({ token, fetcher })).toEqual({ http_status: 200, attempts: 1 });
    expect(fetcher).toHaveBeenCalledExactlyOnceWith("https://api.alwaysdata.com/v1/site/1083502/", {
      method: "GET",
      redirect: "error",
      headers: { Authorization: "Basic " + basic },
      signal: expect.any(AbortSignal),
    });
  });
  it.each(["ETIMEDOUT", "EAI_AGAIN", "ECONNRESET", "UND_ERR_CONNECT_TIMEOUT"])(
    "bounds recovery from %s to GET requests",
    async (code) => {
      const fetcher = vi.fn().mockRejectedValueOnce(networkError(code)).mockResolvedValueOnce(ok());
      const sleep = vi.fn();
      expect(await inspectApiSite({ token, fetcher, sleep })).toEqual({
        http_status: 200,
        attempts: 2,
      });
      expect(sleep.mock.calls).toEqual([[500]]);
      expect(fetcher.mock.calls.every(([, options]) => options.method === "GET")).toBe(true);
    },
  );
  it("exhausts IPv4/IPv6 failures in three GET attempts with safe counts/codes", async () => {
    const fetcher = vi.fn().mockRejectedValue(networkError("ETIMEDOUT", "ENETUNREACH"));
    const sleep = vi.fn();
    const error = await inspectApiSite({ token, fetcher, sleep }).catch((e) => e);
    expect(apiGetFailureDetails(error)).toMatchObject({
      classification: "TRANSPORT_FAILURE",
      attempts: 3,
      http_status: null,
      tls_validation: "NOT PROVED",
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[500], [1000]]);
    expect(fetcher.mock.calls.every(([, options]) => options.method === "GET")).toBe(true);
    expect(JSON.stringify(apiGetFailureDetails(error))).not.toContain(token);
    expect(JSON.stringify(apiGetFailureDetails(error))).not.toContain(basic);
  });
  it.each([
    "ENOTFOUND",
    "CERT_HAS_EXPIRED",
    "ERR_TLS_CERT_ALTNAME_INVALID",
    "DEPTH_ZERO_SELF_SIGNED_CERT",
  ])("stops terminal %s without a TLS/family override", async (code) => {
    const fetcher = vi.fn().mockRejectedValue(networkError(code));
    const sleep = vi.fn();
    const error = await inspectApiSite({ token, fetcher, sleep }).catch((e) => e);
    expect(apiGetFailureDetails(error).attempts).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(fetcher.mock.calls[0]![1]).not.toHaveProperty("dispatcher");
    expect(fetcher.mock.calls[0]![1]).not.toHaveProperty("rejectUnauthorized");
    if (code !== "ENOTFOUND")
      expect(apiGetFailureDetails(error)).toMatchObject({
        classification: "TLS_FAILURE",
        tls_validation: "FAIL",
      });
  });
  it.each([401, 403])(
    "classifies HTTP%d independently from transport, without body exposure",
    async (status) => {
      const fetcher = vi.fn().mockResolvedValue(new Response(token + basic, { status }));
      const error = await inspectApiSite({ token, fetcher, sleep: vi.fn() }).catch((e) => e);
      expect(apiGetFailureDetails(error)).toMatchObject({
        classification: "HTTP_AUTHORIZATION_REJECTED",
        attempts: 1,
        http_status: status,
        tls_validation: "PASS",
      });
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(apiGetFailureDetails(error))).not.toContain(token);
      expect(JSON.stringify(apiGetFailureDetails(error))).not.toContain(basic);
    },
  );
  it.each([502, 503, 504])(
    "retries transient HTTP%d only within the fixed bound",
    async (status) => {
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(new Response(token, { status }))
        .mockResolvedValueOnce(ok());
      expect(await inspectApiSite({ token, fetcher, sleep: vi.fn() })).toMatchObject({
        attempts: 2,
      });
    },
  );
  it.each([
    { id: 1083500 },
    { addresses: ["tekaedu.tootiye.com/"] },
    { nodejs_version: "24" },
    { working_directory: "/home/congofoot/www/tekaedu-prod" },
    { command: token },
    { environment: "PGPASSWORD=" + token },
    { environment: "SUPABASE_URL=" + token },
    { environment: "VERCEL_URL=" + token },
  ])("rejects an unexpected site/configuration without retry %#", async (delta) => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...site, ...delta })));
    const error = await inspectApiSite({ token, fetcher, sleep: vi.fn() }).catch((e) => e);
    expect(apiGetFailureDetails(error)).toMatchObject({
      classification: "SITE_IDENTITY_REJECTED",
      attempts: 1,
      site_identity: "FAIL",
      tls_validation: "PASS",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(apiGetFailureDetails(error))).not.toContain(token);
  });
  it("rejects invalid JSON and invalid status without retry", async () => {
    for (const value of [
      new Response(token),
      { ok: true, status: token, json: async () => site },
    ]) {
      const fetcher = vi.fn().mockResolvedValue(value);
      const error = await inspectApiSite({ token, fetcher, sleep: vi.fn() }).catch((e) => e);
      expect(apiGetFailureDetails(error).classification).toBe("RESPONSE_INVALID");
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });
  it.each(["headers", "body"])("enforces overall deadlines for stalled %s", async (phase) => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    const fetcher = vi.fn(async (_url, options) => {
      signals.push(options.signal);
      if (phase === "headers") return new Promise<Response>(() => {});
      return new Response(new ReadableStream());
    });
    const pending = inspectApiSite({ token, fetcher, sleep: vi.fn() }).catch((e) => e);
    await vi.advanceTimersByTimeAsync(45000);
    expect(apiGetFailureDetails(await pending)).toMatchObject({
      attempts: 3,
      classification: "TRANSPORT_FAILURE",
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });
  it("does not retry a mixed TLS/transient aggregate or leak hostile/cyclic errors", async () => {
    const error = networkError("ETIMEDOUT", "CERT_HAS_EXPIRED");
    const fetcher = vi.fn().mockRejectedValue(error);
    expect(
      apiGetFailureDetails(await inspectApiSite({ token, fetcher }).catch((e) => e)),
    ).toMatchObject({ classification: "TLS_FAILURE", attempts: 1 });
    const hostile = Object.create(null);
    Object.defineProperty(hostile, "code", {
      get() {
        throw new Error(token);
      },
    });
    hostile.cause = hostile;
    expect(
      apiGetFailureDetails(
        await inspectApiSite({ token, fetcher: vi.fn().mockRejectedValue(hostile) }).catch(
          (e) => e,
        ),
      ),
    ).toMatchObject({ classification: "TRANSPORT_FAILURE", attempts: 1 });
  });
});
