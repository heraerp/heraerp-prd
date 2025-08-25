-- HERA Database Cleanup Script (Simple Version)
-- Removes ALL non-sacred tables - no migration needed for test data
-- WARNING: This will permanently delete these tables and their data

-- Drop all non-sacred tables
DROP TABLE IF EXISTS entities CASCADE;
DROP TABLE IF EXISTS entity_fields CASCADE;
DROP TABLE IF EXISTS core_memberships CASCADE;
DROP TABLE IF EXISTS core_clients CASCADE;
DROP TABLE IF EXISTS gl_chart_of_accounts CASCADE;

-- Show what remains
SELECT 
    table_schema,
    table_name,
    CASE 
        WHEN table_name IN (
            'core_organizations',
            'core_entities', 
            'core_dynamic_data',
            'core_relationships',
            'universal_transactions',
            'universal_transaction_lines'
        ) THEN '✓ SACRED TABLE'
        WHEN table_schema = 'auth' THEN '→ Supabase Auth'
        WHEN table_schema = 'storage' THEN '→ Supabase Storage'
        WHEN table_schema = 'vault' THEN '→ Supabase Vault'
        WHEN table_schema != 'public' THEN '→ System Table'
        ELSE '✗ VIOLATION - Should be removed!'
    END as status
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
AND table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY 
    CASE 
        WHEN table_name IN (
            'core_organizations',
            'core_entities', 
            'core_dynamic_data',
            'core_relationships',
            'universal_transactions',
            'universal_transaction_lines'
        ) THEN 1
        WHEN table_schema != 'public' THEN 2
        ELSE 3
    END,
    table_schema,
    table_name;

-- Count violations
SELECT 
    COUNT(*) as violation_count
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

-- Success message
DO $$
DECLARE
    violation_count INT;
BEGIN
    SELECT COUNT(*) INTO violation_count
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
    
    IF violation_count = 0 THEN
        RAISE NOTICE '✓ SUCCESS: Database now contains only the 6 sacred HERA tables!';
    ELSE
        RAISE WARNING '✗ WARNING: Found % tables that violate the sacred architecture!', violation_count;
    END IF;
END $$;