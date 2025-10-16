-- User Assignment RPC Functions for HERA Organizations
-- =======================================================
-- These functions handle assigning existing users to organizations
-- with proper USER_MEMBER_OF_ORG relationship creation

-- Function to assign an existing user to an organization
CREATE OR REPLACE FUNCTION assign_user_to_organization(
    p_user_auth_id UUID,
    p_organization_id UUID,
    p_role TEXT DEFAULT 'user',
    p_permissions JSONB DEFAULT '["read"]'::JSONB,
    p_assigner_auth_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_user_entity_id UUID;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_relationship_id UUID;
    v_existing_relationship UUID;
    v_result JSONB;
BEGIN
    -- Start transaction
    BEGIN
        -- 1. Validate organization exists and is active
        IF NOT EXISTS (
            SELECT 1 FROM core_organizations 
            WHERE id = p_organization_id 
            AND status = 'active'
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Organization not found or inactive',
                'error_code', 'ORG_NOT_FOUND'
            );
        END IF;

        -- 2. Find the user entity in platform organization
        SELECT id INTO v_user_entity_id
        FROM core_entities
        WHERE entity_type = 'USER'
        AND organization_id = v_platform_org_id
        AND metadata->>'auth_user_id' = p_user_auth_id::TEXT;

        IF v_user_entity_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User entity not found in platform organization',
                'error_code', 'USER_ENTITY_NOT_FOUND',
                'hint', 'User must be created in platform organization first'
            );
        END IF;

        -- 3. Check if relationship already exists
        SELECT id INTO v_existing_relationship
        FROM core_relationships
        WHERE source_entity_id = v_user_entity_id
        AND target_entity_id = p_organization_id
        AND relationship_type = 'USER_MEMBER_OF_ORG';

        IF v_existing_relationship IS NOT NULL THEN
            -- Update existing relationship
            UPDATE core_relationships
            SET 
                relationship_data = jsonb_build_object(
                    'role', p_role,
                    'permissions', p_permissions,
                    'assigned_at', NOW(),
                    'assigned_by', p_assigner_auth_id,
                    'updated_at', NOW()
                ),
                updated_at = NOW()
            WHERE id = v_existing_relationship;

            v_relationship_id := v_existing_relationship;
        ELSE
            -- 4. Create new USER_MEMBER_OF_ORG relationship
            INSERT INTO core_relationships (
                id,
                organization_id,
                source_entity_id,
                target_entity_id,
                relationship_type,
                relationship_data,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                p_organization_id,
                v_user_entity_id,
                p_organization_id,
                'USER_MEMBER_OF_ORG',
                jsonb_build_object(
                    'role', p_role,
                    'permissions', p_permissions,
                    'assigned_at', NOW(),
                    'assigned_by', p_assigner_auth_id,
                    'status', 'active'
                ),
                NOW(),
                NOW()
            ) RETURNING id INTO v_relationship_id;
        END IF;

        -- 5. Create audit transaction for user assignment
        INSERT INTO universal_transactions (
            id,
            organization_id,
            transaction_type,
            transaction_number,
            source_entity_id,
            target_entity_id,
            total_amount,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            p_organization_id,
            'user_assignment',
            'USER-ASSIGN-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            v_user_entity_id,
            p_organization_id,
            0,
            jsonb_build_object(
                'relationship_id', v_relationship_id,
                'role', p_role,
                'permissions', p_permissions,
                'action', CASE WHEN v_existing_relationship IS NOT NULL THEN 'updated' ELSE 'created' END
            ),
            NOW(),
            NOW()
        );

        -- Build success result
        v_result := jsonb_build_object(
            'success', true,
            'relationship_id', v_relationship_id,
            'user_entity_id', v_user_entity_id,
            'organization_id', p_organization_id,
            'role', p_role,
            'permissions', p_permissions,
            'action', CASE WHEN v_existing_relationship IS NOT NULL THEN 'updated' ELSE 'created' END,
            'message', 'User successfully assigned to organization'
        );

        RETURN v_result;

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback will happen automatically
            RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'error_code', 'ASSIGNMENT_FAILED',
                'sqlstate', SQLSTATE
            );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove user from organization
