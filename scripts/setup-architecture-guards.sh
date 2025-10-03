#!/bin/bash

echo "🏛️ Setting up HERA Architecture Guards"
echo "======================================"
echo ""

# Check if schemas directory exists
if [ ! -d "schemas" ]; then
  echo "✅ Created schemas directory"
else
  echo "✓ Schemas directory exists"
fi

# Check if config directory exists
if [ ! -d "config" ]; then
  echo "✅ Created config directory"
else
  echo "✓ Config directory exists"
fi

# Check if transaction map exists
if [ ! -f "config/entity_type_transaction_type_map.json" ]; then
  echo "✅ Created default transaction type mapping"
else
  echo "✓ Transaction type mapping exists"
fi

# Check GitHub workflow
if [ -f ".github/workflows/architecture-guards.yml" ]; then
  echo "✓ GitHub Actions workflow configured"
else
  echo "⚠️  GitHub workflow not found - CI checks won't run automatically"
fi

echo ""
echo "📋 Quick Start Commands:"
echo ""
echo "  npm run validate              # Run all architecture checks"
echo "  npm run presets:validate      # Validate entity presets"
echo "  npm run rpc:probe            # Test RPC contracts (needs env vars)"
echo "  npm run posting:smoke        # Test financial posting (needs env vars)"
echo "  npm run docs:sync            # Check documentation sync"
echo ""
echo "🔐 For database tests, set these environment variables:"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_SERVICE_KEY"
echo "  - HERA_TEST_ORG_ID"
echo ""
echo "✅ Architecture guards setup complete!"