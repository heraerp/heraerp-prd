-- ============================================================================
-- HERA Salon Services - Branch Availability Backfill (SQL)
-- ============================================================================
-- Purpose: Bulk link all existing services to all branches using AVAILABLE_AT
--          relationship for multi-location service filtering.
--
-- Smart Code: HERA.SALON.SERVICE.REL.AVAILABLE_AT.V1
--
-- Usage:
--   1. Replace <ORGANIZATION_ID> with your actual organization UUID
--   2. Run this script in Supabase SQL Editor or via psql
--
-- What it does:
--   - Creates AVAILABLE_AT relationships for every (service, branch) pair
--   - Skips pairs that already have relationships (idempotent)
--   - Uses NOT EXISTS to prevent duplicates
--
-- Prerequisites:
--   - Services exist in core_entities with entity_type = 'service'
--   - Branches exist in core_entities with entity_type = 'branch'
--   - Both services and branches belong to the same organization
-- ============================================================================

-- Step 1: Set your organization ID here
-- IMPORTANT: Replace this with your actual organization UUID
DO $$
DECLARE
  v_organization_id UUID := '<ORGANIZATION_ID>'; -- ⚠️ REPLACE THIS
  v_services_count INT;
  v_branches_count INT;
  v_total_pairs INT;
  v_existing_pairs INT;
  v_created_pairs INT;
BEGIN
  -- Validate organization ID
  IF v_organization_id = '<ORGANIZATION_ID>' THEN
    RAISE EXCEPTION 'Please replace <ORGANIZATION_ID> with your actual organization UUID';
  END IF;

  -- Check if organization exists
  IF NOT EXISTS (SELECT 1 FROM core_organizations WHERE id = v_organization_id) THEN
    RAISE EXCEPTION 'Organization % not found', v_organization_id;
  END IF;

  -- Count services and branches
  SELECT COUNT(*) INTO v_services_count
  FROM core_entities
  WHERE organization_id = v_organization_id
    AND entity_type = 'service'
    AND status != 'deleted';

  SELECT COUNT(*) INTO v_branches_count
  FROM core_entities
  WHERE organization_id = v_organization_id
    AND entity_type = 'branch'
    AND status != 'deleted';

  v_total_pairs := v_services_count * v_branches_count;

  -- Display current state
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'HERA Salon Services - Branch Availability Backfill';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Organization ID: %', v_organization_id;
  RAISE NOTICE 'Services found: %', v_services_count;
  RAISE NOTICE 'Branches found: %', v_branches_count;
  RAISE NOTICE 'Total pairs to process: %', v_total_pairs;
  RAISE NOTICE '';

  IF v_services_count = 0 THEN
    RAISE NOTICE '⚠️  No services found. Nothing to backfill.';
    RETURN;
  END IF;

  IF v_branches_count = 0 THEN
    RAISE NOTICE '⚠️  No branches found. Nothing to backfill.';
    RETURN;
  END IF;

  -- Count existing relationships
  SELECT COUNT(*) INTO v_existing_pairs
  FROM core_relationships r
  WHERE r.organization_id = v_organization_id
    AND r.relationship_type = 'AVAILABLE_AT'
    AND EXISTS (
      SELECT 1 FROM core_entities s
      WHERE s.id = r.from_entity_id
        AND s.entity_type = 'service'
        AND s.organization_id = v_organization_id
    )
    AND EXISTS (
      SELECT 1 FROM core_entities b
      WHERE b.id = r.to_entity_id
        AND b.entity_type = 'branch'
        AND b.organization_id = v_organization_id
    );

  RAISE NOTICE 'Existing relationships: %', v_existing_pairs;
  RAISE NOTICE 'Pairs to create: %', v_total_pairs - v_existing_pairs;
  RAISE NOTICE '';

  IF v_existing_pairs = v_total_pairs THEN
    RAISE NOTICE '✅ All relationships already exist. Nothing to create.';
    RETURN;
  END IF;

  -- Create relationships for all (service, branch) pairs that don't exist
  RAISE NOTICE '🔄 Creating relationships...';

  INSERT INTO core_relationships (
    organization_id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    relationship_direction,
    smart_code,
    is_active,
    created_at,
    updated_at
  )
  SELECT
    v_organization_id,
    s.id AS from_entity_id,
    b.id AS to_entity_id,
    'AVAILABLE_AT' AS relationship_type,
    'FORWARD' AS relationship_direction,
    'HERA.SALON.SERVICE.REL.AVAILABLE_AT.V1' AS smart_code,
    true AS is_active,
    NOW() AS created_at,
    NOW() AS updated_at
  FROM
    core_entities s
  CROSS JOIN
    core_entities b
  WHERE
    s.organization_id = v_organization_id
    AND s.entity_type = 'service'
    AND s.status != 'deleted'
    AND b.organization_id = v_organization_id
    AND b.entity_type = 'branch'
    AND b.status != 'deleted'
    -- Only insert if relationship doesn't already exist (idempotent)
    AND NOT EXISTS (
      SELECT 1
      FROM core_relationships r
      WHERE r.organization_id = v_organization_id
        AND r.from_entity_id = s.id
        AND r.to_entity_id = b.id
        AND r.relationship_type = 'AVAILABLE_AT'
    );

  GET DIAGNOSTICS v_created_pairs = ROW_COUNT;

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ Backfill Complete';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Total Services:     %', v_services_count;
  RAISE NOTICE 'Total Branches:     %', v_branches_count;
  RAISE NOTICE 'Total Pairs:        %', v_total_pairs;
  RAISE NOTICE 'Created:            %', v_created_pairs;
  RAISE NOTICE 'Skipped (exists):   %', v_existing_pairs;
  RAISE NOTICE '============================================================';

END $$;

-- ============================================================================
-- Verification Query (Optional)
-- Run this after the backfill to verify the relationships were created
-- ============================================================================

-- Uncomment and run this query to verify:
/*
SELECT
  s.entity_name AS service_name,
  s.entity_code AS service_code,
  b.entity_name AS branch_name,
  b.entity_code AS branch_code,
  r.smart_code,
  r.created_at
FROM
  core_relationships r
  INNER JOIN core_entities s ON r.from_entity_id = s.id
  INNER JOIN core_entities b ON r.to_entity_id = b.id
WHERE
  r.organization_id = '<ORGANIZATION_ID>' -- Replace with your UUID
  AND r.relationship_type = 'AVAILABLE_AT'
  AND s.entity_type = 'service'
  AND b.entity_type = 'branch'
ORDER BY
  s.entity_name,
  b.entity_name;
*/

-- ============================================================================
-- Cleanup Query (Optional - Use with EXTREME CAUTION)
-- Only run this if you need to remove all AVAILABLE_AT relationships
-- ============================================================================

-- DANGER: Uncomment only if you really want to delete all relationships
/*
DELETE FROM core_relationships
WHERE organization_id = '<ORGANIZATION_ID>' -- Replace with your UUID
  AND relationship_type = 'AVAILABLE_AT'
  AND EXISTS (
    SELECT 1 FROM core_entities s
    WHERE s.id = from_entity_id AND s.entity_type = 'service'
  )
  AND EXISTS (
    SELECT 1 FROM core_entities b
    WHERE b.id = to_entity_id AND b.entity_type = 'branch'
  );
*/
