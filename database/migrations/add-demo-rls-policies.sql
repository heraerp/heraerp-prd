-- Add RLS policies to allow public read access for demo organizations
-- This allows the ice cream, restaurant, salon, and other demo dashboards to work without authentication

-- Define demo organization IDs
DO $$
DECLARE
  demo_org_ids uuid[] := ARRAY[
    '1471e87b-b27e-42ef-8192-343cc5e0d656'::uuid, -- Kochi Ice Cream Manufacturing
    '8c4f6b2d-5a91-4e8c-b3d7-1f9e8a7c6d54'::uuid, -- Mario's Restaurant
    'a2e5f8d9-7b3c-4f6e-9d1a-8c7e5b4a2f9d'::uuid, -- Dr. Smith's Practice
    'c7d9e4f8-3b2a-4e6d-8f1c-9a7b5c3d2e8f'::uuid, -- Bella Beauty Salon
    'e5f8a9d7-2c3b-4f7e-8d1a-7b6c4e3f2a9d'::uuid  -- TechGear Electronics
  ];
BEGIN
  -- Core Organizations - Allow public read for demo orgs
  CREATE POLICY IF NOT EXISTS "Allow public read for demo organizations"
    ON core_organizations
    FOR SELECT
    USING (id = ANY(demo_org_ids));

  -- Core Entities - Allow public read for demo org entities
  CREATE POLICY IF NOT EXISTS "Allow public read for demo organization entities"
    ON core_entities
    FOR SELECT
    USING (organization_id = ANY(demo_org_ids));

  -- Core Dynamic Data - Allow public read for demo org data
  CREATE POLICY IF NOT EXISTS "Allow public read for demo organization dynamic data"
    ON core_dynamic_data
    FOR SELECT
    USING (organization_id = ANY(demo_org_ids));

  -- Core Relationships - Allow public read for demo org relationships
  CREATE POLICY IF NOT EXISTS "Allow public read for demo organization relationships"
    ON core_relationships
    FOR SELECT
    USING (organization_id = ANY(demo_org_ids));

  -- Universal Transactions - Allow public read for demo org transactions
  CREATE POLICY IF NOT EXISTS "Allow public read for demo organization transactions"
    ON universal_transactions
    FOR SELECT
    USING (organization_id = ANY(demo_org_ids));

  -- Universal Transaction Lines - Allow public read for demo org transaction lines
  CREATE POLICY IF NOT EXISTS "Allow public read for demo organization transaction lines"
    ON universal_transaction_lines
    FOR SELECT
    USING (
      transaction_id IN (
        SELECT id FROM universal_transactions 
        WHERE organization_id = ANY(demo_org_ids)
      )
    );
END $$;

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN (
  'core_organizations',
  'core_entities',
  'core_dynamic_data',
  'core_relationships',
  'universal_transactions',
  'universal_transaction_lines'
)
AND policyname LIKE '%demo%'
ORDER BY tablename, policyname;