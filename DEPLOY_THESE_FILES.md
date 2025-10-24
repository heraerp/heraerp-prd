# 🚀 MANUAL DEPLOYMENT INSTRUCTIONS

## Files to Deploy to Supabase

Run these SQL files in your Supabase SQL Editor in this exact order:

### 1️⃣ First: Update RPC Function (CRITICAL)

**File:** `database/functions/organizations/resolve-user-identity-rpc-member-of.sql`

This updates the auth function to use `MEMBER_OF` instead of `USER_MEMBER_OF_ORG`.

### 2️⃣ Second: Create User Membership (CRITICAL)

**File:** `scripts/fix-user-membership-final.sql` (see below)

This creates the correct MEMBER_OF relationship for your user.

### 3️⃣ Third: Verify the Fix

**File:** `scripts/verify-auth-setup.sql` (see below)

This verifies everything is set up correctly.

---

## File Contents:

### File 1: resolve-user-identity-rpc-member-of.sql
```sql
-- HERA User Identity Resolution RPC Functions - MEMBER_OF VERSION
-- ================================================================
-- Updated to use MEMBER_OF relationship type instead of USER_MEMBER_OF_ORG

-- Drop existing functions to recreate with correct relationship type
DROP FUNCTION IF EXISTS resolve_user_identity_v1();
DROP FUNCTION IF EXISTS resolve_user_roles_in_org(UUID);

-- Function to resolve user identity and organization memberships
-- Updated to use MEMBER_OF relationship type
CREATE OR REPLACE FUNCTION resolve_user_identity_v1()
RETURNS TABLE(
    organization_ids UUID[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_auth_id UUID;
    v_user_entity_id UUID;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_org_ids UUID[];
BEGIN
    -- Get the current user's auth ID from JWT
    v_user_auth_id := auth.uid();
    
    IF v_user_auth_id IS NULL THEN
        RETURN QUERY SELECT ARRAY[]::UUID[];
        RETURN;
    END IF;

    -- Find the user entity by direct ID lookup first (for bootstrap cases)
    SELECT id INTO v_user_entity_id
    FROM core_entities
    WHERE id = v_user_auth_id
    AND entity_type = 'USER';
    
    -- If not found by direct ID, try by metadata
    IF v_user_entity_id IS NULL THEN
        SELECT id INTO v_user_entity_id
        FROM core_entities
        WHERE entity_type = 'USER'
        AND (
            organization_id = v_platform_org_id OR 
            metadata->>'auth_user_id' = v_user_auth_id::TEXT
        );
    END IF;

    IF v_user_entity_id IS NULL THEN
        -- No user entity found, return empty array
        RETURN QUERY SELECT ARRAY[]::UUID[];
        RETURN;
    END IF;

    -- Get all organization IDs where user has MEMBER_OF relationship
    -- Using LEGACY field names: from_entity_id/to_entity_id
    SELECT ARRAY_AGG(to_entity_id) INTO v_org_ids
    FROM core_relationships
    WHERE from_entity_id = v_user_entity_id
    AND relationship_type = 'MEMBER_OF'
    AND is_active = true;

    -- Return the organization IDs
    RETURN QUERY SELECT COALESCE(v_org_ids, ARRAY[]::UUID[]);
    
EXCEPTION
    WHEN OTHERS THEN
        -- On any error, return empty array to prevent access
        RETURN QUERY SELECT ARRAY[]::UUID[];
END;
$$;

-- Function to resolve user roles in a specific organization
-- Updated to use MEMBER_OF relationship type
CREATE OR REPLACE FUNCTION resolve_user_roles_in_org(p_org UUID)
RETURNS TABLE(role_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_auth_id UUID;
    v_user_entity_id UUID;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_relationship_metadata JSONB;
BEGIN
    -- Get the current user's auth ID from JWT
    v_user_auth_id := auth.uid();
    
    IF v_user_auth_id IS NULL THEN
        RETURN;
    END IF;

    -- Find the user entity by direct ID lookup first
    SELECT id INTO v_user_entity_id
    FROM core_entities
    WHERE id = v_user_auth_id
    AND entity_type = 'USER';
    
    -- If not found by direct ID, try by metadata
    IF v_user_entity_id IS NULL THEN
        SELECT id INTO v_user_entity_id
        FROM core_entities
        WHERE entity_type = 'USER'
        AND (
            organization_id = v_platform_org_id OR 
            metadata->>'auth_user_id' = v_user_auth_id::TEXT
        );
    END IF;

    IF v_user_entity_id IS NULL THEN
        RETURN;
    END IF;

    -- Get the relationship metadata for this organization
    -- Using LEGACY field names: from_entity_id/to_entity_id
    SELECT relationship_data INTO v_relationship_metadata
    FROM core_relationships
    WHERE from_entity_id = v_user_entity_id
    AND to_entity_id = p_org
    AND relationship_type = 'MEMBER_OF'
    AND is_active = true;

    IF v_relationship_metadata IS NULL THEN
        RETURN;
    END IF;

    -- Return the role from metadata
    RETURN QUERY SELECT (v_relationship_metadata->>'role')::TEXT
    WHERE v_relationship_metadata->>'role' IS NOT NULL;

EXCEPTION
    WHEN OTHERS THEN
        -- On any error, return no roles
        RETURN;
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION resolve_user_identity_v1() TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_user_roles_in_org(UUID) TO authenticated;

-- Add function documentation
COMMENT ON FUNCTION resolve_user_identity_v1() IS 'Resolve user identity and return organization IDs where user has MEMBER_OF relationship';
COMMENT ON FUNCTION resolve_user_roles_in_org(UUID) IS 'Get user roles within a specific organization using MEMBER_OF relationship';
```