CREATE OR REPLACE FUNCTION remove_user_from_organization(
    p_user_auth_id UUID,
    p_organization_id UUID,
    p_remover_auth_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_user_entity_id UUID;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_relationship_id UUID;
    v_result JSONB;
BEGIN
    -- Start transaction
    BEGIN
        -- 1. Find the user entity in platform organization
        SELECT id INTO v_user_entity_id
        FROM core_entities
        WHERE entity_type = 'USER'
        AND organization_id = v_platform_org_id
        AND metadata->>'auth_user_id' = p_user_auth_id::TEXT;

        IF v_user_entity_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User entity not found',
                'error_code', 'USER_NOT_FOUND'
            );
        END IF;

        -- 2. Find and delete the USER_MEMBER_OF_ORG relationship
        DELETE FROM core_relationships
        WHERE source_entity_id = v_user_entity_id
        AND target_entity_id = p_organization_id
        AND relationship_type = 'USER_MEMBER_OF_ORG'
        RETURNING id INTO v_relationship_id;

        IF v_relationship_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User is not a member of this organization',
                'error_code', 'RELATIONSHIP_NOT_FOUND'
            );
        END IF;

        -- 3. Create audit transaction for user removal
        INSERT INTO universal_transactions (
            id,
            organization_id,
            transaction_type,
            transaction_number,
            source_entity_id,
            target_entity_id,
            total_amount,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            p_organization_id,
            'user_removal',
            'USER-REMOVE-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            v_user_entity_id,
            p_organization_id,
            0,
            jsonb_build_object(
                'removed_relationship_id', v_relationship_id,
                'removed_by', p_remover_auth_id,
                'action', 'removed'
            ),
            NOW(),
            NOW()
        );

        -- Build success result
        v_result := jsonb_build_object(
            'success', true,
            'user_entity_id', v_user_entity_id,
            'organization_id', p_organization_id,
            'removed_relationship_id', v_relationship_id,
            'message', 'User successfully removed from organization'
        );

        RETURN v_result;

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback will happen automatically
            RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'error_code', 'REMOVAL_FAILED',
                'sqlstate', SQLSTATE
            );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organization memberships
CREATE OR REPLACE FUNCTION get_user_organization_memberships(
    p_user_auth_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_user_entity_id UUID;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_result JSONB;
BEGIN
    -- 1. Find the user entity in platform organization
    SELECT id INTO v_user_entity_id
    FROM core_entities
    WHERE entity_type = 'USER'
    AND organization_id = v_platform_org_id
    AND metadata->>'auth_user_id' = p_user_auth_id::TEXT;

    IF v_user_entity_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User entity not found',
            'error_code', 'USER_NOT_FOUND'
        );
    END IF;

    -- 2. Get all organization memberships
    WITH user_memberships AS (
        SELECT 
            o.id as org_id,
            o.organization_name,
            o.organization_type,
            o.subscription_tier,
            o.status,
            oe.metadata->>'subdomain' as subdomain,
            r.relationship_data->>'role' as role,
            r.relationship_data->'permissions' as permissions,
            r.relationship_data->>'assigned_at' as assigned_at,
            r.created_at as relationship_created_at,
            r.id as relationship_id
        FROM core_relationships r
        JOIN core_organizations o ON r.target_entity_id = o.id
        LEFT JOIN core_entities oe ON o.id = oe.id AND oe.entity_type = 'organization'
        WHERE r.source_entity_id = v_user_entity_id
        AND r.relationship_type = 'USER_MEMBER_OF_ORG'
        ORDER BY r.created_at DESC
    )
    SELECT jsonb_build_object(
        'success', true,
        'user_entity_id', v_user_entity_id,
        'user_auth_id', p_user_auth_id,
        'memberships', COALESCE(jsonb_agg(
            jsonb_build_object(
                'organization_id', org_id,
                'organization_name', organization_name,
                'organization_type', organization_type,
                'subdomain', subdomain,
                'subscription_plan', subscription_tier,
                'is_active', status = 'active',
                'role', role,
                'permissions', permissions,
                'assigned_at', assigned_at,
                'relationship_created_at', relationship_created_at,
                'relationship_id', relationship_id
            )
        ), '[]'::jsonb),
        'membership_count', (SELECT COUNT(*) FROM user_memberships)
    ) INTO v_result
    FROM user_memberships;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user role in organization
