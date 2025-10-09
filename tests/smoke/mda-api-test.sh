#\!/bin/bash

# HERA MDA API-Specific Smoke Test
# Focused testing of the MDA /api/v2/transactions/post endpoint

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_BASE="http://localhost:3000"
ORG_ID="demo-salon-org-uuid"
API_VERSION="v2"
AUTH_TOKEN="Bearer demo-token-salon-manager"
TEST_DATE=$(date +%Y-%m-%d)

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0

echo -e "${BLUE}🧪 HERA MDA API Smoke Test${NC}"
echo -e "${BLUE}============================${NC}"
echo "API Endpoint: $API_BASE/api/v2/transactions/post"
echo "Organization: $ORG_ID"
echo "Test Date: $TEST_DATE"
echo ""

# Function to run MDA test
run_mda_test() {
    local test_name="$1"
    local transaction_type="$2"
    local smart_code="$3"
    local amount="$4"
    local business_context="$5"
    
    echo -e "${YELLOW}🔍 Testing: $test_name${NC}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Generate unique reference
    local ref="SMOKE-$(echo "$test_name" | tr ' ' '-' | tr '[:lower:]' '[:upper:]')-$(date +%s)"
    
    # Execute MDA API call
    response=$(curl -s -X POST "$API_BASE/api/v2/transactions/post" \
        -H 'Content-Type: application/json' \
        -H "x-hera-api-version: $API_VERSION" \
        -H "Authorization: $AUTH_TOKEN" \
        -d "{
            \"apiVersion\": \"$API_VERSION\",
            \"organization_id\": \"$ORG_ID\",
            \"transaction_type\": \"$transaction_type\",
            \"smart_code\": \"$smart_code\",
            \"transaction_date\": \"$TEST_DATE\",
            \"total_amount\": $amount,
            \"transaction_currency_code\": \"AED\",
            \"base_currency_code\": \"AED\",
            \"exchange_rate\": 1.0,
            \"business_context\": $business_context,
            \"metadata\": {
                \"ingest_source\": \"Smoke_Test\",
                \"original_ref\": \"$ref\"
            },
            \"lines\": []
        }" 2>/dev/null || echo "CURL_ERROR")
    
    if [ "$response" = "CURL_ERROR" ]; then
        echo -e "${RED}   ❌ FAIL: Network/Connection Error${NC}"
        return 1
    fi
    
    # Check response
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}   ✅ PASS: Transaction posted successfully${NC}"
        
        # Extract transaction ID
        if echo "$response" | grep -q '"transaction_id"'; then
            txn_id=$(echo "$response" | jq -r '.data.transaction_id' 2>/dev/null || echo "N/A")
            echo -e "${GREEN}   📄 Transaction ID: $txn_id${NC}"
        fi
        
        # Extract GL lines info
        if echo "$response" | grep -q '"gl_lines"'; then
            gl_count=$(echo "$response" | jq '.data.gl_lines | length' 2>/dev/null || echo "N/A")
            echo -e "${GREEN}   📊 GL Lines Created: $gl_count${NC}"
        fi
        
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}   ❌ FAIL: API returned error${NC}"
        error_msg=$(echo "$response" | jq -r '.error.message // .message // "Unknown error"' 2>/dev/null || echo "Parse error")
        echo -e "${RED}   📝 Error: $error_msg${NC}"
        return 1
    fi
}

# Test MDA Core Scenarios
echo -e "\n${BLUE}1. Expense Postings${NC}"

run_mda_test "Salary Expense" \
    "TX.FINANCE.EXPENSE.V1" \
    "HERA.SALON.FINANCE.TXN.EXPENSE.SALARY.V1" \
    "10000" \
    '{"channel": "MANUAL", "note": "Staff salary payment", "category": "Payroll"}'

run_mda_test "Rent Expense" \
    "TX.FINANCE.EXPENSE.V1" \
    "HERA.SALON.FINANCE.TXN.EXPENSE.RENT.V1" \
    "7500" \
    '{"channel": "BANK", "note": "Monthly rent payment", "category": "Rent"}'

run_mda_test "Supplies with VAT" \
    "TX.FINANCE.EXPENSE.V1" \
    "HERA.SALON.FINANCE.TXN.EXPENSE.SUPPLIES.V1" \
    "525" \
    '{"channel": "MANUAL", "note": "Hair products", "category": "Supplies", "vat_inclusive": true}'

echo -e "\n${BLUE}2. Revenue Postings${NC}"

run_mda_test "Service Revenue" \
    "TX.FINANCE.REVENUE.V1" \
    "HERA.SALON.FINANCE.TXN.REVENUE.SERVICE.V1" \
    "315" \
    '{"channel": "POS", "note": "Hair styling service", "category": "Service", "vat_inclusive": true}'

run_mda_test "Product Revenue" \
    "TX.FINANCE.REVENUE.V1" \
    "HERA.SALON.FINANCE.TXN.REVENUE.PRODUCT.V1" \
    "105" \
    '{"channel": "POS", "note": "Hair care products", "category": "Product", "vat_inclusive": true}'

echo -e "\n${BLUE}3. Bank Operations${NC}"

run_mda_test "Bank Fee" \
    "TX.FINANCE.BANK_FEE.V1" \
    "HERA.SALON.FINANCE.TXN.BANK.FEE.V1" \
    "45" \
    '{"channel": "BANK", "note": "Monthly bank charges", "category": "BankFees"}'

echo -e "\n${BLUE}4. Error Validation${NC}"

echo -e "${YELLOW}🔍 Testing: Invalid Smart Code${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

response=$(curl -s -X POST "$API_BASE/api/v2/transactions/post" \
    -H 'Content-Type: application/json' \
    -H "x-hera-api-version: $API_VERSION" \
    -H "Authorization: $AUTH_TOKEN" \
    -d '{
        "apiVersion": "v2",
        "organization_id": "'$ORG_ID'",
        "transaction_type": "TX.FINANCE.EXPENSE.V1",
        "smart_code": "INVALID.SMART.CODE.V1",
        "transaction_date": "'$TEST_DATE'",
        "total_amount": 1000,
        "transaction_currency_code": "AED",
        "base_currency_code": "AED", 
        "exchange_rate": 1.0,
        "business_context": {"channel": "MANUAL", "note": "Test"},
        "metadata": {"ingest_source": "Test"},
        "lines": []
    }' 2>/dev/null)

if echo "$response" | grep -q '"success":false'; then
    echo -e "${GREEN}   ✅ PASS: Correctly rejected invalid smart code${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}   ❌ FAIL: Should have rejected invalid smart code${NC}"
fi

# Summary
echo -e "\n${BLUE}📊 Test Results${NC}"
echo -e "${BLUE}================${NC}"
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}✅ Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Failed: $((TOTAL_TESTS - PASSED_TESTS))${NC}"

success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
echo "Success Rate: $success_rate%"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "\n${GREEN}🎉 ALL MDA TESTS PASSED\!${NC}"
    echo -e "${GREEN}The Modern Digital Accountant system is working correctly.${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. The MDA system may need attention.${NC}"
    exit 1
fi
