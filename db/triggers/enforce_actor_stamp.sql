-- HERA Finance DNA v2.2 - Actor Stamp Enforcement (Idempotent)
-- Ensures all Sacred Six writes include proper audit stamping

CREATE OR REPLACE FUNCTION enforce_actor_stamp() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.created_by IS NULL THEN
    RAISE EXCEPTION 'HERA_AUDIT_VIOLATION: created_by cannot be NULL (table: %, Architecture v2.2)', TG_TABLE_NAME;
  END IF;
  
  IF TG_OP = 'UPDATE' AND NEW.updated_by IS NULL THEN
    RAISE EXCEPTION 'HERA_AUDIT_VIOLATION: updated_by cannot be NULL (table: %, Architecture v2.2)', TG_TABLE_NAME;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all Sacred Six tables (idempotent)
DO $$
DECLARE 
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'core_organizations',
    'core_entities', 
    'core_dynamic_data',
    'core_relationships',
    'universal_transactions',
    'universal_transaction_lines'
  ]
  LOOP
    EXECUTE FORMAT($$
      DROP TRIGGER IF EXISTS trg_enforce_actor_stamp ON %I;
      CREATE TRIGGER trg_enforce_actor_stamp
      BEFORE INSERT OR UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION enforce_actor_stamp();
    $$, t, t);
  END LOOP;
END $$;

-- Add comment for documentation
COMMENT ON FUNCTION enforce_actor_stamp() IS 
'HERA Finance DNA v2.2: Enforces actor stamping on Sacred Six tables. 
Prevents NULL created_by/updated_by violations per Architecture v2.2 requirements.';

SELECT 'Actor stamp enforcement triggers applied to all Sacred Six tables' AS status;