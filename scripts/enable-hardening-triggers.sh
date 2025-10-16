#!/bin/bash

# Enable HERA v2.2 Hardening Triggers
# ===================================

set -e

# Load environment variables
if [ -f .env ]; then
    source .env
fi

echo "🔒 HERA v2.2 Hardening Triggers"
echo "================================"
echo ""

# Confirm action
echo "⚠️  WARNING: This will enable strict validation triggers that:"
echo "   - Reject writes with NULL created_by/updated_by"
echo "   - Enforce organization_id on all writes"
echo "   - Validate smart_code patterns"
echo "   - Verify actor membership"
echo ""

read -p "Are you sure you want to enable hardening triggers? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Hardening triggers not enabled"
    exit 0
fi

echo ""
echo "🚀 Enabling hardening triggers..."

# Function to enable triggers
enable_hardening() {
    if [ -n "$DATABASE_URL" ]; then
        # Using psql
        psql "$DATABASE_URL" <<SQL
-- Enable all hardening triggers
SELECT hera_enable_hardening_triggers();

-- Verify triggers are enabled
SELECT 
    schemaname,
    tablename,
    triggername,
    'ENABLED' as status
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
)
ORDER BY tablename, triggername;
SQL
    else
        # Using Node.js for Supabase
        node -e "
        const { createClient } = require('@supabase/supabase-js');
        
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        (async () => {
            console.log('Enabling hardening triggers...');
            
            const { data, error } = await supabase.rpc('hera_enable_hardening_triggers');
            
            if (error) {
                console.error('❌ Error enabling triggers:', error);
                process.exit(1);
            }
            
            console.log('✅ Hardening triggers enabled successfully');
        })();
        "
    fi
}

# Enable the triggers
enable_hardening

echo ""
echo "✅ Hardening Triggers Enabled!"
echo "=============================="
echo ""
echo "🔒 The following protections are now active:"
echo ""
echo "  ✅ Actor Stamping Validation"
echo "     - Rejects writes with NULL created_by/updated_by"
echo "     - Validates actor is valid USER entity"
echo "     - Enforces organization membership"
echo ""
echo "  ✅ Organization ID Validation"
echo "     - Rejects writes without organization_id"
echo "     - Validates organization exists and is active"
echo ""
echo "  ✅ Smart Code Validation"
echo "     - Enforces HERA.MODULE.TYPE.SUBTYPE.V# pattern"
echo "     - Rejects invalid smart code formats"
echo ""
echo "🧪 Test the hardening with:"
echo "   ./scripts/test-hardening-validation.sh"
echo ""
echo "🚨 To disable (rollback): ./scripts/disable-hardening-triggers.sh"