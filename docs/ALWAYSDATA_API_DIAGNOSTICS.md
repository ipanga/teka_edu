# Alwaysdata API transport diagnosis and retry boundary

This is preparation for a reviewed staging change. Release A remains live and healthy;
Release B remains installed. No restart, pointer switch, deployment rerun, hosted database
operation, provider setting change or secret export is part of these diagnostics.

## Observed failure

Run [37686442610](https://github.com/ipanga/teka_edu/actions/runs/37686442610)
installed B successfully, then failed in the preliminary identity GET inside
`siteAction("restart")`, before the restart POST.

- A: `8b4667d529f906906b3d40f6cabbcde234f4cb33`.
- B / develop at preparation: `553e3e9cbaa4ba2d9b131c00441e5ca17cd2764a`.
- Initial authenticated inspect passed at `2026-10-07T21:09:17.785Z`.
- Pointer switch logged at `21:10:12.477Z`; fetch failed at `21:10:12.794Z`.
- IPv4 `185.31.40.5`: `ETIMEDOUT` from `internalConnectMultipleTimeout`.
- IPv6 `2a00:b6e0:1:84:1::1`: `ENETUNREACH`.

Address resolution succeeded sufficiently to attempt both connections. Neither TCP
connection established, so that failed request reached neither TLS nor HTTP, and did not
send API credentials. No HTTP status or restart POST was received/sent by this code path.
DNS query timing and the historical address-attempt timeout setting were not logged.

The failure occurred within 317 ms of the preceding switch output, not after the script's
15-second overall deadline. Node 22.23.3's family-selection timeout handler creates the
per-address `ETIMEDOUT`, closes that socket and tries the next address. Its documented
default interval is 250 ms. This explains the error's mechanism; it does not prove why the
IPv4 attempt failed to establish in time.

Sources: [version-specific Node network documentation](https://raw.githubusercontent.com/nodejs/node/v22.23.3/doc/api/net.md),
[network implementation](https://raw.githubusercontent.com/nodejs/node/v22.23.3/lib/net.js),
[bundled Undici TLS connector](https://raw.githubusercontent.com/nodejs/node/v22.23.3/deps/undici/src/lib/core/connect.js).

**Proved phase:** TCP connection establishment for the identity GET.
**Underlying root cause:** NOT PROVED. The evidence does not establish an Alwaysdata
outage, persistent runner restriction, DNS failure, invalid token or TLS failure.
An IPv6 error alone does not justify forcing IPv4; IPv4 was already attempted.

## Anonymous read-only diagnostic

`.github/workflows/diagnose-alwaysdata-api.yml` runs separately on matching pull requests
into develop. It uses an Ubuntu runner, Node 22, read-only repository permissions and
exact PR-head checkout. It declares no Environment or secrets and cannot deploy.

`scripts/alwaysdata/diagnose-api.mjs` checks `DIAGNOSTIC_READ_ONLY=true` and
`DIAGNOSTIC_ALLOW_DEPLOYMENT=false` before any network call. It rejects secret-bearing
inputs and insecure/runtime overrides. Its target is fixed to
`https://api.alwaysdata.com/v1/site/1083502/`; all HTTP requests are GETs. Redirects are
rejected and certificate/hostname verification remains enabled.

The diagnostic reports the actual repository activation switch separately. It does not
shadow a true repository switch with false or claim that repository deployment is disabled.

Bounded probes:

- One DNS A query and one AAAA query, 4-second DNS timeout and one resolver try.
- One HTTPS GET per family, 5-second connection and 15-second overall deadlines.
- Default Node fetch: one GET, with at most one additional attempt after failure and a
  300 ms delay; each attempt has a 15-second deadline.
- Observed TCP/TLS events, sanitized errors, HTTP status and timings only. Response bodies,
  headers, arbitrary exception text and environment contents are never emitted.

HTTP 401 from an anonymous request proves that DNS/TCP/TLS/HTTP reached the API. It is
not an authentication failure of the stored token, because no token was sent. Diagnostic
workflow completion records a measurement; it does not claim every network family worked.

At `2026-10-07T21:55Z`, the Mac (Node 22.22.2) and Alwaysdata SSH environment
(Node 22.23.3) both resolved the same A/AAAA records, established verified TLS over both
families and received HTTP 401. Default fetch reached HTTP 401 on its first attempt in
both environments. Both reported `autoSelectFamily=true` and a 250 ms attempt interval.
The GitHub runner's separate diagnostic artifact and the PR record carry its measured result.

## Prepared authenticated verification

The owner explicitly requires separate authorization before authenticated diagnostics.
There is no approved local token source. Do not retrieve, copy or export the GitHub secret.

`.github/workflows/verify-alwaysdata-api.yml` is a separate, manual verification workflow.
Its initial job must require the actual repository Alwaysdata deployment switch unset/false,
the develop ref and the explicit read-only confirmation before the job using Environment
`staging` can start. The secret-bearing job uses only `ALWAYSDATA_API_TOKEN` and performs
fixed-site identity GET verification. It has no SSH/database credentials, deployment,
restart, upload or pointer actions. `scripts/alwaysdata/verify-api.mjs` repeats its guards
before invoking the GET-only inspection and reports only sanitized status/attempt metadata.

The staging Environment remains restricted to develop. Feature PR diagnostics cannot use
its token. The current repository activation switch remains true, so authenticated
verification is deliberately disabled. Running it later requires a separately authorized
integration and switch/dispatch decision. The new `workflow_dispatch` file must also be
registered on the default branch (`main`); preparing this PR does not perform that integration.
Do not weaken Environment policy or merge the transport fix merely to obtain token access.

## Transport correction

The identity GET retains the exact site ID, account, hostname, Node version, working directory,
command and environment validation. It receives at most three attempts, with 500 ms then
1,000 ms backoff. Each 15-second deadline covers response headers and the GET body.

Only allowlisted transient transport failures and HTTP 502/503/504 are retried. Invalid
identity/JSON, authentication failures, terminal DNS and TLS validation failures stop.
There is no certificate bypass, new dependency, family override or provider configuration
change. CLI failures contain fixed stages, allowlisted codes and numeric status only.

The restart POST is sent at most once, after validated GET success. A response failure
reports `RESTART_NOT_CONFIRMED` and requires read-only state inspection before any separately
authorized action. The code never retries that POST or performs automatic recovery.

Focused tests cover GET success, transient timeout recovery, bounded exhaustion, stalled
headers/body, DNS/IPv4/IPv6/TLS failures, invalid site identity, rejected HTTP statuses,
one-shot POST failures/ambiguous outcomes, credential redaction and both diagnostic guards.
The existing deployment/installer tests and full applicable CI remain required.

## Release identity and future decision

The installed B artifact cannot gain this code correction while keeping its immutable SHA.

1. **Existing B retry:** rerunning its failed deployment job uses B's original single-GET
   transport. It may succeed if the connection failure was transient, but it does not test
   this fix. The installer validates the already present B and refuses replacement. The
   workflow also repeats managed DEV verification. No such rerun is authorized here.
2. **Transport-fix release C:** merging the reviewed fix into develop creates a distinct
   SHA and automatically triggers staging while the repository switch remains true. The
   workflow records current A as the rollback target, so the proof becomes A → C → A → C.
   This requires separate merge/activation authorization and explicit acceptance of that
   distinct release identity. It must never be reported as A → B → A → B.
3. **Separately controlled recovery using existing B:** preserving B while using different
   orchestration would need its own reviewed procedure and authorization. Do not improvise
   a mixed-version deployment or alter B in place.

The preferred next release path is a separately reviewed C with the bounded transport
correction and a complete distinct-release rollback proof. A no-code B retry is a separate
owner choice, not an automatic response to successful anonymous probes.

Stop after diagnosis, tests and PR preparation. Keep A active. No merge, authenticated
diagnostic dispatch, deployment rerun, restart, database action or provider retirement is
authorized by this preparation task.