### File 2: fix-user-membership-final.sql
```sql
-- Fix user membership for correct organization
-- User: 3ced4979-4c09-4e1e-8667-6707cfe6ec77
-- Correct Org: 378f24fb-d496-4ff7-8afa-ea34895a0eb8

DO $$
DECLARE
    v_user_id UUID := '3ced4979-4c09-4e1e-8667-6707cfe6ec77';
    v_org_id UUID := '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
    v_existing_rel_id UUID;
BEGIN
    -- Step 1: Ensure user entity exists with correct org
    INSERT INTO core_entities (
        id,
        organization_id,
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        metadata,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_org_id,
        'USER',
        'michele',
        'USER-' || substring(v_user_id::text, 1, 8),
        'HERA.CORE.USER.ENT.STANDARD.V1',
        jsonb_build_object('email', 'michele@example.com', 'auth_user_id', v_user_id),
        v_user_id,
        v_user_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
        organization_id = v_org_id,
        updated_by = v_user_id,
        updated_at = NOW();

    -- Step 2: Remove any old USER_MEMBER_OF_ORG relationships
    DELETE FROM core_relationships 
    WHERE from_entity_id = v_user_id 
    AND relationship_type = 'USER_MEMBER_OF_ORG';

    -- Step 3: Remove any MEMBER_OF relationships to wrong orgs
    DELETE FROM core_relationships 
    WHERE from_entity_id = v_user_id 
    AND relationship_type = 'MEMBER_OF'
    AND to_entity_id != v_org_id;

    -- Step 4: Create or update MEMBER_OF relationship to correct org
    INSERT INTO core_relationships (
        organization_id,
        from_entity_id,
        to_entity_id,
        relationship_type,
        smart_code,
        relationship_data,
        is_active,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        v_org_id,
        v_user_id,
        v_org_id,
        'MEMBER_OF',
        'HERA.CORE.USER.REL.MEMBER_OF.V1',
        jsonb_build_object('role', 'OWNER', 'permissions', '["*"]'),
        true,
        v_user_id,
        v_user_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (organization_id, from_entity_id, to_entity_id, relationship_type)
    DO UPDATE SET
        relationship_data = jsonb_build_object('role', 'OWNER', 'permissions', '["*"]'),
        is_active = true,
        updated_by = v_user_id,
        updated_at = NOW();

    RAISE NOTICE 'User membership fixed successfully for user % in org %', v_user_id, v_org_id;
END $$;
```

### File 3: verify-auth-setup.sql  
```sql
-- Verify authentication setup
DO $$
DECLARE
    v_user_id UUID := '3ced4979-4c09-4e1e-8667-6707cfe6ec77';
    v_org_id UUID := '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
    v_user_exists BOOLEAN;
    v_rel_exists BOOLEAN;
    v_org_exists BOOLEAN;
BEGIN
    -- Check user entity
    SELECT EXISTS(
        SELECT 1 FROM core_entities 
        WHERE id = v_user_id 
        AND entity_type = 'USER'
        AND organization_id = v_org_id
    ) INTO v_user_exists;

    -- Check MEMBER_OF relationship
    SELECT EXISTS(
        SELECT 1 FROM core_relationships 
        WHERE from_entity_id = v_user_id 
        AND to_entity_id = v_org_id
        AND relationship_type = 'MEMBER_OF'
        AND is_active = true
    ) INTO v_rel_exists;

    -- Check organization exists
    SELECT EXISTS(
        SELECT 1 FROM core_entities 
        WHERE id = v_org_id 
        AND entity_type = 'ORG'
    ) INTO v_org_exists;

    RAISE NOTICE '=== AUTHENTICATION VERIFICATION ===';
    RAISE NOTICE 'User Entity Exists: %', v_user_exists;
    RAISE NOTICE 'MEMBER_OF Relationship Exists: %', v_rel_exists;
    RAISE NOTICE 'Organization Exists: %', v_org_exists;
    
    IF v_user_exists AND v_rel_exists AND v_org_exists THEN
        RAISE NOTICE '✅ ALL CHECKS PASSED - Authentication should work!';
    ELSE
        RAISE NOTICE '❌ Some checks failed - please review setup';
    END IF;
END $$;

-- Show current user relationships
SELECT 
    'Current MEMBER_OF relationships for user:' as info,
    r.from_entity_id as user_id,
    r.to_entity_id as org_id,
    r.relationship_type,
    r.relationship_data->>'role' as role,
    r.is_active,
    o.entity_name as org_name
FROM core_relationships r
LEFT JOIN core_entities o ON o.id = r.to_entity_id
WHERE r.from_entity_id = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
AND r.relationship_type = 'MEMBER_OF';
```

---

## 🚀 Deployment Steps:

1. **Open Supabase SQL Editor**
2. **Copy and run File 1** (resolve-user-identity-rpc-member-of.sql)
3. **Copy and run File 2** (fix-user-membership-final.sql)  
4. **Copy and run File 3** (verify-auth-setup.sql)
5. **Check the output** - you should see "✅ ALL CHECKS PASSED"

After running these, try logging in again!