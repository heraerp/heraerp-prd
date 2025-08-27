#!/bin/bash

# Send WhatsApp Test Message
echo "📱 WhatsApp Message Sender"
echo "========================="
echo ""

# Configuration
PHONE_NUMBER_ID="712631301940690"
RECIPIENT="919945896033"
API_VERSION="v23.0"

# Get message from argument or use default
MESSAGE=${1:-"🧪 Test from HERA WhatsApp Integration!\n\nReply with:\n• Hi - Welcome message\n• Book appointment - Start booking\n• Services - View our services"}

echo "Sending to: +91 99458 96033"
echo "Message: $MESSAGE"
echo ""

# Get access token from Railway if available
if command -v railway &> /dev/null; then
    ACCESS_TOKEN=$(railway variables | grep WHATSAPP_ACCESS_TOKEN | awk -F'│' '{print $3}' | xargs)
else
    ACCESS_TOKEN=${WHATSAPP_ACCESS_TOKEN:-""}
fi

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ No access token found"
    echo ""
    echo "Set token with:"
    echo "export WHATSAPP_ACCESS_TOKEN='your_token_here'"
    exit 1
fi

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
if echo "$RESPONSE" | grep -q '"id"'; then
    MESSAGE_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Message sent successfully!"
    echo "Message ID: $MESSAGE_ID"
    echo ""
    echo "📱 Check WhatsApp on +91 99458 96033"
else
    echo "❌ Failed to send message"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""
    if echo "$RESPONSE" | grep -q "Re-engagement"; then
        echo "📱 You must message the business first from WhatsApp!"
        echo "Send any message to +91 99458 96033 then try again."
    fi
fi