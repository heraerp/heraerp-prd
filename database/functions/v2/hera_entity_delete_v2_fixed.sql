-- Fixed v2 delete function that properly handles soft delete via dynamic data
CREATE OR REPLACE FUNCTION public.hera_entity_delete_v2(
    p_organization_id uuid,
    p_entity_id uuid,
    p_hard_delete boolean DEFAULT false,
    p_cascade boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Security check
    IF NOT hera_can_access_org(p_organization_id) THEN
        RAISE EXCEPTION 'Access denied for organization %', p_organization_id
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    
    -- Verify entity exists and belongs to organization
    IF NOT EXISTS (
        SELECT 1 FROM core_entities 
        WHERE id = p_entity_id 
        AND organization_id = p_organization_id
    ) THEN
        RAISE EXCEPTION 'Entity % not found in organization %', p_entity_id, p_organization_id
            USING ERRCODE = 'no_data_found';
    END IF;
    
    IF p_hard_delete THEN
        -- Hard delete: Remove relationships first if cascade is true
        IF p_cascade THEN
            DELETE FROM core_relationships
            WHERE organization_id = p_organization_id
            AND (from_entity_id = p_entity_id OR to_entity_id = p_entity_id);
            
            DELETE FROM core_dynamic_data
            WHERE organization_id = p_organization_id
            AND entity_id = p_entity_id;
        END IF;
        
        -- Delete the entity
        DELETE FROM core_entities
        WHERE id = p_entity_id
        AND organization_id = p_organization_id;
        
        v_result := jsonb_build_object(
            'success', true,
            'operation', 'hard_delete',
            'entity_id', p_entity_id
        );
    ELSE
        -- Soft delete: Update status in dynamic data
        -- First check if status field exists
        IF EXISTS (
            SELECT 1 FROM core_dynamic_data
            WHERE entity_id = p_entity_id
            AND organization_id = p_organization_id
            AND field_name = 'status'
        ) THEN
            -- Update existing status
            UPDATE core_dynamic_data
            SET field_value_text = 'archived',
                updated_at = CURRENT_TIMESTAMP
            WHERE entity_id = p_entity_id
            AND organization_id = p_organization_id
            AND field_name = 'status';
        ELSE
            -- Insert new status field
            INSERT INTO core_dynamic_data (
                entity_id,
                organization_id,
                field_name,
                field_type,
                field_value_text,
                smart_code
            ) VALUES (
                p_entity_id,
                p_organization_id,
                'status',
                'text',
                'archived',
                'HERA.COMMON.STATUS.ARCHIVED.V1'
            );
        END IF;
        
        -- Update entity timestamp
        UPDATE core_entities
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = p_entity_id
        AND organization_id = p_organization_id;
        
        v_result := jsonb_build_object(
            'success', true,
            'operation', 'soft_delete',
            'entity_id', p_entity_id,
            'status', 'archived'
        );
    END IF;
    
    RETURN v_result;
END;
$$;