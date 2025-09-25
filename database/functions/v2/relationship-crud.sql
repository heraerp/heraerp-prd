-- HERA V2 API - Relationship CRUD Functions
-- Using Sacred Six tables only - no schema changes

-- ================================================
-- 1) hera_relationship_read_v1 - Read single relationship
-- ================================================
CREATE OR REPLACE FUNCTION hera_relationship_read_v1(
    p_organization_id UUID,
    p_relationship_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', r.id,
        'organization_id', r.organization_id,
        'from_entity_id', r.from_entity_id,
        'to_entity_id', r.to_entity_id,
        'relationship_type', r.relationship_type,
        'relationship_subtype', r.relationship_subtype,
        'relationship_name', r.relationship_name,
        'relationship_code', r.relationship_code,
        'smart_code', r.smart_code,
        'is_active', r.is_active,
        'effective_date', r.effective_date,
        'expiration_date', r.expiration_date,
        'relationship_data', r.relationship_data,
        'metadata', r.metadata,
        'created_at', r.created_at,
        'updated_at', r.updated_at,
        'version', r.version
    ) INTO v_result
    FROM core_relationships r
    WHERE r.organization_id = p_organization_id
      AND r.id = p_relationship_id;

    IF v_result IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Relationship not found'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', v_result
    );
END;
$$;

-- ================================================
-- 2) hera_relationship_query_v1 - Query relationships with filters
-- ================================================
CREATE OR REPLACE FUNCTION hera_relationship_query_v1(
    p_organization_id UUID,
    p_entity_id UUID DEFAULT NULL,
    p_side TEXT DEFAULT 'either', -- either, from, to
    p_relationship_type TEXT DEFAULT NULL,
    p_active_only BOOLEAN DEFAULT true,
    p_effective_from TIMESTAMPTZ DEFAULT NULL,
    p_effective_to TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_results JSONB;
    v_total INTEGER;
BEGIN
    -- Build results based on filters
    WITH filtered_relationships AS (
        SELECT r.*
        FROM core_relationships r
        WHERE r.organization_id = p_organization_id
          AND (
              p_entity_id IS NULL OR (
                  CASE p_side
                      WHEN 'from' THEN r.from_entity_id = p_entity_id
                      WHEN 'to' THEN r.to_entity_id = p_entity_id
                      ELSE r.from_entity_id = p_entity_id OR r.to_entity_id = p_entity_id
                  END
              )
          )
          AND (p_relationship_type IS NULL OR r.relationship_type = p_relationship_type)
          AND (NOT p_active_only OR r.is_active = true)
          AND (p_effective_from IS NULL OR r.effective_date >= p_effective_from)
          AND (p_effective_to IS NULL OR
               (r.expiration_date IS NULL OR r.expiration_date <= p_effective_to))
    ),
    paginated AS (
        SELECT * FROM filtered_relationships
        ORDER BY created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT
        jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'organization_id', p.organization_id,
                'from_entity_id', p.from_entity_id,
                'to_entity_id', p.to_entity_id,
                'relationship_type', p.relationship_type,
                'relationship_subtype', p.relationship_subtype,
                'relationship_name', p.relationship_name,
                'relationship_code', p.relationship_code,
                'smart_code', p.smart_code,
                'is_active', p.is_active,
                'effective_date', p.effective_date,
                'expiration_date', p.expiration_date,
                'relationship_data', p.relationship_data,
                'metadata', p.metadata,
                'created_at', p.created_at,
                'updated_at', p.updated_at,
                'version', p.version
            )
        ),
        (SELECT COUNT(*) FROM filtered_relationships)
    INTO v_results, v_total
    FROM paginated p;

    RETURN jsonb_build_object(
        'success', true,
        'data', COALESCE(v_results, '[]'::jsonb),
        'total', COALESCE(v_total, 0),
        'limit', p_limit,
        'offset', p_offset
    );
END;
$$;

-- ================================================
-- 3) hera_relationship_delete_v1 - Soft delete relationship
-- ================================================
CREATE OR REPLACE FUNCTION hera_relationship_delete_v1(
    p_organization_id UUID,
    p_relationship_id UUID,
    p_expiration_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_id UUID;
BEGIN
    UPDATE core_relationships
    SET
        is_active = false,
        expiration_date = COALESCE(p_expiration_date, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
    WHERE organization_id = p_organization_id
      AND id = p_relationship_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Relationship not found or already deleted'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'id', v_updated_id,
            'deleted_at', p_expiration_date
        )
    );
END;
$$;

