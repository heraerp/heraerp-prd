#!/bin/bash

# Quick WhatsApp Test - Send a message to 919945896033

echo "📱 Sending WhatsApp message to +91 9945896033..."
echo ""

curl -X POST "https://graph.facebook.com/v21.0/712631301940690/messages" \
  -H "Authorization: Bearer EAAkj2JA2DYEBPQeZC1D0my0wZClW6uw3VBAANDpFzm6B7jr91bKJCnvhg9J2U0kAZAX3ZCJAek6K6NekOPXd5paBgN8Au3EOV0O6ob1pZChsDunIxxtAmr83MDSHXbMxA1hLo58zujSXPKhkZCyATNIZAa39i0l3h2PLRHJE2fzB5ZAz4UEaNwTH6fTOL6iUxAZDZD" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919945896033",
    "type": "text",
    "text": {
      "body": "Hello! This is a test message from HERA ERP WhatsApp integration. Your salon booking system is ready!"
    }
  }' | jq '.'

echo ""
echo "✅ Message sent! Check WhatsApp on +91 9945896033"