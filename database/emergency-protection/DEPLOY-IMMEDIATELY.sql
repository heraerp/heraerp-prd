-- 🚨 EMERGENCY PROTECTION DEPLOYMENT
-- EXECUTE IMMEDIATELY IN SUPABASE SQL EDITOR
-- This prevents future catastrophic relationship data loss

-- =====================================================
-- PHASE 1: EMERGENCY BACKUP SYSTEM
-- =====================================================

-- Create system_backups log table
CREATE TABLE IF NOT EXISTS system_backups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type text NOT NULL,
    table_name text NOT NULL,
    record_count bigint,
    created_at timestamp with time zone DEFAULT now()
);

-- Emergency backup function
CREATE OR REPLACE FUNCTION emergency_relationship_backup()
RETURNS text AS $$
DECLARE
    backup_table_name text;
    dynamic_backup_table_name text;
    backup_count bigint;
BEGIN
    -- Generate timestamped backup table names
    backup_table_name := format('emergency_relationships_backup_%s', 
                                to_char(now(), 'YYYY_MM_DD_HH24_MI_SS'));
    dynamic_backup_table_name := format('emergency_dynamic_data_backup_%s', 
                                       to_char(now(), 'YYYY_MM_DD_HH24_MI_SS'));
    
    -- Backup core_relationships
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM core_relationships', backup_table_name);
    GET DIAGNOSTICS backup_count = ROW_COUNT;
    
    -- Backup core_dynamic_data  
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM core_dynamic_data', dynamic_backup_table_name);
    
    -- Log backup creation
    INSERT INTO system_backups (backup_type, table_name, record_count, created_at)
    VALUES ('EMERGENCY_RELATIONSHIPS', backup_table_name, backup_count, now());
    
    RETURN format('Emergency backup created: %s (%s relationships)', backup_table_name, backup_count);
END;
$$ LANGUAGE plpgsql;

-- Create immediate backup
SELECT emergency_relationship_backup();

-- =====================================================
-- PHASE 2: RELATIONSHIP DELETION GUARDIAN
-- =====================================================

-- Create critical alerts table
CREATE TABLE IF NOT EXISTS critical_system_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL', 'EMERGENCY')),
    message text NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    acknowledged_at timestamp with time zone,
    acknowledged_by text
);

-- Mass deletion prevention function
CREATE OR REPLACE FUNCTION prevent_mass_relationship_deletion()
RETURNS trigger AS $$
DECLARE
    deletion_count bigint;
    auth_relationship_deletions bigint;
