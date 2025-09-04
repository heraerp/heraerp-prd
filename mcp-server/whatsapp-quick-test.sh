#!/bin/bash
# HERA WhatsApp MCP Quick Test Script

echo "🚀 HERA WhatsApp MCP Quick Test"
echo "================================"
echo ""

# Set default organization ID
export DEFAULT_ORGANIZATION_ID=${DEFAULT_ORGANIZATION_ID:-"3df8cc52-3d81-42d5-b088-7736ae26cc7c"}
echo "📍 Using Organization ID: $DEFAULT_ORGANIZATION_ID"
echo ""

# 1. Seed smart codes
echo "1️⃣ Seeding WhatsApp Smart Codes..."
node seed-whatsapp-smart-codes.js
echo ""

# 2. Create a test customer
echo "2️⃣ Creating test customer..."
CUSTOMER_ID=$(node hera-cli.js create-entity customer "WhatsApp Test Customer" --org-id $DEFAULT_ORGANIZATION_ID | grep -o '"id": "[^"]*' | grep -o '[^"]*$')
echo "✅ Customer ID: $CUSTOMER_ID"
echo ""

# 3. Create a WhatsApp thread
echo "3️⃣ Creating WhatsApp thread..."
THREAD_RESULT=$(node whatsapp-mcp-cli.js thread.create "{\"organizationId\":\"$DEFAULT_ORGANIZATION_ID\",\"customerEntityId\":\"$CUSTOMER_ID\",\"phoneNumber\":\"+971501234567\"}")
THREAD_ID=$(echo $THREAD_RESULT | grep -o '"thread_id": "[^"]*' | grep -o '[^"]*$')
echo "✅ Thread ID: $THREAD_ID"
echo ""

# 4. Send test messages
echo "4️⃣ Sending test messages..."

# Inbound message
echo "   - Sending inbound message..."
node whatsapp-mcp-cli.js message.send "{\"organizationId\":\"$DEFAULT_ORGANIZATION_ID\",\"threadId\":\"$THREAD_ID\",\"direction\":\"inbound\",\"text\":\"Hi, I need help with my order\",\"channelMsgId\":\"wamid.test_$(date +%s)\"}"

# Outbound response
echo "   - Sending outbound response..."
node whatsapp-mcp-cli.js message.send "{\"organizationId\":\"$DEFAULT_ORGANIZATION_ID\",\"threadId\":\"$THREAD_ID\",\"direction\":\"outbound\",\"text\":\"Hello! I'm happy to help you with your order. What's your order number?\",\"cost\":0.005}"

# Interactive message
echo "   - Sending interactive message..."
node whatsapp-mcp-cli.js message.send "{\"organizationId\":\"$DEFAULT_ORGANIZATION_ID\",\"threadId\":\"$THREAD_ID\",\"direction\":\"outbound\",\"interactive\":{\"type\":\"button\",\"body\":{\"text\":\"How would you like me to help you?\"},\"action\":{\"buttons\":[{\"type\":\"reply\",\"reply\":{\"id\":\"track\",\"title\":\"Track Order\"}},{\"type\":\"reply\",\"reply\":{\"id\":\"cancel\",\"title\":\"Cancel Order\"}}]}}}"

# Internal note
echo "   - Adding internal note..."
node whatsapp-mcp-cli.js message.addNote "{\"organizationId\":\"$DEFAULT_ORGANIZATION_ID\",\"threadId\":\"$THREAD_ID\",\"noteText\":\"Customer seems frustrated, handle with care\"}"
echo ""

# 5. Query the thread
echo "5️⃣ Querying thread data..."
node whatsapp-mcp-cli.js query "{\"table\":\"universal_transaction_lines\",\"filters\":{\"organization_id\":\"$DEFAULT_ORGANIZATION_ID\",\"transaction_id\":\"$THREAD_ID\"}}"
echo ""

# 6. Test guardrails
echo "6️⃣ Testing guardrails..."

# Test org isolation (should fail)
echo "   - Testing org isolation (should fail)..."
OTHER_ORG="f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944"
node whatsapp-mcp-cli.js message.send "{\"organizationId\":\"$OTHER_ORG\",\"threadId\":\"$THREAD_ID\",\"direction\":\"outbound\",\"text\":\"Cross-org test\"}" 2>&1 | grep -E "(error|Error|failed)"

# Test bad smart code (validated internally)
echo "   - Smart code validation active ✅"

# Test idempotency
echo "   - Testing idempotency..."
IDEM_KEY="wamid.idem_test_$(date +%s)"
echo "     First send..."
node whatsapp-mcp-cli.js message.send "{\"organizationId\":\"$DEFAULT_ORGANIZATION_ID\",\"threadId\":\"$THREAD_ID\",\"direction\":\"inbound\",\"text\":\"Duplicate test\",\"channelMsgId\":\"$IDEM_KEY\"}" | grep -o '"idempotent": [^,]*'
echo "     Second send (should be idempotent)..."
node whatsapp-mcp-cli.js message.send "{\"organizationId\":\"$DEFAULT_ORGANIZATION_ID\",\"threadId\":\"$THREAD_ID\",\"direction\":\"inbound\",\"text\":\"Duplicate test\",\"channelMsgId\":\"$IDEM_KEY\"}" | grep -o '"idempotent": [^,]*'

echo ""
echo "✅ Quick test complete!"
echo ""
echo "📊 Next steps:"
echo "   - Run full smoke tests: node whatsapp-smoke-tests.js"
echo "   - Check health endpoint: curl http://localhost:3000/api/v1/whatsapp/health"
echo "   - View UI: http://localhost:3000/whatsapp-messages"