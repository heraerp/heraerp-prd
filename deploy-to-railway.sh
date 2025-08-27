#!/bin/bash
# Railway Deployment Script for HERA WhatsApp Integration

echo "🚂 Deploying HERA to Railway..."
echo "================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    echo "Run: npm install -g @railway/cli"
    exit 1
fi

# Login to Railway
echo "1️⃣ Logging into Railway..."
railway login

# Link to project (if not already linked)
echo "2️⃣ Linking to Railway project..."
railway link

# Set environment variables
echo "3️⃣ Setting environment variables..."
echo "You'll need to set these in Railway dashboard:"
echo ""
echo "REQUIRED VARIABLES:"
echo "==================="
echo "# Supabase"
echo "NEXT_PUBLIC_SUPABASE_URL=https://awfcrncxngqwbhqapffb.supabase.co"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>"
echo "SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>"
echo ""
echo "# WhatsApp"
echo "WHATSAPP_PHONE_NUMBER_ID=712631301940690"
echo "WHATSAPP_BUSINESS_ACCOUNT_ID=1112225330318984"
echo "WHATSAPP_ACCESS_TOKEN=<your-access-token>"
echo "WHATSAPP_BUSINESS_NUMBER=+919945896033"
echo "WHATSAPP_WEBHOOK_TOKEN=hera-whatsapp-webhook-2024-secure-token"
echo ""
echo "# Other"
echo "DEFAULT_ORGANIZATION_ID=44d2d8f8-167d-46a7-a704-c0e5435863d6"
echo ""
echo "Press Enter after setting variables in Railway dashboard..."
read -p ""

# Deploy
echo "4️⃣ Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📋 Post-deployment steps:"
echo "1. Get your Railway domain from the dashboard"
echo "2. Update WhatsApp webhook URL to: https://your-app.up.railway.app/api/v1/whatsapp/webhook"
echo "3. Test the webhook verification"
echo "4. Send a test message!"
echo ""
echo "🎉 Done!"