#!/bin/bash

echo "Testing HERA MCP API Endpoints"
echo "=============================="

# Base URL
BASE_URL="http://localhost:3000"

# Test organization ID (replace with your actual org ID)
ORG_ID="550e8400-e29b-41d4-a716-446655440000"

echo -e "\n1. Testing Health Check..."
curl -X GET $BASE_URL/health

echo -e "\n\n2. Testing Chat Endpoint..."
curl -X POST $BASE_URL/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a new customer named John Smith",
    "organizationId": "'$ORG_ID'"
  }'

echo -e "\n\n3. Testing Query Endpoint..."
curl -X POST $BASE_URL/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "table": "core_entities",
    "organizationId": "'$ORG_ID'",
    "filters": {
      "entity_type": "customer"
    }
  }'

echo -e "\n\n4. Testing Create Endpoint..."
curl -X POST $BASE_URL/api/create \
  -H "Content-Type: application/json" \
  -d '{
    "type": "customer",
    "organizationId": "'$ORG_ID'",
    "data": {
      "name": "Test Customer",
      "email": "test@example.com",
      "phone": "+1234567890"
    }
  }'

echo -e "\n\n5. Testing Execute Endpoint (Daily Summary)..."
curl -X POST $BASE_URL/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "daily_summary",
    "organizationId": "'$ORG_ID'"
  }'

echo -e "\n\nDone!"