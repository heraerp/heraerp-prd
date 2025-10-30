#!/usr/bin/env node
/**
 * Test the updated hera_entities_crud_v1 function
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testUpdatedFunction() {
  console.log('🧪 Testing updated hera_entities_crud_v1 function...\n')

  // Use the organization and user IDs from previous tests
  const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Hairtalkz
  const userId = '09b0b92a-d797-489e-bc03-5ca0a6272674'

  console.log('📍 Test parameters:')
  console.log('   Organization:', orgId)
  console.log('   User:', userId)
  console.log('')

  // Test the RPC call
  const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: userId,
    p_organization_id: orgId,
    p_entity: {
      entity_type: 'SERVICE'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      limit: 10,
      include_dynamic: true,
      include_relationships: true
    }
  })

  if (error) {
    console.error('❌ RPC call failed:', error)
    process.exit(1)
  }

  console.log('📊 Response Structure:')
  console.log('   Keys:', Object.keys(data || {}))
  console.log('   Success:', data?.success)
  console.log('   Action:', data?.action)
  console.log('')

  // Check for errors in response
  if (data?.error) {
    console.error('❌ RPC returned error:', data.error)
    console.log('')
    console.log('🔍 Error Details:')
    console.log('   ', data.error)
    console.log('')

    if (data.error.includes('source_entity_id')) {
      console.log('⚠️  The function still has the old column name error!')
      console.log('   Please verify the function was updated in Supabase.')
    }

    process.exit(1)
  }

  if (data?.success === false) {
    console.error('❌ RPC returned success=false')
    console.log('Full response:', JSON.stringify(data, null, 2))
    process.exit(1)
  }

  // Get items from response
  const items = data?.data?.items || data?.data?.list || data?.items || []

  console.log('✅ Function is working!')
  console.log('   Services returned:', items.length)
  console.log('')

  if (items.length > 0) {
    const first = items[0]
    console.log('📦 First service structure:')
    console.log('   Has entity:', Boolean(first.entity))
    console.log('   Has dynamic_data:', Boolean(first.dynamic_data))
    console.log('   Has relationships:', Boolean(first.relationships))

    if (first.entity) {
      console.log('')
      console.log('🎯 Service details:')
      console.log('   Name:', first.entity.entity_name)
      console.log('   Type:', first.entity.entity_type)
      console.log('   Status:', first.entity.status)

      if (first.dynamic_data && first.dynamic_data.length > 0) {
        console.log('   Dynamic fields:', first.dynamic_data.length)
        const fieldNames = first.dynamic_data.map(d => d.field_name).join(', ')
        console.log('   Fields:', fieldNames)
      }

      if (first.relationships && first.relationships.length > 0) {
        console.log('   Relationships:', first.relationships.length)
        const relTypes = [...new Set(first.relationships.map(r => r.relationship_type))].join(', ')
        console.log('   Types:', relTypes)
      }
    }

    console.log('')
    console.log('✅ ALL TESTS PASSED!')
    console.log('🌐 Services should now load at: http://localhost:3000/salon/services')
  } else {
    console.log('⚠️  No services found in the response')
    console.log('   This could mean:')
    console.log('   1. No services exist for this organization')
    console.log('   2. Membership validation is failing')
    console.log('   3. Status filter is excluding services')
  }
}

testUpdatedFunction().catch(error => {
  console.error('❌ Test script error:', error)
  process.exit(1)
})