-- ================================================
-- 4) hera_relationship_upsert_batch_v1 - Batch upsert relationships
-- ================================================
CREATE OR REPLACE FUNCTION hera_relationship_upsert_batch_v1(
    p_organization_id UUID,
    p_rows JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row JSONB;
    v_result JSONB;
    v_results JSONB[] := '{}';
    v_success_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_relationship_id UUID;
BEGIN
    -- Process each row
    FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
    LOOP
        BEGIN
            -- Set organization_id for the row
            v_row := v_row || jsonb_build_object('organization_id', p_organization_id);

            -- Check if relationship exists
            SELECT id INTO v_relationship_id
            FROM core_relationships
            WHERE organization_id = p_organization_id
              AND ((v_row->>'id' IS NOT NULL AND id = (v_row->>'id')::UUID)
                OR (relationship_code IS NOT NULL
                    AND relationship_code = v_row->>'relationship_code'));

            IF v_relationship_id IS NOT NULL THEN
                -- Update existing
                UPDATE core_relationships
                SET
                    from_entity_id = COALESCE((v_row->>'from_entity_id')::UUID, from_entity_id),
                    to_entity_id = COALESCE((v_row->>'to_entity_id')::UUID, to_entity_id),
                    relationship_type = COALESCE(v_row->>'relationship_type', relationship_type),
                    relationship_subtype = COALESCE(v_row->>'relationship_subtype', relationship_subtype),
                    relationship_name = COALESCE(v_row->>'relationship_name', relationship_name),
                    relationship_code = COALESCE(v_row->>'relationship_code', relationship_code),
                    smart_code = COALESCE(v_row->>'smart_code', smart_code),
                    is_active = COALESCE((v_row->>'is_active')::BOOLEAN, is_active),
                    effective_date = COALESCE((v_row->>'effective_date')::TIMESTAMPTZ, effective_date),
                    expiration_date = CASE
                        WHEN v_row ? 'expiration_date' THEN (v_row->>'expiration_date')::TIMESTAMPTZ
                        ELSE expiration_date
                    END,
                    relationship_data = COALESCE(v_row->'relationship_data', relationship_data),
                    metadata = COALESCE(v_row->'metadata', metadata),
                    updated_at = CURRENT_TIMESTAMP,
                    version = version + 1
                WHERE id = v_relationship_id
                RETURNING id INTO v_relationship_id;

                v_results := v_results || jsonb_build_object(
                    'status', 200,
                    'id', v_relationship_id,
                    'action', 'updated'
                );
            ELSE
                -- Insert new
                INSERT INTO core_relationships (
                    id,
                    organization_id,
                    from_entity_id,
                    to_entity_id,
                    relationship_type,
                    relationship_subtype,
                    relationship_name,
                    relationship_code,
                    smart_code,
                    is_active,
                    effective_date,
                    expiration_date,
                    relationship_data,
                    metadata,
                    created_at,
                    updated_at,
                    version
                ) VALUES (
                    COALESCE((v_row->>'id')::UUID, gen_random_uuid()),
                    p_organization_id,
                    (v_row->>'from_entity_id')::UUID,
                    (v_row->>'to_entity_id')::UUID,
                    v_row->>'relationship_type',
                    v_row->>'relationship_subtype',
                    v_row->>'relationship_name',
                    v_row->>'relationship_code',
                    v_row->>'smart_code',
                    COALESCE((v_row->>'is_active')::BOOLEAN, true),
                    COALESCE((v_row->>'effective_date')::TIMESTAMPTZ, CURRENT_TIMESTAMP),
                    (v_row->>'expiration_date')::TIMESTAMPTZ,
                    COALESCE(v_row->'relationship_data', '{}'::jsonb),
                    COALESCE(v_row->'metadata', '{}'::jsonb),
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    1
                )
                RETURNING id INTO v_relationship_id;

                v_results := v_results || jsonb_build_object(
                    'status', 201,
                    'id', v_relationship_id,
                    'action', 'created'
                );
            END IF;

            v_success_count := v_success_count + 1;

        EXCEPTION WHEN OTHERS THEN
            v_results := v_results || jsonb_build_object(
                'status', 400,
                'error', SQLERRM,
                'row', v_row
            );
            v_error_count := v_error_count + 1;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'success', v_error_count = 0,
        'status', CASE WHEN v_error_count > 0 THEN 207 ELSE 200 END,
        'results', to_jsonb(v_results),
        'summary', jsonb_build_object(
            'success_count', v_success_count,
            'error_count', v_error_count,
            'total', jsonb_array_length(p_rows)
        )
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION hera_relationship_read_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_relationship_query_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_relationship_delete_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_relationship_upsert_batch_v1 TO authenticated;