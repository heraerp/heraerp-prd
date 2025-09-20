#!/bin/bash

# SALON CANARY SMOKE TEST
# Quick manual smoke test with idempotency verification

# Hair Talkz organization ID
ORG_ID="0fd09e31-d257-4329-97eb-7d7f522ed6f0"

# You'll need to replace this with an actual cart ID after creating one
CART_ID="${1:-REPLACE_WITH_ACTUAL_CART_ID}"

if [ "$CART_ID" = "REPLACE_WITH_ACTUAL_CART_ID" ]; then
    echo "❌ Please provide a cart ID as first argument"
    echo "Usage: $0 <cart_id>"
    exit 1
fi

echo "🚀 SALON CANARY SMOKE TEST"
echo "========================="
echo "Organization: Hair Talkz ($ORG_ID)"
echo "Cart ID: $CART_ID"
echo ""

# Generate idempotency key
export IDEM=$(printf 'add-%s-%s' "$CART_ID" "$(date +%s)" | shasum -a 256 | cut -d' ' -f1)
echo "Idempotency Key: $IDEM"
echo ""

# Test 1: Add a service line (playbook path)
echo "📍 TEST 1: Adding service line..."
RESPONSE1=$(curl -s -X POST "http://localhost:3000/api/v1/salon/pos/carts/$CART_ID/lines" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEM" \
  -H "X-Organization-ID: $ORG_ID" \
  -d '{
        "organization_id":"'$ORG_ID'",
        "line_type":"SERVICE",
        "entity_id":"svc_haircut",
        "quantity":1,
        "metadata":{"source":"MANUAL"}
      }')

echo "Response: $RESPONSE1"
echo ""

# Test 2: Reprice cart
echo "📍 TEST 2: Repricing cart..."
REPRICE_IDEM="rp-$IDEM"
RESPONSE2=$(curl -s -X POST "http://localhost:3000/api/v1/salon/pos/carts/$CART_ID/reprice" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $REPRICE_IDEM" \
  -H "X-Organization-ID: $ORG_ID" \
  -H "X-Correlation-ID: SMOKE-TEST-$(date +%s)" \
  -d '{"organization_id":"'$ORG_ID'"}')

echo "Response: $RESPONSE2"
echo ""

# Extract playbook mode header (if using httpie or similar, you'd see headers)
echo "✅ Check for X-Playbook-Mode: true in response headers"
echo ""

# Test 3: Try duplicate add with SAME idempotency key
echo "📍 TEST 3: Testing idempotency (duplicate request)..."
RESPONSE3=$(curl -s -X POST "http://localhost:3000/api/v1/salon/pos/carts/$CART_ID/lines" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEM" \
  -H "X-Organization-ID: $ORG_ID" \
  -d '{"organization_id":"'$ORG_ID'","line_type":"SERVICE","entity_id":"svc_haircut","quantity":1}')

echo "Response: $RESPONSE3"
echo ""

echo "🔍 VERIFICATION:"
echo "1. First and third responses should be identical (idempotency working)"
echo "2. Reprice should show updated totals"
echo "3. Database should have exactly ONE line item (not two)"
echo ""
echo "Run this query to verify:"
echo "SELECT COUNT(*) FROM universal_transaction_lines WHERE transaction_id = '$CART_ID';"