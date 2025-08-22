-- Enhanced organization creation that automatically sets up salon businesses
-- This extends the create_organization_with_owner function to handle salon setup

CREATE OR REPLACE FUNCTION create_organization_with_business_setup(
    p_org_name     TEXT,
    p_subdomain    TEXT,
    p_owner_id     UUID,
    p_owner_email  TEXT,
    p_owner_name   TEXT,
    p_org_type     TEXT DEFAULT 'general'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_org_id UUID;
    v_setup_result JSONB;
BEGIN
    -- First create the organization using existing function
    v_result := create_organization_with_owner(
        p_org_name,
        p_subdomain,
        p_owner_id,
        p_owner_email,
        p_owner_name,
        p_org_type
    );
    
    -- If organization was created successfully and it's a salon
    IF v_result->>'success' = 'true' AND p_org_type = 'salon' THEN
        v_org_id := (v_result->'organization'->>'id')::UUID;
        
        -- Create initial salon setup flag
        INSERT INTO core_dynamic_data (
            id,
            organization_id,
            entity_id,
            field_name,
            field_value_text,
            smart_code,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_org_id,
            v_org_id,
            'business_setup_status',
            'pending',
            'HERA.SALON.SETUP.STATUS.v1',
            NOW(),
            NOW()
        );
        
        -- Add salon app installation
        PERFORM install_app_for_organization(
            v_org_id,
            'salon',
            jsonb_build_object(
                'setup_required', true,
                'features', jsonb_build_array(
                    'appointments',
                    'inventory',
                    'payments',
                    'loyalty',
                    'marketing'
                )
            )
        );
        
        -- Update result to include salon setup info
        v_result := v_result || jsonb_build_object(
            'business_setup', jsonb_build_object(
                'type', 'salon',
                'status', 'pending',
                'next_step', '/api/v1/salon/setup'
            )
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_organization_with_business_setup TO authenticated;