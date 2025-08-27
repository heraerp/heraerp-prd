#!/bin/bash

echo "🧪 WhatsApp Webhook Testing Script"
echo "=================================="
echo ""

# Configuration
WEBHOOK_URL=${1:-"https://heraerp.com/api/v1/whatsapp/webhook"}
VERIFY_TOKEN="hera-whatsapp-webhook-2024-secure-token"

echo "Testing webhook at: $WEBHOOK_URL"
echo ""

# Test 1: Webhook Verification
echo "1. Testing webhook verification..."
VERIFY_URL="${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test_challenge_123"
VERIFY_RESPONSE=$(curl -s -X GET "$VERIFY_URL")
echo "Response: $VERIFY_RESPONSE"

if [ "$VERIFY_RESPONSE" == "test_challenge_123" ]; then
    echo "✅ Webhook verification successful"
else
    echo "❌ Webhook verification failed"
fi
echo ""

# Test 2: Send Test Message
echo "2. Sending test message..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d @test-message.json \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "3. Check results:"
echo "   - Debug API: curl https://heraerp.com/api/v1/whatsapp/debug-dashboard | jq"
echo "   - Dashboard: https://heraerp.com/salon/whatsapp (requires login)"
echo "   - Storage test: curl https://heraerp.com/api/v1/whatsapp/test-store"