-- Copy APP_DOMAIN entities from platform org to user org
-- Source CSV data in organization_id: 00000000-0000-0000-0000-000000000000  
-- Target organization_id: ff837c4c-95f2-43ac-a498-39597018b10c

INSERT INTO core_entities (
  organization_id,
  entity_type, 
  entity_name,
  entity_code,
  smart_code,
  entity_description,
  metadata,
  status,
  created_by,
  updated_by
)
SELECT 
  'ff837c4c-95f2-43ac-a498-39597018b10c' as organization_id,
  entity_type,
  entity_name, 
  entity_code,
  smart_code,
  entity_description,
  metadata,
  COALESCE(status, 'active') as status,
  '3770909b-5919-4eb1-a117-3b473db21f52' as created_by,
  '3770909b-5919-4eb1-a117-3b473db21f52' as updated_by
FROM core_entities 
WHERE entity_type = 'APP_DOMAIN'
  AND organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT (organization_id, entity_type, entity_code) DO UPDATE SET
  entity_name = EXCLUDED.entity_name,
  smart_code = EXCLUDED.smart_code,
  metadata = EXCLUDED.metadata,
  updated_by = EXCLUDED.updated_by,
  updated_at = NOW();

-- Verify the copied entities  
SELECT 
  entity_name,
  entity_code, 
  smart_code,
  metadata
FROM core_entities 
WHERE entity_type = 'APP_DOMAIN'
  AND organization_id = 'ff837c4c-95f2-43ac-a498-39597018b10c'
ORDER BY entity_name;