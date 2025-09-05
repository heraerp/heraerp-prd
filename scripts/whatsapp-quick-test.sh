#!/bin/bash

# Quick WhatsApp API Test

echo "🔍 Quick WhatsApp API Test"
echo "=========================="

# Your credentials
ACCESS_TOKEN="EAAkj2JA2DYEBPYc6SZBr6H7NcjeWGvhRrif4tNHaux6l5GWuvpGkcwYdcnMlLIvZAfppuaGuJx17ZCqtGOZCJ8tr5hDQwja85ZBLrIpZCz1ZBEjDWAt2puJd7Sw1EAp3SUkcJ6VZAH8cVLy9br8HlrdDXyRP7YfYEZCvn8vEU5f0EbIX7HUtSust4QZAquWQjeBwZDZD"
PHONE_NUMBER_ID="712631301940690"

echo -e "\n1️⃣  Testing Phone Number Status..."
curl -s -X GET \
  "https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}?access_token=${ACCESS_TOKEN}" | jq '.'

echo -e "\n2️⃣  Testing Send Capability..."
echo "Sending test message to your number..."
curl -X POST \
  "https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919945896033",
    "type": "text",
    "text": {
      "body": "HERA Test: If you see this, WhatsApp API is working! 🚀"
    }
  }' | jq '.'