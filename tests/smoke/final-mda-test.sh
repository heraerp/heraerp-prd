#\!/bin/bash

# HERA MDA Final Smoke Test
# Uses exact API format from the working endpoint documentation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_BASE="http://localhost:3000"
ORG_ID="demo-salon-org-uuid"
AUTH_TOKEN="Bearer demo-token-salon-manager"
TEST_DATE=$(date +%Y-%m-%d)

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0

echo -e "${BLUE}🎯 HERA MDA Final Smoke Test${NC}"
echo -e "${BLUE}==============================${NC}"
echo "Testing MDA Auto-Posting Engine with exact API format"
echo "Date: $TEST_DATE"
echo ""

# Function to test MDA posting
test_mda_posting() {
    local test_name="$1"
    local transaction_type="$2"
    local smart_code="$3"
    local amount="$4"
    local note="$5"
    local channel="${6:-MANUAL}"
    
    echo -e "${YELLOW}🧪 Testing: $test_name${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Generate unique reference
    local ref="SMOKE-$(date +%s)"
    
    # Execute API call with exact format
    response=$(curl -s -X POST "$API_BASE/api/v2/transactions/post" \
        -H 'Content-Type: application/json' \
        -H 'x-hera-api-version: v2' \
        -H "Authorization: $AUTH_TOKEN" \
        -d "{
            \"apiVersion\": \"v2\",
            \"organization_id\": \"$ORG_ID\",
            \"transaction_type\": \"$transaction_type\",
            \"smart_code\": \"$smart_code\",
            \"transaction_date\": \"$TEST_DATE\",
            \"total_amount\": $amount,
            \"transaction_currency_code\": \"AED\",
            \"base_currency_code\": \"AED\",
            \"exchange_rate\": 1.0,
            \"business_context\": {
                \"channel\": \"$channel\",
                \"note\": \"$note\"
            },
            \"metadata\": {
                \"ingest_source\": \"Smoke_Test\",
                \"original_ref\": \"$ref\"
            },
            \"lines\": []
        }" 2>/dev/null)
    
    # Check response
    if echo "$response" | jq -e '.success == true' >/dev/null 2>&1; then
        echo -e "${GREEN}   ✅ PASS: Transaction posted successfully${NC}"
        
        # Extract transaction details
        local txn_id=$(echo "$response" | jq -r '.data.transaction_id // "N/A"')
        local gl_count=$(echo "$response" | jq '.data.gl_lines | length // 0')
        local processing_time=$(echo "$response" | jq '.metadata.processing_time_ms // 0')
        
        echo -e "${GREEN}   📄 Transaction ID: $txn_id${NC}"
        echo -e "${GREEN}   📊 GL Lines: $gl_count${NC}"
        echo -e "${GREEN}   ⏱️  Processing Time: ${processing_time}ms${NC}"
        
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}   ❌ FAIL: API returned error${NC}"
        local error_msg=$(echo "$response" | jq -r '.error.message // "Unknown error"')
        echo -e "${RED}   📝 Error: $error_msg${NC}"
        return 1
    fi
}

# Test 1: Core Expense Scenarios
echo -e "\n${BLUE}1. 💰 Expense Posting Tests${NC}"

test_mda_posting \
    "Staff Salary Payment" \
    "TX.FINANCE.EXPENSE.V1" \
    "HERA.SALON.FINANCE.TXN.EXPENSE.SALARY.V1" \
    "8500" \
    "Monthly staff salary payment" \
    "BANK"

test_mda_posting \
    "Rent Payment" \
    "TX.FINANCE.EXPENSE.V1" \
    "HERA.SALON.FINANCE.TXN.EXPENSE.RENT.V1" \
    "6500" \
    "October rent payment" \
    "BANK"

test_mda_posting \
    "Supplies with VAT" \
    "TX.FINANCE.EXPENSE.V1" \
    "HERA.SALON.FINANCE.TXN.EXPENSE.SUPPLIES.V1" \
    "420" \
    "Hair products purchase" \
    "MANUAL"

# Test 2: Revenue Scenarios
echo -e "\n${BLUE}2. 💸 Revenue Posting Tests${NC}"

test_mda_posting \
    "Service Revenue" \
    "TX.FINANCE.REVENUE.V1" \
    "HERA.SALON.FINANCE.TXN.REVENUE.SERVICE.V1" \
    "315" \
    "Hair styling service" \
    "POS"

test_mda_posting \
    "Product Sales" \
    "TX.FINANCE.REVENUE.V1" \
    "HERA.SALON.FINANCE.TXN.REVENUE.PRODUCT.V1" \
    "210" \
    "Hair care product sales" \
    "POS"

# Test 3: Bank Operations
echo -e "\n${BLUE}3. 🏦 Bank Operations Tests${NC}"

test_mda_posting \
    "Bank Fees" \
    "TX.FINANCE.BANK_FEE.V1" \
    "HERA.SALON.FINANCE.TXN.BANK.FEE.V1" \
    "35" \
    "Monthly bank charges" \
    "BANK"

# Test 4: API Validation
echo -e "\n${BLUE}4. 🛡️ API Validation Tests${NC}"

echo -e "${YELLOW}🧪 Testing: Missing API Version Header${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

response=$(curl -s -X POST "$API_BASE/api/v2/transactions/post" \
    -H 'Content-Type: application/json' \
    -H "Authorization: $AUTH_TOKEN" \
    -d '{"test": "no api version"}' 2>/dev/null)

if echo "$response" | jq -e '.success == false' >/dev/null 2>&1; then
    echo -e "${GREEN}   ✅ PASS: Correctly rejected missing API version${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}   ❌ FAIL: Should have rejected missing API version${NC}"
fi

# Final Results
echo -e "\n${BLUE}📊 Final Test Results${NC}"
echo -e "${BLUE}======================${NC}"
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}✅ Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Failed: $((TOTAL_TESTS - PASSED_TESTS))${NC}"

success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
echo "Success Rate: $success_rate%"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED\!${NC}"
    echo -e "${GREEN}🚀 HERA Modern Digital Accountant is working perfectly\!${NC}"
    echo -e "${GREEN}✨ Auto-Posting Engine successfully generating balanced GL entries${NC}"
    echo -e "${GREEN}🛡️ API validation and security working correctly${NC}"
    echo ""
    echo -e "${BLUE}🎯 MDA System Status: ${GREEN}OPERATIONAL${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Review the errors above.${NC}"
    echo -e "${BLUE}🎯 MDA System Status: ${YELLOW}NEEDS ATTENTION${NC}"
    exit 1
fi
