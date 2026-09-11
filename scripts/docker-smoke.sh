#!/usr/bin/env bash
# Smoke-tests a built image: starts it, waits for /api/health, then checks it stops
# gracefully on SIGTERM (docker stop) instead of being killed.
#
#   scripts/docker-smoke.sh <image> [host-port]
set -euo pipefail

image="${1:?usage: scripts/docker-smoke.sh <image> [host-port]}"
port="${2:-3099}"
name="teka-edu-smoke-$$"

cleanup() { docker rm -f "$name" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run -d --name "$name" -p "127.0.0.1:${port}:3000" "$image" >/dev/null

body=""
for _ in $(seq 1 30); do
  if body="$(curl -fsS "http://127.0.0.1:${port}/api/health" 2>/dev/null)"; then break; fi
  sleep 1
done

if [[ "$body" != *'"status":"ok"'* ]]; then
  echo "Health check failed for ${image}. Container logs:" >&2
  docker logs "$name" >&2 || true
  exit 1
fi
echo "Health OK (${image}): ${body}"

docker stop --time 20 "$name" >/dev/null
exit_code="$(docker inspect -f '{{.State.ExitCode}}' "$name")"
if [[ "$exit_code" == "137" ]]; then
  echo "Container ignored SIGTERM and was killed (exit 137)." >&2
  exit 1
fi
echo "Stopped gracefully on SIGTERM (exit ${exit_code})."
