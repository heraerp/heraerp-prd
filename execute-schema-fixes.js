#!/usr/bin/env node

/**
 * 🔧 HERA Schema Fix Executor
 * Executes the SQL cleanup script section by section via the SQL Editor API
 */

// Use dynamic import for node-fetch

const API_BASE = 'http://localhost:3002/api/v1/supabase-sql'

async function executeSQLSection(title, query) {
  console.log(`\n🔧 Executing: ${title}`)
  console.log('─'.repeat(50))
  
  try {
    const { default: fetch } = await import('node-fetch')
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'execute',
        query: query,
        readOnly: false  // Allow write operations
      })
    })

    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ SUCCESS: ${result.message || 'Query executed successfully'}`)
      if (result.data && result.data.length > 0) {
        console.log(`📊 Results: ${result.rowCount} rows`)
        // Show first few results
        if (result.data.length <= 5) {
          console.table(result.data)
        } else {
          console.table(result.data.slice(0, 3))
          console.log(`... and ${result.data.length - 3} more rows`)
        }
      }
    } else {
      console.error(`❌ ERROR: ${result.error}`)
      if (result.details) {
        console.error(`📝 Details: ${result.details}`)
      }
    }
    
    return result
  } catch (error) {
    console.error(`💥 FETCH ERROR: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🚀 HERA Schema Fix Execution Started')
  console.log('═'.repeat(70))
  
  // Step 1: Identify duplicate entity codes
  await executeSQLSection(
    "1. Identify Duplicate Entity Codes",
    `SELECT 
      entity_code,
      COUNT(*) as duplicate_count,
      STRING_AGG(entity_name, ', ') as duplicate_names,
      STRING_AGG(entity_id::text, ', ') as entity_ids
    FROM core_entities 
    WHERE entity_code IS NOT NULL 
      AND entity_code != ''
    GROUP BY entity_code, organization_id
    HAVING COUNT(*) > 1
    ORDER BY duplicate_count DESC;`
  )

  // Step 2: Fix duplicate single-letter codes (Dosa example)
  await executeSQLSection(
    "2. Fix Dosa Duplicate Codes",
    `UPDATE core_entities 
    SET entity_code = 'DOSA_' || SUBSTRING(entity_id::text, 1, 8)
    WHERE entity_code = 'D' 
      AND entity_name = 'Dosa'
      AND entity_id != (
        SELECT entity_id 
        FROM core_entities 
        WHERE entity_code = 'D' AND entity_name = 'Dosa' 
        ORDER BY created_at ASC 
        LIMIT 1
      );`
  )

  // Step 3: Fix all other duplicates - keep oldest, update others
  await executeSQLSection(
    "3. Fix All Duplicate Entity Codes",
    `UPDATE core_entities 
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
    );`
  )

  // Step 4: Check for orphaned dynamic data
  await executeSQLSection(
    "4. Check Orphaned Dynamic Data",
    `SELECT 
      dd.dynamic_data_id,
      dd.entity_id,
      dd.field_name,
      dd.field_value,
      'ORPHANED - Entity does not exist' as issue
    FROM core_dynamic_data dd
    LEFT JOIN core_entities e ON dd.entity_id = e.entity_id
    WHERE e.entity_id IS NULL
    LIMIT 10;`
  )

  // Step 5: Flag orphaned dynamic data
  await executeSQLSection(
    "5. Flag Orphaned Dynamic Data",
    `UPDATE core_dynamic_data 
    SET field_name = 'ORPHANED_' || field_name
    WHERE entity_id NOT IN (SELECT entity_id FROM core_entities)
      AND field_name NOT LIKE 'ORPHANED_%';`
  )

  // Step 6: Check orphaned transaction lines
  await executeSQLSection(
    "6. Check Orphaned Transaction Lines",
    `SELECT 
      tl.line_id,
      tl.transaction_id,
      tl.line_type,
      tl.line_total,
      'ORPHANED - Transaction does not exist' as issue
    FROM universal_transaction_lines tl
    LEFT JOIN universal_transactions t ON tl.transaction_id = t.transaction_id
    WHERE t.transaction_id IS NULL
    LIMIT 10;`
  )

  // Step 7: Fix orphaned transaction lines
  await executeSQLSection(
    "7. Flag Orphaned Transaction Lines",
    `UPDATE universal_transaction_lines 
    SET line_type = 'ORPHANED_' || line_type
    WHERE transaction_id NOT IN (SELECT transaction_id FROM universal_transactions)
      AND line_type NOT LIKE 'ORPHANED_%';`
  )

  // Step 8: Check non-standard Smart Codes
  await executeSQLSection(
    "8. Check Non-Standard Smart Codes",
    `SELECT 
      entity_id,
      entity_name,
      smart_code,
      entity_type,
      'Non-standard Smart Code format' as issue,
      'HERA.' || UPPER(entity_type) || '.ENT.STANDARD.v1' as suggested_code
    FROM core_entities
    WHERE smart_code IS NOT NULL 
      AND smart_code NOT LIKE 'HERA.%'
    ORDER BY entity_type, entity_name
    LIMIT 20;`
  )

  // Step 9: Update Smart Codes to HERA format
  await executeSQLSection(
    "9. Update Smart Codes to HERA Format",
    `UPDATE core_entities 
    SET smart_code = 'HERA.' || 
                     CASE 
                       WHEN organization_id = '550e8400-e29b-41d4-a716-446655440000' THEN 'REST'
                       WHEN organization_id = '7aad4cfa-c207-4af6-9564-6da8e9299d42' THEN 'REST'
                       WHEN organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945' THEN 'SYS'
                       ELSE 'GEN'
                     END || '.ENT.' || UPPER(entity_type) || '.v1',
        smart_code_status = 'PROD'
    WHERE smart_code IS NULL 
       OR smart_code = ''
       OR smart_code NOT LIKE 'HERA.%';`
  )

  // Step 10: Validation check - duplicates
  await executeSQLSection(
    "10. Final Validation - Duplicate Check",
    `SELECT 'Duplicate Check' as validation_type, COUNT(*) as issues_found
    FROM (
        SELECT entity_code, organization_id, COUNT(*) as cnt
        FROM core_entities 
        WHERE entity_code IS NOT NULL
        GROUP BY entity_code, organization_id
        HAVING COUNT(*) > 1
    ) duplicates;`
  )

  // Step 11: Validation check - orphaned data
  await executeSQLSection(
    "11. Final Validation - Orphaned Dynamic Data",
    `SELECT 'Orphaned Dynamic Data' as validation_type, COUNT(*) as issues_found
    FROM core_dynamic_data dd
    LEFT JOIN core_entities e ON dd.entity_id = e.entity_id
    WHERE e.entity_id IS NULL;`
  )

  // Step 12: Validation check - Smart Codes
  await executeSQLSection(
    "12. Final Validation - Smart Code Compliance",
    `SELECT 'Non-HERA Smart Codes' as validation_type, COUNT(*) as issues_found
    FROM core_entities
    WHERE smart_code IS NOT NULL 
      AND smart_code NOT LIKE 'HERA.%';`
  )

  // Step 13: Create performance indexes
  await executeSQLSection(
    "13. Create Performance Indexes",
    `CREATE INDEX IF NOT EXISTS idx_core_entities_code_org 
    ON core_entities(entity_code, organization_id) 
    WHERE entity_code IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_core_entities_smart_code 
    ON core_entities(smart_code) 
    WHERE smart_code IS NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_dynamic_data_field_name 
    ON core_dynamic_data(field_name);
    
    CREATE INDEX IF NOT EXISTS idx_transactions_type_date 
    ON universal_transactions(transaction_type, transaction_date);`
  )

  // Step 14: Final data quality report
  await executeSQLSection(
    "14. Final Data Quality Report",
    `SELECT 
      entity_type,
      COUNT(*) as count,
      COUNT(CASE WHEN smart_code LIKE 'HERA.%' THEN 1 END) as with_smart_codes,
      COUNT(CASE WHEN entity_code IS NOT NULL THEN 1 END) as with_entity_codes,
      ROUND(
        COUNT(CASE WHEN smart_code LIKE 'HERA.%' THEN 1 END) * 100.0 / COUNT(*), 
        2
      ) as smart_code_compliance_pct
    FROM core_entities
    GROUP BY entity_type
    ORDER BY count DESC;`
  )

  console.log('\n🎉 HERA Schema Fix Execution Completed!')
  console.log('═'.repeat(70))
  console.log('✅ All validation failures should now be resolved')
  console.log('🔍 Check the SQL Editor Schema Health tab for updated validation results')
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error)
}

module.exports = main