CREATE OR REPLACE FUNCTION update_user_role_in_organization(
    p_user_auth_id UUID,
    p_organization_id UUID,
    p_new_role TEXT,
    p_new_permissions JSONB DEFAULT NULL,
    p_updater_auth_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_user_entity_id UUID;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_relationship_id UUID;
    v_old_metadata JSONB;
    v_new_metadata JSONB;
    v_result JSONB;
BEGIN
    -- Start transaction
    BEGIN
        -- 1. Find the user entity in platform organization
        SELECT id INTO v_user_entity_id
        FROM core_entities
        WHERE entity_type = 'USER'
        AND organization_id = v_platform_org_id
        AND metadata->>'auth_user_id' = p_user_auth_id::TEXT;

        IF v_user_entity_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User entity not found',
                'error_code', 'USER_NOT_FOUND'
            );
        END IF;

        -- 2. Find the existing relationship and get current metadata
        SELECT id, relationship_data INTO v_relationship_id, v_old_metadata
        FROM core_relationships
        WHERE source_entity_id = v_user_entity_id
        AND target_entity_id = p_organization_id
        AND relationship_type = 'USER_MEMBER_OF_ORG';

        IF v_relationship_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User is not a member of this organization',
                'error_code', 'RELATIONSHIP_NOT_FOUND'
            );
        END IF;

        -- 3. Build new metadata preserving existing fields
        v_new_metadata := COALESCE(v_old_metadata, '{}'::jsonb) || jsonb_build_object(
            'role', p_new_role,
            'permissions', COALESCE(p_new_permissions, v_old_metadata->'permissions', '["read"]'::jsonb),
            'updated_at', NOW(),
            'updated_by', p_updater_auth_id
        );

        -- 4. Update the relationship with new role and permissions
        UPDATE core_relationships
        SET 
            relationship_data = v_new_metadata,
            updated_at = NOW()
        WHERE id = v_relationship_id;

        -- 5. Create audit transaction for role update
        INSERT INTO universal_transactions (
            id,
            organization_id,
            transaction_type,
            transaction_number,
            source_entity_id,
            target_entity_id,
            total_amount,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            p_organization_id,
            'user_role_update',
            'USER-ROLE-UPDATE-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            v_user_entity_id,
            p_organization_id,
            0,
            jsonb_build_object(
                'relationship_id', v_relationship_id,
                'old_role', v_old_metadata->>'role',
                'new_role', p_new_role,
                'old_permissions', v_old_metadata->'permissions',
                'new_permissions', v_new_metadata->'permissions',
                'updated_by', p_updater_auth_id
            ),
            NOW(),
            NOW()
        );

        -- Build success result
        v_result := jsonb_build_object(
            'success', true,
            'relationship_id', v_relationship_id,
            'user_entity_id', v_user_entity_id,
            'organization_id', p_organization_id,
            'old_role', v_old_metadata->>'role',
            'new_role', p_new_role,
            'old_permissions', v_old_metadata->'permissions',
            'new_permissions', v_new_metadata->'permissions',
            'message', 'User role successfully updated in organization'
        );

        RETURN v_result;

    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback will happen automatically
            RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM,
                'error_code', 'ROLE_UPDATE_FAILED',
                'sqlstate', SQLSTATE
            );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION assign_user_to_organization TO authenticated;
GRANT EXECUTE ON FUNCTION remove_user_from_organization TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organization_memberships TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role_in_organization TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_relationships_user_member_of_org 
ON core_relationships(source_entity_id, target_entity_id, relationship_type) 
WHERE relationship_type = 'USER_MEMBER_OF_ORG';

CREATE INDEX IF NOT EXISTS idx_entities_user_auth_mapping 
ON core_entities(organization_id, entity_type, (metadata->>'auth_user_id')) 
WHERE entity_type = 'USER';