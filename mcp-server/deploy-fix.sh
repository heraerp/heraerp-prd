#!/bin/bash
set -e

echo "🚀 Deploying hera_txn_query_v1 fix to Supabase..."
echo ""

# Check if DATABASE_URL exists
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not found in environment"
  echo "📋 Please deploy manually:"
  echo "   1. Open Supabase Dashboard: https://supabase.com/dashboard/project/qqagokigwuujyeyrgdkq/sql"
  echo "   2. Create new query"
  echo "   3. Paste SQL from: ./fix-hera-txn-query-v1-full-projection.sql"
  echo "   4. Click 'Run'"
  exit 0
fi

# Deploy using psql
echo "📡 Connecting to Supabase PostgreSQL..."
psql "$DATABASE_URL" < ./fix-hera-txn-query-v1-full-projection.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Function deployed successfully!"
  echo ""
  echo "🔍 Testing updated function..."
  node test-rpc-query.mjs
else
  echo ""
  echo "❌ Deployment failed"
  exit 1
fi
