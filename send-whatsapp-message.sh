#!/bin/bash

# WhatsApp Message Sender
echo "📱 WhatsApp Message Sender"
echo "========================="
echo ""

# Configuration
PHONE_NUMBER_ID="712631301940690"
RECIPIENT="919945896033"
API_VERSION="v23.0"

# Get access token from Railway
ACCESS_TOKEN=$(railway variables | grep WHATSAPP_ACCESS_TOKEN | awk -F'│' '{print $3}' | xargs)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ No access token found in Railway variables"
    echo "Please set WHATSAPP_ACCESS_TOKEN in Railway"
    exit 1
fi

# Message to send
MESSAGE=${1:-"Hello! Testing HERA WhatsApp integration."}

echo "Sending message to +91 99458 96033..."
echo "Message: $MESSAGE"
echo ""

# Send message
RESPONSE=$(curl -s -X POST \
  "https://graph.facebook.com/$API_VERSION/$PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "'$RECIPIENT'",
    "type": "text",
    "text": {
      "preview_url": false,
      "body": "'"$MESSAGE"'"
    }
  }')

# Check response
if echo "$RESPONSE" | grep -q "messages"; then
    MESSAGE_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Message sent successfully!"
    echo "Message ID: $MESSAGE_ID"
else
    echo "❌ Failed to send message"
    echo "Response: $RESPONSE"
fi