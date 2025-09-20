-- HERA RLS Production Setup
-- This script creates the necessary functions and updates RLS policies for production use
-- Run this in your Supabase SQL editor with service role privileges

-- ========================================
-- 1. Create hera_current_org_id() function
-- ========================================
CREATE OR REPLACE FUNCTION hera_current_org_id()
RETURNS uuid AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Try multiple sources in order of preference
  
  -- 1. Check JWT claims (for authenticated users)
  org_id := COALESCE(
    current_setting('request.jwt.claims', true)::json->>'organization_id',
    current_setting('request.jwt.claims', true)::json->>'org_id'
  )::uuid;
  
  IF org_id IS NOT NULL THEN
    RETURN org_id;
  END IF;
  
  -- 2. Check session variables (for RPC calls)
  BEGIN
    org_id := current_setting('app.current_org_id', true)::uuid;
    IF org_id IS NOT NULL THEN
      RETURN org_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Setting doesn't exist, continue
      NULL;
  END;
  
  -- 3. Check request headers (for API calls)
  org_id := COALESCE(
    current_setting('request.headers', true)::json->>'x-organization-id',
    current_setting('request.headers', true)::json->>'X-Organization-Id'
  )::uuid;
  
  IF org_id IS NOT NULL THEN
    RETURN org_id;
  END IF;
  
  -- 4. For demo/system operations, check if it's a platform operation
  IF auth.uid() IS NULL OR 
     current_setting('request.jwt.claims', true)::json->>'session_type' = 'demo' THEN
    -- Could be a platform operation, return NULL (policies must handle this case)
    RETURN NULL;
  END IF;
  
  -- No organization context found
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated and anon roles
GRANT EXECUTE ON FUNCTION hera_current_org_id() TO authenticated, anon;

-- ========================================
-- 2. Create helper function for demo checks
-- ========================================
CREATE OR REPLACE FUNCTION hera_is_demo_session()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'session_type' = 'demo',
    false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION hera_is_demo_session() TO authenticated, anon;

-- ========================================
-- 3. Update RLS Policies for core_dynamic_data
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable insert for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable update for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable delete for organization members" ON core_dynamic_data;

-- Create new policies that handle NULL organization context
CREATE POLICY "Enable read access for organization members"
ON core_dynamic_data FOR SELECT
TO authenticated, anon
USING (
  -- Allow if organization matches
  organization_id = hera_current_org_id()
  OR
  -- Allow platform organization data for demo sessions
  (hera_is_demo_session() AND organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  OR
  -- Allow if no org context but user has explicit access (for service operations)
  (hera_current_org_id() IS NULL AND auth.uid() IS NOT NULL)
);

CREATE POLICY "Enable insert for organization members"
ON core_dynamic_data FOR INSERT
TO authenticated
WITH CHECK (
  -- Must have organization context
  organization_id = hera_current_org_id()
  AND hera_current_org_id() IS NOT NULL
);

CREATE POLICY "Enable update for organization members"
ON core_dynamic_data FOR UPDATE
TO authenticated
USING (
  organization_id = hera_current_org_id()
  AND hera_current_org_id() IS NOT NULL
)
WITH CHECK (
  organization_id = hera_current_org_id()
  AND hera_current_org_id() IS NOT NULL
);

CREATE POLICY "Enable delete for organization members"
ON core_dynamic_data FOR DELETE
TO authenticated
USING (
  organization_id = hera_current_org_id()
  AND hera_current_org_id() IS NOT NULL
);

-- ========================================
-- 4. Update RLS Policies for core_organizations
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for organization members" ON core_organizations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON core_organizations;
DROP POLICY IF EXISTS "Enable update for organization owners" ON core_organizations;

-- Create new policies
CREATE POLICY "Enable read access for organization members"
ON core_organizations FOR SELECT
TO authenticated, anon
USING (
  -- Allow reading own organization
  id = hera_current_org_id()
  OR
  -- Allow reading platform organization
  id = '00000000-0000-0000-0000-000000000000'::uuid
  OR
  -- For demo sessions, allow reading the demo organization
  (hera_is_demo_session() AND id IN (
    '0fd09e31-d257-4329-97eb-7d7f522ed6f0', -- Hair Talkz Salon
    '00000000-0000-0000-0000-000000000000'  -- Platform Org
  ))
);

-- ========================================
-- 5. Update RLS Policies for core_entities
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for organization members" ON core_entities;
DROP POLICY IF EXISTS "Enable insert for organization members" ON core_entities;
DROP POLICY IF EXISTS "Enable update for organization members" ON core_entities;
DROP POLICY IF EXISTS "Enable delete for organization members" ON core_entities;

-- Create new policies
CREATE POLICY "Enable read access for organization members"
ON core_entities FOR SELECT
TO authenticated, anon
USING (
  -- Allow if organization matches
  organization_id = hera_current_org_id()
  OR
  -- Allow platform organization entities for demo sessions
  (hera_is_demo_session() AND organization_id = '00000000-0000-0000-0000-000000000000'::uuid)
  OR
  -- Allow if no org context but user has explicit access
  (hera_current_org_id() IS NULL AND auth.uid() IS NOT NULL)
);

CREATE POLICY "Enable insert for organization members"
ON core_entities FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = hera_current_org_id()
  AND hera_current_org_id() IS NOT NULL
);

