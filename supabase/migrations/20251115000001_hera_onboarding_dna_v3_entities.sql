-- HERA Onboarding DNA v3.0 - Entity Types and Functions
-- ======================================================
-- Creates entity types for comprehensive onboarding project management
-- Fully compliant with Sacred Six architecture and actor-based security

-- Entity Type Definitions (in Platform Organization)
INSERT INTO core_entities (
  id,
  organization_id,
  entity_type,
  entity_code, 
  entity_name,
  smart_code,
  entity_description,
  status,
  created_by,
  updated_by,
  created_at,
  updated_at
) VALUES 
-- Onboarding Project Entity Type
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- Platform organization
  'ENTITY_TYPE_DEFINITION',
  'ONBOARDING_PROJECT',
  'Onboarding Project',
  'HERA.PLATFORM.ENTITY_TYPE.ONBOARDING_PROJECT.v1',
  'Root entity for tracking customer onboarding implementation projects with phases, checkpoints, and rollback capabilities',
  'active',
  '00000000-0000-0000-0000-000000000000', -- System user
  '00000000-0000-0000-0000-000000000000',
  now(),
  now()
),
-- Onboarding Checkpoint Entity Type  
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'ENTITY_TYPE_DEFINITION', 
  'ONBOARDING_CHECKPOINT',
  'Onboarding Checkpoint',
  'HERA.PLATFORM.ENTITY_TYPE.ONBOARDING_CHECKPOINT.v1',
  'Validation milestone in onboarding process with entry/exit gate criteria and rollback snapshots',
  'active',
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  now(),
  now()
),
-- Onboarding Phase Entity Type
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'ENTITY_TYPE_DEFINITION',
  'ONBOARDING_PHASE', 
  'Onboarding Phase',
  'HERA.PLATFORM.ENTITY_TYPE.ONBOARDING_PHASE.v1',
  'Sequential workflow state in onboarding process (shadow mode, dual entry, pilot users, cutover)',
  'active',
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  now(),
  now()
),
-- AI Onboarding Policy Entity Type
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'ENTITY_TYPE_DEFINITION',
  'AI_ONBOARDING_POLICY',
  'AI Onboarding Policy', 
  'HERA.PLATFORM.ENTITY_TYPE.AI_ONBOARDING_POLICY.v1',
  'Organization-level controls for AI auto-actions during onboarding with risk level thresholds',
  'active',
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  now(),
  now()
),
-- AI Action Proposal Entity Type
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'ENTITY_TYPE_DEFINITION',
  'AI_ONBOARDING_ACTION_PROPOSAL',
  'AI Onboarding Action Proposal',
  'HERA.PLATFORM.ENTITY_TYPE.AI_ONBOARDING_ACTION_PROPOSAL.v1', 
  'AI-proposed automatic fixes during onboarding with risk assessment and approval workflow',
  'active',
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  now(),
  now()
),
-- Onboarding KPI Definition Entity Type
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'ENTITY_TYPE_DEFINITION',
  'ONBOARDING_KPI_DEFINITION',
  'Onboarding KPI Definition',
  'HERA.PLATFORM.ENTITY_TYPE.ONBOARDING_KPI_DEFINITION.v1',
  'Platform-level definition of onboarding metrics with formulas and industry baselines',
  'active',
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  now(),
  now()
),
-- Onboarding KPI Snapshot Entity Type
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'ENTITY_TYPE_DEFINITION',
  'ONBOARDING_KPI_SNAPSHOT',
  'Onboarding KPI Snapshot',
  'HERA.PLATFORM.ENTITY_TYPE.ONBOARDING_KPI_SNAPSHOT.v1',
  'Point-in-time measurement of onboarding KPIs for a specific project with status and variance tracking',
  'active',
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000000',
  now(),
  now()
)
ON CONFLICT (organization_id, entity_code) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE core_entities IS 'HERA Sacred Six architecture. Added onboarding entity types for DNA v3.0 project management system without breaking existing schema.';

-- Create indexes for performance on new entity types
CREATE INDEX IF NOT EXISTS idx_core_entities_onboarding_project 
ON core_entities(organization_id, entity_type) 
WHERE entity_type = 'ONBOARDING_PROJECT';

CREATE INDEX IF NOT EXISTS idx_core_entities_onboarding_checkpoint
ON core_entities(organization_id, entity_type)
WHERE entity_type = 'ONBOARDING_CHECKPOINT';

CREATE INDEX IF NOT EXISTS idx_core_entities_onboarding_phase
ON core_entities(organization_id, entity_type) 
WHERE entity_type = 'ONBOARDING_PHASE';

-- Smart code pattern validation for onboarding namespace
ALTER TABLE core_entities DROP CONSTRAINT IF EXISTS core_entities_smart_code_check;
ALTER TABLE core_entities ADD CONSTRAINT core_entities_smart_code_check 
CHECK (
  smart_code ~* '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
  OR smart_code ~* '^HERA\.ONBOARDING\.[A-Z0-9_]{3,30}(?:\.[A-Z0-9_]{2,30}){2,6}\.v[0-9]+$'
);