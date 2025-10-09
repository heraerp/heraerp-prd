#\!/bin/bash

# HERA MDA System Smoke Test with cURL
# Tests all major posting scenarios and validates system functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3000"
ORG_ID="demo-salon-org-uuid"
API_VERSION="v2"
AUTH_TOKEN="Bearer demo-token-salon-manager"
TEST_DATE=$(date +%Y-%m-%d)

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}🧪 HERA MDA System Smoke Test${NC}"
echo -e "${BLUE}======================================${NC}"
echo "API Base: $API_BASE"
echo "Organization: $ORG_ID"
echo "Test Date: $TEST_DATE"
echo ""

# Function to run a test
run_test() {
    local test_name="$1"
    local curl_command="$2"
    local expected_status="$3"
    
    echo -e "${YELLOW}🔍 Testing: $test_name${NC}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Execute curl command and capture response
    response=$(eval $curl_command 2>/dev/null || echo "CURL_ERROR")
    curl_exit_code=$?
    
    if [ "$response" = "CURL_ERROR" ] || [ $curl_exit_code -ne 0 ]; then
        echo -e "${RED}   ❌ FAIL: Network/Connection Error${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
    
    # Check if response contains success indicator
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}   ✅ PASS: API call successful${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        # Extract transaction ID if present
        if echo "$response" | grep -q '"transaction_id"'; then
            txn_id=$(echo "$response" | grep -o '"transaction_id":"[^"]*"' | cut -d'"' -f4)
            echo -e "${GREEN}   📄 Transaction ID: $txn_id${NC}"
        fi
        
        return 0
    else
        echo -e "${RED}   ❌ FAIL: API returned error${NC}"
        echo -e "${RED}   📝 Response: $(echo "$response" | head -c 200)...${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Test 1: Health Check (if available)
echo -e "\n${BLUE}1. System Health Check${NC}"
run_test "API Health Check" \
    "curl -s -X GET '$API_BASE/api/health' -H 'Content-Type: application/json'" \
    200

# Test 2: Expense Posting - Salary
echo -e "\n${BLUE}2. Expense Posting Tests${NC}"
run_test "Salary Expense Posting" \
    "curl -s -X POST '$API_BASE/api/v2/transactions/post' \
    -H 'Content-Type: application/json' \
    -H 'x-hera-api-version: v2' \
    -H 'Authorization: $AUTH_TOKEN' \
    -d '{
        \"apiVersion\": \"v2\",
        \"organization_id\": \"$ORG_ID\",
        \"transaction_type\": \"TX.FINANCE.EXPENSE.V1\",
        \"smart_code\": \"HERA.SALON.FINANCE.TXN.EXPENSE.SALARY.V1\",
        \"transaction_date\": \"$TEST_DATE\",
        \"total_amount\": 12000,
        \"transaction_currency_code\": \"AED\",
        \"base_currency_code\": \"AED\",
        \"exchange_rate\": 1.0,
        \"business_context\": {
            \"channel\": \"MANUAL\",
            \"note\": \"Smoke test salary posting\",
            \"category\": \"Payroll\"
        },
        \"metadata\": {
            \"ingest_source\": \"Smoke_Test\",
            \"original_ref\": \"SMOKE-SALARY-'$(date +%s)'\"
        },
        \"lines\": []
    }'" \
    200

run_test "Rent Expense Posting" \
    "curl -s -X POST '$API_BASE/api/v2/transactions/post' \
    -H 'Content-Type: application/json' \
    -H 'x-hera-api-version: v2' \
    -H 'Authorization: $AUTH_TOKEN' \
    -d '{
        \"apiVersion\": \"v2\",
        \"organization_id\": \"$ORG_ID\",
        \"transaction_type\": \"TX.FINANCE.EXPENSE.V1\",
        \"smart_code\": \"HERA.SALON.FINANCE.TXN.EXPENSE.RENT.V1\",
        \"transaction_date\": \"$TEST_DATE\",
        \"total_amount\": 8500,
        \"transaction_currency_code\": \"AED\",
        \"base_currency_code\": \"AED\",
        \"exchange_rate\": 1.0,
        \"business_context\": {
            \"channel\": \"BANK\",
            \"note\": \"October rent payment\",
            \"category\": \"Rent\"
        },
        \"metadata\": {
            \"ingest_source\": \"Smoke_Test\",
            \"original_ref\": \"SMOKE-RENT-'$(date +%s)'\"
        },
        \"lines\": []
    }'" \
    200

