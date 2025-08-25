-- Simple query to find "entities" references
-- Run this in Supabase SQL Editor

-- First, check if an "entities" table exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'entities'
) as entities_table_exists;

-- Find all functions containing "entities" (not "core_entities")
SELECT 
    proname as function_name,
    pronamespace::regnamespace as schema_name
FROM pg_proc
WHERE prosrc ~* '\mentities\M'
  AND prosrc !~* 'core_entities'
  AND pronamespace::regnamespace::text NOT IN ('pg_catalog', 'information_schema');

-- Find all triggers on core_dynamic_data
SELECT 
    tgname as trigger_name,
    tgtype,
    tgfoid::regproc as trigger_function
FROM pg_trigger
WHERE tgrelid = 'core_dynamic_data'::regclass;

-- Show the definition of validate_dynamic_data_consistency if it exists
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'validate_dynamic_data_consistency';

-- Show all trigger functions on core_dynamic_data with their definitions
SELECT DISTINCT
    t.tgfoid::regproc as function_name,
    pg_get_functiondef(t.tgfoid) as function_definition
FROM pg_trigger t
WHERE t.tgrelid = 'core_dynamic_data'::regclass;