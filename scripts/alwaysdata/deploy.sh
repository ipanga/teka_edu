#!/usr/bin/env bash
# Runs only in a protected environment after CI. Credentials are never arguments/log output.
set -euo pipefail
case "${1:-staging}" in
  staging) ;;
  production)
    # Validate the completed database/recovery receipt locally, before any provider call.
    node --input-type=module - "$PRODUCTION_DB_GATE_FILE" <<'JS'
import { assertProductionDeploymentConfig, readProductionDatabaseGate } from './scripts/alwaysdata/preflight.mjs';
assertProductionDeploymentConfig(process.env);
readProductionDatabaseGate(process.argv[2], process.env.PRODUCTION_DB_GATE_SHA256, process.env.GITHUB_SHA);
JS
    [[ "$(git rev-parse HEAD)" == "$GITHUB_SHA" ]]
    for name in ALWAYSDATA_SSH_PRIVATE_KEY ALWAYSDATA_SSH_KNOWN_HOSTS ALWAYSDATA_API_TOKEN; do
      [[ -n "${!name:-}" ]] || { echo "Missing production app secret: $name" >&2; exit 1; }
    done
    checksum="$(node --input-type=module - "$ARTIFACT_DIR/artifact.json" "$ARTIFACT_DIR/release.tar.gz" <<'JS'
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const artifact = JSON.parse(fs.readFileSync(process.argv[2]));
if (artifact.sha !== process.env.GITHUB_SHA || !/^[a-f0-9]{64}$/.test(artifact.sha256) || createHash('sha256').update(fs.readFileSync(process.argv[3])).digest('hex') !== artifact.sha256) throw Error('Production artifact identity/checksum invalid');
console.log(artifact.sha256);
JS
    )"
    secret_dir="$(mktemp -d)"
    trap 'rm -rf "$secret_dir"' EXIT
    chmod 700 "$secret_dir"
    printf '%s\n' "$ALWAYSDATA_SSH_PRIVATE_KEY" > "$secret_dir/key"
    printf '%s\n' "$ALWAYSDATA_SSH_KNOWN_HOSTS" > "$secret_dir/known_hosts"
    chmod 600 "$secret_dir/key" "$secret_dir/known_hosts"
    unset ALWAYSDATA_SSH_PRIVATE_KEY ALWAYSDATA_SSH_KNOWN_HOSTS
    ssh-keygen -y -P '' -f "$secret_dir/key" > /dev/null 2> /dev/null
    ssh-keygen -F ssh-congofoot.alwaysdata.net -f "$secret_dir/known_hosts" > "$secret_dir/matched_known_hosts" 2> /dev/null
    ssh-keygen -l -f "$secret_dir/matched_known_hosts" > /dev/null 2> /dev/null
    remote=congofoot@ssh-congofoot.alwaysdata.net
    ssh_args=(-i "$secret_dir/key" -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$secret_dir/known_hosts" -p 22)
    scp_args=(-i "$secret_dir/key" -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$secret_dir/known_hosts" -P 22)
    admin="/home/congofoot/admin/tmp/teka-prod-cd-$GITHUB_SHA"
    node scripts/alwaysdata/site.mjs inspect --target production
    # The app path receives only SSH/API credentials; no SQL tool or DB secret is transferred.
    ssh "${ssh_args[@]}" "$remote" '/usr/alwaysdata/nodejs/22/bin/node -e '\''if(Number(process.versions.node.split(".")[0])!==22)process.exit(1)'\'''
    ssh "${ssh_args[@]}" "$remote" "umask 077; mkdir -p '$admin'"
    scp "${scp_args[@]}" scripts/alwaysdata/remote.py "$ARTIFACT_DIR/release.tar.gz" "$remote:$admin/"
    old_sha="$(ssh "${ssh_args[@]}" "$remote" "python3 '$admin/remote.py' inspect --target production" | node --input-type=module -e 'let s="";for await(const b of process.stdin)s+=b;const value=JSON.parse(s).sha;if(value!==null&&!/^[a-f0-9]{40}$/.test(value))throw Error("Previous production identity invalid");console.log(value??"")')"
    if [[ -n "$old_sha" ]]; then
      node scripts/alwaysdata/site.mjs health "$old_sha" --target production
    fi
    ssh "${ssh_args[@]}" "$remote" "python3 '$admin/remote.py' install --target production --sha '$GITHUB_SHA' --checksum '$checksum' --archive '$admin/release.tar.gz'"
    ssh "${ssh_args[@]}" "$remote" "python3 '$admin/remote.py' switch --target production --sha '$GITHUB_SHA'"
    node scripts/alwaysdata/site.mjs restart --target production
    node scripts/alwaysdata/site.mjs health "$GITHUB_SHA" --target production
    EXPECTED_GIT_SHA="$GITHUB_SHA" EXPECTED_APP_ENV=production EXPECTED_INFRA_PROVIDER=alwaysdata PLAYWRIGHT_BASE_URL=https://tekaedu.tootiye.com PRODUCTION_PUBLIC_URL=https://tekaedu.tootiye.com npm run test:e2e
    mkdir -p "$EVIDENCE_DIR"
    # A previous validated artifact is retained, but no live rollback exercise is forced.
    TEKA_PREVIOUS_SHA="$old_sha" TEKA_ARTIFACT_SHA256="$checksum" node --input-type=module - "$EVIDENCE_DIR/application-release.json" <<'JS'
import fs from 'node:fs';
fs.writeFileSync(process.argv[2], JSON.stringify({target:'production',site_id:1083500,status:'PASS',commit:process.env.GITHUB_SHA,artifact_sha256:process.env.TEKA_ARTIFACT_SHA256,db_verification_sha256:process.env.PRODUCTION_DB_GATE_SHA256,previous:process.env.TEKA_PREVIOUS_SHA||null,rollback:'NOT PROVED'},null,2)+'\n');
JS
    printf '{"status":"NOT PROVED","reason":"Production rollback requires a separate owner-authorized application operation; healthy first release is valid"}\n' > "$EVIDENCE_DIR/application-rollback.json"
    echo 'PASS: healthy production application release; rollback NOT PROVED'
    exit 0
    ;;
  *) echo 'Application target must be staging or production' >&2; exit 1 ;;
esac
[[ "${GITHUB_REF:-}" == refs/heads/develop && "${ALWAYSDATA_STAGING_DEPLOY_ENABLED:-}" == true ]]
[[ "${ALWAYSDATA_DEV_MIGRATIONS_APPROVED:-}" == true ]]
[[ "${ALWAYSDATA_SSH_HOST:-}" == ssh-congofoot.alwaysdata.net && "${ALWAYSDATA_SSH_PORT:-}" == 22 && "${ALWAYSDATA_SSH_USER:-}" == congofoot ]]
for name in ALWAYSDATA_SSH_PRIVATE_KEY ALWAYSDATA_SSH_KNOWN_HOSTS ALWAYSDATA_API_TOKEN PGPASSWORD; do
  [[ -n "${!name:-}" ]] || { echo "Missing staging secret: $name" >&2; exit 1; }
done
[[ "$GITHUB_SHA" =~ ^[a-f0-9]{40}$ ]]
secret_dir="$(mktemp -d)"
trap 'rm -rf "$secret_dir"' EXIT
chmod 700 "$secret_dir"
printf '%s\n' "$ALWAYSDATA_SSH_PRIVATE_KEY" > "$secret_dir/key"
printf '%s\n' "$ALWAYSDATA_SSH_KNOWN_HOSTS" > "$secret_dir/known_hosts"
chmod 600 "$secret_dir/key" "$secret_dir/known_hosts"
unset ALWAYSDATA_SSH_PRIVATE_KEY ALWAYSDATA_SSH_KNOWN_HOSTS
remote=congofoot@ssh-congofoot.alwaysdata.net
ssh_args=(-i "$secret_dir/key" -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$secret_dir/known_hosts" -p 22)
scp_args=(-i "$secret_dir/key" -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$secret_dir/known_hosts" -P 22)
admin="/home/congofoot/admin/tmp/teka-cd-$GITHUB_SHA"
# GET validates exact Node site1083502, hostname, command, directory/version, no runtime SQL.
node scripts/alwaysdata/site.mjs inspect
ssh "${ssh_args[@]}" "$remote" "umask 077; mkdir -p '$admin'"
node_modules/.bin/esbuild scripts/alwaysdata/db-stage.mjs --bundle --platform=node --format=esm --outfile="$secret_dir/db.mjs"
cp "$REPLAY_DIR/postgres16-replay.json" "$secret_dir/replay.json"
cp docs/migration/alwaysdata/dev-rollback-record.json "$secret_dir/rollback.json"
# Preserve exact source bytes required by tooling digest; no Mac metadata and no credential files.
python3 - "$secret_dir/tools.tar.gz" <<'PY'
import pathlib,sys,tarfile
files=['lib/postgres','scripts/postgres','scripts/postgres-migrate.ts','lib/content/reference-data.ts','lib/supabase/reference-sql.ts','docs/migration/alwaysdata/migration-audit.json','docs/migration/alwaysdata/canonical-sha256.json','docs/migration/alwaysdata/expected-schema.json','supabase/migrations','supabase/tests/database']
with tarfile.open(sys.argv[1],'w:gz') as a:
    for f in files: a.add(f,arcname=f)
PY
scp "${scp_args[@]}" "$secret_dir/db.mjs" "$secret_dir/replay.json" "$secret_dir/rollback.json" "$secret_dir/tools.tar.gz" "$remote:$admin/"
ssh "${ssh_args[@]}" "$remote" "umask 077; tar -xzf '$admin/tools.tar.gz' -C '$admin'; rm '$admin/tools.tar.gz'"
printf '%s\n' "$PGPASSWORD" | ssh "${ssh_args[@]}" "$remote" "read -r PGPASSWORD; export PGPASSWORD; export PGHOST=postgresql-congofoot.alwaysdata.net PGPORT=5432 PGDATABASE=congofoot_teka_edu_dev PGUSER=congofoot_user_teka_edu_dev PGSSLMODE=verify-full PGSSLROOTCERT=/etc/ssl/certs/ca-certificates.crt TEKA_POSTGRES_ROOT='$admin' TEKA_RELEASE_SHA='$GITHUB_SHA' ALWAYSDATA_DEV_MIGRATIONS_APPROVED=true; /usr/alwaysdata/nodejs/22/bin/node '$admin/db.mjs'"
unset PGPASSWORD
mkdir -p "$EVIDENCE_DIR"
scp "${scp_args[@]}" "$remote:$admin/managed-verification.json" "$EVIDENCE_DIR/"
# Provider runtime version is checked independently of panel metadata.
ssh "${ssh_args[@]}" "$remote" '/usr/alwaysdata/nodejs/22/bin/node -e '\''if(Number(process.versions.node.split(".")[0])!==22)process.exit(1)'\'''
checksum="$(node --input-type=module -e 'import fs from "node:fs";let x=JSON.parse(fs.readFileSync(process.argv[1]));if(x.sha!==process.env.GITHUB_SHA||!/^[a-f0-9]{64}$/.test(x.sha256))throw Error("artifact identity");console.log(x.sha256)' "$ARTIFACT_DIR/artifact.json")"
scp "${scp_args[@]}" scripts/alwaysdata/remote.py "$ARTIFACT_DIR/release.tar.gz" "$remote:$admin/"
ssh "${ssh_args[@]}" "$remote" "python3 '$admin/remote.py' install --sha '$GITHUB_SHA' --checksum '$checksum' --archive '$admin/release.tar.gz'"
# Record previous validated release. Fail before changing current if it cannot be identified.
old_sha="$(ssh "${ssh_args[@]}" "$remote" 'if [ -L /home/congofoot/www/tekaedu-staging/current ]; then basename "$(readlink -f /home/congofoot/www/tekaedu-staging/current)"; fi')"
if [[ -n "$old_sha" ]]; then
  [[ "$old_sha" =~ ^[a-f0-9]{40}$ ]]
  node scripts/alwaysdata/site.mjs health "$old_sha"
fi
ssh "${ssh_args[@]}" "$remote" "python3 '$admin/remote.py' switch --sha '$GITHUB_SHA'"
node scripts/alwaysdata/site.mjs restart
node scripts/alwaysdata/site.mjs health "$GITHUB_SHA"
EXPECTED_GIT_SHA="$GITHUB_SHA" EXPECTED_APP_ENV=staging EXPECTED_INFRA_PROVIDER=alwaysdata PLAYWRIGHT_BASE_URL=https://staging-tekaedu.tootiye.com npm run test:e2e
if [[ -n "$old_sha" && "$old_sha" != "$GITHUB_SHA" ]]; then
  # Explicit application rollback proof; database migrations are never reversed.
  ssh "${ssh_args[@]}" "$remote" "python3 '$admin/remote.py' switch --sha '$old_sha'"
  node scripts/alwaysdata/site.mjs restart
  node scripts/alwaysdata/site.mjs health "$old_sha"
  ssh "${ssh_args[@]}" "$remote" "python3 '$admin/remote.py' switch --sha '$GITHUB_SHA'"
  node scripts/alwaysdata/site.mjs restart
  node scripts/alwaysdata/site.mjs health "$GITHUB_SHA"
  printf '{"status":"PASS","from":"%s","to":"%s","final":"%s"}\n' "$GITHUB_SHA" "$old_sha" "$GITHUB_SHA" > "$EVIDENCE_DIR/application-rollback.json"
else
  printf '{"status":"NOT PROVED","reason":"First release or same release; a second distinct reviewed develop release is required"}\n' > "$EVIDENCE_DIR/application-rollback.json"
  echo 'Staging installed; acceptance incomplete until two-release rollback proof' >&2
  exit 1
fi
