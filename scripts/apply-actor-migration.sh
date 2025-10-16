#!/bin/bash

# HERA v2.2 Actor Migration - Apply Script
# ========================================

set -e  # Exit on any error

echo "🚀 HERA v2.2 Actor Migration - Starting..."
echo "==========================================="

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Check required environment variables
if [ -z "$DATABASE_URL" ] && [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL required"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY required"
    exit 1
fi

# Function to run SQL file
run_sql() {
    local file=$1
    local description=$2
    
    echo "📄 $description..."
    
    if [ ! -f "$file" ]; then
        echo "❌ Error: SQL file not found: $file"
        exit 1
    fi
    
    if [ -n "$DATABASE_URL" ]; then
        # Using psql with DATABASE_URL
        psql "$DATABASE_URL" -f "$file"
    else
        # Using Node.js script for Supabase
        node -e "
        const { createClient } = require('@supabase/supabase-js');
        const fs = require('fs');
        
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        const sql = fs.readFileSync('$file', 'utf8');
        
        (async () => {
            console.log('Executing: $file');
            const { error } = await supabase.rpc('exec_sql', { sql_text: sql });
            if (error) {
                console.error('Error:', error);
                process.exit(1);
            }
            console.log('✅ Success');
        })();
        "
    fi
    
    echo "✅ $description completed"
}

echo "📋 Phase 1: Core RPC Functions"
echo "-------------------------------"

# Deploy resolve_user_identity_v1 function
run_sql "database/functions/organizations/resolve-user-identity-rpc.sql" "Deploy user identity resolution functions"

# Deploy fixed user assignment functions
run_sql "database/functions/organizations/user-assignment-rpcs.sql" "Deploy user assignment functions"

# Deploy auth fix functions
run_sql "database/deploy/user-auth-fix.sql" "Deploy auth helper functions"

echo ""
echo "📋 Phase 2: Actor-Stamped RPC Functions"
echo "---------------------------------------"

# Check if actor CRUD directory exists
if [ -d "database/functions/actor-crud" ]; then
    # Deploy actor-stamped CRUD functions
    run_sql "database/functions/actor-crud/hera-entities-crud-v2.sql" "Deploy hera_entities_crud_v2"
    
    # Deploy transaction posting with actor stamping
    run_sql "database/functions/actor-crud/hera-transactions-post-v2.sql" "Deploy hera_transactions_post_v2"
else
    echo "⚠️  Actor CRUD functions directory not found, skipping..."
fi

echo ""
echo "📋 Phase 3: Guardrails & Validation"
echo "-----------------------------------"

# Check if guardrails directory exists
if [ -d "database/functions/guardrails" ]; then
    # Deploy guardrail functions
    run_sql "database/functions/guardrails/actor-validation.sql" "Deploy actor validation functions"
    
    # Deploy schema validation
    run_sql "database/functions/guardrails/schema-validation.sql" "Deploy schema validation"
else
    echo "⚠️  Guardrails functions directory not found, skipping..."
fi

echo ""
echo "📋 Phase 4: Enable Feature Flags"
echo "--------------------------------"

# Enable actor resolution (safe to enable immediately)
./scripts/enable-feature-flag.sh actor_resolution_enabled

echo ""
echo "🎉 Migration Applied Successfully!"
echo "================================="
echo ""
echo "Next Steps:"
echo "1. Run backfill script: ./scripts/backfill-audit-columns.sh <TENANT_ORG_ID>"
echo "2. Enable actor stamping: ./scripts/enable-feature-flag.sh actor_stamping_enabled"
echo "3. Test endpoints with: ./scripts/test-actor-endpoints.sh"
echo "4. Verify coverage: ./scripts/verify-actor-coverage.sh <TENANT_ORG_ID>"
echo "5. Enable hardening: ./scripts/enable-hardening-triggers.sh"
echo ""
echo "🚨 Important: Test thoroughly before enabling actor_stamping_enabled!"