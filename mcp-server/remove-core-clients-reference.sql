-- Remove core_clients table reference from core_organizations
-- This needs to be run before the RLS setup to avoid the foreign key error

-- 1. Drop the foreign key constraint
ALTER TABLE core_organizations 
DROP CONSTRAINT IF EXISTS core_organizations_client_id_fkey;

-- 2. Drop the client_id column (optional - only if you don't need it)
-- Commented out by default - uncomment if you want to remove the column entirely
-- ALTER TABLE core_organizations DROP COLUMN IF EXISTS client_id;

-- 3. Drop the core_clients table if it exists and is not needed
-- Commented out by default - uncomment if you want to remove the table
-- DROP TABLE IF EXISTS core_clients CASCADE;

-- 4. Verify the constraint is removed
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM 
    pg_constraint
WHERE 
    contype = 'f' 
    AND (conrelid::regclass::text = 'core_organizations' 
         OR confrelid::regclass::text = 'core_clients');