-- HERA Entities CRUD v2 with Actor Stamping
-- ============================================
-- Implements v2.2 "Authenticated Actor Everywhere" pattern

CREATE OR REPLACE FUNCTION hera_entities_crud_v2(
    p_operation TEXT,           -- 'UPSERT', 'DELETE'
    p_payload JSONB,           -- Entity data with organization_id, smart_code
    p_actor_user_id UUID       -- ✅ REQUIRED: USER entity ID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entity_id UUID;
    v_org_id UUID;
    v_membership_check BOOLEAN := false;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Input validation
    IF p_actor_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'HERA_ACTOR_REQUIRED',
            'message', 'p_actor_user_id cannot be null'
        );
    END IF;
    
    -- Extract and validate organization
    v_org_id := (p_payload->>'organization_id')::UUID;
    
    IF v_org_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'HERA_GUARDRAIL_VIOLATION',
            'message', 'organization_id required in payload'
        );
    END IF;
    
    -- ✅ Validate actor is a USER entity
    IF NOT EXISTS (
        SELECT 1 FROM core_entities
        WHERE id = p_actor_user_id
        AND entity_type = 'USER'
        AND organization_id = v_platform_org_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'HERA_ACTOR_INVALID',
            'message', 'Actor must be valid USER entity in platform organization'
        );
    END IF;
    
    -- ✅ Enforce actor membership in target organization
    SELECT EXISTS(
        SELECT 1 FROM core_relationships
        WHERE source_entity_id = p_actor_user_id
        AND target_entity_id = v_org_id
        AND relationship_type = 'USER_MEMBER_OF_ORG'
    ) INTO v_membership_check;
    
    IF NOT v_membership_check THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'HERA_MEMBERSHIP_DENIED',
            'message', format('Actor %s not member of organization %s', p_actor_user_id, v_org_id)
        );
    END IF;
    
    -- ✅ Validate smart_code pattern
    IF p_payload->>'smart_code' IS NULL OR 
       NOT (p_payload->>'smart_code' ~ '^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.V\d+$') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'HERA_GUARDRAIL_VIOLATION',
            'message', 'smart_code must match pattern HERA.*.*.*.V#'
        );
    END IF;
    
    -- Execute operation
    CASE p_operation
        WHEN 'UPSERT' THEN
            -- ✅ Actor stamping on insert/update
            INSERT INTO core_entities (
                id,
                organization_id,
                entity_type,
                entity_name,
                entity_code,
                entity_category,
                entity_subcategory,
                description,
                tags,
                status,
                effective_date,
                expiry_date,
                metadata,
                ai_confidence,
                ai_classification,
                ai_tags,
                parent_entity_id,
                hierarchy_level,
                sort_order,
                created_by,    -- ✅ Actor stamping
                updated_by,    -- ✅ Actor stamping
                created_at,
                updated_at,
                version
            ) VALUES (
                COALESCE((p_payload->>'id')::UUID, gen_random_uuid()),
                v_org_id,
                p_payload->>'entity_type',
                p_payload->>'entity_name',
                p_payload->>'entity_code',
                p_payload->>'entity_category',
                p_payload->>'entity_subcategory',
                p_payload->>'description',
                CASE WHEN p_payload->'tags' IS NOT NULL 
                     THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'tags'))
                     ELSE NULL END,
                COALESCE(p_payload->>'status', 'active'),
                COALESCE((p_payload->>'effective_date')::DATE, CURRENT_DATE),
                (p_payload->>'expiry_date')::DATE,
                COALESCE(p_payload->'metadata', '{}'::jsonb),
                COALESCE((p_payload->>'ai_confidence')::NUMERIC, 0.0000),
                p_payload->>'ai_classification',
                CASE WHEN p_payload->'ai_tags' IS NOT NULL 
                     THEN ARRAY(SELECT jsonb_array_elements_text(p_payload->'ai_tags'))
                     ELSE NULL END,
                (p_payload->>'parent_entity_id')::UUID,
                COALESCE((p_payload->>'hierarchy_level')::INTEGER, 0),
                COALESCE((p_payload->>'sort_order')::INTEGER, 0),
                p_actor_user_id,  -- ✅ Actor stamping
                p_actor_user_id,  -- ✅ Actor stamping
                NOW(),
                NOW(),
                COALESCE((p_payload->>'version')::INTEGER, 1)
            )
            ON CONFLICT (id) DO UPDATE SET
                entity_name = EXCLUDED.entity_name,
                entity_code = EXCLUDED.entity_code,
                entity_category = EXCLUDED.entity_category,
                entity_subcategory = EXCLUDED.entity_subcategory,
                description = EXCLUDED.description,
                tags = EXCLUDED.tags,
                status = EXCLUDED.status,
                effective_date = EXCLUDED.effective_date,
                expiry_date = EXCLUDED.expiry_date,
                metadata = EXCLUDED.metadata,
                ai_confidence = EXCLUDED.ai_confidence,
                ai_classification = EXCLUDED.ai_classification,
                ai_tags = EXCLUDED.ai_tags,
                parent_entity_id = EXCLUDED.parent_entity_id,
                hierarchy_level = EXCLUDED.hierarchy_level,
                sort_order = EXCLUDED.sort_order,
                updated_by = p_actor_user_id,  -- ✅ Actor stamping
                updated_at = NOW(),
                version = EXCLUDED.version + 1
            RETURNING id INTO v_entity_id;
            
        WHEN 'DELETE' THEN
            -- Soft delete with actor tracking
            UPDATE core_entities 
            SET 
                status = 'archived',
                updated_by = p_actor_user_id,  -- ✅ Actor stamping
                updated_at = NOW()
            WHERE id = (p_payload->>'id')::UUID
            AND organization_id = v_org_id
            RETURNING id INTO v_entity_id;
            
            IF v_entity_id IS NULL THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error_code', 'HERA_ENTITY_NOT_FOUND',
                    'message', 'Entity not found or access denied'
                );
            END IF;
            
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'error_code', 'HERA_INVALID_OPERATION',
                'message', 'Operation must be UPSERT or DELETE'
            );
    END CASE;
    
    -- Success response
    RETURN jsonb_build_object(
        'success', true,
        'entity_id', v_entity_id,
        'operation', p_operation,
        'actor_user_id', p_actor_user_id,
        'organization_id', v_org_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'HERA_RPC_ERROR',
            'message', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION hera_entities_crud_v2(TEXT, JSONB, UUID) TO authenticated;

-- Add function documentation
COMMENT ON FUNCTION hera_entities_crud_v2 IS 'HERA v2.2 Entity CRUD with actor stamping and membership enforcement';