-- Fixed User Membership RPC Function
-- Addresses the duplicate MEMBER_OF relationship issues we just fixed
-- This replaces any existing user membership setup function

CREATE OR REPLACE FUNCTION hera_setup_user_membership_fixed(
  p_supabase_user_id uuid,
  p_organization_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_entity_id uuid;
  v_org_entity_id uuid;
  v_membership_id uuid;
  v_existing_memberships uuid[];
  v_user_email text;
  v_user_name text;
  v_auth_user record;
BEGIN
  -- ✅ Step 1: Get user info from Supabase auth.users
  SELECT 
    email,
    COALESCE(
      raw_user_meta_data->>'full_name',
      raw_user_meta_data->>'name',
      raw_user_meta_data->>'display_name',
      email,
      'User'
    ) as display_name
  INTO v_auth_user
  FROM auth.users
  WHERE id = p_supabase_user_id;

  -- If user not found in auth, raise error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supabase user not found: %', p_supabase_user_id;
  END IF;

  v_user_email := v_auth_user.email;
  v_user_name := v_auth_user.display_name;

  -- ✅ Step 2: Create or update USER entity in TENANT org (not platform)
  INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    smart_code_status,
    status,
    metadata,
    created_by,
    updated_by
  ) VALUES (
    p_supabase_user_id,
    p_organization_id, -- ✅ FIXED: Store in tenant org, not platform
    'USER',
    v_user_name,
    'USER-' || substring(p_supabase_user_id::text, 1, 8),
    'HERA.AUTH.USER.ENTITY.V1', -- ✅ FIXED: Proper smart code
    'LIVE',
    'active',
    jsonb_build_object(
      'email', v_user_email,
      'supabase_uid', p_supabase_user_id::text
    ),
    p_supabase_user_id,
    p_supabase_user_id
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    entity_name = EXCLUDED.entity_name,
    metadata = COALESCE(EXCLUDED.metadata, core_entities.metadata),
    updated_at = now(),
    updated_by = p_supabase_user_id
  RETURNING id INTO v_user_entity_id;

  -- ✅ Step 3: Get the proper ORG entity (not organization UUID)
  SELECT id INTO v_org_entity_id
  FROM core_entities
  WHERE organization_id = p_organization_id
    AND entity_type = 'ORG'
  LIMIT 1;

  IF v_org_entity_id IS NULL THEN
    RAISE EXCEPTION 'ORG entity not found for organization: %', p_organization_id;
  END IF;

  -- ✅ Step 4: CLEAN UP duplicate memberships first
  SELECT array_agg(id) INTO v_existing_memberships
  FROM core_relationships
  WHERE organization_id = p_organization_id
    AND from_entity_id = v_user_entity_id
    AND relationship_type = 'MEMBER_OF'
    AND is_active = true;

  -- Deactivate all existing memberships
  IF array_length(v_existing_memberships, 1) > 0 THEN
    UPDATE core_relationships
    SET 
      is_active = false,
      updated_at = now(),
      updated_by = p_supabase_user_id
    WHERE id = ANY(v_existing_memberships);
  END IF;

  -- ✅ Step 5: Create ONE canonical membership
  INSERT INTO core_relationships (
    organization_id,
    from_entity_id,
    to_entity_id, -- ✅ FIXED: Points to ORG entity, not org UUID
    relationship_type,
    relationship_direction,
    relationship_data,
    smart_code,
    smart_code_status,
    is_active,
    created_by,
    updated_by
  ) VALUES (
    p_organization_id,
    v_user_entity_id,
    v_org_entity_id, -- ✅ FIXED: Proper ORG entity reference
    'MEMBER_OF',
    'forward',
    jsonb_build_object('role', 'OWNER', 'permissions', array['*']),
    'HERA.AUTH.USER.REL.MEMBER_OF.V1',
    'LIVE',
    true,
    p_supabase_user_id,
    p_supabase_user_id
  )
  RETURNING id INTO v_membership_id;

  -- ✅ Step 6: Return success with pulled data
  RETURN jsonb_build_object(
    'success', true,
    'user_entity_id', v_user_entity_id,
    'org_entity_id', v_org_entity_id,
    'membership_id', v_membership_id,
    'organization_id', p_organization_id,
    'email', v_user_email,
    'name', v_user_name,
    'duplicate_memberships_cleaned', COALESCE(array_length(v_existing_memberships, 1), 0),
    'message', 'User membership setup complete with duplicate prevention'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to setup user membership'
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION hera_setup_user_membership_fixed(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_setup_user_membership_fixed(uuid, uuid) TO service_role;

-- Also create a standardized version that follows HERA naming conventions
CREATE OR REPLACE FUNCTION hera_user_membership_setup_v1(
  p_supabase_user_id uuid,
  p_organization_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delegate to the fixed implementation
  RETURN hera_setup_user_membership_fixed(p_supabase_user_id, p_organization_id);
END;
$$;

GRANT EXECUTE ON FUNCTION hera_user_membership_setup_v1(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_user_membership_setup_v1(uuid, uuid) TO service_role;