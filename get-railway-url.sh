#!/bin/bash
# Get Railway URL for WhatsApp Webhook Configuration

echo "🚂 Getting Railway URL..."
echo "========================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found."
    echo ""
    echo "Install it with:"
    echo "  npm install -g @railway/cli"
    echo ""
    echo "Or use curl:"
    echo "  curl -fsSL https://railway.app/install.sh | sh"
    exit 1
fi

# Check if we're in a railway project
if [ ! -f ".railway/config.json" ] && ! railway status &> /dev/null; then
    echo "⚠️  Not linked to a Railway project"
    echo ""
    echo "Run these commands:"
    echo "  railway login"
    echo "  railway link"
    exit 1
fi

echo "✅ Railway CLI found"
echo ""

# Get the service domain
echo "📡 Fetching your Railway domain..."
echo ""

# Get service details
DOMAIN=$(railway domain 2>/dev/null | grep -E "https?://" | head -n 1)

if [ -z "$DOMAIN" ]; then
    echo "⚠️  No domain found. Trying alternative method..."
    
    # Try getting from railway status
    railway status
    
    echo ""
    echo "📝 To generate a domain:"
    echo "  1. Go to https://railway.app/dashboard"
    echo "  2. Click on your service"
    echo "  3. Go to Settings → Domains"
    echo "  4. Click 'Generate Domain'"
    echo ""
else
    # Clean up the domain (remove any trailing slashes)
    DOMAIN=$(echo $DOMAIN | sed 's:/*$::')
    
    echo "✅ Found your Railway domain!"
    echo ""
    echo "🌐 Your Railway URL:"
    echo "   $DOMAIN"
    echo ""
    echo "📱 Your WhatsApp Webhook URL:"
    echo "   ${DOMAIN}/api/v1/whatsapp/webhook"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Copy the webhook URL above"
    echo "2. Go to Meta Business Manager"
    echo "3. Navigate to WhatsApp → Configuration → Webhooks"
    echo "4. Paste the URL and use token: hera-whatsapp-webhook-2024-secure-token"
    echo ""
    echo "🧪 Test your webhook:"
    echo "   curl \"${DOMAIN}/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test\""
fi

# Show all environment info
echo ""
echo "📊 Railway Project Info:"
railway status

echo ""
echo "💡 Other useful commands:"
echo "  railway logs          # View real-time logs"
echo "  railway variables     # List environment variables"
echo "  railway run env       # Show all env vars"
echo "  railway open          # Open Railway dashboard"