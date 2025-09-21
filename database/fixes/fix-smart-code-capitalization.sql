-- HERA Smart Code Fix: Normalize uppercase .V to lowercase .v
-- This fixes any existing smart codes that incorrectly use .V instead of .v
-- HERA guardrail pattern requires: ^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$

-- 1) Fix core_entities smart codes
UPDATE core_entities
SET smart_code = regexp_replace(smart_code, '\.V([0-9]+)$', '.v\1')
WHERE smart_code ~ '\.V[0-9]+$';

-- 2) Fix core_dynamic_data smart codes
UPDATE core_dynamic_data
SET smart_code = regexp_replace(smart_code, '\.V([0-9]+)$', '.v\1')
WHERE smart_code ~ '\.V[0-9]+$';

-- 3) Fix core_relationships smart codes
UPDATE core_relationships
SET smart_code = regexp_replace(smart_code, '\.V([0-9]+)$', '.v\1')
WHERE smart_code ~ '\.V[0-9]+$';

-- 4) Fix universal_transactions smart codes
UPDATE universal_transactions
SET smart_code = regexp_replace(smart_code, '\.V([0-9]+)$', '.v\1')
WHERE smart_code ~ '\.V[0-9]+$';

-- 5) Fix universal_transaction_lines smart codes
UPDATE universal_transaction_lines
SET smart_code = regexp_replace(smart_code, '\.V([0-9]+)$', '.v\1')
WHERE smart_code ~ '\.V[0-9]+$';

-- Sanity check: Show any remaining uppercase .V patterns
SELECT 'core_entities' as table_name, count(*) as count, string_agg(smart_code, ', ') as examples
FROM core_entities 
WHERE smart_code ~ '\.V[0-9]+$'
GROUP BY 1

UNION ALL

SELECT 'core_dynamic_data' as table_name, count(*) as count, string_agg(smart_code, ', ') as examples
FROM core_dynamic_data 
WHERE smart_code ~ '\.V[0-9]+$'
GROUP BY 1

UNION ALL

SELECT 'core_relationships' as table_name, count(*) as count, string_agg(smart_code, ', ') as examples
FROM core_relationships 
WHERE smart_code ~ '\.V[0-9]+$'
GROUP BY 1

UNION ALL

SELECT 'universal_transactions' as table_name, count(*) as count, string_agg(smart_code, ', ') as examples
FROM universal_transactions 
WHERE smart_code ~ '\.V[0-9]+$'
GROUP BY 1

UNION ALL

SELECT 'universal_transaction_lines' as table_name, count(*) as count, string_agg(smart_code, ', ') as examples
FROM universal_transaction_lines 
WHERE smart_code ~ '\.V[0-9]+$'
GROUP BY 1;

-- Final check: Validate all smart codes match the pattern
WITH invalid_codes AS (
  SELECT 'core_entities' as table_name, smart_code
  FROM core_entities 
  WHERE smart_code IS NOT NULL 
    AND smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
  
  UNION ALL
  
  SELECT 'core_dynamic_data' as table_name, smart_code
  FROM core_dynamic_data 
  WHERE smart_code IS NOT NULL 
    AND smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
  
  UNION ALL
  
  SELECT 'core_relationships' as table_name, smart_code
  FROM core_relationships 
  WHERE smart_code IS NOT NULL 
    AND smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
  
  UNION ALL
  
  SELECT 'universal_transactions' as table_name, smart_code
  FROM universal_transactions 
  WHERE smart_code IS NOT NULL 
    AND smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
  
  UNION ALL
  
  SELECT 'universal_transaction_lines' as table_name, smart_code
  FROM universal_transaction_lines 
  WHERE smart_code IS NOT NULL 
    AND smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
)
SELECT table_name, count(*) as invalid_count, string_agg(smart_code, ', ' ORDER BY smart_code) as examples
FROM invalid_codes
GROUP BY table_name
ORDER BY table_name;