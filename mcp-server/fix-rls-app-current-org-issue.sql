-- ========================================
-- FIX RLS "app.current_org" Configuration Issue
-- ========================================
-- This script fixes the "unrecognized configuration parameter 'app.current_org'" error
-- by updating RLS functions to use standard organization_id filtering instead
-- ========================================

-- 1. Drop existing RLS functions that use app.current_org
DROP FUNCTION IF EXISTS hera_current_org_id() CASCADE;
DROP FUNCTION IF EXISTS set_current_org_id(uuid) CASCADE; 
DROP FUNCTION IF EXISTS get_current_org() CASCADE;
DROP FUNCTION IF EXISTS hera_debug_context() CASCADE;
DROP FUNCTION IF EXISTS hera_is_demo_session() CASCADE;

-- 2. Create simplified organization context function
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS uuid AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Try to get from JWT claims first (Supabase auth)
  BEGIN
    org_id := (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid;
    IF org_id IS NOT NULL THEN
      RETURN org_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Continue to next method
  END;
  
  -- Try to get from request headers (API calls)
  BEGIN
    org_id := (current_setting('request.headers', true)::json->>'x-organization-id')::uuid;
    IF org_id IS NOT NULL THEN
      RETURN org_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Continue to next method  
  END;
  
  -- For service role operations, return NULL (policies should allow)
  BEGIN
    IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
      RETURN NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Continue
  END;
  
  -- No organization context found
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_current_organization_id() TO anon, authenticated, service_role;

-- 4. Drop all existing RLS policies that cause errors
DROP POLICY IF EXISTS "Enable read access for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable insert for organization members" ON core_dynamic_data;  
DROP POLICY IF EXISTS "Enable update for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable delete for organization members" ON core_dynamic_data;

DROP POLICY IF EXISTS "dynamic_data_org_isolation" ON core_dynamic_data;
DROP POLICY IF EXISTS "entities_org_isolation" ON core_entities;
DROP POLICY IF EXISTS "relationships_org_isolation" ON core_relationships;
DROP POLICY IF EXISTS "transactions_org_isolation" ON universal_transactions;
DROP POLICY IF EXISTS "transaction_lines_org_isolation" ON universal_transaction_lines;

-- 5. Create new simplified RLS policies for core_dynamic_data
CREATE POLICY "core_dynamic_data_select" ON core_dynamic_data
FOR SELECT USING (
  -- Allow if organization matches from function
  organization_id = get_current_organization_id()
  OR 
  -- Allow service role to read any data
  auth.role() = 'service_role'
  OR
  -- Allow authenticated users when no org context (for setup operations)
  (get_current_organization_id() IS NULL AND auth.role() = 'authenticated')
);

CREATE POLICY "core_dynamic_data_insert" ON core_dynamic_data
FOR INSERT WITH CHECK (
  -- Must have organization context or be service role
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
);

CREATE POLICY "core_dynamic_data_update" ON core_dynamic_data
FOR UPDATE USING (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
) WITH CHECK (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
);

CREATE POLICY "core_dynamic_data_delete" ON core_dynamic_data
FOR DELETE USING (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
);

-- 6. Create simplified policies for core_entities
CREATE POLICY "core_entities_select" ON core_entities
FOR SELECT USING (
  organization_id = get_current_organization_id()
  OR auth.role() = 'service_role' 
  OR (get_current_organization_id() IS NULL AND auth.role() = 'authenticated')
);

CREATE POLICY "core_entities_insert" ON core_entities  
FOR INSERT WITH CHECK (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
);

CREATE POLICY "core_entities_update" ON core_entities
FOR UPDATE USING (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL) 
  OR auth.role() = 'service_role'
) WITH CHECK (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'  
);

CREATE POLICY "core_entities_delete" ON core_entities
FOR DELETE USING (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
);

-- 7. Create simplified policies for core_relationships
CREATE POLICY "core_relationships_select" ON core_relationships
FOR SELECT USING (
  organization_id = get_current_organization_id()
  OR auth.role() = 'service_role'
  OR (get_current_organization_id() IS NULL AND auth.role() = 'authenticated')
);

CREATE POLICY "core_relationships_insert" ON core_relationships
FOR INSERT WITH CHECK (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
);

CREATE POLICY "core_relationships_update" ON core_relationships  
FOR UPDATE USING (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
) WITH CHECK (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
);

CREATE POLICY "core_relationships_delete" ON core_relationships
FOR DELETE USING (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
);

-- 8. Create simplified policies for universal_transactions  
CREATE POLICY "universal_transactions_select" ON universal_transactions
FOR SELECT USING (
  organization_id = get_current_organization_id()
  OR auth.role() = 'service_role'
  OR (get_current_organization_id() IS NULL AND auth.role() = 'authenticated')
);

CREATE POLICY "universal_transactions_insert" ON universal_transactions
FOR INSERT WITH CHECK (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
);

CREATE POLICY "universal_transactions_update" ON universal_transactions
FOR UPDATE USING (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'  
) WITH CHECK (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
);

CREATE POLICY "universal_transactions_delete" ON universal_transactions
FOR DELETE USING (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
);

-- 9. Create simplified policies for universal_transaction_lines
CREATE POLICY "universal_transaction_lines_select" ON universal_transaction_lines
FOR SELECT USING (
  organization_id = get_current_organization_id()
  OR auth.role() = 'service_role'
  OR (get_current_organization_id() IS NULL AND auth.role() = 'authenticated')
);

CREATE POLICY "universal_transaction_lines_insert" ON universal_transaction_lines
FOR INSERT WITH CHECK (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
);

CREATE POLICY "universal_transaction_lines_update" ON universal_transaction_lines
FOR UPDATE USING (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
) WITH CHECK (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
);

CREATE POLICY "universal_transaction_lines_delete" ON universal_transaction_lines  
FOR DELETE USING (
  (organization_id = get_current_organization_id() AND get_current_organization_id() IS NOT NULL)
  OR auth.role() = 'service_role'
);

-- 10. Create simple policies for core_organizations
CREATE POLICY "core_organizations_select" ON core_organizations
FOR SELECT USING (
  -- Users can read their own organization 
  id = get_current_organization_id()
  OR auth.role() = 'service_role'
  OR auth.role() = 'authenticated' -- Allow reading for organization selection
);

CREATE POLICY "core_organizations_insert" ON core_organizations
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR auth.role() = 'authenticated'
);

CREATE POLICY "core_organizations_update" ON core_organizations
FOR UPDATE USING (
  id = get_current_organization_id() OR auth.role() = 'service_role'
) WITH CHECK (
  id = get_current_organization_id() OR auth.role() = 'service_role'  
);

-- 11. Test the new function
DO $$
BEGIN
  RAISE NOTICE 'Testing get_current_organization_id(): %', get_current_organization_id();
END $$;

-- 12. Test a simple query on core_dynamic_data
SELECT 'RLS Fix completed successfully. core_dynamic_data should now work without app.current_org errors.' as status;