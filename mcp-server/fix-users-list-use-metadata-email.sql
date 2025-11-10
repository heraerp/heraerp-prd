-- Fix hera_users_list_v1 to use metadata.email instead of auth.users JOIN
-- This is a quick fix since users have emails in metadata but not supabase_user_id

CREATE OR REPLACE FUNCTION hera_users_list_v1(
  p_organization_id uuid,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  role text,
  role_entity_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.entity_name AS name,
    -- ✅ FIX: Use metadata.email directly instead of auth.users JOIN
    (ce.metadata->>'email')::text AS email,
    COALESCE(role_data.role_code, 'MEMBER') AS role,
    role_data.role_entity_id
  FROM core_entities ce
  -- Get MEMBER_OF relationships for this organization
  INNER JOIN core_relationships member_rel ON
    member_rel.source_entity_id = ce.id
    AND member_rel.target_entity_id = p_organization_id
    AND member_rel.relationship_type = 'MEMBER_OF'
    AND member_rel.organization_id = p_organization_id
  -- Get primary role for each user (LEFT JOIN LATERAL for best performance)
  LEFT JOIN LATERAL (
    SELECT
      role_entity.entity_code AS role_code,
      role_entity.id AS role_entity_id
    FROM core_relationships has_role_rel
    INNER JOIN core_entities role_entity ON
      role_entity.id = has_role_rel.target_entity_id
      AND role_entity.entity_type = 'ROLE'
      AND role_entity.organization_id = p_organization_id
    WHERE
      has_role_rel.source_entity_id = ce.id
      AND has_role_rel.relationship_type = 'HAS_ROLE'
      AND has_role_rel.organization_id = p_organization_id
      AND (has_role_rel.relationship_data->>'is_primary')::boolean = true
    LIMIT 1
  ) role_data ON true
  WHERE
    ce.entity_type = 'USER'
    AND ce.status != 'deleted'
  ORDER BY member_rel.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION hera_users_list_v1(uuid, integer, integer) TO authenticated;

-- Test the fix
SELECT * FROM hera_users_list_v1(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  10,
  0
);
