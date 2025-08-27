#!/bin/bash

echo "Adding WhatsApp environment variables to Railway..."
echo "=================================================="

# Add all WhatsApp variables in one command
railway variables \
  --set "WHATSAPP_WEBHOOK_TOKEN=hera-whatsapp-webhook-2024-secure-token" \
  --set "WHATSAPP_PHONE_NUMBER_ID=712631301940690" \
  --set "WHATSAPP_BUSINESS_ACCOUNT_ID=1112225330318984" \
  --set "WHATSAPP_BUSINESS_NUMBER=+919945896033" \
  --set "DEFAULT_ORGANIZATION_ID=44d2d8f8-167d-46a7-a704-c0e5435863d6"

echo ""
echo "✅ WhatsApp configuration variables added!"
echo ""
echo "⚠️  IMPORTANT: You still need to add your WhatsApp Access Token:"
echo ""
echo "railway variables --set \"WHATSAPP_ACCESS_TOKEN=YOUR_ACTUAL_TOKEN_HERE\""
echo ""
echo "Replace YOUR_ACTUAL_TOKEN_HERE with your token starting with EAAkj2JA..."
echo ""
echo "After adding the access token, Railway will redeploy automatically."
echo ""
echo "Once deployed, use these webhook URLs in Meta Business Manager:"
echo "1. https://heraerp.com/api/v1/whatsapp/webhook"
echo "2. https://www.heraerp.com/api/v1/whatsapp/webhook"
echo ""
echo "Verify Token: hera-whatsapp-webhook-2024-secure-token"