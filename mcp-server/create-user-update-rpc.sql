-- ===================================================================
-- CREATE: hera_user_update_v1
-- Purpose: Update user name and email in core_entities
-- ===================================================================

CREATE OR REPLACE FUNCTION public.hera_user_update_v1(
  p_user_id uuid,
  p_user_name text DEFAULT NULL,
  p_user_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_result jsonb;
  v_updated_metadata jsonb;
BEGIN
  -- Validate user exists and is not deleted
  IF NOT EXISTS (
    SELECT 1 FROM core_entities
    WHERE id = p_user_id
      AND entity_type = 'USER'
      AND COALESCE(status, 'active') <> 'deleted'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_not_found',
      'message', 'User does not exist or has been deleted'
    );
  END IF;

  -- Build updated metadata preserving existing fields
  SELECT
    CASE
      WHEN p_user_email IS NOT NULL THEN
        COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('email', p_user_email)
      ELSE
        COALESCE(metadata, '{}'::jsonb)
    END
  INTO v_updated_metadata
  FROM core_entities
  WHERE id = p_user_id;

  -- Update user entity
  UPDATE core_entities
  SET
    entity_name = COALESCE(p_user_name, entity_name),
    metadata = v_updated_metadata,
    updated_at = NOW()
  WHERE id = p_user_id
    AND entity_type = 'USER'
  RETURNING jsonb_build_object(
    'id', id,
    'name', entity_name,
    'email', metadata->>'email',
    'updated_at', updated_at
  ) INTO v_result;

  RETURN jsonb_build_object(
    'success', true,
    'user', v_result,
    'message', 'User updated successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'update_failed',
      'message', SQLERRM
    );
END;
$fn$;

-- Permissions
REVOKE ALL ON FUNCTION public.hera_user_update_v1(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hera_user_update_v1(uuid, text, text) TO authenticated, service_role;

-- Documentation
COMMENT ON FUNCTION public.hera_user_update_v1(uuid, text, text)
IS 'Updates user name and email in core_entities.metadata';

-- Test
SELECT hera_user_update_v1(
  '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'::uuid,
  'Updated Name',
  'newemail@example.com'
);
