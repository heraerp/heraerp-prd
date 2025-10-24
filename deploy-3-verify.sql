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