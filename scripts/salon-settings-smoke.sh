#!/usr/bin/env bash
BASE="http://localhost:3000"
ORG="0fd09e31-d257-4329-97eb-7d7f522ed6f0"

echo "🧪 Salon Settings Smoke Test"
echo "============================"

echo ""
echo "📖 GET settings (all sections)"
curl -s "$BASE/api/v1/salon/settings?organization_id=$ORG" | jq '.settings.sections.pos'

echo ""
echo "📝 PUT pos section (auto_reprice_debounce_ms)"
curl -s -X PUT "$BASE/api/v1/salon/settings/pos" \
 -H "Content-Type: application/json" \
 -H "Idempotency-Key: demo-$(date +%s%N)" \
 -d '{"organization_id":"'"$ORG"'","patch":{"auto_reprice_debounce_ms":220}}' | jq

echo ""
echo "📖 GET pos section only"
curl -s "$BASE/api/v1/salon/settings?organization_id=$ORG&section=pos" | jq '.settings.pos'

echo ""
echo "✅ Smoke test complete"