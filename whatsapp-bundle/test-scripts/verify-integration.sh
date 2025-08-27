#!/bin/bash

echo "🔍 WhatsApp Integration Verification"
echo "===================================="
echo ""

BASE_URL="https://heraerp.com"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Checking integration status..."
echo ""

# Test 1: Check stored messages
echo -n "1. Checking message storage... "
MSG_COUNT=$(curl -s "$BASE_URL/api/v1/whatsapp/debug-dashboard" | jq -r '.data.totalMessages // 0')
if [ "$MSG_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $MSG_COUNT messages${NC}"
else
    echo -e "${RED}❌ No messages found${NC}"
fi

# Test 2: Check conversations
echo -n "2. Checking conversations... "
CONV_COUNT=$(curl -s "$BASE_URL/api/v1/whatsapp/debug-dashboard" | jq -r '.data.totalConversations // 0')
if [ "$CONV_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $CONV_COUNT conversations${NC}"
else
    echo -e "${RED}❌ No conversations found${NC}"
fi

# Test 3: Webhook verification
echo -n "3. Testing webhook... "
WEBHOOK_RESPONSE=$(curl -s "$BASE_URL/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test")
if [ "$WEBHOOK_RESPONSE" == "test" ]; then
    echo -e "${GREEN}✅ Webhook verification working${NC}"
else
    echo -e "${RED}❌ Webhook verification failed${NC}"
fi

# Test 4: Test storage endpoint
echo -n "4. Testing storage endpoint... "
STORAGE_STATUS=$(curl -s "$BASE_URL/api/v1/whatsapp/test-store" | jq -r '.status // "error"')
if [ "$STORAGE_STATUS" == "success" ]; then
    echo -e "${GREEN}✅ Storage test successful${NC}"
else
    echo -e "${YELLOW}⚠️  Storage test returned: $STORAGE_STATUS${NC}"
fi

echo ""
echo "📊 Summary:"
echo "----------"
echo "Messages stored: $MSG_COUNT"
echo "Conversations: $CONV_COUNT"
echo ""

# Show recent messages
echo "📱 Recent Messages:"
echo "------------------"
curl -s "$BASE_URL/api/v1/whatsapp/debug-dashboard" | jq -r '.data.conversationsWithMessages[].messages[:3][] | "[\(.created_at | split("T")[0])] \(.direction): \(.text)"' 2>/dev/null || echo "No messages to display"

echo ""
echo "🔗 Useful Links:"
echo "- Dashboard (login required): $BASE_URL/salon/whatsapp"
echo "- Debug API: $BASE_URL/api/v1/whatsapp/debug-dashboard"
echo "- Railway logs: railway logs | grep -i whatsapp"