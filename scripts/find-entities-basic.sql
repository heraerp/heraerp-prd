-- HERA Debug: Find "entities" table references
-- Run each query separately in Supabase SQL Editor

-- Query 1: Does "entities" table exist?
SELECT COUNT(*) as entities_table_exists
FROM pg_tables 
WHERE tablename = 'entities';

-- Query 2: List all triggers on core_dynamic_data
SELECT tgname as trigger_name
FROM pg_trigger
WHERE tgrelid = 'core_dynamic_data'::regclass
  AND NOT tgisinternal;

-- Query 3: List all triggers on core_entities  
SELECT tgname as trigger_name
FROM pg_trigger
WHERE tgrelid = 'core_entities'::regclass
  AND NOT tgisinternal;

-- Query 4: Search function names for "entities"
SELECT proname as function_name
FROM pg_proc
WHERE prosrc LIKE '%entities%'
  AND pronamespace = 'public'::regnamespace;

-- Query 5: Get source of validate_dynamic_data_consistency
SELECT prosrc as function_source
FROM pg_proc
WHERE proname = 'validate_dynamic_data_consistency';

-- Query 6: Get source of any function with "entity" in name
SELECT 
    proname as function_name,
    LEFT(prosrc, 200) as first_200_chars
FROM pg_proc
WHERE proname LIKE '%entity%'
  AND pronamespace = 'public'::regnamespace
ORDER BY proname;