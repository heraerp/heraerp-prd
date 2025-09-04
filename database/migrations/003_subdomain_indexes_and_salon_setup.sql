-- Migration: Add subdomain support and setup salon organizations
-- Smart Code: HERA.SYSTEM.MIGRATION.SUBDOMAIN.v1
-- Purpose: Enable fast subdomain lookups and configure salon organizations

-- Step 1: Create indexes for subdomain lookups using existing settings JSONB field
-- This follows HERA DNA principles - no new columns, just leverage existing architecture

-- Create a unique index on subdomain in the settings JSONB field
-- This ensures subdomains are unique and enables fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_subdomain 
ON core_organizations ((settings->>'subdomain')) 
WHERE settings->>'subdomain' IS NOT NULL;

-- Create a GIN index on the domains array for multi-domain support
-- This allows organizations to have multiple custom domains
CREATE INDEX IF NOT EXISTS idx_organizations_domains 
ON core_organizations USING GIN ((settings->'domains')) 
WHERE settings->'domains' IS NOT NULL;

-- Step 2: Create or replace the organization resolver function
CREATE OR REPLACE FUNCTION get_organization_by_subdomain(p_subdomain text)
RETURNS TABLE (
  id uuid,
  organization_code character varying,
  organization_name character varying,
  settings jsonb,
  status character varying
) AS $$
BEGIN
  -- First try exact subdomain match
  RETURN QUERY
  SELECT 
    o.id,
    o.organization_code,
    o.organization_name,
    o.settings,
    o.status
  FROM core_organizations o
  WHERE o.settings->>'subdomain' = p_subdomain
    AND o.status = 'active'
  LIMIT 1;
  
  -- If no result, try custom domains array
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      o.id,
      o.organization_code,
      o.organization_name,
      o.settings,
      o.status
    FROM core_organizations o
    WHERE o.settings->'domains' ? p_subdomain
      AND o.status = 'active'
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update salon organizations with subdomain settings
-- Using .lvh.me for local development (resolves to 127.0.0.1)

-- Hair Talkz Park Regis Branch
UPDATE core_organizations
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{subdomain}',
  '"hair-talkz-karama"'::jsonb,
  true
)
WHERE id = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'
  AND organization_code = 'SALON-BR1';

-- Add local development domains
UPDATE core_organizations
SET settings = jsonb_set(
  settings,
  '{domains}',
  '["hair-talkz-karama.lvh.me", "hair-talkz-karama.localhost"]'::jsonb,
  true
)
WHERE id = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'
  AND organization_code = 'SALON-BR1';

-- Hair Talkz Mercure Gold Branch
UPDATE core_organizations
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{subdomain}',
  '"hair-talkz-mina"'::jsonb,
  true
)
WHERE id = '0b1b37cd-4096-4718-8cd4-e370f234005b'
  AND organization_code = 'SALON-BR2';

-- Add local development domains
UPDATE core_organizations
SET settings = jsonb_set(
  settings,
  '{domains}',
  '["hair-talkz-mina.lvh.me", "hair-talkz-mina.localhost"]'::jsonb,
  true
)
WHERE id = '0b1b37cd-4096-4718-8cd4-e370f234005b'
  AND organization_code = 'SALON-BR2';

-- Salon Group (parent organization)
UPDATE core_organizations
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{subdomain}',
  '"salon-group"'::jsonb,
  true
)
WHERE id = '849b6efe-2bf0-438f-9c70-01835ac2fe15'
  AND organization_code = 'SALON-GROUP';

-- Add local development domains
UPDATE core_organizations
SET settings = jsonb_set(
  settings,
  '{domains}',
  '["salon-group.lvh.me", "salon-group.localhost"]'::jsonb,
  true
)
WHERE id = '849b6efe-2bf0-438f-9c70-01835ac2fe15'
  AND organization_code = 'SALON-GROUP';

-- Step 4: Add helpful comments for future reference
COMMENT ON INDEX idx_organizations_subdomain IS 'Unique index on subdomain for fast organization lookups - HERA.SYSTEM.INDEX.SUBDOMAIN.v1';
COMMENT ON INDEX idx_organizations_domains IS 'GIN index on domains array for multi-domain support - HERA.SYSTEM.INDEX.DOMAINS.v1';
COMMENT ON FUNCTION get_organization_by_subdomain IS 'Resolver function for subdomain-based organization lookups - HERA.SYSTEM.FUNCTION.SUBDOMAIN_RESOLVER.v1';

-- Step 5: Create a helper view for subdomain management
CREATE OR REPLACE VIEW v_organization_subdomains AS
SELECT 
  id,
  organization_code,
  organization_name,
  settings->>'subdomain' as subdomain,
  settings->'domains' as domains,
  status,
  created_at,
  updated_at
FROM core_organizations
WHERE settings->>'subdomain' IS NOT NULL
   OR settings->'domains' IS NOT NULL
ORDER BY organization_name;

COMMENT ON VIEW v_organization_subdomains IS 'View for managing organization subdomains and custom domains - HERA.SYSTEM.VIEW.SUBDOMAINS.v1';

-- Migration complete
-- To verify:
-- SELECT * FROM v_organization_subdomains;
-- SELECT * FROM get_organization_by_subdomain('hair-talkz-karama');