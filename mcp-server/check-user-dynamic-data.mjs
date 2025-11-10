/**
 * Check if users have dynamic data in tenant organizations
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_ORG_ID = 'de5f248d-7747-44f3-9d11-a279f3158fa5'  // HERA Salon Demo
const PLATFORM_ORG = '00000000-0000-0000-0000-000000000000'

console.log('🔍 CHECKING: User Dynamic Data Patterns')
console.log('='.repeat(80))
console.log('')

async function checkUserDynamicData() {
  // 1. Get all users in the test org
  console.log('📝 Step 1: Get users in HERA Salon Demo...')
  console.log('-'.repeat(80))
  
  const { data: users, error: usersError } = await supabase.rpc('hera_users_list_v1', {
    p_organization_id: TEST_ORG_ID,
    p_limit: 100,
    p_offset: 0
  })
  
  if (usersError) {
    console.error('❌ Failed to get users:', usersError.message)
    return
  }
  
  console.log(`✅ Found ${users.length} user(s)`)
  console.log('')
  
  // 2. Check dynamic data for these users in the TEST org
  console.log('📝 Step 2: Check dynamic data in TENANT org...')
  console.log('-'.repeat(80))
  
  const { data: tenantData, error: tenantError } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', TEST_ORG_ID)
    .in('entity_id', users.map(u => u.id))
  
  if (tenantError) {
    console.error('❌ Failed to query tenant dynamic data:', tenantError.message)
  } else {
    console.log(`   Found ${tenantData?.length || 0} dynamic data records in TENANT org`)
    
    if (tenantData && tenantData.length > 0) {
      console.log('')
      console.log('   📊 Sample Records:')
      tenantData.slice(0, 5).forEach((record, idx) => {
        console.log(`   ${idx + 1}. Field: ${record.field_name}, Type: ${record.field_type}, Value: ${record.field_value_text || record.field_value_number || record.field_value_boolean || 'null'}`)
      })
    }
  }
  console.log('')
  
  // 3. Check dynamic data for these users in PLATFORM org
  console.log('📝 Step 3: Check dynamic data in PLATFORM org...')
  console.log('-'.repeat(80))
  
  const { data: platformData, error: platformError } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', PLATFORM_ORG)
    .in('entity_id', users.map(u => u.id))
  
  if (platformError) {
    console.error('❌ Failed to query platform dynamic data:', platformError.message)
  } else {
    console.log(`   Found ${platformData?.length || 0} dynamic data records in PLATFORM org`)
    
    if (platformData && platformData.length > 0) {
      console.log('')
      console.log('   📊 Sample Records:')
      platformData.slice(0, 5).forEach((record, idx) => {
        console.log(`   ${idx + 1}. Field: ${record.field_name}, Type: ${record.field_type}, Value: ${record.field_value_text || record.field_value_number || record.field_value_boolean || 'null'}`)
      })
    }
  }
  console.log('')
  
  // 4. Check ALL dynamic data for USER entities across all orgs
  console.log('📝 Step 4: Check ALL dynamic data for USER entities...')
  console.log('-'.repeat(80))
  
  const { data: allUserData, error: allError } = await supabase
    .from('core_dynamic_data')
    .select('organization_id, entity_id, field_name, field_type')
    .in('entity_id', users.map(u => u.id))
    .limit(100)
  
  if (allError) {
    console.error('❌ Failed to query all dynamic data:', allError.message)
  } else {
    console.log(`   Found ${allUserData?.length || 0} total dynamic data records for these users`)
    
    if (allUserData && allUserData.length > 0) {
      // Group by organization
      const byOrg = {}
      allUserData.forEach(record => {
        const orgId = record.organization_id
        if (!byOrg[orgId]) byOrg[orgId] = []
        byOrg[orgId].push(record)
      })
      
      console.log('')
      console.log('   📊 Breakdown by Organization:')
      Object.entries(byOrg).forEach(([orgId, records]) => {
        const orgType = orgId === PLATFORM_ORG ? 'PLATFORM' : 
                       orgId === TEST_ORG_ID ? 'TEST (Salon)' : 'OTHER'
        console.log(`   • ${orgType}: ${records.length} records`)
        
        // Show unique field names
        const fieldNames = [...new Set(records.map(r => r.field_name))]
        console.log(`     Fields: ${fieldNames.join(', ')}`)
      })
    }
  }
  console.log('')
  
  // 5. Summary
  console.log('='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log('')
  console.log(`Total users in test org: ${users.length}`)
  console.log(`Dynamic data in TENANT org: ${tenantData?.length || 0}`)
  console.log(`Dynamic data in PLATFORM org: ${platformData?.length || 0}`)
  console.log(`Total dynamic data for these users: ${allUserData?.length || 0}`)
  console.log('')
  
  if ((tenantData?.length || 0) > 0) {
    console.log('✅ FINDING: Users DO have dynamic data in tenant organizations')
    console.log('   → DELETE statement in removal RPC is NEEDED')
  } else {
    console.log('⚠️  FINDING: Users have NO dynamic data in tenant organizations')
    console.log('   → DELETE statement in removal RPC is SAFE but unnecessary')
  }
  console.log('')
}

checkUserDynamicData().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
