-- =====================================================
-- HERA Migration: Standardize Legacy MEMBER_OF to HAS_ROLE Pattern
-- =====================================================
-- Purpose: Migrate users with only MEMBER_OF relationships to modern HAS_ROLE pattern
-- Goal: Eliminate dual code paths and simplify authorization logic
-- Safety: Idempotent, read-only analysis first, then migration
-- =====================================================

-- =====================================================
-- STEP 1: ANALYSIS - Find Legacy Users
-- =====================================================
-- Run this first to understand scope of migration

DO $$
DECLARE
  v_legacy_count int;
  v_modern_count int;
  v_mixed_count int;
  v_total_users int;
BEGIN
  -- Count users with only MEMBER_OF (legacy pattern)
  SELECT COUNT(DISTINCT cr.from_entity_id)
  INTO v_legacy_count
  FROM public.core_relationships cr
  WHERE cr.relationship_type = 'MEMBER_OF'
    AND COALESCE(cr.is_active, true)
    AND NOT EXISTS (
      SELECT 1 FROM public.core_relationships hr
      WHERE hr.relationship_type = 'HAS_ROLE'
        AND hr.from_entity_id = cr.from_entity_id
        AND hr.organization_id = cr.organization_id
        AND COALESCE(hr.is_active, true)
    );

  -- Count users with HAS_ROLE (modern pattern)
  SELECT COUNT(DISTINCT cr.from_entity_id)
  INTO v_modern_count
  FROM public.core_relationships cr
  WHERE cr.relationship_type = 'HAS_ROLE'
    AND COALESCE(cr.is_active, true);

  -- Count users with both (mixed state)
  SELECT COUNT(DISTINCT cr.from_entity_id)
  INTO v_mixed_count
  FROM public.core_relationships cr
  WHERE cr.relationship_type = 'MEMBER_OF'
    AND COALESCE(cr.is_active, true)
    AND EXISTS (
      SELECT 1 FROM public.core_relationships hr
      WHERE hr.relationship_type = 'HAS_ROLE'
        AND hr.from_entity_id = cr.from_entity_id
        AND COALESCE(hr.is_active, true)
    );

  -- Total unique users
  SELECT COUNT(DISTINCT from_entity_id)
  INTO v_total_users
  FROM public.core_relationships
  WHERE relationship_type IN ('MEMBER_OF', 'HAS_ROLE')
    AND COALESCE(is_active, true);

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'HERA Legacy User Analysis';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total Users: %', v_total_users;
  RAISE NOTICE 'Legacy (MEMBER_OF only): %', v_legacy_count;
  RAISE NOTICE 'Modern (HAS_ROLE): %', v_modern_count;
  RAISE NOTICE 'Mixed (Both patterns): %', v_mixed_count;
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migration will create % HAS_ROLE relationships', v_legacy_count;
  RAISE NOTICE '==============================================';
END $$;

-- =====================================================
-- STEP 2: DRY RUN - Preview Migration
-- =====================================================
-- Review what will be created (does NOT write data)

