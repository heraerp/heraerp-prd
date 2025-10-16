#!/bin/bash

# HERA v2.2 Actor Coverage Verification Script
# ============================================

set -e

TENANT_ORG_ID=$1

if [ -z "$TENANT_ORG_ID" ]; then
    echo "❌ Usage: $0 <TENANT_ORG_ID>"
    echo ""
    echo "Example:"
    echo "  $0 f47ac10b-58cc-4372-a567-0e02b2c3d479"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    source .env
fi

echo "📊 HERA v2.2 Actor Coverage Report"
echo "================================="
echo "Organization: $TENANT_ORG_ID"
echo "Generated: $(date)"
echo ""

# Function to generate coverage report
generate_coverage_report() {
    if [ -n "$DATABASE_URL" ]; then
        psql "$DATABASE_URL" -v tenant_org="$TENANT_ORG_ID" <<SQL
-- Actor Coverage Report by Table
WITH actor_coverage AS (
    SELECT 
        'core_entities' as table_name,
        COUNT(*) as total_rows,
        COUNT(created_by) as created_by_stamped,
        COUNT(updated_by) as updated_by_stamped,
        ROUND(100.0 * COUNT(created_by) / NULLIF(COUNT(*), 0), 2) as created_coverage_pct,
        ROUND(100.0 * COUNT(updated_by) / NULLIF(COUNT(*), 0), 2) as updated_coverage_pct
    FROM core_entities 
    WHERE organization_id = :'tenant_org'::uuid
    
    UNION ALL
    
    SELECT 
        'universal_transactions',
        COUNT(*),
        COUNT(created_by),
        COUNT(updated_by),
        ROUND(100.0 * COUNT(created_by) / NULLIF(COUNT(*), 0), 2),
        ROUND(100.0 * COUNT(updated_by) / NULLIF(COUNT(*), 0), 2)
    FROM universal_transactions 
    WHERE organization_id = :'tenant_org'::uuid
    
    UNION ALL
    
    SELECT 
        'universal_transaction_lines',
        COUNT(*),
        COUNT(created_by),
        COUNT(updated_by),
        ROUND(100.0 * COUNT(created_by) / NULLIF(COUNT(*), 0), 2),
        ROUND(100.0 * COUNT(updated_by) / NULLIF(COUNT(*), 0), 2)
    FROM universal_transaction_lines
    WHERE organization_id = :'tenant_org'::uuid
    
    UNION ALL
    
    SELECT 
        'core_relationships',
        COUNT(*),
        COUNT(created_by),
        COUNT(updated_by),
        ROUND(100.0 * COUNT(created_by) / NULLIF(COUNT(*), 0), 2),
        ROUND(100.0 * COUNT(updated_by) / NULLIF(COUNT(*), 0), 2)
    FROM core_relationships
    WHERE organization_id = :'tenant_org'::uuid
    
    UNION ALL
    
    SELECT 
        'core_dynamic_data',
        COUNT(*),
        COUNT(created_by),
        COUNT(updated_by),
        ROUND(100.0 * COUNT(created_by) / NULLIF(COUNT(*), 0), 2),
        ROUND(100.0 * COUNT(updated_by) / NULLIF(COUNT(*), 0), 2)
    FROM core_dynamic_data
    WHERE organization_id = :'tenant_org'::uuid
)
SELECT 
    table_name as "Table",
    total_rows as "Total Rows",
    created_by_stamped as "Created By",
    updated_by_stamped as "Updated By",
    created_coverage_pct || '%' as "Created %",
    updated_coverage_pct || '%' as "Updated %",
    CASE 
        WHEN created_coverage_pct = 100 AND updated_coverage_pct = 100 THEN '✅ PASS'
        WHEN created_coverage_pct >= 95 AND updated_coverage_pct >= 95 THEN '⚠️  WARN'
        ELSE '❌ FAIL'
    END as "Status"
FROM actor_coverage
ORDER BY table_name;

-- Overall Summary
SELECT 
    'OVERALL SUMMARY' as "Metric",
    SUM(total_rows) as "Total Rows",
    SUM(created_by_stamped) as "Created By Stamped",
    SUM(updated_by_stamped) as "Updated By Stamped",
    ROUND(100.0 * SUM(created_by_stamped) / NULLIF(SUM(total_rows), 0), 2) || '%' as "Overall Created %",
    ROUND(100.0 * SUM(updated_by_stamped) / NULLIF(SUM(total_rows), 0), 2) || '%' as "Overall Updated %"
FROM actor_coverage;
SQL
    else
        # Using Node.js for Supabase
        node -e "
        const { createClient } = require('@supabase/supabase-js');
        
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        const tables = [
            'core_entities',
            'universal_transactions', 
            'universal_transaction_lines',
            'core_relationships',
            'core_dynamic_data'
        ];
        
        (async () => {
            console.log('Table Name                 | Total | Created | Updated | Created % | Updated % | Status');
            console.log('---------------------------|-------|---------|---------|-----------|-----------|-------');
            
            let totalRows = 0;
            let totalCreated = 0;
            let totalUpdated = 0;
            
            for (const table of tables) {
                const { data, error } = await supabase
                    .from(table)
                    .select('created_by, updated_by', { count: 'exact' })
                    .eq('organization_id', '$TENANT_ORG_ID');
                
                if (error) {
                    console.error(\`Error querying \${table}:\`, error);
                    continue;
                }
                
                const total = data.length;
                const createdCount = data.filter(row => row.created_by).length;
                const updatedCount = data.filter(row => row.updated_by).length;
                
                const createdPct = total > 0 ? ((createdCount / total) * 100).toFixed(1) : '0.0';
                const updatedPct = total > 0 ? ((updatedCount / total) * 100).toFixed(1) : '0.0';
                
                const status = (createdPct == 100 && updatedPct == 100) ? '✅ PASS' : 
                              (createdPct >= 95 && updatedPct >= 95) ? '⚠️  WARN' : '❌ FAIL';
                
                console.log(\`\${table.padEnd(26)} | \${total.toString().padEnd(5)} | \${createdCount.toString().padEnd(7)} | \${updatedCount.toString().padEnd(7)} | \${(createdPct + '%').padEnd(9)} | \${(updatedPct + '%').padEnd(9)} | \${status}\`);
                
                totalRows += total;
                totalCreated += createdCount;
                totalUpdated += updatedCount;
            }
            
            const overallCreatedPct = totalRows > 0 ? ((totalCreated / totalRows) * 100).toFixed(1) : '0.0';
            const overallUpdatedPct = totalRows > 0 ? ((totalUpdated / totalRows) * 100).toFixed(1) : '0.0';
            
            console.log('---------------------------|-------|---------|---------|-----------|-----------|-------');
            console.log(\`OVERALL                    | \${totalRows.toString().padEnd(5)} | \${totalCreated.toString().padEnd(7)} | \${totalUpdated.toString().padEnd(7)} | \${(overallCreatedPct + '%').padEnd(9)} | \${(overallUpdatedPct + '%').padEnd(9)} | \${(overallCreatedPct == 100 && overallUpdatedPct == 100) ? '✅ PASS' : '❌ FAIL'}\`);
        })();
        "
    fi
}

# Generate main coverage report
generate_coverage_report

echo ""
echo "🔍 Additional Validation Checks"
echo "==============================="

# Check for service user entity
echo "📋 Validating service user entity..."

if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" <<SQL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM core_entities 
            WHERE entity_type = 'USER' 
            AND organization_id = '00000000-0000-0000-0000-000000000000'
        ) THEN '✅ Service users exist in platform organization'
        ELSE '❌ No service users found in platform organization'
    END as "Service User Check";
SQL
fi

# Check RPC functions
echo ""
echo "📋 Validating RPC functions..."

if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" <<SQL
SELECT 
    function_name,
    CASE WHEN function_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    VALUES 
        ('resolve_user_identity_v1'),
        ('hera_entities_crud_v2'),
        ('hera_transactions_post_v2')
) expected(function_name)
LEFT JOIN (
    SELECT routine_name as function_name
    FROM information_schema.routines
    WHERE routine_type = 'FUNCTION'
    AND routine_schema = 'public'
) actual USING (function_name);
SQL
fi

echo ""
echo "🎯 Migration Status Summary"
echo "==========================="

# Determine overall migration status
if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -v tenant_org="$TENANT_ORG_ID" -t -A <<SQL
WITH coverage_summary AS (
    SELECT 
        SUM(CASE WHEN created_by IS NOT NULL THEN 1 ELSE 0 END) as total_created,
        SUM(CASE WHEN updated_by IS NOT NULL THEN 1 ELSE 0 END) as total_updated,
        COUNT(*) as total_rows
    FROM (
        SELECT created_by, updated_by FROM core_entities WHERE organization_id = :'tenant_org'::uuid
        UNION ALL
        SELECT created_by, updated_by FROM universal_transactions WHERE organization_id = :'tenant_org'::uuid
        UNION ALL
        SELECT created_by, updated_by FROM universal_transaction_lines WHERE organization_id = :'tenant_org'::uuid
        UNION ALL
        SELECT created_by, updated_by FROM core_relationships WHERE organization_id = :'tenant_org'::uuid
        UNION ALL
        SELECT created_by, updated_by FROM core_dynamic_data WHERE organization_id = :'tenant_org'::uuid
    ) all_rows
),
rpc_check AS (
    SELECT COUNT(*) as rpc_count
    FROM information_schema.routines
    WHERE routine_name IN ('resolve_user_identity_v1', 'hera_entities_crud_v2', 'hera_transactions_post_v2')
    AND routine_schema = 'public'
)
SELECT 
    CASE 
        WHEN c.total_created = c.total_rows 
         AND c.total_updated = c.total_rows 
         AND r.rpc_count = 3 THEN 'MIGRATION_COMPLETE'
        WHEN c.total_created >= c.total_rows * 0.95 
         AND c.total_updated >= c.total_rows * 0.95 THEN 'MIGRATION_NEARLY_COMPLETE'
        ELSE 'MIGRATION_INCOMPLETE'
    END as migration_status,
    ROUND(100.0 * c.total_created / NULLIF(c.total_rows, 0), 1) as created_coverage,
    ROUND(100.0 * c.total_updated / NULLIF(c.total_rows, 0), 1) as updated_coverage,
    r.rpc_count as rpc_functions_deployed
FROM coverage_summary c, rpc_check r;
SQL
fi

echo ""
echo "📝 Next Steps"
echo "============="
echo ""
echo "Based on the coverage report:"
echo ""
echo "If MIGRATION_COMPLETE:"
echo "  ✅ Enable actor stamping: ./scripts/enable-feature-flag.sh actor_stamping_enabled"
echo "  ✅ Test endpoints: ./scripts/test-actor-endpoints.sh"
echo "  ✅ Enable hardening: ./scripts/enable-hardening-triggers.sh"
echo ""
echo "If MIGRATION_INCOMPLETE:"
echo "  🔄 Re-run backfill: ./scripts/backfill-audit-columns.sh $TENANT_ORG_ID"
echo "  🔍 Check for data issues and re-verify"
echo ""
echo "📊 Coverage Target: 100% for production deployment"