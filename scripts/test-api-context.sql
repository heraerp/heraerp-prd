-- Test what happens in API context vs direct SQL

-- 1. Check if there's a schema/search_path issue
SHOW search_path;

-- 2. Check if "entities" exists in any schema
SELECT 
    schemaname,
    tablename
FROM pg_tables
WHERE tablename = 'entities';

-- 3. Check for views named entities
SELECT 
    schemaname,
    viewname
FROM pg_views
WHERE viewname = 'entities';

-- 4. Test creating a simple dynamic data record with minimal fields
-- This helps isolate if it's a specific field causing issues
BEGIN;

INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_value_text,
    created_at
) VALUES (
    '44d2d8f8-167d-46a7-a704-c0e5435863d6',
    '11ec6f11-7eaf-4c3d-95e8-448b63eba47c',
    'test_field',
    'test_value',
    NOW()
);

-- Check if it worked
SELECT * FROM core_dynamic_data 
WHERE field_name = 'test_field' 
  AND entity_id = '11ec6f11-7eaf-4c3d-95e8-448b63eba47c';

ROLLBACK; -- or COMMIT if you want to keep the test data

-- 5. Check for any foreign key constraints that might reference "entities"
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (ccu.table_name = 'entities' OR tc.table_name = 'core_dynamic_data');