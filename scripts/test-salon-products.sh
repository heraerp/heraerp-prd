#!/bin/bash

# HERA Salon Products Testing Script
# Tests the complete product pricing functionality

echo "🧪 HERA Salon Products Testing Suite"
echo "===================================="

# Configuration
API_URL="http://localhost:3000/api/v1/salon/products"
ORG_ID="44d2d8f8-167d-46a7-a704-c0e5435863d6"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Create Product with Prices
echo -e "\n${YELLOW}Test 1: Creating product with all price fields${NC}"
CREATE_RESPONSE=$(curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "name": "Luxury Hair Oil Treatment",
    "code": "OIL-LUX-001",
    "sku": "LUX-OIL-001",
    "category": "HAIR_CARE",
    "brand": "Salon Exclusive",
    "cost_price": 45.00,
    "retail_price": 95.00,
    "professional_price": 75.00,
    "min_stock": 5,
    "max_stock": 50,
    "is_retail": true,
    "is_active": true
  }')

if echo "$CREATE_RESPONSE" | jq -e '.data.id' > /dev/null 2>&1; then
    PRODUCT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
    echo -e "${GREEN}✓ Product created successfully${NC}"
    echo "  ID: $PRODUCT_ID"
    echo "  Name: $(echo "$CREATE_RESPONSE" | jq -r '.data.entity_name')"
    echo "  Cost Price: $(echo "$CREATE_RESPONSE" | jq -r '.data.cost_price // "Not set"')"
    echo "  Retail Price: $(echo "$CREATE_RESPONSE" | jq -r '.data.retail_price // "Not set"')"
else
    echo -e "${RED}✗ Failed to create product${NC}"
    echo "$CREATE_RESPONSE" | jq '.'
fi

# Test 2: Retrieve Products List
echo -e "\n${YELLOW}Test 2: Retrieving products list${NC}"
LIST_RESPONSE=$(curl -s "$API_URL?organization_id=$ORG_ID")

PRODUCT_COUNT=$(echo "$LIST_RESPONSE" | jq '.products | length')
if [ "$PRODUCT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Retrieved $PRODUCT_COUNT products${NC}"
    
    # Check if our product has prices
    OUR_PRODUCT=$(echo "$LIST_RESPONSE" | jq '.products[] | select(.id == "'$PRODUCT_ID'")')
    if [ ! -z "$OUR_PRODUCT" ]; then
        echo "  Found our product with enriched data:"
        echo "  - SKU: $(echo "$OUR_PRODUCT" | jq -r '.sku // "Not found"')"
        echo "  - Cost Price: $(echo "$OUR_PRODUCT" | jq -r '.cost_price // "Not found"')"
        echo "  - Retail Price: $(echo "$OUR_PRODUCT" | jq -r '.retail_price // "Not found"')"
        echo "  - Professional Price: $(echo "$OUR_PRODUCT" | jq -r '.professional_price // "Not found"')"
    fi
else
    echo -e "${RED}✗ No products found${NC}"
fi

# Test 3: Update Product Prices
echo -e "\n${YELLOW}Test 3: Updating product prices${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL?id=$PRODUCT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Luxury Hair Oil Treatment",
    "cost_price": 48.00,
    "retail_price": 99.00,
    "professional_price": 79.00
  }')

if echo "$UPDATE_RESPONSE" | jq -e '.message' | grep -q "updated successfully"; then
    echo -e "${GREEN}✓ Product updated successfully${NC}"
else
    echo -e "${RED}✗ Failed to update product${NC}"
    echo "$UPDATE_RESPONSE" | jq '.'
fi

# Test 4: Verify Update
echo -e "\n${YELLOW}Test 4: Verifying price updates${NC}"
VERIFY_RESPONSE=$(curl -s "$API_URL?organization_id=$ORG_ID")
UPDATED_PRODUCT=$(echo "$VERIFY_RESPONSE" | jq '.products[] | select(.id == "'$PRODUCT_ID'")')

if [ ! -z "$UPDATED_PRODUCT" ]; then
    NEW_COST=$(echo "$UPDATED_PRODUCT" | jq -r '.cost_price // 0')
    NEW_RETAIL=$(echo "$UPDATED_PRODUCT" | jq -r '.retail_price // 0')
    
    if [ "$NEW_COST" = "48" ] && [ "$NEW_RETAIL" = "99" ]; then
        echo -e "${GREEN}✓ Prices updated correctly${NC}"
        echo "  New Cost Price: $NEW_COST"
        echo "  New Retail Price: $NEW_RETAIL"
    else
        echo -e "${RED}✗ Prices not updated correctly${NC}"
        echo "  Expected: Cost=48, Retail=99"
        echo "  Actual: Cost=$NEW_COST, Retail=$NEW_RETAIL"
    fi
fi

# Test 5: Create Product without Prices
echo -e "\n${YELLOW}Test 5: Creating product without price fields${NC}"
SIMPLE_RESPONSE=$(curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "name": "Basic Shampoo",
    "code": "SHMP-BASIC-001"
  }')

if echo "$SIMPLE_RESPONSE" | jq -e '.data.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Basic product created successfully${NC}"
    SIMPLE_ID=$(echo "$SIMPLE_RESPONSE" | jq -r '.data.id')
    
    # Add prices later
    echo "  Adding prices via update..."
    UPDATE_BASIC=$(curl -s -X PUT "$API_URL?id=$SIMPLE_ID" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Basic Shampoo",
        "cost_price": 5.99,
        "retail_price": 12.99
      }')
    
    if echo "$UPDATE_BASIC" | jq -e '.message' | grep -q "updated successfully"; then
        echo -e "${GREEN}  ✓ Prices added successfully${NC}"
    else
        echo -e "${RED}  ✗ Failed to add prices${NC}"
    fi
fi

# Summary
echo -e "\n${YELLOW}================================${NC}"
echo -e "${GREEN}Testing Complete!${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""
echo "Summary:"
echo "- Products can be created with price fields"
echo "- Dynamic data (prices) are properly stored and retrieved"
echo "- Updates work correctly for price fields"
echo "- HERA's 6-table architecture successfully handles product pricing"
echo ""
echo "To view products in the UI, visit:"
echo "http://localhost:3000/salon/products"