-- HERA Database Cleanup Script - Remove Non-Sacred Views
-- Removes views that violate the 6-table architecture

-- Check what views exist
SELECT 
    schemaname,
    viewname,
    CASE 
        WHEN viewname IN ('entity_with_dynamic_data', 'transaction_with_lines', 'v_memberships') THEN '✓ VALID HERA VIEW'
        WHEN schemaname != 'public' THEN '→ System View'
        ELSE '✗ VIOLATION - Should be removed!'
    END as status
FROM pg_views
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, viewname;

-- Drop non-sacred views
DROP VIEW IF EXISTS entities CASCADE;
DROP VIEW IF EXISTS entity_fields CASCADE;

-- Also drop any other views that might reference non-sacred tables
DROP VIEW IF EXISTS v_clients CASCADE;
DROP VIEW IF EXISTS v_gl_accounts CASCADE;

-- Show remaining views
SELECT 
    '✓ Remaining views:' as info,
    schemaname,
    viewname
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- Success message
DO $$
DECLARE
    bad_view_count INT;
BEGIN
    SELECT COUNT(*) INTO bad_view_count
    FROM pg_views
    WHERE schemaname = 'public'
    AND viewname IN ('entities', 'entity_fields');
    
    IF bad_view_count = 0 THEN
        RAISE NOTICE '✓ SUCCESS: All non-sacred views have been removed!';
    ELSE
        RAISE WARNING '✗ WARNING: Found % views that still violate the sacred architecture!', bad_view_count;
    END IF;
END $$;

-- List of valid HERA views that should exist:
-- 1. entity_with_dynamic_data - Joins core_entities with their dynamic fields
-- 2. transaction_with_lines - Joins transactions with their line items
-- 3. v_memberships - Shows memberships using sacred tables (if created)