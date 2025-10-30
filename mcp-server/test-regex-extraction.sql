-- Test REGEXP_REPLACE extraction for SALON app smart code
SELECT
  entity_code,
  smart_code,
  -- Test the extraction pattern
  REGEXP_REPLACE(smart_code, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1') AS extracted_code,
  -- Check if it matches
  REGEXP_REPLACE(smart_code, '^HERA\.PLATFORM\.APP\.ENTITY\.([A-Z0-9]+)\.(v[0-9]+)$', '\1') = entity_code AS does_match
FROM core_entities
WHERE entity_type = 'APP' AND entity_code = 'SALON';
