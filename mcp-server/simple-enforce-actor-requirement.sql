-- Simple enforce_actor_requirement function that works with existing enforce_actor_stamp
-- This creates the missing function needed by hera_transactions_crud_v1

CREATE OR REPLACE FUNCTION enforce_actor_requirement(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_function_name text DEFAULT 'unknown_function'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Basic validation - the existing enforce_actor_stamp trigger will handle audit fields
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING 
      ERRCODE='22023', 
      MESSAGE='ACTOR_USER_ID_REQUIRED';
  END IF;
  
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION USING 
      ERRCODE='22023', 
      MESSAGE='ORGANIZATION_ID_REQUIRED';
  END IF;
  
  -- For now, just ensure the actor and org are valid UUIDs
  -- The actual membership validation can be added later
  -- The enforce_actor_stamp trigger will ensure created_by/updated_by are populated
  
  RETURN;
END;
$$;