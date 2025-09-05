#!/bin/bash

# WhatsApp Business Integration Test Script
# Configuration
APP_ID="2572687829765505"
PHONE_NUMBER_ID="712631301940690"
WHATSAPP_BUSINESS_ACCOUNT_ID="1112225330318984"
ACCESS_TOKEN="EAAkj2JA2DYEBPQeZC1D0my0wZClW6uw3VBAANDpFzm6B7jr91bKJCnvhg9J2U0kAZAX3ZCJAek6K6NekOPXd5paBgN8Au3EOV0O6ob1pZChsDunIxxtAmr83MDSHXbMxA1hLo58zujSXPKhkZCyATNIZAa39i0l3h2PLRHJE2fzB5ZAz4UEaNwTH6fTOL6iUxAZDZD"
WEBHOOK_URL="https://heraerp.com/api/v1/whatsapp/webhook"
VERIFY_TOKEN="hera-whatsapp-webhook-2024-secure-token"

echo "🚀 WhatsApp Business Integration Test"
echo "====================================="
echo ""

# Test 1: Webhook Verification (GET request)
echo "📌 Test 1: Webhook Verification"
echo "Testing webhook verification endpoint..."
echo ""

VERIFY_URL="${WEBHOOK_URL}?hub.mode=subscribe&hub.challenge=test-challenge-123&hub.verify_token=${VERIFY_TOKEN}"

echo "curl -X GET \"$VERIFY_URL\""
curl -X GET "$VERIFY_URL" -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "-----------------------------------"
echo ""

# Test 2: Send a test text message
echo "📌 Test 2: Send Text Message"
echo "Sending test message via WhatsApp Business API..."
echo ""

# Replace with actual recipient phone number (without + sign)
RECIPIENT_PHONE="447515668004" # UK number

curl -X POST "https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "'${RECIPIENT_PHONE}'",
    "type": "text",
    "text": {
      "body": "Hello from HERA ERP! This is a test message from your WhatsApp Business integration."
    }
  }' \
  -w "\nHTTP Status: %{http_code}\n" | jq '.'

echo ""
echo "-----------------------------------"
echo ""

# Test 3: Send a template message (if you have approved templates)
echo "📌 Test 3: Send Template Message"
echo "Sending appointment reminder template..."
echo ""

curl -X POST "https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "'${RECIPIENT_PHONE}'",
    "type": "template",
    "template": {
      "name": "hello_world",
      "language": {
        "code": "en_US"
      }
    }
  }' \
  -w "\nHTTP Status: %{http_code}\n" | jq '.'

echo ""
echo "-----------------------------------"
echo ""

# Test 4: Simulate incoming webhook message
echo "📌 Test 4: Simulate Incoming Message Webhook"
echo "Sending test webhook payload to your endpoint..."
echo ""

curl -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "'${WHATSAPP_BUSINESS_ACCOUNT_ID}'",
        "changes": [
          {
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "971501234567",
                "phone_number_id": "'${PHONE_NUMBER_ID}'"
              },
              "contacts": [
                {
                  "profile": {
                    "name": "Test Customer"
                  },
                  "wa_id": "971501234567"
                }
              ],
              "messages": [
                {
                  "from": "971501234567",
                  "id": "wamid.TEST_MESSAGE_ID",
                  "timestamp": "'$(date +%s)'",
                  "text": {
                    "body": "Hello, I would like to book an appointment"
                  },
                  "type": "text"
                }
              ]
            },
            "field": "messages"
          }
        ]
      }
    ]
  }' \
  -w "\nHTTP Status: %{http_code}\n" | jq '.'

echo ""
echo "-----------------------------------"
echo ""

# Test 5: Get Business Phone Numbers
echo "📌 Test 5: Get Business Phone Numbers"
echo "Fetching phone numbers for the WhatsApp Business Account..."
echo ""

curl -X GET "https://graph.facebook.com/v21.0/${WHATSAPP_BUSINESS_ACCOUNT_ID}/phone_numbers" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -w "\nHTTP Status: %{http_code}\n" | jq '.'

echo ""
echo "-----------------------------------"
echo ""

# Test 6: Get Message Templates
echo "📌 Test 6: Get Message Templates"
echo "Fetching available message templates..."
echo ""

curl -X GET "https://graph.facebook.com/v21.0/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -w "\nHTTP Status: %{http_code}\n" | jq '.'

echo ""
echo "====================================="
echo "✅ WhatsApp Integration Tests Complete!"
echo ""
echo "Next Steps:"
echo "1. Update RECIPIENT_PHONE with actual test number"
echo "2. Update VERIFY_TOKEN with your webhook verify token"
echo "3. Check webhook logs at your server"
echo "4. Verify messages were sent/received"
echo ""