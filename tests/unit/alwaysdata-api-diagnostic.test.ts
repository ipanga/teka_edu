import { EventEmitter } from "node:events";
import https from "node:https";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  DIAGNOSTIC_URL,
  probeHttps,
  runDiagnostic,
  sanitizeDiagnosticError,
} from "../../scripts/alwaysdata/diagnose-api.mjs";

const env: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  DIAGNOSTIC_READ_ONLY: "true",
  DIAGNOSTIC_ALLOW_DEPLOYMENT: "false",
  ALWAYSDATA_STAGING_DEPLOY_ENABLED: "true",
};
function transport({ status = 401, failure }: { status?: number; failure?: Error } = {}) {
  const destroyBody = vi.fn();
  const request = vi.fn((_options: unknown, callback: (response: unknown) => void) => {
    const req = Object.assign(new EventEmitter(), {
      destroy(error?: Error) {
        if (error) req.emit("error", error);
        return this;
      },
      end() {
        queueMicrotask(() => {
          const socket = Object.assign(new EventEmitter(), { authorized: true });
          req.emit("socket", socket);
          socket.emit("lookup", null);
          if (failure) {
            req.emit("error", failure);
            return;
          }
          socket.emit("connect");
          socket.emit("secureConnect");
          callback({ statusCode: status, destroy: destroyBody });
        });
        return req;
      },
    });
    return req;
  });
  return { request, dependency: request as unknown as typeof https.request, destroyBody };
}
function dependencies() {
  const connection = transport();
  const resolver = {
    resolve4: vi.fn(async () => ["192.0.2.1"]),
    resolve6: vi.fn(async () => ["2001:db8::1"]),
  };
  const fetcher = vi.fn(async () => new Response(null, { status: 401 }));
  const pause = vi.fn(async () => {});
  return {
    connection,
    resolver,
    fetcher,
    pause,
    options: { env, resolver, request: connection.dependency, fetcher, pause },
  };
}