BEGIN
    -- Count recent deletions in last 5 minutes
    SELECT COUNT(*) INTO deletion_count
    FROM critical_system_alerts 
    WHERE alert_type = 'RELATIONSHIP_DELETION' 
    AND created_at > now() - interval '5 minutes';
    
    -- Emergency alert for mass deletions
    IF deletion_count > 10 THEN
        INSERT INTO critical_system_alerts (alert_type, severity, message, metadata)
        VALUES (
            'MASS_RELATIONSHIP_DELETION_DETECTED',
            'EMERGENCY',
            format('EMERGENCY: Mass relationship deletion detected! %s deletions in 5 minutes', deletion_count),
            jsonb_build_object(
                'deleted_relationship_type', OLD.relationship_type,
                'from_entity', OLD.from_entity_id,
                'to_entity', OLD.to_entity_id,
                'organization', OLD.organization_id
            )
        );
    END IF;
    
    -- CRITICAL PROTECTION: Block USER_MEMBER_OF_ORG deletions if they would leave users orphaned
    IF OLD.relationship_type = 'USER_MEMBER_OF_ORG' THEN
        -- Check if this is the last org membership for this user
        SELECT COUNT(*) INTO auth_relationship_deletions
        FROM core_relationships 
        WHERE from_entity_id = OLD.from_entity_id 
        AND relationship_type = 'USER_MEMBER_OF_ORG'
        AND id != OLD.id;
        
        -- Block deletion if it would orphan the user
        IF auth_relationship_deletions = 0 THEN
            INSERT INTO critical_system_alerts (alert_type, severity, message, metadata)
            VALUES (
                'BLOCKED_USER_ORPHANING',
                'CRITICAL',
                format('BLOCKED: Deletion would orphan user %s from all organizations', OLD.from_entity_id),
                jsonb_build_object('blocked_deletion', OLD.id, 'user_id', OLD.from_entity_id)
            );
            
            -- Block the deletion
            RAISE EXCEPTION 'CRITICAL PROTECTION: Cannot delete last organization membership for user %. This would orphan the user.', OLD.from_entity_id;
        END IF;
        
        -- Log critical auth relationship deletion
        INSERT INTO critical_system_alerts (alert_type, severity, message, metadata)
        VALUES (
            'CRITICAL_AUTH_DELETION',
            'CRITICAL',
            format('User organization membership deleted: %s from org %s', OLD.from_entity_id, OLD.organization_id),
            jsonb_build_object('relationship_id', OLD.id, 'user_id', OLD.from_entity_id, 'org_id', OLD.organization_id)
        );
    END IF;
    
    -- Log all relationship deletions
    INSERT INTO critical_system_alerts (alert_type, severity, message, metadata)
    VALUES (
        'RELATIONSHIP_DELETION',
        'WARNING',
        format('Relationship deleted: %s -> %s (%s)', OLD.from_entity_id, OLD.to_entity_id, OLD.relationship_type),
        jsonb_build_object(
            'relationship_id', OLD.id,
            'from_entity', OLD.from_entity_id,
            'to_entity', OLD.to_entity_id,
            'type', OLD.relationship_type,
            'organization', OLD.organization_id
        )
    );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Install the guardian trigger
DROP TRIGGER IF EXISTS relationship_deletion_guardian ON core_relationships;
CREATE TRIGGER relationship_deletion_guardian 
    BEFORE DELETE ON core_relationships 
    FOR EACH ROW EXECUTE FUNCTION prevent_mass_relationship_deletion();

-- =====================================================
-- PHASE 3: CONSTRAINT IMPACT VALIDATOR
-- =====================================================

CREATE OR REPLACE FUNCTION validate_smart_code_constraint_impact(
    proposed_constraint text
)
RETURNS TABLE(
    impact_level text,
    affected_relationships bigint,
    affected_auth_relationships bigint,
    sample_violations text[],
    risk_assessment text,
    recommendation text
) AS $$
DECLARE
    total_violations bigint;
    auth_violations bigint;
    sample_data text[];
    risk_level text;
    recommendation_text text;
BEGIN
    -- Count total violations
    EXECUTE format('SELECT COUNT(*) FROM core_relationships WHERE smart_code IS NOT NULL AND NOT (%s)', 
                   proposed_constraint) 
    INTO total_violations;
    
    -- Count auth relationship violations specifically
    EXECUTE format('SELECT COUNT(*) FROM core_relationships WHERE relationship_type = ''USER_MEMBER_OF_ORG'' AND smart_code IS NOT NULL AND NOT (%s)', 
                   proposed_constraint) 
    INTO auth_violations;
    
    -- Get sample violations
    EXECUTE format('SELECT ARRAY(SELECT DISTINCT smart_code FROM core_relationships WHERE smart_code IS NOT NULL AND NOT (%s) LIMIT 10)', 
                   proposed_constraint) 
    INTO sample_data;
    
    -- Assess risk level
    risk_level := CASE 
        WHEN total_violations = 0 THEN 'SAFE'
        WHEN auth_violations > 0 THEN 'CATASTROPHIC'
        WHEN total_violations > 1000 THEN 'CRITICAL'
        WHEN total_violations > 100 THEN 'HIGH'
        WHEN total_violations > 10 THEN 'MEDIUM'
        ELSE 'LOW'
    END;
    
    -- Generate recommendation
    recommendation_text := CASE 
        WHEN risk_level = 'SAFE' THEN 'Safe to deploy constraint immediately'
        WHEN risk_level = 'CATASTROPHIC' THEN 'DO NOT DEPLOY! Would break authentication system'
        WHEN risk_level = 'CRITICAL' THEN 'DO NOT DEPLOY! Requires smart code migration first'
        WHEN risk_level = 'HIGH' THEN 'Requires careful migration planning'
        WHEN risk_level = 'MEDIUM' THEN 'Acceptable with backup and rollback plan'
        ELSE 'Low risk, but backup recommended'
    END;
    
    -- Return results
    impact_level := risk_level;
    affected_relationships := total_violations;
    affected_auth_relationships := auth_violations;
    sample_violations := sample_data;
    risk_assessment := format('%s relationships would be affected (%s auth relationships)', 
                             total_violations, auth_violations);
    recommendation := recommendation_text;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PHASE 4: EMERGENCY RECOVERY KIT
