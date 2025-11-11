/**
 * 🔧 FIX: hera_user_orgs_list_v1
 *
 * Purpose: Lists all organizations a user is a member of
 * Returns: SETOF record with columns (id, name, role, is_primary, last_accessed)
 *
 * Current Issue: Stub implementation returns dummy data
 * Fix: Query core_relationships and core_organizations for actual memberships
 */

CREATE OR REPLACE FUNCTION hera_user_orgs_list_v1(
  p_user_id uuid
)
RETURNS TABLE(
  id uuid,
  name text,
  role text,
  is_primary boolean,
  last_accessed timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return actual organization memberships from relationships
  RETURN QUERY
  SELECT
    org.id,
    org.entity_name::text AS name,
    COALESCE(
      rel.relationship_data->>'role',
      'member'
    )::text AS role,
    COALESCE(
      (rel.relationship_data->>'is_primary')::boolean,
      false
    ) AS is_primary,
    COALESCE(
      (rel.relationship_data->>'last_accessed')::timestamptz,
      rel.updated_at
    ) AS last_accessed
  FROM core_relationships rel
  INNER JOIN core_entities org ON org.id = rel.to_entity_id
  WHERE rel.from_entity_id = p_user_id
    AND rel.relationship_type = 'USER_MEMBER_OF_ORG'
    AND rel.is_active = true
    AND org.entity_type = 'ORG'
  ORDER BY
    COALESCE((rel.relationship_data->>'is_primary')::boolean, false) DESC,
    COALESCE((rel.relationship_data->>'last_accessed')::timestamptz, rel.updated_at) DESC,
    org.entity_name;
END;
$$;

-- Add comment
COMMENT ON FUNCTION hera_user_orgs_list_v1(uuid) IS
'Lists all organizations a user is a member of. Returns organization details with role and access information.';

/**
 * 🧪 TEST QUERIES
 */

-- Test 1: Check function exists and signature
SELECT
  proname,
  pronargs,
  prorettype::regtype
FROM pg_proc
WHERE proname = 'hera_user_orgs_list_v1';

-- Test 2: Test with a sample user (replace with actual user ID)
-- SELECT * FROM hera_user_orgs_list_v1('001a2eb9-b14c-4dda-ae8c-595fb377a982');

/**
 * 📝 NOTES FOR FUTURE ENHANCEMENTS:
 *
 * 1. Role Information:
 *    - Currently reads from relationship_data->>'role'
 *    - Could also query core_dynamic_data for user's role in that org
 *
 * 2. Primary Organization:
 *    - Currently reads from relationship_data->>'is_primary'
 *    - Could store in user preferences or session data
 *
 * 3. Last Accessed:
 *    - Currently reads from relationship_data->>'last_accessed'
 *    - Could track in separate access log table
 *    - Falls back to relationship updated_at timestamp
 *
 * 4. Performance:
 *    - Index on (from_entity_id, relationship_type, is_active) recommended
 *    - Index on (to_entity_id, entity_type) for organization lookup
 */
