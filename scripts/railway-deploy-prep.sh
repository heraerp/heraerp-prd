#!/bin/bash

echo "🚂 Railway Deployment Preparation Script"
echo "======================================="
echo ""

# 1. Run all fix scripts
echo "1️⃣ Running fix scripts..."
node scripts/fix-icon-imports.js
node scripts/fix-transaction-columns.js  
node scripts/fix-universal-api.js
node scripts/fix-date-fns-imports.js
node scripts/fix-deployment-issues.js

# 2. Clear caches
echo ""
echo "2️⃣ Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache

# 3. Install dependencies
echo ""
echo "3️⃣ Installing dependencies..."
npm install

# 4. Run pre-deployment validation
echo ""
echo "4️⃣ Running validation..."
npm run predeploy

# 5. Test build locally
echo ""
echo "5️⃣ Testing build..."
npm run build

echo ""
echo "✅ Railway deployment preparation complete!"
echo "📦 If build succeeded, run: git add -A && git commit -m 'chore: deployment prep' && git push"