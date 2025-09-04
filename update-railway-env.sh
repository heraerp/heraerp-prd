#!/bin/bash

# Update Railway environment variables for WhatsApp webhook

echo "🚂 Updating Railway Environment Variables for WhatsApp"
echo "====================================================="
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed!"
    echo "Install it with: brew install railway"
    exit 1
fi

echo "✅ Railway CLI is installed"
echo ""

# Link to project if not already linked
echo "📎 Linking to Railway project..."
railway link

# Set WhatsApp environment variables
echo ""
echo "🔧 Setting WhatsApp environment variables..."

# Core WhatsApp configuration
railway variables set WHATSAPP_WEBHOOK_VERIFY_TOKEN="hera-whatsapp-webhook-token-2024"
railway variables set WHATSAPP_PHONE_NUMBER_ID="712631301940690"
railway variables set WHATSAPP_BUSINESS_ACCOUNT_ID="1112225330318984"
railway variables set WHATSAPP_BUSINESS_NUMBER="+919945896033"

# Default organization for Hair Talkz
railway variables set DEFAULT_ORGANIZATION_ID="e3a9ff9e-bb83-43a8-b062-b85e7a2b4258"

echo ""
echo "⚠️  You still need to set your WhatsApp Access Token manually:"
echo "railway variables set WHATSAPP_ACCESS_TOKEN='your-access-token-here'"

echo ""
echo "📋 To verify all variables are set:"
echo "railway variables"

echo ""
echo "🚀 To deploy changes:"
echo "railway up"

echo ""
echo "✅ Environment variables updated!"
echo ""
echo "📱 Webhook configuration:"
echo "- URL: https://heraerp.com/api/v1/whatsapp/webhook"
echo "- Verify Token: hera-whatsapp-webhook-token-2024"
echo "- Business Number: +91 99458 96033"