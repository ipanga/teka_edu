# PostgreSQL 16 portability verification report

Implementation is reviewable in [draft PR #100](https://github.com/ipanga/teka_edu/pull/100).
The database-only tooling and clean PostgreSQL 16 replay pass. Managed DEV has now been migrated under explicit owner authorization and passes every
required managed check; PostgreSQL portability status is COMPLETE.

## Git and scope

Branch `feature/alwaysdata-postgres-portability` starts at accepted main
`ac003f8580ca81dcfb426a70c45c02102b8e0551`. Implementation checkpoints are `bf83c3e`,
`a6d54f4`, `41e4a9c` and `35b7c3f`; they are pushed. The final documentation checkpoint
is recorded in the branch log. No merge is performed. Original historical SQL, canonical
content/media, app routes/domain/environment guards and Vercel deployment workflows are
unchanged. Docker excludes separate administrative tooling from application build/runtime.

## Clean PostgreSQL 16 replay

[Machine evidence](postgres16-replay.json) records exact tested checkout
`2315600fc0db4bfe67769afb2eb4727983c91bb6`, runner/source/execution hashes and timestamp.
[CI run](https://github.com/ipanga/teka_edu/actions/runs/37363307208) successfully replays
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

All applicable existing jobs and the added PostgreSQL check PASS at `2315600` in the
linked CI run. Promotion source is correctly skipped for a PR into develop. The final
documentation checkpoint is tracked separately in PR checks.
Local current quality: format/lint/typecheck, 546 unit tests and 31 content files PASS.
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

Explicit human approval for the protected DEV rollback coverage was recorded in
[rollback record](dev-rollback-record.json). All nine safeguards were rechecked immediately
before execution: exact database/login/16.15, verify-full TLS, PROD CONNECT denial, protected
snapshot mode/hash, empty application schema/history, exact reviewed runner/baseline/CI SHA,
green portability CI, frozen 46-file chain and no unexpected schema/object drift.
[Preflight](dev-preflight.json) and [drift evidence](dev-drift-preflight.json) preserve this state.

[Guarded apply](dev-apply.json) committed all 46 reviewed migrations in one transaction.
[History](dev-history.json) records 46 applied / zero pending. [Managed verification](managed-dev-verification.json)
is PASS: 36 canonical tables / 6,170 exact selected rows, full structural baseline equality,
213 columns / 247 constraints / 80 indexes / three triggers / two private functions,
required extensions, RLS/table/schema/function ACLs, PROD isolation, 77 original managed
assertions and zero-row canonical re-sync. No failure or reset occurred.

Managed pgTAP is unavailable; the reviewed equivalent assertions passed. CI additionally
ran all four portable pgTAP suites. This is the documented capability difference, with no
unexpected deviation from CI portability evidence.

The approved 1130-byte custom empty-state dump is protected with mode 0600 and SHA-256
`07bd94f2de13750d13e0c6a859c9eaa57306bf183bb450f468d12232f5ebb14d`.
Manifest/full extraction verification passed; no actual restore rehearsal is claimed.
[Rollback plan](dev-rollback-plan.md) remains the reference. Any post-commit reset requires
separate authorization; none was run. The latest provider backup does not contain this new
DB. Retain the protected dump and approval record.

## Canonical comparison and runtime

Expected 36 tables / 6,170 rows: clean CI PASS; managed Alwaysdata DEV PASS.
The preserved [earlier read-only audit](migration-audit.json) records Supabase DEV and PROD
all 36/6,170 selected values matching this unchanged canonical state. Those are earlier
observations, not fresh hosted queries during implementation.

The staging app root remains empty. No app/site/GitHub Environment values were written.
No production root inspection was needed during the approved DEV apply.
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

## Application boundary

DEV database acceptance is complete. The new [staging CD implementation](../../ALWAYSDATA_STAGING_CD.md)
adds Linux artifact builds, guarded immutable SSH releases, staging-only restart, strict
health, supported-device smoke and application rollback proof. Owner GitHub credentials,
site configuration and separately authorized first activation are pending. No application
has been deployed. Keep Vercel and hosted Supabase intact; no PROD operation is authorized.

POSTGRESQL 16 PORTABILITY STATUS: COMPLETE
