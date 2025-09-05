#!/bin/bash

# WhatsApp Appointment Booking Test Script
WEBHOOK_URL="https://api.heraerp.com/api/v1/whatsapp/webhook"
PHONE_NUMBER_ID="712631301940690"
WHATSAPP_BUSINESS_ACCOUNT_ID="1112225330318984"
CUSTOMER_PHONE="447515668004"

echo "📱 WhatsApp Appointment Booking Test"
echo "===================================="
echo ""

# Function to simulate incoming message
simulate_message() {
    local message_text="$1"
    local message_id="wamid.TEST_$(date +%s)_$(uuidgen | tr '[:lower:]' '[:upper:]' | head -c 8)"
    
    echo "📨 Simulating message: \"$message_text\""
    
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
                    "display_phone_number": "+44 7515668004",
                    "phone_number_id": "'${PHONE_NUMBER_ID}'"
                  },
                  "contacts": [
                    {
                      "profile": {
                        "name": "Test Customer"
                      },
                      "wa_id": "'${CUSTOMER_PHONE}'"
                    }
                  ],
                  "messages": [
                    {
                      "from": "'${CUSTOMER_PHONE}'",
                      "id": "'${message_id}'",
                      "timestamp": "'$(date +%s)'",
                      "text": {
                        "body": "'"$message_text"'"
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
      -s -w "\n✅ Status: %{http_code}\n"
    
    echo "---"
    sleep 2
}

# Test appointment booking flow
echo "🔄 Starting appointment booking conversation..."
echo ""

# 1. Initial booking request
simulate_message "I want to book an appointment"

# 2. Select service (Haircut & Style = option 1)
simulate_message "1"

# 3. Select staff (Rocky = option 1)
simulate_message "1"

# 4. Select date (Tomorrow = option 2)
simulate_message "2"

# 5. Select time (10:00 = option 2)
simulate_message "2"

# 6. Confirm booking
simulate_message "yes"

echo ""
echo "✅ Appointment booking test complete!"
echo ""
echo "Check the webhook logs to see how messages were processed."
echo "The customer should have received replies at ${CUSTOMER_PHONE}"