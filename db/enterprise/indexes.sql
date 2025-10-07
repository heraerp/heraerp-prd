-- HERA Enterprise Indexes (from manifest objects_indices)
-- Smart Code: HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2
-- Idempotent CREATE INDEX statements. Only hera_ or core_* tables permitted.

-- Example core indices hardening (safe, idempotent)
CREATE INDEX IF NOT EXISTS idx_core_entities_org_type_status ON core_entities(organization_id, entity_type, status);
CREATE INDEX IF NOT EXISTS idx_core_dynamic_data_org_field ON core_dynamic_data(organization_id, field_name);
CREATE INDEX IF NOT EXISTS idx_core_relationships_org_type ON core_relationships(organization_id, relationship_type);

-- Manifest-driven indices will be applied by scripts/manifest/apply.ts
-- The script will generate CREATE INDEX IF NOT EXISTS for each entry in objects_indices

