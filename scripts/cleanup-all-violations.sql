-- HERA Complete Cleanup Script
-- Removes ALL tables and views that violate the 6-table architecture

-- Step 1: Drop all non-sacred views
DROP VIEW IF EXISTS entities CASCADE;
DROP VIEW IF EXISTS entity_fields CASCADE;
DROP VIEW IF EXISTS v_clients CASCADE;
DROP VIEW IF EXISTS v_gl_accounts CASCADE;

-- Step 2: Drop all non-sacred tables
DROP TABLE IF EXISTS entities CASCADE;
DROP TABLE IF EXISTS entity_fields CASCADE;
DROP TABLE IF EXISTS core_memberships CASCADE;
DROP TABLE IF EXISTS core_clients CASCADE;
DROP TABLE IF EXISTS gl_chart_of_accounts CASCADE;

-- Step 3: Show final state
SELECT 
    'TABLES' as object_type,
    table_schema,
    table_name as object_name,
    CASE 
        WHEN table_name IN (
            'core_organizations',
            'core_entities', 
            'core_dynamic_data',
            'core_relationships',
            'universal_transactions',
            'universal_transaction_lines'
        ) THEN '✓ SACRED'
        WHEN table_schema != 'public' THEN '→ SYSTEM'
        ELSE '✗ VIOLATION'
    END as status
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
AND table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')

UNION ALL

SELECT 
    'VIEWS' as object_type,
    schemaname as table_schema,
    viewname as object_name,
    CASE 
        WHEN viewname IN ('entity_with_dynamic_data', 'transaction_with_lines') THEN '✓ VALID'
        WHEN schemaname != 'public' THEN '→ SYSTEM'
        ELSE '✗ VIOLATION'
    END as status
FROM pg_views
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')

ORDER BY object_type, status, table_schema, object_name;

-- Final validation
DO $$
DECLARE
    table_violations INT;
    view_violations INT;
BEGIN
    -- Count table violations
    SELECT COUNT(*) INTO table_violations
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
    AND table_schema = 'public'
    AND table_name NOT IN (
        'core_organizations',
        'core_entities', 
        'core_dynamic_data',
        'core_relationships',
        'universal_transactions',
        'universal_transaction_lines'
    );
    
    -- Count view violations (excluding valid HERA views)
    SELECT COUNT(*) INTO view_violations
    FROM pg_views
    WHERE schemaname = 'public'
    AND viewname NOT IN ('entity_with_dynamic_data', 'transaction_with_lines', 'v_memberships');
    
    IF table_violations = 0 AND view_violations = 0 THEN
        RAISE NOTICE '✓ SUCCESS: Database is now fully compliant with HERA sacred architecture!';
        RAISE NOTICE '  - 6 sacred tables preserved';
        RAISE NOTICE '  - All violating tables removed';
        RAISE NOTICE '  - All violating views removed';
    ELSE
        RAISE WARNING '✗ VIOLATIONS REMAIN: % tables, % views', table_violations, view_violations;
    END IF;
END $$;