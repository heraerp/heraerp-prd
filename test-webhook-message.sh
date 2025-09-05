#!/bin/bash

echo "📱 Testing WhatsApp Webhook Message Reception"
echo "==========================================="
echo ""
echo "Sending test message to webhook..."
echo ""

curl -X POST "https://api.heraerp.com/api/v1/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "1112225330318984",
        "changes": [
          {
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "+44 7515668004",
                "phone_number_id": "712631301940690"
              },
              "contacts": [
                {
                  "profile": {
                    "name": "Test Customer"
                  },
                  "wa_id": "447515668004"
                }
              ],
              "messages": [
                {
                  "from": "447515668004",
                  "id": "wamid.TEST_MESSAGE_'$(date +%s)'",
                  "timestamp": "'$(date +%s)'",
                  "text": {
                    "body": "I want to book an appointment"
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
echo "✅ Test complete! Check server logs for message processing."