#!/bin/bash
# Deploy the fixed hera_org_set_default_app_v1 function to Supabase

echo "🚀 Deploying hera_org_set_default_app_v1 Bug Fix"
echo "================================================"
echo ""
echo "Bug: REGEXP_REPLACE not extracting smart code segment correctly"
echo "Fix: Use split_part('.', '.', 5) instead"
echo ""

# Check if SUPABASE_URL is set
if [ -z "$SUPABASE_URL" ]; then
  echo "❌ ERROR: SUPABASE_URL not set in environment"
  echo "   Please set SUPABASE_URL in .env file"
  exit 1
fi

echo "📡 Target: $SUPABASE_URL"
echo ""

# Read the SQL file
SQL_FILE="../db/rpc/hera_org_set_default_app_v1_FIXED.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ ERROR: SQL file not found: $SQL_FILE"
  exit 1
fi

echo "📄 SQL File: $SQL_FILE"
echo ""
echo "Deployment Options:"
echo "  1. Deploy via Supabase Dashboard (Manual)"
echo "  2. Deploy via psql (if configured)"
echo ""
echo "Option 1: Supabase Dashboard"
echo "----------------------------"
echo "1. Go to: $SUPABASE_URL"
echo "2. Navigate to: SQL Editor"
echo "3. Copy the contents of: $SQL_FILE"
echo "4. Paste into SQL Editor"
echo "5. Click: Run"
echo ""
echo "Option 2: psql (if configured)"
echo "------------------------------"
echo "Run: psql \$DATABASE_URL < $SQL_FILE"
echo ""
echo "✅ After deployment, run test:"
echo "   cd /home/san/PRD/heraerp-dev/mcp-server"
echo "   node test-app-management-rpcs-v2.mjs"
echo ""
echo "Expected result:"
echo "   ✅ PASS hera_org_set_default_app_v1 - Set default app to SALON"
echo ""
