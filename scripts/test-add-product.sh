#!/bin/bash

# Test adding a product to salon inventory

echo "🧪 Testing Add Product to Salon Inventory"
echo "========================================="

# Get the organization ID from env
ORG_ID=$(grep DEFAULT_ORGANIZATION_ID .env | cut -d '=' -f2)
echo "Using Organization ID: $ORG_ID"

# Check if dev server is running by testing the health endpoint
echo -e "\n1️⃣ Checking if dev server is running..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    PORT=3000
    echo "   ✅ Dev server found on port 3000"
elif curl -s http://localhost:3003/api/health > /dev/null; then
    PORT=3003
    echo "   ✅ Dev server found on port 3003"
else
    echo "   ❌ Dev server not running. Please run: npm run dev"
    exit 1
fi

BASE_URL="http://localhost:$PORT"

# Test product data
echo -e "\n2️⃣ Creating test product..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/salon/products?organization_id=$ORG_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_name": "Kerastase Elixir Ultime",
    "entity_type": "product",
    "entity_code": "KER-ELIXIR-001",
    "smart_code": "HERA.SALON.PRODUCT.INVENTORY.v1",
    "metadata": {
      "category": "Hair Care",
      "sku": "KER-ELIXIR-001",
      "description": "Beautifying oil for all hair types"
    },
    "dynamic_fields": {
      "price": 58.00,
      "cost": 29.00,
      "stock_quantity": 20,
      "reorder_point": 5,
      "supplier": "Kerastase Professional"
    }
  }')

# Check if successful
if echo "$RESPONSE" | grep -q "error"; then
    echo "   ❌ Failed to create product:"
    echo "$RESPONSE" | jq .
else
    echo "   ✅ Product created successfully!"
fi

# Fetch all products
echo -e "\n3️⃣ Fetching products list..."
PRODUCTS=$(curl -s "$BASE_URL/api/v1/salon/products?organization_id=$ORG_ID")

if echo "$PRODUCTS" | grep -q "products"; then
    COUNT=$(echo "$PRODUCTS" | jq '.products | length')
    echo "   ✅ Found $COUNT products in inventory"
    
    # Show last 3 products
    echo -e "\n📦 Latest products:"
    echo "$PRODUCTS" | jq '.products[-3:] | .[] | {name: .entity_name, sku: .entity_code, stock: .stock_quantity, price: .price}'
else
    echo "   ❌ Failed to fetch products"
    echo "$PRODUCTS" | jq .
fi

echo -e "\n✨ Test complete!"
echo "📱 Visit $BASE_URL/org/salon/inventory to see the inventory page"