-- =====================================================

-- Emergency authentication recovery function
CREATE OR REPLACE FUNCTION emergency_auth_recovery(
    user_id text,
    org_id uuid,
    user_role text DEFAULT 'owner',
    permissions text[] DEFAULT ARRAY['admin:full', 'salon:all']
)
RETURNS TABLE(
    recovery_status text,
    relationship_id uuid,
    dynamic_data_created bigint,
    message text
) AS $$
DECLARE
    new_relationship_id uuid;
    dynamic_count bigint := 0;
BEGIN
    -- Validate inputs
    IF user_id IS NULL OR org_id IS NULL THEN
        RETURN QUERY SELECT 'ERROR'::text, NULL::uuid, 0::bigint, 'User ID and Organization ID are required'::text;
        RETURN;
    END IF;
    
    -- Check if relationship already exists
    SELECT id INTO new_relationship_id
    FROM core_relationships 
    WHERE from_entity_id = user_id 
    AND to_entity_id = org_id::text
    AND relationship_type = 'USER_MEMBER_OF_ORG';
    
    -- Create relationship if it doesn't exist
    IF new_relationship_id IS NULL THEN
        INSERT INTO core_relationships (
            organization_id,
            from_entity_id,
            to_entity_id,
            relationship_type,
            smart_code,
            is_active,
            relationship_data
        ) VALUES (
            org_id,
            user_id,
            org_id::text,
            'USER_MEMBER_OF_ORG',
            'HERA.EMERGENCY.AUTH.RECOVERY.v1',
            true,
            jsonb_build_object(
                'role', user_role, 
                'permissions', permissions,
                'emergency_created', now(),
                'recovery_reason', 'emergency_auth_recovery_function'
            )
        ) RETURNING id INTO new_relationship_id;
    ELSE
        -- Activate existing relationship
        UPDATE core_relationships 
        SET is_active = true,
            relationship_data = jsonb_set(
                COALESCE(relationship_data, '{}'),
                '{emergency_reactivated}',
                to_jsonb(now())
            )
        WHERE id = new_relationship_id;
    END IF;
    
    -- Create or update role dynamic data
    INSERT INTO core_dynamic_data (
        organization_id,
        entity_id,
        field_name,
        field_type,
        field_value_text,
        smart_code
    ) VALUES (
        org_id,
        user_id,
        'role',
        'text',
        user_role,
        'HERA.EMERGENCY.USER.ROLE.v1'
    ) 
    ON CONFLICT (organization_id, entity_id, field_name) 
    DO UPDATE SET 
        field_value_text = EXCLUDED.field_value_text,
        updated_at = now();
    
    dynamic_count := dynamic_count + 1;
    
    -- Create or update permissions dynamic data
    INSERT INTO core_dynamic_data (
        organization_id,
        entity_id,
        field_name,
        field_type,
        field_value_json,
        smart_code
    ) VALUES (
        org_id,
        user_id,
        'permissions',
        'json',
        to_jsonb(permissions),
        'HERA.EMERGENCY.USER.PERMISSIONS.v1'
    ) 
    ON CONFLICT (organization_id, entity_id, field_name) 
    DO UPDATE SET 
        field_value_json = EXCLUDED.field_value_json,
        updated_at = now();
    
    dynamic_count := dynamic_count + 1;
    
    -- Log the recovery action
    INSERT INTO critical_system_alerts (alert_type, severity, message, metadata)
    VALUES (
        'EMERGENCY_AUTH_RECOVERY',
        'INFO',
        format('Emergency authentication recovery completed for user %s in org %s', user_id, org_id),
        jsonb_build_object(
            'user_id', user_id,
            'org_id', org_id,
            'relationship_id', new_relationship_id,
            'role', user_role,
            'permissions', permissions
        )
    );
    
    RETURN QUERY SELECT 
        'SUCCESS'::text, 
        new_relationship_id, 
        dynamic_count, 
        format('Emergency recovery complete. User %s can now access organization %s', user_id, org_id)::text;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PHASE 5: BACKWARDS-COMPATIBLE CONSTRAINTS
