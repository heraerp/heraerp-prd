-- QUICK FIX: Organization Management Functions
-- Copy and paste this entire file into Supabase SQL Editor and click "Run"

-- 1. Function to check subdomain availability
CREATE OR REPLACE FUNCTION check_subdomain_availability(p_subdomain TEXT)
RETURNS JSONB AS $$
DECLARE
    v_exists BOOLEAN;
    v_reserved_subdomains TEXT[] := ARRAY['app', 'api', 'www', 'admin', 'dashboard', 'auth', 'login', 'signup', 'demo', 'test', 'staging', 'production'];
BEGIN
    -- Check if subdomain is reserved
    IF p_subdomain = ANY(v_reserved_subdomains) THEN
        RETURN jsonb_build_object(
            'available', false,
            'reason', 'reserved'
        );
    END IF;

    -- Check if subdomain already exists
    SELECT EXISTS(
        SELECT 1 
        FROM core_entities 
        WHERE entity_type = 'organization' 
        AND metadata->>'subdomain' = p_subdomain
    ) INTO v_exists;

    IF v_exists THEN
        RETURN jsonb_build_object(
            'available', false,
            'reason', 'taken'
        );
    ELSE
        RETURN jsonb_build_object(
            'available', true,
            'subdomain', p_subdomain
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to create a new organization with owner
CREATE OR REPLACE FUNCTION create_organization_with_owner(
    p_org_name TEXT,
    p_org_type TEXT DEFAULT 'general',
    p_subdomain TEXT,
    p_owner_id UUID,
    p_owner_email TEXT,
    p_owner_name TEXT
) RETURNS JSONB AS $$
DECLARE
    v_org_id UUID;
    v_user_entity_id UUID;
    v_result JSONB;
BEGIN
    -- Start transaction
    BEGIN
        -- 1. Create organization entity
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

        -- 2. Create organization record in core_organizations
        INSERT INTO core_organizations (
            id,
            organization_name,
            organization_type,
            subscription_plan,
            is_active,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            v_org_id,
            p_org_name,
            p_org_type,
            'trial',
            true,
            jsonb_build_object(
                'subdomain', p_subdomain,
                'owner_id', p_owner_id
            ),
            NOW(),
            NOW()
        );

        -- 3. Create user entity if not exists
        SELECT id INTO v_user_entity_id
        FROM core_entities
        WHERE entity_type = 'user'
        AND metadata->>'auth_user_id' = p_owner_id::TEXT;

        IF v_user_entity_id IS NULL THEN
            INSERT INTO core_entities (
                id,
                organization_id,
                entity_type,
                entity_name,
                entity_code,
                metadata,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_org_id,
                'user',
                p_owner_name,
                'USER-' || UPPER(SPLIT_PART(p_owner_email, '@', 1)),
                jsonb_build_object(
                    'auth_user_id', p_owner_id,
                    'email', p_owner_email,
                    'role', 'owner'
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
            metadata,
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
                'permissions', '["*"]',
                'joined_at', NOW()
            ),
            NOW(),
            NOW()
        );

        -- 5. Set dynamic fields for organization
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
        (gen_random_uuid(), v_org_id, v_org_id, 'subdomain', p_subdomain, 'HERA.ORG.FIELD.SUBDOMAIN.v1', NOW(), NOW()),
        (gen_random_uuid(), v_org_id, v_org_id, 'owner_email', p_owner_email, 'HERA.ORG.FIELD.OWNER_EMAIL.v1', NOW(), NOW()),
        (gen_random_uuid(), v_org_id, v_org_id, 'created_date', NOW()::TEXT, 'HERA.ORG.FIELD.CREATED_DATE.v1', NOW(), NOW());

        -- Build result
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

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback will happen automatically
            RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM
            );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to get user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH user_orgs AS (
        SELECT 
            o.id,
            o.organization_name,
            o.organization_type,
            o.subscription_plan,
            o.is_active,
            oe.metadata->>'subdomain' as subdomain,
            r.metadata->>'role' as role,
            r.metadata->'permissions' as permissions
        FROM core_relationships r
        JOIN core_entities ue ON r.from_entity_id = ue.id
        JOIN core_organizations o ON r.to_entity_id = o.id
        JOIN core_entities oe ON o.id = oe.id
        WHERE ue.entity_type = 'user'
        AND ue.metadata->>'auth_user_id' = p_user_id::TEXT
        AND r.relationship_type = 'member_of'
        AND o.is_active = true
        ORDER BY r.created_at DESC
    )
    SELECT jsonb_build_object(
        'organizations', COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', organization_name,
                'type', organization_type,
                'subdomain', subdomain,
                'subscription_plan', subscription_plan,
                'is_active', is_active,
                'role', role,
                'permissions', permissions
            )
        ), '[]'::jsonb)
    ) INTO v_result
    FROM user_orgs;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to get organization by subdomain
CREATE OR REPLACE FUNCTION get_organization_by_subdomain(p_subdomain TEXT)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', o.id,
        'name', o.organization_name,
        'type', o.organization_type,
        'subdomain', e.metadata->>'subdomain',
        'subscription_plan', o.subscription_plan,
        'is_active', o.is_active,
        'metadata', o.metadata
    ) INTO v_result
    FROM core_organizations o
    JOIN core_entities e ON o.id = e.id
    WHERE e.entity_type = 'organization'
    AND e.metadata->>'subdomain' = p_subdomain
    AND o.is_active = true;

    IF v_result IS NULL THEN
        RETURN jsonb_build_object(
            'error', 'Organization not found',
            'subdomain', p_subdomain
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_organization_with_owner TO authenticated;
GRANT EXECUTE ON FUNCTION check_subdomain_availability TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_organizations TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_by_subdomain TO authenticated, anon;

-- 6. Verify functions were created
SELECT 'Functions created successfully!' as status,
       COUNT(*) as function_count
FROM pg_proc 
WHERE proname IN ('create_organization_with_owner', 'check_subdomain_availability', 'get_user_organizations', 'get_organization_by_subdomain');