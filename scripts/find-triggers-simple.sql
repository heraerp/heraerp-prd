-- Find triggers on core_dynamic_data - simplified version

-- 1. List all triggers on core_dynamic_data
SELECT 
    tgname as trigger_name,
    tgfoid::regproc as function_name
FROM pg_trigger
WHERE tgrelid = 'core_dynamic_data'::regclass
  AND NOT tgisinternal;

-- 2. List all triggers on core_entities  
SELECT 
    tgname as trigger_name,
    tgfoid::regproc as function_name
FROM pg_trigger
WHERE tgrelid = 'core_entities'::regclass
  AND NOT tgisinternal;

-- 3. Get unique function names from triggers
SELECT DISTINCT tgfoid::regproc as function_name
FROM pg_trigger
WHERE tgrelid IN ('core_dynamic_data'::regclass, 'core_entities'::regclass)
  AND NOT tgisinternal;

-- 4. Search for "entities" in function source code
SELECT 
    proname as function_name,
    POSITION('entities' IN prosrc) as entities_position,
    POSITION('core_entities' IN prosrc) as core_entities_position
FROM pg_proc
WHERE proname IN (
    SELECT DISTINCT (tgfoid::regproc)::text
    FROM pg_trigger
    WHERE tgrelid IN ('core_dynamic_data'::regclass, 'core_entities'::regclass)
      AND NOT tgisinternal
)
AND POSITION('entities' IN prosrc) > 0;

-- 5. Get the actual function source for manual inspection
-- Replace 'function_name_here' with actual function names from query 3
/*
SELECT 
    proname,
    prosrc
FROM pg_proc
WHERE proname = 'function_name_here';
*/