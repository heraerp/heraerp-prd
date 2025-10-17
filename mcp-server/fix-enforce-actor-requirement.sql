-- Fix missing enforce_actor_requirement function
-- This function validates that an actor (user) belongs to the specified organization

CREATE OR REPLACE FUNCTION enforce_actor_requirement(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_function_name text DEFAULT 'unknown_function'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_membership_exists boolean := false;
BEGIN
  -- Validate required parameters
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING 
      ERRCODE='22023', 
      MESSAGE='ACTOR_USER_ID_REQUIRED',
      DETAIL=format('Function %s requires a valid actor_user_id', p_function_name);
  END IF;
  
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION USING 
      ERRCODE='22023', 
      MESSAGE='ORGANIZATION_ID_REQUIRED',
      DETAIL=format('Function %s requires a valid organization_id', p_function_name);
  END IF;
  
  -- Check if the actor has membership in the organization
  -- This checks the core_relationships table for MEMBER_OF relationship
  SELECT EXISTS (
    SELECT 1 
    FROM core_relationships r
    WHERE r.source_entity_id = p_actor_user_id
      AND r.target_entity_id = p_organization_id
      AND r.relationship_type = 'MEMBER_OF'
      AND r.is_active = true
      AND r.organization_id = p_organization_id
  ) INTO v_membership_exists;
  
  -- If no membership found, raise exception
  IF NOT v_membership_exists THEN
    RAISE EXCEPTION USING 
      ERRCODE='42501', 
      MESSAGE='ACTOR_NOT_MEMBER_OF_ORGANIZATION',
      DETAIL=format('Actor %s is not a member of organization %s (function: %s)', 
                    p_actor_user_id, p_organization_id, p_function_name),
      HINT='Ensure the user has proper membership relationship with the organization';
  END IF;
  
  -- If we reach here, the actor is valid
  RETURN;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION enforce_actor_requirement(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION enforce_actor_requirement(uuid, uuid, text) TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION enforce_actor_requirement(uuid, uuid, text) IS 
'Validates that an actor (user) has membership in the specified organization. Used by CRUD functions for security enforcement.';