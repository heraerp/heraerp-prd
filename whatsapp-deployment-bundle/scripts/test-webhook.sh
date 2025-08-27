#!/bin/bash
# Test WhatsApp Webhook Endpoint

echo "🧪 Testing WhatsApp Webhook..."
echo "=============================="

# Your production URL
WEBHOOK_URL="https://api.heraerp.com/api/v1/whatsapp/webhook"
VERIFY_TOKEN="hera-whatsapp-webhook-2024-secure-token"

# Test 1: Verification Test
echo -e "\n1️⃣ Testing webhook verification..."
RESPONSE=$(curl -s -w "\n%{http_code}" "${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test123")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] && [ "$BODY" = "test123" ]; then
    echo "✅ Webhook verification: PASSED"
else
    echo "❌ Webhook verification: FAILED"
    echo "   HTTP Code: $HTTP_CODE"
    echo "   Response: $BODY"
fi

# Test 2: Health Check
echo -e "\n2️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "https://api.heraerp.com/api/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HEALTH_CODE" = "200" ]; then
    echo "✅ Health check: PASSED"
    echo "   Response: $HEALTH_BODY"
else
    echo "❌ Health check: FAILED"
    echo "   HTTP Code: $HEALTH_CODE"
fi

# Test 3: Webhook POST Test
echo -e "\n3️⃣ Testing webhook POST (simulated message)..."
POST_DATA='{
  "entry": [{
    "id": "ENTRY_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "messages": [{
          "from": "919876543210",
          "id": "test_message_123",
          "timestamp": "'$(date +%s)'",
          "text": {
            "body": "Test webhook message"
          },
          "type": "text"
        }]
      }
    }]
  }]
}'

POST_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d "$POST_DATA")
POST_CODE=$(echo "$POST_RESPONSE" | tail -n1)
POST_BODY=$(echo "$POST_RESPONSE" | head -n-1)

if [ "$POST_CODE" = "200" ]; then
    echo "✅ Webhook POST: PASSED"
else
    echo "❌ Webhook POST: FAILED"
    echo "   HTTP Code: $POST_CODE"
    echo "   Response: $POST_BODY"
fi

# Summary
echo -e "\n📊 Test Summary"
echo "==============="
echo "Webhook URL: $WEBHOOK_URL"
echo "Verify Token: $VERIFY_TOKEN"
echo ""
echo "If all tests passed, your webhook is ready!"
echo "Next step: Configure in Meta Business Manager"