-- HERA Migration: Convert core_memberships to Sacred Architecture
-- This migrates membership data to entities and relationships before deletion

-- Step 1: Check if core_memberships exists and has data
DO $$
DECLARE
    membership_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'core_memberships') THEN
        SELECT COUNT(*) INTO membership_count FROM core_memberships;
        RAISE NOTICE 'Found % memberships to migrate', membership_count;
        
        IF membership_count > 0 THEN
            RAISE NOTICE 'Starting migration of memberships to sacred tables...';
        END IF;
    ELSE
        RAISE NOTICE 'core_memberships table does not exist, skipping migration';
    END IF;
END $$;

-- Step 2: Migrate memberships to entities and relationships
DO $$
DECLARE
    membership RECORD;
    membership_entity_id UUID;
BEGIN
    -- Only proceed if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'core_memberships') THEN
        FOR membership IN 
            SELECT * FROM core_memberships
        LOOP
            -- Create a membership entity
            INSERT INTO core_entities (
                entity_type,
                entity_code,
                entity_name,
                smart_code,
                business_rules,
                organization_id,
                status,
                created_at,
                updated_at
            ) VALUES (
                'membership',
                CONCAT('MEMBERSHIP-', membership.user_id::text, '-', membership.organization_id::text),
                CONCAT('Membership: User ', membership.user_id::text),
                'HERA.ORG.MEMBERSHIP.V1',
                jsonb_build_object(
                    'user_id', membership.user_id,
                    'role', membership.role,
                    'permissions', COALESCE(membership.permissions, '{}'),
                    'joined_at', membership.created_at
                ),
                membership.organization_id,
                CASE WHEN membership.is_active THEN 'active' ELSE 'inactive' END,
                membership.created_at,
                membership.updated_at
            ) RETURNING id INTO membership_entity_id;
            
            -- Create relationship: user -> member_of -> organization
            INSERT INTO core_relationships (
                from_entity_id,
                to_entity_id,
                relationship_type,
                smart_code,
                organization_id,
                metadata,
                status,
                created_at
            ) VALUES (
                membership.user_id,  -- Assuming user_id references a user entity
                membership.organization_id,  -- Organization as entity
                'member_of',
                'HERA.ORG.MEMBERSHIP.REL.V1',
                membership.organization_id,
                jsonb_build_object(
                    'membership_entity_id', membership_entity_id,
                    'role', membership.role,
                    'permissions', COALESCE(membership.permissions, '{}')
                ),
                CASE WHEN membership.is_active THEN 'active' ELSE 'inactive' END,
                membership.created_at
            );
            
            -- Store permissions in dynamic data if complex
            IF membership.permissions IS NOT NULL AND membership.permissions != '{}'::jsonb THEN
                INSERT INTO core_dynamic_data (
                    entity_id,
                    field_name,
                    field_value_text,
                    smart_code,
                    organization_id,
                    metadata
                ) VALUES (
                    membership_entity_id,
                    'permissions',
                    membership.permissions::text,
                    'HERA.ORG.PERMISSION.SET.V1',
                    membership.organization_id,
                    jsonb_build_object(
                        'permission_type', 'full_set',
                        'granted_by', membership.created_by,
                        'granted_at', membership.created_at
                    )
                );
            END IF;
            
            RAISE NOTICE 'Migrated membership for user % in org %', membership.user_id, membership.organization_id;
        END LOOP;
    END IF;
END $$;

-- Step 3: Create a view to replicate core_memberships functionality using sacred tables
CREATE OR REPLACE VIEW v_memberships AS
SELECT 
    e.id as membership_id,
    (e.business_rules->>'user_id')::uuid as user_id,
    e.organization_id,
    e.business_rules->>'role' as role,
    COALESCE(e.business_rules->'permissions', '{}'::jsonb) as permissions,
    CASE WHEN e.status = 'active' THEN true ELSE false END as is_active,
    e.created_at,
    e.updated_at,
    e.created_by,
    e.updated_by
FROM core_entities e
WHERE e.entity_type = 'membership'
AND e.status IN ('active', 'inactive');

-- Step 4: Create helper functions for membership management
CREATE OR REPLACE FUNCTION create_membership(
    p_user_id UUID,
    p_organization_id UUID,
    p_role TEXT,
    p_permissions JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_membership_id UUID;
BEGIN
    -- Create membership entity
    INSERT INTO core_entities (
        entity_type,
        entity_code,
        entity_name,
        smart_code,
        business_rules,
        organization_id,
        status
    ) VALUES (
        'membership',
        CONCAT('MEMBERSHIP-', p_user_id::text, '-', p_organization_id::text),
        CONCAT('Membership: ', p_role),
        'HERA.ORG.MEMBERSHIP.V1',
        jsonb_build_object(
            'user_id', p_user_id,
            'role', p_role,
            'permissions', p_permissions
        ),
        p_organization_id,
        'active'
    ) RETURNING id INTO v_membership_id;
    
    -- Create relationship
    INSERT INTO core_relationships (
        from_entity_id,
        to_entity_id,
        relationship_type,
        smart_code,
        organization_id,
        metadata,
        status
    ) VALUES (
        p_user_id,
        p_organization_id,
        'member_of',
        'HERA.ORG.MEMBERSHIP.REL.V1',
        p_organization_id,
        jsonb_build_object(
            'membership_entity_id', v_membership_id,
            'role', p_role
        ),
        'active'
    );
    
    RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Show migration results
SELECT 
    'Memberships migrated to entities:' as info,
    COUNT(*) as count
FROM core_entities
WHERE entity_type = 'membership';

SELECT 
    'Membership relationships created:' as info,
    COUNT(*) as count
FROM core_relationships
WHERE relationship_type = 'member_of'
AND smart_code = 'HERA.ORG.MEMBERSHIP.REL.V1';

-- Step 6: Now safe to drop core_memberships
-- This will be done by the cleanup script