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
  // Known user functions to check
  const knownUserFunctions = [
    { name: 'hera_user_orgs_list_v1', status: '✅ TESTED - Working' },
    { name: 'hera_onboard_user_v1', status: '✅ TESTED - Working' },
    { name: 'resolve_user_identity_v1', status: '❓ Unknown - Needs review' },
    { name: 'hera_user_create_v1', status: '❓ Unknown' },
    { name: 'hera_user_update_v1', status: '❓ Unknown' },
    { name: 'hera_user_delete_v1', status: '❓ Unknown' },
    { name: 'hera_user_role_update_v1', status: '❓ Unknown' },
    { name: 'hera_user_switch_org_v1', status: '❓ Unknown' }
  ]

  console.log('📝 Checking known user-related RPC functions:')
  console.log('-'.repeat(80))
  console.log('')

  const existingFunctions = []
  const missingFunctions = []

  for (const func of knownUserFunctions) {
    try {
      // Try to call with empty object - will fail but tells us if function exists
      await supabase.rpc(func.name, {})
      existingFunctions.push(func)
      console.log(`✅ ${func.name}`)
      console.log(`   Status: ${func.status}`)
      console.log('')
    } catch (err) {
      if (err.code === '42883') {
        // Function does not exist
        missingFunctions.push(func)
        console.log(`❌ ${func.name} - NOT FOUND`)
        console.log('')
      } else {
        // Function exists but parameters wrong (this is expected)
        existingFunctions.push(func)
        console.log(`✅ ${func.name}`)
        console.log(`   Status: ${func.status}`)
        console.log(`   Note: ${err.message.substring(0, 80)}...`)
        console.log('')
      }
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
      console.log(`   ${f.status.includes('TESTED') ? '🎯' : '❓'} ${f.name} - ${f.status}`)
    })
    console.log('')
  }

  if (missingFunctions.length > 0) {
    console.log('❌ MISSING FUNCTIONS:')
    missingFunctions.forEach(f => {
      console.log(`   - ${f.name}`)
    })
    console.log('')
  }

  console.log('='.repeat(80))
  console.log('🎯 RECOMMENDED NEXT STEPS')
  console.log('='.repeat(80))
  console.log('')
  console.log('Based on the HERA pattern work we just completed:')
  console.log('')
  console.log('Priority 1: resolve_user_identity_v1')
  console.log('   - Used by API v2 auth pipeline')
  console.log('   - Should follow MEMBER_OF + HAS_ROLE pattern')
  console.log('   - Needs review for HERA compliance')
  console.log('')
  console.log('Priority 2: hera_user_switch_org_v1')
  console.log('   - Likely needs to update last_accessed in MEMBER_OF')
  console.log('   - Should respect HAS_ROLE for permissions')
  console.log('')
  console.log('Priority 3: hera_user_role_update_v1')
  console.log('   - Must update HAS_ROLE relationship (not MEMBER_OF)')
  console.log('   - Critical for HERA pattern compliance')
  console.log('')
}

listUserRPCs().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
