-- HERA Complete Database Cleanup
-- This script ensures only the sacred 6 tables remain

-- Step 1: Drop ALL views that might reference non-sacred tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all views in public schema except the valid HERA views
    FOR r IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname NOT IN ('entity_with_dynamic_data', 'transaction_with_lines', 'v_memberships')
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.viewname) || ' CASCADE';
        RAISE NOTICE 'Dropped view: %', r.viewname;
    END LOOP;
END $$;

-- Step 2: Drop specific violating tables and views we know about
DROP VIEW IF EXISTS entities CASCADE;
DROP VIEW IF EXISTS entity_fields CASCADE;
DROP VIEW IF EXISTS v_clients CASCADE;
DROP VIEW IF EXISTS v_gl_accounts CASCADE;

DROP TABLE IF EXISTS entities CASCADE;
DROP TABLE IF EXISTS entity_fields CASCADE;
DROP TABLE IF EXISTS core_memberships CASCADE;
DROP TABLE IF EXISTS core_clients CASCADE;
DROP TABLE IF EXISTS gl_chart_of_accounts CASCADE;

-- Step 3: Drop ALL non-sacred tables in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables except the sacred 6
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN (
            'core_organizations',
            'core_entities',
            'core_dynamic_data',
            'core_relationships',
            'universal_transactions',
            'universal_transaction_lines'
        )
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
END $$;

-- Step 4: Verify final state
SELECT 
    'TABLES' as object_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE tablename IN (
        'core_organizations',
        'core_entities',
        'core_dynamic_data',
        'core_relationships',
        'universal_transactions',
        'universal_transaction_lines'
    )) as sacred,
    COUNT(*) FILTER (WHERE tablename NOT IN (
        'core_organizations',
        'core_entities',
        'core_dynamic_data',
        'core_relationships',
        'universal_transactions',
        'universal_transaction_lines'
    )) as violations
FROM pg_tables
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'VIEWS' as object_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE viewname IN (
        'entity_with_dynamic_data',
        'transaction_with_lines',
        'v_memberships'
    )) as sacred,
    COUNT(*) FILTER (WHERE viewname NOT IN (
        'entity_with_dynamic_data',
        'transaction_with_lines',
        'v_memberships'
    )) as violations
FROM pg_views
WHERE schemaname = 'public';

-- Step 5: List remaining objects
SELECT 
    'Remaining Tables:' as info,
    string_agg(tablename, ', ') as objects
FROM pg_tables
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Remaining Views:' as info,
    string_agg(viewname, ', ') as objects
FROM pg_views
WHERE schemaname = 'public';

-- Expected output should show:
-- TABLES: total=6, sacred=6, violations=0
-- VIEWS: total=2-3, sacred=2-3, violations=0