run_test "Supplies Expense with VAT" \
    "curl -s -X POST '$API_BASE/api/v2/transactions/post' \
    -H 'Content-Type: application/json' \
    -H 'x-hera-api-version: v2' \
    -H 'Authorization: $AUTH_TOKEN' \
    -d '{
        \"apiVersion\": \"v2\",
        \"organization_id\": \"$ORG_ID\",
        \"transaction_type\": \"TX.FINANCE.EXPENSE.V1\",
        \"smart_code\": \"HERA.SALON.FINANCE.TXN.EXPENSE.SUPPLIES.V1\",
        \"transaction_date\": \"$TEST_DATE\",
        \"total_amount\": 1050,
        \"transaction_currency_code\": \"AED\",
        \"base_currency_code\": \"AED\",
        \"exchange_rate\": 1.0,
        \"business_context\": {
            \"channel\": \"MANUAL\",
            \"note\": \"Hair products purchase\",
            \"category\": \"Supplies\",
            \"vat_inclusive\": true
        },
        \"metadata\": {
            \"ingest_source\": \"Smoke_Test\",
            \"original_ref\": \"SMOKE-SUPPLIES-'$(date +%s)'\"
        },
        \"lines\": []
    }'" \
    200

# Test 3: Revenue Posting
echo -e "\n${BLUE}3. Revenue Posting Tests${NC}"
run_test "Service Revenue with VAT" \
    "curl -s -X POST '$API_BASE/api/v2/transactions/post' \
    -H 'Content-Type: application/json' \
    -H 'x-hera-api-version: v2' \
    -H 'Authorization: $AUTH_TOKEN' \
    -d '{
        \"apiVersion\": \"v2\",
        \"organization_id\": \"$ORG_ID\",
        \"transaction_type\": \"TX.FINANCE.REVENUE.V1\",
        \"smart_code\": \"HERA.SALON.FINANCE.TXN.REVENUE.SERVICE.V1\",
        \"transaction_date\": \"$TEST_DATE\",
        \"total_amount\": 420,
        \"transaction_currency_code\": \"AED\",
        \"base_currency_code\": \"AED\",
        \"exchange_rate\": 1.0,
        \"business_context\": {
            \"channel\": \"POS\",
            \"note\": \"Hair styling service\",
            \"category\": \"Service\",
            \"vat_inclusive\": true
        },
        \"metadata\": {
            \"ingest_source\": \"Smoke_Test\",
            \"original_ref\": \"SMOKE-SERVICE-'$(date +%s)'\"
        },
        \"lines\": []
    }'" \
    200

run_test "Product Revenue with VAT" \
    "curl -s -X POST '$API_BASE/api/v2/transactions/post' \
    -H 'Content-Type: application/json' \
    -H 'x-hera-api-version: v2' \
    -H 'Authorization: $AUTH_TOKEN' \
    -d '{
        \"apiVersion\": \"v2\",
        \"organization_id\": \"$ORG_ID\",
        \"transaction_type\": \"TX.FINANCE.REVENUE.V1\",
        \"smart_code\": \"HERA.SALON.FINANCE.TXN.REVENUE.PRODUCT.V1\",
        \"transaction_date\": \"$TEST_DATE\",
        \"total_amount\": 157.50,
        \"transaction_currency_code\": \"AED\",
        \"base_currency_code\": \"AED\",
        \"exchange_rate\": 1.0,
        \"business_context\": {
            \"channel\": \"POS\",
            \"note\": \"Hair care products\",
            \"category\": \"Product\",
            \"vat_inclusive\": true
        },
        \"metadata\": {
            \"ingest_source\": \"Smoke_Test\",
            \"original_ref\": \"SMOKE-PRODUCT-'$(date +%s)'\"
        },
        \"lines\": []
    }'" \
    200

