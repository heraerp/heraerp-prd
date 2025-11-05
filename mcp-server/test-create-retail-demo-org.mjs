/**
 * Test: Create HERA Retail Demo Organization
 * Parent: HERA ERP Demo
 * Uses: hera_organizations_crud_v1 RPC
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createRetailDemoOrg() {
  console.log('🏢 Creating HERA Retail Demo Organization...')
  console.log('👨‍👧 Parent Org: HERA ERP Demo\n')

  const parentOrgId = process.env.DEFAULT_ORGANIZATION_ID

  // First, get a valid actor user from the platform org
  console.log('🔍 Finding actor user in platform org...')
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

  const payload = {
    organization_name: 'HERA Retail Demo',
    organization_code: 'RETAIL_DEMO',
    organization_type: 'retail',
    industry_classification: 'retail',
    parent_organization_id: parentOrgId,
    status: 'active',
    smart_code: 'HERA.DEMO.ORG.RETAIL.v1',
    settings: {
      is_demo: true,
      demo_type: 'retail',
      parent_org_name: 'HERA ERP Demo',
      created_via: 'mcp_test_script',
      description: 'HERA Retail Demo Organization - Child of HERA ERP Demo'
    }
  }

  console.log('📤 Request Payload:')
  console.log(JSON.stringify({ p_action: 'CREATE', p_actor_user_id: actorUserId, p_payload: payload }, null, 2))
  console.log('\n' + '='.repeat(80) + '\n')

  try {
    const { data, error } = await supabase.rpc('hera_organizations_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_payload: payload
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

    if (data && data.organization && data.organization.id) {
      const org = data.organization

      console.log('\n' + '='.repeat(80))
      console.log('🎯 NEW ORGANIZATION DETAILS:')
      console.log('='.repeat(80))
      console.log('Organization ID:   ' + org.id)
      console.log('Organization Name: ' + org.organization_name)
      console.log('Organization Code: ' + org.organization_code)
      console.log('Parent Org ID:     ' + (org.parent_organization_id || parentOrgId))
      console.log('Industry:          ' + org.industry_classification)
      console.log('Status:            ' + org.status)
      console.log('Smart Code:        ' + (org.smart_code || 'N/A'))
      console.log('='.repeat(80))

      console.log('\n💡 Next Steps:')
      console.log('1. Update .env with: RETAIL_DEMO_ORG_ID=' + org.id)
      console.log('2. Create demo users with hera_onboard_user_v1')
      console.log('3. Test the new auth metadata sync feature')
      console.log('   - Verify auth.users.raw_user_meta_data->hera_user_entity_id is set')
      console.log('   - Verify core_entities.metadata->supabase_user_id is set\n')
    } else if (data && data.organization_id) {
      // Handle alternative response format
      console.log('\n' + '='.repeat(80))
      console.log('🎯 NEW ORGANIZATION DETAILS:')
      console.log('='.repeat(80))
      console.log('Organization ID:   ' + data.organization_id)
      console.log('='.repeat(80))
    }

  } catch (err) {
    console.error('💥 Unexpected Error:', err)
  }
}

createRetailDemoOrg()