WITH legacy_memberships AS (
  -- Find all MEMBER_OF relationships without corresponding HAS_ROLE
  SELECT
    cr.id AS membership_id,
    cr.from_entity_id AS user_entity_id,
    cr.to_entity_id AS org_entity_id,
    cr.organization_id,
    cr.relationship_data->>'role' AS member_role,
    cr.created_by,
    cr.updated_by
  FROM public.core_relationships cr
  WHERE cr.relationship_type = 'MEMBER_OF'
    AND COALESCE(cr.is_active, true)
    AND (cr.relationship_data->>'role') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.core_relationships hr
      WHERE hr.relationship_type = 'HAS_ROLE'
        AND hr.from_entity_id = cr.from_entity_id
        AND hr.organization_id = cr.organization_id
        AND COALESCE(hr.is_active, true)
    )
),
normalized_roles AS (
  -- Normalize role strings to canonical role codes
  SELECT
    lm.*,
    CASE UPPER(REPLACE(TRIM(lm.member_role), ' ', '_'))
      WHEN 'OWNER'      THEN 'ORG_OWNER'
      WHEN 'ADMIN'      THEN 'ORG_ADMIN'
      WHEN 'MANAGER'    THEN 'ORG_MANAGER'
      WHEN 'ACCOUNTANT' THEN 'ORG_ACCOUNTANT'
      WHEN 'EMPLOYEE'   THEN 'ORG_EMPLOYEE'
      WHEN 'STAFF'      THEN 'ORG_EMPLOYEE'
      WHEN 'MEMBER'     THEN 'MEMBER'
      ELSE UPPER(REPLACE(TRIM(lm.member_role), ' ', '_'))  -- Custom roles
    END AS role_code
  FROM legacy_memberships lm
),
role_entities AS (
  -- Find or plan to create ROLE entities
  SELECT
    nr.organization_id,
    nr.role_code,
    re.id AS existing_role_entity_id
  FROM normalized_roles nr
  LEFT JOIN public.core_entities re
    ON re.organization_id = nr.organization_id
   AND re.entity_type = 'ROLE'
   AND re.entity_code = nr.role_code
  GROUP BY nr.organization_id, nr.role_code, re.id
)
SELECT
  nr.user_entity_id,
  nr.organization_id,
  nr.member_role AS original_role_string,
  nr.role_code AS normalized_role_code,
  CASE
    WHEN re.existing_role_entity_id IS NOT NULL THEN 'EXISTS'
    ELSE 'WILL_CREATE'
  END AS role_entity_status,
  re.existing_role_entity_id,
  'WILL_CREATE_HAS_ROLE' AS relationship_action
FROM normalized_roles nr
LEFT JOIN role_entities re
  ON re.organization_id = nr.organization_id
 AND re.role_code = nr.role_code
ORDER BY nr.organization_id, nr.role_code, nr.user_entity_id
LIMIT 100;

-- Review output to ensure correct normalization

-- =====================================================
-- STEP 3: MIGRATION FUNCTION
-- =====================================================
-- Safely migrate legacy users to HAS_ROLE pattern

DROP FUNCTION IF EXISTS public.hera_migrate_member_of_to_has_role_v1();

