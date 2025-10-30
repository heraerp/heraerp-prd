-- =====================================================
-- CLEANUP: Remove Duplicate MEMBER_OF Relationships
-- =====================================================
-- Issue: Users have duplicate MEMBER_OF relationships to the same organization
--        causing "more than one row returned by subquery" errors
-- Solution: Keep newest relationship, delete older duplicates
-- Date: 2025-10-30
-- =====================================================

-- STEP 1: Identify duplicates (for verification)
DO $$
DECLARE
  v_duplicate_count int;
BEGIN
  SELECT COUNT(*)
  INTO v_duplicate_count
  FROM (
    SELECT
      from_entity_id,
      to_entity_id,
      organization_id,
      relationship_type,
      COUNT(*) as count
    FROM core_relationships
    WHERE relationship_type = 'MEMBER_OF'
    GROUP BY from_entity_id, to_entity_id, organization_id, relationship_type
    HAVING COUNT(*) > 1
  ) duplicates;

  RAISE NOTICE '🔍 Found % users with duplicate MEMBER_OF relationships', v_duplicate_count;
END $$;

-- STEP 2: Show detailed duplicate information
SELECT
  from_entity_id,
  organization_id,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at DESC) as relationship_ids,
  array_agg(created_at ORDER BY created_at DESC) as created_dates
FROM core_relationships
WHERE relationship_type = 'MEMBER_OF'
GROUP BY from_entity_id, organization_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- STEP 3: Delete duplicates (keep newest for each user-org pair)
WITH duplicates AS (
  SELECT
    id,
    from_entity_id,
    organization_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY from_entity_id, organization_id
      ORDER BY created_at DESC  -- Keep newest
    ) as rn
  FROM core_relationships
  WHERE relationship_type = 'MEMBER_OF'
),
to_delete AS (
  SELECT
    id,
    from_entity_id,
    organization_id,
    created_at
  FROM duplicates
  WHERE rn > 1  -- Delete all but the newest
)
DELETE FROM core_relationships
WHERE id IN (SELECT id FROM to_delete)
RETURNING
  id,
  from_entity_id,
  organization_id,
  created_at,
  'DELETED' as action;

-- STEP 4: Verify cleanup
DO $$
DECLARE
  v_remaining_duplicates int;
BEGIN
  SELECT COUNT(*)
  INTO v_remaining_duplicates
  FROM (
    SELECT
      from_entity_id,
      organization_id,
      COUNT(*) as count
    FROM core_relationships
    WHERE relationship_type = 'MEMBER_OF'
    GROUP BY from_entity_id, organization_id
    HAVING COUNT(*) > 1
  ) remaining;

  IF v_remaining_duplicates = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All duplicate MEMBER_OF relationships cleaned up';
  ELSE
    RAISE WARNING '⚠️ WARNING: Still found % duplicate MEMBER_OF relationships', v_remaining_duplicates;
  END IF;
END $$;

-- STEP 5: Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_member_of_active
ON core_relationships (
  from_entity_id,
  organization_id,
  relationship_type
)
WHERE relationship_type = 'MEMBER_OF'
  AND COALESCE(is_active, true);

COMMENT ON INDEX idx_unique_member_of_active IS
  'Prevents duplicate active MEMBER_OF relationships for same user-org pair.
   Enforces one active membership per user per organization.
   Created: 2025-10-30 to fix auth introspection bug.';

-- STEP 6: Final verification query
SELECT
  'Total MEMBER_OF relationships' as metric,
  COUNT(*) as count
FROM core_relationships
WHERE relationship_type = 'MEMBER_OF'

UNION ALL

SELECT
  'Unique user-org pairs' as metric,
  COUNT(DISTINCT (from_entity_id, organization_id)) as count
FROM core_relationships
WHERE relationship_type = 'MEMBER_OF'

UNION ALL

SELECT
  'Users with duplicates' as metric,
  COUNT(*) as count
FROM (
  SELECT from_entity_id
  FROM core_relationships
  WHERE relationship_type = 'MEMBER_OF'
  GROUP BY from_entity_id, organization_id
  HAVING COUNT(*) > 1
) dups;

-- =====================================================
-- ROLLBACK PLAN (if needed)
-- =====================================================
-- To remove the unique constraint if it causes issues:
-- DROP INDEX IF EXISTS idx_unique_member_of_active;
--
-- Note: Cannot rollback deleted relationships
-- Ensure backup before running this cleanup!
-- =====================================================

RAISE NOTICE '✅ Cleanup complete! Run test: SELECT hera_auth_introspect_v1(''your-user-id'')';
