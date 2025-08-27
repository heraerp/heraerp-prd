#!/bin/bash

# Test sending WhatsApp message
echo "📱 Testing WhatsApp Message Send..."
echo ""

# Get the access token from Railway
ACCESS_TOKEN=$(railway variables | grep "WHATSAPP_ACCESS_TOKEN" | awk -F'│' '{print $3}' | xargs)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ No access token found"
    exit 1
fi

# Configuration
PHONE_NUMBER_ID="712631301940690"
RECIPIENT="919945896033"

echo "Sending test message to +91 99458 96033..."

# Send message
RESPONSE=$(curl -s -X POST \
  "https://graph.facebook.com/v23.0/$PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "'$RECIPIENT'",
    "type": "text",
    "text": {
      "preview_url": false,
      "body": "✅ HERA WhatsApp Test!\n\nYour integration is working. Reply with:\n• Hi - Welcome message\n• Book appointment - Start booking\n• Help - See commands"
    }
  }')

# Check response
if echo "$RESPONSE" | grep -q "messages"; then
    MESSAGE_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Message sent successfully!"
    echo "Message ID: $MESSAGE_ID"
    echo ""
    echo "📱 Please check your WhatsApp!"
else
    echo "❌ Failed to send message:"
    echo "$RESPONSE" | python3 -m json.tool
    echo ""
    echo "Note: You must message the business first from WhatsApp"
fi