# PostgreSQL 16 portability verification report

Implementation is reviewable in [draft PR #100](https://github.com/ipanga/teka_edu/pull/100).
The database-only tooling and clean PostgreSQL 16 replay pass. Managed DEV is deliberately
unapplied while the owner-required rollback approval is pending; overall status is BLOCKED.

## Git and scope

Branch `feature/alwaysdata-postgres-portability` starts at accepted main
`ac003f8580ca81dcfb426a70c45c02102b8e0551`. Implementation checkpoints are `bf83c3e`,
`a6d54f4`, `41e4a9c` and `35b7c3f`; they are pushed. The final documentation checkpoint
is recorded in the branch log. No merge is performed. Original historical SQL, canonical
content/media, app routes/domain/environment guards and Vercel deployment workflows are
unchanged. Docker excludes separate administrative tooling from application build/runtime.

## Clean PostgreSQL 16 replay

[Machine evidence](postgres16-replay.json) records exact tested checkout
`35b7c3f7d37da8696cc921e9899793f6bafa29e1`, runner/source/execution hashes and timestamp.
[CI run](https://github.com/ipanga/teka_edu/actions/runs/37362083561) successfully replays
46 migrations under a non-superuser login on PostgreSQL 16.15. Four execution copies are
adapted. `btree_gist` 1.7 is installed in `extensions`; plpgsql 1.0 is preserved.

| Inventory / guarantee                                      | Result                                                                                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Canonical tables / selected values                         | PASS: 36 / 6,170 rows                                                                                                                                  |
| Columns / constraints / indexes                            | PASS: 213 / 247 / 80                                                                                                                                   |
| Primary / foreign / unique / check / exclusion constraints | 36 / 51 / 15 / 139 / 3, plus three constraint triggers                                                                                                 |
| Triggers / private functions                               | PASS: three / two                                                                                                                                      |
| RLS / policies                                             | PASS: all 36 enabled / zero policies                                                                                                                   |
| Privileges                                                 | PASS: schema/table/function checks; 43 ACL objects inventoried                                                                                         |
| Reviewed structural baseline                               | PASS: complete inventory equals committed baseline                                                                                                     |
| Second apply / canonical re-sync                           | PASS: zero pending migrations / zero row mutations                                                                                                     |
| Portable pgTAP                                             | PASS: four suites, 156 assertions                                                                                                                      |
| Managed assertion equivalents in CI                        | PASS: original 30 foundation + 47 curriculum assertions                                                                                                |
| Negative regressions                                       | PASS: lock contention, history recheck after lock, SQL rollback/ON_ERROR_STOP, real unprivileged read denial and incorrect managed assertions rejected |

All applicable existing jobs and the added PostgreSQL check PASS at `35b7c3f` in the
linked CI run. Promotion source is correctly skipped for a PR into develop. The final
documentation checkpoint is tracked separately in PR checks.
Local current quality: format/lint/typecheck, 541 unit tests and 31 content files PASS.
The local Turbopack worker-port restriction is recorded separately; the Linux build, client
secret sentinel check, browser smoke, Docker images and original Supabase tests passed in CI.

## Exact Supabase execution-copy compatibility

- `20260911203000_educational_foundation.sql`: private-schema revoke from
  `PUBLIC, anon, authenticated` becomes PUBLIC; the exact table revoke block becomes PUBLIC.
- `20260911222600_curriculum_objectives_and_lessons.sql`: exact table revoke block becomes PUBLIC.
- `20260912120000_september_programme.sql`: exact table revoke block becomes PUBLIC.
- `20260912200000_media_assets.sql`: exact table revoke block becomes PUBLIC.

Source bytes and recorded source SHA-256 for all 46 files are unchanged. No fake Supabase
roles are created. Private PUBLIC EXECUTE revocations, constraints, indexes, triggers, RLS and
reference data remain intact. Unexpected block shapes/role constructs fail closed.

## Managed Alwaysdata DEV

[Read-only preflight](dev-preflight.json) passes for exact database/login, PostgreSQL 16.15,
actual TLS and full CA/hostname verification. It reports zero history, 46 pending migrations,
zero public tables/private functions and trusted available `btree_gist`. Actual extension
installation permission remains unproved until controlled apply. pgTAP is unavailable.
DEV is denied PROD CONNECT. Managed integrity/access/canonical/idempotency checks are NOT RUN
because no migration was applied; [managed report](managed-dev-verification.json) records
that distinction. Neither the clean CI replay nor read-only preflight is mislabelled as managed
acceptance. CLI `list`/`preflight` PASS; managed `apply`/`verify` remain gated.

The latest provider backup lacks this new database. A protected 1130-byte custom dump with
mode 0600 has successful manifest/full extraction verification. [Rollback plan](dev-rollback-plan.md)
and [record](dev-rollback-record.json) identify its exact path/hash and coverage. No restore
rehearsal was claimed. The owner's request explicitly requires “operator-approved rollback
coverage PASS”; approval was requested and remains pending. The runner additionally checks
the actual protected dump's permissions/hash and requires matching CI SHA/tooling/baseline.

## Canonical comparison and runtime

Expected 36 tables / 6,170 rows: clean CI PASS; Alwaysdata DEV unapplied/zero public tables.
The preserved [earlier read-only audit](migration-audit.json) records Supabase DEV and PROD
all 36/6,170 selected values matching this unchanged canonical state. Those are earlier
observations, not fresh hosted queries during implementation.

Both Alwaysdata app roots remain empty. No app/site/GitHub Environment values were written.
Credentials enter only the private administrative command environment; no runtime SQL/Supabase
values are configured by this phase. Frozen runtime guards are unchanged, cloud sync and AI
remain false, browser-local progress is unchanged. Alwaysdata permission-panel/API saves can
reset SQL-managed grants: rerun access inventory after any relevant permission change.

## Staging hostname and production

Canonical staging is https://staging-tekaedu.tootiye.com. Public resolvers 1.1.1.1 and 8.8.8.8
return Cloudflare proxy addresses; certificate-verified HTTPS passes and returns HTTP 502.
Origin readiness is pending. The old dotted hostname is obsolete; historical failure evidence
is retained. Updated active references: migration audit/runbook, deployment/setup/env docs,
README, CLI target, tests and active task. Existing `STAGING_DOMAIN` stays on the operational
Vercel staging alias. No DNS, cache, certificate, runtime command or production setting changed.

PROD database writes: 0. PROD deployments: 0. Vercel retirement: NO. Supabase retirement: NO.

## Remaining authorized boundary

After explicit operator rollback approval and all CI gates, recheck empty DEV, use the
verified runner to apply only `congofoot_teka_edu_dev`, verify 36 / 6,170 values and every
integrity/access/idempotency guarantee, and preserve separate managed evidence. Stop if any
required managed capability/identity/security check fails. Do not change site runtime.

Only after that acceptance, recommend a separately authorized next phase to build the Linux
standalone artifact and deploy the frozen candidate to Alwaysdata staging. Current Cloudflare
502 is a later deployment prerequisite; no app deployment or provider retirement is authorized
by this portability phase.

POSTGRESQL 16 PORTABILITY STATUS: BLOCKED
