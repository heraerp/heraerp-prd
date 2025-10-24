-- HERA v2.2 Emergency Login Fix for Michele (Current User)
-- User: 3ced4979-4c09-4e1e-8667-6707cfe6ec77 (currently logged in)

BEGIN;

DO $$
DECLARE
    -- Michele's user ID (currently failing to resolve)
    v_user_entity_id UUID := '3ced4979-4c09-4e1e-8667-6707cfe6ec77';
    v_org_id UUID := '378f24fb-d496-4ff7-8afa-ea34895a0eb8';          -- Hairtalkz production org  
    v_actor_user_id UUID := '09b0b92a-d797-489e-bc03-5ca0a6272674';   -- Michele's service actor (from deploy-4)
    v_org_entity_id UUID;
    v_org_name TEXT;
    v_exists BOOLEAN;
BEGIN
    -- Safety: ensure we actually have an org row
    SELECT EXISTS(SELECT 1 FROM core_organizations WHERE id = v_org_id) INTO v_exists;
    IF NOT v_exists THEN
        RAISE EXCEPTION 'Tenant organization % not found.', v_org_id;
    END IF;
    RAISE NOTICE 'Verified tenant organization exists: %', v_org_id;

    -- Get organization name for ORG entity
    SELECT organization_name INTO v_org_name 
    FROM core_organizations 
    WHERE id = v_org_id;

    -- (B) Ensure an ORG entity exists inside this org
    INSERT INTO core_entities (
        id, organization_id, entity_type, entity_name, smart_code, 
        status, metadata, created_by, updated_by, created_at, updated_at
    )
    VALUES (
        v_org_id,
        v_org_id,
        'ORGANIZATION',
        v_org_name,
        'HERA.SYSTEM.ORG.ENTITY.ORGANIZATION.V1',
        'active',
        jsonb_build_object('source','emergency_bootstrap','fixed_at',NOW()),
        v_actor_user_id, v_actor_user_id,
        NOW(), NOW()
    )
    ON CONFLICT (id, organization_id) DO UPDATE SET
        updated_by = v_actor_user_id,
        updated_at = NOW();

    v_org_entity_id := v_org_id;
    RAISE NOTICE 'ORG entity ensured: %', v_org_entity_id;

    -- (C) Ensure Michele's USER entity exists in this org
    INSERT INTO core_entities (
        id, organization_id, entity_type, entity_name, smart_code,
        status, metadata, created_by, updated_by, created_at, updated_at
    )
    VALUES (
        v_user_entity_id,
        v_org_id,
        'USER',
        'michele',
        'HERA.SYSTEM.USER.ENTITY.PERSON.V1',
        'active',
        jsonb_build_object(
            'auth_provider','supabase',
            'provider_uid', v_user_entity_id::text,
            'email','michele@hairtalkz.com',
            'emergency_fix',true,
            'fixed_at',NOW()
        ),
        v_actor_user_id, v_actor_user_id,
        NOW(), NOW()
    )
    ON CONFLICT (id, organization_id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        entity_type = 'USER',
        entity_name = 'michele',
        metadata = EXCLUDED.metadata,
        updated_by = v_actor_user_id,
        updated_at = NOW();

    RAISE NOTICE 'USER entity ensured for Michele: %', v_user_entity_id;

    -- (D) Clean up any conflicting relationships
    DELETE FROM core_relationships 
    WHERE from_entity_id = v_user_entity_id 
    AND relationship_type IN ('MEMBER_OF', 'USER_MEMBER_OF_ORG');

    RAISE NOTICE 'Cleaned up old relationships for Michele: %', v_user_entity_id;

    -- (E) Create MEMBER_OF relationship (role=OWNER)
    INSERT INTO core_relationships (
        organization_id, from_entity_id, to_entity_id,
        relationship_type,
        relationship_data,
        smart_code,
        is_active,
        created_by, updated_by, created_at, updated_at
    )
    VALUES (
        v_org_id, v_user_entity_id, v_org_entity_id,
        'MEMBER_OF',
        jsonb_build_object('role','OWNER','permissions','["*"]'),
        'HERA.CORE.USER.REL.MEMBER_OF.V1',
        true,
        v_actor_user_id, v_actor_user_id,
        NOW(), NOW()
    )
    ON CONFLICT (organization_id, from_entity_id, to_entity_id, relationship_type) DO UPDATE SET
        relationship_data = EXCLUDED.relationship_data,
        is_active = true,
        updated_by = v_actor_user_id,
        updated_at = NOW();

    RAISE NOTICE 'MEMBER_OF relationship ensured: Michele % → %', v_user_entity_id, v_org_entity_id;

    RAISE NOTICE '=== MICHELE LOGIN FIX COMPLETED ===';
    RAISE NOTICE 'Michele should now be able to access the dashboard';
END $$;

COMMIT;

-- Verification for Michele
SELECT 'Michele USER entity:' as check_type, id, organization_id, entity_type, entity_name, smart_code
FROM core_entities
WHERE id = '3ced4979-4c09-4e1e-8667-6707cfe6ec77';

SELECT 'Michele MEMBER_OF relationship:' as check_type, relationship_type, relationship_data, is_active
FROM core_relationships
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND from_entity_id = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
  AND relationship_type = 'MEMBER_OF';