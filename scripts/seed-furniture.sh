#!/bin/bash

echo "🪑 Seeding Furniture Module Data..."
echo "=================================="

# Navigate to mcp-server directory
cd "$(dirname "$0")/../mcp-server" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Run the comprehensive furniture catalog seeder
echo ""
echo "📦 Seeding furniture catalog (14 products + materials)..."
node seed-furniture-catalog.js

echo ""
echo "✅ Furniture data seeding complete!"
echo ""
echo "🚀 You can now access the Product Catalog at:"
echo "   http://localhost:3000/furniture/products/catalog"
echo ""
echo "📋 Next steps:"
echo "   1. Start the development server: npm run dev"
echo "   2. Log in with your credentials"
echo "   3. Navigate to the Furniture module"
echo "   4. View the Product Catalog with all seeded products"