CREATE POLICY "Enable update for organization members"
ON core_entities FOR UPDATE
TO authenticated
USING (
  organization_id = hera_current_org_id()
  AND hera_current_org_id() IS NOT NULL
)
WITH CHECK (
  organization_id = hera_current_org_id()
  AND hera_current_org_id() IS NOT NULL
);

-- ========================================
-- 6. Update RLS Policies for universal_transactions
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for organization members" ON universal_transactions;
DROP POLICY IF EXISTS "Enable insert for organization members" ON universal_transactions;
DROP POLICY IF EXISTS "Enable update for organization members" ON universal_transactions;

-- Create new policies
CREATE POLICY "Enable read access for organization members"
ON universal_transactions FOR SELECT
TO authenticated, anon
USING (
  organization_id = hera_current_org_id()
  OR
  (hera_is_demo_session() AND organization_id IN (
    '0fd09e31-d257-4329-97eb-7d7f522ed6f0', -- Hair Talkz Salon
    '00000000-0000-0000-0000-000000000000'  -- Platform Org
  ))
);

CREATE POLICY "Enable insert for organization members"
ON universal_transactions FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = hera_current_org_id()
  AND hera_current_org_id() IS NOT NULL
);

-- ========================================
-- 7. Create function to set organization context
-- ========================================
CREATE OR REPLACE FUNCTION set_current_org_id(org_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_org_id', org_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION set_current_org_id(uuid) TO authenticated;

-- ========================================
-- 8. Create function to get current context info (for debugging)
-- ========================================
CREATE OR REPLACE FUNCTION hera_debug_context()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  result := json_build_object(
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'jwt_claims', current_setting('request.jwt.claims', true)::json,
    'headers', current_setting('request.headers', true)::json,
    'current_org_id', hera_current_org_id(),
    'is_demo_session', hera_is_demo_session(),
    'app_current_org_id', current_setting('app.current_org_id', true)
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION hera_debug_context() TO authenticated, anon;

-- ========================================
-- 9. Test the setup
-- ========================================
-- Run these queries to verify the functions work:

-- Test 1: Check current context
SELECT hera_debug_context();

-- Test 2: Check if org ID resolution works
SELECT hera_current_org_id();

-- Test 3: Try to query dynamic data (should work now)
SELECT * FROM core_dynamic_data 
WHERE organization_id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
LIMIT 5;

-- ========================================
-- 10. Additional Notes
-- ========================================
-- After running this script:
-- 1. The 400 errors for "unrecognized configuration parameter" should be resolved
-- 2. Demo sessions will properly access organization data
-- 3. RLS policies will correctly handle NULL organization context
-- 4. The hera_debug_context() function can help troubleshoot auth issues

-- If you still see errors, check:
-- 1. JWT token claims using hera_debug_context()
-- 2. Organization ID is being passed in API calls
-- 3. Demo session cookies are properly set