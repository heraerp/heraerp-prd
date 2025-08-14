#!/bin/bash

# Simple CRM Test - Start with just organization and one contact
echo "🚀 Simple CRM Test - Organization + Contact"
echo "========================================"

BASE_URL="http://localhost:3000/api/v1"

echo ""
echo "1️⃣ Creating Organization..."

# Create organization first (required!)
ORG_RESPONSE=$(curl -s -X POST "$BASE_URL/organizations" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "Test Company",
    "organization_code": "TEST001",
    "organization_type": "business",
    "status": "active"
  }')

echo "Organization Response:"
echo "$ORG_RESPONSE" | jq '.'

# Get organization ID
ORG_ID=$(echo "$ORG_RESPONSE" | jq -r '.id')

if [ "$ORG_ID" = "null" ] || [ -z "$ORG_ID" ]; then
  echo "❌ Organization creation failed"
  exit 1
fi

echo ""
echo "✅ Organization ID: $ORG_ID"

echo ""
echo "2️⃣ Creating Contact..."

# Create a simple contact
CONTACT_RESPONSE=$(curl -s -X POST "$BASE_URL/entities" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "entity_type": "contact",
    "entity_name": "John Doe",
    "entity_code": "CONT_JOHN_DOE",
    "entity_category": "crm",
    "entity_subcategory": "prospect",
    "status": "active"
  }')

echo "Contact Response:"
echo "$CONTACT_RESPONSE" | jq '.'

CONTACT_ID=$(echo "$CONTACT_RESPONSE" | jq -r '.id')

if [ "$CONTACT_ID" = "null" ] || [ -z "$CONTACT_ID" ]; then
  echo "❌ Contact creation failed"
else
  echo ""
  echo "✅ Contact ID: $CONTACT_ID"
  
  echo ""
  echo "3️⃣ Adding Contact Email..."
  
  # Add email as dynamic data
  curl -s -X POST "$BASE_URL/dynamic-data" \
    -H "Content-Type: application/json" \
    -d '{
      "organization_id": "'$ORG_ID'",
      "entity_id": "'$CONTACT_ID'",
      "field_name": "email",
      "field_value": "john.doe@testcompany.com",
      "field_type": "text",
      "field_category": "contact_info"
    }' | jq '.'
  
  echo ""
  echo "✅ Simple CRM test complete!"
  echo "   Organization: Test Company ($ORG_ID)"
  echo "   Contact: John Doe ($CONTACT_ID)"
fi