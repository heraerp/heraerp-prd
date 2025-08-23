#!/bin/bash

echo "Testing HERA MCP Server on Railway"
echo "=================================="

RAILWAY_URL="https://alluring-expression-production.up.railway.app"
ORG_ID="3df8cc52-3d81-42d5-b088-7736ae26cc7c"  # Mario's Restaurant

echo -e "\n1. Testing Health Check..."
curl -s $RAILWAY_URL/health | jq .

echo -e "\n\n2. Testing API Info..."
curl -s $RAILWAY_URL/ | jq .

echo -e "\n\n3. Testing Chat Endpoint..."
curl -s -X POST $RAILWAY_URL/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me all customers",
    "organizationId": "'$ORG_ID'"
  }' | jq .

echo -e "\n\n4. Testing Query Endpoint..."
curl -s -X POST $RAILWAY_URL/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "table": "core_entities",
    "organizationId": "'$ORG_ID'",
    "filters": {
      "entity_type": "customer"
    }
  }' | jq '.data | length'

echo -e "\n\nDeployment test complete!"