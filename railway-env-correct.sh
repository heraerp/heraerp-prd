#!/bin/bash

echo "🚂 Railway Environment Variables Update"
echo "====================================="
echo ""

# First, ensure you're logged in
echo "📌 Ensuring Railway login..."
railway login

echo ""
echo "🔗 Linking to project..."
railway link

echo ""
echo "🔧 Setting WhatsApp environment variables..."
echo ""

# Set all WhatsApp environment variables in one command
railway variables \
  --set "WHATSAPP_WEBHOOK_VERIFY_TOKEN=hera-whatsapp-webhook-token-2024" \
  --set "WHATSAPP_PHONE_NUMBER_ID=712631301940690" \
  --set "WHATSAPP_BUSINESS_ACCOUNT_ID=1112225330318984" \
  --set "WHATSAPP_BUSINESS_NUMBER=+919945896033" \
  --set "DEFAULT_ORGANIZATION_ID=e3a9ff9e-bb83-43a8-b062-b85e7a2b4258"

echo ""
echo "✅ Variables set! Deployment will trigger automatically."
echo ""
echo "📋 Current variables:"
railway variables --kv

echo ""
echo "⚠️  Don't forget to set your WhatsApp Access Token:"
echo 'railway variables --set "WHATSAPP_ACCESS_TOKEN=your-actual-token-here"'
echo ""
echo "🌐 Your webhook URL: https://heraerp.com/api/v1/whatsapp/webhook"
echo "🔑 Verify token: hera-whatsapp-webhook-token-2024"