describe("anonymous read-only Alwaysdata API diagnostic", () => {
  it.each([
    {},
    { DIAGNOSTIC_READ_ONLY: "false", DIAGNOSTIC_ALLOW_DEPLOYMENT: "false" },
    { DIAGNOSTIC_READ_ONLY: "true", DIAGNOSTIC_ALLOW_DEPLOYMENT: "true" },
    { ...env, ALWAYSDATA_API_TOKEN: "secret-unit-value" },
    { ...env, PGPASSWORD: "secret-unit-value" },
    { ...env, NODE_TLS_REJECT_UNAUTHORIZED: "0" },
    { ...env, NODE_OPTIONS: "--require=untrusted" },
  ])("refuses unsafe configuration before any network operation: %#", async (config) => {
    const deps = dependencies();
    await expect(
      runDiagnostic({ ...deps.options, env: { NODE_ENV: "test", ...config } }),
    ).rejects.toThrow(/^DIAGNOSTIC_/);
    expect(deps.resolver.resolve4).not.toHaveBeenCalled();
    expect(deps.resolver.resolve6).not.toHaveBeenCalled();
    expect(deps.connection.request).not.toHaveBeenCalled();
    expect(deps.fetcher).not.toHaveBeenCalled();
  });

  it("probes only the fixed site with GET, TLS verification and no credentials", async () => {
    const deps = dependencies();
    const result = await runDiagnostic(deps.options);
    expect(result).toMatchObject({
      diagnostic: "READ_ONLY",
      deployment_allowed: false,
      repository_activation_switch: "true",
      authentication: "NOT ATTEMPTED",
      provider_mutations: 0,
      database_connections: 0,
    });
    expect(deps.resolver.resolve4).toHaveBeenCalledExactlyOnceWith("api.alwaysdata.com");
    expect(deps.resolver.resolve6).toHaveBeenCalledExactlyOnceWith("api.alwaysdata.com");
    expect(deps.connection.request.mock.calls.map((call) => call[0])).toEqual(
      [4, 6].map((family) => ({
        hostname: "api.alwaysdata.com",
        port: 443,
        path: "/v1/site/1083502/",
        method: "GET",
        family,
        servername: "api.alwaysdata.com",
        rejectUnauthorized: true,
        agent: false,
        headers: { Accept: "application/json" },
      })),
    );
    expect(deps.connection.destroyBody).toHaveBeenCalledTimes(2);
    expect(deps.fetcher).toHaveBeenCalledExactlyOnceWith(DIAGNOSTIC_URL, {
      method: "GET",
      redirect: "error",
      signal: expect.any(AbortSignal),
      headers: { Accept: "application/json" },
    });
    expect(result.https.ipv4).toMatchObject({
      status: "HTTP_REACHED",
      http_status: 401,
      tls_verified: true,
    });
    expect(result.node_fetch).toMatchObject([
      { status: "HTTP_REACHED", http_status: 401, authentication: "NOT ATTEMPTED" },
    ]);
  });

  it("rejects redirects without issuing another request or reading the body", async () => {
    const connection = transport({ status: 302 });
    await expect(probeHttps(4, connection.dependency)).resolves.toMatchObject({
      status: "REDIRECT_REJECTED",
      http_status: 302,
    });
    expect(connection.request).toHaveBeenCalledTimes(1);
    expect(connection.destroyBody).toHaveBeenCalledOnce();
  });

  it("limits default-fetch failures to two GET attempts and one fixed delay", async () => {
    const deps = dependencies();
    deps.fetcher.mockRejectedValue(
      Object.assign(new Error("token must remain hidden"), { code: "ETIMEDOUT" }),
    );
    const result = await runDiagnostic(deps.options);
    expect(deps.fetcher).toHaveBeenCalledTimes(2);
    expect(deps.pause).toHaveBeenCalledExactlyOnceWith(300);
    expect(result.node_fetch).toMatchObject([
      { attempt: 1, status: "FAILED", errors: [{ code: "ETIMEDOUT" }] },
      { attempt: 2, status: "FAILED", errors: [{ code: "ETIMEDOUT" }] },
    ]);
    expect(JSON.stringify(result)).not.toContain("token must remain hidden");
  });

  it("records failure followed by successful HTTP status without further attempts", async () => {
    const deps = dependencies();
    deps.fetcher.mockRejectedValueOnce(new DOMException("private detail", "TimeoutError"));
    const result = await runDiagnostic(deps.options);
    expect(result.node_fetch).toMatchObject([
      { attempt: 1, status: "FAILED", errors: [{ code: "DIAGNOSTIC_OVERALL_TIMEOUT" }] },
      { attempt: 2, status: "HTTP_REACHED", http_status: 401 },
    ]);
    expect(deps.fetcher).toHaveBeenCalledTimes(2);
  });

  it("does not retry an HTTP response when disposing its unread body fails", async () => {
    const deps = dependencies();
    deps.fetcher.mockResolvedValueOnce(
      new Response(
        new ReadableStream({
          cancel: () => Promise.reject(new Error("private body disposal detail")),
        }),
        { status: 403 },
      ),
    );
    const result = await runDiagnostic(deps.options);
    expect(deps.fetcher).toHaveBeenCalledOnce();
    expect(deps.pause).not.toHaveBeenCalled();
    expect(result.node_fetch).toMatchObject([{ status: "HTTP_REACHED", http_status: 403 }]);
    expect(JSON.stringify(result)).not.toContain("private body disposal detail");
  });

  it.each([false, true])(
    "bounds the HTTPS connection and overall timeout (TCP connected=%s)",
    async (connected) => {
      vi.useFakeTimers();
      try {
        const request = vi.fn(() => {
          const req = Object.assign(new EventEmitter(), {
            destroy(error?: Error) {
              if (error) req.emit("error", error);
              return req;
            },
            end() {
              const socket = new EventEmitter();
              req.emit("socket", socket);
              socket.emit("lookup", null);
              if (connected) socket.emit("connect");
              return req;
            },
          });
          return req;
        });
        const result = probeHttps(4, request as unknown as typeof https.request);
        await vi.advanceTimersByTimeAsync(connected ? 15000 : 5000);
        await expect(result).resolves.toMatchObject({
          status: "FAILED",
          phase: connected ? "TLS" : "TCP",
          errors: [
            { code: connected ? "DIAGNOSTIC_OVERALL_TIMEOUT" : "DIAGNOSTIC_CONNECT_TIMEOUT" },
          ],
        });
        expect(request).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it("keeps DNS and family failures separate, exposing only approved error codes", async () => {
    const deps = dependencies();
    deps.resolver.resolve6.mockRejectedValue(
      Object.assign(new Error("dns private payload"), { code: "ENODATA" }),
    );
    const connection = transport({
      failure: Object.assign(new Error("private payload"), {
        code: "ENETUNREACH",
        address: "2001:db8::2",
      }),
    });
    const result = await runDiagnostic({ ...deps.options, request: connection.dependency });
    expect(result.dns.AAAA).toMatchObject({ status: "FAILED", errors: [{ code: "ENODATA" }] });
    expect(result.https.ipv6).toMatchObject({
      status: "FAILED",
      phase: "TCP",
      errors: [{ code: "ENETUNREACH", family: 6 }],
    });
    expect(JSON.stringify(result)).not.toContain("private payload");
  });

  it("redacts nested aggregate errors, arbitrary codes, credentials and headers", () => {
    const error = Object.assign(new Error("Basic encoded-secret"), {
      code: "credential-secret",
      headers: { Authorization: "secret-unit-value" },
      cause: new AggregateError([
        Object.assign(new Error("secret-unit-value"), { code: "ETIMEDOUT", address: "192.0.2.1" }),
        Object.assign(new Error("encoded-secret"), { code: "ENETUNREACH", address: "2001:db8::1" }),
        Object.assign(new Error("secret-unit-value"), { code: "CERT_HAS_EXPIRED" }),
      ]),
    });
    expect(sanitizeDiagnosticError(error)).toEqual([
      { code: "ETIMEDOUT", family: 4 },
      { code: "ENETUNREACH", family: 6 },
      { code: "CERT_HAS_EXPIRED" },
    ]);
    expect(sanitizeDiagnosticError(new Error("secret-unit-value"))).toEqual([
      { code: "TRANSPORT_FAILURE" },
    ]);
  });

  it("keeps the PR workflow independent of Environment secrets and deployment", () => {
    const workflow = readFileSync(".github/workflows/diagnose-alwaysdata-api.yml", "utf8");
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("branches: [develop]");
    expect(workflow).toContain('DIAGNOSTIC_READ_ONLY: "true"');
    expect(workflow).toContain('DIAGNOSTIC_ALLOW_DEPLOYMENT: "false"');
    expect(workflow).toContain("persist-credentials: false");
    expect(workflow).toContain("${{ vars.ALWAYSDATA_STAGING_DEPLOY_ENABLED }}");
    expect(workflow).not.toMatch(
      /pull_request_target|secrets\.|\benvironment:|deploy\.sh|site\.mjs restart|ssh |scp |PGPASSWORD/,
    );
  });
});
