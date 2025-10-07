-- HERA Enterprise Views
-- Smart Code: HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2
-- Only views prefixed with hera_ are allowed here.

-- Example approved view: summary of entities per type (RLS applies)
CREATE OR REPLACE VIEW hera_entities_summary AS
SELECT
  organization_id,
  entity_type,
  count(*) AS entity_count
FROM core_entities
GROUP BY organization_id, entity_type;

COMMENT ON VIEW hera_entities_summary IS 'HERA: summary count of entities by type (RLS-enforced)';

-- Manifest-driven views/MVs will be applied via apply.ts

