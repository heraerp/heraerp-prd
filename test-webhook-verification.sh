#!/bin/bash

# Test WhatsApp Webhook Verification
echo "Testing WhatsApp Webhook Verification..."
echo "========================================"

# Test with your actual domain
WEBHOOK_URL="https://api.heraerp.com/api/v1/whatsapp/webhook"
VERIFY_TOKEN="hera-whatsapp-webhook-2024-secure-token"
CHALLENGE="test_challenge_123"

echo "Testing: $WEBHOOK_URL"
echo ""

# Test the webhook verification
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=${CHALLENGE}")

echo "Response Code: $RESPONSE"

if [ "$RESPONSE" == "200" ]; then
    echo "✅ Webhook verification endpoint is working!"
    
    # Get the actual response
    FULL_RESPONSE=$(curl -s \
      "${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=${CHALLENGE}")
    
    echo "Response body: $FULL_RESPONSE"
    
    if [ "$FULL_RESPONSE" == "$CHALLENGE" ]; then
        echo "✅ Challenge returned correctly!"
    else
        echo "❌ Challenge not returned correctly"
    fi
else
    echo "❌ Webhook verification failed with status: $RESPONSE"
    
    # Get error details
    ERROR_RESPONSE=$(curl -s \
      "${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=${CHALLENGE}")
    
    echo "Error response: $ERROR_RESPONSE"
fi

echo ""
echo "Also testing without subdomain:"
WEBHOOK_URL2="https://heraerp.com/api/v1/whatsapp/webhook"
echo "Testing: $WEBHOOK_URL2"

RESPONSE2=$(curl -s -o /dev/null -w "%{http_code}" \
  "${WEBHOOK_URL2}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=${CHALLENGE}")

echo "Response Code: $RESPONSE2"

if [ "$RESPONSE2" == "200" ]; then
    echo "✅ Works on main domain"
else
    echo "❌ Not working on main domain"
fi