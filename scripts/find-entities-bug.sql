-- HERA Sacred Tables Debug: Find incorrect "entities" references
-- Should only use "core_entities" per HERA's 6-table architecture

-- 1. Check all functions for "entities" references
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ~* '\yentities\y'
  AND pg_get_functiondef(p.oid) !~* '\ycore_entities\y'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, p.proname;

-- 2. Check all triggers that might reference "entities"
SELECT 
    tg.tgname as trigger_name,
    ns.nspname as schema_name,
    cl.relname as table_name,
    pg_get_triggerdef(tg.oid) as trigger_definition,
    pr.proname as function_name,
    pg_get_functiondef(pr.oid) as function_definition
FROM pg_trigger tg
JOIN pg_class cl ON tg.tgrelid = cl.oid
JOIN pg_namespace ns ON cl.relnamespace = ns.oid
JOIN pg_proc pr ON tg.tgfoid = pr.oid
WHERE pg_get_functiondef(pr.oid) ~* '\yentities\y'
  AND pg_get_functiondef(pr.oid) !~* '\ycore_entities\y'
  AND ns.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY ns.nspname, cl.relname, tg.tgname;

-- 3. Check all views for "entities" references
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE definition ~* '\yentities\y'
  AND definition !~* '\ycore_entities\y'
  AND schemaname NOT IN ('pg_catalog', 'information_schema');

-- 4. Check all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    qual as policy_condition,
    with_check as with_check_condition
FROM pg_policies
WHERE (qual::text ~* '\yentities\y' OR with_check::text ~* '\yentities\y')
  AND (qual::text !~* '\ycore_entities\y' AND with_check::text !~* '\ycore_entities\y')
  AND schemaname NOT IN ('pg_catalog', 'information_schema');

-- 5. Check constraints
SELECT 
    n.nspname as schema_name,
    c.conname as constraint_name,
    cl.relname as table_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class cl ON c.conrelid = cl.oid
JOIN pg_namespace n ON cl.relnamespace = n.oid
WHERE pg_get_constraintdef(c.oid) ~* '\yentities\y'
  AND pg_get_constraintdef(c.oid) !~* '\ycore_entities\y'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema');

-- 6. Quick check for any object dependencies on "entities"
SELECT 
    objid::regclass as dependent_object,
    refobjid::regclass as referenced_object
FROM pg_depend
WHERE refobjid::regclass::text = 'entities'
   OR objid::regclass::text = 'entities';

-- 7. Search event triggers
SELECT 
    evtname as event_trigger_name,
    evtevent as trigger_event,
    evtfoid::regproc as function_name,
    pg_get_functiondef(evtfoid) as function_definition
FROM pg_event_trigger
WHERE pg_get_functiondef(evtfoid) ~* '\yentities\y'
  AND pg_get_functiondef(evtfoid) !~* '\ycore_entities\y';

-- 8. Check for any comments mentioning entities
SELECT 
    c.relname as object_name,
    n.nspname as schema_name,
    obj_description(c.oid) as comment
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE obj_description(c.oid) ~* '\yentities\y'
  AND obj_description(c.oid) !~* '\ycore_entities\y'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema');

-- Summary: Run each query to find where "entities" is incorrectly referenced
-- Once found, replace with "core_entities" to align with HERA's sacred 6 tables