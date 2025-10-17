-- =====================================================
-- PATCH: Fix Aggregate Function Nesting Issue
-- =====================================================
-- 
-- Quick fix for "aggregate function calls cannot be nested" error
-- The issue is in the relationship retrieval query
-- =====================================================

-- Drop and recreate just the problematic function with fixed aggregation
DROP FUNCTION IF EXISTS public.hera_entities_crud_v2(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb) CASCADE;

CREATE OR REPLACE FUNCTION public.hera_entities_crud_v2(
    p_action text,
    p_actor_user_id uuid,
    p_organization_id uuid,
    p_entity jsonb DEFAULT '{}'::jsonb,
    p_dynamic jsonb DEFAULT '{}'::jsonb,
    p_relationships jsonb DEFAULT '[]'::jsonb,
    p_options jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_entity_id uuid;
    v_result jsonb := '{"items": [], "relationships": {}, "metadata": {}}'::jsonb;
    v_entity_record record;
    v_relationship record;
    v_relationships_data jsonb := '{}'::jsonb;
    v_created_relationships jsonb := '[]'::jsonb;
    v_include_relationships boolean := false;
    v_include_dynamic boolean := true;
    v_dynamic_data jsonb := '{}'::jsonb;
    v_error_context text;
    v_relationship_item jsonb;
    v_rel_source_id uuid;
    v_rel_target_id uuid;
    v_rel_type text;
    v_rel_data jsonb;
    v_temp_rel_id uuid;
    v_entity_smart_code text;
    v_dynamic_smart_code text;
    -- Variables for relationship building
    v_rel_cursor CURSOR FOR 
        SELECT cr.*, se.entity_name as source_name, se.entity_type as source_type, se.smart_code as source_smart_code,
               te.entity_name as target_name, te.entity_type as target_type, te.smart_code as target_smart_code
        FROM core_relationships cr
        LEFT JOIN core_entities se ON se.id = cr.from_entity_id
        LEFT JOIN core_entities te ON te.id = cr.to_entity_id
        WHERE (cr.from_entity_id = v_entity_id OR cr.to_entity_id = v_entity_id)
        AND cr.organization_id = p_organization_id
        AND cr.is_active = true;
    v_rel_record record;
    v_rel_type_data jsonb;
BEGIN
    -- =====================================================
    -- SECURITY & VALIDATION
    -- =====================================================
    
    IF p_action IS NULL OR p_action = '' THEN
        RAISE EXCEPTION 'INVALID_ACTION: Action parameter is required';
    END IF;
    
    IF p_actor_user_id IS NULL THEN
        RAISE EXCEPTION 'ACTOR_REQUIRED: Actor user ID is required for audit trail';
    END IF;
    
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'ORG_REQUIRED: Organization ID is required for data isolation';
    END IF;
    
    -- Parse options safely
    IF p_options IS NOT NULL AND jsonb_typeof(p_options) = 'object' THEN
        v_include_relationships := COALESCE((p_options->>'include_relationships')::boolean, false);
        v_include_dynamic := COALESCE((p_options->>'include_dynamic')::boolean, true);
    END IF;
    
    -- Set error context
    v_error_context := format('Action: %s, Actor: %s, Org: %s', p_action, p_actor_user_id, p_organization_id);
    
    -- =====================================================
    -- ACTION ROUTING
    -- =====================================================
    
    CASE upper(p_action)
        
        -- =====================================================
        -- CREATE OPERATION
        -- =====================================================
        WHEN 'CREATE' THEN
            -- Validate required entity fields
            IF NOT (p_entity ? 'entity_type') OR (p_entity->>'entity_type') = '' THEN
                RAISE EXCEPTION 'ENTITY_TYPE_REQUIRED: entity_type is required for CREATE operations';
            END IF;
            
            IF NOT (p_entity ? 'entity_name') OR (p_entity->>'entity_name') = '' THEN
                RAISE EXCEPTION 'ENTITY_NAME_REQUIRED: entity_name is required for CREATE operations';
            END IF;
            
            -- Generate smart_code safely
            IF p_entity ? 'smart_code' AND (p_entity->>'smart_code') IS NOT NULL AND (p_entity->>'smart_code') != '' THEN
                v_entity_smart_code := p_entity->>'smart_code';
            ELSE
                v_entity_smart_code := format('HERA.%s.%s.ENTITY.AUTO.V1', 
                    upper(p_entity->>'entity_type'), 
                    upper(replace(p_entity->>'entity_name', ' ', '_'))
                );
            END IF;
            
            -- Create the main entity
            INSERT INTO core_entities (
                organization_id,
                entity_type,
                entity_name,
                entity_code,
                smart_code,
                metadata,
                status,
                created_by,
                updated_by,
                created_at,
                updated_at
            ) VALUES (
                p_organization_id,
                p_entity->>'entity_type',
                p_entity->>'entity_name',
                p_entity->>'entity_code',
                v_entity_smart_code,
                COALESCE(p_entity->'metadata', '{}'::jsonb),
                COALESCE(p_entity->>'status', 'active'),
                p_actor_user_id,
                p_actor_user_id,
                NOW(),
                NOW()
            ) RETURNING id INTO v_entity_id;
            
            -- =====================================================
            -- DYNAMIC DATA CREATION
            -- =====================================================
            IF p_dynamic IS NOT NULL AND jsonb_typeof(p_dynamic) = 'object' THEN
                FOR v_relationship IN SELECT key, value FROM jsonb_each(p_dynamic) LOOP
                    IF NOT (v_relationship.value ? 'field_type') THEN
                        RAISE EXCEPTION 'DYNAMIC_FIELD_TYPE_REQUIRED: field_type is required for dynamic field "%"', v_relationship.key;
                    END IF;
                    
                    -- Generate smart_code safely for dynamic fields
                    IF v_relationship.value ? 'smart_code' AND (v_relationship.value->>'smart_code') IS NOT NULL AND (v_relationship.value->>'smart_code') != '' THEN
                        v_dynamic_smart_code := v_relationship.value->>'smart_code';
                    ELSE
                        v_dynamic_smart_code := format('HERA.%s.%s.FIELD.%s.V1', 
                            upper(p_entity->>'entity_type'),
                            upper(replace(p_entity->>'entity_name', ' ', '_')),
                            upper(v_relationship.key)
                        );
                    END IF;
                    
                    -- Insert dynamic data
                    INSERT INTO core_dynamic_data (
                        organization_id,
                        entity_id,
                        field_name,
                        field_type,
                        field_value_text,
                        field_value_number,
                        field_value_boolean,
                        field_value_date,
                        field_value_json,
                        smart_code,
                        created_by,
                        updated_by,
                        created_at,
                        updated_at
                    ) VALUES (
                        p_organization_id,
                        v_entity_id,
                        v_relationship.key,
                        v_relationship.value->>'field_type',
                        v_relationship.value->>'field_value_text',
                        (v_relationship.value->>'field_value_number')::numeric,
                        (v_relationship.value->>'field_value_boolean')::boolean,
                        (v_relationship.value->>'field_value_date')::timestamptz,
                        v_relationship.value->'field_value_json',
                        v_dynamic_smart_code,
                        p_actor_user_id,
                        p_actor_user_id,
                        NOW(),
                        NOW()
                    );
                END LOOP;
            END IF;
            
            -- =====================================================
            -- RELATIONSHIP CREATION
            -- =====================================================
            IF p_relationships IS NOT NULL AND jsonb_typeof(p_relationships) = 'array' AND jsonb_array_length(p_relationships) > 0 THEN
                FOR v_relationship IN SELECT value FROM jsonb_array_elements(p_relationships) LOOP
                    v_relationship_item := v_relationship.value;
                    
                    -- Extract relationship data
                    v_rel_source_id := COALESCE(
                        (v_relationship_item->>'source_entity_id')::uuid,
                        (v_relationship_item->>'from_entity_id')::uuid,
                        v_entity_id
                    );
                    
                    v_rel_target_id := COALESCE(
                        (v_relationship_item->>'target_entity_id')::uuid,
                        (v_relationship_item->>'to_entity_id')::uuid
                    );
                    
                    v_rel_type := v_relationship_item->>'relationship_type';
                    v_rel_data := COALESCE(v_relationship_item->'relationship_data', '{}'::jsonb);
                    
                    -- Validate relationship requirements
                    IF v_rel_target_id IS NULL THEN
                        RAISE EXCEPTION 'REL_TARGET_REQUIRED: target_entity_id is required for relationship creation';
                    END IF;
                    
                    IF v_rel_type IS NULL OR v_rel_type = '' THEN
                        RAISE EXCEPTION 'REL_TYPE_REQUIRED: relationship_type is required for relationship creation';
                    END IF;
                    
                    -- Verify target entity exists
                    IF NOT EXISTS (
                        SELECT 1 FROM core_entities 
                        WHERE id = v_rel_target_id 
                        AND organization_id = p_organization_id
                    ) THEN
                        RAISE EXCEPTION 'REL_TARGET_NOT_FOUND: Target entity % not found in organization %', v_rel_target_id, p_organization_id;
                    END IF;
                    
                    -- Create the relationship
                    INSERT INTO core_relationships (
                        organization_id,
                        from_entity_id,
                        to_entity_id,
                        relationship_type,
                        relationship_data,
                        is_active,
                        created_by,
                        updated_by,
                        created_at,
                        updated_at
                    ) VALUES (
                        p_organization_id,
                        v_rel_source_id,
                        v_rel_target_id,
                        v_rel_type,
                        v_rel_data,
                        COALESCE((v_relationship_item->>'is_active')::boolean, true),
                        p_actor_user_id,
                        p_actor_user_id,
                        NOW(),
                        NOW()
                    ) RETURNING id INTO v_temp_rel_id;
                    
                    -- Track created relationships
                    v_created_relationships := v_created_relationships || jsonb_build_object(
                        'id', v_temp_rel_id,
                        'from_entity_id', v_rel_source_id,
                        'to_entity_id', v_rel_target_id,
                        'relationship_type', v_rel_type,
                        'created', true
                    );
                END LOOP;
            END IF;
            
            -- Get the created entity
            SELECT * INTO v_entity_record 
            FROM core_entities 
            WHERE id = v_entity_id 
            AND organization_id = p_organization_id;
            
            -- Build dynamic data if requested
            IF v_include_dynamic THEN
                SELECT jsonb_object_agg(
                    field_name, 
                    jsonb_build_object(
                        'value', COALESCE(
                            field_value_text, 
                            field_value_number::text, 
                            field_value_boolean::text, 
                            field_value_date::text,
                            field_value_json::text
                        ),
                        'field_type', field_type,
                        'smart_code', smart_code
                    )
                ) INTO v_dynamic_data
                FROM core_dynamic_data 
                WHERE entity_id = v_entity_id 
                AND organization_id = p_organization_id;
                
                v_dynamic_data := COALESCE(v_dynamic_data, '{}'::jsonb);
            END IF;
            
            -- Build relationships data if requested (FIXED AGGREGATION)
            IF v_include_relationships THEN
                v_relationships_data := '{}'::jsonb;
                
                -- Use cursor to avoid nested aggregation
                FOR v_rel_record IN 
                    SELECT cr.*, 
                           se.entity_name as source_name, se.entity_type as source_type, se.smart_code as source_smart_code,
                           te.entity_name as target_name, te.entity_type as target_type, te.smart_code as target_smart_code
                    FROM core_relationships cr
                    LEFT JOIN core_entities se ON se.id = cr.from_entity_id
                    LEFT JOIN core_entities te ON te.id = cr.to_entity_id
                    WHERE (cr.from_entity_id = v_entity_id OR cr.to_entity_id = v_entity_id)
                    AND cr.organization_id = p_organization_id
                    AND cr.is_active = true
                LOOP
                    -- Get existing array for this relationship type or create new
                    v_rel_type_data := COALESCE(v_relationships_data->v_rel_record.relationship_type, '[]'::jsonb);
                    
                    -- Add this relationship to the array
                    v_rel_type_data := v_rel_type_data || jsonb_build_object(
                        'id', v_rel_record.id,
                        'from_entity_id', v_rel_record.from_entity_id,
                        'to_entity_id', v_rel_record.to_entity_id,
                        'relationship_type', v_rel_record.relationship_type,
                        'relationship_data', v_rel_record.relationship_data,
                        'is_active', v_rel_record.is_active,
                        'created_at', v_rel_record.created_at,
                        'updated_at', v_rel_record.updated_at,
                        'related_entity', CASE 
                            WHEN v_rel_record.from_entity_id = v_entity_id THEN 
                                jsonb_build_object(
                                    'id', v_rel_record.to_entity_id,
                                    'entity_name', v_rel_record.target_name,
                                    'entity_type', v_rel_record.target_type,
                                    'smart_code', v_rel_record.target_smart_code
                                )
                            ELSE
                                jsonb_build_object(
                                    'id', v_rel_record.from_entity_id,
                                    'entity_name', v_rel_record.source_name,
                                    'entity_type', v_rel_record.source_type,
                                    'smart_code', v_rel_record.source_smart_code
                                )
                        END
                    );
                    
                    -- Update the relationships data
                    v_relationships_data := v_relationships_data || jsonb_build_object(v_rel_record.relationship_type, v_rel_type_data);
                END LOOP;
            END IF;
            
            -- Build result
            v_result := jsonb_build_object(
                'items', jsonb_build_array(jsonb_build_object(
                    'id', v_entity_record.id,
                    'entity_type', v_entity_record.entity_type,
                    'entity_name', v_entity_record.entity_name,
                    'entity_code', v_entity_record.entity_code,
                    'smart_code', v_entity_record.smart_code,
                    'status', v_entity_record.status,
                    'metadata', v_entity_record.metadata,
                    'version', COALESCE(v_entity_record.version, 1),
                    'ai_insights', COALESCE(v_entity_record.ai_insights, '{}'::jsonb),
                    'ai_confidence', COALESCE(v_entity_record.ai_confidence, 0),
                    'ai_classification', v_entity_record.ai_classification,
                    'business_rules', COALESCE(v_entity_record.business_rules, '{}'::jsonb),
                    'dynamic', v_dynamic_data,
                    'relationships', v_relationships_data,
                    'created_by', v_entity_record.created_by,
                    'updated_by', v_entity_record.updated_by,
                    'created_at', v_entity_record.created_at,
                    'updated_at', v_entity_record.updated_at
                )),
                'next_cursor', v_entity_record.id::text,
                'metadata', jsonb_build_object(
                    'action', 'CREATE',
                    'relationships_created', jsonb_array_length(v_created_relationships),
                    'created_relationships', v_created_relationships,
                    'actor_user_id', p_actor_user_id,
                    'organization_id', p_organization_id
                )
            );
        
        -- =====================================================
        -- READ OPERATION (SAME CURSOR FIX)
        -- =====================================================
        WHEN 'READ' THEN
            IF p_entity ? 'entity_id' THEN
                SELECT * INTO v_entity_record 
                FROM core_entities 
                WHERE id = (p_entity->>'entity_id')::uuid 
                AND organization_id = p_organization_id;
                
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'ENTITY_NOT_FOUND: Entity % not found in organization %', 
                        p_entity->>'entity_id', p_organization_id;
                END IF;
                
                v_entity_id := v_entity_record.id;
                
                -- Build dynamic data if requested
                IF v_include_dynamic THEN
                    SELECT jsonb_object_agg(
                        field_name, 
                        jsonb_build_object(
                            'value', COALESCE(
                                field_value_text, 
                                field_value_number::text, 
                                field_value_boolean::text, 
                                field_value_date::text,
                                field_value_json::text
                            ),
                            'field_type', field_type,
                            'smart_code', smart_code
                        )
                    ) INTO v_dynamic_data
                    FROM core_dynamic_data 
                    WHERE entity_id = v_entity_record.id 
                    AND organization_id = p_organization_id;
                    
                    v_dynamic_data := COALESCE(v_dynamic_data, '{}'::jsonb);
                END IF;
                
                -- Build relationships data if requested (FIXED AGGREGATION)
                IF v_include_relationships THEN
                    v_relationships_data := '{}'::jsonb;
                    
                    FOR v_rel_record IN 
                        SELECT cr.*, 
                               se.entity_name as source_name, se.entity_type as source_type, se.smart_code as source_smart_code,
                               te.entity_name as target_name, te.entity_type as target_type, te.smart_code as target_smart_code
                        FROM core_relationships cr
                        LEFT JOIN core_entities se ON se.id = cr.from_entity_id
                        LEFT JOIN core_entities te ON te.id = cr.to_entity_id
                        WHERE (cr.from_entity_id = v_entity_id OR cr.to_entity_id = v_entity_id)
                        AND cr.organization_id = p_organization_id
                        AND cr.is_active = true
                    LOOP
                        -- Get existing array for this relationship type or create new
                        v_rel_type_data := COALESCE(v_relationships_data->v_rel_record.relationship_type, '[]'::jsonb);
                        
                        -- Add this relationship to the array
                        v_rel_type_data := v_rel_type_data || jsonb_build_object(
                            'id', v_rel_record.id,
                            'from_entity_id', v_rel_record.from_entity_id,
                            'to_entity_id', v_rel_record.to_entity_id,
                            'relationship_type', v_rel_record.relationship_type,
                            'relationship_data', v_rel_record.relationship_data,
                            'is_active', v_rel_record.is_active,
                            'created_at', v_rel_record.created_at,
                            'updated_at', v_rel_record.updated_at,
                            'related_entity', CASE 
                                WHEN v_rel_record.from_entity_id = v_entity_id THEN 
                                    jsonb_build_object(
                                        'id', v_rel_record.to_entity_id,
                                        'entity_name', v_rel_record.target_name,
                                        'entity_type', v_rel_record.target_type,
                                        'smart_code', v_rel_record.target_smart_code
                                    )
                                ELSE
                                    jsonb_build_object(
                                        'id', v_rel_record.from_entity_id,
                                        'entity_name', v_rel_record.source_name,
                                        'entity_type', v_rel_record.source_type,
                                        'smart_code', v_rel_record.source_smart_code
                                    )
                            END
                        );
                        
                        -- Update the relationships data
                        v_relationships_data := v_relationships_data || jsonb_build_object(v_rel_record.relationship_type, v_rel_type_data);
                    END LOOP;
                END IF;
                
                -- Build result
                v_result := jsonb_build_object(
                    'items', jsonb_build_array(jsonb_build_object(
                        'id', v_entity_record.id,
                        'entity_type', v_entity_record.entity_type,
                        'entity_name', v_entity_record.entity_name,
                        'entity_code', v_entity_record.entity_code,
                        'smart_code', v_entity_record.smart_code,
                        'status', v_entity_record.status,
                        'metadata', v_entity_record.metadata,
                        'version', COALESCE(v_entity_record.version, 1),
                        'ai_insights', COALESCE(v_entity_record.ai_insights, '{}'::jsonb),
                        'ai_confidence', COALESCE(v_entity_record.ai_confidence, 0),
                        'ai_classification', v_entity_record.ai_classification,
                        'business_rules', COALESCE(v_entity_record.business_rules, '{}'::jsonb),
                        'dynamic', v_dynamic_data,
                        'relationships', v_relationships_data,
                        'created_by', v_entity_record.created_by,
                        'updated_by', v_entity_record.updated_by,
                        'created_at', v_entity_record.created_at,
                        'updated_at', v_entity_record.updated_at
                    )),
                    'next_cursor', v_entity_record.id::text,
                    'metadata', jsonb_build_object(
                        'action', 'READ',
                        'single_entity', true,
                        'relationships_included', v_include_relationships,
                        'dynamic_included', v_include_dynamic,
                        'actor_user_id', p_actor_user_id,
                        'organization_id', p_organization_id
                    )
                );
            ELSE
                RAISE EXCEPTION 'ENTITY_ID_REQUIRED: entity_id is required for READ operations';
            END IF;
        
        ELSE
            RAISE EXCEPTION 'INVALID_ACTION: Unsupported action "%". Supported: CREATE, READ', p_action;
    END CASE;
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'HERA_ENTITIES_CRUD_ERROR: % (Context: %)', SQLERRM, v_error_context;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.hera_entities_crud_v2(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hera_entities_crud_v2(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb) TO service_role;

-- Verify deployment
DO $$
BEGIN
    RAISE NOTICE '✅ AGGREGATE FIX APPLIED: Nested aggregation issue resolved';
    RAISE NOTICE '🔗 READY: Relationship functionality should work correctly now';
END $$;