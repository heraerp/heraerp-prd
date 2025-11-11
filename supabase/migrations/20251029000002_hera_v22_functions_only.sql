-- HERA v2.2 Database Functions Implementation (Functions Only)
-- Smart Code: HERA.DB.MIGRATIONS.V22.FUNCTIONS.SAFE.v1
-- 
-- Creates essential v1 runtime functions for HERA v2.2 compliance
-- Safe deployment - functions only, no constraints that might break existing data

-- =============================================================================
-- Step 1: Actor Resolution Function (v1)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.resolve_user_identity_v1(p_auth_uid uuid DEFAULT auth.uid())
RETURNS TABLE (
  user_entity_id uuid,
  email text,
  memberships jsonb,
  metadata jsonb
) AS $$
DECLARE 
  v_auth_uid uuid;
  v_user_entity_id uuid;
BEGIN
  -- Use provided UUID or fallback to auth.uid()
  v_auth_uid := COALESCE(p_auth_uid, auth.uid());
  
  IF v_auth_uid IS NULL THEN 
    RAISE EXCEPTION 'No authenticated user provided';
  END IF;

  -- Find USER entity by provider_uid in metadata
  SELECT ce.id INTO v_user_entity_id 
  FROM public.core_entities ce
  WHERE ce.entity_type = 'USER' 
    AND ce.metadata->>'provider_uid' = v_auth_uid::text 
    AND ce.status = 'active' 
  LIMIT 1;

  IF v_user_entity_id IS NULL THEN 
    RAISE EXCEPTION 'No USER entity found for auth.uid %', v_auth_uid;
  END IF;

  -- Return user identity with memberships
  RETURN QUERY
  SELECT 
    v_user_entity_id,
    au.email,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'organization_id', cr.target_entity_id,
          'organization_name', co.entity_name,
          'role', cr.relationship_data->>'role',
          'is_active', cr.is_active,
          'joined_at', cr.effective_date,
          'membership_type', cr.relationship_type
        ) ORDER BY cr.created_at DESC
      ) FILTER (WHERE cr.id IS NOT NULL), 
      '[]'::jsonb
    ) as memberships,
    jsonb_build_object(
      'user_entity_id', v_user_entity_id,
      'auth_uid', v_auth_uid,
      'resolved_at', NOW(),
      'function_version', 'v1',
      'cache_key', 'actor:' || left(v_auth_uid::text, 8)
    ) as metadata
  FROM auth.users au
  LEFT JOIN public.core_relationships cr ON (
    cr.source_entity_id = v_user_entity_id 
    AND cr.relationship_type = 'MEMBER_OF'
    AND cr.is_active = true
    AND (cr.expiration_date IS NULL OR cr.expiration_date > NOW())
  )
  LEFT JOIN public.core_entities co ON (
    co.id = cr.target_entity_id 
    AND co.entity_type = 'ORGANIZATION' 
    AND co.status = 'active'
  )
  WHERE au.id = v_auth_uid
  GROUP BY au.email;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.resolve_user_identity_v1(uuid) TO authenticated;

-- =============================================================================
-- Step 2: Smart Code Validation Function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_smart_code(p_smart_code text)
RETURNS boolean AS $$
DECLARE
  -- HERA DNA Smart Code Regex Pattern (v2.2 standard)
  v_pattern text := '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$';
  v_parts text[];
BEGIN
  -- Null check
  IF p_smart_code IS NULL OR length(trim(p_smart_code)) = 0 THEN 
    RETURN FALSE; 
  END IF;

  -- Basic regex pattern validation
  IF NOT (p_smart_code ~ v_pattern) THEN 
    RETURN FALSE; 
  END IF;

  -- Additional structural validation
  v_parts := string_to_array(p_smart_code, '.');
  
  -- Must start with HERA
  IF v_parts[1] != 'HERA' THEN 
    RETURN FALSE; 
  END IF;
  
  -- Must end with version (v1, v2, etc.)
  IF NOT (v_parts[array_length(v_parts, 1)] ~ '^v[0-9]+$') THEN 
    RETURN FALSE; 
  END IF;
  
  -- Must have proper segment count (4-10 segments total)
  IF array_length(v_parts, 1) < 4 OR array_length(v_parts, 1) > 10 THEN 
    RETURN FALSE; 
  END IF;

  -- All validations passed
  RETURN TRUE;
  
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Grant execution to all authenticated users
GRANT EXECUTE ON FUNCTION public.validate_smart_code(text) TO authenticated;

