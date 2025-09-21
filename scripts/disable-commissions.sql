-- Disable commissions for an organization (policy-as-data approach)
-- This allows simple POS operations without stylist requirements
-- 
-- Usage: Replace the organization_id with your actual organization UUID
--
-- To disable commissions:
UPDATE core_organizations
SET settings = jsonb_set(
  coalesce(settings, '{}'::jsonb),
  '{salon,commissions,enabled}',
  'false'::jsonb,
  true
)
WHERE id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; -- Default salon demo org

-- To re-enable commissions later:
-- UPDATE core_organizations
-- SET settings = jsonb_set(
--   coalesce(settings, '{}'::jsonb),
--   '{salon,commissions,enabled}',
--   'true'::jsonb,
--   true
-- )
-- WHERE id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

-- Verify the setting:
SELECT id, entity_name, settings->'salon'->'commissions'->'enabled' as commissions_enabled
FROM core_organizations 
WHERE id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';