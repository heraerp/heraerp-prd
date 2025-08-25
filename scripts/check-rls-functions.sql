-- Check for functions that might be causing the "entities" error

-- 1. Check if app.current_org is set properly
SELECT current_setting('app.current_org', true) as current_org_setting;

-- 2. Test the RLS policy expression directly
SELECT 
    organization_id,
    entity_id,
    field_name,
    EXISTS (
        SELECT 1
        FROM core_entities e
        WHERE e.id = entity_id 
        AND e.organization_id = organization_id
    ) as entity_exists
FROM core_dynamic_data
WHERE entity_id = '11ec6f11-7eaf-4c3d-95e8-448b63eba47c'
LIMIT 5;

-- 3. Check for any functions in the public schema that might reference "entities"
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND (prosrc LIKE '%from entities%' 
    OR prosrc LIKE '%join entities%'
    OR prosrc LIKE '%update entities%'
    OR prosrc LIKE '%insert into entities%');

-- 4. Check trigger functions specifically
SELECT 
    t.tgname as trigger_name,
    p.proname as function_name,
    ns.nspname as schema_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace ns ON p.pronamespace = ns.oid
WHERE t.tgrelid IN ('core_entities'::regclass, 'core_dynamic_data'::regclass)
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 5. Get the actual function definitions for triggers on core_dynamic_data
SELECT 
    t.tgname as trigger_name,
    pg_get_functiondef(t.tgfoid) as function_definition
FROM pg_trigger t
WHERE t.tgrelid = 'core_dynamic_data'::regclass
  AND NOT t.tgisinternal;