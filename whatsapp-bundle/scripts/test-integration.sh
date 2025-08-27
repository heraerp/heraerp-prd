#!/bin/bash

# WhatsApp Integration Test Suite
echo "🧪 HERA WhatsApp Integration Test Suite"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
WEBHOOK_URL="https://heraerp.com/api/v1/whatsapp/webhook"
TEST_ENDPOINT="https://heraerp.com/api/v1/whatsapp/test"
VERIFY_TOKEN="hera-whatsapp-webhook-2024-secure-token"
PHONE_NUMBER_ID="712631301940690"

# Test counters
PASSED=0
FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    local expected_result=$3
    
    echo -n "Testing $test_name... "
    
    result=$(eval $test_command 2>&1)
    
    if [[ $result == *"$expected_result"* ]]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "  Expected: $expected_result"
        echo "  Got: $result"
        ((FAILED++))
    fi
}

# Test 1: Webhook Verification
echo "1️⃣ Webhook Verification Tests"
echo "------------------------------"

run_test "Webhook GET verification" \
    "curl -s '${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test123'" \
    "test123"

run_test "Webhook invalid token" \
    "curl -s '${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test123'" \
    "Invalid verification token"

# Test 2: Test Endpoint
echo -e "\n2️⃣ Test Endpoint Checks"
echo "------------------------"

run_test "Test endpoint accessible" \
    "curl -s ${TEST_ENDPOINT} | grep -o 'WhatsApp Integration Test Endpoint'" \
    "WhatsApp Integration Test Endpoint"

# Test 3: Environment Variables
echo -e "\n3️⃣ Environment Configuration"
echo "-----------------------------"

if command -v railway &> /dev/null; then
    run_test "Railway variables set" \
        "railway variables | grep -c WHATSAPP" \
        "5"
else
    echo -e "${YELLOW}⚠️  Railway CLI not installed - skipping env check${NC}"
fi

# Test 4: Webhook Message Processing
echo -e "\n4️⃣ Message Processing Test"
echo "---------------------------"

test_payload='{
    "entry": [{
        "id": "1112225330318984",
        "changes": [{
            "value": {
                "messaging_product": "whatsapp",
                "metadata": {
                    "display_phone_number": "+919945896033",
                    "phone_number_id": "'$PHONE_NUMBER_ID'"
                },
                "messages": [{
                    "from": "919945896033",
                    "id": "test_msg_'$(date +%s)'",
                    "timestamp": "'$(date +%s)'",
                    "text": { "body": "Integration test message" },
                    "type": "text"
                }]
            },
            "field": "messages"
        }]
    }]
}'

run_test "Webhook POST processing" \
    "curl -s -X POST ${WEBHOOK_URL} -H 'Content-Type: application/json' -d '$test_payload' | grep -o 'ok'" \
    "ok"

# Test 5: Check Dashboard Access
echo -e "\n5️⃣ Dashboard Accessibility"
echo "---------------------------"

run_test "WhatsApp dashboard" \
    "curl -s -o /dev/null -w '%{http_code}' https://heraerp.com/salon/whatsapp" \
    "200"

# Summary
echo -e "\n📊 Test Summary"
echo "==============="
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your WhatsApp integration is working correctly.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Send a WhatsApp message to +91 99458 96033"
    echo "2. Check dashboard at https://heraerp.com/salon/whatsapp"
    echo "3. Monitor Railway logs for activity"
else
    echo -e "${RED}⚠️  Some tests failed. Please check the issues above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "1. Ensure all environment variables are set in Railway"
    echo "2. Check webhook is subscribed to 'messages' field in Meta"
    echo "3. Verify access token is valid and not expired"
fi

echo ""
echo "For detailed status, visit: ${TEST_ENDPOINT}"