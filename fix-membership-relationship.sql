-- =====================================================================
-- Fix Missing MEMBER_OF Relationship
-- =====================================================================
-- This script checks for and creates the missing MEMBER_OF relationship
-- that the RPC function hera_entities_crud_v1 requires
-- =====================================================================

-- Step 1: Check if the relationship already exists
DO $$
DECLARE
  v_user_id UUID := '001a2eb9-b14c-4dda-ae8c-595fb377a982';
  v_org_id UUID := '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
  v_relationship_exists BOOLEAN;
BEGIN
  -- Check for existing MEMBER_OF relationship
  SELECT EXISTS (
    SELECT 1
    FROM core_relationships
    WHERE organization_id = v_org_id
      AND from_entity_id = v_user_id
      AND to_entity_id = v_org_id
      AND relationship_type = 'MEMBER_OF'
      AND is_active = true
  ) INTO v_relationship_exists;

  IF v_relationship_exists THEN
    RAISE NOTICE '✅ MEMBER_OF relationship already exists';
  ELSE
    RAISE NOTICE '❌ MEMBER_OF relationship is MISSING - creating now...';

    -- Step 2: Create the MEMBER_OF relationship
    INSERT INTO core_relationships (
      id,
      organization_id,
      from_entity_id,
      to_entity_id,
      relationship_type,
      smart_code,
      relationship_data,
      is_active,
      effective_date,
      expiration_date,
      created_at,
      updated_at,
      created_by,
      updated_by
    ) VALUES (
      gen_random_uuid(),
      v_org_id,                    -- Organization context (Hair Talkz Salon)
      v_user_id,                   -- User entity ID (from)
      v_org_id,                    -- Organization entity ID (to) - same as org_id
      'MEMBER_OF',                 -- Correct relationship type
      'HERA.AUTH.REL.MEMBER_OF.v1', -- Smart code
      jsonb_build_object(
        'role', 'owner',
        'permissions', jsonb_build_array(
          'salon:read:all',
          'salon:write:all',
          'salon:delete:all',
          'salon:admin:full',
          'salon:finance:full',
          'salon:staff:manage',
          'salon:settings:manage'
        ),
        'active', true,
        'joined_at', NOW()
      ),
      true,                        -- is_active
      NOW(),                       -- effective_date
      NULL,                        -- expiration_date (never expires)
      NOW(),                       -- created_at
      NOW(),                       -- updated_at
      v_user_id,                   -- created_by (self-created)
      v_user_id                    -- updated_by
    )
    ON CONFLICT (organization_id, from_entity_id, to_entity_id, relationship_type)
    DO UPDATE SET
      is_active = true,
      updated_at = NOW(),
      updated_by = EXCLUDED.updated_by,
      relationship_data = EXCLUDED.relationship_data;

    RAISE NOTICE '✅ MEMBER_OF relationship created successfully';
  END IF;
END $$;

-- Step 3: Verify the relationship was created
SELECT
  cr.id AS relationship_id,
  cr.from_entity_id AS user_entity_id,
  ce_user.entity_name AS user_name,
  cr.to_entity_id AS org_entity_id,
  ce_org.entity_name AS org_name,
  cr.relationship_type,
  cr.smart_code,
  cr.is_active,
  cr.relationship_data->>'role' AS role,
  cr.created_at
FROM core_relationships cr
LEFT JOIN core_entities ce_user ON ce_user.id = cr.from_entity_id
LEFT JOIN core_entities ce_org ON ce_org.id = cr.to_entity_id
WHERE cr.from_entity_id = '001a2eb9-b14c-4dda-ae8c-595fb377a982'
  AND cr.to_entity_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND cr.relationship_type = 'MEMBER_OF';

-- Step 4: Clean up any old USER_MEMBER_OF_ORG relationships (deprecated)
DELETE FROM core_relationships
WHERE from_entity_id = '001a2eb9-b14c-4dda-ae8c-595fb377a982'
  AND relationship_type = 'USER_MEMBER_OF_ORG'
RETURNING id, relationship_type, smart_code;
