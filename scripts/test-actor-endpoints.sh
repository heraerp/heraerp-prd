#!/bin/bash

# Test HERA v2.2 Actor-Enabled Endpoints
# ======================================

set -e

# Configuration
API_BASE_URL=${1:-"http://localhost:3000"}
TEST_ORG_ID=${2:-"f47ac10b-58cc-4372-a567-0e02b2c3d479"}
AUTH_TOKEN=${3:-"demo-token-salon-receptionist"}

if [ -z "$AUTH_TOKEN" ]; then
    echo "❌ Usage: $0 [API_BASE_URL] [TEST_ORG_ID] [AUTH_TOKEN]"
    echo ""
    echo "Example:"
    echo "  $0 http://localhost:3000 f47ac10b-58cc-4372-a567-0e02b2c3d479 demo-token-salon-receptionist"
    echo ""
    echo "This will test actor-enabled endpoints with the provided credentials."
    exit 1
fi

echo "🧪 HERA v2.2 Actor Endpoints Testing"
echo "===================================="
echo "API Base URL: $API_BASE_URL"
echo "Test Org ID: $TEST_ORG_ID"
echo "Auth Token: ${AUTH_TOKEN:0:20}..."
echo ""

# Function to make API request
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo "📡 Testing: $description"
    echo "   $method $endpoint"
    
    local curl_args=()
    curl_args+=(-s -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n")
    curl_args+=(-H "Authorization: Bearer $AUTH_TOKEN")
    curl_args+=(-H "Content-Type: application/json")
    curl_args+=(-H "X-Organization-Id: $TEST_ORG_ID")
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        curl_args+=(-d "$data")
    fi
    
    curl_args+=(-X "$method")
    curl_args+=("$API_BASE_URL$endpoint")
    
    echo "   Response:"
    local response=$(curl "${curl_args[@]}" 2>/dev/null)
    echo "$response" | jq . 2>/dev/null || echo "$response"
    echo ""
}

# Test 1: Auth Introspection
echo "🔐 Test 1: Authentication & Identity Resolution"
echo "----------------------------------------------"
api_request "GET" "/api/v2/auth/introspect" "" "Get current user identity"

# Test 2: Entity Creation with Actor
echo "🏗️  Test 2: Entity Creation with Actor Stamping"
echo "-----------------------------------------------"
ENTITY_PAYLOAD='{
  "entity_type": "customer",
  "entity_name": "Test Customer Actor",
  "entity_code": "CUST001",
  "description": "Test customer for actor validation",
  "metadata": {
    "test": true,
    "created_via": "actor_endpoint_test"
  }
}'

api_request "POST" "/api/v2/entities" "$ENTITY_PAYLOAD" "Create entity with actor stamping"

# Test 3: Transaction Creation with Actor
echo "💳 Test 3: Transaction Creation with Actor Stamping"
echo "--------------------------------------------------"
TRANSACTION_PAYLOAD='{
  "transaction_type": "sale",
  "transaction_number": "TXN-ACTOR-001",
  "description": "Test transaction for actor validation",
  "total_amount": 100.00,
  "currency": "USD",
  "metadata": {
    "test": true,
    "created_via": "actor_endpoint_test"
  },
  "lines": [
    {
      "line_description": "Test Line 1",
      "line_order": 1,
      "quantity": 1,
      "unit_price": 50.00,
      "line_amount": 50.00
    },
    {
      "line_description": "Test Line 2", 
      "line_order": 2,
      "quantity": 2,
      "unit_price": 25.00,
      "line_amount": 50.00
    }
  ]
}'

api_request "POST" "/api/v2/transactions" "$TRANSACTION_PAYLOAD" "Create transaction with actor stamping"

# Test 4: GL Transaction with Balance Validation
echo "📊 Test 4: GL Transaction with Balance Validation"
echo "------------------------------------------------"
GL_TRANSACTION_PAYLOAD='{
  "transaction_type": "journal_entry",
  "transaction_number": "JE-ACTOR-001",
  "description": "Test GL transaction for balance validation",
  "total_amount": 0.00,
  "currency": "USD",
  "metadata": {
    "test": true,
    "gl_test": true
  },
  "lines": [
    {
      "line_description": "Debit Account",
      "line_order": 1,
      "line_amount": 100.00,
      "gl_account_code": "1000"
    },
    {
      "line_description": "Credit Account",
      "line_order": 2, 
      "line_amount": -100.00,
      "gl_account_code": "2000"
    }
  ]
}'

api_request "POST" "/api/v2/transactions" "$GL_TRANSACTION_PAYLOAD" "Create balanced GL transaction"

# Test 5: Invalid Organization Access
echo "🚫 Test 5: Invalid Organization Access"
echo "------------------------------------"
INVALID_ORG_PAYLOAD='{
  "entity_type": "customer",
  "entity_name": "Unauthorized Customer",
  "entity_code": "UNAUTH001"
}'

# Override organization header with invalid org
echo "📡 Testing: Unauthorized organization access"
echo "   POST /api/v2/entities"
echo "   Response:"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: 99999999-9999-9999-9999-999999999999" \
  -d "$INVALID_ORG_PAYLOAD" \
  -X POST \
  "$API_BASE_URL/api/v2/entities" | jq . 2>/dev/null || echo "Response parsing failed"
echo ""

# Test 6: Unbalanced GL Transaction
echo "⚖️  Test 6: Unbalanced GL Transaction (Should Fail)"
echo "-------------------------------------------------"
UNBALANCED_GL_PAYLOAD='{
  "transaction_type": "journal_entry",
  "transaction_number": "JE-UNBALANCED-001",
  "description": "Intentionally unbalanced GL transaction",
  "total_amount": 0.00,
  "lines": [
    {
      "line_description": "Debit Account",
      "line_order": 1,
      "line_amount": 100.00,
      "gl_account_code": "1000"
    },
    {
      "line_description": "Credit Account (Unbalanced)",
      "line_order": 2,
      "line_amount": -95.00,
      "gl_account_code": "2000"
    }
  ]
}'

api_request "POST" "/api/v2/transactions" "$UNBALANCED_GL_PAYLOAD" "Create unbalanced GL transaction (should fail)"

# Test 7: Missing Smart Code
echo "🏷️  Test 7: Missing Smart Code (Should Fail)"
echo "-------------------------------------------"
NO_SMARTCODE_PAYLOAD='{
  "entity_type": "customer",
  "entity_name": "No Smart Code Customer"
}'

api_request "POST" "/api/v2/entities" "$NO_SMARTCODE_PAYLOAD" "Create entity without smart code (should fail)"

echo "📋 Test Results Summary"
echo "======================"
echo ""
echo "✅ Successful tests indicate:"
echo "   - Actor resolution working"
echo "   - Organization membership enforced"
echo "   - Audit stamping functional"
echo "   - GL balance validation active"
echo ""
echo "❌ Failed tests (with appropriate errors) indicate:"
echo "   - Unauthorized access blocked"
echo "   - Invalid transactions rejected"
echo "   - Schema validation enforced"
echo ""
echo "📊 Review HTTP status codes:"
echo "   - 200/201: Success"
echo "   - 400: Validation failure (expected for invalid requests)"
echo "   - 401: Authentication failure"
echo "   - 403: Authorization failure (expected for unauthorized access)"
echo ""
echo "🎯 All tests completed. Check responses for proper actor stamping and validation."