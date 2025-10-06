-- ================================================================================
-- MIGRATION: Standardize Entity Types to Uppercase
-- Smart Code: HERA.DB.MIGRATION.ENTITY_TYPE.UPPERCASE.V1
-- Date: 2025-10-06
-- Purpose: Enforce uppercase entity_type convention across all entities
-- ================================================================================

-- SAFETY: Run in transaction so we can rollback if needed
BEGIN;

-- Step 1: Show current entity type distribution (for logging)
SELECT
  entity_type,
  COUNT(*) as count,
  UPPER(entity_type) as standardized_type
FROM core_entities
GROUP BY entity_type
ORDER BY count DESC;

-- Step 2: Update all entity_type values to uppercase
UPDATE core_entities
SET entity_type = UPPER(entity_type)
WHERE entity_type != UPPER(entity_type);

-- Step 3: Verify the update
SELECT
  'After migration:' as status,
  entity_type,
  COUNT(*) as count
FROM core_entities
GROUP BY entity_type
ORDER BY count DESC;

-- Step 4: Add check constraint to enforce uppercase going forward
-- (Only if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'core_entities_entity_type_uppercase_ck'
  ) THEN
    ALTER TABLE core_entities
    ADD CONSTRAINT core_entities_entity_type_uppercase_ck
    CHECK (entity_type = UPPER(entity_type));

    RAISE NOTICE 'Added uppercase constraint for entity_type';
  ELSE
    RAISE NOTICE 'Uppercase constraint already exists';
  END IF;
END $$;

-- Step 5: Create index on entity_type if not exists (performance optimization)
CREATE INDEX IF NOT EXISTS idx_core_entities_entity_type
ON core_entities(entity_type);

-- Step 6: Log migration completion
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: All entity_types standardized to uppercase';
  RAISE NOTICE '✅ Constraint added: entity_type must be uppercase';
  RAISE NOTICE '✅ Index created: idx_core_entities_entity_type';
END $$;

-- COMMIT the transaction (comment out to test with ROLLBACK)
COMMIT;

-- ROLLBACK; -- Uncomment this line to test without actually applying changes
