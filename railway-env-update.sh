#!/bin/bash

# Railway CLI commands to update WhatsApp environment variables

echo "🚂 Updating Railway Environment Variables"
echo "========================================"
echo ""

# Set WhatsApp webhook verification token
railway variables set WHATSAPP_WEBHOOK_VERIFY_TOKEN="hera-whatsapp-webhook-token-2024"

# Set WhatsApp Phone Number ID
railway variables set WHATSAPP_PHONE_NUMBER_ID="712631301940690"

# Set WhatsApp Business Account ID
railway variables set WHATSAPP_BUSINESS_ACCOUNT_ID="1112225330318984"

# Set WhatsApp Business Number
railway variables set WHATSAPP_BUSINESS_NUMBER="+919945896033"

# Set default organization ID for Hair Talkz
railway variables set DEFAULT_ORGANIZATION_ID="e3a9ff9e-bb83-43a8-b062-b85e7a2b4258"

echo ""
echo "✅ Environment variables updated!"
echo ""
echo "📋 Current variables:"
railway variables

echo ""
echo "🚀 Changes will be deployed automatically"