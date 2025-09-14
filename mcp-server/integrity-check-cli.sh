#!/bin/bash
# Integrity check using HERA CLI tools

echo "=== SALON ERP INTEGRITY CHECKS ==="
echo ""

# Check 1: DEMO-SALON organization
echo "1. Checking DEMO-SALON organization..."
ORG_COUNT=$(node hera-cli.js query core_organizations organization_code:DEMO-SALON 2>/dev/null | grep -c "ID:")
echo "   DEMO-SALON organizations found: $ORG_COUNT"

# Get org ID if exists
if [ $ORG_COUNT -gt 0 ]; then
  ORG_ID=$(node hera-cli.js query core_organizations organization_code:DEMO-SALON 2>/dev/null | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)
  echo "   Organization ID: $ORG_ID"
  
  # Check entities in this org
  echo ""
  echo "2. Entities in DEMO-SALON:"
  export DEFAULT_ORGANIZATION_ID=$ORG_ID
  ENTITY_COUNT=$(node hera-cli.js query core_entities 2>/dev/null | grep -c "ID:")
  echo "   Total entities: $ENTITY_COUNT"
  
  # Check transactions in this org
  echo ""
  echo "3. Transactions in DEMO-SALON:"
  TX_COUNT=$(node hera-cli.js query universal_transactions 2>/dev/null | grep -c "ID:")
  echo "   Total transactions: $TX_COUNT"
  
  # Check for invalid smart codes
  echo ""
  echo "4. Smart code validation:"
  echo "   Checking entity smart codes..."
  INVALID_ENTITY_CODES=$(node hera-cli.js query core_entities 2>/dev/null | grep "Smart Code:" | grep -vE 'HERA\.[A-Z0-9]{3,15}(\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+' | wc -l)
  echo "   Invalid entity smart codes: $INVALID_ENTITY_CODES"
  
  echo "   Checking transaction smart codes..."
  INVALID_TX_CODES=$(node hera-cli.js query universal_transactions 2>/dev/null | grep "Smart Code:" | grep -vE 'HERA\.[A-Z0-9]{3,15}(\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+' | wc -l)
  echo "   Invalid transaction smart codes: $INVALID_TX_CODES"
  
  # Show sample data
  echo ""
  echo "5. Sample entities in DEMO-SALON:"
  node hera-cli.js query core_entities 2>/dev/null | grep -A 2 -E "(customer|stylist|service|product)" | head -20
  
else
  echo "   ❌ DEMO-SALON organization not found!"
fi

echo ""
echo "=== INTEGRITY CHECK SUMMARY ==="
echo "Expected results:"
echo "- DEMO-SALON org count: 1"
echo "- All smart codes should match pattern: HERA.XXX.YYY.ZZZ.v1"
echo "- No invalid smart codes (count = 0)"