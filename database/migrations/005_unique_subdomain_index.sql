-- Create unique index on subdomain to prevent collisions
-- This ensures each subdomain is unique across all organizations
CREATE UNIQUE INDEX IF NOT EXISTS ux_core_orgs_settings_subdomain
ON core_organizations ((settings->>'subdomain'))
WHERE settings->>'subdomain' IS NOT NULL
AND status = 'active';

-- Also create an index for faster subdomain lookups
CREATE INDEX IF NOT EXISTS ix_core_orgs_settings_subdomain_lookup
ON core_organizations ((settings->>'subdomain'))
WHERE status = 'active';