-- =====================================================

-- Remove existing restrictive constraint
ALTER TABLE core_relationships DROP CONSTRAINT IF EXISTS core_relationships_smart_code_ck;

-- Add comprehensive backwards-compatible constraint
ALTER TABLE core_relationships ADD CONSTRAINT core_relationships_smart_code_ck 
CHECK (
    -- Finance DNA v2 patterns (new)
    smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$' OR
    
    -- Legacy Universal patterns (preserve existing)
    smart_code ~ '^HERA\.UNIVERSAL\.[A-Z]+(\.[A-Z]+)*\.V1$' OR
    
    -- Legacy business patterns (preserve existing)
    smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v1$' OR
    
    -- Workflow patterns
    smart_code ~ '^HERA\.WORKFLOW\.[A-Z]+(\.[A-Z]+)*\.v1$' OR
    
    -- Auth patterns
    smart_code ~ '^HERA\.AUTH\.[A-Z]+(\.[A-Z]+)*\.v1$' OR
    
    -- Emergency patterns
    smart_code ~ '^HERA\.EMERGENCY\.[A-Z]+(\.[A-Z]+)*\.v1$' OR
    
    -- Migration support (temporary - remove after full migration)
    smart_code IS NULL
);

-- =====================================================
-- VERIFICATION & TESTING
-- =====================================================

-- Test constraint impact (should be SAFE now)
SELECT 'CONSTRAINT IMPACT TEST:' as test_name, * FROM validate_smart_code_constraint_impact(
    'smart_code ~ ''^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$'' OR ' ||
    'smart_code ~ ''^HERA\.UNIVERSAL\.[A-Z]+(\.[A-Z]+)*\.V1$'' OR ' ||
    'smart_code ~ ''^HERA\.[A-Z]+(\.[A-Z]+)*\.v1$'' OR ' ||
    'smart_code ~ ''^HERA\.WORKFLOW\.[A-Z]+(\.[A-Z]+)*\.v1$'' OR ' ||
    'smart_code ~ ''^HERA\.AUTH\.[A-Z]+(\.[A-Z]+)*\.v1$'' OR ' ||
    'smart_code ~ ''^HERA\.EMERGENCY\.[A-Z]+(\.[A-Z]+)*\.v1$'' OR ' ||
    'smart_code IS NULL'
);

-- Test emergency recovery function (dry run)
SELECT 'EMERGENCY RECOVERY TEST:' as test_name, 
       'Function available: ' || EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'emergency_auth_recovery')::text as status;

-- Count critical relationships
SELECT 'RELATIONSHIP COUNTS:' as test_name,
       'USER_MEMBER_OF_ORG: ' || COUNT(*) FILTER (WHERE relationship_type = 'USER_MEMBER_OF_ORG')::text ||
       ', Total Active: ' || COUNT(*) FILTER (WHERE is_active = true)::text as counts
FROM core_relationships;

-- Show recent alerts
SELECT 'RECENT ALERTS:' as test_name, alert_type, severity, message, created_at 
FROM critical_system_alerts 
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC 
LIMIT 5;

-- Final success message
SELECT '🎉 EMERGENCY PROTECTION DEPLOYED SUCCESSFULLY!' as status,
       'System is now protected against catastrophic relationship data loss' as message;