CREATE OR REPLACE FUNCTION public.hera_migrate_member_of_to_has_role_v1(
  p_dry_run boolean DEFAULT true,
  p_actor_user_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_entities_created int := 0;
  v_has_role_created int := 0;
  v_member_of_updated int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_role_entity_id uuid;
  v_role_code text;
  v_org_id uuid;
  v_user_id uuid;
  v_existing_role_id uuid;
  v_member_role text;
  rec RECORD;
BEGIN
  RAISE NOTICE 'Starting migration (dry_run=%)', p_dry_run;

  -- =====================================================
  -- Step 3a: Ensure ROLE Entities Exist
  -- =====================================================
  FOR rec IN
    WITH legacy_memberships AS (
      SELECT DISTINCT
        cr.organization_id,
        cr.relationship_data->>'role' AS member_role,
        CASE UPPER(REPLACE(TRIM(cr.relationship_data->>'role'), ' ', '_'))
          WHEN 'OWNER'      THEN 'ORG_OWNER'
          WHEN 'ADMIN'      THEN 'ORG_ADMIN'
          WHEN 'MANAGER'    THEN 'ORG_MANAGER'
          WHEN 'ACCOUNTANT' THEN 'ORG_ACCOUNTANT'
          WHEN 'EMPLOYEE'   THEN 'ORG_EMPLOYEE'
          WHEN 'STAFF'      THEN 'ORG_EMPLOYEE'
          WHEN 'MEMBER'     THEN 'MEMBER'
          ELSE UPPER(REPLACE(TRIM(cr.relationship_data->>'role'), ' ', '_'))
        END AS role_code
      FROM public.core_relationships cr
      WHERE cr.relationship_type = 'MEMBER_OF'
        AND COALESCE(cr.is_active, true)
        AND (cr.relationship_data->>'role') IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.core_relationships hr
          WHERE hr.relationship_type = 'HAS_ROLE'
            AND hr.from_entity_id = cr.from_entity_id
            AND hr.organization_id = cr.organization_id
            AND COALESCE(hr.is_active, true)
        )
    )
    SELECT
      lm.organization_id,
      lm.role_code,
      lm.member_role
    FROM legacy_memberships lm
    WHERE NOT EXISTS (
      SELECT 1 FROM public.core_entities re
      WHERE re.organization_id = lm.organization_id
        AND re.entity_type = 'ROLE'
        AND re.entity_code = lm.role_code
    )
  LOOP
    v_org_id := rec.organization_id;
    v_role_code := rec.role_code;
    v_member_role := rec.member_role;

    IF NOT p_dry_run THEN
      -- Create ROLE entity
      INSERT INTO public.core_entities (
        organization_id, entity_type, entity_name, entity_code,
        smart_code, smart_code_status, status, metadata,
        created_by, updated_by
      )
      VALUES (
        v_org_id,
        'ROLE',
        v_role_code,  -- Use normalized code as name
        v_role_code,
        'HERA.CORE.UNIVERSAL.ENTITY.ROLE.v1',
        'LIVE',
        'active',
        jsonb_build_object(
          'migrated_from', 'MEMBER_OF',
          'original_role_string', v_member_role
        ),
        p_actor_user_id,
        p_actor_user_id
      )
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_role_entity_id;

      IF v_role_entity_id IS NOT NULL THEN
        v_role_entities_created := v_role_entities_created + 1;
        RAISE NOTICE 'Created ROLE entity: org=%, code=%', v_org_id, v_role_code;
      END IF;
    ELSE
      RAISE NOTICE '[DRY RUN] Would create ROLE entity: org=%, code=%', v_org_id, v_role_code;
    END IF;
  END LOOP;

  -- =====================================================
  -- Step 3b: Create HAS_ROLE Relationships
  -- =====================================================
  FOR rec IN
    WITH legacy_memberships AS (
      SELECT
        cr.id AS membership_id,
        cr.from_entity_id AS user_entity_id,
        cr.organization_id,
        cr.relationship_data->>'role' AS member_role,
        CASE UPPER(REPLACE(TRIM(cr.relationship_data->>'role'), ' ', '_'))
          WHEN 'OWNER'      THEN 'ORG_OWNER'
          WHEN 'ADMIN'      THEN 'ORG_ADMIN'
          WHEN 'MANAGER'    THEN 'ORG_MANAGER'
          WHEN 'ACCOUNTANT' THEN 'ORG_ACCOUNTANT'
          WHEN 'EMPLOYEE'   THEN 'ORG_EMPLOYEE'
          WHEN 'STAFF'      THEN 'ORG_EMPLOYEE'
          WHEN 'MEMBER'     THEN 'MEMBER'
          ELSE UPPER(REPLACE(TRIM(cr.relationship_data->>'role'), ' ', '_'))
        END AS role_code,
        cr.created_by,
        cr.updated_by
      FROM public.core_relationships cr
      WHERE cr.relationship_type = 'MEMBER_OF'
        AND COALESCE(cr.is_active, true)
        AND (cr.relationship_data->>'role') IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.core_relationships hr
          WHERE hr.relationship_type = 'HAS_ROLE'
            AND hr.from_entity_id = cr.from_entity_id
            AND hr.organization_id = cr.organization_id
            AND COALESCE(hr.is_active, true)
        )
    )
    SELECT
      lm.user_entity_id,
      lm.organization_id,
      lm.role_code,
      lm.member_role,
      re.id AS role_entity_id,
      lm.created_by,
      lm.updated_by
    FROM legacy_memberships lm
    JOIN public.core_entities re
      ON re.organization_id = lm.organization_id
     AND re.entity_type = 'ROLE'
     AND re.entity_code = lm.role_code
  LOOP
    v_user_id := rec.user_entity_id;
    v_org_id := rec.organization_id;
    v_role_entity_id := rec.role_entity_id;
    v_role_code := rec.role_code;

    IF NOT p_dry_run THEN
      -- Create HAS_ROLE relationship (first role for user in org = primary)
      INSERT INTO public.core_relationships (
        organization_id,
        from_entity_id,
        to_entity_id,
        relationship_type,
        relationship_direction,
        relationship_data,
        smart_code,
        smart_code_status,
        is_active,
        created_by,
        updated_by
      )
      VALUES (
        v_org_id,
        v_user_id,
        v_role_entity_id,
        'HAS_ROLE',
        'forward',
        jsonb_build_object(
          'role_code', v_role_code,
          'is_primary', true,  -- First HAS_ROLE = primary
          'migrated_from', 'MEMBER_OF'
        ),
        'HERA.CORE.UNIVERSAL.REL.HAS_ROLE.v1',
        'LIVE',
        true,
        COALESCE(rec.created_by, p_actor_user_id),
        COALESCE(rec.updated_by, p_actor_user_id)
      )
      ON CONFLICT DO NOTHING;

      IF FOUND THEN
        v_has_role_created := v_has_role_created + 1;
        RAISE NOTICE 'Created HAS_ROLE: user=%, org=%, role=%', v_user_id, v_org_id, v_role_code;
      END IF;
    ELSE
      RAISE NOTICE '[DRY RUN] Would create HAS_ROLE: user=%, org=%, role=%', v_user_id, v_org_id, v_role_code;
      v_has_role_created := v_has_role_created + 1;  -- Count for dry run
    END IF;
  END LOOP;

  -- =====================================================
  -- Step 3c: Update MEMBER_OF to Add role_code (Keep Consistent)
  -- =====================================================
  IF NOT p_dry_run THEN
    WITH legacy_memberships AS (
      SELECT
        cr.id,
        CASE UPPER(REPLACE(TRIM(cr.relationship_data->>'role'), ' ', '_'))
          WHEN 'OWNER'      THEN 'ORG_OWNER'
          WHEN 'ADMIN'      THEN 'ORG_ADMIN'
          WHEN 'MANAGER'    THEN 'ORG_MANAGER'
          WHEN 'ACCOUNTANT' THEN 'ORG_ACCOUNTANT'
          WHEN 'EMPLOYEE'   THEN 'ORG_EMPLOYEE'
          WHEN 'STAFF'      THEN 'ORG_EMPLOYEE'
          WHEN 'MEMBER'     THEN 'MEMBER'
          ELSE UPPER(REPLACE(TRIM(cr.relationship_data->>'role'), ' ', '_'))
        END AS role_code
      FROM public.core_relationships cr
      WHERE cr.relationship_type = 'MEMBER_OF'
        AND COALESCE(cr.is_active, true)
        AND (cr.relationship_data->>'role') IS NOT NULL
        AND (cr.relationship_data->>'role_code') IS NULL  -- Not already migrated
    )
    UPDATE public.core_relationships cr
    SET relationship_data = cr.relationship_data || jsonb_build_object('role_code', lm.role_code),
        updated_by = p_actor_user_id,
        updated_at = now()
    FROM legacy_memberships lm
    WHERE cr.id = lm.id;

    GET DIAGNOSTICS v_member_of_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % MEMBER_OF relationships with role_code', v_member_of_updated;
  END IF;

  -- =====================================================
  -- Return Migration Summary
  -- =====================================================
  RETURN jsonb_build_object(
    'success', true,
    'dry_run', p_dry_run,
    'role_entities_created', v_role_entities_created,
    'has_role_relationships_created', v_has_role_created,
    'member_of_updated', v_member_of_updated,
    'errors', v_errors,
    'message', CASE
      WHEN p_dry_run THEN 'Dry run completed - no data modified'
      ELSE 'Migration completed successfully'
    END
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Migration failed: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'hint', 'Review logs and retry with dry_run=true'
    );
