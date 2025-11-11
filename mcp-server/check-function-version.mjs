/**
 * Check if hera_users_list_v1 has been updated to use MEMBER_OF
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 CHECKING: hera_users_list_v1 function definition')
console.log('='.repeat(80))
console.log('')

async function checkFunctionDefinition() {
  // Get function definition from pg_proc
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = 'hera_users_list_v1'
      LIMIT 1;
    `
  }).catch(() => {
    return { data: null, error: { message: 'exec_sql not available' } }
  })

  if (error || !data || data.length === 0) {
    console.log('❌ Cannot retrieve function definition')
    console.log('')
    console.log('Checking if function uses correct relationship type...')
    
    // Alternative: Try calling the function and check the SQL it uses
    const { error: testError } = await supabase.rpc('hera_users_list_v1', {
      p_organization_id: 'de5f248d-7747-44f3-9d11-a279f3158fa5',
      p_limit: 1,
      p_offset: 0
    })
    
    if (testError) {
      console.log('')
      console.log('Error details:', testError.message)
      
      if (testError.message.includes('USER_MEMBER_OF_ORG')) {
        console.log('')
        console.log('🚨 FUNCTION STILL USES OLD RELATIONSHIP TYPE!')
        console.log('   Found: USER_MEMBER_OF_ORG (WRONG)')
        console.log('   Should be: MEMBER_OF (CORRECT)')
        console.log('')
        console.log('❌ fix-hera-users-list-v1.sql HAS NOT BEEN DEPLOYED')
        return false
      }
    }
    
    console.log('')
    console.log('⚠️  Function exists but cannot determine if fix is deployed')
    console.log('')
    console.log('Please deploy: /mcp-server/fix-hera-users-list-v1.sql')
    return false
  }

  const definition = data[0].definition
  
  console.log('✅ Function definition retrieved')
  console.log('')
  
  // Check for key indicators
  const usesMemberOf = definition.includes("'MEMBER_OF'")
  const usesOldRelType = definition.includes("'USER_MEMBER_OF_ORG'")
  const usesHasRole = definition.includes("'HAS_ROLE'")
  const usesDynamicData = definition.includes('core_dynamic_data')
  
  console.log('📊 ANALYSIS:')
  console.log('-'.repeat(80))
  console.log('')
  
  if (usesMemberOf) {
    console.log('✅ Uses MEMBER_OF relationship (CORRECT)')
  } else {
    console.log('❌ Does NOT use MEMBER_OF relationship')
  }
  
  if (usesOldRelType) {
    console.log('❌ Still uses USER_MEMBER_OF_ORG (OLD/WRONG)')
  } else {
    console.log('✅ Does NOT use USER_MEMBER_OF_ORG (GOOD)')
  }
  
  if (usesHasRole) {
    console.log('✅ Uses HAS_ROLE for role lookup (CORRECT)')
  } else {
    console.log('❌ Does NOT use HAS_ROLE for role lookup')
  }
  
  if (usesDynamicData) {
    console.log('❌ Still uses core_dynamic_data for role (OLD/WRONG)')
  } else {
    console.log('✅ Does NOT use core_dynamic_data (GOOD)')
  }
  
  console.log('')
  
  if (usesMemberOf && !usesOldRelType && usesHasRole && !usesDynamicData) {
    console.log('🎉 FUNCTION IS CORRECTLY UPDATED!')
    console.log('')
    console.log('The fix-hera-users-list-v1.sql has been deployed successfully.')
    return true
  } else {
    console.log('🚨 FUNCTION NEEDS TO BE UPDATED!')
    console.log('')
    console.log('Please deploy: /mcp-server/fix-hera-users-list-v1.sql')
    return false
  }
}

checkFunctionDefinition().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
