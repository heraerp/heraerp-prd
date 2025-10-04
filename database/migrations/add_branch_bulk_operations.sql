-- ================================================================================
-- Add Branch Bulk Operations Functions (Without Single Branch Constraint)
-- Smart Code: HERA.DB.MIGRATION.BRANCH_BULK_OPS.V1
-- Description: Bulk operations for managing entity-branch relationships
-- ================================================================================

-- Function to bulk link entities to a branch
CREATE OR REPLACE FUNCTION hera_relationship_bulk_link_v1(
  p_organization_id UUID,
  p_relationship_type TEXT,
  p_to_entity_id UUID,
  p_from_entity_ids UUID[],
  p_smart_code TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_created_count INTEGER := 0;
  v_updated_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors JSONB := '[]'::JSONB;
  v_existing_count INTEGER;
BEGIN
  -- Validate inputs
  IF p_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Organization ID is required'
    );
  END IF;

  IF p_relationship_type IS NULL OR p_to_entity_id IS NULL OR array_length(p_from_entity_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Invalid parameters: relationship_type, to_entity_id, and from_entity_ids are required'
    );
  END IF;

  -- Process each entity
  FOR i IN 1..array_length(p_from_entity_ids, 1) LOOP
    BEGIN
      -- Check if relationship already exists
      SELECT COUNT(*)
      INTO v_existing_count
      FROM core_relationships
      WHERE from_entity_id = p_from_entity_ids[i]
        AND to_entity_id = p_to_entity_id
        AND relationship_type = p_relationship_type
        AND organization_id = p_organization_id
        AND deleted_at IS NULL;

      IF v_existing_count > 0 THEN
        -- Update existing relationship
        UPDATE core_relationships
        SET updated_at = CURRENT_TIMESTAMP,
            smart_code = p_smart_code,
            is_active = TRUE
        WHERE from_entity_id = p_from_entity_ids[i]
          AND to_entity_id = p_to_entity_id
          AND relationship_type = p_relationship_type
          AND organization_id = p_organization_id
          AND deleted_at IS NULL;
        
        v_updated_count := v_updated_count + 1;
      ELSE
        -- Insert new relationship
        INSERT INTO core_relationships (
          organization_id,
          from_entity_id,
          to_entity_id,
          relationship_type,
          smart_code,
          relationship_direction,
          is_active
        ) VALUES (
          p_organization_id,
          p_from_entity_ids[i],
          p_to_entity_id,
          p_relationship_type,
          p_smart_code,
          'forward',
          TRUE
        );
        
        v_created_count := v_created_count + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'entity_id', p_from_entity_ids[i],
        'error', SQLERRM
      );
    END;
  END LOOP;

  -- Build result
  v_result := jsonb_build_object(
    'success', v_error_count = 0,
    'data', jsonb_build_object(
      'created', v_created_count,
      'updated', v_updated_count,
      'errors', v_error_count
    ),
    'errors', v_errors
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to bulk unlink entities from a branch
CREATE OR REPLACE FUNCTION hera_relationship_bulk_unlink_v1(
  p_organization_id UUID,
  p_relationship_type TEXT,
  p_from_entity_ids UUID[]
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_deleted_count INTEGER;
BEGIN
  -- Validate inputs
  IF p_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Organization ID is required'
    );
  END IF;

  -- Soft delete the relationships
  WITH deleted AS (
    UPDATE core_relationships
    SET deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE organization_id = p_organization_id
      AND relationship_type = p_relationship_type
      AND from_entity_id = ANY(p_from_entity_ids)
      AND deleted_at IS NULL
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_deleted_count FROM deleted;

  -- Build result
  v_result := jsonb_build_object(
    'success', TRUE,
    'data', jsonb_build_object(
      'deleted', v_deleted_count
    )
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to move entities between branches
CREATE OR REPLACE FUNCTION hera_relationship_bulk_move_v1(
  p_organization_id UUID,
  p_relationship_type TEXT,
  p_from_branch_id UUID,
  p_to_branch_id UUID,
  p_entity_ids UUID[],
  p_smart_code TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_moved_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors JSONB := '[]'::JSONB;
BEGIN
  -- Validate inputs
  IF p_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Organization ID is required'
    );
  END IF;

  -- Process each entity
  FOR i IN 1..array_length(p_entity_ids, 1) LOOP
    BEGIN
      -- Soft delete old relationship
      UPDATE core_relationships
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE organization_id = p_organization_id
        AND from_entity_id = p_entity_ids[i]
        AND to_entity_id = p_from_branch_id
        AND relationship_type = p_relationship_type
        AND deleted_at IS NULL;

      -- Create new relationship
      INSERT INTO core_relationships (
        organization_id,
        from_entity_id,
        to_entity_id,
        relationship_type,
        smart_code,
        relationship_direction,
        is_active,
        metadata
      ) VALUES (
        p_organization_id,
        p_entity_ids[i],
        p_to_branch_id,
        p_relationship_type,
        p_smart_code,
        'forward',
        TRUE,
        jsonb_build_object(
          'moved_from', p_from_branch_id,
          'moved_at', CURRENT_TIMESTAMP
        )
      )
      ON CONFLICT (organization_id, from_entity_id, to_entity_id, relationship_type)
      WHERE deleted_at IS NULL
      DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP,
        smart_code = EXCLUDED.smart_code,
        is_active = TRUE,
        metadata = COALESCE(core_relationships.metadata, '{}'::JSONB) || EXCLUDED.metadata;

      v_moved_count := v_moved_count + 1;

    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'entity_id', p_entity_ids[i],
        'error', SQLERRM
      );
    END;
  END LOOP;

  -- Build result
  v_result := jsonb_build_object(
    'success', v_error_count = 0,
    'data', jsonb_build_object(
      'moved', v_moved_count,
      'errors', v_error_count
    ),
    'errors', v_errors
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION hera_relationship_bulk_link_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_relationship_bulk_unlink_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_relationship_bulk_move_v1 TO authenticated;

-- Add function comments
COMMENT ON FUNCTION hera_relationship_bulk_link_v1 IS 'Bulk create relationships between multiple entities and a target entity. Supports multiple branches per entity.';
COMMENT ON FUNCTION hera_relationship_bulk_unlink_v1 IS 'Bulk soft-delete relationships for multiple entities';
COMMENT ON FUNCTION hera_relationship_bulk_move_v1 IS 'Move multiple entities from one branch to another';

-- ================================================================================
-- Example Usage:
-- ================================================================================
-- Link multiple staff to a branch:
-- SELECT hera_relationship_bulk_link_v1(
--   p_organization_id := 'your-org-id',
--   p_relationship_type := 'MEMBER_OF',
--   p_to_entity_id := 'branch-id',
--   p_from_entity_ids := ARRAY['staff-id-1', 'staff-id-2'],
--   p_smart_code := 'HERA.SALON.STAFF.REL.MEMBER_OF.V1'
-- );
--
-- Allow services at multiple branches:
-- SELECT hera_relationship_bulk_link_v1(
--   p_organization_id := 'your-org-id',
--   p_relationship_type := 'AVAILABLE_AT',
--   p_to_entity_id := 'branch-2-id',
--   p_from_entity_ids := ARRAY['service-id-1', 'service-id-2'],
--   p_smart_code := 'HERA.SALON.SERVICE.REL.AVAILABLE_AT.V1'
-- );