END;
$$;

COMMENT ON FUNCTION public.hera_migrate_member_of_to_has_role_v1(boolean, uuid)
  IS 'Migrates legacy MEMBER_OF-only users to modern HAS_ROLE pattern. Run with dry_run=true first to preview changes.';

GRANT EXECUTE ON FUNCTION public.hera_migrate_member_of_to_has_role_v1(boolean, uuid) TO service_role;

-- =====================================================
-- STEP 4: EXECUTE MIGRATION
-- =====================================================

-- 4a) DRY RUN - Review what will happen (SAFE)
SELECT hera_migrate_member_of_to_has_role_v1(
  p_dry_run => true,
  p_actor_user_id => '00000000-0000-0000-0000-000000000000'::uuid
);

-- Expected output:
-- {
--   "success": true,
--   "dry_run": true,
--   "role_entities_created": 12,
--   "has_role_relationships_created": 47,
--   "member_of_updated": 0,
--   "message": "Dry run completed - no data modified"
-- }

-- 4b) ACTUAL MIGRATION - Execute changes (REVIEW DRY RUN FIRST!)
-- UNCOMMENT AFTER REVIEWING DRY RUN OUTPUT:
-- SELECT hera_migrate_member_of_to_has_role_v1(
--   p_dry_run => false,
--   p_actor_user_id => '00000000-0000-0000-0000-000000000000'::uuid
-- );

