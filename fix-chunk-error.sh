#!/bin/bash

# Fix ChunkLoadError script for HERA ERP
echo "🔧 Fixing ChunkLoadError for audit module..."

# 1. Stop any running dev server
echo "1️⃣ Stopping any running processes..."
pkill -f "next dev" || true
pkill -f "npm run dev" || true

# 2. Clear Next.js cache
echo "2️⃣ Clearing Next.js cache..."
rm -rf .next

# 3. Clear npm/node cache
echo "3️⃣ Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# 4. Clear browser storage (instructions)
echo "4️⃣ Clear browser cache:"
echo "   • Press Ctrl+Shift+R (or Cmd+Shift+R on Mac) to hard refresh"
echo "   • Or open DevTools > Application > Storage > Clear site data"

# 5. Rebuild the project
echo "5️⃣ Rebuilding project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "6️⃣ Starting development server..."
    echo "🚀 Open http://localhost:3000/audit in a new incognito window"
    echo ""
    echo "If you still get ChunkLoadError:"
    echo "  1. Open browser DevTools (F12)"
    echo "  2. Go to Application > Storage > Clear site data"
    echo "  3. Hard refresh with Ctrl+Shift+R"
    echo ""
    npm run dev
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi