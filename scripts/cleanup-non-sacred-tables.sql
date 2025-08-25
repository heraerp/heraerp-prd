-- HERA Database Cleanup Script
-- Removes non-sacred tables that violate the 6-table architecture
-- WARNING: This will permanently delete these tables and their data

-- Check what's in these tables before deleting
DO $$
BEGIN
    -- Check entities table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entities') THEN
        RAISE NOTICE 'entities table exists with % rows', (SELECT COUNT(*) FROM entities);
    END IF;
    
    -- Check entity_fields table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entity_fields') THEN
        RAISE NOTICE 'entity_fields table exists with % rows', (SELECT COUNT(*) FROM entity_fields);
    END IF;
    
    -- Check core_memberships table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'core_memberships') THEN
        RAISE NOTICE 'core_memberships table exists with % rows', (SELECT COUNT(*) FROM core_memberships);
    END IF;
END $$;

-- Backup the data first (uncomment if needed)
-- CREATE TABLE entities_backup AS SELECT * FROM entities;
-- CREATE TABLE entity_fields_backup AS SELECT * FROM entity_fields;
-- CREATE TABLE core_memberships_backup AS SELECT * FROM core_memberships;

-- Drop the non-sacred tables
DROP TABLE IF EXISTS entity_fields CASCADE;
DROP TABLE IF EXISTS entities CASCADE;
DROP TABLE IF EXISTS core_memberships CASCADE;

-- Also drop any other tables that violate the sacred architecture
-- These were found in the codebase but shouldn't exist
DROP TABLE IF EXISTS core_clients CASCADE;
DROP TABLE IF EXISTS gl_chart_of_accounts CASCADE;

-- List all remaining tables
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
        ) THEN '✓ SACRED'
        WHEN table_schema != 'public' THEN '→ SYSTEM'
        ELSE '✗ VIOLATION'
    END as status
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
AND table_schema NOT IN ('pg_catalog', 'information_schema')
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
    table_name;

-- Expected output should only show the 6 sacred tables in public schema:
-- core_organizations
-- core_entities
-- core_dynamic_data
-- core_relationships
-- universal_transactions
-- universal_transaction_lines