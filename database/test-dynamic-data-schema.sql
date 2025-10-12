-- ============================================================================
-- Test Script: Check core_dynamic_data Table Schema
-- ============================================================================
-- This script checks what columns actually exist in the core_dynamic_data table

-- Query to check actual table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'core_dynamic_data' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test query to see what field_value_* columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'core_dynamic_data' 
  AND table_schema = 'public'
  AND column_name LIKE 'field_value_%'
ORDER BY column_name;