-- =============================================================================
-- Step 3: Enhanced Audit Function (v1 WARN mode + v2 ENFORCE ready)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_audit_fields()
RETURNS TRIGGER AS $$
DECLARE
  v_runtime_mode text;
BEGIN
  -- Get runtime mode from environment or default to 'warn'
  v_runtime_mode := current_setting('app.hera_guardrails_mode', true);
  v_runtime_mode := COALESCE(v_runtime_mode, 'warn');

  IF TG_OP = 'INSERT' THEN
    NEW.created_at = COALESCE(NEW.created_at, NOW());
    NEW.updated_at = NEW.created_at;
    NEW.version = COALESCE(NEW.version, 1);
    
    -- Handle created_by based on runtime mode
    IF NEW.created_by IS NULL THEN
      IF v_runtime_mode = 'enforce' THEN
        RAISE EXCEPTION 'created_by cannot be NULL (HERA v2.2 ENFORCE mode)';
      ELSE
        -- v1 WARN mode - log warning but allow
        RAISE NOTICE 'HERA v2.2 WARN: created_by was NULL on table %, id=% (v1 runtime)', TG_TABLE_NAME, NEW.id;
      END IF;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at = NOW();
    NEW.version = COALESCE(OLD.version, 0) + 1;
    
    -- Handle updated_by based on runtime mode
    IF NEW.updated_by IS NULL THEN
      IF v_runtime_mode = 'enforce' THEN
        RAISE EXCEPTION 'updated_by cannot be NULL (HERA v2.2 ENFORCE mode)';
      ELSE
        -- v1 WARN mode - log warning but allow
        RAISE NOTICE 'HERA v2.2 WARN: updated_by was NULL on table %, id=% (v1 runtime)', TG_TABLE_NAME, NEW.id;
      END IF;
    END IF;
    
    -- Preserve created_at and created_by
    NEW.created_at = OLD.created_at;
    NEW.created_by = OLD.created_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Step 4: Runtime Configuration Helper Functions
-- =============================================================================

-- Function to check HERA runtime configuration
CREATE OR REPLACE FUNCTION public.hera_runtime_status()
RETURNS jsonb AS $$
DECLARE
  v_config jsonb;
BEGIN
  v_config := jsonb_build_object(
    'runtime_version', 'v1',
    'api_version', 'v2',
    'guardrails_mode', current_setting('app.hera_guardrails_mode', true),
    'database_functions', jsonb_build_object(
      'resolve_user_identity_v1', 'available',
      'validate_smart_code', 'available',
      'set_audit_fields', 'available'
    ),
    'constraints', jsonb_build_object(
      'smart_code_validation', 'functions_only',
      'gl_side_checking', 'functions_only'
    ),
    'migration_ready', true,
    'deployment_safe', true,
    'checked_at', NOW()
  );
  
  RETURN v_config;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.hera_runtime_status() TO authenticated;

-- =============================================================================
-- Migration Summary
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '🎯 HERA v2.2 Database Functions Migration Complete! (Safe Mode)';
  RAISE NOTICE '   ✅ Created resolve_user_identity_v1() with caching metadata';
  RAISE NOTICE '   ✅ Created validate_smart_code() with HERA DNA validation';
  RAISE NOTICE '   ✅ Enhanced audit function with v1 WARN / v2 ENFORCE modes';
  RAISE NOTICE '   ✅ Added runtime status helper function';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Safe Deployment:';
  RAISE NOTICE '   • Functions deployed without constraints (production safe)';
  RAISE NOTICE '   • Existing data not modified';
  RAISE NOTICE '   • Constraints can be added later if needed';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Testing:';
  RAISE NOTICE '   1. Test actor resolution: SELECT * FROM resolve_user_identity_v1();';
  RAISE NOTICE '   2. Test smart code validation: SELECT validate_smart_code(''HERA.TEST.CODE.v1'');';
  RAISE NOTICE '   3. Check runtime status: SELECT hera_runtime_status();';
  RAISE NOTICE '';
  RAISE NOTICE '🛡️ Migration to v2: Update HERA config RPC_VERSION to ''v2''';
END $$;