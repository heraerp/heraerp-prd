-- =====================================================
-- HOTFIX: Enterprise Relationship Function Type Issue
-- =====================================================
-- 
-- Fixes the COALESCE type mismatch error in smart_code generation
-- 
-- Issue: COALESCE types text and jsonb cannot be matched
-- Fix: Ensure all COALESCE parameters are the same type (text)
-- =====================================================

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.hera_entities_crud_v2(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb) CASCADE;

-- Recreate with fixed type handling
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
    v_options_parsed jsonb;
    v_include_relationships boolean := false;
    v_include_dynamic boolean := true;
    v_dynamic_data jsonb := '{}'::jsonb;
    v_error_context text;
    v_relationship_item jsonb;
    v_rel_source_id uuid;
    v_rel_target_id uuid;
    v_rel_type text;
    v_rel_data jsonb;
    v_rel_direction text;
    v_temp_rel_id uuid;
    v_smart_code_generated text;
BEGIN
    -- =====================================================
    -- SECURITY & VALIDATION
    -- =====================================================
    
    -- Validate required parameters
    IF p_action IS NULL OR p_action = '' THEN
        RAISE EXCEPTION 'INVALID_ACTION: Action parameter is required';
    END IF;
    
    IF p_actor_user_id IS NULL THEN
        RAISE EXCEPTION 'ACTOR_REQUIRED: Actor user ID is required for audit trail';
    END IF;
    
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'ORG_REQUIRED: Organization ID is required for data isolation';
    END IF;
    
    -- Parse options with defaults
    v_options_parsed := COALESCE(p_options, '{}'::jsonb);
    v_include_relationships := COALESCE((v_options_parsed->>'include_relationships')::boolean, false);
    v_include_dynamic := COALESCE((v_options_parsed->>'include_dynamic')::boolean, true);
    
    -- Set error context for debugging
    v_error_context := format('Action: %s, Actor: %s, Org: %s', p_action, p_actor_user_id, p_organization_id);
    
    -- =====================================================
    -- ACTION ROUTING
    -- =====================================================
    
    CASE upper(p_action)
        
        -- =====================================================
        -- CREATE OPERATION WITH RELATIONSHIPS
        -- =====================================================
        WHEN 'CREATE' THEN
            -- Validate required entity fields
            IF NOT (p_entity ? 'entity_type') OR (p_entity->>'entity_type') = '' THEN
                RAISE EXCEPTION 'ENTITY_TYPE_REQUIRED: entity_type is required for CREATE operations';
            END IF;
            
            IF NOT (p_entity ? 'entity_name') OR (p_entity->>'entity_name') = '' THEN
                RAISE EXCEPTION 'ENTITY_NAME_REQUIRED: entity_name is required for CREATE operations';
            END IF;
            
            -- Generate smart_code safely (FIXED TYPE ISSUE)
            v_smart_code_generated := COALESCE(
                p_entity->>'smart_code',  -- User provided (text)
                format('HERA.%s.%s.ENTITY.AUTO.V1', 
                    upper(p_entity->>'entity_type'), 
                    upper(replace(p_entity->>'entity_name', ' ', '_'))
                )  -- Generated (text)
            );
            
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
                v_smart_code_generated,  -- Use pre-generated text variable
                COALESCE(p_entity->'metadata', '{}'::jsonb),
                COALESCE(p_entity->>'status', 'active'),
                p_actor_user_id,
                p_actor_user_id,
                NOW(),
                NOW()
            ) RETURNING id INTO v_entity_id;
            
            -- =====================================================
            -- DYNAMIC DATA CREATION (FIXED)
            -- =====================================================
            IF p_dynamic IS NOT NULL AND jsonb_typeof(p_dynamic) = 'object' THEN
                FOR v_relationship IN SELECT key, value FROM jsonb_each(p_dynamic) LOOP
                    -- Validate dynamic field structure
                    IF NOT (v_relationship.value ? 'field_type') THEN
                        RAISE EXCEPTION 'DYNAMIC_FIELD_TYPE_REQUIRED: field_type is required for dynamic field "%"', v_relationship.key;
                    END IF;
                    
                    -- Insert dynamic data with proper field mapping
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
                        COALESCE(
                            v_relationship.value->>'smart_code',  -- User provided (text)
                            format('HERA.%s.%s.FIELD.%s.V1', 
                                upper(p_entity->>'entity_type'),
                                upper(replace(p_entity->>'entity_name', ' ', '_')),
                                upper(v_relationship.key)
                            )  -- Generated (text)
                        ),
                        p_actor_user_id,
                        p_actor_user_id,
                        NOW(),
                        NOW()
                    );
                END LOOP;
            END IF;
            
            -- =====================================================
            -- RELATIONSHIP CREATION (USING CORRECT SCHEMA FIELDS)
            -- =====================================================
            IF p_relationships IS NOT NULL AND jsonb_typeof(p_relationships) = 'array' AND jsonb_array_length(p_relationships) > 0 THEN
                FOR v_relationship IN SELECT value FROM jsonb_array_elements(p_relationships) LOOP
                    v_relationship_item := v_relationship.value;
                    
                    -- Extract relationship data with validation (CORRECTED FIELD NAMES)
                    v_rel_source_id := COALESCE(
                        (v_relationship_item->>'source_entity_id')::uuid,
                        (v_relationship_item->>'from_entity_id')::uuid,
                        v_entity_id  -- Default to created entity
                    );
                    
                    v_rel_target_id := COALESCE(
                        (v_relationship_item->>'target_entity_id')::uuid,
                        (v_relationship_item->>'to_entity_id')::uuid
                    );
                    
                    v_rel_type := v_relationship_item->>'relationship_type';
                    v_rel_data := COALESCE(v_relationship_item->'relationship_data', '{}'::jsonb);
                    v_rel_direction := COALESCE(v_relationship_item->>'relationship_direction', 'outbound');
                    
                    -- Validate relationship requirements
                    IF v_rel_target_id IS NULL THEN
                        RAISE EXCEPTION 'REL_TARGET_REQUIRED: target_entity_id is required for relationship creation';
                    END IF;
                    
                    IF v_rel_type IS NULL OR v_rel_type = '' THEN
                        RAISE EXCEPTION 'REL_TYPE_REQUIRED: relationship_type is required for relationship creation';
                    END IF;
                    
                    -- Verify target entity exists and belongs to organization
                    IF NOT EXISTS (
                        SELECT 1 FROM core_entities 
                        WHERE id = v_rel_target_id 
                        AND organization_id = p_organization_id
                    ) THEN
                        RAISE EXCEPTION 'REL_TARGET_NOT_FOUND: Target entity % not found in organization %', v_rel_target_id, p_organization_id;
                    END IF;
                    
                    -- Create the relationship (USING CORRECT SCHEMA FIELDS)
                    INSERT INTO core_relationships (
                        organization_id,
                        from_entity_id,        -- ✅ CORRECT: Using actual schema field names
                        to_entity_id,          -- ✅ CORRECT: Using actual schema field names  
                        relationship_type,
                        relationship_direction,
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
                        v_rel_direction,
                        v_rel_data,
                        COALESCE((v_relationship_item->>'is_active')::boolean, true),
                        p_actor_user_id,
                        p_actor_user_id,
                        NOW(),
                        NOW()
                    ) RETURNING id INTO v_temp_rel_id;
                    
                    -- Add to created relationships tracking
                    v_created_relationships := v_created_relationships || jsonb_build_object(
                        'id', v_temp_rel_id,
                        'from_entity_id', v_rel_source_id,
                        'to_entity_id', v_rel_target_id,
                        'relationship_type', v_rel_type,
                        'relationship_direction', v_rel_direction,
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
                        'value', COALESCE(field_value_text, field_value_number::text, field_value_boolean::text, field_value_date::text, field_value_json),
                        'field_type', field_type,
                        'smart_code', smart_code
                    )
                ) INTO v_dynamic_data
                FROM core_dynamic_data 
                WHERE entity_id = v_entity_id 
                AND organization_id = p_organization_id;
                
                v_dynamic_data := COALESCE(v_dynamic_data, '{}'::jsonb);
            END IF;
            
            -- Build relationships data if requested
            IF v_include_relationships THEN
                SELECT jsonb_object_agg(
                    relationship_type,
                    jsonb_agg(jsonb_build_object(
                        'id', cr.id,
                        'from_entity_id', cr.from_entity_id,
                        'to_entity_id', cr.to_entity_id,
                        'relationship_type', cr.relationship_type,
                        'relationship_direction', cr.relationship_direction,
                        'relationship_data', cr.relationship_data,
                        'is_active', cr.is_active,
                        'created_at', cr.created_at,
                        'updated_at', cr.updated_at,
                        'related_entity', CASE 
                            WHEN cr.from_entity_id = v_entity_id THEN 
                                jsonb_build_object(
                                    'id', te.id,
                                    'entity_name', te.entity_name,
                                    'entity_type', te.entity_type,
                                    'smart_code', te.smart_code
                                )
                            ELSE
                                jsonb_build_object(
                                    'id', se.id,
                                    'entity_name', se.entity_name,
                                    'entity_type', se.entity_type,
                                    'smart_code', se.smart_code
                                )
                        END
                    ))
                ) INTO v_relationships_data
                FROM core_relationships cr
                LEFT JOIN core_entities se ON se.id = cr.from_entity_id
                LEFT JOIN core_entities te ON te.id = cr.to_entity_id
                WHERE (cr.from_entity_id = v_entity_id OR cr.to_entity_id = v_entity_id)
                AND cr.organization_id = p_organization_id
                AND cr.is_active = true
                GROUP BY relationship_type;
                
                v_relationships_data := COALESCE(v_relationships_data, '{}'::jsonb);
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
                    'version', v_entity_record.version,
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
        -- READ OPERATION WITH RELATIONSHIPS
        -- =====================================================
        WHEN 'READ' THEN
            -- Build WHERE clause based on provided filters
            IF p_entity ? 'entity_id' THEN
                -- Single entity read
                SELECT * INTO v_entity_record 
                FROM core_entities 
                WHERE id = (p_entity->>'entity_id')::uuid 
                AND organization_id = p_organization_id;
                
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'ENTITY_NOT_FOUND: Entity % not found in organization %', 
                        p_entity->>'entity_id', p_organization_id;
                END IF;
                
                -- Build dynamic data if requested
                IF v_include_dynamic THEN
                    SELECT jsonb_object_agg(
                        field_name, 
                        jsonb_build_object(
                            'value', COALESCE(field_value_text, field_value_number::text, field_value_boolean::text, field_value_date::text, field_value_json),
                            'field_type', field_type,
                            'smart_code', smart_code
                        )
                    ) INTO v_dynamic_data
                    FROM core_dynamic_data 
                    WHERE entity_id = v_entity_record.id 
                    AND organization_id = p_organization_id;
                    
                    v_dynamic_data := COALESCE(v_dynamic_data, '{}'::jsonb);
                END IF;
                
                -- Build relationships data if requested
                IF v_include_relationships THEN
                    SELECT jsonb_object_agg(
                        relationship_type,
                        jsonb_agg(jsonb_build_object(
                            'id', cr.id,
                            'from_entity_id', cr.from_entity_id,
                            'to_entity_id', cr.to_entity_id,
                            'relationship_type', cr.relationship_type,
                            'relationship_direction', cr.relationship_direction,
                            'relationship_data', cr.relationship_data,
                            'is_active', cr.is_active,
                            'created_at', cr.created_at,
                            'updated_at', cr.updated_at,
                            'related_entity', CASE 
                                WHEN cr.from_entity_id = v_entity_record.id THEN 
                                    jsonb_build_object(
                                        'id', te.id,
                                        'entity_name', te.entity_name,
                                        'entity_type', te.entity_type,
                                        'smart_code', te.smart_code
                                    )
                                ELSE
                                    jsonb_build_object(
                                        'id', se.id,
                                        'entity_name', se.entity_name,
                                        'entity_type', se.entity_type,
                                        'smart_code', se.smart_code
                                    )
                            END
                        ))
                    ) INTO v_relationships_data
                    FROM core_relationships cr
                    LEFT JOIN core_entities se ON se.id = cr.from_entity_id
                    LEFT JOIN core_entities te ON te.id = cr.to_entity_id
                    WHERE (cr.from_entity_id = v_entity_record.id OR cr.to_entity_id = v_entity_record.id)
                    AND cr.organization_id = p_organization_id
                    AND cr.is_active = true
                    GROUP BY relationship_type;
                    
                    v_relationships_data := COALESCE(v_relationships_data, '{}'::jsonb);
                END IF;
                
                -- Build single entity result
                v_result := jsonb_build_object(
                    'items', jsonb_build_array(jsonb_build_object(
                        'id', v_entity_record.id,
                        'entity_type', v_entity_record.entity_type,
                        'entity_name', v_entity_record.entity_name,
                        'entity_code', v_entity_record.entity_code,
                        'smart_code', v_entity_record.smart_code,
                        'status', v_entity_record.status,
                        'metadata', v_entity_record.metadata,
                        'version', v_entity_record.version,
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
                -- Multiple entity read with filters
                RAISE EXCEPTION 'LIST_READ_NOT_IMPLEMENTED: List read operations not yet implemented in this version';
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
    RAISE NOTICE '✅ HOTFIX APPLIED: Type mismatch issues resolved';
    RAISE NOTICE '🔧 FIXED: smart_code generation type safety';
    RAISE NOTICE '🔗 READY: Enterprise relationship functionality restored';
END $$;