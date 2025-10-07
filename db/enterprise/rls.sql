-- HERA Enterprise RLS
-- Smart Code: HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2
-- Enforce organization_id isolation on sacred tables with namespaced policies.

-- Enable RLS on sacred tables (idempotent)
ALTER TABLE IF EXISTS core_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS core_relationships ENABLE ROW LEVEL SECURITY;

-- Policy helpers: extract organization_id from JWT if present (Supabase)
-- Falls back to current_setting override if set by session
CREATE OR REPLACE FUNCTION hera_current_org_id()
RETURNS uuid
LANGUAGE sql
AS $$
  SELECT COALESCE(
    nullif(current_setting('app.organization_id', true), '')::uuid,
    NULLIF((auth.jwt() ->> 'organization_id')::text,'')::uuid
  )
$$;

COMMENT ON FUNCTION hera_current_org_id IS 'HERA helper: resolve organization_id from session or JWT';

-- core_organizations
DROP POLICY IF EXISTS hera_org_isolation_core_org_select ON core_organizations;
CREATE POLICY hera_org_isolation_core_org_select ON core_organizations
  FOR SELECT USING (id = hera_current_org_id());

DROP POLICY IF EXISTS hera_org_isolation_core_org_mod ON core_organizations;
CREATE POLICY hera_org_isolation_core_org_mod ON core_organizations
  FOR ALL USING (id = hera_current_org_id()) WITH CHECK (id = hera_current_org_id());

-- core_entities
DROP POLICY IF EXISTS hera_org_isolation_entities_select ON core_entities;
CREATE POLICY hera_org_isolation_entities_select ON core_entities
  FOR SELECT USING (organization_id = hera_current_org_id());

DROP POLICY IF EXISTS hera_org_isolation_entities_mod ON core_entities;
CREATE POLICY hera_org_isolation_entities_mod ON core_entities
  FOR ALL USING (organization_id = hera_current_org_id()) WITH CHECK (organization_id = hera_current_org_id());

-- core_dynamic_data
DROP POLICY IF EXISTS hera_org_isolation_dynamic_select ON core_dynamic_data;
CREATE POLICY hera_org_isolation_dynamic_select ON core_dynamic_data
  FOR SELECT USING (organization_id = hera_current_org_id());

DROP POLICY IF EXISTS hera_org_isolation_dynamic_mod ON core_dynamic_data;
CREATE POLICY hera_org_isolation_dynamic_mod ON core_dynamic_data
  FOR ALL USING (organization_id = hera_current_org_id()) WITH CHECK (organization_id = hera_current_org_id());

-- core_relationships
DROP POLICY IF EXISTS hera_org_isolation_relationships_select ON core_relationships;
CREATE POLICY hera_org_isolation_relationships_select ON core_relationships
  FOR SELECT USING (organization_id = hera_current_org_id());

DROP POLICY IF EXISTS hera_org_isolation_relationships_mod ON core_relationships;
CREATE POLICY hera_org_isolation_relationships_mod ON core_relationships
  FOR ALL USING (organization_id = hera_current_org_id()) WITH CHECK (organization_id = hera_current_org_id());