# Test 4: Bank Operations
echo -e "\n${BLUE}4. Bank Operations Tests${NC}"
run_test "Bank Fee Posting" \
    "curl -s -X POST '$API_BASE/api/v2/transactions/post' \
    -H 'Content-Type: application/json' \
    -H 'x-hera-api-version: v2' \
    -H 'Authorization: $AUTH_TOKEN' \
    -d '{
        \"apiVersion\": \"v2\",
        \"organization_id\": \"$ORG_ID\",
        \"transaction_type\": \"TX.FINANCE.BANK_FEE.V1\",
        \"smart_code\": \"HERA.SALON.FINANCE.TXN.BANK.FEE.V1\",
        \"transaction_date\": \"$TEST_DATE\",
        \"total_amount\": 35,
        \"transaction_currency_code\": \"AED\",
        \"base_currency_code\": \"AED\",
        \"exchange_rate\": 1.0,
        \"business_context\": {
            \"channel\": \"BANK\",
            \"note\": \"Monthly bank charges\",
            \"category\": \"BankFees\"
        },
        \"metadata\": {
            \"ingest_source\": \"Smoke_Test\",
            \"original_ref\": \"SMOKE-BANKFEE-'$(date +%s)'\"
        },
        \"lines\": []
    }'" \
    200

run_test "Bank Transfer" \
    "curl -s -X POST '$API_BASE/api/v2/transactions/post' \
    -H 'Content-Type: application/json' \
    -H 'x-hera-api-version: v2' \
    -H 'Authorization: $AUTH_TOKEN' \
    -d '{
        \"apiVersion\": \"v2\",
        \"organization_id\": \"$ORG_ID\",
        \"transaction_type\": \"TX.FINANCE.BANK_TRANSFER.V1\",
        \"smart_code\": \"HERA.SALON.FINANCE.TXN.BANK.TRANSFER.V1\",
        \"transaction_date\": \"$TEST_DATE\",
        \"total_amount\": 2500,
        \"transaction_currency_code\": \"AED\",
        \"base_currency_code\": \"AED\",
        \"exchange_rate\": 1.0,
        \"business_context\": {
            \"channel\": \"BANK\",
            \"note\": \"Inter-bank transfer\",
            \"category\": \"Transfer\"
        },
        \"metadata\": {
            \"ingest_source\": \"Smoke_Test\",
            \"original_ref\": \"SMOKE-TRANSFER-'$(date +%s)'\"
        },
        \"lines\": []
    }'" \
    200

# Test 5: Error Handling
echo -e "\n${BLUE}5. Error Handling Tests${NC}"
echo -e "${YELLOW}🔍 Testing: Invalid Organization ID${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
response=$(curl -s -X POST "$API_BASE/api/v2/transactions/post" \
    -H 'Content-Type: application/json' \
    -H 'x-hera-api-version: v2' \
    -H "Authorization: $AUTH_TOKEN" \
    -d '{
        "apiVersion": "v2",
        "organization_id": "invalid-org-id",
        "transaction_type": "TX.FINANCE.EXPENSE.V1",
        "smart_code": "HERA.SALON.FINANCE.TXN.EXPENSE.SALARY.V1",
        "transaction_date": "'$TEST_DATE'",
        "total_amount": 5000,
        "transaction_currency_code": "AED",
        "base_currency_code": "AED",
        "exchange_rate": 1.0,
        "business_context": {"channel": "MANUAL", "note": "Test"},
        "metadata": {"ingest_source": "Test"},
        "lines": []
    }' 2>/dev/null)

if echo "$response" | grep -q '"success":false'; then
    echo -e "${GREEN}   ✅ PASS: Correctly rejected invalid organization${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}   ❌ FAIL: Should have rejected invalid organization${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo -e "${YELLOW}🔍 Testing: Missing Required Headers${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
response=$(curl -s -X POST "$API_BASE/api/v2/transactions/post" \
    -H 'Content-Type: application/json' \
    -d '{"test": "missing headers"}' 2>/dev/null)

if echo "$response" | grep -q -i "api.version\|authorization"; then
    echo -e "${GREEN}   ✅ PASS: Correctly rejected missing headers${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}   ❌ FAIL: Should have rejected missing headers${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 6: System Status
echo -e "\n${BLUE}6. System Status Check${NC}"
run_test "Accountant Dashboard Access" \
    "curl -s -X GET '$API_BASE/accountant' \
    -H 'Accept: text/html'" \
    200

# Final Summary
echo -e "\n${BLUE}🏁 Smoke Test Summary${NC}"
echo -e "${BLUE}========================${NC}"
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}✅ Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED\! MDA system is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the errors above.${NC}"
    exit 1
fi
EOF < /dev/null