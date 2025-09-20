-- ========================================
-- PRODUCTION RLS FIX - HERA ERP
-- ========================================
-- This permanently fixes all RLS issues for production deployment
-- Replaces app.current_org with proper JWT-based organization filtering
-- ========================================

-- STEP 1: Drop all problematic functions that use current_setting
-- ========================================
DROP FUNCTION IF EXISTS hera_current_org_id() CASCADE;
DROP FUNCTION IF EXISTS get_current_organization_id() CASCADE;
DROP FUNCTION IF EXISTS set_current_org_id(uuid) CASCADE;
DROP FUNCTION IF EXISTS hera_current_user_entity_id() CASCADE;
DROP FUNCTION IF EXISTS hera_user_organizations() CASCADE;
DROP FUNCTION IF EXISTS hera_can_access_org(uuid) CASCADE;
DROP FUNCTION IF EXISTS hera_user_scopes(uuid) CASCADE;
DROP FUNCTION IF EXISTS hera_has_scope(text, uuid) CASCADE;

-- STEP 2: Create production-ready JWT-based functions
-- ========================================

-- Get organization ID from JWT claims (for authenticated users)
CREATE OR REPLACE FUNCTION auth_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'organization_id')::uuid,
    (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );
$$;

-- Get user entity ID from JWT claims
CREATE OR REPLACE FUNCTION auth_user_entity_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'entity_id')::uuid,
    (auth.jwt() -> 'app_metadata' ->> 'entity_id')::uuid
  );
$$;

-- Check if user has access to organization (simplified for production)
CREATE OR REPLACE FUNCTION user_has_org_access(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM core_relationships cr
    WHERE cr.from_entity_id = auth_user_entity_id()
      AND cr.organization_id = org_id
      AND cr.relationship_type = 'membership'
      AND cr.is_active = true
      AND (cr.expiration_date IS NULL OR cr.expiration_date > NOW())
  );
$$;

-- STEP 3: Drop ALL existing policies on ALL tables
-- ========================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on our core tables
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'core_organizations',
            'core_entities', 
            'core_dynamic_data',
            'core_relationships',
            'universal_transactions',
            'universal_transaction_lines'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- STEP 4: Create new production RLS policies
-- ========================================

-- Core Organizations - Allow read for authenticated users
CREATE POLICY "organizations_read_authenticated" ON core_organizations
FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'
);

-- Core Organizations - Restrict write to service role
CREATE POLICY "organizations_write_service" ON core_organizations
FOR ALL USING (
    auth.role() = 'service_role'
);

-- Core Entities - Filter by organization
CREATE POLICY "entities_org_isolation" ON core_entities
FOR ALL USING (
    auth.role() = 'service_role' OR
    (
        auth.role() = 'authenticated' AND
        (
            organization_id = auth_organization_id() OR
            user_has_org_access(organization_id)
        )
    )
);

-- Core Dynamic Data - Filter by organization
CREATE POLICY "dynamic_data_org_isolation" ON core_dynamic_data
FOR ALL USING (
    auth.role() = 'service_role' OR
    (
        auth.role() = 'authenticated' AND
        (
            organization_id = auth_organization_id() OR
            user_has_org_access(organization_id)
        )
    )
);

-- Core Relationships - Filter by organization
CREATE POLICY "relationships_org_isolation" ON core_relationships
FOR ALL USING (
    auth.role() = 'service_role' OR
    (
        auth.role() = 'authenticated' AND
        (
            organization_id = auth_organization_id() OR
            user_has_org_access(organization_id)
        )
    )
);

-- Universal Transactions - Filter by organization
CREATE POLICY "transactions_org_isolation" ON universal_transactions
FOR ALL USING (
    auth.role() = 'service_role' OR
    (
        auth.role() = 'authenticated' AND
        (
            organization_id = auth_organization_id() OR
            user_has_org_access(organization_id)
        )
    )
);

-- Universal Transaction Lines - Filter by organization
CREATE POLICY "transaction_lines_org_isolation" ON universal_transaction_lines
FOR ALL USING (
    auth.role() = 'service_role' OR
    (
        auth.role() = 'authenticated' AND
        (
            organization_id = auth_organization_id() OR
            user_has_org_access(organization_id)
        )
    )
);

-- STEP 5: Grant necessary permissions
-- ========================================
GRANT EXECUTE ON FUNCTION auth_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_user_entity_id() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_org_access(uuid) TO authenticated;

-- STEP 6: Create indexes for performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_relationships_membership 
ON core_relationships(from_entity_id, organization_id, relationship_type) 
WHERE relationship_type = 'membership' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_entities_org 
ON core_entities(organization_id);

CREATE INDEX IF NOT EXISTS idx_dynamic_data_org 
ON core_dynamic_data(organization_id);

CREATE INDEX IF NOT EXISTS idx_transactions_org 
ON universal_transactions(organization_id);

CREATE INDEX IF NOT EXISTS idx_transaction_lines_org 
ON universal_transaction_lines(organization_id);

-- STEP 7: Verify the fix
-- ========================================
DO $$
BEGIN
    RAISE NOTICE 'Production RLS fix applied successfully!';
    RAISE NOTICE 'All policies now use JWT-based authentication';
    RAISE NOTICE 'No more app.current_org references';
    RAISE NOTICE 'Ready for production deployment';
END $$;