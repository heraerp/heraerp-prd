#!/bin/bash

# HERA v2.2 Actor Migration Rollback Script
# ==========================================

set -e

echo "🔄 HERA v2.2 Actor Migration Rollback"
echo "====================================="
echo ""

# Confirm rollback
echo "⚠️  WARNING: This will:"
echo "   - Disable all hardening triggers"
echo "   - Disable actor stamping feature flags"
echo "   - Preserve backfilled audit data (recommended)"
echo ""
echo "   Backfilled created_by/updated_by data will NOT be removed"
echo "   This preserves audit trail integrity"
echo ""

read -p "Are you sure you want to rollback the actor migration? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled"
    exit 0
fi

# Load environment variables
if [ -f .env ]; then
    source .env
fi

echo ""
echo "🚀 Starting rollback process..."

# Step 1: Disable hardening triggers
echo "📄 Step 1: Disable hardening triggers..."

if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" <<SQL
-- Disable all hardening triggers
SELECT hera_disable_hardening_triggers();
SQL
else
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    (async () => {
        const { error } = await supabase.rpc('hera_disable_hardening_triggers');
        if (error) {
            console.error('Error disabling triggers:', error);
            return;
        }
        console.log('✅ Hardening triggers disabled');
    })();
    "
fi

echo "✅ Hardening triggers disabled"

# Step 2: Disable feature flags
echo ""
echo "📄 Step 2: Disable feature flags..."

ACTOR_FLAGS=(
    "actor_resolution_enabled"
    "actor_stamping_enabled"
    "membership_enforcement_enabled"
    "hardening_triggers_enabled"
)

for flag in "${ACTOR_FLAGS[@]}"; do
    echo "   Disabling $flag..."
    
    if [ -n "$DATABASE_URL" ]; then
        psql "$DATABASE_URL" -c "
        UPDATE feature_flags 
        SET enabled = false, updated_at = NOW()
        WHERE flag_name = '$flag';
        "
    else
        node -e "
        const { createClient } = require('@supabase/supabase-js');
        
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        (async () => {
            await supabase
                .from('feature_flags')
                .update({ enabled: false, updated_at: new Date().toISOString() })
                .eq('flag_name', '$flag');
        })();
        "
    fi
done

echo "✅ All actor migration feature flags disabled"

# Step 3: Optional - Remove RPC functions (commented out to preserve)
echo ""
echo "📄 Step 3: RPC Functions (preserved)"
echo "   Actor RPC functions are preserved for future re-enablement"
echo "   To manually remove, run:"
echo "   DROP FUNCTION IF EXISTS hera_entities_crud_v2(TEXT, JSONB, UUID);"
echo "   DROP FUNCTION IF EXISTS hera_transactions_post_v2(JSONB, JSONB[], UUID);"

# Step 4: Verify rollback
echo ""
echo "📄 Step 4: Verify rollback status..."

if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" <<SQL
-- Check triggers are disabled
SELECT 
    'Hardening Triggers' as component,
    CASE WHEN COUNT(*) = 0 THEN 'DISABLED ✅' ELSE 'STILL ACTIVE ⚠️' END as status
FROM pg_triggers 
WHERE triggername LIKE 'trg_%'
AND schemaname = 'public'
AND tablename IN (
    'core_entities',
    'universal_transactions',
    'universal_transaction_lines',
    'core_relationships', 
    'core_dynamic_data',
    'core_organizations'
);

-- Check feature flags
SELECT 
    flag_name,
    enabled,
    CASE WHEN enabled THEN 'ACTIVE ⚠️' ELSE 'DISABLED ✅' END as status
FROM feature_flags
WHERE flag_name LIKE '%actor%' OR flag_name LIKE '%hardening%'
ORDER BY flag_name;
SQL
fi

echo ""
echo "🎉 Rollback Complete!"
echo "===================="
echo ""
echo "✅ What was rolled back:"
echo "   - Hardening triggers disabled"
echo "   - Actor feature flags disabled"
echo "   - Legacy code paths re-enabled"
echo ""
echo "🔒 What was preserved:"
echo "   - Backfilled audit columns (created_by/updated_by)"
echo "   - Actor RPC functions (for future use)"
echo "   - All business data intact"
echo ""
echo "🚨 Important Notes:"
echo "   - Applications will use legacy auth patterns"
echo "   - Audit trail data remains complete"
echo "   - Migration can be re-applied later"
echo ""
echo "🔄 To re-enable migration:"
echo "   ./scripts/apply-actor-migration.sh"
echo "   ./scripts/enable-feature-flag.sh actor_stamping_enabled"