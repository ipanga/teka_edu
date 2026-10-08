# Alwaysdata API transport diagnosis and retry boundary

## Current outcome — 2026-10-08

PR #112 is merged and the Release C activation/rollback proof succeeded. Current acceptance
is recorded in [staging CD](ALWAYSDATA_STAGING_CD.md#current-acceptance--2026-10-08);
all deployment switches are false and production work remains unauthorized.

The diagnosis and planned proof below retain their original historical context. Deployment
GET attempt counts were not logged and must not be inferred from successful restart POSTs.

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

## Independently integrated authenticated verification

The GET-only verifier was integrated independently through protected PRs
[#113](https://github.com/ipanga/teka_edu/pull/113),
[#114](https://github.com/ipanga/teka_edu/pull/114) and
[#115](https://github.com/ipanga/teka_edu/pull/115). Its authoritative develop baseline is
`b7e69fa14aa69c7865aa9aa33db7f51f251c3481`. The identical manual workflow is registered
on main at `1578847d02d025286af92af48c691bbfafd84c10`.

The workflow requires all three actual repository switches to equal `false`, the exact
develop ref, manual dispatch and explicit read-only acknowledgement before staging Environment
access. `verify-api.mjs` repeats those guards and uses only the fixed GET-only `api-get.mjs`,
with no dependency on the deployment action module. The staging Environment remains develop-only.
Only its existing `ALWAYSDATA_API_TOKEN` is used; no token is retrieved, copied or exported locally.

Separately authorized run
[37828705977](https://github.com/ipanga/teka_edu/actions/runs/37828705977) succeeded on that
exact develop SHA: deployment guard, staging Environment access, token access, authentication,
normal TLS/hostname validation, account `congofoot`, site `1083502` and exact configuration all
PASS. HTTP 200 took one attempt and zero retries. Restart POSTs, provider mutations and database
connections were all zero. This successful observation does not prove the underlying cause of
the previous TCP failure or that a future restart succeeds.

The current reconciliation task does not dispatch this authenticated workflow again.
All three repository switches remain false, with no Environment switch overrides.

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

GET transport errors carry `API_SITE_GET`; HTTP 401/403 identify authorization rejection;
site validation errors carry `SITE_IDENTITY_INVALID`; failed restart responses carry
`API_RESTART_POST / RESTART_NOT_CONFIRMED`. Application health exhaustion now retains the
sanitized `APPLICATION_HEALTH / EXPECTED_RELEASE_NOT_HEALTHY` stage instead of being collapsed
into the generic CLI fallback. Its health retries, exact SHA checks and response requirements
are unchanged. No raw health body or credential reaches that diagnostic.

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
   SHA. Staging stays disabled until separately authorized switch activation. The
   workflow records current A as the rollback target, so the proof becomes A → C → A → C.
   This requires separate merge/activation authorization and explicit acceptance of that
   distinct release identity. It must never be reported as A → B → A → B.
3. **Separately controlled recovery using existing B:** preserving B while using different
   orchestration would need its own reviewed procedure and authorization. Do not improvise
   a mixed-version deployment or alter B in place.

The preferred next release path is a separately reviewed C with the bounded transport
correction and a complete distinct-release rollback proof. A no-code B retry is a separate
owner choice, not an automatic response to successful anonymous probes.

## Reconciliation decisions and scope

Merge develop into the existing PR #112 feature branch without rewriting either history.
The original reviewed PR head is `838fd4ff9701cc04d75cb732baa445b305b9a0c0`.
Resolve the three add/add conflicts individually:

| File                                             | Decision                                                                                                          |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/verify-alwaysdata-api.yml`    | Preserve develop byte-for-byte: actual three-switch guard before Environment access.                              |
| `scripts/alwaysdata/verify-api.mjs`              | Preserve develop byte-for-byte: GET-only dependency, result validation and independent sanitized classifications. |
| `tests/unit/alwaysdata-api-verification.test.ts` | Preserve develop byte-for-byte: stronger switch, result, hostile-error and forbidden-action regressions.          |

Also preserve `api-get.mjs` and its tests byte-for-byte. Deployment resilience remains
independently scoped to `site.mjs`; the verifier does not acquire a restart-capable dependency.
The existing deployment workflow, installer, preflight/site validators and administrative
DEV tooling remain unchanged. The only added reconciliation code correction is retaining
application-health failure classification, covered by HTTP and wrong-SHA regressions.

The final diff against develop is limited to these eight files:

- `.github/workflows/diagnose-alwaysdata-api.yml`
- `docs/ALWAYSDATA_API_DIAGNOSTICS.md`
- `scripts/alwaysdata/diagnose-api.mjs`
- `scripts/alwaysdata/site.mjs`
- `tests/e2e/helpers/offered-session.ts`
- `tests/unit/alwaysdata-api-diagnostic.test.ts`
- `tests/unit/alwaysdata-api.test.ts`
- `tests/unit/offered-session-date.test.ts`

The offered-session test helper now reads the canonical calendar's `Africa/Kinshasa` timezone,
matching the application's existing reference-data path. Seven boundary tests cover the UTC
hour where Kinshasa and Lubumbashi dates differ. Exact route-date/title assertions remain.
Application scheduling, lessons, curriculum, approvals, media and migration/seed files are unchanged.

## Historical controlled Release C proof plan — subsequently executed

The PR head is a review identity, not a deployed Release C identity. The eventual release must
be rebuilt from the resulting protected develop merge SHA. PR CI packages its synthetic merge
checkout; that archive is Linux validation evidence and must not be relabelled or uploaded as
an eventual develop release. Exact reconciled head, CI IDs and downloaded archive checksum are
recorded in the PR description and preparation resume evidence after CI completes.

Before a separately authorized activation, recheck all switch/Environment/secret/site/SSH/DEV
safeguards and the exact reviewed head/green CI, then confirm A health and both immutable releases.
The reviewed deployment procedure must prove **A → C → A → C**:

1. Confirm A's HTTP 200, staging identity and full SHA before transition.
2. Build/install immutable C from the actual develop merge SHA and activate it.
3. Restart only site 1083502, verify exact C health, and run phone/tablet/laptop-MacBook
   navigation and media smoke tests.
4. Switch to A, restart that same site and verify A's exact SHA and health.
5. Restore C, restart that same site and verify C's exact SHA and health.
6. Accept the sequence only with all transition health evidence and supported-device smoke;
   leave C active only after the complete proof succeeds.

If any identity GET or restart API transport fails, stop at the failed stage. A GET failure
before POST means no restart was issued by that call; a POST response failure means the restart
outcome is unconfirmed. Do not retry the POST, replay deployment or move pointers automatically.
Perform read-only pointer/manifest/API/health inspection, retain evidence and obtain separate
recovery authorization following the manual application recovery boundary in
[the staging CD procedure](ALWAYSDATA_STAGING_CD.md#release-integrity-and-rollback).
Filesystem pointers alone never prove a running release or successful rollback. No database
rollback/reset, DNS change, provider retirement or PROD action belongs to application recovery.

Keep PR #112 open and unmerged, with auto-merge disabled. Stop after reconciliation, tests,
CI and PR preparation. Keep A active and all three deployment switches false. No authenticated
diagnostic dispatch, deployment rerun, upload, restart, pointer mutation, managed database
operation or provider retirement is authorized by this preparation task. Staging acceptance
remains BLOCKED until the distinct-release application rollback sequence is actually proved.
