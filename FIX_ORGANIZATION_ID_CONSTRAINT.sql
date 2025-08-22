-- Fix organization_id constraint issue
-- Run this in Supabase SQL Editor

DROP FUNCTION IF EXISTS create_organization_with_owner(text, text, uuid, text, text, text);

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
    -- 1. Create organization entity (no organization_id needed for organization entities)
    INSERT INTO core_entities (
        id, 
        entity_type, 
        entity_name, 
        entity_code, 
        metadata, 
        created_at, 
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'organization',
        p_org_name,
        'ORG-' || UPPER(p_subdomain),
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
    ) RETURNING id INTO v_org_id;

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
        -- Create user entity WITHOUT organization_id first
        INSERT INTO core_entities (
            id, 
            entity_type, 
            entity_name, 
            entity_code, 
            metadata, 
            created_at, 
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'user',
            p_owner_name,
            'USER-' || UPPER(SPLIT_PART(p_owner_email, '@', 1)),
            jsonb_build_object(
                'auth_user_id', p_owner_id,
                'email', p_owner_email,
                'role', 'owner',
                'primary_organization_id', v_org_id
            ),
            NOW(),
            NOW()
        ) RETURNING id INTO v_user_entity_id;
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_organization_with_owner TO authenticated;

-- Let's also check if organization_id is nullable in core_entities
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'core_entities'
  AND column_name = 'organization_id';