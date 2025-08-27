#!/bin/bash
# Verify WhatsApp Deployment Status

echo "🔍 WhatsApp Deployment Verification"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="api.heraerp.com"
WEBHOOK_PATH="/api/v1/whatsapp/webhook"
HEALTH_PATH="/api/health"
VERIFY_TOKEN="hera-whatsapp-webhook-2024-secure-token"

# Counters
PASSED=0
FAILED=0

# Function to check a test
check_test() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((FAILED++))
    fi
}

# Test 1: DNS Resolution
echo "1️⃣ Testing DNS resolution..."
if ping -c 1 $DOMAIN &> /dev/null; then
    echo -e "   Domain resolves: ${GREEN}Yes${NC}"
    check_test 0
else
    echo -e "   Domain resolves: ${RED}No${NC}"
    check_test 1
fi

# Test 2: HTTPS Certificate
echo -e "\n2️⃣ Testing HTTPS certificate..."
SSL_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN)
if [ "$SSL_CHECK" != "000" ]; then
    echo "   SSL/TLS: Valid"
    check_test 0
else
    echo "   SSL/TLS: Invalid"
    check_test 1
fi

# Test 3: Health Endpoint
echo -e "\n3️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s https://$DOMAIN$HEALTH_PATH)
if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo "   Health check: Healthy"
    check_test 0
else
    echo "   Health check: Unhealthy"
    echo "   Response: $HEALTH_RESPONSE"
    check_test 1
fi

# Test 4: Webhook Verification
echo -e "\n4️⃣ Testing webhook verification..."
WEBHOOK_URL="https://$DOMAIN$WEBHOOK_PATH?hub.mode=subscribe&hub.verify_token=$VERIFY_TOKEN&hub.challenge=deployment_test"
WEBHOOK_RESPONSE=$(curl -s "$WEBHOOK_URL")
if [ "$WEBHOOK_RESPONSE" == "deployment_test" ]; then
    echo "   Webhook verification: Working"
    check_test 0
else
    echo "   Webhook verification: Not working"
    echo "   Response: $WEBHOOK_RESPONSE"
    check_test 1
fi

# Test 5: Response Time
echo -e "\n5️⃣ Testing response time..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://$DOMAIN$HEALTH_PATH)
RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    echo "   Response time: ${RESPONSE_MS}ms (Good)"
    check_test 0
else
    echo "   Response time: ${RESPONSE_MS}ms (Slow)"
    check_test 1
fi

# Test 6: Railway Status (if CLI available)
echo -e "\n6️⃣ Checking Railway deployment..."
if command -v railway &> /dev/null; then
    RAILWAY_STATUS=$(railway status 2>&1)
    if [[ $RAILWAY_STATUS == *"Deployed"* ]] || [[ $RAILWAY_STATUS == *"Active"* ]]; then
        echo "   Railway status: Deployed"
        check_test 0
    else
        echo "   Railway status: Unknown"
        check_test 1
    fi
else
    echo "   Railway CLI not installed (skipping)"
fi

# Summary
echo -e "\n📊 Deployment Verification Summary"
echo "=================================="
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your WhatsApp integration is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure webhook in Meta Business Manager"
    echo "2. Send a test message to +91 99458 96033"
    echo "3. Monitor Railway logs for activity"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please check the issues above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Ensure Railway deployment is complete"
    echo "2. Check environment variables are set"
    echo "3. Verify domain configuration"
fi

# Additional Information
echo -e "\n📋 Configuration Details"
echo "========================"
echo "Domain: $DOMAIN"
echo "Webhook URL: https://$DOMAIN$WEBHOOK_PATH"
echo "Phone Number ID: 712631301940690"
echo "Business Number: +91 99458 96033"
echo "Token Expires: August 27, 2025"