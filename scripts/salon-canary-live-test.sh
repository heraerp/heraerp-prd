#!/bin/bash

# SALON CANARY LIVE TEST - Creates real cart and runs smoke test

echo "🚀 HAIR TALKZ CANARY - LIVE CART TEST"
echo "===================================="
echo "Time: $(date)"
echo ""

# Hair Talkz organization ID
export ORG_ID="0fd09e31-d257-4329-97eb-7d7f522ed6f0"
export IDEM="cart-$(date +%s%N)"

echo "📍 STEP 1: Creating appointment and cart for Hair Talkz..."
echo "Organization ID: $ORG_ID"

# First, create a real appointment
APPT_IDEM="appt-$(date +%s)"
echo "Creating appointment with idempotency key: $APPT_IDEM"

APPOINTMENT_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/v1/salon/appointments" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $APPT_IDEM" \
    -H "X-Organization-ID: $ORG_ID" \
    -d '{
        "organizationId":"'"$ORG_ID"'",
        "clientName":"Test Customer",
        "clientPhone":"+971501234567",
        "clientEmail":"test@example.com",
        "serviceName":"Hair Cut",
        "servicePrice":50,
        "stylistName":"Test Stylist",
        "date":"'"$(date +%Y-%m-%d)"'",
        "time":"'"$(date +%H:%M)"'",
        "duration":30
    }')

echo "Appointment Response: $APPOINTMENT_RESPONSE"

# Extract appointment ID
APPOINTMENT_ID=$(echo "$APPOINTMENT_RESPONSE" | jq -r '.appointment.id // .data.id // .id // empty')

if [ -z "$APPOINTMENT_ID" ] || [ "$APPOINTMENT_ID" = "null" ]; then
    echo "❌ Failed to create appointment"
    echo "Full response: $APPOINTMENT_RESPONSE"
    exit 1
fi

echo "✅ Appointment created: $APPOINTMENT_ID"
echo ""
echo "📍 STEP 2: Creating cart for appointment..."
echo "Idempotency Key: $IDEM"

# Create cart with real appointment ID
CART_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/v1/salon/pos/carts" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $IDEM" \
    -H "X-Organization-ID: $ORG_ID" \
    -d '{"organization_id":"'"$ORG_ID"'","appointment_id":"'"$APPOINTMENT_ID"'","smart_code":"HERA.SALON.POS.CART.ACTIVE.V1"}')

echo "Response: $CART_RESPONSE"

# Extract cart ID - try different JSON paths
CART_ID=$(echo "$CART_RESPONSE" | jq -r '.cart.id // .data.id // .id // empty')

if [ -z "$CART_ID" ] || [ "$CART_ID" = "null" ]; then
    echo "❌ Failed to create cart or extract ID"
    echo "Full response: $CART_RESPONSE"
    exit 1
fi

echo ""
echo "✅ Cart created successfully!"
echo "CART_ID=$CART_ID"
echo ""

# Save cart ID for future use
echo "$CART_ID" > /tmp/hair_talkz_test_cart_id

echo "📍 STEP 3: Running smoke test with cart $CART_ID..."
echo "=========================================="

# Run the smoke test
./scripts/salon-canary-smoke-test.sh "$CART_ID"

echo ""
echo "📍 STEP 4: Running quick check SQL..."
echo "===================================="

# Run the quick check (if psql is available)
if command -v psql &> /dev/null; then
    psql -f scripts/salon-canary-quick-check.sql
else
    echo "⚠️  psql not found - run manually: psql -f scripts/salon-canary-quick-check.sql"
fi

echo ""
echo "📊 ADDITIONAL VERIFICATIONS:"
echo ""

# Verification A: Check playbook execution
echo "A. Checking for playbook executions..."
if command -v psql &> /dev/null; then
    psql -c "
    SELECT COUNT(*) as playbook_executions
    FROM universal_transactions 
    WHERE organization_id = '$ORG_ID'
        AND smart_code = 'HERA.SALON.POS.CART.REPRICE.V1'
        AND created_at >= NOW() - INTERVAL '5 minutes';"
fi

# Verification B: Idempotency check
echo ""
echo "B. Checking idempotency (no duplicates expected)..."
if command -v psql &> /dev/null; then
    psql -c "
    SELECT metadata->>'idempotency_key' as idempotency_key, COUNT(*) 
    FROM universal_transaction_lines 
    WHERE transaction_id = '$CART_ID'
    GROUP BY 1 
    HAVING COUNT(*) > 1;"
fi

# Verification C: Smart code normalization
echo ""
echo "C. Checking smart code format (all should be .V1)..."
if command -v psql &> /dev/null; then
    psql -c "
    SELECT DISTINCT smart_code 
    FROM universal_transaction_lines 
    WHERE transaction_id = '$CART_ID' 
        AND smart_code ~ '\.v[0-9]+$';"
fi

echo ""
echo "✅ LIVE TEST COMPLETE!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Monitor dashboard: http://localhost:3000/dashboards/hair-talkz-workflows"
echo "2. Check metrics every 15 minutes for first hour"
echo "3. If any metric goes red: npm run salon:canary:rollback"
echo ""
echo "Cart ID saved to: /tmp/hair_talkz_test_cart_id"
echo "You can use it for additional tests: $(cat /tmp/hair_talkz_test_cart_id)"