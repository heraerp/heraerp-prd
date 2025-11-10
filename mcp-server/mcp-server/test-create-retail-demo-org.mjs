/**
 * Test: Create HERA Retail Demo Organization
 * Parent: HERA ERP Demo
 * Uses: hera_organizations_crud_v1 RPC
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createRetailDemoOrg() {
  console.log('🏢 Creating HERA Retail Demo Organization...')
  console.log('👨‍👧 Parent Org: HERA ERP Demo\n')

  const parentOrgId = process.env.DEFAULT_ORGANIZATION_ID
  
  // First, get a valid actor user from the parent org
  console.log('🔍 Finding actor user in parent org...')
  const { data: users, error: userError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code')
    .eq('organization_id', '00000000-0000-0000-0000-000000000000')
    .eq('entity_type', 'USER')
    .limit(1)

  if (userError || !users || users.length === 0) {
    console.error('❌ Could not find actor user:', userError)
    return
  }

  const actorUserId = users[0].id
  console.log(`✅ Using actor: ${users[0].entity_name} (${actorUserId})\n`)

  const testData = {
    action: 'CREATE',
    actor_user_id: actorUserId,
    organization: {
      organization_name: 'HERA Retail Demo',
      organization_code: 'RETAIL_DEMO',
      organization_type: 'retail',
      industry: 'retail',
      status: 'active',
      smart_code: 'HERA.DEMO.ORG.RETAIL.v1',
      parent_organization_id: parentOrgId  // Set parent org
    },
    metadata: {
      is_demo: true,
      demo_type: 'retail',
      parent_org_name: 'HERA ERP Demo',
      created_via: 'mcp_test_script',
      description: 'HERA Retail Demo Organization - Child of HERA ERP Demo'
    }
  }

  console.log('📤 Request Payload:')
  console.log(JSON.stringify(testData, null, 2))
  console.log('\n' + '='.repeat(80) + '\n')

  try {
    const { data, error } = await supabase.rpc('hera_organizations_crud_v1', {
      p_action: testData.action,
      p_actor_user_id: testData.actor_user_id,
      p_organization: testData.organization,
      p_metadata: testData.metadata
    })

    if (error) {
      console.error('❌ RPC Error:', error)
      console.error('Error Details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return
    }

    console.log('✅ Organization Created Successfully!\n')
    console.log('📊 Response Data:')
    console.log(JSON.stringify(data, null, 2))

    if (data.organization_id) {
      console.log('\n' + '='.repeat(80))
      console.log('🎯 NEW ORGANIZATION DETAILS:')
      console.log('='.repeat(80))
      console.log(`Organization ID:   ${data.organization_id}`)
      console.log(`Organization Name: ${data.organization?.organization_name || 'HERA Retail Demo'}`)
      console.log(`Organization Code: ${data.organization?.organization_code || 'RETAIL_DEMO'}`)
      console.log(`Parent Org ID:     ${parentOrgId}`)
      console.log(`Industry:          ${data.organization?.industry || 'retail'}`)
      console.log(`Status:            ${data.organization?.status || 'active'}`)
      console.log(`Smart Code:        ${data.organization?.smart_code || 'N/A'}`)
      console.log('='.repeat(80))

      console.log('\n💡 Next Steps:')
      console.log('1. Update .env with: RETAIL_DEMO_ORG_ID=' + data.organization_id)
      console.log('2. Create demo users with hera_onboard_user_v1')
      console.log('3. Test the new auth metadata sync feature\n')
    }

  } catch (err) {
    console.error('💥 Unexpected Error:', err)
  }
}

createRetailDemoOrg()