-- =====================================================
-- STEP 5: VERIFICATION
-- =====================================================

-- 5a) Verify no legacy users remain
SELECT COUNT(DISTINCT cr.from_entity_id) AS remaining_legacy_users
FROM public.core_relationships cr
WHERE cr.relationship_type = 'MEMBER_OF'
  AND COALESCE(cr.is_active, true)
  AND NOT EXISTS (
    SELECT 1 FROM public.core_relationships hr
    WHERE hr.relationship_type = 'HAS_ROLE'
      AND hr.from_entity_id = cr.from_entity_id
      AND hr.organization_id = cr.organization_id
      AND COALESCE(hr.is_active, true)
  );
-- Expected: 0

-- 5b) Verify all migrated users have primary role set
SELECT COUNT(*)
FROM public.core_relationships
WHERE relationship_type = 'HAS_ROLE'
  AND relationship_data->>'migrated_from' = 'MEMBER_OF'
  AND relationship_data->>'is_primary' IS NULL;
-- Expected: 0 (all should have is_primary=true)

-- 5c) Spot check: Compare old MEMBER_OF role to new HAS_ROLE role_code
SELECT
  cr_m.from_entity_id AS user_id,
  cr_m.organization_id,
  cr_m.relationship_data->>'role' AS member_of_role,
  cr_m.relationship_data->>'role_code' AS member_of_role_code,
  cr_h.relationship_data->>'role_code' AS has_role_code,
  cr_h.relationship_data->>'is_primary' AS is_primary
FROM public.core_relationships cr_m
JOIN public.core_relationships cr_h
  ON cr_h.from_entity_id = cr_m.from_entity_id
 AND cr_h.organization_id = cr_m.organization_id
 AND cr_h.relationship_type = 'HAS_ROLE'
WHERE cr_m.relationship_type = 'MEMBER_OF'
  AND cr_m.relationship_data->>'migrated_from' IS NULL  -- Not a test record
LIMIT 10;
-- Verify: member_of_role_code = has_role_code

-- =====================================================
-- POST-MIGRATION: CLEANUP (OPTIONAL)
-- =====================================================
-- After migration is verified successful and system is stable,
-- you can optionally remove fallback code from _hera_resolve_org_role
-- and hera_auth_introspect_v1 to simplify codebase.

-- This is SAFE to defer - fallback code doesn't hurt performance
-- and provides safety net during transition period.
