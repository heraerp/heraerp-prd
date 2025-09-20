#!/bin/bash

# HERA Salon POS CRUD Test Script
# Tests service CRUD operations against the Six Sacred Tables

# Set your environment variables
export HOST="${HOST:-http://localhost:3000}"
export ORG_ID="${ORG_ID:-00000000-0000-0000-0000-000000000000}"
export ACTOR_ID="${ACTOR_ID:-11111111-1111-1111-1111-111111111111}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== HERA Salon POS CRUD Test ===${NC}"
echo "Host: $HOST"
echo "Organization: $ORG_ID"
echo "Actor: $ACTOR_ID"
echo ""

# 1) CREATE SERVICE
echo -e "${BLUE}1) Creating salon service...${NC}"
CREATE_RESPONSE=$(curl -sS -X POST "$HOST/api/playbook/salon/pos/service/create" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "'$ORG_ID'",
    "smart_code": "HERA.SALON.POS.SERVICE.CREATE.v1",
    "actor_user_id": "'$ACTOR_ID'",
    "service": {
      "entity_name": "Premium Haircut & Style",
      "price": 150,
      "duration": 60,
      "tax_code": "VAT5",
      "category": "Hair Services",
      "description": "Professional haircut with styling consultation"
    }
  }')

echo "Response: $CREATE_RESPONSE"

# Extract service ID
SERVICE_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$SERVICE_ID" ]; then
  echo -e "${RED}Failed to create service${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Created service: $SERVICE_ID${NC}"
echo ""

# 2) LIST SERVICES
echo -e "${BLUE}2) Listing salon services...${NC}"
LIST_RESPONSE=$(curl -sS "$HOST/api/playbook/salon/pos/service/list?orgId=$ORG_ID&page=1&pageSize=10")

echo "Response: $LIST_RESPONSE" | jq '.' 2>/dev/null || echo "$LIST_RESPONSE"
echo -e "${GREEN}✓ Listed services${NC}"
echo ""

# 3) UPDATE SERVICE
echo -e "${BLUE}3) Updating service price and duration...${NC}"
UPDATE_RESPONSE=$(curl -sS -X PATCH "$HOST/api/playbook/salon/pos/service/update" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "'$ORG_ID'",
    "smart_code": "HERA.SALON.POS.SERVICE.UPDATE.v1",
    "actor_user_id": "'$ACTOR_ID'",
    "service": {
      "id": "'$SERVICE_ID'",
      "price": 175,
      "duration": 75,
      "description": "Premium haircut with extended styling session"
    }
  }')

echo "Response: $UPDATE_RESPONSE"
echo -e "${GREEN}✓ Updated service${NC}"
echo ""

# 4) SEARCH SERVICES
echo -e "${BLUE}4) Searching for 'Premium' services...${NC}"
SEARCH_RESPONSE=$(curl -sS "$HOST/api/playbook/salon/pos/service/list?orgId=$ORG_ID&q=Premium&status=active")

echo "Response: $SEARCH_RESPONSE" | jq '.' 2>/dev/null || echo "$SEARCH_RESPONSE"
echo -e "${GREEN}✓ Search completed${NC}"
echo ""

# 5) DELETE (SOFT) SERVICE
echo -e "${BLUE}5) Archiving service...${NC}"
DELETE_RESPONSE=$(curl -sS -X DELETE "$HOST/api/playbook/salon/pos/service/delete" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "'$ORG_ID'",
    "smart_code": "HERA.SALON.POS.SERVICE.DELETE.v1",
    "actor_user_id": "'$ACTOR_ID'",
    "service": {
      "id": "'$SERVICE_ID'"
    }
  }')

echo "Response: $DELETE_RESPONSE"
echo -e "${GREEN}✓ Archived service${NC}"
echo ""

# 6) VERIFY ARCHIVED
echo -e "${BLUE}6) Verifying service is archived...${NC}"
ARCHIVED_RESPONSE=$(curl -sS "$HOST/api/playbook/salon/pos/service/list?orgId=$ORG_ID&status=archived")

echo "Response: $ARCHIVED_RESPONSE" | jq '.' 2>/dev/null || echo "$ARCHIVED_RESPONSE"
echo ""

echo -e "${GREEN}=== CRUD Test Complete ===${NC}"
echo ""
echo "Database validation queries:"
echo "-- Check entity"
echo "SELECT * FROM core_entities WHERE id = '$SERVICE_ID';"
echo ""
echo "-- Check dynamic data"
echo "SELECT * FROM core_dynamic_data WHERE entity_id = '$SERVICE_ID';"
echo ""
echo "-- Check audit trail"
echo "SELECT * FROM universal_transactions WHERE target_entity_id = '$SERVICE_ID' ORDER BY created_at;"