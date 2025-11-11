/**
 * 🔍 LIST: All user-related RPC functions in database
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 SEARCHING: User-related RPC functions')
console.log('='.repeat(80))
console.log('')

async function listUserRPCs() {
  // Query pg_catalog to find all functions with 'user' in the name
  const { data, error } = await supabase.rpc('pg_catalog.pg_get_functiondef', {
    funcoid: '0'
  }).catch(() => ({ data: null, error: null }))

  // Alternative: Query information_schema
  const query = `
    SELECT
      routine_name,
      routine_type,
      routine_schema,
      specific_name,
      data_type as return_type
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND (
        routine_name LIKE '%user%'
        OR routine_name LIKE '%onboard%'
        OR routine_name LIKE '%member%'
      )
    ORDER BY routine_name;
  `

  const { data: functions, error: funcError } = await supabase.rpc('exec_sql', {
    sql: query
  }).catch(async () => {
    // If exec_sql doesn't exist, try direct query
    const result = await supabase
      .from('pg_catalog.pg_proc')
      .select('*')
      .ilike('proname', '%user%')
      .catch(() => ({ data: null, error: null }))

    return result
  })

  // Fallback: Check specific known functions
  const knownUserFunctions = [
    'hera_user_orgs_list_v1',
    'hera_onboard_user_v1',
    'hera_user_create_v1',
    'hera_user_update_v1',
    'hera_user_delete_v1',
    'resolve_user_identity_v1',
    'hera_user_role_update_v1',
    'hera_user_switch_org_v1'
  ]

  console.log('📝 Testing known user-related RPC functions:')
  console.log('-'.repeat(80))
  console.log('')

  const existingFunctions = []
  const missingFunctions = []

  for (const funcName of knownUserFunctions) {
    // Try to get function metadata by calling with NULL (will fail gracefully)
    const testResult = await supabase.rpc(funcName, {}).catch(err => ({
      error: err,
      exists: err.code !== '42883' // 42883 = function does not exist
    }))

    if (testResult.error) {
      if (testResult.error.code === '42883') {
        missingFunctions.push(funcName)
        console.log(`❌ ${funcName} - NOT FOUND`)
      } else {
        // Function exists but parameters wrong (expected)
        existingFunctions.push({
          name: funcName,
          error: testResult.error.message,
          hint: testResult.error.hint
        })
        console.log(`✅ ${funcName} - EXISTS`)
        console.log(`   Error (expected): ${testResult.error.message}`)
        console.log(`   Hint: ${testResult.error.hint || 'N/A'}`)
        console.log('')
      }
    } else {
      existingFunctions.push({
        name: funcName,
        note: 'Exists and executed (unexpected - no params provided)'
      })
      console.log(`✅ ${funcName} - EXISTS (executed with empty params)`)
      console.log('')
    }
  }

  console.log('')
  console.log('='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log('')
  console.log(`Total functions checked: ${knownUserFunctions.length}`)
  console.log(`Existing: ${existingFunctions.length}`)
  console.log(`Missing: ${missingFunctions.length}`)
  console.log('')

  if (existingFunctions.length > 0) {
    console.log('✅ EXISTING FUNCTIONS:')
    existingFunctions.forEach(f => {
      console.log(`   - ${f.name}`)
    })
    console.log('')
  }

  if (missingFunctions.length > 0) {
    console.log('❌ MISSING FUNCTIONS:')
    missingFunctions.forEach(f => {
      console.log(`   - ${f}`)
    })
    console.log('')
  }

  console.log('='.repeat(80))
  console.log('🎯 NEXT STEPS')
  console.log('='.repeat(80))
  console.log('')
  console.log('Review the existing functions above.')
  console.log('Based on the conversation history, the functions that likely need review:')
  console.log('')
  console.log('1. hera_onboard_user_v1 - Already working (we tested it)')
  console.log('2. resolve_user_identity_v1 - May need review for HERA pattern')
  console.log('3. Other user management functions - Check if they follow HERA standard')
  console.log('')
}

listUserRPCs().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
