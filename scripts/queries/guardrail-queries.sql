-- HERA Guardrail SQL Queries
-- Organization ID: 30cbd9d1-7610-4e6a-9694-ea259dc6b23a

-- 1) Smart-code format & uniqueness within each table
SELECT 
  'core_entities' as table_name,
  smart_code, 
  COUNT(*) as duplicate_count 
FROM core_entities
WHERE organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
GROUP BY smart_code 
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'core_dynamic_data' as table_name,
  smart_code, 
  COUNT(*) as duplicate_count 
FROM core_dynamic_data
WHERE organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
GROUP BY smart_code 
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'core_relationships' as table_name,
  smart_code, 
  COUNT(*) as duplicate_count 
FROM core_relationships
WHERE organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
GROUP BY smart_code 
HAVING COUNT(*) > 1;

-- 2) Cross-table smart_code collisions (should be controlled)
WITH all_smart_codes AS (
  SELECT smart_code, 'core_entities' as source_table 
  FROM core_entities 
  WHERE organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
  
  UNION ALL
  
  SELECT smart_code, 'core_dynamic_data' as source_table 
  FROM core_dynamic_data 
  WHERE organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
  
  UNION ALL
  
  SELECT smart_code, 'core_relationships' as source_table 
  FROM core_relationships 
  WHERE organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
)
SELECT 
  smart_code, 
  COUNT(DISTINCT source_table) as table_count,
  STRING_AGG(DISTINCT source_table, ', ') as found_in_tables
FROM all_smart_codes 
GROUP BY smart_code 
HAVING COUNT(DISTINCT source_table) > 1;

-- 3) Orphan dynamic data (entity_id references missing entity)
SELECT 
  dd.id as dynamic_data_id,
  dd.entity_id as missing_entity_id,
  dd.field_name,
  dd.smart_code
FROM core_dynamic_data dd
LEFT JOIN core_entities e ON e.id = dd.entity_id
WHERE dd.organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
  AND e.id IS NULL;

-- 4) Orphan relationships (from/to entity references missing)
SELECT 
  r.id as relationship_id,
  r.relationship_type,
  r.smart_code,
  CASE WHEN e_from.id IS NULL THEN r.from_entity_id END as missing_from_entity,
  CASE WHEN e_to.id IS NULL THEN r.to_entity_id END as missing_to_entity
FROM core_relationships r
LEFT JOIN core_entities e_from ON e_from.id = r.from_entity_id
LEFT JOIN core_entities e_to ON e_to.id = r.to_entity_id
WHERE r.organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
  AND (e_from.id IS NULL OR e_to.id IS NULL);

-- 5) Duplicate relationships (same from/to/type combination)
SELECT 
  from_entity_id, 
  to_entity_id, 
  relationship_type, 
  COUNT(*) as duplicate_count,
  STRING_AGG(smart_code, ', ') as smart_codes
FROM core_relationships
WHERE organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
GROUP BY from_entity_id, to_entity_id, relationship_type
HAVING COUNT(*) > 1;

-- 6) Services missing price in AED
WITH services AS (
  SELECT id, entity_code, entity_name
  FROM core_entities
  WHERE organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
    AND entity_type = 'service'
),
price_list_items AS (
  SELECT 
    dd.entity_id,
    jsonb_array_elements(dd.field_value_json) as item
  FROM core_dynamic_data dd
  WHERE dd.organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
    AND dd.field_name = 'ITEM_IN_PRICE_LIST'
)
SELECT 
  s.entity_code,
  s.entity_name,
  'Missing AED price' as issue
FROM services s
WHERE NOT EXISTS (
  SELECT 1 
  FROM price_list_items pl
  WHERE (pl.item->>'entity_code') = s.entity_code
    AND (pl.item->>'currency') = 'AED'
);

-- 7) Numeric fields stored as text (data type validation)
SELECT 
  entity_id,
  field_name,
  field_value_text as text_value,
  'Should be numeric' as issue
FROM core_dynamic_data
WHERE organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
  AND field_name IN ('service_base_fee', 'service_duration_min', 'reorder_level', 'product_reorder_level')
  AND field_value_number IS NULL
  AND field_value_text IS NOT NULL;

-- 8) Negative values check
SELECT 
  entity_id,
  field_name,
  field_value_number,
  'Negative value' as issue
FROM core_dynamic_data
WHERE organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
  AND field_value_number < 0;

-- 9) Cross-organization relationship check
SELECT 
  r.id as relationship_id,
  r.organization_id as rel_org,
  e_from.organization_id as from_org,
  e_to.organization_id as to_org,
  'Cross-org relationship' as issue
FROM core_relationships r
JOIN core_entities e_from ON e_from.id = r.from_entity_id
JOIN core_entities e_to ON e_to.id = r.to_entity_id
WHERE r.organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
  AND (
    e_from.organization_id != r.organization_id 
    OR e_to.organization_id != r.organization_id
  );

-- 10) Policy coverage report for services
WITH services AS (
  SELECT id, entity_code, entity_name
  FROM core_entities
  WHERE organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
    AND entity_type = 'service'
),
service_policies AS (
  SELECT 
    s.entity_code,
    s.entity_name,
    MAX(CASE WHEN dd.field_name = 'service_duration_min' THEN 1 ELSE 0 END) as has_duration,
    MAX(CASE WHEN dd.field_name = 'service_base_fee' THEN 1 ELSE 0 END) as has_base_fee
  FROM services s
  LEFT JOIN core_dynamic_data dd ON dd.entity_id = s.id 
    AND dd.organization_id = '30cbd9d1-7610-4e6a-9694-ea259dc6b23a'
  GROUP BY s.entity_code, s.entity_name
)
SELECT 
  entity_code,
  entity_name,
  CASE 
    WHEN has_duration = 0 AND has_base_fee = 0 THEN 'Missing duration and base fee'
    WHEN has_duration = 0 THEN 'Missing duration'
    WHEN has_base_fee = 0 THEN 'Missing base fee'
    ELSE 'Complete'
  END as policy_status
FROM service_policies
WHERE has_duration = 0 OR has_base_fee = 0;