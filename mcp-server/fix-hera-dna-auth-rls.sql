-- ========================================
-- HERA DNA AUTH COMPATIBLE RLS FIX
-- ========================================
-- This fixes the app.current_org error while preserving
-- the sophisticated HERA Authorization DNA system
-- ========================================

-- 1. Drop problematic functions that use current_setting()
DROP FUNCTION IF EXISTS hera_current_org_id() CASCADE;
DROP FUNCTION IF EXISTS get_current_organization_id() CASCADE;
DROP FUNCTION IF EXISTS set_current_org_id(uuid) CASCADE;

-- 2. Create HERA DNA AUTH compatible functions
-- These work with Supabase constraints but maintain the authorization logic

-- Get current user's entity ID from JWT
CREATE OR REPLACE FUNCTION hera_current_user_entity_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'entity_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

-- Get organizations the current user has access to
CREATE OR REPLACE FUNCTION hera_user_organizations()
RETURNS TABLE(organization_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH user_memberships AS (
    SELECT DISTINCT cr.organization_id
    FROM core_relationships cr
    WHERE cr.from_entity_id = hera_current_user_entity_id()
      AND cr.relationship_type = 'membership'
      AND cr.is_active = true
      AND (cr.expiration_date IS NULL OR cr.expiration_date > NOW())
  )
  SELECT um.organization_id FROM user_memberships um
  UNION
  -- Always include platform organization for system access
  SELECT '00000000-0000-0000-0000-000000000000'::uuid;
$$;

-- Check if user has access to specific organization
CREATE OR REPLACE FUNCTION hera_can_access_org(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM hera_user_organizations() 
    WHERE organization_id = target_org_id
  );
$$;

-- Get user's scopes for a specific organization
CREATE OR REPLACE FUNCTION hera_user_scopes(target_org_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    ARRAY_AGG(scope)::text[],
    ARRAY[]::text[]
  ) 
  FROM (
    SELECT DISTINCT unnest(
      COALESCE(
        (cr.relationship_data ->> 'scopes')::text[],
        ARRAY[]::text[]
      )
    ) as scope
    FROM core_relationships cr
    WHERE cr.from_entity_id = hera_current_user_entity_id()
      AND cr.organization_id = target_org_id
      AND cr.relationship_type = 'membership'
      AND cr.is_active = true
      AND (cr.expiration_date IS NULL OR cr.expiration_date > NOW())
  ) scopes;
$$;

-- 3. Update RLS policies to use the new functions

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable insert for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable update for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable delete for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "dynamic_data_org_isolation" ON core_dynamic_data;
DROP POLICY IF EXISTS "entities_org_isolation" ON core_entities;
DROP POLICY IF EXISTS "relationships_org_isolation" ON core_relationships;
DROP POLICY IF EXISTS "transactions_org_isolation" ON universal_transactions;
DROP POLICY IF EXISTS "transaction_lines_org_isolation" ON universal_transaction_lines;

-- Create HERA DNA AUTH compatible policies

-- Core Dynamic Data (org settings, policies, etc.)
CREATE POLICY "hera_dna_dynamic_data_access" ON core_dynamic_data
FOR ALL USING (
  auth.role() = 'service_role' OR
  hera_can_access_org(organization_id)
);

-- Core Entities (customers, users, products, etc.)
CREATE POLICY "hera_dna_entities_access" ON core_entities
FOR ALL USING (
  auth.role() = 'service_role' OR
  hera_can_access_org(organization_id)
);

-- Core Relationships (memberships, hierarchies, etc.)
CREATE POLICY "hera_dna_relationships_access" ON core_relationships
FOR ALL USING (
  auth.role() = 'service_role' OR
  hera_can_access_org(organization_id)
);

-- Universal Transactions (appointments, orders, payments, etc.)
CREATE POLICY "hera_dna_transactions_access" ON universal_transactions
FOR ALL USING (
  auth.role() = 'service_role' OR
  hera_can_access_org(organization_id)
);

-- Universal Transaction Lines (appointment services, order items, etc.)
CREATE POLICY "hera_dna_transaction_lines_access" ON universal_transaction_lines
FOR ALL USING (
  auth.role() = 'service_role' OR
  hera_can_access_org(organization_id)
);

-- Core Organizations (allow reading all for organization selection)
DROP POLICY IF EXISTS "Enable read access for organization members" ON core_organizations;
CREATE POLICY "hera_dna_organizations_read" ON core_organizations
FOR SELECT USING (
  auth.role() = 'service_role' OR
  auth.role() = 'authenticated' OR
  auth.role() = 'anon'
);

-- Allow service_role to modify organizations (for demo setup)
CREATE POLICY "hera_dna_organizations_service" ON core_organizations
FOR ALL USING (auth.role() = 'service_role');

-- 4. Create helper function for scope checking (for future use)
CREATE OR REPLACE FUNCTION hera_has_scope(scope_pattern text, target_org_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN target_org_id IS NULL THEN EXISTS(
      SELECT 1 FROM hera_user_organizations() uo
      WHERE scope_pattern = ANY(hera_user_scopes(uo.organization_id))
    )
    ELSE scope_pattern = ANY(hera_user_scopes(target_org_id))
  END;
$$;

-- 5. Test the new functions
SELECT 'HERA DNA AUTH RLS functions created successfully!' as status;

-- Show available functions
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE 'hera_%'
ORDER BY routine_name;

-- Show current policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('core_dynamic_data', 'core_entities', 'core_relationships', 'universal_transactions', 'universal_transaction_lines', 'core_organizations')
  AND policyname LIKE '%hera_dna%'
ORDER BY tablename, policyname;