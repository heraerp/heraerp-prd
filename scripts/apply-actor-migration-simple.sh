#!/bin/bash

# HERA v2.2 Actor Migration - Simplified Apply Script
# ===================================================

set -e

echo "🚀 HERA v2.2 Actor Migration - Starting..."
echo "==========================================="

# Check if required files exist
if [ ! -f "database/functions/organizations/resolve-user-identity-rpc.sql" ]; then
    echo "❌ Error: Required SQL files not found"
    echo "Make sure you're in the project root directory"
    exit 1
fi

echo "📋 Phase 1: Core RPC Functions"
echo "-------------------------------"

# Deploy resolve_user_identity_v1 function
echo "📄 Deploying user identity resolution functions..."
node scripts/run-sql-file.mjs database/functions/organizations/resolve-user-identity-rpc.sql

# Deploy fixed user assignment functions
echo "📄 Deploying user assignment functions..."
node scripts/run-sql-file.mjs database/functions/organizations/user-assignment-rpcs.sql

# Deploy auth fix functions
echo "📄 Deploying auth helper functions..."
node scripts/run-sql-file.mjs database/deploy/user-auth-fix.sql

echo ""
echo "📋 Phase 2: Actor-Stamped RPC Functions"
echo "---------------------------------------"

# Deploy actor-stamped CRUD functions
if [ -f "database/functions/actor-crud/hera-entities-crud-v2.sql" ]; then
    echo "📄 Deploying hera_entities_crud_v2..."
    node scripts/run-sql-file.mjs database/functions/actor-crud/hera-entities-crud-v2.sql
else
    echo "⚠️  Actor CRUD functions not found, skipping..."
fi

# Deploy transaction posting with actor stamping
if [ -f "database/functions/actor-crud/hera-transactions-post-v2.sql" ]; then
    echo "📄 Deploying hera_transactions_post_v2..."
    node scripts/run-sql-file.mjs database/functions/actor-crud/hera-transactions-post-v2.sql
else
    echo "⚠️  Transaction posting functions not found, skipping..."
fi

echo ""
echo "📋 Phase 3: Guardrails & Validation"
echo "-----------------------------------"

# Deploy guardrail functions
if [ -f "database/functions/guardrails/actor-validation.sql" ]; then
    echo "📄 Deploying actor validation functions..."
    node scripts/run-sql-file.mjs database/functions/guardrails/actor-validation.sql
else
    echo "⚠️  Actor validation functions not found, skipping..."
fi

# Deploy schema validation
if [ -f "database/functions/guardrails/schema-validation.sql" ]; then
    echo "📄 Deploying schema validation..."
    node scripts/run-sql-file.mjs database/functions/guardrails/schema-validation.sql
else
    echo "⚠️  Schema validation functions not found, skipping..."
fi

echo ""
echo "🎉 Migration Applied Successfully!"
echo "================================="
echo ""
echo "Next Steps:"
echo "1. Test the new functions: node scripts/fix-user-organization-membership.mjs"
echo "2. Run backfill script: ./scripts/backfill-audit-columns.sh $DEFAULT_ORGANIZATION_ID"
echo "3. Verify coverage: ./scripts/verify-actor-coverage.sh $DEFAULT_ORGANIZATION_ID" 
echo "4. Enable hardening: ./scripts/enable-hardening-triggers.sh"
echo ""
echo "🚨 Important: Test thoroughly before enabling production features!"