#!/bin/bash

echo "🧹 HERA Complete Cleanup Script"
echo "==============================="
echo ""

# Stop any running dev server
echo "1️⃣ Stopping any running dev servers..."
pkill -f "next dev" || echo "   No dev server running"

# Clear Next.js cache
echo "2️⃣ Clearing Next.js cache..."
rm -rf .next

# Clear node_modules cache
echo "3️⃣ Clearing node_modules cache..."
rm -rf node_modules/.cache

# Clear any temp files
echo "4️⃣ Clearing temp files..."
rm -rf .swc
rm -rf .turbo

# Reinstall dependencies
echo "5️⃣ Reinstalling dependencies..."
npm install

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📋 Now do these manual steps:"
echo "1. Open Chrome and go to: chrome://settings/content/all"
echo "2. Find 'localhost:3000' and click 'Delete data'"
echo "3. Or open DevTools > Application > Storage > Clear site data"
echo ""
echo "Then run: npm run dev"
echo ""