-- ================================================================================
-- HERA Entity Read with Branch Filter Function
-- Smart Code: HERA.DB.FUNC.ENTITY_READ_BRANCH.V1
-- Description: Reads entities filtered by branch relationship
-- ================================================================================

CREATE OR REPLACE FUNCTION hera_entity_read_with_branch_v1(
  p_organization_id UUID,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT 'active',
  p_branch_id UUID DEFAULT NULL,
  p_relationship_type TEXT DEFAULT NULL,
  p_include_relationships BOOLEAN DEFAULT FALSE,
  p_include_dynamic_data BOOLEAN DEFAULT FALSE,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_entities JSONB;
  v_total INTEGER;
BEGIN
  -- Validate organization context
  IF p_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Organization ID is required'
    );
  END IF;

  -- Build query with branch filtering
  WITH filtered_entities AS (
    SELECT DISTINCT e.*
    FROM core_entities e
    LEFT JOIN core_relationships r ON (
      p_branch_id IS NOT NULL 
      AND p_relationship_type IS NOT NULL
      AND r.from_entity_id = e.id
      AND r.to_entity_id = p_branch_id
      AND r.relationship_type = p_relationship_type
      AND r.deleted_at IS NULL
      AND r.organization_id = p_organization_id
    )
    WHERE e.organization_id = p_organization_id
      AND (p_entity_id IS NULL OR e.id = p_entity_id)
      AND (p_entity_type IS NULL OR e.entity_type = p_entity_type)
      AND (p_status IS NULL OR e.status = p_status)
      AND (
        -- If branch filter is specified, only include entities with the relationship
        (p_branch_id IS NULL OR p_relationship_type IS NULL)
        OR r.id IS NOT NULL
      )
      AND e.deleted_at IS NULL
    ORDER BY e.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ),
  entity_data AS (
    SELECT 
      jsonb_agg(
        to_jsonb(fe.*) 
        || CASE 
          WHEN p_include_dynamic_data THEN
            jsonb_build_object(
              'dynamic_fields',
              COALESCE(
                (
                  SELECT jsonb_object_agg(
                    dd.field_name,
                    jsonb_build_object(
                      'value', COALESCE(
                        dd.field_value_text,
                        dd.field_value_number::TEXT,
                        dd.field_value_boolean::TEXT,
                        dd.field_value_date::TEXT,
                        dd.field_value_json::TEXT
                      ),
                      'type', dd.field_type,
                      'smart_code', dd.smart_code
                    )
                  )
                  FROM core_dynamic_data dd
                  WHERE dd.entity_id = fe.id
                    AND dd.organization_id = p_organization_id
                    AND dd.deleted_at IS NULL
                ),
                '{}'::JSONB
              )
            )
          ELSE '{}'::JSONB
          END
        || CASE
          WHEN p_include_relationships THEN
            jsonb_build_object(
              'relationships',
              COALESCE(
                (
                  SELECT jsonb_object_agg(
                    rel_type,
                    relationships
                  )
                  FROM (
                    SELECT 
                      r.relationship_type AS rel_type,
                      jsonb_agg(
                        jsonb_build_object(
                          'id', r.id,
                          'to_entity_id', r.to_entity_id,
                          'to_entity', to_jsonb(te.*),
                          'relationship_direction', r.relationship_direction,
                          'metadata', r.metadata,
                          'created_at', r.created_at
                        )
                        ORDER BY r.created_at
                      ) AS relationships
                    FROM core_relationships r
                    JOIN core_entities te ON te.id = r.to_entity_id
                    WHERE r.from_entity_id = fe.id
                      AND r.organization_id = p_organization_id
                      AND r.deleted_at IS NULL
                      AND te.deleted_at IS NULL
                    GROUP BY r.relationship_type
                  ) rel_groups
                ),
                '{}'::JSONB
              )
            )
          ELSE '{}'::JSONB
          END
      ) AS entities
    FROM filtered_entities fe
  )
  SELECT 
    COALESCE(entities, '[]'::JSONB) AS entities,
    (
      SELECT COUNT(*)::INTEGER 
      FROM filtered_entities
    ) AS total
  INTO v_entities, v_total
  FROM entity_data;

  -- Build result
  v_result := jsonb_build_object(
    'success', TRUE,
    'data', COALESCE(v_entities, '[]'::JSONB),
    'metadata', jsonb_build_object(
      'total', COALESCE(v_total, 0),
      'limit', p_limit,
      'offset', p_offset,
      'filters', jsonb_build_object(
        'organization_id', p_organization_id,
        'entity_type', p_entity_type,
        'status', p_status,
        'branch_id', p_branch_id,
        'relationship_type', p_relationship_type
      )
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION hera_entity_read_with_branch_v1 TO authenticated;

-- Add function comment
COMMENT ON FUNCTION hera_entity_read_with_branch_v1 IS 'Reads entities with optional branch filtering via relationships';