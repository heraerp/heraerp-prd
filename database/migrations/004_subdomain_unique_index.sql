-- Migration: Add unique index for subdomain safety
-- Smart Code: HERA.SYSTEM.MIGRATION.SUBDOMAIN_UNIQUE.V1
-- Purpose: Prevent subdomain conflicts and ensure data integrity

-- Create unique index on subdomain to prevent conflicts
-- This ensures no two organizations can have the same subdomain
CREATE UNIQUE INDEX IF NOT EXISTS ux_core_orgs_settings_subdomain
ON core_organizations ((settings->>'subdomain'))
WHERE settings->>'subdomain' IS NOT NULL;

-- Add comment for documentation
COMMENT ON INDEX ux_core_orgs_settings_subdomain IS 
'Unique constraint on subdomain field in settings JSONB - HERA.SYSTEM.INDEX.SUBDOMAIN_UNIQUE.V1';

-- Migration complete
-- This index ensures data integrity for subdomain routing