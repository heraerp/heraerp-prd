#!/bin/bash
# Finance DNA v2 - Journal Entry Creation via cURL
# Smart Code: HERA.ACCOUNTING.SAMPLE.CURL.JOURNAL.ENTRY.v2

# Set variables
API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api/v2}"
JWT_TOKEN="${JWT_TOKEN:-your-jwt-token-here}"
ORG_ID="${ORG_ID:-f47ac10b-58cc-4372-a567-0e02b2c3d479}"

echo "Creating journal entry via Finance DNA v2 API..."

# Create journal entry
response=$(curl -s -X POST "${API_BASE_URL}/transactions" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "x-hera-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "v2",
    "organizationId": "'${ORG_ID}'",
    "transactionType": "JOURNAL_ENTRY",
    "transactionCode": "JE-2025-001",
    "transactionDate": "2025-01-10",
    "smartCode": "HERA.ACCOUNTING.GL.TXN.JOURNAL.v2",
    "totalAmount": 1000.00,
    "currencyCode": "USD",
    "description": "Monthly office rent expense",
    "metadata": {
      "department": "Administration",
      "cost_center": "ADMIN-001",
      "reference_number": "RENT-JAN-2025"
    },
    "lineItems": [
      {
        "lineNumber": 1,
        "lineEntityId": "6100-expense-account-uuid",
        "lineType": "DEBIT",
        "debitAmount": 1000.00,
        "creditAmount": 0.00,
        "smartCode": "HERA.ACCOUNTING.GL.LINE.DEBIT.v2",
        "description": "Office rent expense - January 2025",
        "metadata": {
          "expense_category": "Facilities",
          "tax_deductible": true
        }
      },
      {
        "lineNumber": 2,
        "lineEntityId": "1100-cash-account-uuid",
        "lineType": "CREDIT",
        "debitAmount": 0.00,
        "creditAmount": 1000.00,
        "smartCode": "HERA.ACCOUNTING.GL.LINE.CREDIT.v2",
        "description": "Cash payment for rent",
        "metadata": {
          "payment_method": "Bank Transfer",
          "bank_reference": "TXN-20250110-001"
        }
      }
    ]
  }')

# Check response
if echo "$response" | grep -q '"success": true'; then
    echo "✅ Journal entry created successfully!"
    
    # Extract transaction ID
    transaction_id=$(echo "$response" | grep -o '"transactionId": "[^"]*"' | cut -d'"' -f4)
    echo "Transaction ID: $transaction_id"
    
    # Extract GL balance validation
    echo "GL Balance Validation:"
    echo "$response" | grep -A 5 '"glBalanceValidation"'
    
    # Extract audit trail
    echo "Audit Trail:"
    echo "$response" | grep -A 3 '"auditTrail"'
    
else
    echo "❌ Error creating journal entry:"
    echo "$response" | jq '.error' 2>/dev/null || echo "$response"
    exit 1
fi

# Optional: Retrieve the created transaction
echo ""
echo "Retrieving created transaction..."

retrieve_response=$(curl -s -X GET "${API_BASE_URL}/transactions/${transaction_id}?organizationId=${ORG_ID}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "x-hera-api-version: v2")

if echo "$retrieve_response" | grep -q '"success": true'; then
    echo "✅ Transaction retrieved successfully!"
    echo "$retrieve_response" | jq '.data' 2>/dev/null || echo "$retrieve_response"
else
    echo "⚠️ Could not retrieve transaction details"
fi

echo ""
echo "Finance DNA v2 journal entry creation completed!"
echo "Smart Code: HERA.ACCOUNTING.GL.TXN.JOURNAL.v2"