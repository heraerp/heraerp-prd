-- Remove core_clients foreign key constraint
-- This is the only remaining issue

ALTER TABLE core_organizations 
DROP CONSTRAINT IF EXISTS core_organizations_client_id_fkey;