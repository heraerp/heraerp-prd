#!/bin/bash

# HERA WhatsApp Webhook Setup Script
# This script helps you set up ngrok and configure the webhook

echo "🚀 HERA WhatsApp Webhook Setup"
echo "=============================="
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed!"
    echo ""
    echo "Please install ngrok:"
    echo "- Mac: brew install ngrok/ngrok/ngrok"
    echo "- Windows: choco install ngrok"
    echo "- Linux: snap install ngrok"
    echo "- Or download from: https://ngrok.com/download"
    exit 1
fi

echo "✅ ngrok is installed"
echo ""

# Start ngrok
echo "🌐 Starting ngrok tunnel..."
echo "This will expose your local server (port 3000) to the internet"
echo ""

# Kill any existing ngrok processes
pkill -f ngrok > /dev/null 2>&1

# Start ngrok in background
ngrok http 3000 > /dev/null 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get the public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL"
    echo "Please run manually: ngrok http 3000"
    exit 1
fi

echo "✅ ngrok tunnel created!"
echo ""
echo "📱 WhatsApp Webhook Configuration"
echo "================================="
echo ""
echo "Your webhook URL is:"
echo "👉 ${NGROK_URL}/api/v1/whatsapp/webhook"
echo ""
echo "Verify token (from .env):"
echo "👉 ${WHATSAPP_WEBHOOK_VERIFY_TOKEN:-hera-whatsapp-webhook-token-2024}"
echo ""
echo "📋 Steps to configure in Meta Business Manager:"
echo ""
echo "1. Go to: https://business.facebook.com"
echo "2. Navigate to: WhatsApp > Configuration > Webhooks"
echo "3. Click 'Edit' on the webhook configuration"
echo "4. Enter the webhook URL: ${NGROK_URL}/api/v1/whatsapp/webhook"
echo "5. Enter verify token: ${WHATSAPP_WEBHOOK_VERIFY_TOKEN:-hera-whatsapp-webhook-token-2024}"
echo "6. Click 'Verify and Save'"
echo "7. Subscribe to these fields:"
echo "   ✓ messages"
echo "   ✓ message_status"
echo "   ✓ message_template_status_update"
echo ""
echo "🔍 Monitoring:"
echo "- ngrok inspector: http://127.0.0.1:4040"
echo "- Server logs: Check your Next.js console"
echo ""
echo "📱 Test the integration:"
echo "1. Send a WhatsApp message to: ${WHATSAPP_BUSINESS_NUMBER:-+91 99458 96033}"
echo "2. Check the server console for webhook logs"
echo "3. Check http://127.0.0.1:4040 to see incoming requests"
echo ""
echo "Press Ctrl+C to stop ngrok when done"
echo ""

# Keep script running
wait $NGROK_PID