-- ========================================
-- HERA DNA AUTH DEMO SESSION COMPATIBILITY UPDATE
-- ========================================
-- This updates the HERA DNA RLS functions to work with demo sessions
-- ========================================

-- Update hera_current_user_entity_id to check for demo headers
CREATE OR REPLACE FUNCTION hera_current_user_entity_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  demo_entity_id text;
  jwt_entity_id text;
BEGIN
  -- First check if this is a demo session via headers
  demo_entity_id := current_setting('request.headers', true)::json ->> 'x-demo-entity-id';
  
  IF demo_entity_id IS NOT NULL AND demo_entity_id != '' THEN
    RETURN demo_entity_id::uuid;
  END IF;
  
  -- Fall back to JWT entity_id
  jwt_entity_id := auth.jwt() ->> 'entity_id';
  
  IF jwt_entity_id IS NOT NULL AND jwt_entity_id != '' THEN
    RETURN jwt_entity_id::uuid;
  END IF;
  
  -- Default fallback
  RETURN '00000000-0000-0000-0000-000000000000'::uuid;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN '00000000-0000-0000-0000-000000000000'::uuid;
END;
$$;

-- Update hera_can_access_org to check for demo organization
CREATE OR REPLACE FUNCTION hera_can_access_org(target_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  demo_org_id text;
  current_entity_id uuid;
BEGIN
  -- Check if this is a demo session with the target organization
  demo_org_id := current_setting('request.headers', true)::json ->> 'x-demo-organization-id';
  
  IF demo_org_id IS NOT NULL AND demo_org_id != '' AND demo_org_id::uuid = target_org_id THEN
    RETURN true;
  END IF;
  
  -- Fall back to regular membership checking
  current_entity_id := hera_current_user_entity_id();
  
  RETURN EXISTS(
    SELECT 1 FROM hera_user_organizations() 
    WHERE organization_id = target_org_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Update hera_user_scopes to handle demo sessions
CREATE OR REPLACE FUNCTION hera_user_scopes(target_org_id uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  demo_org_id text;
  demo_entity_id text;
  current_entity_id uuid;
BEGIN
  -- Check if this is a demo session
  demo_org_id := current_setting('request.headers', true)::json ->> 'x-demo-organization-id';
  demo_entity_id := current_setting('request.headers', true)::json ->> 'x-demo-entity-id';
  
  IF demo_org_id IS NOT NULL AND demo_org_id != '' AND 
     demo_entity_id IS NOT NULL AND demo_entity_id != '' AND
     demo_org_id::uuid = target_org_id THEN
    
    -- For demo sessions, get scopes from membership relationship
    RETURN COALESCE(
      (SELECT ARRAY_AGG(scope)::text[]
       FROM (
         SELECT DISTINCT unnest(
           COALESCE(
             (cr.relationship_data ->> 'scopes')::text[],
             ARRAY[]::text[]
           )
         ) as scope
         FROM core_relationships cr
         WHERE cr.from_entity_id = demo_entity_id::uuid
           AND cr.organization_id = target_org_id
           AND cr.relationship_type = 'membership'
           AND cr.is_active = true
           AND (cr.expiration_date IS NULL OR cr.expiration_date > NOW())
       ) scopes),
      ARRAY[]::text[]
    );
  END IF;
  
  -- Fall back to regular scope checking
  current_entity_id := hera_current_user_entity_id();
  
  RETURN COALESCE(
    (SELECT ARRAY_AGG(scope)::text[]
     FROM (
       SELECT DISTINCT unnest(
         COALESCE(
           (cr.relationship_data ->> 'scopes')::text[],
           ARRAY[]::text[]
         )
       ) as scope
       FROM core_relationships cr
       WHERE cr.from_entity_id = current_entity_id
         AND cr.organization_id = target_org_id
         AND cr.relationship_type = 'membership'
         AND cr.is_active = true
         AND (cr.expiration_date IS NULL OR cr.expiration_date > NOW())
     ) scopes),
    ARRAY[]::text[]
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN ARRAY[]::text[];
END;
$$;

-- Test the updated functions
SELECT 'HERA DNA AUTH demo compatibility updated successfully!' as status;

-- Show the updated functions
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE 'hera_%'
ORDER BY routine_name;