-- HERA v2.2 Emergency Login Fix - Universal SQL (No psql metacommands)
-- Goal: Ensure USER entity + ORG entity + MEMBER_OF (OWNER) exist & are v2.2-audit compliant.
-- Works in any PostgreSQL client (Supabase dashboard, pgAdmin, etc.)

BEGIN;

DO $$
DECLARE
    -- Production values (pre-filled for immediate execution)
    v_user_entity_id UUID := '5c1b3698-0c38-4e3b-b1a2-cc84dcd1aa30';  -- Failing user
    v_org_id UUID := '378f24fb-d496-4ff7-8afa-ea34895a0eb8';          -- Hairtalkz production org  
    v_actor_user_id UUID := '09b0b92a-d797-489e-bc03-5ca0a6272674';   -- Michele's service actor
    v_org_entity_id UUID;
    v_org_name TEXT;
    v_exists BOOLEAN;
BEGIN
    -- Safety: ensure we actually have an org row
    SELECT EXISTS(SELECT 1 FROM core_organizations WHERE id = v_org_id) INTO v_exists;
    IF NOT v_exists THEN
        RAISE EXCEPTION 'Tenant organization % not found. Verify v_org_id exists in core_organizations.', v_org_id;
    END IF;
    RAISE NOTICE 'Verified tenant organization exists: %', v_org_id;

    -- Get organization name for ORG entity
    SELECT organization_name INTO v_org_name 
    FROM core_organizations 
    WHERE id = v_org_id;

    -- (B) Ensure an ORG entity exists inside this org (for relationships)
    INSERT INTO core_entities (
        id, organization_id, entity_type, entity_name, smart_code, 
        status, metadata, created_by, updated_by, created_at, updated_at
    )
    VALUES (
        v_org_id, -- Use org_id as ORG entity id for simplicity
        v_org_id,
        'ORGANIZATION',
        v_org_name,
        'HERA.IDENTITY.ORG.CORE.V1',
        'active',
        jsonb_build_object('source','emergency_bootstrap','fixed_at',NOW()),
        v_actor_user_id, v_actor_user_id,
        NOW(), NOW()
    )
    ON CONFLICT (id, organization_id) DO UPDATE SET
        updated_by = v_actor_user_id,
        updated_at = NOW();

    v_org_entity_id := v_org_id; -- ORG entity id = org id
    RAISE NOTICE 'ORG entity ensured: %', v_org_entity_id;

    -- (C) Ensure USER entity exists in this org for the Supabase user
    INSERT INTO core_entities (
        id, organization_id, entity_type, entity_name, smart_code,
        status, metadata, created_by, updated_by, created_at, updated_at
    )
    VALUES (
        v_user_entity_id,
        v_org_id,
        'USER',
        'Production User',
        'HERA.IDENTITY.USER.CORE.V1',
        'active',
        jsonb_build_object(
            'auth_provider','supabase',
            'provider_uid', v_user_entity_id::text,
            'emergency_fix',true,
            'fixed_at',NOW()
        ),
        v_actor_user_id, v_actor_user_id,
        NOW(), NOW()
    )
    ON CONFLICT (id, organization_id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        entity_type = 'USER',
        metadata = EXCLUDED.metadata,
        updated_by = v_actor_user_id,
        updated_at = NOW();

    RAISE NOTICE 'USER entity ensured: %', v_user_entity_id;

    -- (D) Clean up any conflicting relationships first
    DELETE FROM core_relationships 
    WHERE from_entity_id = v_user_entity_id 
    AND relationship_type IN ('MEMBER_OF', 'USER_MEMBER_OF_ORG');

    RAISE NOTICE 'Cleaned up old relationships for user: %', v_user_entity_id;

    -- (E) Create MEMBER_OF relationship (role=OWNER) from USER → ORG entity
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
        jsonb_build_object('role','OWNER','permissions','["*"]','emergency_fix',true),
        'HERA.IDENTITY.REL.MEMBER_OF.V1',
        true,
        v_actor_user_id, v_actor_user_id,
        NOW(), NOW()
    )
    ON CONFLICT (organization_id, from_entity_id, to_entity_id, relationship_type) DO UPDATE SET
        relationship_data = EXCLUDED.relationship_data,
        is_active = true,
        updated_by = v_actor_user_id,
        updated_at = NOW();

    RAISE NOTICE 'MEMBER_OF relationship ensured: % → %', v_user_entity_id, v_org_entity_id;

    RAISE NOTICE '=== EMERGENCY FIX COMPLETED ===';
    RAISE NOTICE 'User should now be able to log in at: https://www.heraerp.com';
END $$;

COMMIT;

-- Verification queries (run these separately after the above completes)
-- Copy and paste each block individually:

-- 1. Check USER entity in tenant:
SELECT 'USER entity check:' as check_type, id, organization_id, entity_type, smart_code, created_by, updated_by
FROM core_entities
WHERE id = '5c1b3698-0c38-4e3b-b1a2-cc84dcd1aa30';

-- 2. Check ORG entity in tenant:
SELECT 'ORG entity check:' as check_type, id, entity_type, entity_name, smart_code
FROM core_entities
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND entity_type = 'ORGANIZATION';

-- 3. Check MEMBER_OF relationship:
SELECT 'MEMBER_OF relationship check:' as check_type, relationship_type, relationship_data, smart_code, created_by, is_active
FROM core_relationships
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND from_entity_id = '5c1b3698-0c38-4e3b-b1a2-cc84dcd1aa30'
  AND relationship_type = 'MEMBER_OF';

-- 4. Check organization exists:
SELECT 'Organization check:' as check_type, id, organization_name, organization_code, status
FROM core_organizations
WHERE id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';