-- HERA RLS Functions Setup
-- Run this first to create the necessary functions

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
-- 3. Create function to set organization context
-- ========================================
CREATE OR REPLACE FUNCTION set_current_org_id(org_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_org_id', org_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION set_current_org_id(uuid) TO authenticated;

-- ========================================
-- 4. Create function to get current context info (for debugging)
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
-- 5. Test the functions
-- ========================================
-- Test 1: Check current context
SELECT hera_debug_context();

-- Test 2: Check if org ID resolution works
SELECT hera_current_org_id();

-- Test 3: Check if demo session detection works
SELECT hera_is_demo_session();