# Alwaysdata production application preparation

This is an offline implementation and an owner-operated future procedure. No production database connection, application upload, restart, provider setting change, or backup validation is established by this document or by fixture tests. A successful application deployment requires separate completed production database verification and recovery evidence.

## Fixed application targets

| Target     | Site    | Root                                  | Public URL                            |
| ---------- | ------- | ------------------------------------- | ------------------------------------- |
| Staging    | 1083502 | `/home/congofoot/www/tekaedu-staging` | `https://staging-tekaedu.tootiye.com` |
| Production | 1083500 | `/home/congofoot/www/tekaedu-prod`    | `https://tekaedu.tootiye.com`         |

Both sites share the `congofoot` Unix account. Separate roots and credentials prevent
accidental routing, but do not create Unix-account security isolation. No permission or
account restructuring is proposed.

Both sites use Node 22 and the command `/usr/alwaysdata/nodejs/22/bin/node current/runtime.mjs`. The tools accept only these two identities. Existing package, site, remote, verification, and deployment commands default to staging. Existing staging and Vercel workflows remain unchanged.

Production serves release-bundled content. Its runtime derives `NEXT_PUBLIC_APP_ENV=production`, the fixed production URL, and the exact commit from checksummed release metadata. It disables cloud sync and rejects PostgreSQL or Supabase runtime configuration. `/api/health` must report `status=ok`, `environment=production`, the exact release SHA, and `supabaseProjectRef=null`. The database receipt is a deployment prerequisite; it does not give the application a runtime database connection.

## Owner prerequisites before any future activation

1. Promote the reviewed implementation and intended release through normal CI to `main`. The release SHA must be the exact 40-character lowercase SHA of the selected `main` workflow run.
2. Complete source recovery, target rollback, production target classification, migration execution, and final verification through the separate explicit production database CLI procedure. Unknown existing objects or access grants must be resolved before writes. An empty visible relation inventory alone is insufficient evidence of a safe empty target.
3. Use the production `verify` command's protected `--output` file as the receipt. The CLI must have actually verified the matching release and the frozen 46-migration chain. Do not create or edit a successful receipt by hand or substitute any fixture.
4. Retain the verified original source archive and its matching copy on independent physical storage, verified source restore evidence, and the protected target rollback snapshot. The verification receipt contains only aggregate identities, counts, gate results, and their checksums.
5. Keep the verified production database quiescent between final verification and application deployment. A receipt expires after 24 hours and must never have a future timestamp. Reverify when it expires or when database state changes.
6. Verify required reviewers and `main` deployment branch protection on GitHub's `production` environment. The workflow declares that environment; it does not configure its protection.

Only after those checks and separate owner authorization, provide these future settings. This preparation does not set them:

| Setting                                                                            | Scope and purpose                                                                                                              |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `ALWAYSDATA_PRODUCTION_DEPLOY_ENABLED`                                             | Repository variable, unset/false until explicitly armed as `true`                                                              |
| `ALWAYSDATA_SSH_HOST`, `ALWAYSDATA_SSH_PORT`, `ALWAYSDATA_SSH_USER`                | Repository variables, exactly `ssh-congofoot.alwaysdata.net`, `22`, `congofoot`                                                |
| `ALWAYSDATA_PRODUCTION_DB_VERIFICATION`                                            | Protected production environment secret containing the exact bytes of the completed verification receipt                       |
| `ALWAYSDATA_SSH_PRIVATE_KEY`, `ALWAYSDATA_SSH_KNOWN_HOSTS`, `ALWAYSDATA_API_TOKEN` | Protected production environment application deployment credentials with the intended SSH host pin and site restart permission |

The application job receives no database password, connection URL, Supabase token, or database migration tool. The completed verification receipt is aggregate evidence, not a database credential. Keep `PRODUCTION_DEPLOY_ENABLED=false`; it controls the legacy Vercel workflow and is unrelated to the new opt-in. Preserve the other existing deployment switches in their agreed states.

## Manual release

Run **Deploy alwaysdata production** using the `main` branch. Supply:

- `release_sha`: the exact reviewed SHA matching this workflow run's `github.sha`.
- `owner_confirmation`: `DEPLOY ` followed by that same SHA.
- `quiescence_confirmed`: `true` only after the owner confirms the verified target remains quiescent.
- `db_verification_sha256`: SHA256 of the exact bytes placed in `ALWAYSDATA_PRODUCTION_DB_VERIFICATION`, including any terminal newline. Preserve the CLI file bytes when supplying the secret.

The workflow has no push trigger. It runs normal CI, builds and packages a production Linux artifact without production credentials, boots the immutable payload under Node 22, and verifies exact health identity and public media. It consumes the protected receipt only in the production environment. Receipt validation occurs before provider credentials are exposed and is repeated before any provider call.

The receipt requires matching `production` target and release SHA; PostgreSQL 16 with TLS on `congofoot_teka_edu_prod` as `congofoot_user_teka_edu_prod`; all 46 history entries with zero pending; 36 canonical tables and 6170 exact rows; the baseline schema comparison; access, integrity, and idempotency gates; matching original/independent source archive checksums with verified source restore; and a target snapshot checksum. Failed or absent gates stop application deployment.

The application installer validates site 1083500, the fixed directory, address, command, Node version, and absence of database/Supabase/Vercel site environment assignments. It checks the previous current pointer and payload, checksums the archive, installs an immutable release, and atomically switches `current` while retaining a previous distinct release. The restart helper issues one restart POST after a validated GET. A failed or ambiguous POST is not retried automatically.

Strict production health and smoke tests, including the anonymous public production checks, must pass. Uploaded application evidence records the artifact and database receipt checksums, the release SHA, previous release identity, and rollback status. The protected receipt itself is not printed or uploaded with the application evidence.

## Failure and application rollback

Stop after an unconfirmed restart or failed health/smoke check. Inspect the current pointer, validated artifact, provider state, and public health before authorizing another mutation. The deployment performs no automatic pointer recovery or SQL reversal.

A healthy first production release is valid with `rollback=NOT PROVED`. The workflow does not create a second release or cycle live production through old/new releases solely to prove rollback. Having a validated previous release available is distinct from having performed a live rollback.

For a separately owner-authorized application rollback, verify the retained previous SHA and its production manifest/checksums, then use `remote.py switch --target production --sha <previous-full-SHA>` on the fixed production root. Restart only site 1083500 using the same exact-site GET/one-POST helper, and require strict production health for the previous SHA plus public smoke checks. Record the resulting evidence separately. These operations do not roll back database migrations. With no valid previous application release, stop for an owner-approved recovery plan.
