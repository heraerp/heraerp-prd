-- HERA Smart Code Constraint Update
-- Migration: Fix smart code constraint to support all industries
-- Date: 2025-09-13

-- Drop existing restrictive constraint
ALTER TABLE core_entities 
DROP CONSTRAINT IF EXISTS core_entities_smart_code_ck;

-- Add updated universal constraint (supports all industries)
ALTER TABLE core_entities 
ADD CONSTRAINT core_entities_smart_code_ck 
CHECK (smart_code ~ '^HERA\.[A-Z0-9_]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$');

-- Verify constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'core_entities_smart_code_ck';
