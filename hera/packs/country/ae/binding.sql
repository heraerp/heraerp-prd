-- UAE Tax Profile Binding
-- Binds UAE VAT profile to an organization

-- Function to bind UAE VAT profile to an organization
CREATE OR REPLACE FUNCTION bind_uae_vat_profile(
    p_organization_id uuid,
    p_tax_registration_number text DEFAULT NULL,
    p_effective_date date DEFAULT CURRENT_DATE
) RETURNS uuid AS $$
DECLARE
    v_tax_profile_id uuid := 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; -- UAE VAT profile
    v_relationship_id uuid;
    v_org_entity_id uuid;
BEGIN
    -- Get the organization's entity ID
    SELECT id INTO v_org_entity_id
    FROM core_entities
    WHERE entity_type = 'organization'
    AND business_rules->>'organization_id' = p_organization_id::text
    LIMIT 1;
    
    IF v_org_entity_id IS NULL THEN
        -- Create organization entity if it doesn't exist
        INSERT INTO core_entities (
            entity_type,
            entity_code,
            entity_name,
            smart_code,
            business_rules,
            organization_id
        ) 
        SELECT 
            'organization',
            'ORG_' || UPPER(LEFT(name, 10)),
            name,
            'HERA.ORG.ENTITY.v1',
            jsonb_build_object('organization_id', id),
            id
        FROM core_organizations
        WHERE id = p_organization_id
        RETURNING id INTO v_org_entity_id;
    END IF;
    
    -- Remove any existing tax profile bindings
    UPDATE core_relationships
    SET status = 'inactive',
        metadata = metadata || jsonb_build_object('deactivated_at', NOW())
    WHERE from_entity_id = v_org_entity_id
    AND relationship_type = 'uses_tax_profile'
    AND status = 'active';
    
    -- Create new binding
    INSERT INTO core_relationships (
        from_entity_id,
        to_entity_id,
        relationship_type,
        smart_code,
        organization_id,
        metadata,
        status
    ) VALUES (
        v_org_entity_id,
        v_tax_profile_id,
        'uses_tax_profile',
        'HERA.TAX.BINDING.PRIMARY.v1',
        p_organization_id,
        jsonb_build_object(
            'effective_date', p_effective_date,
            'tax_registration_number', p_tax_registration_number,
            'jurisdiction', 'AE',
            'tax_system', 'VAT'
        ),
        'active'
    ) RETURNING id INTO v_relationship_id;
    
    -- Log the binding
    INSERT INTO core_dynamic_data (
        entity_id,
        field_name,
        field_value_text,
        smart_code,
        organization_id,
        metadata
    ) VALUES (
        v_org_entity_id,
        'tax_profile_history',
        'Bound to UAE VAT profile',
        'HERA.TAX.BINDING.LOG.v1',
        p_organization_id,
        jsonb_build_object(
            'profile_id', v_tax_profile_id,
            'bound_at', NOW(),
            'bound_by', current_user,
            'registration_number', p_tax_registration_number
        )
    );
    
    RETURN v_relationship_id;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT bind_uae_vat_profile(
--     'your-org-uuid'::uuid,
--     '100123456700003',  -- TRN
--     '2025-01-01'::date
-- );