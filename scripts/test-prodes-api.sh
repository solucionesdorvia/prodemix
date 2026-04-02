#!/usr/bin/env bash
# Manual smoke tests (run dev server: npm run dev).
# Usage: BASE=http://localhost:3000 ./scripts/test-prodes-api.sh
set -euo pipefail
BASE="${BASE:-http://localhost:3000}"

echo "== GET /api/prodes (default + limit) =="
curl -sS "${BASE}/api/prodes" | head -c 400
echo -e "\n..."
curl -sS "${BASE}/api/prodes?limit=5" | head -c 400
echo -e "\n"

echo "== GET /api/prodes/[id] (replace PRODE_ID with a real id from list) =="
PRODE_ID="${PRODE_ID:-pool-afa-premio-a-md-03}"
curl -sS "${BASE}/api/prodes/${PRODE_ID}" | head -c 500
echo -e "\n"

echo "== GET /api/prodes/[id]/matches =="
curl -sS "${BASE}/api/prodes/${PRODE_ID}/matches" | head -c 500
echo -e "\n"

echo "== GET /api/prodes/[id]/ranking =="
curl -sS "${BASE}/api/prodes/${PRODE_ID}/ranking" | head -c 500
echo -e "\n"

echo "== GET /api/me/prodes (needs session cookie) =="
curl -sS "${BASE}/api/me/prodes" | head -c 200
echo -e "\n"

echo "== POST /api/prodes/[id]/predictions (needs auth + join + body) — example only =="
echo 'curl -X POST -H "Content-Type: application/json" -d '"'"'{"predictions":[{"matchId":"MATCH_ID","predictedHomeScore":1,"predictedAwayScore":1}]}'"'"' "'"${BASE}/api/prodes/${PRODE_ID}/predictions"'"'
