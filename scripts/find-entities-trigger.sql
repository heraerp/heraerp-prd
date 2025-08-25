-- Find the specific trigger/function causing "entities" error

-- 1. List ALL triggers on core_dynamic_data with their event types
SELECT 
    tgname as trigger_name,
    CASE tgtype::int & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as timing,
    CASE 
        WHEN tgtype::int & 4 = 4 THEN 'INSERT'
        WHEN tgtype::int & 8 = 8 THEN 'DELETE'  
        WHEN tgtype::int & 16 = 16 THEN 'UPDATE'
        ELSE 'MULTIPLE'
    END as event,
    tgfoid::regproc as function_name,
    tgenabled as enabled
FROM pg_trigger
WHERE tgrelid = 'core_dynamic_data'::regclass
  AND NOT tgisinternal
ORDER BY tgname;

-- 2. Get the source code of each trigger function
WITH trigger_functions AS (
    SELECT DISTINCT tgfoid::regproc::text as function_name
    FROM pg_trigger
    WHERE tgrelid = 'core_dynamic_data'::regclass
      AND NOT tgisinternal
)
SELECT 
    function_name,
    SUBSTRING(pg_get_functiondef(function_name::regproc::oid), 1, 500) as first_500_chars
FROM trigger_functions;

-- 3. Specifically check validate_dynamic_data_consistency function
SELECT pg_get_functiondef('validate_dynamic_data_consistency'::regproc);

-- 4. Check if there's a function that validates entity references
SELECT 
    proname,
    CASE 
        WHEN prosrc LIKE '%from entities%' THEN 'FOUND: from entities'
        WHEN prosrc LIKE '%join entities%' THEN 'FOUND: join entities'
        WHEN prosrc LIKE '%.entities%' THEN 'FOUND: .entities reference'
        WHEN prosrc LIKE '%"entities"%' THEN 'FOUND: "entities" reference'
        ELSE 'Check manually'
    END as issue
FROM pg_proc
WHERE proname IN (
    SELECT DISTINCT tgfoid::regproc::text
    FROM pg_trigger
    WHERE tgrelid = 'core_dynamic_data'::regclass
      AND NOT tgisinternal
);

-- 5. Quick test to disable/enable triggers (BE CAREFUL - only in development!)
-- This will help identify which trigger is causing the issue
/*
-- To disable all triggers on core_dynamic_data:
ALTER TABLE core_dynamic_data DISABLE TRIGGER ALL;

-- To re-enable:
ALTER TABLE core_dynamic_data ENABLE TRIGGER ALL;

-- To disable a specific trigger:
ALTER TABLE core_dynamic_data DISABLE TRIGGER trigger_name_here;
*/