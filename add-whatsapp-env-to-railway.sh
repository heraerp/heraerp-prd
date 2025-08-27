#!/bin/bash

echo "Adding WhatsApp environment variables to Railway..."
echo "=================================================="

# Add WhatsApp environment variables
railway variables set WHATSAPP_WEBHOOK_TOKEN=hera-whatsapp-webhook-2024-secure-token
railway variables set WHATSAPP_PHONE_NUMBER_ID=712631301940690
railway variables set WHATSAPP_BUSINESS_ACCOUNT_ID=1112225330318984
railway variables set WHATSAPP_BUSINESS_NUMBER=+919945896033
railway variables set DEFAULT_ORGANIZATION_ID=44d2d8f8-167d-46a7-a704-c0e5435863d6

echo ""
echo "Please add your WhatsApp Access Token manually:"
echo "railway variables set WHATSAPP_ACCESS_TOKEN=YOUR_ACTUAL_TOKEN"
echo ""
echo "After adding the access token, Railway will redeploy automatically."
echo ""
echo "Verification URLs to try after deployment:"
echo "1. https://heraerp.com/api/v1/whatsapp/webhook"
echo "2. https://www.heraerp.com/api/v1/whatsapp/webhook"
echo "3. https://heraerp-production.up.railway.app/api/v1/whatsapp/webhook"