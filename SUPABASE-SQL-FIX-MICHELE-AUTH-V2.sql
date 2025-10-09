-- SUPABASE SQL EDITOR - Execute this to fix Michele's authentication (V2)
-- ======================================================================
-- Run this SQL in the Supabase SQL Editor to enable Michele's login

-- 1. Drop existing functions first (if they exist)
DROP FUNCTION IF EXISTS resolve_user_identity_v1();
DROP FUNCTION IF EXISTS resolve_user_roles_in_org(UUID);

-- 2. Create resolve_user_identity_v1 function with correct return type
CREATE OR REPLACE FUNCTION resolve_user_identity_v1()
RETURNS jsonb[]
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT ARRAY[jsonb_build_object(
    'user_id', auth.uid(),
    'organization_ids', COALESCE(
      (SELECT array_agg(DISTINCT r.to_entity_id)
       FROM core_relationships r
       WHERE r.from_entity_id = auth.uid()
       AND r.relationship_type = 'USER_MEMBER_OF_ORG'
       AND r.is_active = true),
      ARRAY[]::UUID[]
    )
  )]::jsonb[];
$$;

-- 3. Create resolve_user_roles_in_org function
CREATE OR REPLACE FUNCTION resolve_user_roles_in_org(p_org UUID)
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT ARRAY[r.relationship_data->>'role']
     FROM core_relationships r
     WHERE r.from_entity_id = auth.uid()
     AND r.to_entity_id = p_org
     AND r.relationship_type = 'USER_MEMBER_OF_ORG'
     AND r.is_active = true
     LIMIT 1),
    ARRAY['user']::text[]
  );
$$;

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION resolve_user_identity_v1() TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_user_identity_v1() TO anon;
GRANT EXECUTE ON FUNCTION resolve_user_roles_in_org(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_user_roles_in_org(UUID) TO anon;

-- 5. Test the functions (optional - you can run these to verify)
-- SELECT 'Testing resolve_user_identity_v1...' as test;
-- SELECT resolve_user_identity_v1();
-- 
-- SELECT 'Testing resolve_user_roles_in_org...' as test;
-- SELECT resolve_user_roles_in_org('378f24fb-d496-4ff7-8afa-ea34895a0eb8'::UUID);

-- Success message
SELECT 'Authentication RPC functions created successfully!' as status,
       'Michele can now login with michele@hairtalkz.ae / HairTalkz2024!' as instructions,
       'Execute this after SQL: Clear browser cache and login' as next_step;