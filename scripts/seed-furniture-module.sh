#!/bin/bash

# Seed Furniture Module Data
# Usage: ./scripts/seed-furniture-module.sh [organization_id]

ORG_ID=${1:-""}

if [ -z "$ORG_ID" ]; then
  echo "Usage: ./scripts/seed-furniture-module.sh [organization_id]"
  echo "Please provide organization ID"
  exit 1
fi

echo "Seeding furniture module data for organization: $ORG_ID"

# Call the seed API
curl -X POST http://localhost:3000/api/v1/furniture/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"organization_id\": \"$ORG_ID\"}"

echo "\nFurniture module seed complete!"
echo "\nNext steps:"
echo "1. Visit http://localhost:3000/furniture to access the furniture module"
echo "2. Check http://localhost:3000/furniture/products/catalog for product catalog"
echo "3. Create sales orders at http://localhost:3000/furniture/sales/orders"