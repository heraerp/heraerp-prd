-- Complete fix for all organization functions with required fields
-- Run this in Supabase SQL Editor

-- Drop all existing functions
DROP FUNCTION IF EXISTS create_organization_with_owner(text, text, uuid, text, text, text);
DROP FUNCTION IF EXISTS get_user_organizations(uuid);

-- Fixed: create_organization_with_owner with smart_code
CREATE FUNCTION create_organization_with_owner(
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
    v_org_id UUID;
    v_user_entity_id UUID;
    v_result JSONB;
BEGIN
    -- Generate the organization ID first
    v_org_id := gen_random_uuid();

    -- 1. Create organization entity with all required fields
    INSERT INTO core_entities (
        id,
        organization_id,
        entity_type, 
        entity_name, 
        entity_code, 
        smart_code,  -- Required field
        metadata, 
        created_at, 
        updated_at
    ) VALUES (
        v_org_id,
        v_org_id,  -- Self-reference
        'organization',
        p_org_name,
        'ORG-' || UPPER(p_subdomain),
        'HERA.ORG.ENTITY.' || UPPER(p_org_type) || '.v1',  -- Smart code for organization
        jsonb_build_object(
            'subdomain', p_subdomain,
            'organization_type', p_org_type,
            'subscription_plan', 'trial',
            'billing_status', 'active',
            'settings', jsonb_build_object(
                'currency', 'USD',
                'timezone', 'UTC',
                'language', 'en'
            )
        ),
        NOW(),
        NOW()
    );

    -- 2. Create organization record
    INSERT INTO core_organizations (
        id, 
        organization_name, 
        organization_code,
        organization_type, 
        status, 
        settings, 
        created_at, 
        updated_at
    ) VALUES (
        v_org_id,
        p_org_name,
        'ORG-' || UPPER(p_subdomain),
        p_org_type,
        'active',
        jsonb_build_object(
            'subdomain', p_subdomain, 
            'owner_id', p_owner_id,
            'currency', 'USD',
            'timezone', 'UTC',
            'language', 'en'
        ),
        NOW(),
        NOW()
    );

    -- 3. Check if user entity already exists
    SELECT id INTO v_user_entity_id
    FROM core_entities
    WHERE entity_type = 'user'
      AND metadata->>'auth_user_id' = p_owner_id::TEXT
    LIMIT 1;

    IF v_user_entity_id IS NULL THEN
        -- Create user entity with all required fields
        INSERT INTO core_entities (
            id,
            organization_id,
            entity_type, 
            entity_name, 
            entity_code,
            smart_code,  -- Required field
            metadata, 
            created_at, 
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_org_id,
            'user',
            p_owner_name,
            'USER-' || UPPER(SPLIT_PART(p_owner_email, '@', 1)),
            'HERA.ORG.USER.OWNER.v1',  -- Smart code for owner user
            jsonb_build_object(
                'auth_user_id', p_owner_id,
                'email', p_owner_email,
                'role', 'owner'
            ),
            NOW(),
            NOW()
        ) RETURNING id INTO v_user_entity_id;
    ELSE
        -- If user exists, update their organization_id
        UPDATE core_entities
        SET organization_id = v_org_id,
            updated_at = NOW()
        WHERE id = v_user_entity_id;
    END IF;

    -- 4. Create owner relationship
    INSERT INTO core_relationships (
        id, 
        organization_id, 
        from_entity_id, 
        to_entity_id, 
        relationship_type, 
        relationship_data,
        smart_code,
        is_active,
        created_at, 
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_org_id,
        v_user_entity_id,
        v_org_id,
        'member_of',
        jsonb_build_object(
            'role', 'owner',
            'permissions', jsonb_build_array('*'),
            'joined_at', NOW()
        ),
        'HERA.ORG.REL.MEMBER.OWNER.v1',
        true,
        NOW(),
        NOW()
    );

    -- 5. Dynamic fields for organization
    INSERT INTO core_dynamic_data (
        id, 
        organization_id, 
        entity_id, 
        field_name, 
        field_value_text, 
        smart_code, 
        created_at, 
        updated_at
    ) VALUES
        (gen_random_uuid(), v_org_id, v_org_id, 'subdomain',    p_subdomain,   'HERA.ORG.FIELD.SUBDOMAIN.v1',     NOW(), NOW()),
        (gen_random_uuid(), v_org_id, v_org_id, 'owner_email',  p_owner_email, 'HERA.ORG.FIELD.OWNER_EMAIL.v1',   NOW(), NOW()),
        (gen_random_uuid(), v_org_id, v_org_id, 'created_date', NOW()::TEXT,   'HERA.ORG.FIELD.CREATED_DATE.v1',  NOW(), NOW());

    -- 6. Result
    v_result := jsonb_build_object(
        'success', true,
        'organization', jsonb_build_object(
            'id', v_org_id,
            'name', p_org_name,
            'subdomain', p_subdomain,
            'type', p_org_type
        ),
        'user', jsonb_build_object(
            'id', v_user_entity_id,
            'auth_user_id', p_owner_id,
            'email', p_owner_email,
            'role', 'owner'
        )
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Fixed: get_user_organizations with correct column names
CREATE FUNCTION get_user_organizations(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH user_orgs AS (
        SELECT 
            o.id,
            o.organization_name,
            o.organization_type,
            o.status,
            o.settings,
            oe.metadata->>'subdomain' as subdomain,
            oe.metadata->>'subscription_plan' as subscription_plan,
            r.relationship_data->>'role' as role,
            r.relationship_data->'permissions' as permissions
        FROM core_relationships r
        JOIN core_entities ue ON r.from_entity_id = ue.id
        JOIN core_organizations o ON r.to_entity_id = o.id
        JOIN core_entities oe ON o.id = oe.id
        WHERE ue.entity_type = 'user'
        AND ue.metadata->>'auth_user_id' = p_user_id::TEXT
        AND r.relationship_type = 'member_of'
        AND (o.status IS NULL OR o.status != 'inactive')
        ORDER BY r.created_at DESC
    )
    SELECT jsonb_build_object(
        'organizations', COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', organization_name,
                'type', organization_type,
                'subdomain', subdomain,
                'subscription_plan', COALESCE(subscription_plan, 'trial'),
                'is_active', COALESCE(status != 'inactive', true),
                'role', role,
                'permissions', permissions
            )
        ), '[]'::jsonb)
    ) INTO v_result
    FROM user_orgs;

    RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_organization_with_owner TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organizations TO authenticated;

-- Verify the complete fix
SELECT 'All organization functions updated with required fields!' as status;