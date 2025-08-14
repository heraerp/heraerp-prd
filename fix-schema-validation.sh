#!/bin/bash

# 🔧 HERA Schema Fix Script
# Executes SQL fixes via the Supabase SQL Editor API

API_BASE="http://localhost:3002/api/v1/supabase-sql"

execute_sql() {
    local title="$1"
    local query="$2"
    
    echo ""
    echo "🔧 Executing: $title"
    echo "─────────────────────────────────────────────────────────"
    
    response=$(curl -s -X POST "$API_BASE" \
        -H "Content-Type: application/json" \
        -d "{\"action\":\"execute\",\"query\":$(echo "$query" | jq -R -s .),\"readOnly\":false}")
    
    success=$(echo "$response" | jq -r '.success // false')
    
    if [ "$success" = "true" ]; then
        echo "✅ SUCCESS"
        row_count=$(echo "$response" | jq -r '.rowCount // 0')
        if [ "$row_count" -gt 0 ]; then
            echo "📊 Results: $row_count rows"
            echo "$response" | jq -r '.data // [] | if length > 5 then .[0:3] else . end'
        fi
    else
        echo "❌ ERROR"
        echo "$response" | jq -r '.error // "Unknown error"'
    fi
}

echo "🚀 HERA Schema Fix Execution Started"
echo "════════════════════════════════════════════════════════════════════"

# Step 1: Check duplicate entity codes
execute_sql "1. Check Duplicate Entity Codes" "
SELECT 
  entity_code,
  COUNT(*) as duplicate_count,
  STRING_AGG(entity_name, ', ') as duplicate_names
FROM core_entities 
WHERE entity_code IS NOT NULL 
  AND entity_code != ''
GROUP BY entity_code, organization_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;"

# Step 2: Fix duplicates - keep oldest, update others
execute_sql "2. Fix Duplicate Entity Codes" "
UPDATE core_entities 
SET entity_code = entity_code || '_' || SUBSTRING(entity_id::text, 1, 6)
WHERE entity_code IN (
  SELECT entity_code 
  FROM core_entities 
  WHERE entity_code IS NOT NULL 
  GROUP BY entity_code, organization_id 
  HAVING COUNT(*) > 1
)
AND entity_id NOT IN (
  SELECT MIN(entity_id) 
  FROM core_entities 
  WHERE entity_code IS NOT NULL 
  GROUP BY entity_code, organization_id 
  HAVING COUNT(*) > 1
);"

# Step 3: Fix Smart Codes
execute_sql "3. Update Smart Codes to HERA Format" "
UPDATE core_entities 
SET smart_code = 'HERA.' || 
                 CASE 
                   WHEN organization_id = '550e8400-e29b-41d4-a716-446655440000' THEN 'REST'
                   WHEN organization_id = '7aad4cfa-c207-4af6-9564-6da8e9299d42' THEN 'REST'
                   WHEN organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945' THEN 'SYS'
                   ELSE 'GEN'
                 END || '.ENT.' || UPPER(entity_type) || '.v1'
WHERE smart_code IS NULL 
   OR smart_code = ''
   OR smart_code NOT LIKE 'HERA.%';"

# Step 4: Final validation - duplicates
execute_sql "4. Final Validation - Duplicate Check" "
SELECT 'Duplicate Check' as validation_type, COUNT(*) as issues_found
FROM (
    SELECT entity_code, organization_id, COUNT(*) as cnt
    FROM core_entities 
    WHERE entity_code IS NOT NULL
    GROUP BY entity_code, organization_id
    HAVING COUNT(*) > 1
) duplicates;"

# Step 5: Final validation - Smart Code compliance
execute_sql "5. Final Validation - Smart Code Compliance" "
SELECT 'Non-HERA Smart Codes' as validation_type, COUNT(*) as issues_found
FROM core_entities
WHERE smart_code IS NOT NULL 
  AND smart_code NOT LIKE 'HERA.%';"

# Step 6: Data quality summary
execute_sql "6. Data Quality Summary" "
SELECT 
  entity_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN smart_code LIKE 'HERA.%' THEN 1 END) as compliant_smart_codes,
  ROUND(
    COUNT(CASE WHEN smart_code LIKE 'HERA.%' THEN 1 END) * 100.0 / COUNT(*), 
    1
  ) as compliance_pct
FROM core_entities
GROUP BY entity_type
ORDER BY total_count DESC;"

echo ""
echo "🎉 HERA Schema Fix Execution Completed!"
echo "════════════════════════════════════════════════════════════════════"
echo "✅ All validation failures should now be resolved"
echo "🔍 Visit http://localhost:3002/supabase-sql → Schema Health tab for updated results"