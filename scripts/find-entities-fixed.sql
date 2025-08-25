-- HERA Sacred Tables Debug: Find incorrect "entities" references
-- Fixed version for PostgreSQL compatibility

-- 1. Simple check if "entities" table exists
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE tablename = 'entities';

-- 2. Find functions that reference "entities" (not "core_entities")
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    CASE 
        WHEN p.prosrc LIKE '%entities%' AND p.prosrc NOT LIKE '%core_entities%' 
        THEN 'FOUND: Contains "entities" reference'
        ELSE 'OK'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosrc LIKE '%entities%'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, p.proname;

-- 3. Get specific function definitions one by one
-- Run this for any function found above
-- Example: SELECT pg_get_functiondef('function_name'::regproc);

-- 4. Check all triggers on core_dynamic_data
SELECT 
    t.tgname as trigger_name,
    t.tgfoid::regproc as trigger_function,
    CASE 
        WHEN t.tgtype = 1 THEN 'BEFORE'
        WHEN t.tgtype = 2 THEN 'AFTER'
        ELSE 'UNKNOWN'
    END as trigger_timing
FROM pg_trigger t
WHERE t.tgrelid = 'core_dynamic_data'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 5. Check all triggers on core_entities
SELECT 
    t.tgname as trigger_name,
    t.tgfoid::regproc as trigger_function,
    CASE 
        WHEN t.tgtype = 1 THEN 'BEFORE'
        WHEN t.tgtype = 2 THEN 'AFTER'
        ELSE 'UNKNOWN'
    END as trigger_timing
FROM pg_trigger t
WHERE t.tgrelid = 'core_entities'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 6. Get function source code (run separately for each function found)
-- Replace 'function_name' with actual function names from above queries
/*
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE proname IN (
    'validate_dynamic_data_consistency',
    'validate_entity_organization_consistency',
    'enforce_hierarchical_organization_consistency',
    'handle_audit_trail'
);
*/

-- 7. Check views for "entities" references
SELECT 
    schemaname,
    viewname,
    CASE 
        WHEN definition LIKE '%entities%' AND definition NOT LIKE '%core_entities%'
        THEN 'FOUND: Contains "entities" reference'
        ELSE 'OK'
    END as status
FROM pg_views
WHERE definition LIKE '%entities%'
  AND schemaname NOT IN ('pg_catalog', 'information_schema');

-- 8. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN (qual::text LIKE '%entities%' AND qual::text NOT LIKE '%core_entities%')
          OR (with_check::text LIKE '%entities%' AND with_check::text NOT LIKE '%core_entities%')
        THEN 'FOUND: Contains "entities" reference'
        ELSE 'OK'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('core_entities', 'core_dynamic_data');

-- 9. Quick search in all function source code
SELECT 
    proname,
    SUBSTRING(prosrc FROM '.{0,50}entities.{0,50}') as context
FROM pg_proc
WHERE prosrc LIKE '%entities%'
  AND prosrc NOT LIKE '%core_entities%'
  AND pronamespace::regnamespace::text = 'public';

-- 10. Most likely culprit - check validate_dynamic_data_consistency
SELECT 
    proname,
    prosrc
FROM pg_proc
WHERE proname = 'validate_dynamic_data_consistency';