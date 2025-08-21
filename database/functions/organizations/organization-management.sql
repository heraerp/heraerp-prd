-- Organization Management Functions for HERA SaaS
-- ================================================

-- Function to create a new organization with owner
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
        -- Add common organization fields
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

-- Function to get user's organizations
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
        'success', true,
        'organizations', COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', organization_name,
                'type', organization_type,
                'subdomain', subdomain,
                'subscription_plan', subscription_plan,
                'role', role,
                'permissions', permissions,
                'is_active', is_active
            )
        ), '[]'::jsonb)
    ) INTO v_result
    FROM user_orgs;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check subdomain availability
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

-- Function to install app for organization
CREATE OR REPLACE FUNCTION install_app_for_organization(
    p_org_id UUID,
    p_app_id TEXT,
    p_app_config JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
    v_app_entity_id UUID;
    v_relationship_id UUID;
BEGIN
    -- Get or create app entity
    SELECT id INTO v_app_entity_id
    FROM core_entities
    WHERE entity_type = 'application'
    AND entity_code = UPPER(p_app_id);

    IF v_app_entity_id IS NULL THEN
        INSERT INTO core_entities (
            id,
            entity_type,
            entity_name,
            entity_code,
            metadata
        ) VALUES (
            gen_random_uuid(),
            'application',
            p_app_id,
            UPPER(p_app_id),
            jsonb_build_object(
                'app_id', p_app_id,
                'version', '1.0.0'
            )
        ) RETURNING id INTO v_app_entity_id;
    END IF;

    -- Create app installation relationship
    INSERT INTO core_relationships (
        id,
        organization_id,
        from_entity_id,
        to_entity_id,
        relationship_type,
        metadata
    ) VALUES (
        gen_random_uuid(),
        p_org_id,
        p_org_id,
        v_app_entity_id,
        'has_installed',
        jsonb_build_object(
            'installed_at', NOW(),
            'config', p_app_config,
            'status', 'active',
            'subscription', jsonb_build_object(
                'plan', 'trial',
                'seats', 5
            )
        )
    ) RETURNING id INTO v_relationship_id;

    -- Provision app data based on app type
    CASE p_app_id
        WHEN 'salon' THEN
            -- Create salon-specific entities
            PERFORM provision_salon_app(p_org_id);
        WHEN 'restaurant' THEN
            -- Create restaurant-specific entities
            PERFORM provision_restaurant_app(p_org_id);
        WHEN 'budgeting' THEN
            -- Create budgeting-specific entities
            PERFORM provision_budgeting_app(p_org_id);
        ELSE
            -- Generic app provisioning
            NULL;
    END CASE;

    RETURN jsonb_build_object(
        'success', true,
        'app_id', p_app_id,
        'installation_id', v_relationship_id,
        'message', 'App installed successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization by subdomain
CREATE OR REPLACE FUNCTION get_organization_by_subdomain(p_subdomain TEXT)
RETURNS JSONB AS $$
DECLARE
    v_org RECORD;
    v_apps JSONB;
BEGIN
    -- Get organization
    SELECT 
        o.id,
        o.organization_name,
        o.organization_type,
        o.subscription_plan,
        o.is_active,
        oe.metadata
    INTO v_org
    FROM core_organizations o
    JOIN core_entities oe ON o.id = oe.id
    WHERE oe.entity_type = 'organization'
    AND oe.metadata->>'subdomain' = p_subdomain
    AND o.is_active = true;

    IF v_org.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Organization not found'
        );
    END IF;

    -- Get installed apps
    SELECT jsonb_agg(
        jsonb_build_object(
            'app_id', ae.entity_code,
            'name', ae.entity_name,
            'status', r.metadata->>'status',
            'installed_at', r.metadata->>'installed_at',
            'config', r.metadata->'config'
        )
    ) INTO v_apps
    FROM core_relationships r
    JOIN core_entities ae ON r.to_entity_id = ae.id
    WHERE r.from_entity_id = v_org.id
    AND r.relationship_type = 'has_installed'
    AND ae.entity_type = 'application';

    RETURN jsonb_build_object(
        'success', true,
        'organization', jsonb_build_object(
            'id', v_org.id,
            'name', v_org.organization_name,
            'type', v_org.organization_type,
            'subdomain', v_org.metadata->>'subdomain',
            'subscription_plan', v_org.subscription_plan,
            'is_active', v_org.is_active,
            'settings', v_org.metadata->'settings'
        ),
        'installed_apps', COALESCE(v_apps, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_organization_with_owner TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organizations TO authenticated;
GRANT EXECUTE ON FUNCTION check_subdomain_availability TO authenticated, anon;
GRANT EXECUTE ON FUNCTION install_app_for_organization TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_by_subdomain TO authenticated, anon;