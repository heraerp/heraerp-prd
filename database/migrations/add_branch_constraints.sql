-- ================================================================================
-- Add Branch Relationship Constraints
-- Smart Code: HERA.DB.MIGRATION.BRANCH_CONSTRAINTS.V1
-- Description: Ensures entities can only belong to one branch
-- ================================================================================

-- Create unique constraint for single branch membership
-- This ensures that staff can only have one MEMBER_OF relationship at a time
CREATE UNIQUE INDEX IF NOT EXISTS ux_staff_member_of_single_branch
ON core_relationships (from_entity_id)
WHERE relationship_type = 'MEMBER_OF' 
  AND deleted_at IS NULL;

-- Optional: Create similar constraints for other entity types if needed
-- For example, if you want products to only be stocked at one branch:
-- CREATE UNIQUE INDEX IF NOT EXISTS ux_product_stock_at_single_branch
-- ON core_relationships (from_entity_id)
-- WHERE relationship_type = 'STOCK_AT' 
--   AND deleted_at IS NULL;

-- Add comment explaining the constraint
COMMENT ON INDEX ux_staff_member_of_single_branch IS 
  'Ensures staff members can only belong to one branch at a time via MEMBER_OF relationship';

-- ================================================================================
-- Bulk Operations RPC Functions
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
      -- If this is a single-branch constraint (like MEMBER_OF), remove existing relationship first
      IF p_relationship_type IN ('MEMBER_OF') THEN
        UPDATE core_relationships
        SET deleted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE from_entity_id = p_from_entity_ids[i]
          AND relationship_type = p_relationship_type
          AND organization_id = p_organization_id
          AND deleted_at IS NULL;
      END IF;

      -- Insert or update the relationship
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
      )
      ON CONFLICT (organization_id, from_entity_id, to_entity_id, relationship_type)
      WHERE deleted_at IS NULL
      DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP,
        smart_code = EXCLUDED.smart_code,
        is_active = TRUE;

      IF FOUND THEN
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION hera_relationship_bulk_link_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_relationship_bulk_unlink_v1 TO authenticated;

-- Add function comments
COMMENT ON FUNCTION hera_relationship_bulk_link_v1 IS 'Bulk create relationships between multiple entities and a target entity';
COMMENT ON FUNCTION hera_relationship_bulk_unlink_v1 IS 'Bulk soft-delete relationships for multiple entities';