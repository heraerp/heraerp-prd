-- HERA Enterprise Triggers (only hera_ prefixed triggers)
-- Smart Code: HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2
-- Idempotent definitions ensuring guardrails without altering sacred schemas.

-- Enforce non-null organization_id on core tables via BEFORE INSERT/UPDATE trigger
CREATE OR REPLACE FUNCTION hera_enforce_org_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required';
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'hera_enforce_org_id_core_entities'
  ) THEN
    CREATE TRIGGER hera_enforce_org_id_core_entities
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW EXECUTE FUNCTION hera_enforce_org_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'hera_enforce_org_id_core_dynamic_data'
  ) THEN
    CREATE TRIGGER hera_enforce_org_id_core_dynamic_data
    BEFORE INSERT OR UPDATE ON core_dynamic_data
    FOR EACH ROW EXECUTE FUNCTION hera_enforce_org_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'hera_enforce_org_id_core_relationships'
  ) THEN
    CREATE TRIGGER hera_enforce_org_id_core_relationships
    BEFORE INSERT OR UPDATE ON core_relationships
    FOR EACH ROW EXECUTE FUNCTION hera_enforce_org_id();
  END IF;
END $$;

-- Manifest-driven hera_ triggers can be appended by apply.ts

