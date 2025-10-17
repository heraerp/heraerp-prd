#!/bin/bash

# HERA v2.2 Audit Columns Backfill Script
# ========================================

set -e

TENANT_ORG_ID=$1
SERVICE_USER_ENTITY_ID=${2:-"00000000-0000-0000-0000-000000000001"}

if [ -z "$TENANT_ORG_ID" ]; then
    echo "❌ Usage: $0 <TENANT_ORG_ID> [SERVICE_USER_ENTITY_ID]"
    echo ""
    echo "Example:"
    echo "  $0 f47ac10b-58cc-4372-a567-0e02b2c3d479"
    echo ""
    echo "This will backfill created_by/updated_by audit columns for the specified organization."
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    source .env
fi

echo "🔄 HERA v2.2 Audit Columns Backfill"
echo "===================================="
echo "Organization ID: $TENANT_ORG_ID"
echo "Service User ID: $SERVICE_USER_ENTITY_ID"
echo ""

# Function to run SQL with progress
run_backfill_sql() {
    local table_name=$1
    local description=$2
    
    echo "📄 $description..."
    
    if [ -n "$DATABASE_URL" ]; then
        psql "$DATABASE_URL" -v tenant_org="$TENANT_ORG_ID" -v service_user="$SERVICE_USER_ENTITY_ID" <<SQL
DO \$\$
DECLARE
    v_batch_size INTEGER := 1000;
    v_rows_updated INTEGER;
    v_total_updated INTEGER := 0;
BEGIN
    LOOP
        -- Backfill created_by where NULL
        UPDATE $table_name
        SET created_by = :'service_user'::uuid
        WHERE organization_id = :'tenant_org'::uuid
          AND created_by IS NULL
          AND id IN (
              SELECT id FROM $table_name
              WHERE organization_id = :'tenant_org'::uuid
                AND created_by IS NULL
              LIMIT v_batch_size
          );
        
        GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
        v_total_updated := v_total_updated + v_rows_updated;
        
        IF v_rows_updated = 0 THEN
            EXIT;
        END IF;
        
        RAISE NOTICE 'Updated % rows in $table_name.created_by (total: %)', v_rows_updated, v_total_updated;
        COMMIT;
    END LOOP;
    
    -- Backfill updated_by where NULL
    UPDATE $table_name
    SET updated_by = COALESCE(updated_by, created_by, :'service_user'::uuid)
    WHERE organization_id = :'tenant_org'::uuid
      AND updated_by IS NULL;
      
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    v_total_updated := v_total_updated + v_rows_updated;
      
    RAISE NOTICE 'Completed $table_name backfill: % total rows updated', v_total_updated;
END \$\$;
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
            console.log('Backfilling $table_name...');
            
            // Update created_by where NULL
            const { error: createdError } = await supabase
                .from('$table_name')
                .update({ created_by: '$SERVICE_USER_ENTITY_ID' })
                .eq('organization_id', '$TENANT_ORG_ID')
                .is('created_by', null);
            
            if (createdError) {
                console.error('Error updating created_by:', createdError);
                return;
            }
            
            // Update updated_by where NULL
            const { error: updatedError } = await supabase
                .from('$table_name')
                .update({ updated_by: '$SERVICE_USER_ENTITY_ID' })
                .eq('organization_id', '$TENANT_ORG_ID')
                .is('updated_by', null);
            
            if (updatedError) {
                console.error('Error updating updated_by:', updatedError);
                return;
            }
            
            console.log('✅ Completed $table_name backfill');
        })();
        "
    fi
    
    echo "✅ $description completed"
}

echo "📋 Starting backfill process..."
echo ""

# Backfill core_entities
run_backfill_sql "core_entities" "Backfill core_entities audit columns"

# Backfill universal_transactions
run_backfill_sql "universal_transactions" "Backfill universal_transactions audit columns"

# Backfill universal_transaction_lines
run_backfill_sql "universal_transaction_lines" "Backfill universal_transaction_lines audit columns"

# Backfill core_relationships
run_backfill_sql "core_relationships" "Backfill core_relationships audit columns"

# Backfill core_dynamic_data
run_backfill_sql "core_dynamic_data" "Backfill core_dynamic_data audit columns"

# Special case: core_organizations (no org scoping)
echo "📄 Backfill core_organizations audit columns..."

if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -v target_org="$TENANT_ORG_ID" -v service_user="$SERVICE_USER_ENTITY_ID" <<SQL
UPDATE core_organizations
SET 
    created_by = COALESCE(created_by, :'service_user'::uuid),
    updated_by = COALESCE(updated_by, :'service_user'::uuid)
WHERE id = :'target_org'::uuid
  AND (created_by IS NULL OR updated_by IS NULL);
SQL
else
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    (async () => {
        const { error } = await supabase
            .from('core_organizations')
            .update({ 
                created_by: '$SERVICE_USER_ENTITY_ID',
                updated_by: '$SERVICE_USER_ENTITY_ID'
            })
            .eq('id', '$TENANT_ORG_ID')
            .or('created_by.is.null,updated_by.is.null');
        
        if (error) {
            console.error('Error:', error);
            return;
        }
        
        console.log('✅ Completed core_organizations backfill');
    })();
    "
fi

echo "✅ Backfill core_organizations audit columns completed"

echo ""
echo "🎉 Audit Columns Backfill Complete!"
echo "===================================="
echo ""
echo "Next Steps:"
echo "1. Verify coverage: ./scripts/verify-actor-coverage.sh $TENANT_ORG_ID"
echo "2. Enable actor stamping: ./scripts/enable-feature-flag.sh actor_stamping_enabled"
echo "3. Test endpoints: ./scripts/test-actor-endpoints.sh"
echo ""
echo "🚨 Important: All NULL audit columns have been backfilled with service user ID"