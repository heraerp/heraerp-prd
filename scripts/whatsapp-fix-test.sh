#!/bin/bash

echo "🔧 WhatsApp API Fixed Test"
echo "=========================="

ACCESS_TOKEN="EAAkj2JA2DYEBPYc6SZBr6H7NcjeWGvhRrif4tNHaux6l5GWuvpGkcwYdcnMlLIvZAfppuaGuJx17ZCqtGOZCJ8tr5hDQwja85ZBLrIpZCz1ZBEjDWAt2puJd7Sw1EAp3SUkcJ6VZAH8cVLy9br8HlrdDXyRP7YfYEZCvn8vEU5f0EbIX7HUtSust4QZAquWQjeBwZDZD"
PHONE_NUMBER_ID="712631301940690"

echo -e "\n1️⃣  First, let's check if the phone needs verification..."
echo "Status: Your phone verification is EXPIRED"
echo "Action Required: Please verify your phone number in Meta Business Manager"
echo ""
echo "Steps:"
echo "1. Go to https://business.facebook.com"
echo "2. Navigate to WhatsApp Manager > Phone Numbers"
echo "3. Click 'Verify' next to +91 99458 96033"
echo "4. Complete SMS/Voice verification"
echo ""

echo -e "\n2️⃣  Testing with different recipient formats..."
echo "After verification, try these commands:"
echo ""

# Try different number formats
echo "Option A - With country code, no plus:"
echo 'curl -X POST \
  "https://graph.facebook.com/v18.0/'${PHONE_NUMBER_ID}'/messages" \
  -H "Authorization: Bearer '${ACCESS_TOKEN}'" \
  -H "Content-Type: application/json" \
  -d '"'"'{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "919945896033",
    "type": "text",
    "text": {
      "preview_url": false,
      "body": "HERA Test: Message after verification"
    }
  }'"'"''

echo ""
echo "Option B - Test with a different number (that has messaged you first):"
echo 'curl -X POST \
  "https://graph.facebook.com/v18.0/'${PHONE_NUMBER_ID}'/messages" \
  -H "Authorization: Bearer '${ACCESS_TOKEN}'" \
  -H "Content-Type: application/json" \
  -d '"'"'{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "RECIPIENT_PHONE_NUMBER",
    "type": "text",
    "text": {
      "preview_url": false,
      "body": "HERA Test: Hello!"
    }
  }'"'"''

echo -e "\n3️⃣  To test receiving messages (after verification):"
echo "Send any message TO your business number +91 99458 96033"
echo "The webhook should receive it at: https://heraerp.com/api/v1/whatsapp/webhook"

echo -e "\n4️⃣  Checking webhook configuration..."
curl -X GET \
  "https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/whatsapp_business_profile?fields=webhook_configuration&access_token=${ACCESS_TOKEN}" \
  2>/dev/null | jq '.'