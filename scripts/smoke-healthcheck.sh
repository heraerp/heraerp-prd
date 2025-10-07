#!/usr/bin/env bash
set -euo pipefail
URL="${1:-http://127.0.0.1:${PORT:-3000}}/api/healthz"
code=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
if [ "$code" != "200" ]; then
  echo "Healthcheck failed with HTTP $code at $URL"
  exit 1
fi
echo "Healthcheck OK"

